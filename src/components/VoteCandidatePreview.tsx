import type { CSSProperties } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarRange,
  ChevronRight,
  Clock3,
  Crosshair,
  HeartHandshake,
  Image,
  LocateFixed,
  PawPrint,
  Play,
  PlayCircle,
  Radar,
  Route,
  Scissors,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Tv2,
  Users2,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { VotingCandidate } from "../lib/vote.api";

type FeatureId =
  | "location"
  | "match"
  | "chat"
  | "food"
  | "hospital"
  | "beauty"
  | "tv"
  | "funeral"
  | "default";

interface HighlightItem {
  title: string;
  desc: string;
  Icon: LucideIcon;
}

interface FeatureConfig {
  id: FeatureId;
  matchers: string[];
  from: string;
  to: string;
  accent: string;
  subtitle: string;
  status: string;
  liveLabel: string;
  sceneTitle: string;
  sceneHint: string;
  ctaLabel: string;
  ctaNote: string;
  progress: number;
  stats: string[];
  highlights: HighlightItem[];
}

const FEATURE_CONFIGS: FeatureConfig[] = [
  {
    id: "location",
    matchers: ["location", "定位", "追踪", "轨迹"],
    from: "#6658F7",
    to: "#8F8CFF",
    accent: "#4F46E5",
    subtitle: "打开后就是宠物实时轨迹页，地图、围栏、异常提醒会一起出现。",
    status: "定位能力灰度开发中",
    liveLabel: "实时追踪中",
    sceneTitle: "上线后会看到的定位页",
    sceneHint: "地图主画面 + 围栏状态 + 今日轨迹",
    ctaLabel: "预约定位上线提醒",
    ctaNote: "支持围栏预警、路线回放和异常停留提醒。",
    progress: 64,
    stats: ["安全围栏 2 个", "定位误差 < 15m", "低电量提醒"],
    highlights: [
      { title: "实时轨迹", desc: "分钟级位置刷新", Icon: LocateFixed },
      { title: "安全围栏", desc: "离开范围主动提醒", Icon: ShieldCheck },
      { title: "路线回放", desc: "按日查看活动轨迹", Icon: Route },
      { title: "异常告警", desc: "停留过久即时提醒", Icon: Bell },
    ],
  },
  {
    id: "match",
    matchers: ["match", "匹配", "交友", "配对"],
    from: "#FB923C",
    to: "#F472B6",
    accent: "#EA580C",
    subtitle: "点开就是宠友匹配界面，能看到契合度、兴趣标签和发起认识入口。",
    status: "社交匹配引擎联调中",
    liveLabel: "今日有新匹配",
    sceneTitle: "上线后会看到的匹配页",
    sceneHint: "卡片堆 + 契合度 + 兴趣标签",
    ctaLabel: "预约匹配上线提醒",
    ctaNote: "适合想给宠物找玩伴、找同城遛宠搭子的用户。",
    progress: 52,
    stats: ["同城匹配 28 组", "性格契合 86%", "步行 1.2km 内"],
    highlights: [
      { title: "智能配对", desc: "按性格和习惯推荐", Icon: HeartHandshake },
      { title: "附近优先", desc: "优先筛选近距离宠友", Icon: Radar },
      { title: "兴趣标签", desc: "是否活泼一目了然", Icon: Sparkles },
      { title: "快速认识", desc: "一键发起打招呼", Icon: Users2 },
    ],
  },
  {
    id: "chat",
    matchers: ["chat", "聊天", "同城", "约伴"],
    from: "#F472B6",
    to: "#FB7185",
    accent: "#DB2777",
    subtitle: "打开就是附近宠主的聊天主页，约遛、协寻和活动频道不会混在一起。",
    status: "同城社交频道内测中",
    liveLabel: "附近频道活跃",
    sceneTitle: "上线后会看到的聊天页",
    sceneHint: "消息流 + 约遛活动 + 协寻广播",
    ctaLabel: "预约聊天上线提醒",
    ctaNote: "支持同城约遛、活动组队和走失协寻通知。",
    progress: 71,
    stats: ["附近频道 12 个", "协寻广播 3 条", "本周活动 6 场"],
    highlights: [
      { title: "频道列表", desc: "按附近和话题分层", Icon: Users2 },
      { title: "约遛活动", desc: "一键报名加入活动", Icon: CalendarRange },
      { title: "协寻广播", desc: "紧急信息优先置顶", Icon: Search },
      { title: "轻社交", desc: "先看宠物再开聊", Icon: HeartHandshake },
    ],
  },
  {
    id: "food",
    matchers: ["food", "食品", "粮", "喂养"],
    from: "#F59E0B",
    to: "#F97316",
    accent: "#D97706",
    subtitle: "打开先看到的是推荐粮和营养评分，再往下是订阅配送和喂养计划。",
    status: "AI 喂养服务开发中",
    liveLabel: "配方已为你生成",
    sceneTitle: "上线后会看到的食品页",
    sceneHint: "推荐粮卡片 + 营养指标 + 订阅配送",
    ctaLabel: "预约食品上线提醒",
    ctaNote: "会结合体重、年龄和敏感原料生成推荐结果。",
    progress: 46,
    stats: ["营养评分 92", "两餐计划已同步", "次月自动配送"],
    highlights: [
      { title: "AI 配方", desc: "结合宠物画像推荐", Icon: Sparkles },
      { title: "营养评分", desc: "关键指标清晰展示", Icon: UtensilsCrossed },
      { title: "订阅配送", desc: "缺粮前自动补货", Icon: CalendarRange },
      { title: "原料安全", desc: "敏感成分提前标记", Icon: ShieldCheck },
    ],
  },
  {
    id: "hospital",
    matchers: ["hospital", "医院", "门诊", "医生"],
    from: "#F43F5E",
    to: "#FB7185",
    accent: "#E11D48",
    subtitle: "用户点开会先看到附近医院和可预约医生，再决定走普通门诊还是急诊通道。",
    status: "线上挂号能力建设中",
    liveLabel: "附近医院可预约",
    sceneTitle: "上线后会看到的医院页",
    sceneHint: "医院榜单 + 医生排班 + 急诊入口",
    ctaLabel: "预约医院上线提醒",
    ctaNote: "适合快速找医院、挂号、查看夜诊信息。",
    progress: 68,
    stats: ["附近医院 8 家", "夜间门诊开放", "急诊入口常驻"],
    highlights: [
      { title: "医院榜单", desc: "附近可达医院排序", Icon: Stethoscope },
      { title: "在线挂号", desc: "按医生时段预约", Icon: CalendarRange },
      { title: "急诊入口", desc: "紧急场景快速处理", Icon: Bell },
      { title: "就诊安心", desc: "口碑和距离同屏对比", Icon: ShieldCheck },
    ],
  },
  {
    id: "beauty",
    matchers: ["beauty", "美容", "洗护", "造型"],
    from: "#D946EF",
    to: "#F472B6",
    accent: "#C026D3",
    subtitle: "打开就是美容预约页，先看造型风格，再选套餐和时间，不会像工具页一样生硬。",
    status: "美容服务预约中台开发中",
    liveLabel: "今日档期可约",
    sceneTitle: "上线后会看到的美容页",
    sceneHint: "风格切换 + 套餐卡 + 时间槽位",
    ctaLabel: "预约美容上线提醒",
    ctaNote: "上线后可浏览门店、查看作品集并直接预约。",
    progress: 57,
    stats: ["热门风格 9 种", "洗护套餐 4 档", "今日剩余 6 个时段"],
    highlights: [
      { title: "风格预览", desc: "先看效果再下单", Icon: Scissors },
      { title: "套餐对比", desc: "基础洗护到精修齐全", Icon: Star },
      { title: "预约时段", desc: "空档时间一屏展示", Icon: Clock3 },
      { title: "门店评分", desc: "优先推荐高口碑门店", Icon: ShieldCheck },
    ],
  },
  {
    id: "tv",
    matchers: ["tv", "视频", "频道", "陪伴"],
    from: "#4F46E5",
    to: "#3B82F6",
    accent: "#4338CA",
    subtitle: "这不是普通宣传页，而是宠物内容频道的真实样子：海报、片单和陪伴模式都会出现。",
    status: "陪伴视频频道筹备中",
    liveLabel: "推荐片单已生成",
    sceneTitle: "上线后会看到的 TV 页",
    sceneHint: "频道海报 + 片单队列 + 陪伴模式",
    ctaLabel: "预约 TV 上线提醒",
    ctaNote: "适合独处陪伴、安抚情绪和睡前放松。",
    progress: 61,
    stats: ["推荐频道 5 个", "陪伴模式 3 种", "播放清单持续更新"],
    highlights: [
      { title: "频道海报", desc: "内容风格一眼可分", Icon: Tv2 },
      { title: "智能推荐", desc: "按情绪生成片单", Icon: Sparkles },
      { title: "播放接力", desc: "自动衔接下一段内容", Icon: PlayCircle },
      { title: "独处陪伴", desc: "外出时也能稳定陪伴", Icon: Bell },
    ],
  },
  {
    id: "funeral",
    matchers: ["funeral", "殡葬", "纪念", "告别"],
    from: "#8B7BA0",
    to: "#C4B5FD",
    accent: "#7C6D94",
    subtitle: "这个页面会更克制温柔，核心是让用户清楚看到纪念服务、流程和留念入口。",
    status: "纪念服务方案整理中",
    liveLabel: "纪念空间筹备中",
    sceneTitle: "上线后会看到的纪念页",
    sceneHint: "服务卡片 + 仪式流程 + 相册入口",
    ctaLabel: "预约纪念服务提醒",
    ctaNote: "页面会保持温和表达，不过度营销，重点是陪伴和留念。",
    progress: 43,
    stats: ["纪念方案 3 类", "留念服务可选", "流程引导更温和"],
    highlights: [
      { title: "告别流程", desc: "关键步骤清晰说明", Icon: HeartHandshake },
      { title: "纪念相册", desc: "整理照片与文字回忆", Icon: Image },
      { title: "纪念文案", desc: "辅助生成留念内容", Icon: Sparkles },
      { title: "陪伴指引", desc: "减少决策时的慌乱感", Icon: ShieldCheck },
    ],
  },
];

