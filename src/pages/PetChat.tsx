/**
 * AI 宠物聊天页面
 * 融合三大功能：AI 宠物聊天、照片心声解读、双向翻译器(宠物语↔人话)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MessageCircle, Send, Mic, PawPrint, Sparkles, Heart,
  Image, Loader2, X, ChevronDown, ChevronRight, Volume2,
  Square, Play, Pause, Radio, Camera, Settings,
  Zap, Languages, ArrowLeftRight
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
  fetchVoiceTranslate,
  translateHumanToPet,
  PetAudioRecorder,
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
  PhotoMindResult, VoiceTranslateResult, HumanToPetResult, PetEmotion,
  TriggerType
} from "../types";
import PetVoiceBubble from "../components/PetChat/PetVoiceBubble";
import { petTtsEngine, toTtsSpecies } from "../lib/pet-tts-engine";

// ============================================================
// Voice Tab 模式类型
// ============================================================
type VoiceMode = "pet-to-human" | "human-to-pet";

// ============================================================
// 类型扩展
// ============================================================

interface ChatMessage extends BaseChatMessage {
  source: MessageSource;
  // 照片心声
  photoMind?: PhotoMindResult;
  photoUrl?: string;
  // 声音翻译（宠物→人）
  voiceResult?: VoiceTranslateResult;
  audioUrl?: string;
  // 人话转宠物语
  humanToPetResult?: HumanToPetResult;
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
    id: "translator",  // 统一的双向翻译入口
    icon: ArrowLeftRight,
    label: "双向翻译",
    color: "#6366F1",
    gradient: "linear-gradient(135deg, #6366F1, #818CF8)",
    description: "宠物语 ↔ 人话"
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
  
  // Voice Tab 模式切换
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("pet-to-human");
  const [humanInputText, setHumanInputText] = useState("");

  // 人话转宠物语结果（最新一条，用于内联展示）
  const [humanToPetResult, setHumanToPetResult] = useState<HumanToPetResult | null>(null);

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
  
  /** 声音翻译结果列表（宠物叫→人话） */
  const [voiceResults, setVoiceResults] = useState<Array<{
    id: number;
    result: VoiceTranslateResult;
    audioUrl?: string;
    time: string;
  }>>([]);
  
  /** 人话转宠物语结果列表 */
  const [humanToPetResults, setHumanToPetResults] = useState<Array<{
    id: number;
    result: HumanToPetResult;
    time: string;
  }>>([]);

  // TTS 语音播放状态：记录正在播放的卡片 key（"inline" 或消息 id）
  const [ttsPlayingId, setTtsPlayingId] = useState<string | null>(null);
  // TTS 播放进度 0-1
  const [ttsProgress, setTtsProgress] = useState(0);

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
      console.log(`[PetChat] 从本地存储恢复了 ${savedMessages.length} 条消息`);
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
      console.log("[VoiceUpload] 开始处理音频文件:", file.name, file.type, `${(file.size / 1024).toFixed(1)}KB`);

      const result = await fetchVoiceTranslate({
        pet: selectedPet,
        audioFile: file,
        onProgress: (status) => {
          console.log("[VoiceUpload] 进度:", status);
          setLoadingText(status);
        },
      });

      console.log("[VoiceUpload] API 返回结果:", result);

      if (result.success && result.result) {
        // ✅ 成功：添加到声音翻译结果列表（分区显示）
        const voiceItem = {
          id: Date.now(),
          result: result.result,
          audioUrl: result.audioUrl,
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        };
        console.log("[VoiceUpload] 添加到声音结果列表:", voiceItem);
        setVoiceResults((prev) => [voiceItem, ...prev]);

        // 记录到记忆系统
        memoryContext?.recordEvent({ type: "voice_recorded" });
      } else {
        // ❌ 失败：显示错误提示
        console.error("[VoiceUpload] API 返回失败:", result.error);
        alert(`声音翻译失败: ${result.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("[VoiceUpload] 异常:", error);
      alert(`声音翻译异常: ${error instanceof Error ? error.message : "请检查网络连接"}`);
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
  // 人话转宠物语功能
  // ============================================================

  /** 处理人话转宠物语翻译 */
  const handleHumanToPetTranslate = async () => {
    if (!humanInputText.trim() || !selectedPet) return;

    const originalText = humanInputText.trim();
    setIsLoading(true);
    setLoadingText("正在翻译成宠物语言...");

    try {
      const result = await translateHumanToPet({
        pet: selectedPet,
        text: originalText,
        onProgress: setLoadingText,
      });

      if (result.success && result.result) {
        setHumanToPetResult(result.result);

        // 添加到人话转宠语结果列表（分区显示）
        const h2pItem = {
          id: Date.now(),
          result: result.result,
          time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        };
        setHumanToPetResults((prev) => [h2pItem, ...prev]);
        memoryContext?.recordEvent({ type: "human_to_pet_translated", details: { text: originalText } });
      }
    } catch (error) {
      console.error("[HumanToPet] 翻译异常:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /** TTS 播放宠物叫声 */
  const handlePlayTtsVoice = async (emotion: PetEmotion, playId: string) => {
    // 如果正在播放同一个卡片，则停止
    if (ttsPlayingId === playId) {
      petTtsEngine.stop();
      setTtsPlayingId(null);
      setTtsProgress(0);
      return;
    }

    const species = toTtsSpecies(selectedPet?.species);
    setTtsPlayingId(playId);
    setTtsProgress(0);

    try {
      await petTtsEngine.playBark(species, emotion, (p) => setTtsProgress(p));
    } catch (e) {
      console.error("[TTS] 播放失败:", e);
    } finally {
      setTtsPlayingId(null);
      setTtsProgress(0);
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
                    } else if (action.id === "translator") {
                      // 统一翻译入口：打开双向翻译面板
                      setActiveTab("voice");
                      // 默认显示上一次使用的模式，或默认 pet-to-human
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

          {/* 空状态提示 */}
          {photoResults.length === 0 && !showPhotoUploader && (
            <div className="chat-empty-hint" onClick={() => setShowPhotoUploader(true)}>
              <Image size={32} style={{ color: "#F59E0B", opacity: 0.5 }} />
              <p>点击上传宠物照片，AI 帮你读懂它的内心~</p>
              <span className="chat-empty-action">开始解读</span>
            </div>
          )}
        </>
      )}
      
      {/* ====== 双向翻译区域（操作面板 + 结果列表） ====== */}
      {activeTab === "voice" && (
        <>
          {/* 操作面板 */}
          {showVoiceUploader && (
            <div className="chat-feature-panel">
              <div className="chat-panel-header">
                <span className="chat-panel-title">
                  🔄 双向翻译
                </span>
                <button className="chat-panel-close" onClick={() => setShowVoiceUploader(false)}>
                  <ChevronDown size={20} />
                </button>
              </div>
              <p className="chat-panel-desc">
                {voiceMode === "pet-to-human"
                  ? "🎤 录制宠物叫声，AI 翻译它想表达的意思"
                  : "💬 输入你的话，翻译成宠物能理解的语言"}
              </p>

              {/* 模式切换 */}
              <div className="chat-voice-mode-switch">
                <button
                  className={`chat-voice-mode-btn ${voiceMode === "pet-to-human" ? "active" : ""}`}
                  onClick={() => setVoiceMode("pet-to-human")}
                >
                  <Volume2 size={15} />
                  宠物叫声 🐱🐶
                </button>
                <button
                  className={`chat-voice-mode-btn ${voiceMode === "human-to-pet" ? "active" : ""}`}
                  onClick={() => setVoiceMode("human-to-pet")}
                >
                  <Languages size={15} />
                  人话 💬
                </button>
              </div>

              {voiceMode === "pet-to-human" ? (
                /* ====== 模式A: 宠物叫声 → 人话 ====== */
                <>
                  {/* 录音区域 */}
                  <div className="chat-voice-record-area">
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

                    <p className="chat-voice-record-hint">
                      {isRecording ? "正在录音... 点击停止" : recordedBlob ? "播放预览" : "点击开始录音"}
                    </p>

                    <div className="chat-voice-divider"><span>或</span></div>

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
                </>
              ) : (
                /* ====== 模式B: 人话 → 宠物语 ====== */
                <div className="chat-human-input-area">
                  {/* 文字输入 */}
                  <div className="chat-human-textarea-wrap">
                    <textarea
                      className="chat-human-textarea"
                      placeholder={`对${selectedPet?.name || "宝贝"}说点什么...`}
                      value={humanInputText}
                      onChange={(e) => setHumanInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleHumanToPetTranslate();
                        }
                      }}
                      maxLength={200}
                    />
                    <p style={{ fontSize: "11px", color: "#A69076", textAlign: "right", margin: "4px 0 0" }}>
                      {humanInputText.length}/200
                    </p>
                  </div>

                  {/* 翻译按钮 */}
                  <button
                    className="chat-human-translate-btn"
                    onClick={handleHumanToPetTranslate}
                    disabled={!humanInputText.trim() || isLoading}
                  >
                    <Languages size={16} />
                    翻译成宠物语言
                  </button>

                  <p className="chat-hint">按 Enter 快速翻译 | 支持中英文输入</p>
                </div>
              )}

              {/* 人话转宠语内联结果（最新一条） */}
              {voiceMode === "human-to-pet" && humanToPetResult && (
                <div className="chat-human-to-pet-card">
                  <div className="chat-human-to-pet-header">
                    <span className="chat-human-to-pet-label">
                      <Languages size={12} /> 最新翻译
                    </span>
                    <span className="chat-human-to-pet-original">"{humanToPetResult.originalText}"</span>
                  </div>
                  <div className="chat-human-to-pet-text">{humanToPetResult.petLanguage}</div>

                  {/* TTS 语音播放器 */}
                  <button
                    className={`chat-tts-player ${ttsPlayingId === "inline" ? "chat-tts-playing" : ""}`}
                    onClick={() => handlePlayTtsVoice(humanToPetResult.emotion, "inline")}
                  >
                    <span className="chat-tts-play-icon">
                      {ttsPlayingId === "inline"
                        ? <Pause size={16} fill="currentColor" />
                        : <Play size={14} fill="currentColor" />}
                    </span>
                    <span className="chat-tts-waveform">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <i
                          key={i}
                          className="chat-tts-bar"
                          style={{
                            animationDelay: ttsPlayingId === "inline" ? `${i * 0.06}s` : "0s",
                            height: ttsPlayingId === "inline"
                              ? `${20 + Math.sin(i * 0.8) * 60 + Math.random() * 20}%`
                              : `${30 + (i % 3) * 15}%`,
                          }}
                        />
                      ))}
                    </span>
                    <span className="chat-tts-duration">
                      {petTtsEngine.formatDuration(petTtsEngine.getEstimatedDuration(
                        toTtsSpecies(selectedPet?.species), humanToPetResult.emotion
                      ))}
                    </span>
                  </button>

                  <div className="chat-human-to-pet-footer">
                    <span className="chat-human-to-pet-emotion">
                      {humanToPetResult.emoji} {EMOTION_LABELS[humanToPetResult.emotion] || humanToPetResult.emotion}
                    </span>
                    <span className="chat-tts-hint">点击播放宠物叫声</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====== 翻译历史结果列表（分区显示） ====== */}
          {(voiceResults.length > 0 || humanToPetResults.length > 0) && !showVoiceUploader && (
            <div className="chat-feature-results">
              <div className="chat-results-header">
                <span className="chat-results-title">🔄 翻译记录</span>
                <span className="chat-results-count">{voiceResults.length + humanToPetResults.length} 条</span>
              </div>

              {/* 宠物叫→人话 翻译记录 */}
              {voiceResults.map((item) => (
                <div key={item.id} className="chat-result-item chat-result-voice">
                  <PetVoiceBubble
                    result={item.result}
                    audioUrl={item.audioUrl}
                    expanded={false}
                  />
                  <span className="chat-result-time">{item.time}</span>
                </div>
              ))}

              {/* 人话→宠语 翻译记录 */}
              {humanToPetResults.map((item) => (
                <div key={item.id} className="chat-result-item chat-result-h2p">
                  <div className="chat-human-to-pet-card">
                    <div className="chat-human-to-pet-header">
                      <span className="chat-human-to-pet-label">
                        <Languages size={12} /> 人话转宠语
                      </span>
                      <span className="chat-human-to-pet-original">"{item.result.originalText}"</span>
                    </div>
                    <div className="chat-human-to-pet-text">{item.result.petLanguage}</div>

                    <button
                      className={`chat-tts-player ${ttsPlayingId === String(item.id) ? "chat-tts-playing" : ""}`}
                      onClick={() => handlePlayTtsVoice(item.result.emotion, String(item.id))}
                    >
                      <span className="chat-tts-play-icon">
                        {ttsPlayingId === String(item.id)
                          ? <Pause size={16} fill="currentColor" />
                          : <Play size={14} fill="currentColor" />}
                      </span>
                      <span className="chat-tts-waveform">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <i
                            key={i}
                            className="chat-tts-bar"
                            style={{
                              animationDelay: ttsPlayingId === String(item.id) ? `${i * 0.06}s` : "0s",
                              height: ttsPlayingId === String(item.id)
                                ? `${20 + Math.sin(i * 0.8) * 60 + Math.random() * 20}%`
                                : `${30 + (i % 3) * 15}%`,
                            }}
                          />
                        ))}
                      </span>
                      <span className="chat-tts-duration">
                        {petTtsEngine.formatDuration(petTtsEngine.getEstimatedDuration(
                          toTtsSpecies(selectedPet?.species), item.result.emotion
                        ))}
                      </span>
                    </button>

                    <div className="chat-human-to-pet-footer">
                      <span className="chat-human-to-pet-emotion">
                        {item.result.emoji} {EMOTION_LABELS[item.result.emotion] || item.result.emotion}
                      </span>
                      <span className="chat-result-time">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 快捷重新翻译按钮 */}
              <button
                className="chat-reupload-btn"
                onClick={() => setShowVoiceUploader(true)}
                style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}
              >
                <ArrowLeftRight size={14} />
                再翻译一次
              </button>
            </div>
          )}

          {/* 空状态提示 */}
          {voiceResults.length === 0 && humanToPetResults.length === 0 && !showVoiceUploader && (
            <div className="chat-empty-hint" onClick={() => setShowVoiceUploader(true)}>
              <Volume2 size={32} style={{ color: "#6366F1", opacity: 0.5 }} />
              <p>录制宠物叫声或输入文字，AI 帮你翻译~</p>
              <span className="chat-empty-action">开始翻译</span>
            </div>
          )}
        </>
      )}

      {/* 加载提示 */}
      {isLoading && (
        <div className="chat-loading-toast">
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingText}</span>
        </div>
      )}
      
      {/* AI 功能引导面板 - 未选择功能时展示 */}
      {activeTab === "chat" && (
        <section className="chat-ai-guide">
          <div className="chat-guide-header">
            <div className="chat-guide-icon">🤖</div>
            <h2 className="chat-guide-title">AI 宠物助手</h2>
            <p className="chat-guide-subtitle">选择下方任一功能，开启与毛孩子的智能互动</p>
          </div>

          <div className="chat-guide-cards">
            {/* 拍照解读 */}
            <div
              className="chat-guide-card"
              onClick={() => {
                setActiveTab("photo");
                setShowPhotoUploader(true);
                setShowVoiceUploader(false);
              }}
              style={{ "--card-accent": "#9B7EDE", "--card-gradient": "linear-gradient(135deg, rgba(155,126,222,0.08), rgba(184,160,232,0.04))" } as React.CSSProperties}
            >
              <div className="chat-guide-card-icon" style={{ background: "linear-gradient(135deg, #9B7EDE, #B8A0E8)" }}>
                <Camera size={22} />
              </div>
              <div className="chat-guide-card-body">
                <h3>📸 拍照解读</h3>
                <p>直接拍摄宠物照片，AI 实时分析它的表情和姿态，解读此刻的内心活动、情绪状态和想法。</p>
                <span className="chat-guide-card-tag">实时 · 表情识别</span>
              </div>
              <ChevronRight size={16} className="chat-guide-arrow" />
            </div>

            {/* 选图解读 */}
            <div
              className="chat-guide-card"
              onClick={() => {
                setActiveTab("photo");
                setShowPhotoUploader(true);
                setShowVoiceUploader(false);
              }}
              style={{ "--card-accent": "#F59E0B", "--card-gradient": "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04))" } as React.CSSProperties}
            >
              <div className="chat-guide-card-icon" style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)" }}>
                <Image size={22} />
              </div>
              <div className="chat-guide-card-body">
                <h3>🖼️ 选图解读</h3>
                <p>从相册选择宠物照片，AI 深度分析图片中的细节，生成完整的心声报告，包括心情、需求和健康提示。</p>
                <span className="chat-guide-card-tag">深度分析 · 心声报告</span>
              </div>
              <ChevronRight size={16} className="chat-guide-arrow" />
            </div>

            {/* 双向翻译 */}
            <div
              className="chat-guide-card"
              onClick={() => {
                setActiveTab("voice");
                setShowVoiceUploader(true);
                setShowPhotoUploader(false);
              }}
              style={{ "--card-accent": "#6366F1", "--card-gradient": "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(129,140,248,0.04))" } as React.CSSProperties}
            >
              <div className="chat-guide-card-icon" style={{ background: "linear-gradient(135deg, #6366F1, #818CF8)" }}>
                <ArrowLeftRight size={22} />
              </div>
              <div className="chat-guide-card-body">
                <h3>🔄 双向翻译</h3>
                <p>录制宠物叫声翻译成人类语言（🐱喵/🐶汪→人话），或将你的话翻译成宠物语言（人话→喵/汪），支持语音播放。目前支持猫咪和狗狗。</p>
                <span className="chat-guide-card-tag">双向互译 · 语音播放</span>
              </div>
              <ChevronRight size={16} className="chat-guide-arrow" />
            </div>
          </div>

          <div className="chat-guide-tips">
            <Sparkles size={14} />
            <span>所有 AI 功能均由 GLM 智能模型驱动，数据安全加密保护 🛡️</span>
          </div>
        </section>
      )}
      
      {/* 底部操作区 - 已移除，功能通过各Tab内部入口访问 */}
    </main>
  );
}
