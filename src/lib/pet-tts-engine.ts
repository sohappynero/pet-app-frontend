/**
 * 宠物叫声 TTS 合成引擎
 * 基于 Web Audio API (OscillatorNode) 实时合成情绪感知的猫/狗叫声
 * 
 * 零依赖、零网络请求、纯浏览器端即时合成
 */

import type { PetEmotion } from "../types";

// ============================================================
// 类型定义
// ============================================================

export type TtsSpecies = "cat" | "dog";

/** TTS 叫声配置 */
export interface TtsSoundConfig {
  /** 基础频率 (Hz) - 猫更高，狗更低 */
  baseFreq: number;
  /** 频率范围（随机偏移） */
  freqRange: number;
  /** 波形类型 */
  waveType: OscillatorType;
  /** 每声时长 (ms) */
  barkDuration: number;
  /** 声间间隔 (ms) */
  gapDuration: number;
  /** 叫声次数 */
  barkCount: number;
  /** 音量 (0-1) */
  volume: number;
  /** 是否添加颤音 (vibrato) */
  vibrato: boolean;
  /** 颤音频率 (Hz) */
  vibratoFreq: number;
  /** 颤音深度 (Hz) */
  vibratoDepth: number;
  /** 频率滑动：起始→结束的相对变化 (-1 到 1) */
  freqSlide: number;
  /** 是否添加呼噜底噪 (仅猫类) */
  purrNoise: boolean;
  /** 总时长估算 (ms)，用于 UI 显示 */
  estimatedDuration: number;
}

// ============================================================
// 情绪 × 品种 的叫声参数映射表
// ============================================================

const CAT_PRESETS: Record<string, Partial<TtsSoundConfig>> = {
  excited: {
    baseFreq: 650, freqRange: 200, waveType: "sine",
    barkDuration: 120, gapDuration: 80, barkCount: 4,
    volume: 0.5, vibrato: true, vibratoFreq: 14, vibratoDepth: 40,
    freqSlide: 0.3, purrNoise: false, estimatedDuration: 800,
  },
  happy: {
    baseFreq: 500, freqRange: 150, waveType: "sine",
    barkDuration: 200, gapDuration: 150, barkCount: 2,
    volume: 0.35, vibrato: true, vibratoFreq: 10, vibratoDepth: 30,
    freqSlide: 0.15, purrNoise: true, estimatedDuration: 700,
  },
  hungry: {
    baseFreq: 550, freqRange: 100, waveType: "triangle",
    barkDuration: 400, gapDuration: 300, barkCount: 3,
    volume: 0.45, vibrato: true, vibratoFreq: 8, vibratoDepth: 20,
    freqSlide: -0.2, purrNoise: false, estimatedDuration: 1900,
  },
  lonely: {
    baseFreq: 380, freqRange: 80, waveType: "sine",
    barkDuration: 600, gapDuration: 500, barkCount: 2,
    volume: 0.3, vibrato: true, vibratoFreq: 6, vibratoDepth: 25,
    freqSlide: -0.15, purrNoise: true, estimatedDuration: 1700,
  },
  anxious: {
    baseFreq: 720, freqRange: 250, waveType: "sawtooth",
    barkDuration: 100, gapDuration: 60, barkCount: 5,
    volume: 0.4, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: 0.4, purrNoise: false, estimatedDuration: 800,
  },
  angry: {
    baseFreq: 800, freqRange: 300, waveType: "sawtooth",
    barkDuration: 80, gapDuration: 50, barkCount: 6,
    volume: 0.55, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: 0.5, purrNoise: false, estimatedDuration: 780,
  },
  sleepy: {
    baseFreq: 280, freqRange: 50, waveType: "sine",
    barkDuration: 500, gapDuration: 400, barkCount: 1,
    volume: 0.2, vibrato: true, vibratoFreq: 5, vibratoDepth: 15,
    freqSlide: -0.25, purrNoise: true, estimatedDuration: 900,
  },
  neutral: {
    baseFreq: 450, freqRange: 100, waveType: "sine",
    barkDuration: 250, gapDuration: 200, barkCount: 1,
    volume: 0.3, vibrato: true, vibratoFreq: 8, vibratoDepth: 20,
    freqSlide: 0.05, purrNoise: false, estimatedDuration: 450,
  },
  playful: {
    baseFreq: 580, freqRange: 180, waveType: "sine",
    barkDuration: 90, gapDuration: 70, barkCount: 3,
    volume: 0.4, vibrato: true, vibratoFreq: 16, vibratoDepth: 45,
    freqSlide: 0.35, purrNoise: false, estimatedDuration: 480,
  },
  relaxed: {
    baseFreq: 350, freqRange: 60, waveType: "sine",
    barkDuration: 350, gapDuration: 250, barkCount: 2,
    volume: 0.25, vibrato: true, vibratoFreq: 7, vibratoDepth: 18,
    freqSlide: -0.1, purrNoise: true, estimatedDuration: 950,
  },
};

