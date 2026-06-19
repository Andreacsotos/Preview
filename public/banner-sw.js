// Service Worker for serving HTML5 banner assets in-memory
// Each banner is stored under a unique ID; all asset requests are intercepted here.

const store = new Map(); // id -> Map<normalizedPath, { buffer: ArrayBuffer, type: string }>

self.addEventListener('message', (event) => {
  if (event.data?.type === 'banner-store') {
    store.set(event.data.id, new Map(event.data.files));
    // Acknowledge so the client knows files are ready before loading the iframe
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: 'banner-stored', id: event.data.id });
    }
  }
  if (event.data?.type === 'banner-clear') {
    store.delete(event.data.id);
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/banner-preview/')) return;

  const parts = url.pathname.replace('/banner-preview/', '').split('/');
  const id = parts[0];
  const filePath = parts.slice(1).join('/') || 'index.html';

  const files = store.get(id);
  if (!files) return;

  // Normalize: strip query string (GWD cache-busting), decode %20 etc.
  const decoded = decodeURIComponent(filePath);

  const entry = files.get(filePath) || files.get(decoded) ||
    files.get(decoded.split('/').pop()) || files.get(filePath.split('/').pop());

  if (!entry) return;

  event.respondWith(
    new Response(entry.buffer, {
      status: 200,
      headers: {
        'Content-Type': entry.type,
        'Access-Control-Allow-Origin': '*',
      },
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
