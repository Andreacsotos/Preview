import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X, ChevronLeft, ChevronRight, MessageSquare,
  Check, RotateCcw, Send, Download, Play, Maximize2,
  Share2, Copy, Globe, Lock, Mail,
} from "lucide-react";
import { toast } from "sonner";
import type { CampaignState, BuilderPiece } from "../App";
import { HtmlBannerFrame } from "./HtmlBannerFrame";
import { CoverSlide, CoverTemplateMini } from "./CoverSlide";
import { MetaAdCard, EMPTY_AD_COPY } from "./MetaAdCard";

interface Props {
  onExit: () => void;
  campaign: CampaignState;
}

// Resolves any CSS color value (including oklch) to a hex string via canvas API.
// html2canvas does not support oklch (used by Tailwind v4), so we pre-convert.
function resolveColorToHex(color: string): string {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    return ctx.fillStyle;
  } catch {
    return color;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PresSlide {
  id: string;
  type: "cover" | "intro" | "pieces";
  platform?: string;
  platformColor?: string;
  subCampaign?: string;
  label: string;
  subtitle: string;
  pieces?: BuilderPiece[];
  partLabel?: string;
}

interface CommentReply {
  id: string;
  authorName: string;
  body: string;
  createdAt: number;
}

interface Comment {
  id: string;
  slideId: string;
  x: number;
  y: number;
  elementId?: string;
  elementLabel?: string;
  authorName: string;
  body: string;
  createdAt: number;
  resolved: boolean;
  replies: CommentReply[];
}

type ViewMode = "slides" | "presentation";

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  Meta: "#1877F2",
  Instagram: "#E1306C",
  TikTok: "#010101",
  YouTube: "#FF0000",
  LinkedIn: "#0077B5",
  Twitter: "#1DA1F2",
  Pinterest: "#E60023",
  Snapchat: "#FFFC00",
  Display: "#34A853",
  Programmatic: "#FF6D00",
};

const PLATFORM_ORDER = [
  "Meta", "Instagram", "TikTok", "YouTube", "LinkedIn",
  "Twitter", "Pinterest", "Snapchat", "Display", "Programmatic",
];

// debe coincidir con el Preview Builder para que los slides sean idénticos
const PIECES_PER_SLIDE = 3;

const DEFAULT_LEGAL =
  "Válido del 24 / Abr. / al 7 / May. / 2026. Tarjeta Éxito Mastercard emitida por la Compañía de Financiamiento TUYA S.A.";

const sortByOrder = (arr: string[]) =>
  [...arr].sort((a, b) => {
    const ai = PLATFORM_ORDER.indexOf(a);
    const bi = PLATFORM_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
};

// ── Slide builder ─────────────────────────────────────────────────────────────

function buildPresSlides(campaign: CampaignState): PresSlide[] {
  const result: PresSlide[] = [
    { id: "cover", type: "cover", label: "Portada", subtitle: campaign.campaignName },
  ];

  // preferir el estado del builder: es exactamente lo que el usuario armó/editó allá
  const builderGroups = campaign.builderState?.groups ?? {};
  const groups = Object.keys(builderGroups).length > 0 ? builderGroups : (campaign.uploadedGroups ?? {});
  const hasPlatforms = (campaign.uploadedPlatforms?.length ?? 0) > 0;

  let normalizedGroups: Record<string, Record<string, BuilderPiece[]>>;
  if (Object.keys(groups).length > 0) {
    normalizedGroups = groups;
  } else if (hasPlatforms) {
    normalizedGroups = { "": {} };
    for (const plat of campaign.uploadedPlatforms) {
      normalizedGroups[""][plat] = campaign.uploadedPieces[plat] ?? [];
    }
  } else {
    return result;
  }

  const namedSubs = Object.keys(normalizedGroups).filter((k) => k !== "").sort();
  const orderedSubs = [...namedSubs, ...(normalizedGroups[""] ? [""] : [])];

  for (const sub of orderedSubs) {
    const platformGroup = normalizedGroups[sub] ?? {};
    for (const platform of sortByOrder(Object.keys(platformGroup))) {
      const pieces = platformGroup[platform] ?? [];
      const chunks = chunkArray(pieces, PIECES_PER_SLIDE);
      const multi = chunks.length > 1;
      const baseId = `${sub}||${platform}`;

      result.push({
        id: `${baseId}-intro`,
        type: "intro",
        platform,
        subCampaign: sub || undefined,
        platformColor: PLATFORM_COLORS[platform] ?? "#888",
        label: "Intro",
        subtitle: platform,
      });

      chunks.forEach((chunk, i) => {
        result.push({
          id: `${baseId}-pieces-${i}`,
          type: "pieces",
          platform,
          subCampaign: sub || undefined,
          platformColor: PLATFORM_COLORS[platform] ?? "#888",
          label: multi ? `Piezas ${i + 1}/${chunks.length}` : "Piezas",
          subtitle: `${chunk.length} pieza${chunk.length !== 1 ? "s" : ""}`,
          pieces: chunk,
          partLabel: multi ? `${i + 1}/${chunks.length}` : undefined,
        });
      });
    }
  }

  return result;
}

// ── Cover slide ───────────────────────────────────────────────────────────────
// (compartida con el Preview Builder — ver components/CoverSlide.tsx)

// ── Intro slide ───────────────────────────────────────────────────────────────

function IntroSlide({ slide, campaign }: { slide: PresSlide; campaign: CampaignState }) {
  const d = campaign.builderState?.introData?.[`${slide.subCampaign ?? ""}||${slide.platform}`];
  const title = d?.title ?? `${slide.platform} Ads`;
  const subtitle = d?.subtitle ?? "";
  return (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-12 text-center gap-4">
      {slide.subCampaign && (
        <p className="text-gray-300 uppercase tracking-[0.15em]" style={{ fontSize: "9px" }}>{slide.subCampaign}</p>
      )}
      <div className="flex items-center gap-3">
        <div className="h-px bg-gray-200 w-14" />
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slide.platformColor }} />
          <span className="text-gray-400 font-semibold tracking-widest uppercase" style={{ fontSize: "10px" }}>
            {slide.platform}
          </span>
        </div>
        <div className="h-px bg-gray-200 w-14" />
      </div>
      <h2 className="text-gray-900 font-bold" style={{ fontSize: "38px", fontWeight: 700, letterSpacing: "-0.5px" }}>{title}</h2>
      {subtitle && <p className="text-gray-400" style={{ fontSize: "14px" }}>{subtitle}</p>}
      <div className="h-px bg-gray-100 w-20 mt-1" />
    </div>
  );
}

// ── Pieces slide — réplica exacta del layout del Preview Builder (solo lectura) ──

