import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hors-ligne (PWA) : uniquement sur le build de production, pour ne pas
// mettre en cache les modules du serveur de développement.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      const ready = await navigator.serviceWorker.ready
      // Préchauffe le cache avec les ressources déjà chargées par cette page,
      // pour que le hors-ligne fonctionne dès la première visite.
      const urls = [
        window.location.href,
        ...performance.getEntriesByType('resource').map((entry) => entry.name),
      ].filter((url) => new URL(url, window.location.href).origin === window.location.origin)
      ready.active?.postMessage({ type: 'warm', urls })
    } catch {
      // Pas de service worker : l'app fonctionne normalement, en ligne.
    }
  })
}
