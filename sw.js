/* Build-time substitutions contain only emitted application assets. */
const VERSION = '0c951439eb808b427706';
const PATHS = ["./","index.html","assets/index-DNhN-2US.js","assets/index-Dv926OCb.css","assets/web-B5K8qyNX.js","assets/web-Dn7UeAaL.js","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","licenses.html","LICENSE-Capacitor.txt","LICENSE-PopRun.txt","LICENSE-Supabase.txt"];
const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `paopaoleba-static:${SCOPE.pathname}:`;
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const URLS = PATHS.map(path => new URL(path, SCOPE).href);
const ALLOWED = new Set(URLS);
const SHELL = new URL('index.html', SCOPE).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // No cookies or authorization are sent while caching the static release.
    try {
      await cache.addAll(URLS.map(url => new Request(url, { credentials: 'omit', cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
    // Updates deliberately wait for all old app windows to close. Never reload a run.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // In particular: no auth, Supabase, other origins, writes, or parameterized URLs.
  if (request.method !== 'GET' || request.headers.has('authorization')
    || url.origin !== SCOPE.origin || url.search || !ALLOWED.has(url.href)) return;

  if (request.mode === 'navigate' && (url.href === SCOPE.href || url.href === SHELL)) {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch {
        return await caches.match(SHELL) || new Response(
          '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>跑跑乐吧</title><p>当前离线，请联网后重新打开跑跑乐吧。</p></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        );
      }
    })());
    return;
  }
  // Runtime responses are never written to cache; only the build-time static list is stored.
  event.respondWith((async () => await caches.match(request) || fetch(request))());
});
