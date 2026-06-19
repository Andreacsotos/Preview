let swRegistration: Promise<ServiceWorkerRegistration> | null = null;

export function registerBannerSW(): Promise<ServiceWorkerRegistration> {
  if (!swRegistration) {
    swRegistration = navigator.serviceWorker.register('/banner-sw.js', { scope: '/banner-preview/' });
  }
  return swRegistration;
}

const MIME_MAP: Record<string, string> = {
  html: 'text/html', htm: 'text/html',
  css: 'text/css', js: 'text/javascript', json: 'application/json',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2',
  mp4: 'video/mp4',
};

function getMime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] || 'application/octet-stream';
}

/** Wait for this specific registration's SW to reach 'activated' state. */
function waitForActive(reg: ServiceWorkerRegistration): Promise<ServiceWorker> {
  return new Promise((resolve) => {
    if (reg.active) { resolve(reg.active); return; }
    const sw = reg.installing ?? reg.waiting;
    if (!sw) { resolve(reg.active!); return; }
    const onState = () => {
      if (sw.state === 'activated') {
        sw.removeEventListener('statechange', onState);
        resolve(sw);
      }
    };
    sw.addEventListener('statechange', onState);
    // Fallback: resolve after 3s regardless
    setTimeout(() => resolve(reg.active ?? sw as unknown as ServiceWorker), 3000);
  });
}

export async function storeBanner(
  id: string,
  files: { path: string; file: File }[]
): Promise<void> {
  const registration = await registerBannerSW();
  const sw = await waitForActive(registration);

  const entries: [string, { buffer: ArrayBuffer; type: string }][] = await Promise.all(
    files.map(async ({ path, file }) => {
      const buffer = await file.arrayBuffer();
      return [path, { buffer, type: getMime(file.name) }] as [string, { buffer: ArrayBuffer; type: string }];
    })
  );

  // Use MessageChannel to wait for SW to confirm files are stored
  // before returning — prevents race where iframe loads before SW has the files.
  await new Promise<void>((resolve) => {
    const { port1, port2 } = new MessageChannel();
    port1.onmessage = () => resolve();
    sw.postMessage({ type: 'banner-store', id, files: entries }, [port2]);
    setTimeout(resolve, 2000); // fallback if old SW version has no ack
  });
}