const DOG_PRESETS: Record<string, Partial<TtsSoundConfig>> = {
  excited: {
    baseFreq: 500, freqRange: 150, waveType: "triangle",
    barkDuration: 100, gapDuration: 70, barkCount: 5,
    volume: 0.55, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: 0.2, purrNoise: false, estimatedDuration: 850,
  },
  happy: {
    baseFreq: 380, freqRange: 100, waveType: "triangle",
    barkDuration: 150, gapDuration: 120, barkCount: 3,
    volume: 0.4, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: 0.1, purrNoise: false, estimatedDuration: 810,
  },
  hungry: {
    baseFreq: 320, freqRange: 80, waveType: "square",
    barkDuration: 350, gapDuration: 250, barkCount: 3,
    volume: 0.45, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: -0.15, purrNoise: false, estimatedDuration: 1750,
  },
  lonely: {
    baseFreq: 240, freqRange: 60, waveType: "triangle",
    barkDuration: 500, gapDuration: 600, barkCount: 2,
    volume: 0.35, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: -0.2, purrNoise: false, estimatedDuration: 2200,
  },
  anxious: {
    baseFreq: 480, freqRange: 180, waveType: "sawtooth",
    barkDuration: 90, gapDuration: 60, barkCount: 6,
    volume: 0.42, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: 0.3, purrNoise: false, estimatedDuration: 900,
  },
  angry: {
    baseFreq: 420, freqRange: 200, waveType: "sawtooth",
    barkDuration: 70, gapDuration: 40, barkCount: 8,
    volume: 0.6, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: 0.15, purrNoise: false, estimatedDuration: 880,
  },
  sleepy: {
    baseFreq: 180, freqRange: 40, waveType: "triangle",
    barkDuration: 450, gapDuration: 500, barkCount: 1,
    volume: 0.22, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: -0.3, purrNoise: false, estimatedDuration: 950,
  },
  neutral: {
    baseFreq: 300, freqRange: 80, waveType: "triangle",
    barkDuration: 200, gapDuration: 180, barkCount: 1,
    volume: 0.32, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: 0, purrNoise: false, estimatedDuration: 200,
  },
  playful: {
    baseFreq: 420, freqRange: 130, waveType: "triangle",
    barkDuration: 80, gapDuration: 60, barkCount: 4,
    volume: 0.43, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: 0.25, purrNoise: false, estimatedDuration: 520,
  },
  relaxed: {
    baseFreq: 260, freqRange: 50, waveType: "triangle",
    barkDuration: 300, gapDuration: 250, barkCount: 2,
    volume: 0.28, vibrato: false, vibratoFreq: 0, vibratoDepth: 0,
    freqSlide: -0.12, purrNoise: false, estimatedDuration: 1100,
  },
};

// 默认配置（fallback）
const DEFAULT_CONFIG: TtsSoundConfig = {
  baseFreq: 400, freqRange: 100, waveType: "sine",
  barkDuration: 200, gapDuration: 150, barkCount: 2,
  volume: 0.3, vibrato: false, vibratoFreq: 8, vibratoDepth: 20,
  freqSlide: 0, purrNoise: false, estimatedDuration: 550,
};

// ============================================================
// TTS 引擎核心类
// ============================================================

export class PetTtsEngine {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | OscillatorNode | null = null;
  private isPlaying = false;

