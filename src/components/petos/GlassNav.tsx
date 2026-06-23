import { MouseEventHandler, ReactNode } from "react";

export interface GlassNavProps {
  brandName?: string;
  brandSuffix?: string;
  onNotificationClick?: MouseEventHandler<HTMLButtonElement>;
  onAddClick?: MouseEventHandler<HTMLButtonElement>;
  rightSlot?: ReactNode;
}

export default function GlassNav({
  brandName = "Pet",
  brandSuffix = "OS",
  onNotificationClick,
  onAddClick,
  rightSlot,
}: GlassNavProps) {
  return (
    <nav className="petos-nav petos-glass" data-testid="petos-glass-nav">
      <div className="petos-nav__brand">
        {brandName}
        <em>{brandSuffix}</em>
      </div>
      <div className="petos-nav__actions">
        {rightSlot ?? (
          <>
            <button
              type="button"
              className="petos-nav__icon"
              onClick={onNotificationClick}
              aria-label="通知"
            >
              🔔
            </button>
            <button
              type="button"
              className="petos-nav__icon"
              onClick={onAddClick}
              aria-label="添加"
            >
              +
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
