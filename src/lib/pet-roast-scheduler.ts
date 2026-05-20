/**
 * AI 宠物吐槽主动消息调度系统
 * 支持定时触发、事件驱动、状态感知的主动消息推送
 */

import type { 
  Pet, 
  PetPersonality, 
  RoastResult,
  PetEmotion
} from "../types";
import { 
  fetchPetRoast, 
  type RoastRequest
} from "./pet-mind.api";
import { 
  inferPersonality, 
  mockRoastResult,
  getStickersForPersonality 
} from "./pet-prompt";

// ============================================================
// 类型定义
// ============================================================

/** 触发类型 */
export type TriggerType = 
  | "time_based"      // 时间触发（每 N 分钟/小时）
  | "idle_too_long"   // 空闲太久未互动
  | "low_activity"    // 活动量低
  | "health_change"   // 健康数据变化
  | "mood_based"      // 心情变化
  | "manual"          // 手动触发
  | "startup";        // 页面启动时

/** 调度器配置 */
export interface RoastSchedulerConfig {
  /** 是否启用主动消息 */
  enabled: boolean;
  /** 最小间隔（毫秒） */
  minInterval: number;
  /** 最大间隔（毫秒） */
  maxInterval: number;
  /** 启动时是否立即发送一条欢迎消息 */
  showWelcomeOnStartup: boolean;
  /** 最大连续推送数量（防骚扰） */
  maxConsecutiveMessages: number;
}

/** 调度事件 */
export interface SchedulerEvent {
  id: string;
  type: TriggerType;
  timestamp: number;
  payload?: {
    mood?: string;
    activityLevel?: string;
    triggerReason?: string;
  };
}

/** 回调函数类型 */
export type OnRoastGenerated = (
  result: RoastResult,
  event: SchedulerEvent
) => void;

export type OnSchedulerStatusChange = (status: SchedulerStatus) => void;

/** 调度器状态 */
export interface SchedulerStatus {
  isActive: boolean;
  isPaused: boolean;
  lastTriggerTime?: number;
  messageCount: number;
  consecutiveCount: number;
  nextScheduledTime?: number;
}

// ============================================================
// 默认配置
// ============================================================

export const DEFAULT_SCHEDULER_CONFIG: RoastSchedulerConfig = {
  enabled: true,
  minInterval: 5 * 60 * 1000,      // 最小 5 分钟
  maxInterval: 15 * 60 * 1000,     // 最大 15 分钟
  showWelcomeOnStartup: true,
  maxConsecutiveMessages: 3         // 最多连续 3 条
};

// ============================================================
// 触发规则引擎
// ============================================================

interface TriggerRule {
  type: TriggerType;
  condition: () => boolean;
  priority: number; // 数值越小优先级越高
  contextBuilder: () => Partial<RoastRequest["context"]>;
  getQuickAction?: () => string;
}

/** 构建触发规则列表 */
function buildTriggerRules(
  pet: Pet,
  lastInteractionTime?: number
): TriggerRule[] {
  const now = Date.now();
  
  return [
    // 规则1：空闲太久（优先级最高）
    {
      type: "idle_too_long",
      condition: () => {
        if (!lastInteractionTime) return true; // 无记录视为空闲
        const idleMinutes = (now - lastInteractionTime) / (1000 * 60);
        return idleMinutes > 10; // 超过 10 分钟
      },
      priority: 1,
      contextBuilder: () => ({
        lastInteractionDays: Math.floor((now - (lastInteractionTime || now)) / (1000 * 60 * 60 * 24)),
        mood: "有点无聊"
      }),
      getQuickAction: () => "lonely"
    },
    
    // 规则2：时间触发（根据时间段调整内容）
    {
      type: "time_based",
      condition: () => {
        const hour = new Date().getHours();
        // 避免在深夜（23点-7点）频繁推送
        return hour >= 7 && hour < 23;
      },
      priority: 2,
      contextBuilder: () => {
        const hour = new Date().getHours();
        let timeHint = "";
        
        if (hour >= 7 && hour < 9) timeHint = "早上好~";
        else if (hour >= 11 && hour < 13) timeHint = "午饭时间到了！";
        else if (hour >= 18 && hour < 20) timeHint = "晚饭时间~";
        else if (hour >= 21 && hour < 23) timeHint = "该睡觉了...";
        
        return { timeOfDay: timeHint || undefined };
      },
      getQuickAction: () => {
        const hour = new Date().getHours();
        if (hour >= 11 && hour < 13) return "hungry";
        if (hour >= 18 && hour < 20) return "hungry";
        if (hour >= 21) return "sleepy";
        return undefined!;
      }
    },

    // 规则3：随机心情表达
    {
      type: "mood_based",
      condition: () => Math.random() > 0.6, // 40% 概率触发
      priority: 3,
      contextBuilder: () => ({
        mood: ["开心", "困了", "想玩", "饿了", "孤单"][Math.floor(Math.random() * 5)]
      }),
      getQuickAction: () => {
        const actions = ["play", "sleepy", "hungry", "lonely"];
        return actions[Math.floor(Math.random() * actions.length)];
      }
    }
  ];
}

