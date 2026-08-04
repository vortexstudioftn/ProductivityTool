import { describe, expect, it } from 'vitest'
import { addDays, dayKey, formatLongDate, greeting } from '../date'

describe('dayKey', () => {
  it('formate en AAAA-MM-JJ local avec des zéros', () => {
    expect(dayKey(new Date(2026, 7, 4))).toBe('2026-08-04')
    expect(dayKey(new Date(2026, 0, 9))).toBe('2026-01-09')
    expect(dayKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('addDays', () => {
  it('avance et recule', () => {
    expect(addDays('2026-08-04', 1)).toBe('2026-08-05')
    expect(addDays('2026-08-04', -1)).toBe('2026-08-03')
    expect(addDays('2026-08-04', 0)).toBe('2026-08-04')
  })

  it("gère les fins de mois, d'année et les années bissextiles", () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01')
  })
})

describe('formatLongDate', () => {
  it('affiche la date longue en français, capitalisée', () => {
    expect(formatLongDate(new Date(2026, 7, 4))).toBe('Mardi 4 août')
  })
})

describe('greeting', () => {
  it("suit l'heure de la journée", () => {
    expect(greeting(new Date(2026, 7, 4, 2))).toBe('Bonne nuit')
    expect(greeting(new Date(2026, 7, 4, 9))).toBe('Bonjour')
    expect(greeting(new Date(2026, 7, 4, 15))).toBe('Bon après-midi')
    expect(greeting(new Date(2026, 7, 4, 21))).toBe('Bonsoir')
  })
})
