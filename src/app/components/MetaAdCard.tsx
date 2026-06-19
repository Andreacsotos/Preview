import React from "react";

export interface AdCopy { copy: string; headline: string; subtext: string }

export const EMPTY_AD_COPY: AdCopy = { copy: "", headline: "", subtext: "" };

const META_BLUE = "#1877F2";

// Mockup de anuncio de Meta (feed) — compartido entre el Preview Builder (editable)
// y la Presentación (solo lectura) para que ambos se vean idénticos.
export function MetaAdCard({
  imageUrl,
  fileType,
  name,
  ar,
  ad,
  brandName,
  logoUrl,
  editable = false,
  onAdChange,
  onMediaSize,
  removeBtn,
}: {
  imageUrl?: string;
  fileType?: string;
  name: string;
  ar: number;
  ad: AdCopy;
  brandName: string;
  logoUrl?: string | null;
  editable?: boolean;
  onAdChange?: (u: Partial<AdCopy>) => void;
  onMediaSize?: (w: number, h: number) => void;
  removeBtn?: React.ReactNode;
}) {
  const isLandscape = ar > 1.15;
  const formatLabel = isLandscape ? "Collection / Carousel" : "Post";
  const initials = (brandName || "Brand").slice(0, 2).toUpperCase();

  return (
    <div className="relative rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0 max-h-full" style={{ background: "#fff", border: "1px solid #e5e7eb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {removeBtn}
      {/* Format badge */}
      <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-full text-white font-semibold" style={{ fontSize: "7px", background: META_BLUE + "cc", backdropFilter: "blur(4px)" }}>
        {formatLabel}
      </div>
      {/* Profile header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0">
        <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: META_BLUE }}>
          {logoUrl
            ? <img src={logoUrl} className="w-full h-full object-cover" />
            : <span style={{ fontSize: "7px", color: "#fff", fontWeight: 700 }}>{initials}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ fontSize: "8px", color: "#111827", lineHeight: 1.2 }}>
            {brandName || "Brand"}
          </p>
          <p style={{ fontSize: "7px", color: "#9ca3af", lineHeight: 1.2 }}>Publicidad</p>
        </div>
        <span style={{ fontSize: "11px", color: "#9ca3af", letterSpacing: "1px" }}>···</span>
      </div>
      {/* Ad copy text */}
      <div className="px-2 pb-1 shrink-0">
        {editable ? (
          <textarea
            value={ad.copy}
            onChange={(e) => onAdChange?.({ copy: e.target.value })}
            placeholder="Escribe el copy del anuncio…"
            rows={2}
            className="w-full resize-none outline-none bg-transparent"
            style={{ fontSize: "8px", color: "#111827", lineHeight: 1.45, border: "none" }}
          />
        ) : (
          ad.copy && <p style={{ fontSize: "8px", color: "#111827", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{ad.copy}</p>
        )}
      </div>
      {/* Image / video */}
      <div className="relative w-full min-h-0" style={{ aspectRatio: String(ar), flex: "0 1 auto", background: "#f3f4f6" }}>
        {fileType === "video" && imageUrl ? (
          <video src={imageUrl} className="absolute inset-0 w-full h-full object-contain" controls playsInline
            onLoadedMetadata={(e) => onMediaSize?.(e.currentTarget.videoWidth, e.currentTarget.videoHeight)} />
        ) : imageUrl ? (
          <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-contain"
            onLoad={(e) => onMediaSize?.(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#f3f4f6" }}>
            <div className="w-8 h-4 rounded" style={{ background: "#e5e7eb" }} />
          </div>
        )}
      </div>
      {/* Footer — headline + CTA */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 shrink-0" style={{ borderTop: "1px solid #f3f4f6" }}>
        <div className="flex-1 min-w-0">
          {editable ? (
            <>
              <input
                value={ad.headline}
                onChange={(e) => onAdChange?.({ headline: e.target.value })}
                placeholder="Headline del anuncio"
                className="block w-full outline-none bg-transparent font-bold truncate"
                style={{ fontSize: "9px", color: "#111827" }}
              />
              <input
                value={ad.subtext}
                onChange={(e) => onAdChange?.({ subtext: e.target.value })}
                placeholder={brandName || "Marca"}
                className="block w-full outline-none bg-transparent truncate"
                style={{ fontSize: "8px", color: "#6b7280" }}
              />
            </>
          ) : (
            <>
              <p className="font-bold truncate" style={{ fontSize: "9px", color: "#111827" }}>{ad.headline || "Headline del anuncio"}</p>
              <p className="truncate" style={{ fontSize: "8px", color: "#6b7280" }}>{ad.subtext || brandName || "Marca"}</p>
            </>
          )}
        </div>
        <div className="shrink-0 rounded px-2 py-0.5 font-semibold" style={{ fontSize: "8px", color: "#374151", background: "#f3f4f6", border: "1px solid #e5e7eb" }}>
          Ver más
        </div>
      </div>
    </div>
  );
}
