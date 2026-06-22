import { CSSProperties, MouseEventHandler, ReactNode } from "react";

export type CardVariant = "flat" | "elevated";

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const baseStyle: CSSProperties = {
  background: "var(--color-card)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-4)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font-family)",
  fontSize: "var(--text-body)",
};

export default function Card({
  children,
  variant = "flat",
  className,
  style,
  onClick,
}: CardProps) {
  const merged: CSSProperties = {
    ...baseStyle,
    boxShadow:
      variant === "elevated" ? "var(--shadow-elevated)" : "var(--shadow-card)",
    cursor: onClick ? "pointer" : undefined,
    ...style,
  };
  return (
    <div
      className={className}
      style={merged}
      onClick={onClick}
      data-testid="ui-card"
      data-variant={variant}
    >
      {children}
    </div>
  );
}
