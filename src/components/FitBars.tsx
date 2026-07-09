import type { FitDimension } from '../lib/fitBreakdown'

export function FitBars({ dims, compact }: { dims: FitDimension[]; compact?: boolean }) {
  const list = compact ? dims.filter((d) => d.id !== 'overall') : dims
  return (
    <div className={`fit-bars ${compact ? 'compact' : ''}`}>
      {list.map((d) => (
        <div key={d.id} className="fit-bar-row">
          <div className="fit-bar-meta">
            <span>{d.label}</span>
            <strong>{d.score}%</strong>
          </div>
          <div className="fit-bar-track" aria-hidden>
            <i style={{ width: `${d.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
