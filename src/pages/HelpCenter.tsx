import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  MessageSquare,
  BookOpen,
} from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

interface Category {
  emoji: string;
  label: string;
  count: number;
  color: string;
  bg: string;
  items: FaqItem[];
}

const CATEGORIES: Category[] = [
  {
    emoji: "🔒", label: "账户与登录", count: 3,
    color: "#6c5ce7", bg: "#f3edfc",
    items: [
      { q: "如何注册账号？", a: "在登录页点击「注册」，填写手机号及密码即可完成注册。" },
      { q: "忘记密码怎么办？", a: "在登录页点击「忘记密码」，通过手机验证码重置密码。" },
      { q: "如何修改个人信息？", a: "进入「我的」页面，点击头像或昵称即可编辑个人信息。" },
    ],
  },
  {
    emoji: "🐾", label: "宠物管理", count: 4,
    color: "#e17055", bg: "#fef0e8",
    items: [
      { q: "如何添加宠物？", a: "在首页点击「添加新宠物」，填写宠物基本信息并保存。" },
      { q: "可以管理多只宠物吗？", a: "支持添加多只宠物，在首页切换当前宠物查看对应数据。" },
      { q: "宠物信息可以修改吗？", a: "可以。进入宠物详情页，点击\"编辑\"按钮即可修改宠物信息。" },
      { q: "如何删除宠物档案？", a: "进入宠物详情页，点击右上角\"...\"菜单，选择\"删除宠物\"，确认后即可删除。" },
    ],
  },
  {
    emoji: "💊", label: "健康记录", count: 4,
    color: "#74b9ff", bg: "#e8f4ff",
    items: [
      { q: "如何记录宠物体重？", a: "进入\"健康记录\"页面，点击\"添加记录\"，选择\"体重记录\"，输入体重数值和测量日期即可。" },
      { q: "可以记录哪些健康数据？", a: "支持记录体重、疫苗、驱虫、体检、用药等多种健康数据类型。" },
      { q: "健康报告多久更新一次？", a: "系统会根据您的记录数据自动生成健康报告，建议每周记录1-2次体重等关键指标。" },
      { q: "如何查看历史记录？", a: "在「健康记录」页面可按时间或类型筛选，查看宠物完整的历史健康数据。" },
    ],
  },
  {
    emoji: "🔔", label: "提醒与预约", count: 4,
    color: "#fdcb6e", bg: "#fef9e7",
    items: [
      { q: "如何设置提醒？", a: "在「提醒」页面点击「添加提醒」，设置时间和重复规则。" },
      { q: "提醒支持哪些重复周期？", a: "支持不重复、每天、每周、每月、每年五种重复方式。" },
      { q: "提醒通知没有收到？", a: "请检查系统通知权限是否已开启，并确保App未被后台限制。" },
      { q: "如何关闭某条提醒？", a: "在提醒列表中，点击对应条目右侧的开关即可关闭。" },
    ],
  },
  {
    emoji: "💳", label: "付费与订阅", count: 4,
    color: "#00b894", bg: "#e8f8f0",
    items: [
      { q: "基础功能收费吗？", a: "宠物档案管理、健康记录、基本提醒等功能为免费使用。高级分析报告为付费功能。" },
      { q: "如何购买会员？", a: "在「我的」→「会员中心」中可选择月度或年度订阅套餐，支持微信支付、支付宝等主流支付方式。" },
      { q: "会员可以退款吗？", a: "会员服务为虚拟商品，支付成功后不支持退款。如有质量问题请联系客服处理。" },
      { q: "如何取消自动续费？", a: "进入\"我的-会员中心\"，点击\"管理订阅\"，选择\"取消自动续费\"即可。" },
    ],
  },
];

const FAQ_GENERAL: FaqItem[] = [
  { q: "App支持哪些平台？", a: "目前H5网页版，即将支持iOS和Android客户端。" },
  { q: "如何联系人工客服？", a: "可通过App内在线客服、客服热线 400-123-4567 或邮件 support@petcare.com 联系我们。" },
  { q: "App使用过程中卡顿怎么办？", a: "建议更新到最新版本，清理手机缓存，或重启App。如问题持续，请通过吐槽中心反馈。" },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = searchText.trim()
    ? CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q.includes(searchText) || item.a.includes(searchText)
        ),
      })).filter((cat) => cat.items.length > 0)
    : CATEGORIES;

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <main className="hc-page">
      {/* Hero */}
      <section className="hc-hero">
        <div className="hc-hero-bg">
          <div className="hc-hero-gradient" />
          <div className="hc-hero-orb hc-orb-a" />
          <div className="hc-hero-orb hc-orb-b" />
          <div className="hc-hero-dots" />
        </div>
        <div className="hc-hero-inner">
          <button type="button" className="hc-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="hc-hero-content">
            <div className="hc-hero-icon-wrap">
              <BookOpen size={22} />
            </div>
            <h1 className="hc-hero-title">帮助中心</h1>
            <p className="hc-hero-desc">有疑问？我们来解答 📚</p>
          </div>
        </div>
      </section>

      {/* 搜索框 */}
      <section className="hc-body">
        <div className="hc-search-wrap">
          <Search size={16} className="hc-search-icon" />
          <input
            className="hc-search-input"
            placeholder="搜索问题..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* 分类折叠卡片列表 */}
        <div className="hc-cat-list">
          {filtered.map((cat, i) => (
            <div key={cat.label} className="hc-cat-card">
              <button
                className="hc-cat-header"
                onClick={() => toggle(i)}
              >
                <span className="hc-cat-emoji-wrap" style={{ background: cat.bg, color: cat.color }}>
                  {cat.emoji}
                </span>
                <div className="hc-cat-info">
                  <span className="hc-cat-label">{cat.label}</span>
                  <span className="hc-cat-count">{cat.count} 条</span>
                </div>
                <span className={`hc-cat-chevron ${openIndex === i ? "open" : ""}`}>
                  {openIndex === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
              {openIndex === i && (
                <div className="hc-cat-body">
                  {cat.items.map((item) => (
                    <div key={item.q} className="hc-faq-item">
                      <p className="hc-faq-q">{item.q}</p>
                      <p className="hc-faq-a">{item.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 常见问题卡片 */}
        <div className="hc-common-card">
          <div className="hc-common-header">
            <HelpCircle size={20} className="hc-common-icon" />
            <span>常见问题</span>
          </div>
          {FAQ_GENERAL.map((item) => (
            <div key={item.q} className="hc-faq-item">
              <p className="hc-faq-q">{item.q}</p>
              <p className="hc-faq-a">{item.a}</p>
            </div>
          ))}
        </div>

        {/* 没找到答案 CTA */}
        <div className="hc-cta-card">
          <div className="hc-cta-top">
            <div className="hc-cta-avatar">🤔</div>
            <div className="hc-cta-text">
              <p className="hc-cta-main">没找到答案?</p>
              <p className="hc-cta-sub">告诉我们您的问题，我们会尽快回复</p>
            </div>
          </div>
          <button className="hc-cta-btn" onClick={() => navigate("/app/feedback")}>
            <MessageSquare size={15} />
            去吐槽中心
          </button>
        </div>

        <p className="hc-footer-version">宠物健康管理 v1.0.0 ✨</p>
      </section>
    </main>
  );
}
