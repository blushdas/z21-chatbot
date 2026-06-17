import React from 'react';

interface Rect { top: number; left: number; width: number; height: number; }

interface Props {
  rect: Rect | null;
  padding?: number;
  onClick?: () => void;
}

const TourOverlay: React.FC<Props> = ({ rect, padding = 8, onClick }) => {
  // Dim everything with a single fixed div + cut a transparent rounded hole using box-shadow.
  // Falls back to a full dim if no rect resolved.
  if (!rect) {
    return (
      <div
        onClick={onClick}
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[1px]"
        aria-hidden="true"
      />
    );
  }
  const top = Math.max(0, rect.top - padding);
  const left = Math.max(0, rect.left - padding);
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  return (
    <>
      {/* Spotlight cut-out using a huge box-shadow */}
      <div
        onClick={onClick}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top, left, width, height,
          borderRadius: 10,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          zIndex: 9998,
          transition: 'top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease',
          pointerEvents: 'auto',
        }}
      />
      {/* Glow ring */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top, left, width, height,
          borderRadius: 10,
          boxShadow: '0 0 0 2px hsl(var(--primary, 217 91% 60%)), 0 0 24px 4px hsl(var(--primary, 217 91% 60%) / 0.45)',
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease',
        }}
      />
    </>
  );
};

export default TourOverlay;