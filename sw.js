// Service worker: il sito resta consultabile anche offline.
// Rete prima di tutto, così ogni aggiornamento arriva subito; la cache serve solo senza connessione.
const CACHE = 'portflavio-v15';
const FILE = [
  './',
  'index.html',
  'privacy.html',
  'manifest.webmanifest',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'css/responsive.css',
  'js/early.js',
  'js/site-config.js',
  'js/i18n.js',
  'js/ui.js',
  'js/mappa.js',
  'js/contact.js',
  'js/main.js',
  'images/favicon.svg',
  'images/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((risposta) => {
        if (risposta.ok) {
          const copia = risposta.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
        }
        return risposta;
      })
      .catch(() => caches.match(request).then((salvata) => salvata || caches.match('index.html')))
  );
});