// ============================================================
// 主调度器类
// ============================================================

export class PetRoastScheduler {
  private pet: Pet;
  private config: RoastSchedulerConfig;
  private status: SchedulerStatus;
  private timerId: NodeJS.Timeout | null = null;
  private rules: TriggerRule[] = [];
  private onRoastCallback: OnRoastGenerated | null = null;
  private onStatusCallback: OnSchedulerStatusChange | null = null;
  private lastInteractionTime: number = Date.now();

  constructor(
    pet: Pet,
    config: Partial<RoastSchedulerConfig> = {}
  ) {
    this.pet = pet;
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
    this.status = {
      isActive: false,
      isPaused: false,
      messageCount: 0,
      consecutiveCount: 0
    };
    
    // 初始化触发规则
    this.rules = buildTriggerRules(pet);
  }

  // ============================================================
  // 公共 API
  // ============================================================

  /**
   * 启动调度器
   */
  start(): void {
    if (!this.config.enabled) return;
    
    this.status.isActive = true;
    this.status.isPaused = false;
    
    // 如果配置了启动时显示欢迎消息
    if (this.config.showWelcomeOnStartup) {
      this.scheduleImmediateTrigger("startup");
    }

    // 启动定时调度
    this.scheduleNextTrigger();
    
    this.emitStatusChange();
    console.log(`[PetRoastScheduler] 已启动 - 宠物: ${this.pet.name}`);
  }

  /**
   * 暂停调度器
   */
  pause(): void {
    this.status.isPaused = true;
    
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    
    this.emitStatusChange();
  }

  /**
   * 恢复调度器
   */
  resume(): void {
    if (!this.status.isActive) return;
    
    this.status.isPaused = false;
    this.scheduleNextTrigger();
    this.emitStatusChange();
  }

  /**
   * 停止并销毁调度器
   */
  dispose(): void {
    this.pause();
    this.status.isActive = false;
    this.onRoastCallback = null;
    this.onStatusCallback = null;
  }

  /**
   * 手动触发一次吐槽
   */
  async manualTrigger(quickAction?: string): Promise<void> {
    await this.generateAndEmit("manual", quickAction);
  }

  /**
   * 更新最后交互时间（用于空闲检测）
   */
  updateLastInteraction(time?: number): void {
    this.lastInteractionTime = time || Date.now();
    // 重置连续计数
    this.status.consecutiveCount = 0;
  }

  /**
   * 注册回调
   */
  onRoast(callback: OnRoastGenerated): this {
    this.onRoastCallback = callback;
    return this;
  }

  onStatusChange(callback: OnSchedulerStatusChange): this {
    this.onStatusCallback = callback;
    return this;
  }

