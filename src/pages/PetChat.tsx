/**
 * AI 宠物聊天页面
 * 融合三大功能：宠物聊天、照片心声、声音翻译
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MessageCircle, Send, Mic, PawPrint, Sparkles, Heart,
  Image, Loader2, X, ChevronDown, Volume2, 
  Square, Play, Pause, Radio, Camera, Settings,
  Zap, Wand2
} from "lucide-react";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { PetPhotoUploader, type PhotoUploadResult } from "../components/PetPhotoUploader";
import { PhotoAnalysisOverlay } from "../components/PetChat/PhotoAnalysisOverlay";
import { PhotoMindResultCard } from "../components/PetChat/PhotoMindResult";
import { useShell } from "../hooks/useShell";
import { getLocalAvatar } from "../lib/pet-avatar";
import { 
  fetchPhotoMind, 
  fetchPetRoast, 
  fetchVoiceTranslate,
  PetAudioRecorder 
} from "../lib/pet-mind.api";
import {
  EMOTION_EMOJIS,
  EMOTION_LABELS,
  EMOTION_COLORS,
  generateInteractionSuggestions,
  ROAST_QUICK_ACTIONS,
  PET_ROAST_STICKERS,
  getStickersForPersonality,
  inferPersonality
} from "../lib/pet-prompt";
import {
  createPetRoastScheduler,
  type PetRoastScheduler,
  type SchedulerEvent
} from "../lib/pet-roast-scheduler";
import {
  getOrCreateMemoryContext,
  destroyMemoryContext,
  type PetMemoryContext,
  type StoredChatMessage
} from "../lib/pet-memory-context";
import type {
  Pet, ChatMessage as BaseChatMessage, MessageSource,
  PhotoMindResult, RoastResult, VoiceTranslateResult, PetEmotion,
  PetSticker, TriggerType
} from "../types";
import { 
  PetRoastCard, 
  QuickRoastBar 
} from "../components/PetChat/PetRoastCard";
import PetVoiceBubble from "../components/PetChat/PetVoiceBubble";

// ============================================================
// 类型扩展
// ============================================================

interface ChatMessage extends BaseChatMessage {
  source: MessageSource;
  // 照片心声
  photoMind?: PhotoMindResult;
  photoUrl?: string;
  // 声音翻译
  voiceResult?: VoiceTranslateResult;
  audioUrl?: string;
  // AI 吐槽
  roastResult?: RoastResult;
  // 表情包
  sticker?: PetSticker;
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
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "camera-mind",
    icon: Camera,
    label: "拍照解读",
    color: "#9B7EDE",
    gradient: "linear-gradient(135deg, #9B7EDE, #B8A0E8)",
    description: "拍一张，AI 读心"
  },
  {
    id: "photo-mind",
    icon: Image,
    label: "选图解读",
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)",
    description: "选照片，看心声"
  },
  {
    id: "ai-roast",
    icon: Sparkles,
    label: "AI 吐槽",
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #EC4899, #F472B6)",
    description: "听听毛孩子想说"
  },
  {
    id: "voice-translate",
    icon: Volume2,
    label: "声音翻译",
    color: "#4DB8E8",
    gradient: "linear-gradient(135deg, #4DB8E8, #7DD3FC)",
    description: "翻译叫声含义"
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

type ChatTab = "chat" | "photo" | "voice";

const TAB_CONFIG = {
  chat: { icon: MessageCircle, label: "聊天", color: "#D4A574" },
  photo: { icon: Image, label: "照片心声", color: "#9B7EDE" },
  voice: { icon: Volume2, label: "声音翻译", color: "#4DB8E8" },
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
  
  // 声音翻译状态
  const [showVoiceUploader, setShowVoiceUploader] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 表情包状态
  const [showStickers, setShowStickers] = useState(false);
  const [availableStickers, setAvailableStickers] = useState<PetSticker[]>([]);
  
  // 主动消息调度器状态
  const [roastScheduler, setRoastScheduler] = useState<PetRoastScheduler | null>(null);
  const [isSchedulerActive, setIsSchedulerActive] = useState(true);
  
  // 长期记忆上下文
  const [memoryContext, setMemoryContext] = useState<PetMemoryContext | null>(null);
  const [petProfile, setPetProfile] = useState<any>(null);
  
  // Refs
  const audioInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<PetAudioRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const audioPlayRef = useRef<HTMLAudioElement | null>(null);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // ============================================================
  // 初始化长期记忆上下文 + 调度器
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
      console.log(`[PetChat] 从本地存储恢复了 ${savedMessages.length} 条消息`);
    }
    
    // 3. 记录页面打开事件
    ctx.recordEvent({ type: "page_opened", details: { page: "chat" } });
    
    // 4. 构建宠物状态画像
    const personality = inferPersonality(selectedPet.species, selectedPet.breed);
    const profile = ctx.buildProfile(selectedPet, personality);
    setPetProfile(profile);
    
    // 5. 创建并启动调度器（传入画像上下文）
    const scheduler = createPetRoastScheduler(selectedPet, {
      enabled: true,
      minInterval: 5 * 60 * 1000,
      maxInterval: 15 * 60 * 1000,
      showWelcomeOnStartup: true,
      maxConsecutiveMessages: 3
    }, {
      onRoast: handleScheduledRoast,
      onStatusChange: (status) => {
        console.log("[Scheduler] 状态变更:", status);
        // 更新最后交互时间
        ctx.recordEvent({ type: "roast_generated" });
      }
    });
    
    setRoastScheduler(scheduler);
    
    return () => {
      // 清理：保存数据 + 销毁实例
      ctx.saveToStorage();
      scheduler.dispose();
      destroyMemoryContext(selectedPet.id);
    };
  }, [selectedPet]);
  
  // 清理
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      audioRecorderRef.current?.dispose();
      
      // 清理调度器
      roastScheduler?.dispose();
    };
  }, [roastScheduler]);
  
  // ============================================================
  // 初始化主动消息调度器
  // ============================================================
  
  useEffect(() => {
    if (!selectedPet) return;
    
    // 创建并启动调度器
    const scheduler = createPetRoastScheduler(selectedPet, {
      enabled: true,
      minInterval: 5 * 60 * 1000,    // 最小 5 分钟
      maxInterval: 15 * 60 * 1000,   // 最大 15 分钟
      showWelcomeOnStartup: true,     // 启动时发送欢迎消息
      maxConsecutiveMessages: 3       // 最多连续 3 条
    }, {
      onRoast: handleScheduledRoast,
      onStatusChange: (status) => {
        console.log("[Scheduler] 状态变更:", status);
      }
    });
    
    setRoastScheduler(scheduler);
    
    return () => {
      scheduler.dispose();
    };
  }, [selectedPet]);
  
  /**
   * 处理调度器生成的主动吐槽消息
   */
  const handleScheduledRoast = (
    result: RoastResult, 
    event: SchedulerEvent
  ) => {
    const personality = inferPersonality(selectedPet!.species, selectedPet!.breed);
    const stickers = getStickersForPersonality(personality);
    setAvailableStickers(stickers);

    const scheduledMsg: ChatMessage = {
      id: Date.now(),
      type: "pet",
      text: result.roastMessage,
      emoji: "💭",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      source: "ai_roast",
      roastResult: result,
      sticker: undefined
    };

    setMessages((prev) => [...prev, scheduledMsg]);
    
    // 记录到记忆系统
    memoryContext?.addMessage(scheduledMsg as StoredChatMessage);
  };
  
  /** 手动触发主动消息（测试用） */
  const triggerManualRoast = async () => {
    if (roastScheduler) {
      memoryContext?.recordEvent({ type: "manual_trigger" });
      await roastScheduler.manualTrigger();
    }
  };
  
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
  
  /** 发送消息 */
  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMsg: ChatMessage = {
      id: Date.now(),
      type: "human",
      text: inputText,
      emoji: "😊",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      source: "human",
    };
    
    setMessages([...messages, newMsg]);
    setInputText("");
    
    // 记录到记忆系统
    memoryContext?.addMessage(newMsg as StoredChatMessage);
    
    // 更新最后交互时间
    roastScheduler?.updateLastInteraction();
    
    // 模拟宠物回复
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
      
      // 记录宠物回复到记忆系统
      memoryContext?.addMessage(petMsg as StoredChatMessage);
    }, 1000);
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
        // 4. 添加消息到聊天列表（使用新的 PhotoMindResultCard 组件渲染）
        const mindMsg: ChatMessage = {
          id: Date.now(),
          type: "pet",
          text: result.result.mindOs,
          emoji: EMOTION_EMOJIS[result.result.mood],
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          source: "ai_photo_mind",
          photoMind: result.result,
          photoUrl: result.photoUrl,
        };
        setMessages((prev) => [...prev, mindMsg]);
        
        // 记录到记忆系统
        memoryContext?.addMessage(mindMsg as StoredChatMessage);
        memoryContext?.recordEvent({ type: "photo_uploaded", details: { hasResult: true } });
        
        // 关闭上传面板
        setShowPhotoUploader(false);
      }
    } catch (error) {
      console.error("照片心声生成失败:", error);
      setIsAnalyzing(false);
      setAnalysisStep(1);
    }
  };
  
  // ============================================================
  // 声音翻译功能（增强版：录音 + 上传）
  // ============================================================
  
  /** 开始录音 */
  const startRecording = async () => {
    if (!PetAudioRecorder.isSupported()) {
      alert("您的浏览器不支持录音功能，请使用 Chrome 或 Safari");
      return;
    }
    
    const recorder = new PetAudioRecorder();
    audioRecorderRef.current = recorder;
    
    const hasPermission = await recorder.requestPermission();
    if (!hasPermission) {
      alert("无法访问麦克风，请检查权限设置");
      return;
    }
    
    const started = await recorder.startRecording({
      onDataAvailable: (blob) => {
        setRecordedBlob(blob);
        setIsRecording(false);
      },
      onError: (error) => {
        console.error("录音错误:", error);
        setIsRecording(false);
      }
    });
    
    if (started) {
      setIsRecording(true);
      setRecordedBlob(null);
      setRecordingDuration(0);
      
      // 开始计时
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };
  
  /** 停止录音 */
  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    audioRecorderRef.current?.stopRecording();
    setIsRecording(false);
  };
  
  /** 发送录制的音频 */
  const sendRecordedAudio = async () => {
    if (!recordedBlob || !selectedPet) return;
    
    const file = new File([recordedBlob], "recording.webm", { type: recordedBlob.type });
    await handleAudioUpload(file);
    setRecordedBlob(null);
  };
  
  /** 处理音频上传 */
  const handleAudioUpload = async (file: File) => {
    if (!selectedPet) return;
    
    setIsLoading(true);
    setLoadingText("正在分析声音...");
    
    try {
      const result = await fetchVoiceTranslate({
        pet: selectedPet,
        audioFile: file,
        onProgress: setLoadingText,
      });
      
      if (result.success && result.result) {
        // 添加消息到聊天列表
        const voiceMsg: ChatMessage = {
          id: Date.now(),
          type: "pet",
          text: result.result.aiLanguage,
          emoji: EMOTION_EMOJIS[result.result.emotion],
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          source: "ai_voice",
          voiceResult: result.result,
          audioUrl: result.audioUrl,
        };
        setMessages((prev) => [...prev, voiceMsg]);
        
        // 记录到记忆系统
        memoryContext?.addMessage(voiceMsg as StoredChatMessage);
        memoryContext?.recordEvent({ type: "voice_recorded" });
      }
    } catch (error) {
      console.error("声音翻译失败:", error);
    } finally {
      setIsLoading(false);
      setShowVoiceUploader(false);
    }
  };
  
  /** 触发文件选择 */
  const triggerAudioUpload = () => {
    audioInputRef.current?.click();
  };
  
  /** 文件选择处理 */
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAudioUpload(file);
    }
  };
  
  /** 播放录制的音频 */
  const playRecordedAudio = () => {
    if (!recordedBlob) return;
    
    if (audioPlayRef.current) {
      if (isPlaying) {
        audioPlayRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayRef.current.play();
        setIsPlaying(true);
      }
    } else {
      const url = URL.createObjectURL(recordedBlob);
      audioPlayRef.current = new Audio(url);
      audioPlayRef.current.onended = () => setIsPlaying(false);
      audioPlayRef.current.onerror = () => setIsPlaying(false);
      audioPlayRef.current.play();
      setIsPlaying(true);
    }
  };
  
  /** 格式化时间 */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  // ============================================================
  // AI 吐槽功能（增强版：快捷指令 + 表情包）
  // ============================================================
  
  /** 生成 AI 吐槽 */
  const handleGenerateRoast = async (quickActionId?: string) => {
    if (!selectedPet) return;
    
    // 获取适用的表情包
    const personality = inferPersonality(selectedPet.species, selectedPet.breed);
    const stickers = getStickersForPersonality(personality);
    setAvailableStickers(stickers);
    
    setIsLoading(true);
    setLoadingText("宠物正在思考...");
    
    try {
      const result = await fetchPetRoast({
        pet: selectedPet,
        quickAction: quickActionId,
        onProgress: setLoadingText,
      });
      
      if (result.success && result.result) {
        const roastMsg: ChatMessage = {
          id: Date.now(),
          type: "pet",
          text: result.result.roastMessage,
          emoji: "💭",
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          source: "ai_roast",
          roastResult: result.result,
        };
        setMessages((prev) => [...prev, roastMsg]);
        
        // 记录到记忆系统
        memoryContext?.addMessage(roastMsg as StoredChatMessage);
        
        // 显示表情包
        if (result.stickers && result.stickers.length > 0) {
          setShowStickers(true);
        }
      }
    } catch (error) {
      console.error("AI 吐槽生成失败:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /** 发送表情包 */
  const handleSendSticker = (sticker: PetSticker) => {
    const stickerMsg: ChatMessage = {
      id: Date.now(),
      type: "pet",
      text: `${sticker.emoji} ${sticker.label}`,
      emoji: sticker.emoji,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      source: "ai_roast",
      sticker,
    };
    setMessages((prev) => [...prev, stickerMsg]);
    setShowStickers(false);
    
    // 记录到记忆系统
    memoryContext?.addMessage(stickerMsg as StoredChatMessage);
    memoryContext?.recordEvent({ type: "sticker_sent" });
  };
  
  // ============================================================
  // 人类消息翻译成宠物语言
  // ============================================================
  
  const handleTranslateToPet = useCallback((msgId: number, text: string) => {
    // 根据宠物类型选择叫声
    const isCat = selectedPet?.type === "cat";
    
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
                <span className="chat-pet-emoji">
                  {selectedPet.species === "cat" ? "🐱" : selectedPet.species === "other" ? "🐰" : "🐕"}
                </span>
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
            <h1 className="chat-title">{selectedPet?.name || "宠物聊天"}</h1>
            <p className="chat-subtitle">和毛孩子的心灵对话 🐾</p>
            
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

        {/* ====== 功能快捷入口栏 ====== */}
        <div className="quick-actions-bar">
          <div className="quick-actions-scroll">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  className="quick-action-btn"
                  style={{ "--action-gradient": action.gradient, "--action-color": action.color } as React.CSSProperties}
                  onClick={() => {
                    if (action.id === "camera-mind" || action.id === "photo-mind") {
                      setActiveTab("photo");
                      setShowPhotoUploader(true);
                      setShowVoiceUploader(false);
                    } else if (action.id === "ai-roast") {
                      handleGenerateRoast();
                    } else if (action.id === "voice-translate") {
                      setActiveTab("voice");
                      setShowVoiceUploader(true);
                      setShowPhotoUploader(false);
                    }
                  }}
                >
                  <div className="quick-action-icon-wrap">
                    <Icon size={18} />
                  </div>
                  <span className="quick-action-label">{action.label}</span>
                  <span className="quick-action-desc">{action.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 设置面板（下拉） */}
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-panel-inner">
              <h3 className="settings-title">⚙️ 宠物设置</h3>
              
              <div className="setting-item">
                <span className="setting-label">说话风格</span>
                <div className="setting-options">
                  {["傲娇", "温柔", "活泼", "高冷"].map((style) => (
                    <button key={style} className="setting-chip">{style}</button>
                  ))}
                </div>
              </div>
              
              <div className="setting-item">
                <span className="setting-label">粘人程度</span>
                <input type="range" min="0" max="100" defaultValue="60" className="setting-slider" />
              </div>
              
              <div className="setting-item">
                <span className="setting-label">主动发言</span>
                <label className="setting-toggle">
                  <input 
                    type="checkbox" 
                    checked={isSchedulerActive}
                    onChange={(e) => {
                      setIsSchedulerActive(e.target.checked);
                      if (e.target.checked) {
                        roastScheduler?.resume();
                      } else {
                        roastScheduler?.pause();
                      }
                    }}
                  />
                  <span className="toggle-switch" />
                </label>
              </div>

              <div className="setting-item">
                <span className="setting-label">发言频率</span>
                <div className="setting-options-row">
                  <button 
                    className={`setting-chip ${isSchedulerActive ? "active" : ""}`}
                    onClick={() => {
                      roastScheduler?.updateConfig({ 
                        minInterval: 3 * 60 * 1000, 
                        maxInterval: 8 * 60 * 1000 
                      });
                    }}
                  >
                    频繁
                  </button>
                  <button 
                    className={`setting-chip active`}
                    onClick={() => {
                      roastScheduler?.updateConfig({ 
                        minInterval: 5 * 60 * 1000, 
                        maxInterval: 15 * 60 * 1000 
                      });
                    }}
                  >
                    正常
                  </button>
                  <button 
                    className={`setting-chip ${isSchedulerActive ? "" : "active"}`}
                    onClick={() => {
                      roastScheduler?.updateConfig({ 
                        minInterval: 10 * 60 * 1000, 
                        maxInterval: 30 * 60 * 1000 
                      });
                    }}
                  >
                    稀疏
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <span className="setting-label">手动触发</span>
                <button
                  className="setting-manual-btn"
                  onClick={triggerManualRoast}
                  disabled={!roastScheduler || !isSchedulerActive}
                >
                  ✨ 让它说点什么
                </button>
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
      
      {/* 快捷吐槽指令 */}
      <div className="chat-roast-bar">
        <span className="chat-roast-bar-title">💭 快捷吐槽：</span>
        <div className="chat-roast-actions">
          {ROAST_QUICK_ACTIONS.slice(0, 4).map((action) => (
            <button
              key={action.id}
              className="chat-roast-action-btn"
              onClick={() => handleGenerateRoast(action.id)}
              disabled={isLoading}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* ====== 分析中 Loading 覆盖层（全屏） ====== */}
      <PhotoAnalysisOverlay
        photoUrl={analyzingPhotoUrl}
        currentStep={analysisStep}
        isActive={isAnalyzing}
      />
      
      {/* 照片上传面板 */}
      {showPhotoUploader && activeTab === "photo" && (
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
      
      {/* 声音上传面板（增强版：录音 + 上传） */}
      {showVoiceUploader && activeTab === "voice" && (
        <div className="chat-feature-panel">
          <div className="chat-panel-header">
            <span className="chat-panel-title">🎤 声音翻译</span>
            <button className="chat-panel-close" onClick={() => setShowVoiceUploader(false)}>
              <ChevronDown size={20} />
            </button>
          </div>
          <p className="chat-panel-desc">录制或上传宠物叫声，AI 翻译它想说的话~</p>
          
          {/* 录音区域 */}
          <div className="chat-voice-record-area">
            {/* 录音按钮 */}
            <div className="chat-voice-record-main">
              {isRecording ? (
                <div className="chat-voice-recording">
                  <div className="chat-voice-record-btn recording">
                    <div className="chat-voice-record-dot" />
                  </div>
                  <span className="chat-voice-record-time">{formatDuration(recordingDuration)}</span>
                  <button className="chat-voice-stop-btn" onClick={stopRecording}>
                    <Square size={16} fill="currentColor" />
                  </button>
                </div>
              ) : recordedBlob ? (
                <div className="chat-voice-recorded">
                  <button className="chat-voice-play-btn" onClick={playRecordedAudio}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <div className="chat-voice-wave-mini">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="chat-voice-bar-mini" 
                        style={{ animationDelay: `${i * 0.05}s` }} 
                      />
                    ))}
                  </div>
                  <button className="chat-voice-send-btn" onClick={sendRecordedAudio} disabled={isLoading}>
                    <Send size={16} />
                  </button>
                </div>
              ) : (
                <button className="chat-voice-record-btn" onClick={startRecording}>
                  <Radio size={24} />
                </button>
              )}
            </div>
            
            {/* 录音说明 */}
            <p className="chat-voice-record-hint">
              {isRecording ? "正在录音... 点击停止" : recordedBlob ? "播放预览" : "点击开始录音"}
            </p>
            
            {/* 分隔线 */}
            <div className="chat-voice-divider">
              <span>或</span>
            </div>
            
            {/* 上传区域 */}
            <div className="chat-voice-upload-area" onClick={triggerAudioUpload}>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a"
                onChange={handleAudioFileChange}
                className="hidden"
              />
              {isLoading ? (
                <div className="chat-voice-uploading">
                  <Loader2 size={28} className="animate-spin" style={{ color: "#4DB8E8" }} />
                  <span>{loadingText}</span>
                </div>
              ) : (
                <>
                  <Image size={28} style={{ color: "#4DB8E8" }} />
                  <span>上传音频文件</span>
                  <span className="chat-voice-hint">支持 mp3、wav、m4a 格式</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 表情包面板 */}
      {showStickers && (
        <div className="chat-sticker-panel">
          <div className="chat-sticker-header">
            <span className="chat-sticker-title">选择表情包回应</span>
            <button className="chat-panel-close" onClick={() => setShowStickers(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="chat-sticker-grid">
            {availableStickers.map((sticker) => (
              <button
                key={sticker.id}
                className="chat-sticker-item"
                onClick={() => handleSendSticker(sticker)}
              >
                <span className="chat-sticker-emoji">{sticker.emoji}</span>
                <span className="chat-sticker-label">{sticker.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 加载提示 */}
      {isLoading && (
        <div className="chat-loading-toast">
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingText}</span>
        </div>
      )}
      
      {/* 聊天消息区域 - 仅聊天 Tab 显示 */}
      {activeTab === "chat" && (
      <section className="chat-messages">
        <div className="chat-bubble-line" />
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-msg-row ${msg.type === "pet" ? "chat-msg-pet" : "chat-msg-human"}`}
          >
            {msg.type === "human" && (
              <div className="chat-msg-avatar chat-msg-avatar-human">
                <span>😊</span>
              </div>
            )}
            
            <div className="chat-msg-content">
              {/* 照片心声卡片 - 使用新组件渲染 */}
              {msg.source === "ai_photo_mind" && msg.photoMind && (
                <PhotoMindResultCard
                  result={msg.photoMind}
                  photoUrl={msg.photoUrl}
                  petName={selectedPet?.name || "宝贝"}
                  petSpecies={selectedPet?.species || "dog"}
                  expandable={true}
                  onClose={() => {
                    // 可选：从列表中移除该消息
                  }}
                  onShare={() => {
                    // 分享到聊天（可以复制文本或生成分享卡片）
                  }}
                  onRetake={() => {
                    // 重新打开上传面板
                    setActiveTab("photo");
                    setShowPhotoUploader(true);
                  }}
                />
              )}
              
              {/* 声音翻译卡片 - 使用新组件 PetVoiceBubble */}
              {msg.source === "ai_voice" && msg.voiceResult && (
                <PetVoiceBubble
                  result={msg.voiceResult}
                  audioUrl={msg.audioUrl}
                  expanded={false}
                />
              )}
              
              {/* AI 吐槽卡片 - 使用新组件 */}
              {msg.source === "ai_roast" && msg.roastResult && (
                <PetRoastCard
                  result={msg.roastResult}
                  petName={selectedPet?.name || "宝贝"}
                  petSpecies={selectedPet?.species || "dog"}
                  emotion={msg.voiceResult?.emotion || "happy"}
                  timestamp={msg.time}
                  typewriter={true}
                  expandable={true}
                  showActions={true}
                  stickers={availableStickers.length > 0 ? availableStickers : undefined}
                  onClose={() => console.log("关闭吐槽卡片")}
                  onShare={(text) => {
                    navigator.clipboard.writeText(text);
                    alert("已复制到剪贴板~");
                  }}
                  onRegenerate={() => handleGenerateRoast()}
                  onSendSticker={(sticker) => handleSendSticker(sticker)}
                  onExecuteAction={(action) => {
                    // 可以根据动作类型执行不同操作
                    if (action.includes("陪") || action.includes("玩")) {
                      setActiveTab("chat");
                    } else if (action.includes("食") || action.includes("饭")) {
                      // 可以跳转到喂食记录页面
                      alert(`建议：${action}`);
                    }
                  }}
                />
              )}
              
              {/* 表情包消息 */}
              {msg.sticker && (
                <div className="chat-sticker-message">
                  <span className="chat-sticker-big">{msg.sticker.emoji}</span>
                </div>
              )}
              
              {/* 消息气泡 */}
              <div className={`chat-bubble ${msg.type === "pet" || msg.type === "pet_translate" ? "chat-bubble-pet" : "chat-bubble-human"}`}>
                {msg.type === "pet_translate" && (
                  <div className="chat-translate-label">
                    <span>🐾 翻译给宠物听</span>
                  </div>
                )}
                <p className="chat-bubble-text">{msg.text}</p>
                {msg.type === "human" && (
                  <button 
                    className="chat-translate-btn"
                    onClick={() => handleTranslateToPet(msg.id, msg.text)}
                    title="翻译成宠物语言"
                  >
                    🐾 翻译
                  </button>
                )}
              </div>
              
              {/* 情绪标签（仅 AI 功能显示） */}
              {(msg.source === "ai_photo_mind" || msg.source === "ai_voice") && 
               msg.voiceResult?.suggestions && msg.voiceResult.suggestions.length > 0 && (
                <div className="chat-suggestions">
                  {msg.voiceResult.suggestions.slice(0, 2).map((s, i) => (
                    <span key={i} className="chat-suggestion-tag">
                      {s.icon} {s.action}
                    </span>
                  ))}
                </div>
              )}
              
              {/* AI 吐槽建议动作 */}
              {msg.source === "ai_roast" && msg.roastResult?.suggestedAction && (
                <div className="chat-suggestions">
                  <span className="chat-suggestion-tag">
                    💡 {msg.roastResult.suggestedAction}
                  </span>
                </div>
              )}
              
              {/* 消息元信息 */}
              <div className="chat-msg-meta">
                <span className="chat-msg-time">{msg.time}</span>
                {(msg.type === "pet" || msg.type === "pet_translate") && selectedPet && (
                  <div className="chat-msg-avatar chat-msg-avatar-pet chat-msg-pet-avatar">
                    {selectedPet.image_url || getLocalAvatar(selectedPet.id) ? (
                      <img
                        src={selectedPet.image_url || getLocalAvatar(selectedPet.id)!}
                        alt={selectedPet.name}
                        className="chat-pet-avatar-small"
                      />
                    ) : (
                      <span className="chat-emoji-icon">
                        {selectedPet.species === "cat" ? "🐱" : "🐕"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </section>
      )}
      
      {/* ====== 新底部操作区 ====== */}
      <footer className="chat-footer">
        <div className="chat-footer-inner">
          {/* 语音输入按钮 */}
          <button
            className={`chat-voice-btn ${isVoiceInputting ? "voice-active" : ""}`}
            onClick={handleVoiceInput}
            title="语音输入"
          >
            <Mic size={18} />
          </button>
          
          {/* 相册/图片按钮 - 触发照片心声 */}
          <button
            className="chat-gallery-btn"
            onClick={() => {
              setActiveTab("photo");
              setShowPhotoUploader(true);
              setShowVoiceUploader(false);
            }}
            title="上传照片解读心声"
          >
            <Image size={18} />
          </button>
          
          {/* 输入框区域 */}
          <div className="chat-input-wrap">
            <input
              type="text"
              className="chat-input"
              placeholder="对宝贝说点什么..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={!inputText.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
