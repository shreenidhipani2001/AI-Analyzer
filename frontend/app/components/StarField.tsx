"use client";

// Subtle floating dot background for Sunny Finance theme
const DOTS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  top:   `${Math.random() * 100}%`,
  left:  `${Math.random() * 100}%`,
  size:  Math.random() * 6 + 3,
  dur:   `${Math.random() * 4 + 3}s`,
  delay: `${Math.random() * 4}s`,
  opacity: Math.random() * 0.12 + 0.05,
}));

export default function StarField() {
  return (
    <div
      className="star-field"
      aria-hidden
      style={{ pointerEvents: "none" }}
    >
      {DOTS.map((d) => (
        <div
          key={d.id}
          className="star-dot"
          style={{
            top: d.top, left: d.left,
            width: d.size, height: d.size,
            borderRadius: "50%",
            background: "white",
            opacity: d.opacity,
            "--dur":   d.dur,
            "--delay": d.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
