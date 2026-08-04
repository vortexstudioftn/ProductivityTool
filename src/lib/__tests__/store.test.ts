import { describe, expect, it } from 'vitest'
import {
  activityDays,
  bootState,
  computeStreak,
  createTask,
  initialState,
  reducer,
  rolloverTasks,
  sortTasks,
  toggleTask,
} from '../store'
import type { Task } from '../types'

const TODAY = '2026-08-04'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? `t-${Math.random().toString(36).slice(2)}`,
    title: 'Tâche',
    priority: 'normale',
    done: false,
    day: TODAY,
    createdAt: '2026-08-04T08:00:00.000Z',
    completedAt: null,
    carried: false,
    ...overrides,
  }
}

describe('createTask', () => {
  it('nettoie le titre et initialise la tâche pour la journée donnée', () => {
    const t = createTask('  Écrire le rapport  ', 'haute', TODAY)
    expect(t.title).toBe('Écrire le rapport')
    expect(t.priority).toBe('haute')
    expect(t.day).toBe(TODAY)
    expect(t.done).toBe(false)
    expect(t.carried).toBe(false)
  })
})

describe('rolloverTasks', () => {
  it("reporte à aujourd'hui les tâches non terminées des jours passés", () => {
    const past = task({ id: 'a', day: '2026-08-02' })
    const rolled = rolloverTasks([past], TODAY)
    expect(rolled[0].day).toBe(TODAY)
    expect(rolled[0].carried).toBe(true)
  })

  it("laisse en place les tâches terminées et celles d'aujourd'hui", () => {
    const donePast = task({ id: 'a', day: '2026-08-02', done: true, completedAt: '2026-08-02T10:00:00.000Z' })
    const today = task({ id: 'b', day: TODAY })
    const rolled = rolloverTasks([donePast, today], TODAY)
    expect(rolled[0].day).toBe('2026-08-02')
    expect(rolled[0].carried).toBe(false)
    expect(rolled[1]).toBe(today)
  })
})

describe('toggleTask', () => {
  it('bascule terminé/à faire et pose ou efface completedAt', () => {
    const t = task({ id: 'a' })
    const doneList = toggleTask([t], 'a', new Date('2026-08-04T15:00:00.000Z'))
    expect(doneList[0].done).toBe(true)
    expect(doneList[0].completedAt).toBe('2026-08-04T15:00:00.000Z')

    const reopened = toggleTask(doneList, 'a')
    expect(reopened[0].done).toBe(false)
    expect(reopened[0].completedAt).toBeNull()
  })
})

describe('sortTasks', () => {
  it('trie : à faire par priorité puis ancienneté, terminées à la fin', () => {
    const doneTask = task({ id: 'done', done: true })
    const basse = task({ id: 'basse', priority: 'basse', createdAt: '2026-08-04T07:00:00.000Z' })
    const hauteRecente = task({ id: 'h2', priority: 'haute', createdAt: '2026-08-04T09:00:00.000Z' })
    const hauteAncienne = task({ id: 'h1', priority: 'haute', createdAt: '2026-08-04T08:00:00.000Z' })
    const sorted = sortTasks([doneTask, basse, hauteRecente, hauteAncienne])
    expect(sorted.map((t) => t.id)).toEqual(['h1', 'h2', 'basse', 'done'])
  })
})

describe('computeStreak', () => {
  it('vaut 0 sans activité récente', () => {
    expect(computeStreak(new Set(), TODAY)).toBe(0)
    expect(computeStreak(new Set(['2026-08-01']), TODAY)).toBe(0)
  })

  it("compte les jours consécutifs jusqu'à aujourd'hui", () => {
    expect(computeStreak(new Set([TODAY]), TODAY)).toBe(1)
    expect(computeStreak(new Set([TODAY, '2026-08-03', '2026-08-02']), TODAY)).toBe(3)
  })

  it("reste vivante depuis hier si aujourd'hui n'a pas encore d'activité", () => {
    expect(computeStreak(new Set(['2026-08-03', '2026-08-02']), TODAY)).toBe(2)
  })

  it("s'arrête au premier trou", () => {
    expect(computeStreak(new Set([TODAY, '2026-08-02']), TODAY)).toBe(1)
  })
})

describe('activityDays', () => {
  it('réunit les jours avec tâche terminée ou session de focus', () => {
    const days = activityDays(
      [task({ done: true, day: '2026-08-03' }), task({ day: TODAY })],
      [{ day: TODAY, endedAt: '2026-08-04T10:00:00.000Z', minutes: 25 }],
    )
    expect(days).toEqual(new Set(['2026-08-03', TODAY]))
  })
})

describe('reducer', () => {
  it('ajoute une tâche sur la journée courante et ignore les titres vides', () => {
    const s0 = initialState(TODAY)
    const s1 = reducer(s0, { type: 'add-task', title: 'Relire le contrat', priority: 'haute' })
    expect(s1.tasks).toHaveLength(1)
    expect(s1.tasks[0].day).toBe(TODAY)

    const s2 = reducer(s1, { type: 'add-task', title: '   ', priority: 'normale' })
    expect(s2).toBe(s1)
  })

  it('renomme sans accepter un titre vide', () => {
    const s0 = { ...initialState(TODAY), tasks: [task({ id: 'a', title: 'Avant' })] }
    const s1 = reducer(s0, { type: 'rename-task', id: 'a', title: '  Après  ' })
    expect(s1.tasks[0].title).toBe('Après')
    const s2 = reducer(s1, { type: 'rename-task', id: 'a', title: '   ' })
    expect(s2.tasks[0].title).toBe('Après')
  })

  it('journalise une session de focus sur la journée locale de sa fin', () => {
    const s0 = initialState(TODAY)
    const ended = new Date(2026, 7, 4, 11, 30)
    const s1 = reducer(s0, { type: 'log-session', minutes: 25, endedAt: ended })
    expect(s1.sessions).toEqual([{ day: TODAY, endedAt: ended.toISOString(), minutes: 25 }])
  })

  it('au changement de jour, reporte les tâches restantes', () => {
    const s0 = { ...initialState(TODAY), tasks: [task({ id: 'a' }), task({ id: 'b', done: true })] }
    const s1 = reducer(s0, { type: 'day-changed', today: '2026-08-05' })
    expect(s1.today).toBe('2026-08-05')
    expect(s1.tasks[0].day).toBe('2026-08-05')
    expect(s1.tasks[0].carried).toBe(true)
    expect(s1.tasks[1].day).toBe(TODAY)
  })
})

describe('bootState', () => {
  it("repart d'un état neuf sans données stockées", () => {
    expect(bootState(null, TODAY)).toEqual(initialState(TODAY))
  })

  it("rattrape le changement de jour à l'ouverture", () => {
    const stored = {
      ...initialState('2026-08-03'),
      tasks: [task({ id: 'a', day: '2026-08-03' })],
    }
    const booted = bootState(stored, TODAY)
    expect(booted.today).toBe(TODAY)
    expect(booted.tasks[0].day).toBe(TODAY)
    expect(booted.tasks[0].carried).toBe(true)
  })

  it("rend l'état tel quel si la journée n'a pas changé", () => {
    const stored = initialState(TODAY)
    expect(bootState(stored, TODAY)).toBe(stored)
  })
})
