// src/utils/campaignPrefetch.ts
// Util TypeScript: prefetch + cache con cancelación y debounce
// Ajusta la URL del endpoint usando NEXT_PUBLIC_API_BASE o la ruta por defecto `/api`.

type CampaignDetails = any;

const campaignCache = new Map<string, CampaignDetails>();
const inflight = new Map<string, { controller: AbortController; promise: Promise<CampaignDetails> }>();

// Base URL configurable vía variable de entorno (p. ej. NEXT_PUBLIC_API_BASE)
const API_BASE = (typeof process !== 'undefined' && (process.env as any).NEXT_PUBLIC_API_BASE) || '';

export function getCampaignFromCache(id: string): CampaignDetails | undefined {
  return campaignCache.get(id);
}

export async function fetchCampaignDetails(id: string, signal?: AbortSignal): Promise<CampaignDetails> {
  const url = `${API_BASE}/api/campaigns/${id}`.replace(/([^:]?)\/\//g, '$1/');
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Fetch error');
  return res.json();
}

export function prefetchCampaignDetails(id: string): { cancel: () => void } {
  if (campaignCache.has(id)) return { cancel: () => {} };

  if (inflight.has(id)) return { cancel: () => inflight.get(id)!.controller.abort() };

  const controller = new AbortController();
  const promise = fetchCampaignDetails(id, controller.signal)
    .then((data) => {
      campaignCache.set(id, data);
      inflight.delete(id);
      return data;
    })
    .catch((err) => {
      inflight.delete(id);
      // ignore aborts
      if ((err as any)?.name === 'AbortError') return Promise.reject(err);
      return Promise.reject(err);
    });

  inflight.set(id, { controller, promise });

  return {
    cancel: () => {
      controller.abort();
      inflight.delete(id);
    },
  };
}

export function clearCampaignCache() {
  campaignCache.clear();
  inflight.forEach(({ controller }) => controller.abort());
  inflight.clear();
}