  /** 获取或创建 AudioContext */
  private getContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      this.audioCtx = new AudioContext();
    }
    // 用户交互后恢复（浏览器自动播放策略）
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * 根据品种和情绪获取完整配置
   */
  getTtsConfig(species: TtsSpecies, emotion: PetEmotion): TtsSoundConfig {
    const presets = species === "cat" ? CAT_PRESETS : DOG_PRESETS;
    const preset = presets[emotion] || presets["neutral"] || {};
    return { ...DEFAULT_CONFIG, ...preset } as TtsSoundConfig;
  }

  /**
   * 获取预估时长（ms），用于显示在 UI 上
   */
  getEstimatedDuration(species: TtsSpecies, emotion: PetEmotion): number {
    const config = this.getTtsConfig(species, emotion);
    return config.estimatedDuration;
  }

  /**
   * 格式化时长显示（如 "0.8秒" 或 "2.2秒"）
   */
  formatDuration(ms: number): string {
    const sec = ms / 1000;
    return sec < 1 ? `${Math.round(sec * 10) / 10}秒` : `${sec.toFixed(1)}秒`;
  }

  /**
   * 播放宠物叫声
   * @returns Promise<number> 实际播放时长(ms)
   */
  async playBark(
    species: TtsSpecies,
    emotion: PetEmotion,
    onProgress?: (progress: number) => void,
  ): Promise<number> {
    // 如果正在播放，先停止
    this.stop();

    const ctx = this.getContext();
    const config = this.getTtsConfig(species, emotion);
    const now = ctx.currentTime;

    // ---- 主输出链路 ----
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;  // 从静音开始做淡入
    masterGain.connect(ctx.destination);

    // 低通滤波器让声音更柔和自然
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = species === "cat" ? 3000 : 2000;
    filter.Q.value = 1;
    filter.connect(masterGain);

    // ---- 颤音 LFO（可选）----
    let vibratoGain: GainNode | null = null;
    if (config.vibrato && config.vibratoDepth > 0) {
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = config.vibratoFreq;
      vibratoGain = ctx.createGain();
      vibratoGain.gain.value = config.vibratoDepth;
      lfo.connect(vibratoGain);
      lfo.start(now);
      // LFO 在所有叫声结束后停止
      const totalMs = config.barkCount * (config.barkDuration + config.gapDuration);
      lfo.stop(now + totalMs / 1000 + 0.1);
    }

    // ---- 呼噜底噪（可选，仅猫）----
    if (config.purrNoise && species === "cat") {
      const bufferSize = ctx.sampleRate * 2;  // 2 秒噪声缓冲
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.08;
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.value = 80;  // 极低频 → 呼噜感
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.15;
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSrc.start(now);
      const totalMs = config.barkCount * (config.barkDuration + config.gapDuration) + 500;
      noiseSrc.stop(now + totalMs / 1000);
    }

    // ---- 生成每一声叫唤 ----
    let offsetTime = now;
    const totalDuration = config.barkCount * (config.barkDuration + config.gapDuration);

    for (let i = 0; i < config.barkCount; i++) {
      // 每一声使用独立的振荡器
      const osc = ctx.createOscillator();
      osc.type = config.waveType;

      // 基频 + 随机变化
      const freqVariation = (Math.random() - 0.5) * 2 * config.freqRange;
      const startFreq = config.baseFreq + freqVariation;
      const endFreq = startFreq * (1 + config.freqSlide);
      osc.frequency.setValueAtTime(startFreq, offsetTime);
      osc.frequency.linearRampToValueAtTime(endFreq, offsetTime + config.barkDuration / 1000);

      // 连接颤音
      if (vibratoGain) {
        osc.frequency.connect(vibratoGain);  // 注意：这里需要用额外的 gain 来混合
        osc.disconnect();  // 断开直接连接
        // 改为通过常量 gain node 中转
        const freqIn = ctx.createConstantSource();
        freqIn.offset.value = startFreq;
        // 简化方案：直接用 frequency.setValueAtTime + 手动调制
      }

      // 每一声的包络（ADSR）
      const envGain = ctx.createGain();
      const attack = Math.min(config.barkDuration * 0.15, 30) / 1000;
      const decay = Math.min(config.barkDuration * 0.2, 50) / 1000;
      const sustainLevel = 0.7;
      const release = Math.min(config.barkDuration * 0.3, 80) / 1000;

      envGain.gain.setValueAtTime(0, offsetTime);
      envGain.gain.linearRampToValueAtTime(config.volume, offsetTime + attack);
      envGain.gain.linearRampToValueAtTime(config.volume * sustainLevel, offsetTime + attack + decay);
      envGain.gain.setValueAtTime(config.volume * sustainLevel, offsetTime + config.barkDuration / 1000 - release);
      envGain.gain.linearRampToValueAtTime(0, offsetTime + config.barkDuration / 1000);

      osc.connect(envGain);
      envGain.connect(filter);

      osc.start(offsetTime);
      osc.stop(offsetTime + config.barkDuration / 1000 + 0.01);

      // 推进时间到下一声
      offsetTime += (config.barkDuration + config.gapDuration) / 1000;
    }

    // ---- 全局淡入淡出 ----
    masterGain.gain.linearRampToValueAtTime(1, now + 0.03);       // 30ms 淡入
    masterGain.gain.setValueAtTime(1, now + totalDuration / 1000 - 0.08);
    masterGain.gain.linearRampToValueAtTime(0, now + totalDuration / 1000);  // 80ms 淡出

    this.isPlaying = true;

    // ---- 进度回调 ----
    if (onProgress) {
      const startTime = performance.now();
      const duration = totalDuration;
      const tick = () => {
        if (!this.isPlaying) return;
        const elapsed = performance.now() - startTime;
        onProgress(Math.min(elapsed / duration, 1));
        if (elapsed < duration + 100) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        this.isPlaying = false;
        resolve(totalDuration);
      }, totalDuration + 100);
    });
  }

  /**
   * 停止当前播放
   */
  stop(): void {
    this.isPlaying = false;
    try {
      if (this.currentSource) {
        try { this.currentSource.stop(); } catch { /* 已停止 */ }
        this.currentSource = null;
      }
      if (this.audioCtx) {
        this.audioCtx.close().catch(() => {});
        this.audioCtx = null;
      }
    } catch {
      // 忽略停止错误
    }
  }

  /** 是否正在播放 */
  get playing(): boolean {
    return this.isPlaying;
  }
}

// ============================================================
// 单例 & 便捷函数
// ============================================================

/** 全局 TTS 引擎单例 */
export const petTtsEngine = new PetTtsEngine();

/**
 * 将 Species 字符串转为 TtsSpecies
 * 兼容中英文："猫"/"cat"/"Cat" → cat, 其他 → dog
 */
export function toTtsSpecies(species?: string): TtsSpecies {
  if (!species) return "dog";
  const s = species.toLowerCase().trim();
  return s === "猫" || s === "cat" ? "cat" : "dog";
}
