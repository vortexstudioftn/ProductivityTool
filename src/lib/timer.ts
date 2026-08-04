export type Phase = 'work' | 'break' | 'longBreak'

export interface TimerConfig {
  workMin: number
  breakMin: number
  longBreakMin: number
  cyclesBeforeLongBreak: number
}

export const DEFAULT_CONFIG: TimerConfig = {
  workMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLongBreak: 4,
}

export const PHASE_LABEL: Record<Phase, string> = {
  work: 'Focus',
  break: 'Pause',
  longBreak: 'Grande pause',
}

/**
 * Le minuteur est basé sur des horodatages (endsAt) et non sur un simple
 * décompte : un onglet mis en veille ou ralenti par le navigateur reste juste.
 */
export interface TimerState {
  phase: Phase
  running: boolean
  /** Secondes restantes, valide quand le minuteur est à l'arrêt. */
  remainingSec: number
  /** Fin de la phase (epoch ms), valide quand le minuteur tourne. */
  endsAt: number | null
  /** Sessions de travail terminées (sert au déclenchement de la grande pause). */
  completedWork: number
}

export function phaseDuration(phase: Phase, cfg: TimerConfig): number {
  switch (phase) {
    case 'work':
      return cfg.workMin * 60
    case 'break':
      return cfg.breakMin * 60
    case 'longBreak':
      return cfg.longBreakMin * 60
  }
}

export function initialTimer(cfg: TimerConfig = DEFAULT_CONFIG): TimerState {
  return {
    phase: 'work',
    running: false,
    remainingSec: phaseDuration('work', cfg),
    endsAt: null,
    completedWork: 0,
  }
}

export function remainingSec(state: TimerState, now: number): number {
  if (!state.running || state.endsAt === null) return state.remainingSec
  return Math.max(0, Math.ceil((state.endsAt - now) / 1000))
}

export function start(state: TimerState, now: number): TimerState {
  if (state.running) return state
  return { ...state, running: true, endsAt: now + state.remainingSec * 1000 }
}

export function pause(state: TimerState, now: number): TimerState {
  if (!state.running || state.endsAt === null) return state
  return { ...state, running: false, remainingSec: remainingSec(state, now), endsAt: null }
}

function nextPhaseOf(state: TimerState, cfg: TimerConfig): { phase: Phase; completedWork: number } {
  if (state.phase === 'work') {
    const completedWork = state.completedWork + 1
    const phase: Phase = completedWork % cfg.cyclesBeforeLongBreak === 0 ? 'longBreak' : 'break'
    return { phase, completedWork }
  }
  return { phase: 'work', completedWork: state.completedWork }
}

export interface SyncResult {
  state: TimerState
  /** Phases arrivées à leur terme pendant ce rattrapage, en ordre chronologique. */
  finished: Phase[]
}

/**
 * Rattrape le temps écoulé : enchaîne autant de transitions de phase que
 * nécessaire (l'onglet a pu rester longtemps en arrière-plan). Renvoie le
 * même objet état si rien n'a changé.
 */
export function sync(state: TimerState, cfg: TimerConfig, now: number): SyncResult {
  const finished: Phase[] = []
  let cur = state
  while (cur.running && cur.endsAt !== null && now >= cur.endsAt) {
    finished.push(cur.phase)
    const { phase, completedWork } = nextPhaseOf(cur, cfg)
    const duration = phaseDuration(phase, cfg)
    cur = {
      phase,
      running: true,
      remainingSec: duration,
      endsAt: cur.endsAt + duration * 1000,
      completedWork,
    }
  }
  return { state: cur, finished }
}

/**
 * Passe à la phase suivante sans attendre. Une session de travail sautée
 * compte pour le cycle des grandes pauses mais n'est pas journalisée.
 */
export function skip(state: TimerState, cfg: TimerConfig): TimerState {
  const { phase, completedWork } = nextPhaseOf(state, cfg)
  return {
    phase,
    running: false,
    remainingSec: phaseDuration(phase, cfg),
    endsAt: null,
    completedWork,
  }
}

export function reset(state: TimerState, cfg: TimerConfig): TimerState {
  return { ...state, running: false, endsAt: null, remainingSec: phaseDuration(state.phase, cfg) }
}

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
