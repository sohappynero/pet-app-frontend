/**
 * Pet TTS Engine - 宠物语音合成引擎
 * 基于 Web Audio API 实时合成猫/狗叫声
 * 支持 6 种情绪 x 2 个品种（猫/狗）
 */

// ═════════════════════════════════════
// 类型定义
// ═════════════════════════════════════

export type PetSpecies = 'cat' | 'dog';
export type PetEmotion = 'excited' | 'happy' | 'playful' | 'sleepy' | 'angry' | 'neutral';

export interface PetTTSSoundProfile {
  baseFrequency: number;       // 基础频率 Hz
  waveformType: OscillatorType; // 波形类型
  duration: number;              // 单次发声时长(秒)
  repeatCount: number;           // 重复次数
  pitchVariation: number;       // 频率变化范围 Hz
  attack: number;               // 音头包络时间(s)
  decay: number;                // 衰减时间(s)
  sustainVolume: number;        // 持续期音量(0-1)
  release: number;              // 释音时间(s)
}

// 进度回调类型
type ProgressCallback = (progress: number) => void;

/** 将前端品种标识转换为引擎品种类型 */
export function toTtsSpecies(species?: string): PetSpecies {
  if (!species) return 'dog';
  const s = species.toLowerCase();
  if (s === 'cat' || s === '猫') return 'cat';
  return 'dog';
}

// ═════════════════════════════════════
// 声音参数配置表 - 品种 x 情绪矩阵
// ═════════════════════════════════════

const CAT_PROFILES: Record<PetEmotion, PetTTSSoundProfile> = {
  excited: {
    baseFrequency: 800,
    waveformType: 'sine',
    duration: 0.25,
    repeatCount: 6,
    pitchVariation: 180,
    attack: 0.01,
    decay: 0.04,
    sustainVolume: 0.5,
    release: 0.08,
  },
  happy: {
    baseFrequency: 600,
    waveformType: 'triangle',
    duration: 0.4,
    repeatCount: 4,
    pitchVariation: 100,
    attack: 0.02,
    decay: 0.08,
    sustainVolume: 0.4,
    release: 0.15,
  },
  playful: {
    baseFrequency: 550,
    waveformType: 'sine',
    duration: 0.2,
    repeatCount: 5,
    pitchVariation: 250,
    attack: 0.008,
    decay: 0.04,
    sustainVolume: 0.45,
    release: 0.10,
  },
  sleepy: {
    baseFrequency: 350,
    waveformType: 'triangle',
    duration: 0.8,
    repeatCount: 2,
    pitchVariation: 30,
    attack: 0.08,
    decay: 0.2,
    sustainVolume: 0.25,
    release: 0.3,
  },
  angry: {
    baseFrequency: 220,
    waveformType: 'sawtooth',
    duration: 0.35,
    repeatCount: 3,
    pitchVariation: 80,
    attack: 0.015,
    decay: 0.05,
    sustainVolume: 0.6,
    release: 0.18,
  },
  neutral: {
    baseFrequency: 500,
    waveformType: 'sine',
    duration: 0.35,
    repeatCount: 3,
    pitchVariation: 60,
    attack: 0.02,
    decay: 0.06,
    sustainVolume: 0.4,
    release: 0.12,
  },
};

const DOG_PROFILES: Record<PetEmotion, PetTTSSoundProfile> = {
  excited: {
    baseFrequency: 500,
    waveformType: 'square',
    duration: 0.15,
    repeatCount: 4,
    pitchVariation: 100,
    attack: 0.005,
    decay: 0.03,
    sustainVolume: 0.55,
    release: 0.05,
  },
  happy: {
    baseFrequency: 400,
    waveformType: 'triangle',
    duration: 0.3,
    repeatCount: 2,
    pitchVariation: 70,
    attack: 0.015,
    decay: 0.07,
    sustainVolume: 0.45,
    release: 0.12,
  },
  playful: {
    baseFrequency: 450,
    waveformType: 'square',
    duration: 0.2,
    repeatCount: 3,
    pitchVariation: 120,
    attack: 0.008,
    decay: 0.04,
    sustainVolume: 0.5,
    release: 0.08,
  },
  sleepy: {
    baseFrequency: 220,
    waveformType: 'triangle',
    duration: 0.7,
    repeatCount: 1,
    pitchVariation: 30,
    attack: 0.06,
    decay: 0.18,
    sustainVolume: 0.28,
    release: 0.3,
  },
  angry: {
    baseFrequency: 180,
    waveformType: 'sawtooth',
    duration: 0.35,
    repeatCount: 2,
    pitchVariation: 50,
    attack: 0.03,
    decay: 0.04,
    sustainVolume: 0.65,
    release: 0.18,
  },
  neutral: {
    baseFrequency: 350,
    waveformType: 'sine',
    duration: 0.25,
    repeatCount: 1,
    pitchVariation: 40,
    attack: 0.02,
    decay: 0.05,
    sustainVolume: 0.42,
    release: 0.1,
  },
};

