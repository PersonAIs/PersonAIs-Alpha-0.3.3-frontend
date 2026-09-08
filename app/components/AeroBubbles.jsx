// Decorative floating bubbles. Positions are hard-coded rather than random so
// the server and client render identical markup (no hydration mismatch).
const BUBBLES = [
  { left: "6%", size: 78, duration: 26, delay: -3, drift: "1.5rem" },
  { left: "18%", size: 34, duration: 19, delay: -12, drift: "-1rem" },
  { left: "29%", size: 120, duration: 34, delay: -21, drift: "2.5rem" },
  { left: "41%", size: 46, duration: 22, delay: -8, drift: "-2rem" },
  { left: "54%", size: 92, duration: 30, delay: -17, drift: "1rem" },
  { left: "66%", size: 28, duration: 17, delay: -6, drift: "2rem" },
  { left: "77%", size: 104, duration: 32, delay: -26, drift: "-1.5rem" },
  { left: "88%", size: 56, duration: 24, delay: -14, drift: "1.75rem" },
  { left: "95%", size: 38, duration: 20, delay: -19, drift: "-0.75rem" },
];

export default function AeroBubbles({ className = "" }) {
  return (
    <div className={`aero-bubbles ${className}`} aria-hidden="true">
      {BUBBLES.map((bubble, index) => (
        <span
          key={index}
          className="aero-bubble"
          style={{
            left: bubble.left,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
            "--drift": bubble.drift,
          }}
        />
      ))}
    </div>
  );
}