  /**
   * 获取当前状态
   */
  getStatus(): Readonly<SchedulerStatus> {
    return { ...this.status };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RoastSchedulerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================
  // 内部方法
  // ============================================================

  /**
   * 安排下一次触发
   */
  private scheduleNextTrigger(): void {
    if (this.status.isPaused || !this.status.isActive) return;

    // 清除已有定时器
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    // 计算下次触发时间（在 minInterval 和 maxInterval 之间随机）
    const interval = this.getRandomInterval();
    const nextTime = Date.now() + interval;

    this.status.nextScheduledTime = nextTime;

    console.log(`[PetRoastScheduler] 下次触发时间: ${new Date(nextTime).toLocaleTimeString()} (${Math.round(interval / 1000)}s后)`);

    this.timerId = setTimeout(() => {
      this.handleScheduledTrigger();
    }, interval);

    this.emitStatusChange();
  }

  /**
   * 处理定时触发
   */
  private async handleScheduledTrigger(): Promise<void> {
    // 检查是否超过最大连续数
    if (this.status.consecutiveCount >= this.config.maxConsecutiveMessages) {
      console.log("[PetRoastScheduler] 达到最大连续推送数，暂停本次");
      this.status.consecutiveCount = 0;
      this.scheduleNextTrigger(); // 继续安排下一次
      return;
    }

    // 选择触发的规则
    const triggeredRule = this.selectTriggerRule();

    if (triggeredRule) {
      const quickAction = triggeredRule.getQuickAction?.();
      await this.generateAndEmit(triggeredRule.type, quickAction, triggeredRule.contextBuilder());
    } else {
      // 无匹配规则时随机生成
      await this.generateAndEmit("time_based");
    }

    // 安排下一次
    this.scheduleNextTrigger();
  }

  /**
   * 立即触发（用于启动欢迎消息等场景）
   */
  private scheduleImmediateTrigger(type: TriggerType): void {
    setTimeout(() => {
      this.generateAndEmit(type).catch(console.error);
    }, 1500); // 延迟 1.5 秒，让页面先渲染
  }

  /**
   * 选择要触发的规则（基于优先级和条件）
   */
  private selectTriggerRule(): TriggerRule | null {
    // 过滤满足条件的规则，按优先级排序
    const eligibleRules = this.rules
      .filter(rule => rule.condition())
      .sort((a, b) => a.priority - b.priority);

    return eligibleRules[0] || null;
  }

  /**
   * 生成并发送吐槽结果
   */
  private async generateAndEmit(
    type: TriggerType,
    quickAction?: string,
    contextOverrides?: Partial<RoastRequest["context"]>
  ): Promise<void> {
    try {
      const personality = inferPersonality(this.pet.species, this.pet.breed);

      const result = await fetchPetRoast({
        pet: this.pet,
        quickAction,
        personality,
        context: {
          ...contextOverrides,
          lastInteractionDays: contextOverrides?.lastInteractionDays ?? 
            Math.floor((Date.now() - this.lastInteractionTime) / (1000 * 60 * 60 * 24))
        }
      });

      if (result.success && result.result) {
        // 创建事件对象
        const event: SchedulerEvent = {
          id: `roast_${Date.now()}`,
          type,
          timestamp: Date.now(),
          payload: {
            mood: contextOverrides?.mood,
            activityLevel: contextOverrides?.activityLevel,
            triggerReason: result.result.triggerReason
          }
        };

        // 更新状态
        this.status.messageCount++;
        this.status.consecutiveCount++;
        this.status.lastTriggerTime = Date.now();

        // 触发回调
        if (this.onRoastCallback) {
          this.onRoastCallback(result.result, event);
        }

        this.emitStatusChange();
      }
    } catch (error) {
      console.error("[PetRoastScheduler] 生成吐槽失败:", error);
    }
  }

  /**
   * 获取随机间隔
   */
  private getRandomInterval(): number {
    const { minInterval, maxInterval } = this.config;
    return Math.floor(minInterval + Math.random() * (maxInterval - minInterval));
  }

  /**
   * 发送状态变更通知
   */
  private emitStatusChange(): void {
    if (this.onStatusCallback) {
      this.onStatusCallback({ ...this.status });
    }
  }
}

// ============================================================
// 工厂函数：快速创建调度器
// ============================================================

/**
 * 创建并启动一个宠物吐槽调度器
 */
export function createPetRoastScheduler(
  pet: Pet,
  config?: Partial<RoastSchedulerConfig>,
  callbacks?: {
    onRoast?: OnRoastGenerated;
    onStatusChange?: OnSchedulerStatusChange;
  }
): PetRoastScheduler {
  const scheduler = new PetRoastScheduler(pet, config);

  if (callbacks?.onRoast) scheduler.onRoast(callbacks.onRoast);
  if (callbacks?.onStatusChange) scheduler.onStatusChange(callbacks.onStatusChange);

  scheduler.start();

  return scheduler;
}