// ═════════════════════════════════════
// 全局状态管理
// ═════════════════════════════════════

let audioContext: AudioContext | null = null;
let currentSourceNodes: OscillatorNode[] = [];
let isPlaying = false;

// ═════════════════════════════════════
// 内部辅助函数
// ═════════════════════════════════════

/** 获取或创建 AudioContext */
function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/** 构建单次发声的振荡器链 */
function buildOscillatorChain(
  ctx: AudioContext,
  profile: PetTTSSoundProfile,
  frequencyOffset: number
): { oscillator: OscillatorNode; gainNode: GainNode } {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = profile.baseFrequency + 500;
  filter.Q.value = 1;
  
  oscillator.type = profile.waveformType;
  oscillator.frequency.value = profile.baseFrequency + frequencyOffset;
  
  const now = ctx.currentTime;
  const peakTime = now + profile.attack;
  const sustainTime = peakTime + profile.decay;
  const endTime = sustainTime + (profile.duration - profile.attack - profile.decay);
  
  // ADSR 包络
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(profile.sustainVolume, peakTime);
  gainNode.gain.linearRampToValueAtTime(profile.sustainVolume * 0.6, sustainTime);
  gainNode.gain.linearRampToValueAtTime(0, endTime + profile.release);
  
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  return { oscillator, gainNode };
}

// ═════════════════════════════════════
// 公共 API（对象导出，匹配 PetChat.tsx 接口）
// ═════════════════════════════════════

const petTtsEngine = {
  /** 播放宠物叫声 */
  async playBark(
    species: PetSpecies,
    emotion: PetEmotion = 'neutral',
    onProgress?: ProgressCallback
  ): Promise<number> {
    stopPetSound();
    
    const ctx = getAudioContext();
    const profiles = species === 'cat' ? CAT_PROFILES : DOG_PROFILES;
    const profile = profiles[emotion] || profiles.neutral;
    
    isPlaying = true;
    currentSourceNodes = [];
    
    const startTime = ctx.currentTime;
    let totalDuration = 0;
    
    for (let i = 0; i < profile.repeatCount; i++) {
      const delay = i * (profile.duration + 0.15);
      const freqOffset = (Math.random() - 0.5) * 2 * profile.pitchVariation;
      
      const { oscillator } = buildOscillatorChain(ctx, profile, freqOffset);
      
      const oscStart = startTime + delay;
      const oscEnd = oscStart + profile.duration + profile.attack + profile.decay + profile.release;
      
      oscillator.start(oscStart);
      oscillator.stop(oscEnd);
      
      currentSourceNodes.push(oscillator);
      
      totalDuration = Math.max(totalDuration, delay + profile.duration + profile.release);
    }
    
    // 进度模拟
    if (onProgress) {
      const progressInterval = setInterval(() => {
        if (!isPlaying) {
          clearInterval(progressInterval);
          return;
        }
        const elapsed = ctx.currentTime - startTime;
        onProgress(Math.min(1, elapsed / totalDuration));
      }, 50);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          clearInterval(progressInterval);
          isPlaying = false;
          currentSourceNodes = [];
          resolve(totalDuration);
        }, totalDuration * 1000 + 100);
      });
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        isPlaying = false;
        currentSourceNodes = [];
        resolve(totalDuration);
      }, totalDuration * 1000 + 100);
    });
  },

  /** 停止当前播放 */
  stop(): void {
    // 直接实现停止逻辑，避免与 stopPetSound() 相互递归
    try {
      for (const node of currentSourceNodes) {
        try { node.stop(); } catch (_) { /* 已停止的节点忽略 */ }
      }
    } catch (_) { /* 忽略 */ }
    currentSourceNodes = [];
    isPlaying = false;
  },

  /** 获取预估播放时长 */
  getEstimatedDuration(species: PetSpecies, emotion: PetEmotion): number {
    const profiles = species === 'cat' ? CAT_PROFILES : DOG_PROFILES;
    const profile = profiles[emotion] || profiles.neutral;
    const singleDuration = profile.duration + profile.attack + profile.decay + profile.release;
    return singleDuration * profile.repeatCount + (profile.repeatCount - 1) * 0.15;
  },

  /** 格式化时长显示 */
  formatDuration(seconds: number): string {
    if (seconds < 1) return `${Math.round(seconds * 10) / 10}s`;
    return `${seconds.toFixed(1)}s`;
  },
};

export { petTtsEngine };

/** 函数式 API（兼容旧代码） */
export async function playPetSound(
  species: PetSpecies,
  emotion: PetEmotion = 'neutral'
): Promise<number> {
  return petTtsEngine.playBark(species, emotion);
}

export function stopPetSound(): void {
  petTtsEngine.stop();
}

export function isTtsPlaying(): boolean {
  return isPlaying;
}
