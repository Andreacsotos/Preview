import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X, ChevronLeft, ChevronRight, MessageSquare,
  Check, RotateCcw, Send, Download, Play, Maximize2,
} from "lucide-react";
import type { CampaignState, UploadedPiece } from "../App";

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
  pieces?: UploadedPiece[];
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

const PIECES_PER_SLIDE = 6;

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

const BG_COLORS: Record<string, string> = {
  white: "#FFFFFF",
  gray: "#F9FAFB",
  dark: "#111827",
  indigo: "#EEF2FF",
};

// ── Slide builder ─────────────────────────────────────────────────────────────

function buildPresSlides(campaign: CampaignState): PresSlide[] {
  const result: PresSlide[] = [
    { id: "cover", type: "cover", label: "Cover", subtitle: campaign.campaignName },
  ];

  const groups = campaign.uploadedGroups ?? {};
  const hasPlatforms = (campaign.uploadedPlatforms?.length ?? 0) > 0;

  let normalizedGroups: Record<string, Record<string, UploadedPiece[]>>;
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
          label: multi ? `Pieces ${i + 1}/${chunks.length}` : "Pieces",
          subtitle: `${chunk.length} piece${chunk.length !== 1 ? "s" : ""}`,
          pieces: chunk,
          partLabel: multi ? `${i + 1}/${chunks.length}` : undefined,
        });
      });
    }
  }

  return result;
}

// ── Cover slide ───────────────────────────────────────────────────────────────

function CoverSlide({ campaign }: { campaign: CampaignState }) {
  const bg = BG_COLORS[campaign.selectedBg] ?? "#FFFFFF";
  const isDark = campaign.selectedBg === "dark";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const textMuted = isDark ? "#4B5563" : "#D1D5DB";

  const Logo = () => {
    if (campaign.logoUrl) {
      return <img src={campaign.logoUrl} alt="Logo" className="h-12 max-w-[140px] object-contain" />;
    }
    return (
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: campaign.brandColor }}>
          <svg width="16" height="12" viewBox="0 0 12.9104 10.3283" fill="none">
            <path d="M12.799 0.211896V8.32163H6.49027V6.51912H10.9965V2.0144H1.98553V0.211896H12.799Z" fill="white" />
            <path d="M6.49032 8.32165V10.1241H0.183076V2.0144H1.98558V8.32165H6.49032Z" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-sm" style={{ color: textPrimary }}>VisionStudio</span>
      </div>
    );
  };

  if (campaign.coverTemplate === "bold") {
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: "#111827" }}>
        <div className="px-12 pt-10 pb-4"><Logo /></div>
        {campaign.heroUrl
          ? <div className="flex-1 mx-12 rounded-lg overflow-hidden"><img src={campaign.heroUrl} alt="" className="w-full h-full object-cover" /></div>
          : <div className="flex-1 mx-12 rounded-lg bg-gray-800" />}
        <div className="px-12 py-8">
          <h1 className="font-bold tracking-tight text-white mb-2" style={{ fontSize: "40px", lineHeight: 1.1 }}>{campaign.campaignName}</h1>
          <p className="text-gray-400 text-sm">{campaign.clientName} · {campaign.reviewRound} · {campaign.shippingDate}</p>
        </div>
      </div>
    );
  }

  if (campaign.coverTemplate === "minimal") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-5" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="h-px w-10" style={{ backgroundColor: textMuted }} />
        <div className="text-center space-y-2">
          <h1 className="font-semibold tracking-tight" style={{ fontSize: "32px", color: textPrimary }}>{campaign.campaignName}</h1>
          <p className="text-sm" style={{ color: textSecondary }}>{campaign.clientName}</p>
        </div>
        <div className="h-px w-10" style={{ backgroundColor: textMuted }} />
        <p className="text-xs" style={{ color: textMuted }}>{campaign.reviewRound} · {campaign.shippingDate}</p>
      </div>
    );
  }

  if (campaign.coverTemplate === "brand") {
    return (
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: "#EEF2FF" }}>
        <div className="px-10 py-7 flex items-center justify-between shrink-0">
          <Logo />
          <span className="text-xs font-medium" style={{ color: "#6366F1" }}>{campaign.clientName}</span>
        </div>
        <div className="flex-1 mx-10 rounded-xl overflow-hidden bg-indigo-100">
          {campaign.heroUrl ? <img src={campaign.heroUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-200" />}
        </div>
        <div className="px-10 py-6 shrink-0">
          <div className="w-8 h-1 rounded-full mb-3" style={{ backgroundColor: campaign.brandColor }} />
          <h1 className="font-semibold tracking-tight mb-1" style={{ fontSize: "28px", color: "#1E1B4B" }}>{campaign.campaignName}</h1>
          <p className="text-sm" style={{ color: "#6366F1" }}>{campaign.reviewRound} · {campaign.shippingDate}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: bg }}>
      <div className="px-12 pt-10 shrink-0"><Logo /></div>
      <div className="flex-1" />
      <div className="px-12 pb-10">
        <div className="w-10 h-px mb-6" style={{ backgroundColor: campaign.brandColor }} />
        <h1 className="font-semibold tracking-tight mb-3" style={{ fontSize: "36px", lineHeight: 1.15, color: textPrimary }}>{campaign.campaignName}</h1>
        <p className="text-sm mb-1" style={{ color: textSecondary }}>{campaign.clientName}</p>
        <p className="text-xs" style={{ color: textMuted }}>{campaign.reviewRound} · {campaign.shippingDate}</p>
      </div>
    </div>
  );
}