const DEFAULT_CONFIG: FeatureConfig = {
  id: "default",
  matchers: [],
  from: "#7C3AED",
  to: "#EC4899",
  accent: "#7C3AED",
  subtitle: "这是一个专属功能预览页，会把真实使用场景、关键模块和上线状态展示出来。",
  status: "功能预览筹备中",
  liveLabel: "界面概念已生成",
  sceneTitle: "上线后会看到的主界面",
  sceneHint: "核心模块会在这里直观展示",
  ctaLabel: "预约上线提醒",
  ctaNote: "功能上线后会第一时间提醒你体验。",
  progress: 58,
  stats: ["界面方案已成型", "交互结构已确认", "正在准备内测"],
  highlights: [
    { title: "场景化界面", desc: "先看懂再决定投票", Icon: Sparkles },
    { title: "模块清晰", desc: "重要功能一屏呈现", Icon: ShieldCheck },
    { title: "体验入口", desc: "关键操作一屏可见", Icon: Clock3 },
    { title: "上线提醒", desc: "不怕错过首发体验", Icon: Bell },
  ],
};

interface Props {
  candidate: VotingCandidate;
  onClose: () => void;
}

function resolveFeature(candidate: VotingCandidate): FeatureConfig {
  const key = `${candidate.key || ""} ${candidate.title || ""}`.toLowerCase();
  return FEATURE_CONFIGS.find((item) => item.matchers.some((token) => key.includes(token.toLowerCase()))) || DEFAULT_CONFIG;
}



