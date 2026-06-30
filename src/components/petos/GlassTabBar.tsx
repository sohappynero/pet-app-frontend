import { ReactNode, useEffect, useState } from "react";
import { Home, ClipboardList, Plus, Bot, User } from "lucide-react";

export interface TabItem {
  key: string;
  label: string;
  icon: ReactNode;
}

export interface GlassTabBarProps {
  items?: TabItem[];
  activeKey: string;
  onChange?: (key: string) => void;
}

// 高级线性图标 — 替代 emoji 提升视觉质感
const DEFAULT_ITEMS: TabItem[] = [
  { key: "home", label: "首页", icon: <Home size={22} strokeWidth={2.2} /> },
  { key: "records", label: "记录", icon: <ClipboardList size={22} strokeWidth={2.2} /> },
  { key: "add", label: "", icon: <Plus size={24} strokeWidth={2.5} /> },
  { key: "ai", label: "会员专区", icon: <Bot size={22} strokeWidth={2.2} /> },
  { key: "mine", label: "我的", icon: <User size={22} strokeWidth={2.2} /> },
];

export default function GlassTabBar({
  items = DEFAULT_ITEMS,
  activeKey,
  onChange,
}: GlassTabBarProps) {
  const centerIndex = Math.floor(items.length / 2);
  const centerKey = items[centerIndex]?.key;

  // 监听抽屉状态：打开时隐藏导航栏
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () => setHidden(document.body.classList.contains('drawer-open'));
    // 使用 MutationObserver 监听 body class 变化
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    check(); // 初始检查
    return () => observer.disconnect();
  }, []);

  if (hidden) return null;

  return (
    <div
      className="petos-tabbar petos-glass petos-glass--strong"
      data-testid="petos-glass-tabbar"
    >
      {items.map((item, idx) => {
        const isCenter = idx === centerIndex;
        const isOn = item.key === activeKey;

        if (isCenter) {
          // 中间凸起的加号按钮
          return (
            <button
              key={item.key}
              type="button"
              className="petos-tab petos-tab--center"
              onClick={() => onChange?.(item.key)}
              aria-label="添加"
            >
              <span className="petos-tab__ico petos-tab__ico--center" aria-hidden="true">
                {item.icon}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            className={isOn ? "petos-tab petos-tab--on" : "petos-tab"}
            onClick={() => onChange?.(item.key)}
            aria-current={isOn ? "page" : undefined}
            aria-label={item.label}
          >
            <span className="petos-tab__ico" aria-hidden="true">
              {item.icon}
            </span>
            {item.label && <span className="petos-tab__label">{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
