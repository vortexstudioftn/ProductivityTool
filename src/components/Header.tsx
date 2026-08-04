import { formatLongDate, greeting } from '../lib/date'

export function Header({ streak }: { streak: number }) {
  const now = new Date()
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ⚡
        </span>
        <span className="brand-name">Élan</span>
      </div>
      <div className="header-date">
        <div className="greeting">{greeting(now)} !</div>
        <div className="date">{formatLongDate(now)}</div>
      </div>
      <div
        className={`streak${streak > 0 ? '' : ' streak-empty'}`}
        title="Jours consécutifs avec au moins une tâche terminée ou une session de focus"
      >
        🔥 {streak} {streak > 1 ? 'jours' : 'jour'}
      </div>
    </header>
  )
}