function PiecesSlide({
  slide,
  campaign,
  commentMode,
  onPieceClick,
  onPieceDetail,
}: {
  slide: PresSlide;
  campaign: CampaignState;
  commentMode: boolean;
  onPieceClick?: (e: React.MouseEvent, pieceId: string, pieceLabel: string) => void;
  onPieceDetail?: (idx: number) => void;
}) {
  const bs = campaign.builderState;
  const pieces = slide.pieces ?? [];
  const isMeta = slide.platform === "Meta";
  const cols = pieces.length <= 1 ? 1 : pieces.length === 2 ? 2 : 3;
  const sl = bs?.slideLegals?.[slide.id] ?? { legal: DEFAULT_LEGAL, brand: "—" };

  return (
    <div className="w-full h-full bg-white flex">
      {/* LEFT — Legales */}
      <div className="p-3 flex flex-col gap-2 overflow-y-auto shrink-0" style={{ width: "20%", borderRight: "1px solid #f3f4f6" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: slide.platformColor }} />
          <span className="text-gray-400 font-semibold tracking-widest uppercase" style={{ fontSize: "8px" }}>
            {slide.platform}
          </span>
          {slide.subCampaign && (
            <span className="text-gray-300 ml-1" style={{ fontSize: "7px" }}>{slide.subCampaign}</span>
          )}
          {slide.partLabel && (
            <span className="ml-auto text-gray-300" style={{ fontSize: "8px" }}>Parte {slide.partLabel}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-violet-500 rotate-45 shrink-0" />
            <span className="text-violet-600 font-semibold tracking-widest uppercase" style={{ fontSize: "8px" }}>Legales</span>
          </div>
          <p className="text-gray-500 w-full flex-1" style={{ fontSize: "8px", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>
            {sl.legal}
          </p>
          <span className="self-start bg-violet-50 text-violet-700 rounded-full px-2 py-0.5 font-semibold" style={{ fontSize: "8px", maxWidth: "80px" }}>
            {sl.brand}
          </span>
        </div>
      </div>

      {/* RIGHT — Grid de piezas (mismo layout del builder) */}
      <div className="flex-1 flex flex-col overflow-hidden p-3">
        <div
          className="flex-1 grid min-h-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: "minmax(0, 1fr)", gap: "10px" }}
        >
          {pieces.map((piece, idx) => {
            const pd = bs?.piecesData?.[piece.id] ?? {};
            const name = pd.name ?? piece.name;
            const pieceTitle = pd.title ?? piece.title;
            const ar = bs?.measuredAr?.[piece.id] ?? piece.ar;
            const useMockup = isMeta && piece.fileType !== "video" && ar >= 0.9;
            const detailClick = !commentMode && onPieceDetail ? () => onPieceDetail(idx) : undefined;

            return (
              <div
                key={piece.id}
                data-piece-id={piece.id}
                data-piece-label={name}
                className="flex flex-col gap-1 relative min-h-0"
                style={{ cursor: commentMode ? "crosshair" : detailClick ? "pointer" : "default" }}
                onClick={commentMode && onPieceClick ? (e) => onPieceClick(e, piece.id, name) : detailClick}
              >
                {useMockup ? (
                  <MetaAdCard
                    imageUrl={piece.imageUrl}
                    fileType={piece.fileType}
                    name={name}
                    ar={ar}
                    ad={bs?.adCopyData?.[piece.id] ?? EMPTY_AD_COPY}
                    brandName={campaign.clientName}
                    logoUrl={campaign.logoUrl}
                  />
                ) : (
                  <>
                    <div className="relative w-full min-h-0" style={{ aspectRatio: String(ar), flex: "0 1 auto" }}>
                      {piece.fileType === "html" && piece.imageUrl ? (
                        <HtmlBannerFrame
                          src={piece.imageUrl}
                          title={name}
                          className="absolute inset-0"
                          style={{ width: "100%", height: "100%", pointerEvents: "none" }}
                        />
                      ) : piece.fileType === "video" && piece.imageUrl ? (
                        <video
                          src={piece.imageUrl}
                          className="absolute inset-0 w-full h-full object-contain"
                          preload="metadata"
                          controls
                          playsInline
                          style={{ background: "#000" }}
                        />
                      ) : piece.imageUrl ? (
                        <img
                          src={piece.imageUrl}
                          alt={name}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 rounded-lg border flex items-center justify-center" style={{ background: "#f9fafb", borderColor: "#f3f4f6" }}>
                          <div className="w-8 h-4 rounded opacity-60" style={{ background: "#f3f4f6" }} />
                        </div>
                      )}
                    </div>
                    <p className="w-full shrink-0 truncate" style={{ fontSize: "7px", fontFamily: "monospace", color: "#6b7280" }}>{name}</p>
                    <span className="shrink-0" style={{ fontSize: "7px", color: "#d1d5db" }}>{piece.dim}</span>
                    {pieceTitle && (
                      <p className="w-full font-medium shrink-0" style={{ fontSize: "9px", color: "#6b7280" }}>{pieceTitle}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Full slide dispatcher ─────────────────────────────────────────────────────

function FullSlide({
  slide,
  campaign,
  commentMode,
  onPieceClick,
  onPieceDetail,
}: {
  slide: PresSlide;
  campaign: CampaignState;
  commentMode: boolean;
  onPieceClick?: (e: React.MouseEvent, pieceId: string, pieceLabel: string) => void;
  onPieceDetail?: (idx: number) => void;
}) {
  if (slide.type === "cover") return <CoverSlide campaign={campaign} />;
  if (slide.type === "intro") return <IntroSlide slide={slide} campaign={campaign} />;
  return (
    <PiecesSlide
      slide={slide}
      campaign={campaign}
      commentMode={commentMode}
      onPieceClick={onPieceClick}
      onPieceDetail={onPieceDetail}
    />
  );
}

// ── Slide thumbnail ───────────────────────────────────────────────────────────

function SlideThumbnail({
  slide,
  campaign,
  active,
  index,
  commentCount,
  onClick,
}: {
  slide: PresSlide;
  campaign: CampaignState;
  active: boolean;
  index: number;
  commentCount: number;
  onClick: () => void;
}) {
  const renderMini = () => {
    if (slide.type === "cover") {
      return (
        <CoverTemplateMini
          id={(campaign.coverTemplate || "classic").toLowerCase()}
          accent={campaign.brandColor || "#2c6bf2"}
        />
      );
    }
    if (slide.type === "intro") {
      const color = slide.platformColor ?? "#888";
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-white">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <div className="w-10 h-[4px] rounded bg-gray-700" />
          <div className="w-7 h-[3px] rounded bg-gray-200" />
        </div>
      );
    }
    const pieces = slide.pieces ?? [];
    const cols = pieces.length <= 2 ? pieces.length : pieces.length <= 4 ? 2 : 3;
    return (
      <div className="w-full h-full p-1.5 bg-white">
        <div className="h-[6px] border-b border-gray-100 mb-1 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: slide.platformColor ?? "#888" }} />
          <div className="w-6 h-[3px] rounded bg-gray-300" />
        </div>
        <div className="grid gap-0.5 h-[calc(100%-10px)]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {pieces.slice(0, 6).map((p) => (
            <div key={p.id} className="rounded bg-gray-100 overflow-hidden">
              {p.fileType === "video" ? (
                <video src={p.imageUrl} className="w-full h-full object-cover" preload="metadata" muted />
              ) : p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-all duration-100 text-left ${
        active ? "bg-white shadow-sm ring-1 ring-gray-200" : "hover:bg-white/70"
      }`}
    >
      <span className={`text-[10px] font-medium mt-0.5 w-4 shrink-0 text-right leading-none ${active ? "text-gray-500" : "text-gray-300"}`}>
        {index + 1}
      </span>
      <div className="flex-1 relative">
        <div className="aspect-video rounded overflow-hidden border border-gray-200 bg-white">
          {renderMini()}
        </div>
        {commentCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
            <span style={{ fontSize: "8px", fontWeight: 700, color: "#78350F" }}>{commentCount}</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Piece detail overlay ──────────────────────────────────────────────────────

function PieceDetailOverlay({
  piece,
  totalCount,
  currentIdx,
  onPrev,
  onNext,
  onClose,
}: {
  piece: BuilderPiece;
  totalCount: number;
  currentIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const isVideo = piece.fileType === "video";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-5xl w-full mx-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/50 hover:text-white cursor-pointer transition-colors"
        >
          <X size={22} />
        </button>

        {/* Media */}
        <div className="w-full flex items-center justify-center" style={{ maxHeight: "72vh" }}>
          {isVideo ? (
            <video
              key={piece.id}
              src={piece.imageUrl}
              className="max-w-full max-h-full rounded-lg"
              style={{ maxHeight: "72vh" }}
              controls
              autoPlay={false}
              playsInline
            />
          ) : (
            <img
              key={piece.id}
              src={piece.imageUrl}
              alt={piece.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: "72vh" }}
            />
          )}
        </div>

        {/* Info */}
        <div className="mt-4 text-center">
          <p className="text-white/80 text-sm font-medium">{piece.name}</p>
          <p className="text-white/40 text-xs mt-1">{piece.dim} · {currentIdx + 1} of {totalCount}</p>
        </div>

        {/* Prev arrow */}
        {currentIdx > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-0 top-1/2 -translate-y-8 -translate-x-14 text-white/50 hover:text-white cursor-pointer transition-colors"
          >
            <ChevronLeft size={36} />
          </button>
        )}

        {/* Next arrow */}
        {currentIdx < totalCount - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-0 top-1/2 -translate-y-8 translate-x-14 text-white/50 hover:text-white cursor-pointer transition-colors"
          >
            <ChevronRight size={36} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Comment pin badge ─────────────────────────────────────────────────────────

function CommentPinBadge({
  comment,
  index,
  active,
  onClick,
}: {
  comment: Comment;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute flex items-center justify-center rounded-full shadow-md transition-transform duration-100 hover:scale-110"
      style={{
        left: `${comment.x}%`,
        top: `${comment.y}%`,
        transform: "translate(-50%, -50%)",
        width: "22px",
        height: "22px",
        backgroundColor: comment.resolved ? "#9CA3AF" : "#111827",
        border: active ? "2px solid #F59E0B" : "2px solid white",
        pointerEvents: "auto",
        zIndex: 20,
      }}
    >
      <span style={{ fontSize: "9px", fontWeight: 700, color: "white" }}>{index + 1}</span>
    </button>
  );
}

// ── Pending input bubble ──────────────────────────────────────────────────────

function PendingBubble({
  x,
  y,
  containerRef,
  onSubmit,
  onCancel,
}: {
  x: number;
  y: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const rect = containerRef.current?.getBoundingClientRect();
  const bubbleW = 240;
  const bubbleH = 130;
  const pixelX = rect ? (x / 100) * rect.width : 0;
  const pixelY = rect ? (y / 100) * rect.height : 0;

  let left = pixelX + 16;
  let top = pixelY - 12;
  if (rect) {
    if (left + bubbleW > rect.width - 4) left = pixelX - bubbleW - 16;
    if (left < 4) left = 4;
    if (top + bubbleH > rect.height - 4) top = rect.height - bubbleH - 4;
    if (top < 4) top = 4;
  }

  return (
    <div
      className="absolute z-30 bg-white rounded-xl shadow-xl border border-gray-200 p-3 flex flex-col gap-2"
      style={{ left, top, width: bubbleW, pointerEvents: "auto" }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Deja un comentario…"
        rows={3}
        className="w-full resize-none border border-gray-200 rounded-lg px-2.5 py-2 text-gray-700 outline-none focus:border-gray-400 transition-colors"
        style={{ fontSize: "12px" }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (body.trim()) onSubmit(body.trim());
          }
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" style={{ fontSize: "11px" }}>
          Cancel
        </button>
        <button
          onClick={() => { if (body.trim()) onSubmit(body.trim()); }}
          disabled={!body.trim()}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-2.5 py-1 rounded-lg cursor-pointer hover:bg-gray-700 disabled:opacity-40 disabled:cursor-default transition-all"
          style={{ fontSize: "11px" }}
        >
          <Send size={10} />
          Post
        </button>
      </div>
    </div>
  );
}

// ── Comment card ──────────────────────────────────────────────────────────────

function CommentCard({
  comment,
  pinIndex,
  active,
  onResolve,
  onReopen,
  onReply,
  onSelect,
}: {
  comment: Comment;
  pinIndex: number;
  active: boolean;
  onResolve: () => void;
  onReopen: () => void;
  onReply: (body: string) => void;
  onSelect: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border cursor-pointer transition-all ${
        active ? "border-yellow-400 bg-yellow-50/40" : "border-gray-100 bg-white hover:border-gray-200"
      } p-3`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: comment.resolved ? "#9CA3AF" : "#111827" }}
          >
            <span style={{ fontSize: "8px", fontWeight: 700, color: "white" }}>{pinIndex + 1}</span>
          </div>
          <div>
            <p className="text-gray-800" style={{ fontSize: "11px", fontWeight: 600 }}>{comment.authorName}</p>
            {comment.elementLabel && (
              <p className="text-gray-400" style={{ fontSize: "10px" }}>en {comment.elementLabel}</p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {comment.resolved ? (
            <button
              onClick={(e) => { e.stopPropagation(); onReopen(); }}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors px-1.5 py-0.5 rounded-md hover:bg-gray-100"
              style={{ fontSize: "10px" }}
            >
              <RotateCcw size={9} />
              Reabrir
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onResolve(); }}
              className="flex items-center gap-1 text-green-600 hover:text-green-700 cursor-pointer transition-colors px-1.5 py-0.5 rounded-md hover:bg-green-50"
              style={{ fontSize: "10px" }}
            >
              <Check size={9} />
              Resolver
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-700 mb-1.5" style={{ fontSize: "12px", lineHeight: 1.5 }}>{comment.body}</p>
      <p className="text-gray-400 mb-2" style={{ fontSize: "10px" }}>
        {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>

      {comment.replies.length > 0 && (
        <div className="border-l-2 border-gray-100 pl-3 mb-2 space-y-1.5">
          {comment.replies.map((reply) => (
            <div key={reply.id}>
              <p className="text-gray-700" style={{ fontSize: "11px", fontWeight: 600 }}>{reply.authorName}</p>
              <p className="text-gray-600" style={{ fontSize: "11px", lineHeight: 1.4 }}>{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      {!comment.resolved && (
        replying ? (
          <div className="flex flex-col gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
            <textarea
              autoFocus
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Responder…"
              rows={2}
              className="w-full resize-none border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:border-gray-400 transition-colors"
              style={{ fontSize: "11px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (replyBody.trim()) { onReply(replyBody.trim()); setReplyBody(""); setReplying(false); }
                }
                if (e.key === "Escape") setReplying(false);
              }}
            />
            <div className="flex items-center justify-between">
              <button onClick={() => setReplying(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" style={{ fontSize: "10px" }}>
                Cancelar
              </button>
              <button
                onClick={() => { if (replyBody.trim()) { onReply(replyBody.trim()); setReplyBody(""); setReplying(false); } }}
                disabled={!replyBody.trim()}
                className="flex items-center gap-1 bg-gray-900 text-white px-2 py-0.5 rounded-lg cursor-pointer hover:bg-gray-700 disabled:opacity-40 transition-all"
                style={{ fontSize: "10px" }}
              >
                <Send size={9} />
                Responder
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setReplying(true); }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors mt-0.5"
            style={{ fontSize: "10px" }}
          >
            Responder
          </button>
        )
      )}
    </div>
  );
}

// ── Name prompt modal ─────────────────────────────────────────────────────────

function NamePromptModal({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4"
      >
        <div>
          <h3 className="text-gray-900 font-semibold" style={{ fontSize: "15px" }}>¿Quién está viendo?</h3>
          <p className="text-gray-400 mt-1" style={{ fontSize: "12px" }}>Escribe tu nombre para entrar a la presentación. Así todos saben quién está viendo y quién comenta.</p>
        </div>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="border border-gray-200 rounded-xl px-3 py-2 text-gray-800 outline-none focus:border-gray-400 transition-colors w-full"
          style={{ fontSize: "13px" }}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSave(name.trim()); }}
        />
        <button
          onClick={() => { if (name.trim()) onSave(name.trim()); }}
          disabled={!name.trim()}
          className="w-full bg-gray-900 text-white rounded-xl py-2 cursor-pointer hover:bg-gray-700 disabled:opacity-40 disabled:cursor-default transition-all font-medium"
          style={{ fontSize: "13px" }}
        >
          Entrar
        </button>
      </motion.div>
    </div>
  );
}

// ── Export modal ──────────────────────────────────────────────────────────────

function ExportModal({
  onClose,
  onExportBannersAll,
  onExportBannersByCampaign,
  onExportBannersByChannel,
  onExportPDF,
  videoPreset,
  onVideoPresetChange,
}: {
  onClose: () => void;
  onExportBannersAll: () => void;
  onExportBannersByCampaign: () => void;
  onExportBannersByChannel: () => void;
  onExportPDF: () => void;
  videoPreset: VideoPresetId;
  onVideoPresetChange: (p: VideoPresetId) => void;
}) {
  const [expandedOption, setExpandedOption] = useState<"banners" | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-[420px] flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-gray-900 font-semibold" style={{ fontSize: "15px" }}>Exportar presentación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {/* BANNERS */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedOption(expandedOption === "banners" ? null : "banners")}
              className="w-full flex items-start gap-3 p-3.5 hover:bg-gray-50 cursor-pointer transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Download size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-semibold" style={{ fontSize: "14px" }}>BANNERS</p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: "11px" }}>
                  Exporta JPG/PNG (imágenes) y MP4 (videos), organizados en estructura de carpetas
                </p>
              </div>
              <ChevronRight
                size={16}
                className={`text-gray-400 transition-transform mt-1 ${expandedOption === "banners" ? "rotate-90" : ""}`}
              />
            </button>
            <AnimatePresence>
              {expandedOption === "banners" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="border-t border-gray-100"
                >
                  <div className="px-3 pb-3 pt-2 flex flex-col gap-1.5">
                    {/* Optimización de video — estilo Frame.io */}
                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5 mb-1">
                      <p className="text-gray-500 mb-1.5" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Optimización de video
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {VIDEO_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => onVideoPresetChange(p.id)}
                            className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left cursor-pointer transition-all ${
                              videoPreset === p.id ? "bg-white border border-gray-300 shadow-sm" : "border border-transparent hover:bg-white/60"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-800" style={{ fontSize: "11px", fontWeight: 600 }}>{p.label}</span>
                              <span className="text-gray-400 ml-1.5" style={{ fontSize: "10px" }}>{p.desc}</span>
                            </div>
                            {videoPreset === p.id && <Check size={12} className="text-gray-700 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={onExportBannersAll}
                      className="w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>Todas las piezas</p>
                    </button>
                    <button
                      onClick={onExportBannersByCampaign}
                      className="w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>Por campaña</p>
                    </button>
                    <button
                      onClick={onExportBannersByChannel}
                      className="w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>Por canal</p>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PDF */}
          <button
            onClick={onExportPDF}
            className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Download size={16} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-semibold" style={{ fontSize: "14px" }}>PDF</p>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "11px" }}>
                Exporta toda la presentación como un único archivo PDF
              </p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Share modal ───────────────────────────────────────────────────────────────

// Clave de acceso generada por el sistema (se renueva cada 30 días)
const genAccessKey = () => Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

// ── Optimización de video (estilo Frame.io) ───────────────────────────────────

export const VIDEO_PRESETS = [
  { id: "original", label: "Original", desc: "Sin recomprimir · calidad y peso de origen", maxH: 0, bps: 0 },
  { id: "1080", label: "1080p · Alta", desc: "~8 Mbps · revisión de alta fidelidad", maxH: 1080, bps: 8_000_000 },
  { id: "720", label: "720p · Media", desc: "~4 Mbps · balance entre peso y calidad", maxH: 720, bps: 4_000_000 },
  { id: "540", label: "540p · Proxy", desc: "~2 Mbps · liviano, ideal para compartir", maxH: 540, bps: 2_000_000 },
] as const;

export type VideoPresetId = (typeof VIDEO_PRESETS)[number]["id"];

// Recomprime un video en el navegador (canvas + MediaRecorder).
// Reproduce el video en tiempo real mientras lo recaptura a la resolución/bitrate objetivo.
async function optimizeVideo(url: string, maxHeight: number, bps: number): Promise<{ blob: Blob; ext: string }> {
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  await new Promise<void>((res, rej) => {
    video.onloadedmetadata = () => res();
    video.onerror = () => rej(new Error("No se pudo cargar el video"));
  });

  const scale = Math.min(1, maxHeight / (video.videoHeight || maxHeight));
  const w = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
  const h = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const stream = canvas.captureStream(30);

  // conservar el audio original si el navegador lo permite
  try {
    const src = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
    src?.getAudioTracks().forEach((t) => stream.addTrack(t));
  } catch { /* sin audio si captureStream no está disponible */ }

  const mime = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
    ? "video/mp4;codecs=avc1"
    : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bps });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise<void>((res) => { rec.onstop = () => res(); });

  let raf = 0;
  const draw = () => { ctx.drawImage(video, 0, 0, w, h); raf = requestAnimationFrame(draw); };

  rec.start(250);
  await video.play();
  draw();
  await new Promise<void>((res) => { video.onended = () => res(); });
  cancelAnimationFrame(raf);
  rec.stop();
  await stopped;
  video.src = "";

  return { blob: new Blob(chunks, { type: mime.split(";")[0] }), ext: mime.includes("mp4") ? "mp4" : "webm" };
}

function ShareModal({
  shareUrl,
  access,
  onAccessChange,
  password,
  onPasswordChange,
  invited,
  onInvite,
  onRemoveInvite,
  onClose,
}: {
  shareUrl: string;
  access: "public" | "password";
  onAccessChange: (a: "public" | "password") => void;
  password: string;
  onPasswordChange: (p: string) => void;
  invited: string[];
  onInvite: (email: string) => void;
  onRemoveInvite: (email: string) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(access === "password" && password ? `${shareUrl}?clave` : shareUrl);
      toast.success("Link copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  const sendInvite = () => {
    if (!emailValid) return;
    onInvite(email.trim().toLowerCase());
    toast.success(`Invitación enviada a ${email.trim()}`);
    setEmail("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-[440px] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-gray-900 font-semibold" style={{ fontSize: "15px" }}>Compartir presentación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Invitar por correo */}
        <div>
          <p className="text-gray-400 mb-2" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Invitar personas</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-gray-400 transition-colors">
              <Mail size={13} className="text-gray-400 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendInvite(); }}
                placeholder="correo@empresa.com"
                className="flex-1 outline-none text-gray-800 bg-transparent"
                style={{ fontSize: "13px" }}
              />
            </div>
            <button
              onClick={sendInvite}
              disabled={!emailValid}
              className="bg-gray-900 text-white rounded-xl px-4 cursor-pointer hover:bg-gray-700 disabled:opacity-40 disabled:cursor-default transition-all font-medium"
              style={{ fontSize: "13px" }}
            >
              Invitar
            </button>
          </div>
          {invited.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {invited.map((em) => (
                <span key={em} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-full pl-2.5 pr-1.5 py-1" style={{ fontSize: "11px" }}>
                  {em}
                  <button onClick={() => onRemoveInvite(em)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        {/* Acceso al link */}
        <div>
          <p className="text-gray-400 mb-2" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Acceso al link</p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onAccessChange("public")}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${access === "public" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <Globe size={15} className={access === "public" ? "text-gray-900 mt-0.5" : "text-gray-400 mt-0.5"} />
              <div className="flex-1">
                <p className="text-gray-900 font-medium" style={{ fontSize: "13px" }}>Cualquiera con el enlace</p>
                <p className="text-gray-400" style={{ fontSize: "11px" }}>Cualquier persona con el enlace puede ver la presentación</p>
              </div>
              {access === "public" && <Check size={14} className="text-gray-900 mt-0.5" />}
            </button>
            <button
              onClick={() => onAccessChange("password")}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${access === "password" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <Lock size={15} className={access === "password" ? "text-gray-900 mt-0.5" : "text-gray-400 mt-0.5"} />
              <div className="flex-1">
                <p className="text-gray-900 font-medium" style={{ fontSize: "13px" }}>Protegido con clave</p>
                <p className="text-gray-400" style={{ fontSize: "11px" }}>Acceso con clave de seguridad, que se renueva automáticamente cada 30 días</p>
              </div>
              {access === "password" && <Check size={14} className="text-gray-900 mt-0.5" />}
            </button>
            {access === "password" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-800 tracking-widest" style={{ fontSize: "13px", fontFamily: "monospace" }}>
                    {password}
                  </div>
                  <button
                    onClick={() => onPasswordChange(genAccessKey())}
                    title="Generar nueva clave"
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 cursor-pointer transition-all"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    onClick={async () => { try { await navigator.clipboard.writeText(password); toast.success("Clave copiada"); } catch {} }}
                    title="Copiar clave"
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 cursor-pointer transition-all"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Link */}
        <div className="flex gap-2">
          <div className="flex-1 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 truncate text-gray-500" style={{ fontSize: "12px", fontFamily: "monospace" }}>
            {shareUrl}
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-gray-900 text-white rounded-xl px-3.5 cursor-pointer hover:bg-gray-700 transition-all font-medium shrink-0"
            style={{ fontSize: "12px" }}
          >
            <Copy size={12} />
            Copiar link
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Frame05Presentation({ onExit, campaign }: Props) {
  const slides = useMemo(() => buildPresSlides(campaign), [campaign]);
  const [current, setCurrent] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("slides");
  const [commentMode, setCommentMode] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<{
    x: number; y: number; elementId?: string; elementLabel?: string;
  } | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(() => {
    try { return localStorage.getItem("vs_author"); } catch { return null; }
  });
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const [detailSlideId, setDetailSlideId] = useState<string | null>(null);
  const [detailPieceIdx, setDetailPieceIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [videoPreset, setVideoPreset] = useState<VideoPresetId>("original");

  // ── Compartir ──
  const [shareOpen, setShareOpen] = useState(false);
  const [shareAccess, setShareAccess] = useState<"public" | "password">("public");
  const [sharePassword, setSharePassword] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const shareUrl = useMemo(() => {
    const slug = (campaign.campaignName || "preview").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const token = Math.random().toString(36).slice(2, 8);
    return `${window.location.origin}/p/${slug}-${token}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.campaignName]);

  // ── Presencia (quién está viendo) — via BroadcastChannel entre pestañas ──
  const sessionId = useRef(`s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const [viewers, setViewers] = useState<Record<string, { name: string; color: string; ts: number }>>({});

  const slideRef = useRef<HTMLDivElement>(null);
  const safeIndex = Math.min(current, Math.max(0, slides.length - 1));
  const slide = slides[safeIndex];

  const toggleViewMode = useCallback(() => {
    setViewMode((m) => {
      if (m === "presentation") return "slides";
      setPendingDrop(null);
      return "presentation";
    });
  }, []);

  // Gate de entrada: para ver/comentar hay que identificarse (así se sabe quién está en el archivo)
  useEffect(() => {
    if (!authorName) setShowNamePrompt(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Presencia entre pestañas: announce/ping/leave con heartbeat, igual que los avatares de Figma
  useEffect(() => {
    if (!authorName || typeof BroadcastChannel === "undefined") return;
    const PRESENCE_COLORS = ["#2c6bf2", "#E11D48", "#10B981", "#F59E0B", "#8B5CF6", "#0EA5E9"];
    const myColor = PRESENCE_COLORS[sessionId.current.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PRESENCE_COLORS.length];
    const ch = new BroadcastChannel(`vs-presence-${campaign.campaignName || "default"}`);
    const me = () => ({ id: sessionId.current, name: authorName, color: myColor });

    ch.onmessage = (e) => {
      const m = e.data as { type: string; id: string; name: string; color: string };
      if (m.id === sessionId.current) return;
      if (m.type === "join" || m.type === "ping") {
        setViewers((v) => ({ ...v, [m.id]: { name: m.name, color: m.color, ts: Date.now() } }));
        if (m.type === "join") ch.postMessage({ type: "ping", ...me() }); // que el recién llegado nos vea
      }
      if (m.type === "leave") {
        setViewers((v) => { const n = { ...v }; delete n[m.id]; return n; });
      }
    };

    ch.postMessage({ type: "join", ...me() });
    const heartbeat = setInterval(() => {
      ch.postMessage({ type: "ping", ...me() });
      // limpiar viewers sin señal reciente
      setViewers((v) => Object.fromEntries(Object.entries(v).filter(([, x]) => Date.now() - x.ts < 8000)));
    }, 3000);

    const leave = () => { try { ch.postMessage({ type: "leave", ...me() }); } catch {} };
    window.addEventListener("beforeunload", leave);
    return () => {
      leave();
      window.removeEventListener("beforeunload", leave);
      clearInterval(heartbeat);
      ch.close();
      setViewers({});
    };
  }, [authorName, campaign.campaignName]);

  // Resuelve el archivo de una pieza aplicando la optimización de video elegida
  const getPieceFile = useCallback(async (piece: BuilderPiece): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!piece.imageUrl) return null;
    const baseName = (piece.fileName ?? piece.name).replace(/\.[^.]+$/, "");
    if (piece.fileType === "video" && videoPreset !== "original") {
      const preset = VIDEO_PRESETS.find((p) => p.id === videoPreset)!;
      try {
        const { blob, ext } = await optimizeVideo(piece.imageUrl, preset.maxH, preset.bps);
        return { blob, fileName: `${baseName}_${preset.id}p.${ext}` };
      } catch {
        // si falla la recompresión, exportar el original
      }
    }
    const resp = await fetch(piece.imageUrl);
    const blob = await resp.blob();
    const ext = piece.fileType === "video" ? ".mp4" : ".png";
    return { blob, fileName: piece.fileName ?? `${piece.name}${ext}` };
  }, [videoPreset]);

  const notifyVideoOptimization = useCallback((pieces: { fileType?: string }[]) => {
    if (videoPreset !== "original" && pieces.some((p) => p.fileType === "video")) {
      toast.info("Optimizando videos… puede tardar según su duración");
    }
  }, [videoPreset]);

  // Export functions
  const exportBannersAll = useCallback(async () => {
    const allPieces = slides.filter((s) => s.type === "pieces" && s.pieces?.length);
    if (!allPieces.length) return;
    notifyVideoOptimization(allPieces.flatMap((s) => s.pieces ?? []));
    setExporting(true);
    setExportModalOpen(false);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const s of allPieces) {
        const sub = s.subCampaign ?? "";
        const platform = s.platform ?? "General";
        const parts = [campaign.clientName, campaign.campaignName, sub, platform].filter(Boolean);
        const folder = zip.folder(parts.join("/"));
        for (const piece of s.pieces ?? []) {
          if (!piece.imageUrl) continue;
          try {
            const f = await getPieceFile(piece);
            if (f) folder?.file(f.fileName, f.blob);
          } catch {
            // skip files that can't be fetched (e.g. CORS-restricted URLs)
          }
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campaign.campaignName.replace(/[^a-z0-9]/gi, "_")}_Banners.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [slides, campaign, getPieceFile, notifyVideoOptimization]);

  const exportBannersByCampaign = useCallback(async () => {
    const allPieces = slides.filter((s) => s.type === "pieces" && s.pieces?.length);
    if (!allPieces.length) return;
    notifyVideoOptimization(allPieces.flatMap((s) => s.pieces ?? []));
    setExporting(true);
    setExportModalOpen(false);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      const groupedByCampaign: Record<string, typeof allPieces> = {};
      for (const s of allPieces) {
        const campaignKey = s.subCampaign || "Main Campaign";
        if (!groupedByCampaign[campaignKey]) groupedByCampaign[campaignKey] = [];
        groupedByCampaign[campaignKey].push(s);
      }

      for (const [campaignKey, pieceSlides] of Object.entries(groupedByCampaign)) {
        const campaignFolder = zip.folder(campaignKey);
        for (const s of pieceSlides) {
          const platform = s.platform ?? "General";
          const folder = campaignFolder?.folder(platform);
          for (const piece of s.pieces ?? []) {
            if (!piece.imageUrl) continue;
            try {
              const f = await getPieceFile(piece);
              if (f) folder?.file(f.fileName, f.blob);
            } catch {
              // skip files that can't be fetched (e.g. CORS-restricted URLs)
            }
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campaign.campaignName.replace(/[^a-z0-9]/gi, "_")}_ByCampaign.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [slides, campaign, getPieceFile, notifyVideoOptimization]);

  const exportBannersByChannel = useCallback(async () => {
    const allPieces = slides.filter((s) => s.type === "pieces" && s.pieces?.length);
    if (!allPieces.length) return;
    notifyVideoOptimization(allPieces.flatMap((s) => s.pieces ?? []));
    setExporting(true);
    setExportModalOpen(false);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      const groupedByChannel: Record<string, typeof allPieces> = {};
      for (const s of allPieces) {
        const channel = s.platform ?? "General";
        if (!groupedByChannel[channel]) groupedByChannel[channel] = [];
        groupedByChannel[channel].push(s);
      }

      for (const [channel, pieceSlides] of Object.entries(groupedByChannel)) {
        const channelFolder = zip.folder(channel);
        for (const s of pieceSlides) {
          const sub = s.subCampaign;
          const folder = sub ? channelFolder?.folder(sub) : channelFolder;
          for (const piece of s.pieces ?? []) {
            if (!piece.imageUrl) continue;
            try {
              const f = await getPieceFile(piece);
              if (f) folder?.file(f.fileName, f.blob);
            } catch {
              // skip files that can't be fetched (e.g. CORS-restricted URLs)
            }
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campaign.campaignName.replace(/[^a-z0-9]/gi, "_")}_ByChannel.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [slides, campaign, getPieceFile, notifyVideoOptimization]);

  const exportAsPDF = useCallback(async () => {
    setExporting(true);
    setExportModalOpen(false);
    try {
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [960, 540] });

      for (let i = 0; i < slides.length; i++) {
        if (i > 0) pdf.addPage();

        const slideElement = document.createElement("div");
        slideElement.style.width = "960px";
        slideElement.style.height = "540px";
        slideElement.style.position = "absolute";
        slideElement.style.left = "-9999px";
        document.body.appendChild(slideElement);

        const root = await import("react-dom/client");
        const slideRoot = root.createRoot(slideElement);

        await new Promise<void>((resolve) => {
          slideRoot.render(
            <div style={{ width: "960px", height: "540px" }}>
              <FullSlide slide={slides[i]} campaign={campaign} commentMode={false} />
            </div>
          );
          setTimeout(resolve, 300);
        });

        const canvas = await import("html2canvas").then((m) =>
          m.default(slideElement, {
            useCORS: true,
            allowTaint: true,
            onclone: (_doc: Document, cloned: HTMLElement) => {
              const colorProps = [
                "color", "backgroundColor", "borderTopColor", "borderRightColor",
                "borderBottomColor", "borderLeftColor", "outlineColor",
              ] as const;
              const origEls = [slideElement, ...Array.from(slideElement.querySelectorAll("*"))];
              const cloneEls = [cloned, ...Array.from(cloned.querySelectorAll("*"))];
              origEls.forEach((origEl, idx) => {
                const cloneEl = cloneEls[idx] as HTMLElement;
                if (!cloneEl) return;
                const computed = window.getComputedStyle(origEl);
                colorProps.forEach((prop) => {
                  const cssProp = prop.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
                  const val = computed.getPropertyValue(cssProp);
                  if (val && val.includes("oklch")) {
                    cloneEl.style[prop] = resolveColorToHex(val);
                  }
                });
              });
            },
          })
        );
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, 960, 540);

        slideRoot.unmount();
        document.body.removeChild(slideElement);
      }

      pdf.save(`${campaign.campaignName.replace(/[^a-z0-9]/gi, "_")}.pdf`);
    } finally {
      setExporting(false);
    }
  }, [slides, campaign]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (inInput) return;

      if (e.key === "f" || e.key === "F") { toggleViewMode(); return; }
      if (e.key === " " && viewMode === "slides") { e.preventDefault(); toggleViewMode(); return; }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setCurrent((c) => Math.min(slides.length - 1, c + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrent((c) => Math.max(0, c - 1));
      }
      if (e.key === "Escape") {
        if (viewMode === "presentation") { setViewMode("slides"); return; }
        setPendingDrop(null);
        setCommentMode(false);
        setDetailSlideId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length, viewMode, toggleViewMode]);

  const slideComments = useMemo(
    () => comments.filter((c) => c.slideId === slide?.id),
    [comments, slide?.id]
  );

  const filteredSlideComments = useMemo(() => {
    if (filter === "open") return slideComments.filter((c) => !c.resolved);
    if (filter === "resolved") return slideComments.filter((c) => c.resolved);
    return slideComments;
  }, [slideComments, filter]);

  const totalOpen = useMemo(() => comments.filter((c) => !c.resolved).length, [comments]);

  const commentCountBySlide = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of comments) map[c.slideId] = (map[c.slideId] ?? 0) + 1;
    return map;
  }, [comments]);

  // Piece detail
  const detailSlide = detailSlideId ? slides.find((s) => s.id === detailSlideId) : null;
  const detailPieces = detailSlide?.pieces ?? [];
  const detailPiece = detailPieces[detailPieceIdx] ?? null;

  const openDetail = useCallback((slideId: string, idx: number) => {
    setDetailSlideId(slideId);
    setDetailPieceIdx(idx);
  }, []);

  const closeDetail = useCallback(() => setDetailSlideId(null), []);

  // Comments
  const handleStageClick = useCallback((e: React.MouseEvent) => {
    if (!commentMode || pendingDrop) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-piece-id]")) return;
    const rect = slideRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingDrop({ x, y });
  }, [commentMode, pendingDrop]);

  const handlePieceClick = useCallback((e: React.MouseEvent, pieceId: string, pieceLabel: string) => {
    if (!commentMode || pendingDrop) return;
    e.stopPropagation();
    const rect = slideRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingDrop({ x, y, elementId: pieceId, elementLabel: pieceLabel });
  }, [commentMode, pendingDrop]);

  const submitComment = useCallback((body: string) => {
    if (!pendingDrop || !slide) return;
    const newComment: Comment = {
      id: `c-${Date.now()}-${Math.random()}`,
      slideId: slide.id,
      x: pendingDrop.x,
      y: pendingDrop.y,
      elementId: pendingDrop.elementId,
      elementLabel: pendingDrop.elementLabel,
      authorName: authorName ?? "Anónimo",
      body,
      createdAt: Date.now(),
      resolved: false,
      replies: [],
    };
    setComments((prev) => [...prev, newComment]);
    setActiveCommentId(newComment.id);
    setPendingDrop(null);
    setCommentsOpen(true);
  }, [pendingDrop, slide, authorName]);

  const resolveComment = useCallback((id: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, resolved: true } : c));
  }, []);

  const reopenComment = useCallback((id: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, resolved: false } : c));
  }, []);

  const addReply = useCallback((commentId: string, body: string) => {
    setComments((prev) => prev.map((c) =>
      c.id === commentId
        ? { ...c, replies: [...c.replies, { id: `r-${Date.now()}`, authorName: authorName ?? "Anónimo", body, createdAt: Date.now() }] }
        : c
    ));
  }, [authorName]);

  const handleCommentModeToggle = () => {
    if (!commentMode) {
      if (!authorName) { setShowNamePrompt(true); return; }
      setCommentMode(true);
      setCommentsOpen(true);
    } else {
      setCommentMode(false);
      setPendingDrop(null);
    }
  };

  const handleNameSave = (name: string) => {
    setAuthorName(name);
    try { localStorage.setItem("vs_author", name); } catch {}
    setShowNamePrompt(false);
    setCommentMode(true);
    setCommentsOpen(true);
  };

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-sm">No slides to display.</p>
        <p className="text-gray-300 text-xs">Upload assets in the Campaign Setup to populate the presentation.</p>
        <button onClick={onExit} className="mt-2 text-gray-500 hover:text-gray-800 text-sm cursor-pointer underline">Go back</button>
      </div>
    );
  }

  // ── Presentation mode (fullscreen) ────────────────────────────────────────

  if (viewMode === "presentation") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black flex flex-col items-center justify-center"
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "f" || e.key === "F") setViewMode("slides");
        }}
      >
        {/* Slide canvas */}
        <div className="relative w-full h-full flex items-center justify-center px-12 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={safeIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{ aspectRatio: "16/9", maxWidth: "100%", maxHeight: "100%", width: "min(100%, calc(100vh * 16 / 9))" }}
            >
              <FullSlide
                slide={slide}
                campaign={campaign}
                commentMode={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimal bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5"
        >
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={safeIndex === 0}
            className="text-white/60 hover:text-white disabled:opacity-25 cursor-pointer transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-white/60 text-xs tabular-nums">
            {safeIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => setCurrent((c) => Math.min(slides.length - 1, c + 1))}
            disabled={safeIndex === slides.length - 1}
            className="text-white/60 hover:text-white disabled:opacity-25 cursor-pointer transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button
            onClick={() => setViewMode("slides")}
            className="text-white/40 hover:text-white cursor-pointer transition-colors"
            style={{ fontSize: "11px" }}
          >
            Esc
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Slides mode (normal) ──────────────────────────────────────────────────

  return (
    <>
      <AnimatePresence>
        {exportModalOpen && (
          <ExportModal
            onClose={() => setExportModalOpen(false)}
            onExportBannersAll={exportBannersAll}
            onExportBannersByCampaign={exportBannersByCampaign}
            onExportBannersByChannel={exportBannersByChannel}
            onExportPDF={exportAsPDF}
            videoPreset={videoPreset}
            onVideoPresetChange={setVideoPreset}
          />
        )}
        {showNamePrompt && <NamePromptModal onSave={handleNameSave} />}
        {shareOpen && (
          <ShareModal
            shareUrl={shareUrl}
            access={shareAccess}
            onAccessChange={(a) => {
              setShareAccess(a);
              if (a === "password") setSharePassword((p) => p || genAccessKey());
            }}
            password={sharePassword}
            onPasswordChange={setSharePassword}
            invited={invitedEmails}
            onInvite={(em) => setInvitedEmails((l) => (l.includes(em) ? l : [...l, em]))}
            onRemoveInvite={(em) => setInvitedEmails((l) => l.filter((x) => x !== em))}
            onClose={() => setShareOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Piece detail overlay */}
      <AnimatePresence>
        {detailPiece && (
          <PieceDetailOverlay
            piece={detailPiece}
            totalCount={detailPieces.length}
            currentIdx={detailPieceIdx}
            onPrev={() => setDetailPieceIdx((i) => Math.max(0, i - 1))}
            onNext={() => setDetailPieceIdx((i) => Math.min(detailPieces.length - 1, i + 1))}
            onClose={closeDetail}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 bg-white flex flex-col">
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0 z-10 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
              style={{ fontSize: "13px" }}
            >
              <X size={14} />
              Cerrar
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-[3px] bg-gray-900 flex items-center justify-center shrink-0">
                <svg width="8" height="7" viewBox="0 0 12.9104 10.3283" fill="none">
                  <path d="M12.799 0.211896V8.32163H6.49027V6.51912H10.9965V2.0144H1.98553V0.211896H12.799Z" fill="white" />
                  <path d="M6.49032 8.32165V10.1241H0.183076V2.0144H1.98558V8.32165H6.49032Z" fill="white" />
                </svg>
              </div>
              <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 500 }}>{campaign.campaignName}</span>
              <span className="text-gray-300" style={{ fontSize: "13px" }}>·</span>
              <span className="text-gray-400" style={{ fontSize: "13px" }}>{campaign.clientName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Presencia — quién está viendo (como en Figma) */}
            <div className="flex items-center mr-1">
              {authorName && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white shadow-sm"
                  style={{ background: "#111827", fontSize: "10px", zIndex: 10 }}
                  title={`${authorName} (tú)`}
                >
                  {authorName.slice(0, 2).toUpperCase()}
                </div>
              )}
              {Object.entries(viewers).slice(0, 4).map(([id, v], i) => (
                <div
                  key={id}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white shadow-sm -ml-2"
                  style={{ background: v.color, fontSize: "10px", zIndex: 9 - i }}
                  title={v.name}
                >
                  {v.name.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {Object.keys(viewers).length > 4 && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 font-semibold ring-2 ring-white -ml-2" style={{ fontSize: "9px" }}>
                  +{Object.keys(viewers).length - 4}
                </div>
              )}
            </div>

            {/* Present toggle */}
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-all"
              style={{ fontSize: "12px" }}
              title="Presentación a pantalla completa (F)"
            >
              <Maximize2 size={13} />
              Presentar
            </button>

            {/* Comentarios — un solo botón: activa el modo comentario y abre el panel */}
            <button
              onClick={() => {
                handleCommentModeToggle();
                setCommentsOpen(!commentMode);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                commentMode
                  ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              style={{ fontSize: "12px", fontWeight: commentMode ? 600 : 400 }}
            >
              <MessageSquare size={13} />
              {totalOpen > 0 && (
                <span className="bg-yellow-400 rounded-full px-1.5" style={{ fontSize: "9px", fontWeight: 700, color: "#78350F" }}>
                  {totalOpen}
                </span>
              )}
              {commentMode ? "Comentando" : "Comentarios"}
            </button>

            <div className="w-px h-4 bg-gray-200" />

            {/* Export */}
            <button
              onClick={() => setExportModalOpen(true)}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-default transition-all"
              style={{ fontSize: "12px" }}
            >
              <Download size={13} />
              {exporting ? "Exportando…" : "Exportar"}
            </button>

            {/* Compartir */}
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 bg-gray-900 text-white rounded-lg px-3.5 py-1.5 cursor-pointer hover:bg-gray-700 transition-all font-medium"
              style={{ fontSize: "12px" }}
            >
              <Share2 size={13} />
              Compartir
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT STRIP */}
          <div className="w-48 border-r border-gray-100 bg-gray-50 flex flex-col overflow-y-auto shrink-0 py-3 px-2 gap-1">
            {slides.map((s, i) => (
              <SlideThumbnail
                key={s.id}
                slide={s}
                campaign={campaign}
                active={i === safeIndex}
                index={i}
                commentCount={commentCountBySlide[s.id] ?? 0}
                onClick={() => { setCurrent(i); setPendingDrop(null); }}
              />
            ))}
          </div>

          {/* CANVAS */}
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F1F3F4] px-5 py-3 gap-2.5 overflow-hidden relative">
            {commentMode && !pendingDrop && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full shadow-md flex items-center gap-2"
                style={{ fontSize: "12px", fontWeight: 600, pointerEvents: "none" }}
              >
                <MessageSquare size={12} />
                Haz clic en cualquier parte del slide para dejar un comentario
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={safeIndex}
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative shrink-0"
                style={{ aspectRatio: "16/9", width: "min(100%, calc((100vh - 130px) * (16/9)))" }}
              >
                <div
                  ref={slideRef}
                  className="absolute inset-0 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                  style={{ cursor: commentMode && !pendingDrop ? "crosshair" : "default" }}
                  onClick={handleStageClick}
                >
                  <FullSlide
                    slide={slide}
                    campaign={campaign}
                    commentMode={commentMode}
                    onPieceClick={handlePieceClick}
                    onPieceDetail={(idx) => openDetail(slide.id, idx)}
                  />

                  {/* Pins layer */}
                  <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
                    {slideComments.map((c, i) => (
                      <CommentPinBadge
                        key={c.id}
                        comment={c}
                        index={i}
                        active={activeCommentId === c.id}
                        onClick={() => {
                          setActiveCommentId(c.id === activeCommentId ? null : c.id);
                          setCommentsOpen(true);
                        }}
                      />
                    ))}
                  </div>

                  {/* Pending pin */}
                  {pendingDrop && (
                    <div
                      className="absolute rounded-full flex items-center justify-center"
                      style={{
                        left: `${pendingDrop.x}%`,
                        top: `${pendingDrop.y}%`,
                        transform: "translate(-50%, -50%)",
                        width: "22px",
                        height: "22px",
                        backgroundColor: "#F59E0B",
                        border: "2px solid white",
                        zIndex: 30,
                        pointerEvents: "none",
                      }}
                    >
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#78350F" }}>{slideComments.length + 1}</span>
                    </div>
                  )}

                  {pendingDrop && (
                    <PendingBubble
                      x={pendingDrop.x}
                      y={pendingDrop.y}
                      containerRef={slideRef}
                      onSubmit={submitComment}
                      onCancel={() => setPendingDrop(null)}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav controls */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => { setCurrent((c) => Math.max(0, c - 1)); setPendingDrop(null); }}
                disabled={safeIndex === 0}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default transition-all"
              >
                <ChevronLeft size={14} className="text-gray-600" />
              </button>
              <span className="text-gray-400" style={{ fontSize: "12px" }}>
                {safeIndex + 1} <span className="text-gray-300">de</span> {slides.length}
              </span>
              <button
                onClick={() => { setCurrent((c) => Math.min(slides.length - 1, c + 1)); setPendingDrop(null); }}
                disabled={safeIndex === slides.length - 1}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default transition-all"
              >
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* COMMENTS PANEL */}
          <motion.div
            animate={{ width: commentsOpen ? 280 : 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="border-l border-gray-100 flex flex-col bg-white overflow-hidden shrink-0"
            style={{ minWidth: 0 }}
          >
            <div className="w-[280px] flex flex-col h-full">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                <span className="text-gray-800" style={{ fontSize: "13px", fontWeight: 600 }}>Comentarios</span>
                <button onClick={() => setCommentsOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="flex border-b border-gray-100 shrink-0">
                {(["open", "resolved", "all"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`flex-1 py-2 capitalize cursor-pointer transition-colors border-b-2 ${
                      filter === tab ? "text-gray-900 border-gray-900" : "text-gray-400 border-transparent hover:text-gray-600"
                    }`}
                    style={{ fontSize: "11px", fontWeight: filter === tab ? 600 : 400 }}
                  >
                    {tab === "open" ? "Abiertos" : tab === "resolved" ? "Resueltos" : "Todos"}
                  </button>
                ))}
              </div>

              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
                <p className="text-gray-400" style={{ fontSize: "10px" }}>
                  Slide {safeIndex + 1} — {slide?.label}{slide?.platform ? ` · ${slide.platform}` : ""}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {filteredSlideComments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <MessageSquare size={24} className="text-gray-200" />
                    <p className="text-gray-400 text-center" style={{ fontSize: "12px" }}>
                      {filter === "resolved" ? "No hay comentarios resueltos" : filter === "open" ? "No hay comentarios abiertos" : "Aún no hay comentarios"}
                    </p>
                    {!commentMode && filter !== "resolved" && (
                      <button
                        onClick={handleCommentModeToggle}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer underline transition-colors mt-1"
                        style={{ fontSize: "11px" }}
                      >
                        Activar modo comentario
                      </button>
                    )}
                  </div>
                ) : (
                  filteredSlideComments.map((c) => (
                    <CommentCard
                      key={c.id}
                      comment={c}
                      pinIndex={slideComments.findIndex((sc) => sc.id === c.id)}
                      active={activeCommentId === c.id}
                      onResolve={() => resolveComment(c.id)}
                      onReopen={() => reopenComment(c.id)}
                      onReply={(body) => addReply(c.id, body)}
                      onSelect={() => setActiveCommentId(c.id === activeCommentId ? null : c.id)}
                    />
                  ))
                )}
              </div>

              {authorName && (
                <div className="px-4 py-2.5 border-t border-gray-100 shrink-0 flex items-center justify-between">
                  <p className="text-gray-400" style={{ fontSize: "10px" }}>
                    Comentando como <span className="text-gray-600 font-medium">{authorName}</span>
                  </p>
                  <button
                    onClick={() => {
                      try { localStorage.removeItem("vs_author"); } catch {}
                      setAuthorName(null);
                    }}
                    className="text-gray-300 hover:text-gray-500 cursor-pointer transition-colors"
                    style={{ fontSize: "10px" }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
