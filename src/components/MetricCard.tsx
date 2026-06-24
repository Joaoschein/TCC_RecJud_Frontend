import type { MetricCardProps } from '../types'

export function MetricCard({ label, value, delta, tone, icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{delta}</span>
      </div>
      <div className={`metric-icon metric-icon-${tone}`}>{icon}</div>
    </article>
  )
}
