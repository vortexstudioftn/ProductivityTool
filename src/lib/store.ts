import { addDays, dayKey } from './date'
import type { AppState, FocusSession, Priority, Task } from './types'

export const PRIORITY_ORDER: Record<Priority, number> = { haute: 0, normale: 1, basse: 2 }
export const PRIORITY_LABEL: Record<Priority, string> = {
  haute: 'Haute',
  normale: 'Normale',
  basse: 'Basse',
}

export function createTask(title: string, priority: Priority, day: string, now: Date = new Date()): Task {
  return {
    id: `t-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    priority,
    done: false,
    day,
    createdAt: now.toISOString(),
    completedAt: null,
    carried: false,
  }
}

/** Reporte à aujourd'hui les tâches non terminées des jours précédents. */
export function rolloverTasks(tasks: Task[], today: string): Task[] {
  return tasks.map((t) => (!t.done && t.day < today ? { ...t, day: today, carried: true } : t))
}

export function toggleTask(tasks: Task[], id: string, now: Date = new Date()): Task[] {
  return tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done, completedAt: t.done ? null : now.toISOString() } : t,
  )
}

/** Non terminées d'abord (par priorité puis ancienneté), terminées à la fin. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (p !== 0) return p
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export function tasksForDay(tasks: Task[], day: string): Task[] {
  return tasks.filter((t) => t.day === day)
}

/** Jours où au moins une tâche a été terminée ou une session de focus faite. */
export function activityDays(tasks: Task[], sessions: FocusSession[]): Set<string> {
  const days = new Set<string>()
  for (const t of tasks) if (t.done) days.add(t.day)
  for (const s of sessions) days.add(s.day)
  return days
}

/**
 * Nombre de jours actifs consécutifs. La série reste vivante si aujourd'hui
 * n'a pas encore d'activité : elle est alors comptée depuis hier.
 */
export function computeStreak(days: Set<string>, today: string): number {
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export type Action =
  | { type: 'add-task'; title: string; priority: Priority }
  | { type: 'toggle-task'; id: string }
  | { type: 'remove-task'; id: string }
  | { type: 'rename-task'; id: string; title: string }
  | { type: 'set-notes'; notes: string }
  | { type: 'log-session'; minutes: number; endedAt: Date }
  | { type: 'day-changed'; today: string }

export function initialState(today: string): AppState {
  return { version: 1, today, tasks: [], notes: '', sessions: [] }
}

/** État de démarrage : reprend l'état stocké et rattrape le changement de jour. */
export function bootState(stored: AppState | null, today: string): AppState {
  if (!stored) return initialState(today)
  if (stored.today === today) return stored
  return { ...stored, today, tasks: rolloverTasks(stored.tasks, today) }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'add-task': {
      const title = action.title.trim()
      if (!title) return state
      return { ...state, tasks: [...state.tasks, createTask(title, action.priority, state.today)] }
    }
    case 'toggle-task':
      return { ...state, tasks: toggleTask(state.tasks, action.id) }
    case 'remove-task':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    case 'rename-task': {
      const title = action.title.trim()
      if (!title) return state
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, title } : t)),
      }
    }
    case 'set-notes':
      return { ...state, notes: action.notes }
    case 'log-session': {
      const session: FocusSession = {
        day: dayKey(action.endedAt),
        endedAt: action.endedAt.toISOString(),
        minutes: action.minutes,
      }
      return { ...state, sessions: [...state.sessions, session] }
    }
    case 'day-changed':
      return { ...state, today: action.today, tasks: rolloverTasks(state.tasks, action.today) }
  }
}
