/**
 * 会员专区页面
 * 融合三大功能：AI 宠物聊天、照片心声解读、智能健康分析
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle, Send, Mic, PawPrint, Heart,
  Image, Images, Loader2, X, ChevronDown,
  Camera, Settings, Zap, Sparkles
} from "lucide-react";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { PetPhotoUploader, type PhotoUploadResult } from "../components/PetPhotoUploader";
import { PhotoAnalysisOverlay } from "../components/PetChat/PhotoAnalysisOverlay";
import { PhotoMindResultCard } from "../components/PetChat/PhotoMindResult";
import { useShell } from "../hooks/useShell";
import { getLocalAvatar, isNameCircleMarker } from "../lib/pet-avatar";
import PetNameCircle from "../components/PetNameCircle";
import {
  fetchPhotoMind,
  chatWithPet,
} from "../lib/pet-mind.api";
import {
  EMOTION_EMOJIS,
  EMOTION_LABELS,
  EMOTION_COLORS,
  generateInteractionSuggestions,
  inferPersonality
} from "../lib/pet-prompt";
import {
  getOrCreateMemoryContext,
  destroyMemoryContext,
  type PetMemoryContext,
  type StoredChatMessage
} from "../lib/pet-memory-context";
import type {
  Pet, ChatMessage as BaseChatMessage, MessageSource,
  PhotoMindResult, PetEmotion,
  TriggerType
} from "../types";
import { petTtsEngine, toTtsSpecies } from "../lib/pet-tts-engine";


// ============================================================
// Voice Tab 模式类型
// ============================================================

interface ChatMessage extends BaseChatMessage {
  source: MessageSource;
  // 照片心声
  photoMind?: PhotoMindResult;
  photoUrl?: string;
}


// ============================================================
// 功能快捷入口配置
// ============================================================

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  gradient: string;
  iconBg: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "camera-mind",
    icon: Camera,
    label: "拍照解读",
    color: "#5BA88C",
    gradient: "linear-gradient(135deg, #5BA88C, #7EC4A8)",
    iconBg: "linear-gradient(145deg, #E5F4EF, #D0EBE1)",
    description: "拍一张，让 AI 读懂毛孩子的心思"
  },
  {
    id: "photo-mind",
    icon: Images,
    label: "选图解读",
    color: "#D4A574",
    gradient: "linear-gradient(135deg, #D4A574, #E8C49A)",
    iconBg: "linear-gradient(145deg, #FDF2EC, #F9E3D4)",
    description: "选一张图，让 AI 读懂毛孩子的心思"
  },
  {
    id: "ai-analysis",
    icon: Sparkles,
    label: "AI分析",
    color: "#667eea",
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    iconBg: "linear-gradient(145deg, #EEF0FE, #D8DDFC)",
    description: "全方位 AI 智能健康分析报告"
  },
];

// ============================================================
// 宠物实时情绪状态（模拟数据）
// ============================================================

interface PetMoodState {
  emoji: string;
  label: string;
  description: string;
  color: string;
}

const PET_MOOD_STATES: PetMoodState[] = [
  { emoji: "😊", label: "开心", description: "今天心情超棒~", color: "#4ADE80" },
  { emoji: "😴", label: "困困", description: "想睡觉觉...", color: "#A78BFA" },
  { emoji: "🤔", label: "好奇", description: "在观察什么？", color: "#FBBF24" },
  { emoji: "💕", label: "粘人", description: "想被主人抱抱", color: "#FB7185" },
  { emoji: "😋", label: "饿了", description: "罐罐时间到！", color: "#FB923C" },
];

// ============================================================
// 功能 Tab
// ============================================================

type ChatTab = "chat" | "photo";

const TAB_CONFIG = {
  chat: { icon: MessageCircle, label: "聊天", color: "#D4A574" },
  photo: { icon: Image, label: "照片心声", color: "#9B7EDE" },
} as const;

// ============================================================
// 模拟数据
// ============================================================

const mockChats: ChatMessage[] = [
  { id: 1, type: "human", text: "宝贝，今天想吃什么口味的罐头呀？", emoji: "😊", time: "09:30", source: "human" },
  { id: 2, type: "pet", text: "汪汪汪！想吃鸡肉味的！还要出去玩！", emoji: "🐕", time: "09:31", source: "pet" },
  { id: 3, type: "human", text: "好好好，吃完带你去公园跑跑~", emoji: "🤗", time: "09:32", source: "human" },
  { id: 4, type: "pet", text: "太棒了！我最喜欢在草地上打滚了！", emoji: "🐾", time: "09:33", source: "pet" },
];

// ============================================================
// 主组件
// ============================================================

export default function PetChat() {
  const navigate = useNavigate();
  const { selectedPet } = useShell();
  
  // 状态
  const [messages, setMessages] = useState<ChatMessage[]>(mockChats);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<ChatTab>("chat");
  const [isVoiceInputting, setIsVoiceInputting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  
  // 新增：实时情绪状态 + 设置面板
  const [currentMood, setCurrentMood] = useState<PetMoodState>(PET_MOOD_STATES[0]);
  const [showSettings, setShowSettings] = useState(false);
  
  // 照片心声状态
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  
  // 分析中 Loading 状态（用于显示分析覆盖层）
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [analyzingPhotoUrl, setAnalyzingPhotoUrl] = useState<string>("");

  // ============================================================
  // 分区结果列表（各功能独立存储，不混入聊天消息）
  // ============================================================
  
  /** 照片心声结果列表 */
  const [photoResults, setPhotoResults] = useState<Array<{
    id: number;
    result: PhotoMindResult;
    photoUrl: string;
    time: string;
  }>>([]);

  // 长期记忆上下文
  const [memoryContext, setMemoryContext] = useState<PetMemoryContext | null>(null);
  const [petProfile, setPetProfile] = useState<any>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickCameraRef = useRef<HTMLInputElement>(null);
  const quickGalleryRef = useRef<HTMLInputElement>(null);

  // 快捷入口：直接触发相机/相册（跳过中间弹窗）
  const handleQuickCameraChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setActiveTab("photo");
    setShowPhotoUploader(false);
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    await handlePhotoUpload({ file, dataUrl, base64: dataUrl.split(',')[1] || '', mimeType: file.type, fileSize: file.size });
  }, []);

  const handleQuickGalleryChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setActiveTab("photo");
    setShowPhotoUploader(false);
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    await handlePhotoUpload({ file, dataUrl, base64: dataUrl.split(',')[1] || '', mimeType: file.type, fileSize: file.size });
  }, []);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // ============================================================
  // 初始化长期记忆上下文
  // ============================================================

  useEffect(() => {
    if (!selectedPet) return;

    // 1. 创建/获取记忆上下文
    const ctx = getOrCreateMemoryContext(selectedPet.id, {
      maxMessages: 500,
      autoSaveInterval: 3000,   // 3 秒自动保存
      enableAnalytics: true
    });
    setMemoryContext(ctx);

    // 2. 从存储恢复消息（如果有）
    const savedMessages = ctx.getMessages();
    if (savedMessages.length > 0) {
      setMessages(savedMessages as any[]);
    // 已从本地存储恢复消息
    }

    // 3. 记录页面打开事件
    ctx.recordEvent({ type: "page_opened", details: { page: "chat" } });

    // 4. 构建宠物状态画像
    const personality = inferPersonality(selectedPet.species, selectedPet.breed);
    const profile = ctx.buildProfile(selectedPet, personality);
    setPetProfile(profile);

    return () => {
      // 清理：保存数据 + 销毁实例
      ctx.saveToStorage();
      destroyMemoryContext(selectedPet.id);
    };
  }, [selectedPet]);
  
  // ============================================================
  // 聊天功能
  // ============================================================
  
  /** 语音输入 */
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("您的浏览器不支持语音识别功能");
      return;
    }
    
    if (isVoiceInputting) {
      setIsVoiceInputting(false);
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";
    
    recognition.onstart = () => setIsVoiceInputting(true);
    
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };
    
    recognition.onerror = () => setIsVoiceInputting(false);
    recognition.onend = () => setIsVoiceInputting(false);
    
    recognition.start();
  };
  
  /** 发送消息 - 调用后端 AI 聊天接口 */
  const handleSend = async () => {
    if (!inputText.trim() || !selectedPet) return;
    
    const userMsg: ChatMessage = {
      id: Date.now(),
      type: "human",
      text: inputText,
      emoji: "😊",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      source: "human",
    };
    
    setMessages(prev => [...prev, userMsg]);
    const msgText = inputText;
    setInputText("");
    
    // 记录到记忆系统
    memoryContext?.addMessage(userMsg as any);

    // 调用后端聊天接口
    setIsLoading(true);
    setLoadingText("正在思考...");
    
    try {
      const result = await chatWithPet(selectedPet.id, msgText);
      
      if (result.success && result.reply) {
        const petMsg: ChatMessage = {
          id: Date.now() + 1,
          type: "pet",
          text: result.reply,
          emoji: result.emoji || "🐾",
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          source: "pet",
        };
        setMessages((prev) => [...prev, petMsg]);
        memoryContext?.addMessage(petMsg as any);
      } else {
        // 后端失败时使用本地兜底
        console.warn("[Chat] 后端返回失败，使用兜底回复:", result.error);
        addFallbackReply(msgText);
      }
    } catch (error) {
      console.error("[Chat] 聊天异常:", error);
      addFallbackReply(msgText);
    } finally {
      setIsLoading(false);
    }
  };

  /** 兜底回复（后端不可用时使用） */
  const addFallbackReply = (userMsg: string) => {
    setTimeout(() => {
      const petReplies = [
        { text: "汪汪！听懂了，我会乖乖的！", emoji: "🐕" },
        { text: "喵~ 主人真好，我爱你！", emoji: "💕" },
        { text: "摇尾巴！好开心呀~", emoji: "🐾" },
        { text: "汪汪汪！真的吗？太好了！", emoji: "🎉" },
      ];
      const reply = petReplies[Math.floor(Math.random() * petReplies.length)];
      const petMsg: ChatMessage = {
        id: Date.now() + 1,
        type: "pet",
        text: reply.text,
        emoji: reply.emoji,
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        source: "pet",
      };
      setMessages((prev) => [...prev, petMsg]);
      memoryContext?.addMessage(petMsg as any);
    }, 500);
  };
  
  // ============================================================
  // 照片心声功能
  // ============================================================
  
  /** 处理照片上传（接收完整 PhotoUploadResult） */
  const handlePhotoUpload = async (uploadResult: PhotoUploadResult) => {
    if (!selectedPet) return;
    
    const { file } = uploadResult;
    
    // 1. 开始分析：显示 Loading 覆盖层 + 设置照片 URL
    setIsAnalyzing(true);
    setAnalysisStep(1); // 第一步：分析表情
    setAnalyzingPhotoUrl(uploadResult.dataUrl);
    setLoadingText("正在分析照片...");
    
    try {
      // 模拟步骤进度推进（配合 API 的 onProgress 回调）
      // 实际项目中这些步骤由 API onProgress 驱动，这里做演示用
      
      // 步骤 1 → 2 过渡（约 1.2s 后）
      setTimeout(() => setAnalysisStep(2), 1200); // 理解情绪
      
      // 步骤 2 → 3 过渡（约 2.7s 后）
      setTimeout(() => setAnalysisStep(3), 2700); // 生成内心 OS

      // 2. 调用 AI 分析 API
      const result = await fetchPhotoMind({
        pet: selectedPet,
        imageFile: file,
        onProgress: (status) => {
          setLoadingText(status);
          // 根据 status 文本自动推断当前步骤
          if (status.includes("理解") || status.includes("分析")) {
            setAnalysisStep(2);
          } else if (status.includes("生成") || status.includes("心声")) {
            setAnalysisStep(3);
          }
        },
      });
      
      // 3. 关闭分析覆盖层
      setIsAnalyzing(false);
      setAnalysisStep(1);
      
      if (result.success && result.result) {
        // 4. 添加到照片结果列表（分区显示，不混入聊天消息）
        const photoItem = {
          id: Date.now(),
          result: result.result,
          photoUrl: result.photoUrl || "",
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        };
        setPhotoResults((prev) => [photoItem, ...prev]);

        // 记录到记忆系统
        memoryContext?.recordEvent({ type: "photo_uploaded", details: { hasResult: true } });

        // 关闭上传面板（保留面板可见以查看结果）
        setShowPhotoUploader(false);
      } else {
        // API 返回失败，给用户明确提示
        const errMsg = result.error || "照片分析失败，请检查网络后重试";
        console.error("[PhotoMind] 分析失败:", errMsg);
        alert(`照片心声解读失败：${errMsg}`);
      }
    } catch (error) {
      console.error("照片心声生成失败:", error);
      setIsAnalyzing(false);
      setAnalysisStep(1);
      alert("照片心声解读异常，请检查网络连接后重试");
    }
  };
  
  // ============================================================
  // 人类消息翻译成宠物语言
  // ============================================================
  
  const handleTranslateToPet = useCallback((msgId: number, text: string) => {
    // 兼容中英文品种标识
    const speciesLower = (selectedPet?.species || "").toLowerCase();
    const isCat = speciesLower === "猫" || speciesLower === "cat";
    
    // 翻译规则
    const translateTextToPet = (input: string): string => {
      const lowerText = input.toLowerCase();
      
      // 根据关键词选择叫声
      if (lowerText.includes("吃") || lowerText.includes("饿") || lowerText.includes("饭") || lowerText.includes("罐头")) {
        return isCat ? "喵呜~喵呜~" : "汪汪汪！汪汪！";
      }
      if (lowerText.includes("玩") || lowerText.includes("出去") || lowerText.includes("公园") || lowerText.includes("散步")) {
        return isCat ? "喵~喵呜~" : "汪！汪汪！出去玩！";
      }
      if (lowerText.includes("爱") || lowerText.includes("喜欢") || lowerText.includes("乖") || lowerText.includes("宝贝")) {
        return isCat ? "呼噜~呼噜~" : "摇尾巴！舔舔！";
      }
      if (lowerText.includes("睡") || lowerText.includes("困") || lowerText.includes("晚安")) {
        return isCat ? "嗯~zzZ" : "呵欠...困了...";
      }
      if (lowerText.includes("生气") || lowerText.includes("不要") || lowerText.includes("不行")) {
        return isCat ? "嘶~！" : "汪！汪呜！";
      }
      if (lowerText.includes("好") || lowerText.includes("棒") || lowerText.includes("厉害")) {
        return isCat ? "喵~" : "汪汪！";
      }
      
      // 默认生成叫声
      const wordCount = input.length;
      const barkCount = Math.min(Math.max(1, Math.ceil(wordCount / 4)), 5);
      
      const dogBarks = ["汪", "汪汪", "呜", "嗷呜"];
      const catMeows = ["喵", "喵呜", "喵~"];
      
      const barks = isCat ? catMeows : dogBarks;
      let result = "";
      for (let i = 0; i < barkCount; i++) {
        result += barks[Math.floor(Math.random() * barks.length)];
        if (i < barkCount - 1) result += i < 2 ? "，" : "";
      }
      return result + "！";
    };
    
    // 生成翻译后的宠物语言
    const translated = translateTextToPet(text);
    
    // 添加翻译结果消息（宠物语言）
    const petSoundMsg: ChatMessage = {
      id: Date.now(),
      type: "pet_translate",
      text: translated,
      emoji: isCat ? "😺" : "🐕",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      source: "pet_translate",
    };
    
    setMessages((prev) => [...prev, petSoundMsg]);
    
    // 记录到记忆系统
    memoryContext?.addMessage(petSoundMsg as StoredChatMessage);
  }, [selectedPet]);
  
  // ============================================================
  // 渲染
  // ============================================================
  
  return (
    <main className="chat-page">
      {/* 顶部装饰 */}
      <div className="chat-top-deco">
        <div className="chat-top-orb chat-orb-1" />
        <div className="chat-top-orb chat-orb-2" />
      </div>
      
      {/* ====== 新 Header 区域 ====== */}
      <header className="chat-header">
        {/* 背景渐变层 */}
        <div className="chat-header-bg">
          <div className="chat-header-gradient" />
        </div>
        
        <div className="chat-header-inner">
          {/* 左侧：宠物头像区域 */}
          <div className="chat-avatar-wrap">
            <div className="chat-avatar">
              {selectedPet?.image_url || getLocalAvatar(selectedPet?.id ?? 0) ? (
                <img
                  src={selectedPet?.image_url || getLocalAvatar(selectedPet?.id ?? 0)}
                  alt={selectedPet?.name || "宠物头像"}
                  className="chat-pet-avatar-img"
                />
              ) : selectedPet ? (
                <div className="chat-pet-avatar-fallback">
                  {selectedPet._resolved_avatar_url && selectedPet._resolved_avatar_url !== "__name_circle__" ? (
                    <img
                      src={selectedPet._resolved_avatar_url}
                      alt={selectedPet.name}
                      className="chat-pet-avatar-img"
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <PetNameCircle name={selectedPet.name} size={56} />
                  )}
                </div>
              ) : (
                <span className="chat-pet-emoji">🐾</span>
              )}
            </div>
            <div className="chat-avatar-ring" />
            <div className="chat-avatar-glow" />
            {/* 浮动 emoji 特效 */}
            <span className="chat-float-ele chat-fe-1">💕</span>
            <span className="chat-float-ele chat-fe-2">✨</span>
            <span className="chat-float-ele chat-fe-3">🐾</span>
            <span className="chat-float-ele chat-fe-4">💖</span>
          </div>

          {/* 中间：宠物名称 + 副标题 + 实时情绪指示器 */}
          <div className="chat-title-area">
            <h1 className="chat-title">{selectedPet?.name || "会员专区"}</h1>
            <p className="chat-subtitle">聊天 · 心声 · AI分析 ✨</p>
            
            {/* 实时情绪指示器 */}
            <div 
              className="chat-mood-indicator" 
              style={{ "--mood-color": currentMood.color } as React.CSSProperties}
              onClick={() => setCurrentMood(PET_MOOD_STATES[Math.floor(Math.random() * PET_MOOD_STATES.length)])}
            >
              <span className="chat-mood-emoji">{currentMood.emoji}</span>
              <span className="chat-mood-label">{currentMood.label}</span>
              <span className="chat-mood-desc">{currentMood.description}</span>
              <Zap size={10} className="chat-mood-spark" />
            </div>
          </div>

          {/* 右侧：设置按钮 */}
          <div className="chat-header-btns">
            <button 
              className="chat-hbtn chat-hbtn-settings" 
              onClick={() => setShowSettings(!showSettings)}
              title="宠物设置"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* 隐藏的文件输入框（快捷入口直接触发） */}
        <input
          ref={quickCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleQuickCameraChange}
          style={{ display: 'none' }}
        />
        <input
          ref={quickGalleryRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleQuickGalleryChange}
          style={{ display: 'none' }}
        />

        {/* ====== 功能快捷入口栏 ====== */}
        <div className="quick-actions-bar">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className="quick-action-card"
                style={{ "--action-color": action.color } as React.CSSProperties}
                onClick={() => {
                  if (action.id === "camera-mind") quickCameraRef.current?.click();
                  else if (action.id === "photo-mind") quickGalleryRef.current?.click();
                  else if (action.id === "ai-analysis") navigate("/app/ai-analysis");
                }}
              >
                <div className="qa-visual">
                  <div className="qa-visual-bg" style={{ background: action.gradient }} />
                  <div className="qa-icon-wrap ghibli-icon-handdrawn" style={{ "--qa-icon-bg": action.iconBg } as React.CSSProperties}>
                    <Icon size={24} strokeWidth={1.5} className="qa-icon" />
                  </div>
                </div>
                <div className="qa-content">
                  <span className="qa-title">{action.label}</span>
                  <span className="qa-desc">{action.description}</span>
                </div>
              </button>
            );
          })}
          {/* 安全提示 */}
          <div className="quick-actions-tip">
            <span>🔒 数据安全加密保护 · 你的隐私我们用心守护</span>
          </div>
        </div>

        {/* 设置面板（下拉） */}
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-panel-inner">
              <h3 className="settings-title">⚙️ 宠物设置</h3>
              
              <div className="setting-item">
                <span className="label">说话风格</span>
                <div className="setting-options">
                  {["傲娇", "温柔", "活泼", "高冷"].map((style) => (
                    <button key={style} className="setting-chip">{style}</button>
                  ))}
                </div>
              </div>

              <div className="setting-item">
                <span className="label">粘人程度</span>
                <input type="range" min="0" max="100" defaultValue="60" className="setting-slider" />
              </div>
              
              {/* 记忆系统设置 */}
              {memoryContext && (
                <>
                  <div className="setting-divider" />
                  
                  <div className="setting-item">
                    <span className="setting-label">💾 聊天记录</span>
                    <span className="setting-info-text">
                      {memoryContext.getMessages().length} 条消息
                    </span>
                  </div>
                  
                  <div className="setting-item">
                    <span className="setting-label">活跃度</span>
                    <span 
                      className={`setting-activity-badge ${petProfile?.activityLevel?.label || "inactive"}`}
                    >
                      {petProfile?.activityLevel?.label === "very_high" ? "非常活跃" :
                       petProfile?.activityLevel?.label === "high" ? "活跃" :
                       petProfile?.activityLevel?.label === "moderate" ? "一般" :
                       petProfile?.activityLevel?.label === "low" ? "较低" : "不活跃"}
                      ({petProfile?.activityLevel?.score || 0}分)
                    </span>
                  </div>
                  
                  <div className="setting-item">
                    <span className="setting-label">空闲时间</span>
                    <span className="setting-info-text">
                      {petProfile?.activityLevel?.idleMinutes
                        ? petProfile.activityLevel.idleMinutes < 60
                          ? `${Math.round(petProfile.activityLevel.idleMinutes)}分钟`
                          : `${Math.round(petProfile.activityLevel.idleMinutes / 60)}小时`
                        : "无数据"}
                    </span>
                  </div>
                  
                  <div className="setting-row-btns">
                    <button
                      className="setting-action-btn"
                      onClick={() => {
                        memoryContext.saveToStorage();
                        alert("聊天记录已保存！");
                      }}
                    >
                      💾 手动保存
                    </button>
                    <button
                      className="setting-action-btn danger"
                      onClick={() => {
                        if (confirm("确定要清除所有聊天记录吗？此操作不可恢复！")) {
                          memoryContext.clearMessages();
                          setMessages([]);
                          setPetProfile(null);
                          alert("已清除所有记录");
                        }
                      }}
                    >
                      🗑️ 清除记忆
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ====== 分析中 Loading 覆盖层（全屏） ====== */}
      <PhotoAnalysisOverlay
        photoUrl={analyzingPhotoUrl}
        currentStep={analysisStep}
        isActive={isAnalyzing}
      />
      
      {/* ====== 照片心声区域（上传面板 + 结果列表） ====== */}
      {activeTab === "photo" && (
        <>
          {/* 上传面板 */}
          {showPhotoUploader && (
            <div className="chat-feature-panel">
              <div className="chat-panel-header">
                <span className="chat-panel-title">📸 照片心声</span>
                <button className="chat-panel-close" onClick={() => setShowPhotoUploader(false)}>
                  <ChevronDown size={20} />
                </button>
              </div>
              <p className="chat-panel-desc">上传宠物照片，AI 解读它此刻的内心 OS~</p>
              <PetPhotoUploader
                onUploadComplete={handlePhotoUpload}
                onProgress={setLoadingText}
                onCancel={() => setShowPhotoUploader(false)}
                disabled={isLoading}
                showCameraButton={true}
              />
            </div>
          )}

          {/* 照片分析结果列表（分区显示） */}
          {photoResults.length > 0 && !showPhotoUploader && (
            <div className="chat-feature-results">
              <div className="chat-results-header">
                <span className="chat-results-title">📸 心声解读记录</span>
                <span className="chat-results-count">{photoResults.length} 条</span>
              </div>
              {photoResults.map((item) => (
                <div key={item.id} className="chat-result-item chat-result-photo">
                  <PhotoMindResultCard
                    result={item.result}
                    photoUrl={item.photoUrl}
                    petName={selectedPet?.name || "宝贝"}
                    petSpecies={selectedPet?.species || "dog"}
                    expandable={true}
                    onClose={() => setPhotoResults(prev => prev.filter(r => r.id !== item.id))}
                    onShare={() => {}}
                    onRetake={() => {
                      setActiveTab("photo");
                      setShowPhotoUploader(true);
                    }}
                  />
                  <span className="chat-result-time">{item.time}</span>
                </div>
              ))}
              
              {/* 快捷重新上传按钮 */}
              <button
                className="chat-reupload-btn"
                onClick={() => setShowPhotoUploader(true)}
                style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)" }}
              >
                <Image size={14} />
                再解读一张
              </button>
            </div>
          )}
        </>
      )}

      {/* 空状态引导（始终显示，无结果时引导用户） */}
      {photoResults.length === 0 && (
        <div className="chat-empty-hint" onClick={() => quickGalleryRef.current?.click()}>
          <Image size={32} style={{ color: "#D4A574", opacity: 0.6 }} />
          <p>点击上传宠物照片，AI 帮你读懂它的内心~</p>
          <span className="chat-empty-action">开始解读</span>
        </div>
      )}

      {/* 加载提示 */}
      {isLoading && (
        <div className="chat-loading-toast">
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingText}</span>
        </div>
      )}
      
      {/* 底部操作区 - 已移除，功能通过各Tab内部入口访问 */}
    </main>
  );
}
