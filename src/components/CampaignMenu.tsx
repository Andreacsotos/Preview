// src/components/CampaignMenu.tsx
// Componente menú que consume cache y muestra spinner si necesita fetch.
// Ajusta markup/estilos según tu proyecto (clases CSS). 

import React, { useEffect, useState } from 'react';
import { getCampaignFromCache, fetchCampaignDetails } from '../utils/campaignPrefetch';

type Props = {
  campaignId: string;
  onClose: () => void;
};

export default function CampaignMenu({ campaignId, onClose }: Props) {
  const [data, setData] = useState<any>(() => getCampaignFromCache(campaignId));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) return; // ya en cache
    let mounted = true;
    setLoading(true);
    const controller = new AbortController();
    fetchCampaignDetails(campaignId, controller.signal)
      .then((d) => {
        if (!mounted) return;
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        if ((err as any)?.name === 'AbortError') return;
        setError('Error cargando datos');
        setLoading(false);
      });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [campaignId, data]);

  return (
    <div className="campaign-menu" role="dialog" aria-label="Opciones de campaña">
      {loading ? (
        <div className="menu-spinner">Cargando…</div>
      ) : error ? (
        <div className="menu-error">{error}</div>
      ) : (
        <ul>
          <li>Vista previa ({data?.previews ?? 0})</li>
          <li>Editar</li>
          <li>Duplicar</li>
          <li>Eliminar</li>
        </ul>
      )}
      <button onClick={onClose} aria-label="Cerrar menú">Cerrar</button>
    </div>
  );
}
