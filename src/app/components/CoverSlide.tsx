import type { CampaignState } from "../App";

// Plantillas de portada — compartidas entre el chat AI, el builder y la presentación
export const COVER_TEMPLATES = [
  { id: "classic", label: "Classic" },
  { id: "editorial", label: "Editorial" },
  { id: "minimal", label: "Minimal" },
  { id: "split", label: "Split" },
] as const;

export const COVER_COLORS = ["#111827", "#2c6bf2", "#6366F1", "#E11D48", "#F59E0B", "#10B981"];

const SERIF = "Georgia, 'Times New Roman', serif";

const tint = (hex: string, alpha: string) => (/^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex);

// Wordmark OCX (o el logo subido de la marca)
function OcxLogo({ campaign, onDark = false, size = 14 }: { campaign: CampaignState; onDark?: boolean; size?: number }) {
  if (campaign.logoUrl) {
    return <img src={campaign.logoUrl} alt="Logo" style={{ height: size + 10 }} className="max-w-[110px] object-contain" />;
  }
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: "0.18em", color: onDark ? "#ffffff" : "#111827" }}>
      OCX<span style={{ color: onDark ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>®</span>
    </span>
  );
}

export function CoverSlide({ campaign }: { campaign: CampaignState }) {
  const accent = campaign.brandColor || "#2c6bf2";
  const tpl = (campaign.coverTemplate || "classic").toLowerCase();
  const metaParts = [campaign.clientName, campaign.reviewRound, campaign.shippingDate].filter(Boolean);

  // ── EDITORIAL — estilo revista: índice, título serif enorme, hairlines ──
  if (tpl === "editorial") {
    return (
      <div className="w-full h-full flex flex-col px-12 py-9" style={{ background: "#ffffff" }}>
        <div className="flex items-center justify-between pb-4 shrink-0" style={{ borderBottom: "1px solid #111827" }}>
          <OcxLogo campaign={campaign} />
          <div className="flex items-center gap-5">
            {metaParts.map((p, i) => (
              <span key={i} className="uppercase" style={{ fontSize: "9px", letterSpacing: "0.22em", color: "#111827" }}>{p}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-end min-h-0 pb-6">
          <div className="flex items-end gap-6 w-full">
            <span className="shrink-0 leading-none" style={{ fontFamily: SERIF, fontSize: "15px", color: accent, paddingBottom: "10px" }}>N°01</span>
            <h1 className="leading-[0.95] tracking-tight" style={{ fontFamily: SERIF, fontSize: "62px", fontWeight: 400, color: "#111827" }}>
              {campaign.campaignName}
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 shrink-0" style={{ borderTop: "1px solid #e5e7eb" }}>
          <span className="uppercase" style={{ fontSize: "8px", letterSpacing: "0.25em", color: "#9ca3af" }}>Campaign Preview</span>
          <div className="w-8 h-[3px]" style={{ background: accent }} />
        </div>
      </div>
    );
  }

  // ── MINIMAL — máximo espacio en blanco, todo centrado ──
  if (tpl === "minimal") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-7 px-16" style={{ background: "#ffffff" }}>
        <OcxLogo campaign={campaign} size={11} />
        <h1 className="text-center leading-tight" style={{ fontFamily: SERIF, fontSize: "40px", fontWeight: 400, color: "#111827", letterSpacing: "-0.01em" }}>
          {campaign.campaignName}
        </h1>
        <div className="w-10 h-px" style={{ background: accent }} />
        {metaParts.length > 0 && (
          <p className="uppercase text-center" style={{ fontSize: "9px", letterSpacing: "0.3em", color: "#9ca3af" }}>
            {metaParts.join("   ·   ")}
          </p>
        )}
      </div>
    );
  }

  // ── SPLIT — bloque de color lateral, título en blanco ──
  if (tpl === "split") {
    return (
      <div className="w-full h-full flex" style={{ background: "#ffffff" }}>
        <div className="w-[46%] h-full flex flex-col justify-between p-9 shrink-0" style={{ background: accent }}>
          <OcxLogo campaign={campaign} onDark />
          <h1 className="leading-[1.02] text-white" style={{ fontFamily: SERIF, fontSize: "38px", fontWeight: 400 }}>
            {campaign.campaignName}
          </h1>
        </div>
        <div className="flex-1 flex flex-col p-9 min-w-0">
          {campaign.heroUrl ? (
            <div className="flex-1 overflow-hidden min-h-0 mb-6">
              <img src={campaign.heroUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <span className="uppercase rotate-90 whitespace-nowrap" style={{ fontSize: "9px", letterSpacing: "0.4em", color: tint(accent, "66") }}>
                Campaign Preview
              </span>
            </div>
          )}
          <div className="shrink-0 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
            {metaParts.map((p, i) => (
              <p key={i} style={{ fontSize: "11px", color: i === 0 ? "#111827" : "#9ca3af", fontWeight: i === 0 ? 600 : 400, lineHeight: 1.7 }}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── CLASSIC — editorial sobrio, título abajo a la izquierda ──
  return (
    <div className="w-full h-full flex flex-col p-11" style={{ background: "#ffffff" }}>
      <div className="flex items-center justify-between shrink-0">
        <OcxLogo campaign={campaign} />
        <span className="uppercase" style={{ fontSize: "8px", letterSpacing: "0.25em", color: "#9ca3af" }}>Campaign Preview</span>
      </div>
      <div className="mt-auto">
        <div className="w-9 h-[3px] mb-7" style={{ background: accent }} />
        <h1 className="leading-[1.04] tracking-tight mb-5" style={{ fontFamily: SERIF, fontSize: "46px", fontWeight: 400, color: "#111827" }}>
          {campaign.campaignName}
        </h1>
        {metaParts.length > 0 && (
          <div className="flex items-center gap-3">
            {metaParts.map((p, i) => (
              <span key={i} className="flex items-center gap-3" style={{ fontSize: "11px", color: "#6b7280" }}>
                {i > 0 && <span style={{ color: "#d1d5db" }}>—</span>}
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Miniatura de cada plantilla — usada en el panel del builder y en el chat del asistente
export function CoverTemplateMini({ id, accent = "#2c6bf2" }: { id: string; accent?: string }) {
  return (
    <div className="w-full rounded-md overflow-hidden relative" style={{ aspectRatio: "16/9", background: "#ffffff", border: "1px solid #e5e7eb" }}>
      {id === "classic" && (
        <>
          <span className="absolute left-1.5 top-1.5" style={{ fontSize: "4px", fontWeight: 800, letterSpacing: "0.15em", color: "#111827" }}>OCX®</span>
          <div className="absolute left-1.5 bottom-1.5">
            <div className="w-3 h-[2px] mb-1" style={{ background: accent }} />
            <div className="w-9 h-1.5 rounded-[1px] bg-gray-800 mb-0.5" />
            <div className="w-5 h-0.5 rounded-[1px] bg-gray-300" />
          </div>
        </>
      )}
      {id === "editorial" && (
        <>
          <div className="absolute left-1.5 right-1.5 top-2 flex items-center justify-between pb-0.5" style={{ borderBottom: "0.5px solid #111827" }}>
            <span style={{ fontSize: "4px", fontWeight: 800, letterSpacing: "0.15em", color: "#111827" }}>OCX®</span>
            <div className="w-4 h-0.5 bg-gray-300 rounded-[1px]" />
          </div>
          <div className="absolute left-1.5 bottom-3 flex items-end gap-1">
            <span style={{ fontSize: "3px", color: accent }}>N°01</span>
            <div className="w-10 h-2 rounded-[1px] bg-gray-800" />
          </div>
          <div className="absolute left-1.5 right-1.5 bottom-1 pt-0.5" style={{ borderTop: "0.5px solid #e5e7eb" }} />
        </>
      )}
      {id === "minimal" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3px]">
          <span style={{ fontSize: "3px", fontWeight: 800, letterSpacing: "0.15em", color: "#111827" }}>OCX®</span>
          <div className="w-8 h-1.5 rounded-[1px] bg-gray-800" />
          <div className="w-2.5 h-px" style={{ background: accent }} />
          <div className="w-5 h-0.5 rounded-[1px] bg-gray-300" />
        </div>
      )}
      {id === "split" && (
        <>
          <div className="absolute inset-y-0 left-0 w-[46%] p-1" style={{ background: accent }}>
            <span style={{ fontSize: "3.5px", fontWeight: 800, letterSpacing: "0.15em", color: "#ffffff" }}>OCX®</span>
            <div className="absolute left-1 bottom-1 w-6 h-1.5 rounded-[1px] bg-white/90" />
          </div>
          <div className="absolute right-1.5 bottom-1.5">
            <div className="w-4 h-0.5 rounded-[1px] bg-gray-400 mb-0.5" />
            <div className="w-3 h-0.5 rounded-[1px] bg-gray-200" />
          </div>
        </>
      )}
    </div>
  );
}
