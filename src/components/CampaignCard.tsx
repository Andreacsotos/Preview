// src/components/CampaignCard.tsx
// Ejemplo de integración: modifica el componente que tiene los 3 puntos.
// Requiere React 18 (useTransition). Ajusta imports y estilos según tu repo.

import React, { useRef, useState, useTransition } from 'react';
import { prefetchCampaignDetails } from '../utils/campaignPrefetch';
import CampaignMenu from './CampaignMenu';

type Props = {
  campaign: { id: string; title: string; thumbnail?: string };
};

export default function CampaignCard({ campaign }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const prefetchHandle = useRef<{ cancel: () => void } | null>(null);
  const prefetchTimeout = useRef<number | null>(null);

  function onPointerEnterMenuButton() {
    // Debounce: esperar 150ms antes de prefetch (evita demasiados prefetches)
    if (prefetchTimeout.current) window.clearTimeout(prefetchTimeout.current);
    prefetchTimeout.current = window.setTimeout(() => {
      prefetchHandle.current = prefetchCampaignDetails(campaign.id);
    }, 150) as unknown as number;
  }

  function onPointerLeaveMenuButton() {
    if (prefetchTimeout.current) {
      window.clearTimeout(prefetchTimeout.current);
      prefetchTimeout.current = null;
    }
    if (prefetchHandle.current) {
      prefetchHandle.current.cancel();
      prefetchHandle.current = null;
    }
  }

  function openMenu() {
    // Abrir no bloqueante para evitar jank en el hilo principal
    startTransition(() => {
      setOpen(true);
    });
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="campaign-card">
      <div className="campaign-thumb">
        {campaign.thumbnail ? (
          <img src={campaign.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="placeholder" />
        )}
      </div>

      <div className="campaign-info">
        <h3>{campaign.title}</h3>
        {/* ...otros detalles */}
      </div>

      <div
        className="menu-button"
        onPointerEnter={onPointerEnterMenuButton}
        onPointerLeave={onPointerLeaveMenuButton}
      >
        <button
          aria-label="Más opciones"
          onClick={openMenu}
        >
          {/* icono de 3 puntos */}
          ⋯
        </button>

        {open && (
          <CampaignMenu
            campaignId={campaign.id}
            onClose={closeMenu}
          />
        )}

        {isPending && <div className="menu-loading-indicator" aria-hidden>Loading…</div>}
      </div>
    </div>
  );
}
