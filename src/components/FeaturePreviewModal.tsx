import { X, Sparkles } from "lucide-react";

// ══════════════════════════════════════════════════
// 数据类型
// ══════════════════════════════════════════════════

interface Milestone {
  label: string;
  done: boolean;
  active: boolean;
}

interface Highlight {
  emoji: string;
  text: string;
}

export interface FeaturePreviewData {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  heroImageUrl: string;
  highlights: Highlight[];
  progress: number;
  milestones: Milestone[];
}

// ══════════════════════════════════════════════════
// 6个功能静态预览数据
// ══════════════════════════════════════════════════

const PREVIEW_DATA: Record<string, FeaturePreviewData> = {
  funeral: {
    id: "funeral",
    title: "宠物殡葬",
    subtitle: "温柔告别，留住最好的记忆",
    emoji: "🕊️",
    gradientFrom: "#9B8EA8",
    gradientTo: "#C5B8D8",
    accentColor: "#9B8EA8",
    heroImageUrl:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&h=400&fit=crop&q=80",
    highlights: [
      { emoji: "🌸", text: "个性化告别仪式" },
      { emoji: "📷", text: "纪念相册生成" },
      { emoji: "📝", text: "AI 纪念碑文创作" },
      { emoji: "🕯️", text: "线上追思空间" },
    ],
    progress: 42,
    milestones: [
      { label: "需求分析", done: true, active: false },
      { label: "设计开发", done: false, active: true },
      { label: "内部测试", done: false, active: false },
      { label: "上线准备", done: false, active: false },
    ],
  },
  tv: {
    id: "tv",
    title: "宠物 TV",
    subtitle: "专属宠物的治愈视频频道",
    emoji: "🎬",
    gradientFrom: "#4E8FD1",
    gradientTo: "#7BB8F0",
    accentColor: "#4E8FD1",
    heroImageUrl:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop&q=80",
    highlights: [
      { emoji: "📺", text: "宠物舒缓专属视频" },
      { emoji: "🎵", text: "宠物白噪音陪伴" },
      { emoji: "🐾", text: "萌宠治愈影单" },
      { emoji: "🎯", text: "按情绪智能推荐" },
    ],
    progress: 58,
    milestones: [
      { label: "需求分析", done: true, active: false },
      { label: "设计开发", done: true, active: false },
      { label: "内部测试", done: false, active: true },
      { label: "上线准备", done: false, active: false },
    ],
  },
  food: {
    id: "food",
    title: "宠物食品",
    subtitle: "AI 定制，科学喂养每一餐",
    emoji: "🥫",
    gradientFrom: "#E87A3A",
    gradientTo: "#F5A870",
    accentColor: "#E87A3A",
    heroImageUrl:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=400&fit=crop&q=80",
    highlights: [
      { emoji: "🧠", text: "AI 营养配方推荐" },
      { emoji: "⚖️", text: "按体重定制份量" },
      { emoji: "🚚", text: "订阅定期配送" },
      { emoji: "🏷️", text: "成分安全检测报告" },
    ],
    progress: 35,
    milestones: [
      { label: "需求分析", done: true, active: false },
      { label: "设计开发", done: false, active: true },
      { label: "内部测试", done: false, active: false },
      { label: "上线准备", done: false, active: false },
    ],
  },
  chat: {
    id: "chat",
    title: "同城聊天",
    subtitle: "遇见附近的宠物伙伴",
    emoji: "💬",
    gradientFrom: "#E88AB0",
    gradientTo: "#F5B0CC",
    accentColor: "#E88AB0",
    heroImageUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&q=80",
    highlights: [
      { emoji: "📍", text: "附近宠物主互动" },
      { emoji: "🐕", text: "遛狗约伴广场" },
      { emoji: "🔍", text: "走失宠物协寻" },
      { emoji: "🎉", text: "宠物主题活动" },
    ],
    progress: 70,
    milestones: [
      { label: "需求分析", done: true, active: false },
      { label: "设计开发", done: true, active: false },
      { label: "内部测试", done: true, active: false },
      { label: "上线准备", done: false, active: true },
    ],
  },
  hospital: {
    id: "hospital",
    title: "宠物医院",
    subtitle: "附近医院，一键在线预约",
    emoji: "🏥",
    gradientFrom: "#E85A71",
    gradientTo: "#F58A9A",
    accentColor: "#E85A71",
    heroImageUrl:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop&q=80",
    highlights: [
      { emoji: "🗺️", text: "附近医院地图" },
      { emoji: "📅", text: "在线挂号预约" },
      { emoji: "⭐", text: "医生口碑评价" },
      { emoji: "🚑", text: "急诊绿色通道" },
    ],
    progress: 65,
    milestones: [
      { label: "需求分析", done: true, active: false },
      { label: "设计开发", done: true, active: false },
      { label: "内部测试", done: false, active: true },
      { label: "上线准备", done: false, active: false },
    ],
  },
  beauty: {
    id: "beauty",
    title: "美容预约",
    subtitle: "精致造型，让毛孩子更美",
    emoji: "✨",
    gradientFrom: "#C46EC8",
    gradientTo: "#DFA0E0",
    accentColor: "#C46EC8",
    heroImageUrl:
      "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=600&h=400&fit=crop&q=80",
    highlights: [
      { emoji: "🏪", text: "周边门店浏览" },
      { emoji: "💇", text: "造型模板选择" },
      { emoji: "🏠", text: "上门美容服务" },
      { emoji: "📸", text: "美容前后对比" },
    ],
    progress: 48,
    milestones: [
      { label: "需求分析", done: true, active: false },
      { label: "设计开发", done: true, active: false },
      { label: "内部测试", done: false, active: true },
      { label: "上线准备", done: false, active: false },
    ],
  },
};



