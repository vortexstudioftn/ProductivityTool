import { useEffect, useRef, useState } from 'react'
import type { Dispatch, FormEvent } from 'react'
import { PRIORITY_LABEL, sortTasks } from '../lib/store'
import type { Action } from '../lib/store'
import type { Priority, Task } from '../lib/types'

export function TaskBoard({ tasks, dispatch }: { tasks: Task[]; dispatch: Dispatch<Action> }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('normale')
  const inputRef = useRef<HTMLInputElement>(null)

  // « / » focalise la saisie depuis n'importe où dans la page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      if (e.key === '/' && !typing) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    dispatch({ type: 'add-task', title, priority })
    setTitle('')
    setPriority('normale')
    inputRef.current?.focus()
  }

  const sorted = sortTasks(tasks)
  const open = sorted.filter((t) => !t.done)
  const done = sorted.filter((t) => t.done)

  return (
    <section className="card tasks-card">
      <h2>Aujourd'hui</h2>
      <form className="add-form" onSubmit={submit}>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ajouter une tâche… (raccourci : /)"
          aria-label="Nouvelle tâche"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          aria-label="Priorité"
        >
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Ajouter
        </button>
      </form>

      {open.length === 0 && done.length === 0 && (
        <p className="empty">Rien pour l'instant. Quelle est la prochaine petite victoire ?</p>
      )}

      {open.length === 0 && done.length > 0 && (
        <p className="empty empty-cheer">Tout est terminé. Belle journée ! 🎉</p>
      )}

      <ul className="task-list">
        {open.map((t) => (
          <TaskItem key={t.id} task={t} dispatch={dispatch} />
        ))}
      </ul>

      {done.length > 0 && (
        <details className="done-group" open>
          <summary>Terminées ({done.length})</summary>
          <ul className="task-list">
            {done.map((t) => (
              <TaskItem key={t.id} task={t} dispatch={dispatch} />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function TaskItem({ task, dispatch }: { task: Task; dispatch: Dispatch<Action> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)

  const openEditor = () => {
    setDraft(task.title)
    setEditing(true)
  }

  const commit = () => {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== task.title) dispatch({ type: 'rename-task', id: task.id, title: next })
  }

  return (
    <li className={`task${task.done ? ' task-done' : ''}`}>
      <input
        type="checkbox"
        className="task-check"
        checked={task.done}
        onChange={() => dispatch({ type: 'toggle-task', id: task.id })}
        aria-label={task.done ? `Rouvrir « ${task.title} »` : `Terminer « ${task.title} »`}
      />
      <span
        className={`prio prio-${task.priority}`}
        title={`Priorité ${PRIORITY_LABEL[task.priority].toLowerCase()}`}
      />
      {editing ? (
        <input
          className="task-edit"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(task.title)
              setEditing(false)
            }
          }}
        />
      ) : (
        <span className="task-title" onDoubleClick={openEditor}>
          {task.carried && (
            <span className="carried" title="Reportée d'un jour précédent">
              ↻
            </span>
          )}
          {task.title}
        </span>
      )}
      <span className="task-actions">
        <button
          type="button"
          className="icon-btn"
          title="Modifier"
          aria-label={`Modifier « ${task.title} »`}
          onClick={openEditor}
        >
          ✎
        </button>
        <button
          type="button"
          className="icon-btn icon-danger"
          title="Supprimer"
          aria-label={`Supprimer « ${task.title} »`}
          onClick={() => dispatch({ type: 'remove-task', id: task.id })}
        >
          ✕
        </button>
      </span>
    </li>
  )
}
