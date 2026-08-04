import { useEffect, useRef, useState } from 'react'

export function Notes({ value, onChange }: { value: string; onChange: (notes: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [saved, setSaved] = useState(true)
  const timeout = useRef<number | null>(null)

  const edit = (next: string) => {
    setDraft(next)
    setSaved(false)
    if (timeout.current !== null) window.clearTimeout(timeout.current)
    timeout.current = window.setTimeout(() => {
      onChange(next)
      setSaved(true)
    }, 400)
  }

  useEffect(
    () => () => {
      if (timeout.current !== null) window.clearTimeout(timeout.current)
    },
    [],
  )

  return (
    <section className="card notes-card">
      <div className="notes-head">
        <h2>Bloc-notes</h2>
        <span className={`save-state${saved ? ' is-saved' : ''}`}>
          {saved ? 'Enregistré ✓' : 'Enregistrement…'}
        </span>
      </div>
      <textarea
        value={draft}
        onChange={(e) => edit(e.target.value)}
        placeholder={'Videz votre tête ici : idées, liens, brouillons…\nTout est conservé automatiquement.'}
        aria-label="Bloc-notes"
      />
    </section>
  )
}
