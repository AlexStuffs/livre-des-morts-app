/* Service worker — Le Livre des Morts (offline-first) */
const CACHE = 'ldm-v5';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Réseau d'abord pour l'app (mises à jour), repli sur le cache hors-ligne.
   Pour les fichiers de l'app (même origine), on force la récupération réseau
   en contournant le cache HTTP (max-age de GitHub Pages) afin que les mises à
   jour soient prises en compte dès le rechargement, sans attendre 10 minutes. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  const netReq = sameOrigin ? new Request(req.url, { cache: 'reload' }) : req;
  e.respondWith(
    fetch(netReq).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
