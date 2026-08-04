import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG,
  formatClock,
  initialTimer,
  pause,
  remainingSec,
  reset,
  skip,
  start,
  sync,
} from '../timer'
import type { TimerState } from '../timer'

const CFG = DEFAULT_CONFIG
const T0 = 1_000_000_000
const MIN = 60_000

describe('initialTimer', () => {
  it('démarre à l’arrêt sur une session de travail complète', () => {
    const t = initialTimer(CFG)
    expect(t.phase).toBe('work')
    expect(t.running).toBe(false)
    expect(t.remainingSec).toBe(25 * 60)
  })
})

describe('start / pause / remainingSec', () => {
  it('décompte à partir d’horodatages et fige le restant en pause', () => {
    const started = start(initialTimer(CFG), T0)
    expect(started.running).toBe(true)
    expect(remainingSec(started, T0 + 5_000)).toBe(25 * 60 - 5)

    const paused = pause(started, T0 + 60_000)
    expect(paused.running).toBe(false)
    expect(paused.remainingSec).toBe(24 * 60)
    expect(remainingSec(paused, T0 + 10 * MIN)).toBe(24 * 60)
  })
})

describe('sync', () => {
  it('rend le même objet état tant que la phase n’est pas finie', () => {
    const started = start(initialTimer(CFG), T0)
    const { state, finished } = sync(started, CFG, T0 + 10_000)
    expect(state).toBe(started)
    expect(finished).toEqual([])
  })

  it('bascule en pause courte à la fin d’une session de travail', () => {
    const started = start(initialTimer(CFG), T0)
    const { state, finished } = sync(started, CFG, T0 + 25 * MIN)
    expect(finished).toEqual(['work'])
    expect(state.phase).toBe('break')
    expect(state.running).toBe(true)
    expect(state.completedWork).toBe(1)
    expect(state.endsAt).toBe(T0 + 30 * MIN)
  })

  it('déclenche la grande pause après le nombre de cycles configuré', () => {
    const beforeFourth: TimerState = {
      phase: 'work',
      running: true,
      remainingSec: 25 * 60,
      endsAt: T0,
      completedWork: 3,
    }
    const { state } = sync(beforeFourth, CFG, T0)
    expect(state.phase).toBe('longBreak')
  })

  it('rattrape plusieurs phases après une longue absence', () => {
    const started = start(initialTimer(CFG), T0)
    // 25 min de travail + 5 min de pause + 1 min dans la session suivante.
    const { state, finished } = sync(started, CFG, T0 + 31 * MIN)
    expect(finished).toEqual(['work', 'break'])
    expect(state.phase).toBe('work')
    expect(state.completedWork).toBe(1)
    expect(remainingSec(state, T0 + 31 * MIN)).toBe(24 * 60)
  })
})

describe('skip / reset', () => {
  it('passe à la phase suivante, à l’arrêt et à pleine durée', () => {
    const skipped = skip(initialTimer(CFG), CFG)
    expect(skipped.phase).toBe('break')
    expect(skipped.running).toBe(false)
    expect(skipped.remainingSec).toBe(5 * 60)
    expect(skipped.completedWork).toBe(1)

    const backToWork = skip(skipped, CFG)
    expect(backToWork.phase).toBe('work')
    expect(backToWork.completedWork).toBe(1)
  })

  it('réinitialise la phase courante sans toucher au cycle', () => {
    const started = start(initialTimer(CFG), T0)
    const mid = pause(started, T0 + 10 * MIN)
    const cleared = reset(mid, CFG)
    expect(cleared.remainingSec).toBe(25 * 60)
    expect(cleared.running).toBe(false)
    expect(cleared.phase).toBe('work')
  })
})

describe('formatClock', () => {
  it('affiche mm:ss avec des zéros', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(25 * 60)).toBe('25:00')
  })
})
