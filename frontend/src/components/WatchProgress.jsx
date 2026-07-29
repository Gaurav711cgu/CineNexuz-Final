/**
 * WatchProgress — gradient progress bar overlay for movie cards.
 * Props:
 *   - progress: number 0–100 (percent)
 *   - className: optional extra classes
 */
export default function WatchProgress({ progress = 0, className = '' }) {
  if (!progress || progress <= 0) return null;
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #00E4FF 0%, #a855f7 100%)',
        }}
      />
    </div>
  );
}
