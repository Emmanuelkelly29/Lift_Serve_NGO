/* Cache static assets + Cloudinary images for faster repeat visits */
const CACHE = 'lisaf-v6';
const PRECACHE = [
  './',
  './index.html',
  './css/main.css',
  './js/config.js',
  './js/images.js',
  './js/site.js',
  './favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isImage =
    req.destination === 'image' ||
    url.hostname.includes('res.cloudinary.com') ||
    /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url.pathname);

  if (isImage) {
    // Cache-first for images (fast paint on return visits)
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // Network-first for HTML/JS (fresh content), fall back to cache
  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
