export type Priority = 'haute' | 'normale' | 'basse'

export interface Task {
  id: string
  title: string
  priority: Priority
  done: boolean
  /** Journée (AAAA-MM-JJ) à laquelle la tâche appartient. */
  day: string
  createdAt: string
  completedAt: string | null
  /** Vrai si la tâche a été reportée depuis un jour précédent. */
  carried: boolean
}

export interface FocusSession {
  day: string
  endedAt: string
  minutes: number
}

export interface AppState {
  version: 1
  today: string
  tasks: Task[]
  notes: string
  sessions: FocusSession[]
}
