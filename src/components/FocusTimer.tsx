import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_CONFIG,
  PHASE_LABEL,
  formatClock,
  initialTimer,
  pause,
  phaseDuration,
  remainingSec,
  reset,
  skip,
  start,
  sync,
} from '../lib/timer'
import type { TimerState } from '../lib/timer'

const BASE_TITLE = 'Élan — avancer, un jour à la fois'

export function FocusTimer({
  onWorkCompleted,
  sessionsToday,
}: {
  onWorkCompleted: (minutes: number) => void
  sessionsToday: number
}) {
  const cfg = DEFAULT_CONFIG
  const [timer, setTimer] = useState<TimerState>(() => initialTimer(cfg))
  const [now, setNow] = useState<number>(() => Date.now())
  // La référence est la source de vérité entre deux rendus : elle évite de
  // rejouer une transition (et de journaliser deux fois une session).
  const timerRef = useRef(timer)

  const apply = (next: TimerState, at: number) => {
    timerRef.current = next
    setTimer(next)
    setNow(at)
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      const at = Date.now()
      const { state: next, finished } = sync(timerRef.current, cfg, at)
      if (next !== timerRef.current) {
        timerRef.current = next
        setTimer(next)
        for (const phase of finished) if (phase === 'work') onWorkCompleted(cfg.workMin)
        if (finished.length > 0) chime()
      }
      setNow(at)
    }, 500)
    return () => window.clearInterval(id)
  }, [cfg, onWorkCompleted])

  const remaining = remainingSec(timer, now)
  const total = phaseDuration(timer.phase, cfg)
  const pct = Math.round(((total - remaining) / total) * 100)

  useEffect(() => {
    document.title = timer.running
      ? `${formatClock(remaining)} · ${PHASE_LABEL[timer.phase]} — Élan`
      : BASE_TITLE
  }, [remaining, timer.running, timer.phase])

  useEffect(
    () => () => {
      document.title = BASE_TITLE
    },
    [],
  )

  const toggle = () => {
    const at = Date.now()
    const cur = timerRef.current
    apply(cur.running ? pause(cur, at) : start(cur, at), at)
  }

  return (
    <section className={`card focus-card phase-${timer.phase}`}>
      <div className="focus-head">
        <h2>{PHASE_LABEL[timer.phase]}</h2>
        <span className="focus-count" title="Sessions de focus terminées aujourd'hui">
          {sessionsToday} aujourd'hui
        </span>
      </div>
      <div className="clock" aria-live="polite">
        {formatClock(remaining)}
      </div>
      <div className="progress-track slim">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="focus-controls">
        <button type="button" className="btn btn-primary" onClick={toggle}>
          {timer.running ? 'Mettre en pause' : remaining < total ? 'Reprendre' : 'Démarrer'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => apply(skip(timerRef.current, cfg), Date.now())}
        >
          Passer
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => apply(reset(timerRef.current, cfg), Date.now())}
        >
          Réinitialiser
        </button>
      </div>
      <p className="focus-hint">
        {cfg.workMin} min de focus · {cfg.breakMin} min de pause · grande pause toutes les{' '}
        {cfg.cyclesBeforeLongBreak} sessions
      </p>
    </section>
  )
}

/** Deux notes brèves pour signaler la fin d'une phase. Le son est un bonus. */
function chime() {
  try {
    const ctx = new AudioContext()
    const note = (freq: number, delay: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = ctx.currentTime + delay
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.55)
    }
    note(660, 0)
    note(880, 0.25)
    window.setTimeout(() => void ctx.close(), 1500)
  } catch {
    // Contexte audio indisponible ou bloqué : on reste silencieux.
  }
}
