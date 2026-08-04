import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { FocusTimer } from './components/FocusTimer'
import { Header } from './components/Header'
import { Notes } from './components/Notes'
import { StatsBar } from './components/StatsBar'
import { TaskBoard } from './components/TaskBoard'
import { dayKey } from './lib/date'
import { loadState, saveState } from './lib/storage'
import { activityDays, bootState, computeStreak, reducer, tasksForDay } from './lib/store'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    bootState(loadState(), dayKey(new Date())),
  )

  useEffect(() => {
    saveState(state)
  }, [state])

  // L'app reste ouverte toute la journée : on rattrape le passage à minuit.
  useEffect(() => {
    const id = window.setInterval(() => {
      const today = dayKey(new Date())
      if (today !== state.today) dispatch({ type: 'day-changed', today })
    }, 30_000)
    return () => window.clearInterval(id)
  }, [state.today])

  const todayTasks = useMemo(() => tasksForDay(state.tasks, state.today), [state.tasks, state.today])
  const sessionsToday = useMemo(
    () => state.sessions.filter((s) => s.day === state.today),
    [state.sessions, state.today],
  )
  const streak = useMemo(
    () => computeStreak(activityDays(state.tasks, state.sessions), state.today),
    [state.tasks, state.sessions, state.today],
  )

  const logSession = useCallback((minutes: number) => {
    dispatch({ type: 'log-session', minutes, endedAt: new Date() })
  }, [])

  return (
    <div className="app">
      <Header streak={streak} />
      <StatsBar tasks={todayTasks} sessions={sessionsToday} />
      <main className="layout">
        <TaskBoard tasks={todayTasks} dispatch={dispatch} />
        <aside className="side">
          <FocusTimer onWorkCompleted={logSession} sessionsToday={sessionsToday.length} />
          <Notes value={state.notes} onChange={(notes) => dispatch({ type: 'set-notes', notes })} />
        </aside>
      </main>
      <footer className="footer">
        Vos données restent dans ce navigateur (localStorage) — rien ne quitte votre machine.
      </footer>
    </div>
  )
}