function HeroVisual({ candidate, feature }: { candidate: VotingCandidate; feature: FeatureConfig }) {
  const hasImage = !!candidate.cover_image;
  return (
    <div className={`vcp-hero-visual vcp-hero-visual--${feature.id}`}>
      {hasImage ? (
        <img
          src={candidate.cover_image!}
          alt={candidate.title}
          className="vcp-hero-image"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextElementSibling?.removeAttribute("hidden");
          }}
        />
      ) : null}
      <div className="vcp-hero-fallback" hidden={hasImage}>
        <PawPrint size={56} strokeWidth={1.8} />
      </div>
      <div className="vcp-hero-floating-card">
        <span>{feature.sceneHint}</span>
        <strong>{candidate.vote_count} 票正在关注</strong>
      </div>
    </div>
  );
}

function renderScene(feature: FeatureConfig) {
  switch (feature.id) {
    case "location":
      return (
        <div className="vcp-scene-grid vcp-scene-grid--location">
          <article className="vcp-panel vcp-map-panel">
            <div className="vcp-map-ring vcp-map-ring--one" />
            <div className="vcp-map-ring vcp-map-ring--two" />
            <span className="vcp-map-pin vcp-map-pin--pet"><Radar size={15} /></span>
            <span className="vcp-map-pin vcp-map-pin--home"><Crosshair size={14} /></span>
            <div className="vcp-map-route-line" />
            <div className="vcp-map-label">安全围栏已开启</div>
          </article>
          <article className="vcp-panel vcp-mini-panel">
            <span>当前位置</span>
            <strong>滨江步道 · 200m</strong>
            <small>2 分钟前更新</small>
          </article>
          <article className="vcp-panel vcp-mini-panel">
            <span>今日轨迹</span>
            <strong>4.8 km</strong>
            <small>含 2 次停留提醒</small>
          </article>
        </div>
      );
    case "match":
      return (
        <div className="vcp-scene-grid vcp-scene-grid--match">
          <article className="vcp-panel vcp-match-card vcp-match-card--front">
            <div className="vcp-avatar-stack"><span /><span /></div>
            <strong>柯基 Mia · 契合度 86%</strong>
            <small>活泼 / 喜欢追球 / 周末常去中央公园</small>
            <div className="vcp-meter"><span style={{ width: "86%" }} /></div>
          </article>
          <article className="vcp-panel vcp-match-card vcp-match-card--back">
            <span>已推荐标签</span>
            <div className="vcp-tag-row"><em>爱社交</em><em>小型犬</em><em>步行 1.2km</em></div>
          </article>
          <article className="vcp-panel vcp-action-panel">
            <span>认识入口</span>
            <strong>先看宠物，再决定要不要打招呼</strong>
            <ChevronRight size={16} />
          </article>
        </div>
      );
    case "chat":
      return (
        <div className="vcp-scene-grid vcp-scene-grid--chat">
          <article className="vcp-panel vcp-chat-panel">
            <span className="vcp-pill">中央公园约遛群</span>
            <div className="vcp-chat-bubble vcp-chat-bubble--other">周六上午一起遛狗吗？</div>
            <div className="vcp-chat-bubble vcp-chat-bubble--self">可以，我家边牧也想社交。</div>
          </article>
          <article className="vcp-panel vcp-list-panel">
            <strong>协寻广播</strong>
            <small>刚发布：奶油色布偶猫，走失于万象城附近</small>
            <ChevronRight size={16} />
          </article>
          <article className="vcp-panel vcp-list-panel">
            <strong>线下活动</strong>
            <small>本周 3 场宠物聚会可报名</small>
            <ChevronRight size={16} />
          </article>
        </div>
      );
    case "food":
      return (
        <div className="vcp-scene-grid vcp-scene-grid--food">
          <article className="vcp-panel vcp-product-panel">
            <span>推荐主粮</span>
            <strong>幼犬高蛋白鲜肉粮</strong>
            <div className="vcp-meter"><span style={{ width: "92%" }} /></div>
            <small>蛋白充足，适合活跃型宠物</small>
          </article>
          <article className="vcp-panel vcp-mini-panel">
            <span>喂养计划</span>
            <strong>07:30 / 18:30</strong>
            <small>已同步到提醒中心</small>
          </article>
          <article className="vcp-panel vcp-mini-panel">
            <span>配送订阅</span>
            <strong>下次补货 6 月 22 日</strong>
            <small>库存不足前自动提醒</small>
          </article>
        </div>
      );
    case "hospital":
      return (
        <div className="vcp-scene-grid vcp-scene-grid--hospital">
          <article className="vcp-panel vcp-hospital-panel">
            <span>最近可约医院</span>
            <strong>爱宠 24h 医疗中心</strong>
            <small>4.9 分 · 1.4 km · 夜诊开放</small>
          </article>
          <article className="vcp-panel vcp-mini-panel">
            <span>王医生</span>
            <strong>19:30 可预约</strong>
            <small>皮肤科 / 线上问诊支持</small>
          </article>
          <article className="vcp-panel vcp-alert-panel">
            <Bell size={15} />
            <div>
              <strong>急诊绿色通道</strong>
              <small>异常情况可直接进入急诊引导</small>
            </div>
          </article>
        </div>
      );
    case "beauty":
      return (
        <div className="vcp-scene-grid vcp-scene-grid--beauty">
          <article className="vcp-panel vcp-style-panel">
            <div className="vcp-tag-row"><em>清爽短修</em><em>圆脸修饰</em><em>赛级护理</em></div>
            <strong>先看风格，再选美容师</strong>
          </article>
          <article className="vcp-panel vcp-product-panel">
            <span>热门套餐</span>
            <strong>洗护 + 精修 · 168 元</strong>
            <small>含指甲修剪、耳部护理与造型建议</small>
          </article>
          <article className="vcp-panel vcp-mini-panel">
            <span>今日档期</span>
            <strong>14:00 / 16:30 / 18:00</strong>
            <small>高峰时段已自动隐藏不可约时间</small>
          </article>
        </div>
      );
    case "tv":
      return (
        <div className="vcp-scene-grid vcp-scene-grid--tv">
          <article className="vcp-panel vcp-player-panel">
            <button className="vcp-play-btn" type="button" aria-label="播放预览">
              <Play size={18} fill="currentColor" />
            </button>
            <div>
              <span>今日推荐</span>
              <strong>独处安抚频道</strong>
            </div>
          </article>
          <article className="vcp-panel vcp-list-panel">
            <strong>片单队列</strong>
            <small>窗边鸟鸣、慢节奏散步、安抚白噪音</small>
            <ChevronRight size={16} />
          </article>
          <article className="vcp-panel vcp-style-panel">
            <div className="vcp-tag-row"><em>安抚</em><em>助眠</em><em>独处</em></div>
            <strong>不同情绪下自动切换频道</strong>
          </article>
        </div>
      );
    case "funeral":
      return (
        <div className="vcp-scene-grid vcp-scene-grid--funeral">
          <article className="vcp-panel vcp-memory-panel">
            <span>纪念服务</span>
            <strong>温柔告别 · 留住最好的记忆</strong>
            <small>流程解释、留念相册和纪念文案整合在同一页</small>
          </article>
          <article className="vcp-panel vcp-style-panel">
            <div className="vcp-tag-row"><em>预约</em><em>仪式</em><em>留念</em></div>
            <strong>关键流程一步步引导，不催促用户决策</strong>
          </article>
          <article className="vcp-panel vcp-mini-panel">
            <span>纪念相册</span>
            <strong>照片与文字分组保存</strong>
            <small>可继续回看和补充纪念内容</small>
          </article>
        </div>
      );
    default:
      return (
        <div className="vcp-scene-grid vcp-scene-grid--default">
          <article className="vcp-panel vcp-memory-panel">
            <span>核心界面</span>
            <strong>这里会展示功能最关键的使用场景</strong>
            <small>比纯文案更直观，让用户快速理解上线后的样子。</small>
          </article>
        </div>
      );
  }
}

