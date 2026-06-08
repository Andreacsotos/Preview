// src/utils/campaignPrefetch.ts
// Util TypeScript: prefetch + cache con cancelación y debounce
// Ajusta la URL del endpoint `/api/campaigns/${id}` a la que use tu backend si es diferente.

type CampaignDetails = any;

const campaignCache = new Map<string, CampaignDetails>();
const inflight = new Map<string, { controller: AbortController; promise: Promise<CampaignDetails> }>();

export function getCampaignFromCache(id: string): CampaignDetails | undefined {
  return campaignCache.get(id);
}

export async function fetchCampaignDetails(id: string, signal?: AbortSignal): Promise<CampaignDetails> {
  const res = await fetch(`/api/campaigns/${id}`, { signal });
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
