import { ReactNode } from "react";

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

const DEFAULT_ITEMS: TabItem[] = [
  { key: "home", label: "首页", icon: "🏠" },
  { key: "insights", label: "会员专区", icon: "🌟" },
  { key: "timeline", label: "成长", icon: "📖" },
  { key: "mine", label: "我的", icon: "👤" },
];

export default function GlassTabBar({
  items = DEFAULT_ITEMS,
  activeKey,
  onChange,
}: GlassTabBarProps) {
  return (
    <div
      className="petos-tabbar petos-glass petos-glass--strong"
      data-testid="petos-glass-tabbar"
    >
      {items.map((item) => {
        const isOn = item.key === activeKey;
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
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
