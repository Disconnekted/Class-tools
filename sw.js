// Offline copy of the gradesheet. A new version of the files changes VERSION, so iPads update on their next open.
const VERSION = 'gs-844212cf38';
const FILES = ["./", "index.html", "gradesheet.html", "name-tags.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "libs/jspdf.umd.min.js", "libs/xlsx.full.min.js", "libs/pdf.min.js", "libs/pdf.worker.min.js", "libs/qrcode.js", "libs/jsQR.js"];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const page = r.mode === 'navigate';
  // Pages: try the network first (fresh), fall back to the saved copy. Libraries: saved copy first.
  e.respondWith(page
    ? fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('gradesheet.html')))
    : caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); } return res; })));
});
