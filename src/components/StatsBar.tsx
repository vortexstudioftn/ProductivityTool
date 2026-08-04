import type { FocusSession, Task } from '../lib/types'

export function StatsBar({ tasks, sessions }: { tasks: Task[]; sessions: FocusSession[] }) {
  const done = tasks.filter((t) => t.done).length
  const total = tasks.length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const focusMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0)

  return (
    <section className="stats" aria-label="Progression du jour">
      <div className="stats-text">
        <span>
          {total === 0 ? (
            <>Aucune tâche pour l'instant</>
          ) : (
            <>
              <strong>{done}</strong> tâche{done > 1 ? 's' : ''} terminée{done > 1 ? 's' : ''} sur{' '}
              <strong>{total}</strong>
            </>
          )}
        </span>
        <span className="dot" aria-hidden="true">
          ·
        </span>
        <span>
          <strong>{sessions.length}</strong> session{sessions.length > 1 ? 's' : ''} de focus
          {focusMinutes > 0 ? ` (${focusMinutes} min)` : ''}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tâches du jour terminées"
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </section>
  )
}
