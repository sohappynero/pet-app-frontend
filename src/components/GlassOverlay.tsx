import React from 'react';

interface GlassOverlayProps {
  isVisible: boolean;
}

/**
 * Layer 2 - 毛玻璃遮罩层
 * - rgba(255,255,255,0.25)
 * - backdrop-blur
 */
const GlassOverlay: React.FC<GlassOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 w-full h-full z-10 transition-opacity duration-300"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    />
  );
};

export default GlassOverlay;