// ══════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════

interface Props {
  featureId: string;
  onClose: () => void;
}

export default function FeaturePreviewModal({ featureId, onClose }: Props) {
  const data = PREVIEW_DATA[featureId];
  if (!data) return null;



  return (
    <div className="fp-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${data.title} 功能预览`}>
      <div className="fp-sheet" onClick={(e) => e.stopPropagation()}>

        {/* ── Drag Indicator ── */}
        <div className="fp-drag-indicator" />

        {/* ── 英雄封面区 ── */}
        <div
          className="fp-hero"
          style={{ background: `linear-gradient(150deg, ${data.gradientFrom} 0%, ${data.gradientTo} 100%)` }}
        >
          {/* 光晕装饰层 */}
          <div className="fp-hero-glow fp-hero-glow--tl" />
          <div className="fp-hero-glow fp-hero-glow--br" />

          {/* 封面图 */}
          <div className="fp-hero-img-wrap">
            <img
              src={data.heroImageUrl}
              alt={data.title}
              className="fp-hero-img"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            {/* 图片遮罩渐变 */}
            <div className="fp-hero-img-mask" />
            {/* Emoji 徽章 */}
            <div className="fp-hero-emoji-badge">{data.emoji}</div>
          </div>

          {/* 文字内容 */}
          <div className="fp-hero-content">
            <h2 className="fp-hero-title">{data.title}</h2>
            <p className="fp-hero-subtitle">{data.subtitle}</p>
          </div>

          {/* 关闭按钮 */}
          <button className="fp-close-btn" onClick={onClose} aria-label="关闭预览">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── 可滚动内容区 ── */}
        <div className="fp-scroll-body">

          {/* 功能亮点 */}
          <div className="fp-section">
            <div className="fp-section-header">
              <Sparkles size={14} style={{ color: data.accentColor }} strokeWidth={2.5} />
              <h3 className="fp-section-title">功能亮点</h3>
            </div>
            <div className="fp-highlights-list">
              {data.highlights.map((h, i) => (
                <div key={i} className="fp-highlight-row">
                  <div className="fp-highlight-icon-wrap" style={{ background: `${data.gradientFrom}18` }}>
                    <span className="fp-highlight-emoji">{h.emoji}</span>
                  </div>
                  <span className="fp-highlight-text">{h.text}</span>
                  <div className="fp-highlight-chevron">›</div>
                </div>
              ))}
            </div>
          </div>



          {/* 底部安全区 */}
          <div className="fp-bottom-safe" />
        </div>
      </div>
    </div>
  );
}