export default function VoteCandidatePreview({ candidate, onClose }: Props) {
  const feature = resolveFeature(candidate);

  return (
    <div className="vcp-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${candidate.title} 功能预览`}>
      <section className={`vcp-phone vcp-phone--${feature.id}`} onClick={(event) => event.stopPropagation()}>
        <header className="vcp-nav">
          <button className="vcp-nav-btn" type="button" onClick={onClose} aria-label="关闭预览">
            <ArrowLeft size={20} strokeWidth={2.2} />
          </button>
          <div className="vcp-nav-title">
            <PawPrint size={16} strokeWidth={2.4} />
            <span>即将上线</span>
          </div>
          <button className="vcp-nav-btn" type="button" aria-label="分享预览">
            <Share2 size={18} strokeWidth={2.2} />
          </button>
        </header>

        <main className="vcp-scroll">
          <section
            className={`vcp-hero vcp-hero--${feature.id}`}
            style={{
              "--vcp-from": feature.from,
              "--vcp-to": feature.to,
              "--vcp-accent": feature.accent,
            } as CSSProperties}
          >
            <div className="vcp-hero-noise" aria-hidden="true" />
            <div className="vcp-hero-copy">
              <h2>{candidate.title}</h2>
              <p>{feature.subtitle}</p>
              <div className="vcp-stat-row">
                {feature.stats.map((item) => (
                  <span className="vcp-stat-chip" key={item}>{item}</span>
                ))}
              </div>
            </div>
            <HeroVisual candidate={candidate} feature={feature} />
            <div className="vcp-live-chip">
              <Radar size={14} strokeWidth={2.2} />
              <span>{feature.liveLabel}</span>
            </div>
          </section>

          <section className="vcp-card vcp-scene-card" aria-labelledby="vcp-scene-title">
            <div className="vcp-card-header">
              <div>
                <h3 id="vcp-scene-title">{feature.sceneTitle}</h3>
                <p>{feature.sceneHint}</p>
              </div>
              <span>Scene</span>
            </div>
            {renderScene(feature)}
          </section>

          <section className="vcp-card vcp-feature-card" aria-labelledby="vcp-feature-title">
            <div className="vcp-card-header">
              <div>
                <h3 id="vcp-feature-title">功能亮点</h3>
                <p>用户打开后，最容易感知到的核心能力</p>
              </div>
              <span>Preview</span>
            </div>
            <div className="vcp-highlight-grid">
              {feature.highlights.map(({ Icon, title, desc }) => (
                <article className="vcp-highlight-item" key={title}>
                  <span className="vcp-highlight-icon" style={{ color: feature.accent }}>
                    <Icon size={21} strokeWidth={2.1} />
                  </span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </article>
              ))}
            </div>
          </section>





          <section className="vcp-cta" aria-label="预约上线提醒">
            <button
              className="vcp-cta-button"
              type="button"
              onClick={onClose}
              style={{ background: `linear-gradient(135deg, ${feature.from}, ${feature.to})` }}
            >
              <Bell size={18} strokeWidth={2.3} />
              <span>{feature.ctaLabel}</span>
            </button>
            <small>{feature.ctaNote}</small>
          </section>
        </main>
      </section>
    </div>
  );
}
