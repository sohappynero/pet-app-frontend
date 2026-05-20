import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  Lightbulb,
  AlertCircle,
  Heart,
  Send,
  Sparkles,
  Tag,
  MessageSquare,
} from "lucide-react";
import { submitFeedback } from "../lib/api";

type FeedbackType = "bug" | "feature" | "complaint" | "praise";
type TagKey = string;

const FEEDBACK_TYPES: { key: FeedbackType; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { key: "bug", label: "功能异常", icon: <Zap size={16} />, color: "#f5576c", bg: "#fff0f3" },
  { key: "feature", label: "功能建议", icon: <Lightbulb size={16} />, color: "#f0932b", bg: "#fef5e8" },
  { key: "complaint", label: "体验投诉", icon: <AlertCircle size={16} />, color: "#e17055", bg: "#fef0e8" },
  { key: "praise", label: "好评表扬", icon: <Heart size={16} />, color: "#fd79a8", bg: "#fef0f6" },
];

const QUICK_TAGS: { key: TagKey; label: string; color?: string }[] = [
  { key: "ui", label: "界面优化" },
  { key: "missing", label: "功能缺失" },
  { key: "lag", label: "运行卡顿" },
  { key: "slow", label: "加载慢" },
  { key: "complex", label: "操作复杂" },
  { key: "other", label: "其他" },
];

const FAQ = [
  { q: "反馈多久能处理？", a: "一般1-3个工作日内处理" },
  { q: "如何查看反馈进度？", a: "提交后会生成反馈编号，可在「我的反馈」中查看" },
];

export default function FeedbackCenter() {
  const navigate = useNavigate();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("feature");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagKey[]>([]);
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleTag = (key: TagKey) => {
    setSelectedTags((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await submitFeedback({
        feedback_type: feedbackType,
        content: content.trim(),
        tags: selectedTags,
        contact: contact.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setContent("");
        setContact("");
        setSelectedTags([]);
        navigate(-1);
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="fb-page">
      {/* Hero */}
      <section className="fb-hero">
        <div className="fb-hero-bg">
          <div className="fb-hero-gradient" />
          <div className="fb-hero-orb fb-orb-a" />
          <div className="fb-hero-orb fb-orb-b" />
          <div className="fb-hero-dots" />
        </div>
        <div className="fb-hero-inner">
          <button type="button" className="fb-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="fb-hero-content">
            <div className="fb-hero-icon-wrap">
              <MessageSquare size={22} />
            </div>
            <h1 className="fb-hero-title">吐槽中心</h1>
            <p className="fb-hero-desc">您的每一条反馈都是动力 💬</p>
          </div>
          {/* 装饰元素 */}
          <span className="fb-float-ele fb-fe-1">💡</span>
          <span className="fb-float-ele fb-fe-2">✨</span>
          <span className="fb-float-ele fb-fe-3">💌</span>
        </div>
      </section>

      {/* 表单区域 */}
      <section className="fb-body">
        {/* 反馈类型 */}
        <div className="fb-card">
          <div className="fb-card-header">
            <div className="fb-card-tag">
              <Sparkles size={12} />
              反馈类型
            </div>
          </div>
          <div className="fb-type-grid">
            {FEEDBACK_TYPES.map((t) => (
              <button
                key={t.key}
                className={`fb-type-chip${feedbackType === t.key ? " active" : ""}`}
                onClick={() => setFeedbackType(t.key)}
                style={feedbackType === t.key
                  ? { background: t.bg, color: t.color, borderColor: t.color }
                  : {}
                }
              >
                <span className="fb-type-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 快速标签 */}
        <div className="fb-card">
          <div className="fb-card-header">
            <div className="fb-card-tag fb-tag-warm">
              <Tag size={12} />
              快速标签
            </div>
          </div>
          <div className="fb-tags-row">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag.key}
                className={`fb-tag-pill${selectedTags.includes(tag.key) ? " active" : ""}`}
                onClick={() => toggleTag(tag.key)}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* 反馈内容 */}
        <div className="fb-card">
          <div className="fb-card-header">
            <div className="fb-card-tag fb-tag-blue">
              <MessageSquare size={12} />
              反馈内容
            </div>
          </div>
          <div className="fb-textarea-wrap">
            <textarea
              className="fb-textarea"
              maxLength={500}
              placeholder="请详细描述您遇到的问题或建议..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <span className="fb-char-count">{content.length}/500</span>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="fb-card">
          <div className="fb-card-header">
            <div className="fb-card-tag fb-tag-green">
              💬 联系方式（选填）
            </div>
          </div>
          <input
            className="fb-input"
            placeholder="手机或邮箱，方便我们联系您"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        {/* 常见问题 */}
        <div className="fb-card">
          <div className="fb-card-header">
            <div className="fb-card-tag fb-tag-orange">
              🤔 常见问题
            </div>
          </div>
          {FAQ.map((item) => (
            <div key={item.q} className="fb-faq-item">
              <div className="fb-faq-q">Q: {item.q}</div>
              <div className="fb-faq-a">A: {item.a}</div>
            </div>
          ))}
        </div>

        {/* 提交按钮 */}
        {errorMsg && <p className="fb-msg-error">{errorMsg}</p>}
        <button
          className={`fb-submit-btn${submitted ? " submitted" : ""}`}
          onClick={handleSubmit}
          disabled={submitted || submitting}
        >
          <Send size={16} />
          {submitted ? "提交成功 ✓" : submitting ? "提交中..." : "提交反馈"}
        </button>

        <div className="fb-bottom-spacer" />
      </section>
    </main>
  );
}
