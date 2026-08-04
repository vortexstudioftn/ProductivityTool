/*
 * Service worker d'Élan — stratégie « réseau d'abord, cache en secours » :
 * en ligne, l'app est toujours fraîche ; hors-ligne, la dernière version
 * connue est servie depuis le cache.
 */
const CACHE = 'elan-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

// La page envoie la liste de ses ressources juste après l'enregistrement :
// le hors-ligne fonctionne ainsi dès la première visite, sans attendre un
// second chargement contrôlé par le service worker.
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'warm' || !Array.isArray(data.urls)) return
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(data.urls.map((url) => cache.add(url)))),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  if (new URL(req.url).origin !== self.location.origin) return
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(req, copy)))
        }
        return res
      })
      .catch(async () => {
        const cached = await caches.match(req)
        if (cached) return cached
        if (req.mode === 'navigate') {
          const shell = await caches.match(new URL('./', self.registration.scope).href)
          if (shell) return shell
        }
        return Response.error()
      }),
  )
})