// ── Intro slide ───────────────────────────────────────────────────────────────

function IntroSlide({ slide }: { slide: PresSlide }) {
  const color = slide.platformColor ?? "#888";
  return (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-3 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundColor: color }} />
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      {slide.subCampaign && (
        <p className="text-gray-400 font-medium tracking-widest uppercase" style={{ fontSize: "11px" }}>{slide.subCampaign}</p>
      )}
      <h2 className="font-semibold tracking-tight text-gray-900" style={{ fontSize: "36px" }}>{slide.platform}</h2>
      <p className="text-gray-400 text-sm">Ad Creative Review</p>
    </div>
  );
}

// ── Media cell (image or video) ───────────────────────────────────────────────

function MediaCell({ piece, onClick }: { piece: UploadedPiece; onClick?: () => void }) {
  const isVideo = piece.fileType === "video";
  return (
    <div
      className={`w-full h-full relative ${onClick ? "cursor-pointer group" : ""}`}
      onClick={onClick}
    >
      {isVideo ? (
        <>
          <video
            src={piece.imageUrl}
            className="w-full h-full object-contain"
            preload="metadata"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
              <Play size={16} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        </>
      ) : piece.imageUrl ? (
        <img src={piece.imageUrl} alt={piece.name} className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="w-10 h-7 rounded bg-gray-200 border border-gray-300" />
        </div>
      )}
      {onClick && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="w-6 h-6 rounded-md bg-black/50 flex items-center justify-center">
            <Maximize2 size={10} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pieces slide ──────────────────────────────────────────────────────────────

function PiecesSlide({
  slide,
  commentMode,
  onPieceClick,
  onPieceDetail,
}: {
  slide: PresSlide;
  commentMode: boolean;
  onPieceClick?: (e: React.MouseEvent, pieceId: string, pieceLabel: string) => void;
  onPieceDetail?: (idx: number) => void;
}) {
  const pieces = slide.pieces ?? [];
  const count = pieces.length;
  const cols = count <= 2 ? count : count <= 4 ? 2 : 3;

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slide.platformColor ?? "#888" }} />
          <span className="text-gray-700 text-sm font-medium">{slide.platform}</span>
          {slide.subCampaign && <span className="text-gray-400 text-xs">· {slide.subCampaign}</span>}
          {slide.partLabel && <span className="text-gray-400 text-xs">· Part {slide.partLabel}</span>}
        </div>
        <span className="text-gray-400 text-xs">{count} piece{count !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {pieces.map((piece, idx) => (
            <div
              key={piece.id}
              data-piece-id={piece.id}
              data-piece-label={piece.name}
              className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex flex-col"
              style={{ cursor: commentMode ? "crosshair" : "default" }}
              onClick={commentMode && onPieceClick
                ? (e) => onPieceClick(e, piece.id, piece.name)
                : undefined
              }
            >
              <div className="flex-1 overflow-hidden p-1.5">
                <MediaCell
                  piece={piece}
                  onClick={!commentMode && onPieceDetail ? () => onPieceDetail(idx) : undefined}
                />
              </div>
              <div className="px-2 py-1.5 border-t border-gray-100 shrink-0">
                <p className="text-gray-700 truncate" style={{ fontSize: "10px", fontWeight: 500 }}>{piece.name}</p>
                <p className="text-gray-400 truncate" style={{ fontSize: "9px" }}>{piece.dim}</p>
              </div>
            </div>
          ))}
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
  if (slide.type === "intro") return <IntroSlide slide={slide} />;
  return (
    <PiecesSlide
      slide={slide}
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
      const bg = BG_COLORS[campaign.selectedBg] ?? "#fff";
      const isDark = campaign.selectedBg === "dark";
      return (
        <div className="w-full h-full flex flex-col justify-between p-2" style={{ backgroundColor: bg }}>
          {campaign.logoUrl
            ? <img src={campaign.logoUrl} alt="" className="w-4 h-4 object-contain" />
            : <div className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: campaign.brandColor }} />}
          <div>
            <div className="w-10 h-[4px] rounded mb-0.5" style={{ backgroundColor: isDark ? "#F9FAFB" : "#111827" }} />
            <div className="w-7 h-[3px] rounded" style={{ backgroundColor: isDark ? "#4B5563" : "#D1D5DB" }} />
          </div>
        </div>
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
  piece: UploadedPiece;
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
        placeholder="Leave a comment…"
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
              <p className="text-gray-400" style={{ fontSize: "10px" }}>on {comment.elementLabel}</p>
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
              Reopen
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onResolve(); }}
              className="flex items-center gap-1 text-green-600 hover:text-green-700 cursor-pointer transition-colors px-1.5 py-0.5 rounded-md hover:bg-green-50"
              style={{ fontSize: "10px" }}
            >
              <Check size={9} />
              Resolve
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
              placeholder="Reply…"
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
                Cancel
              </button>
              <button
                onClick={() => { if (replyBody.trim()) { onReply(replyBody.trim()); setReplyBody(""); setReplying(false); } }}
                disabled={!replyBody.trim()}
                className="flex items-center gap-1 bg-gray-900 text-white px-2 py-0.5 rounded-lg cursor-pointer hover:bg-gray-700 disabled:opacity-40 transition-all"
                style={{ fontSize: "10px" }}
              >
                <Send size={9} />
                Reply
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setReplying(true); }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors mt-0.5"
            style={{ fontSize: "10px" }}
          >
            Reply
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
          <h3 className="text-gray-900 font-semibold" style={{ fontSize: "15px" }}>Who's commenting?</h3>
          <p className="text-gray-400 mt-1" style={{ fontSize: "12px" }}>Enter your name to leave comments on this presentation.</p>
        </div>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
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
          Start commenting
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
}: {
  onClose: () => void;
  onExportBannersAll: () => void;
  onExportBannersByCampaign: () => void;
  onExportBannersByChannel: () => void;
  onExportPDF: () => void;
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
          <h3 className="text-gray-900 font-semibold" style={{ fontSize: "15px" }}>Export Presentation</h3>
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
                  Export as JPG/PNG (images) and MP4 (videos), organized in folder structure
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
                    <button
                      onClick={onExportBannersAll}
                      className="w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>All pieces</p>
                    </button>
                    <button
                      onClick={onExportBannersByCampaign}
                      className="w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>By campaign</p>
                    </button>
                    <button
                      onClick={onExportBannersByChannel}
                      className="w-full px-3 py-2 rounded-lg text-left hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <p className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>By channel</p>
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
                Export entire presentation as single PDF file
              </p>
            </div>
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

  // Export functions
  const exportBannersAll = useCallback(async () => {
    const allPieces = slides.filter((s) => s.type === "pieces" && s.pieces?.length);
    if (!allPieces.length) return;
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
            const resp = await fetch(piece.imageUrl);
            const blob = await resp.blob();
            const ext = piece.fileType === "video" ? ".mp4" : ".png";
            folder?.file(piece.fileName ?? `${piece.name}${ext}`, blob);
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
  }, [slides, campaign]);

  const exportBannersByCampaign = useCallback(async () => {
    const allPieces = slides.filter((s) => s.type === "pieces" && s.pieces?.length);
    if (!allPieces.length) return;
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
              const resp = await fetch(piece.imageUrl);
              const blob = await resp.blob();
              const ext = piece.fileType === "video" ? ".mp4" : ".png";
              folder?.file(piece.fileName ?? `${piece.name}${ext}`, blob);
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
  }, [slides, campaign]);

  const exportBannersByChannel = useCallback(async () => {
    const allPieces = slides.filter((s) => s.type === "pieces" && s.pieces?.length);
    if (!allPieces.length) return;
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
              const resp = await fetch(piece.imageUrl);
              const blob = await resp.blob();
              const ext = piece.fileType === "video" ? ".mp4" : ".png";
              folder?.file(piece.fileName ?? `${piece.name}${ext}`, blob);
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
  }, [slides, campaign]);

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
      authorName: authorName ?? "Anonymous",
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
        ? { ...c, replies: [...c.replies, { id: `r-${Date.now()}`, authorName: authorName ?? "Anonymous", body, createdAt: Date.now() }] }
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
          />
        )}
        {showNamePrompt && <NamePromptModal onSave={handleNameSave} />}
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
              Close
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
            {/* Present toggle */}
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-all"
              style={{ fontSize: "12px" }}
              title="Fullscreen presentation (F)"
            >
              <Maximize2 size={13} />
              Present
            </button>

            {/* Comment mode */}
            <button
              onClick={handleCommentModeToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                commentMode
                  ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              style={{ fontSize: "12px", fontWeight: commentMode ? 600 : 400 }}
            >
              <MessageSquare size={13} />
              {commentMode ? "Commenting" : "Comment"}
            </button>

            {/* Comments panel toggle */}
            <button
              onClick={() => setCommentsOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                commentsOpen ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`}
              style={{ fontSize: "12px" }}
            >
              <MessageSquare size={13} />
              {totalOpen > 0 && (
                <span className="bg-yellow-400 rounded-full px-1.5" style={{ fontSize: "9px", fontWeight: 700, color: "#78350F" }}>
                  {totalOpen}
                </span>
              )}
              Comments
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
              {exporting ? "Exporting…" : "Export"}
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
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F1F3F4] px-10 py-8 gap-4 overflow-hidden relative">
            {commentMode && !pendingDrop && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full shadow-md flex items-center gap-2"
                style={{ fontSize: "12px", fontWeight: 600, pointerEvents: "none" }}
              >
                <MessageSquare size={12} />
                Click anywhere on the slide to leave a comment
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={safeIndex}
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-3xl shrink-0"
                style={{ aspectRatio: "16/9" }}
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
                {safeIndex + 1} <span className="text-gray-300">of</span> {slides.length}
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
                <span className="text-gray-800" style={{ fontSize: "13px", fontWeight: 600 }}>Comments</span>
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
                    {tab}
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
                      {filter === "resolved" ? "No resolved comments" : filter === "open" ? "No open comments" : "No comments yet"}
                    </p>
                    {!commentMode && filter !== "resolved" && (
                      <button
                        onClick={handleCommentModeToggle}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer underline transition-colors mt-1"
                        style={{ fontSize: "11px" }}
                      >
                        Enable comment mode
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
                    Commenting as <span className="text-gray-600 font-medium">{authorName}</span>
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
