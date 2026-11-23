// クラブ台帳 Service Worker
// 更新はサイレントに当てない: 新版は waiting で止まり、画面の[更新する]を押したときだけ切り替える
const CACHE = 'club-ledger-0.3.6';
const PREFIX = 'club-ledger-';   // このアプリのキャッシュだけを掃除する（同じドメインの他アプリには触らない）
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))));  // ブラウザのHTTPキャッシュ（10分）を通さず、必ず新しい版を取り込む
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

// 開発用PC（localhost）では常に新しいファイルを使う（キャッシュの古い画面で確認を誤らないため）。※100yd Sync と同じ方式
const DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (DEV) { e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req, { ignoreSearch: true }))); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
