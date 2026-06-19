import { AnimatePresence, motion } from "motion/react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  ArrowLeft, ChevronRight, ChevronDown, ChevronLeft, Eye, RotateCcw,
  Plus, Minus, Menu, X, LayoutGrid, Folder, Settings, HelpCircle,
  Zap, Copy, Trash2, ArrowUpDown, Upload, FolderOpen, Sun, Moon,
} from "lucide-react";
import type { CampaignState } from "../App";
import { HtmlBannerFrame } from "./HtmlBannerFrame";
import { CoverSlide, CoverTemplateMini, COVER_TEMPLATES, COVER_COLORS } from "./CoverSlide";
import { MetaAdCard, EMPTY_AD_COPY } from "./MetaAdCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Piece {
  id: string;
  name: string;
  dim: string;
  ar: number;
  brand: string;
  legal: string;
  title: string;
  imageUrl?: string;
  fileType?: "image" | "video" | "html";
  fileName?: string;
}

interface Slide {
  id: string;
  type: "cover" | "intro" | "pieces";
  platform?: string;
  platformColor?: string;
  subCampaign?: string;
  label: string;
  subtitle: string;
  pieces?: Piece[];
  partLabel?: string;
}

type PieceEdit = Partial<{ name: string; title: string }>;

interface Props {
  onBack: () => void;
  onPresent: () => void;
  campaign: CampaignState;
  onUpdate: (updates: Partial<CampaignState>) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEGAL =
  "Válido del 24 / Abr. / al 7 / May. / 2026. Tarjeta Éxito Mastercard emitida por la Compañía de Financiamiento TUYA S.A.";

const PLATFORM_COLORS: Record<string, string> = {
  Meta: "#1877F2",
  Display: "#4285F4",
  YouTube: "#FF0000",
  TikTok: "#010101",
};

const PLATFORM_ORDER = ["Meta", "Display", "YouTube", "TikTok"];
const PIECES_PER_SLIDE = 3;

const PLATFORM_KEYWORDS: Array<[string, string]> = [
  ["youtube", "YouTube"], ["tiktok", "TikTok"],
  ["instagram", "Meta"], ["facebook", "Meta"],
  ["meta", "Meta"], ["fb_", "Meta"], ["ig_", "Meta"],
  ["display", "Display"], ["pmax", "Display"], ["gdn", "Display"],
  ["yt_", "YouTube"], ["tt_", "TikTok"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function sortByOrder(plats: string[]): string[] {
  return [...plats].sort((a, b) => {
    const ai = PLATFORM_ORDER.indexOf(a);
    const bi = PLATFORM_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

function detectPlatform(filename: string): string | null {
  const lower = filename.toLowerCase();
  for (const [kw, platform] of PLATFORM_KEYWORDS) {
    if (lower.includes(kw)) return platform;
  }
  return null;
}

function parseDimensions(filename: string): { width: number; height: number } | null {
  const m = filename.match(/(\d{2,4})[xX×](\d{2,4})/);
  if (!m) return null;
  return { width: parseInt(m[1]), height: parseInt(m[2]) };
}

// Namespaced keys for state maps
const introKey = (sub: string, plat: string) => `${sub}||${plat}`;
const subExpandKey = (sub: string) => `sub:${sub}`;
const platExpandKey = (sub: string, plat: string) => `plat:${sub}||${plat}`;

let _pid = 0;
function makePiece(file: File, w: number, h: number, brand: string): Piece {
  return {
    id: `p${++_pid}`,
    name: file.name.replace(/\.[^.]+$/, ""),
    dim: `${w}×${h}`,
    ar: w / h,
    brand,
    legal: LEGAL,
    title: "",
    imageUrl: URL.createObjectURL(file),
    fileType: file.type.startsWith("video/") ? "video" : "image",
    fileName: file.name,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Frame04PreviewBuilder({ onBack, onPresent, campaign, onUpdate }: Props) {
  // Single source of truth: subCampaign ("" = flat/no sub-campaign) → platform → pieces
  const [subCampaignGroups, setSubCampaignGroups] = useState<Record<string, Record<string, Piece[]>>>({});
  // Intro text keyed by introKey(sub, platform)
  const [introData, setIntroData] = useState<Record<string, { title: string; subtitle: string }>>({});
  const [piecesData, setPiecesData] = useState<Record<string, PieceEdit>>({});
  const [slideLegals, setSlideLegals] = useState<Record<string, { legal: string; brand: string }>>({});
  const [adCopyData, setAdCopyData] = useState<Record<string, { copy: string; headline: string; subtext: string }>>({});
  // AR real medido del archivo (el AR declarado puede venir mal del nombre del archivo y recortar la pieza)
  const [measuredAr, setMeasuredAr] = useState<Record<string, number>>({});

  const reportMediaSize = (pieceId: string, w: number, h: number, declaredAr: number) => {
    if (!w || !h) return;
    const real = w / h;
    if (Math.abs(real - declaredAr) < 0.02) return;
    setMeasuredAr((m) => (m[pieceId] ? m : { ...m, [pieceId]: real }));
  };

  const [selectedId, setSelectedId] = useState<string>("cover");
  const [direction, setDirection] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [expanded, setExpanded] = useState(new Set<string>());
  const [isDragging, setIsDragging] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);
  const [titleEditing, setTitleEditing] = useState<Record<string, boolean>>({});
  const [propsOpen, setPropsOpen] = useState(true);
  const [dark, setDark] = useState(false);
  const [newPlatformPrompt, setNewPlatformPrompt] = useState<{
    newPlatforms: string[];
    grouped: Record<string, Piece[]>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const currentPlatformsRef = useRef<string[]>([]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const subCampaignNames = useMemo(() => Object.keys(subCampaignGroups).sort(), [subCampaignGroups]);
  const namedSubCampaigns = useMemo(() => subCampaignNames.filter((k) => k !== ""), [subCampaignNames]);
  // Show sub-campaign level only when 2+ named sub-campaigns exist
  const showSubCampaigns = namedSubCampaigns.length >= 2;

  const allPlatforms = useMemo(
    () => sortByOrder([...new Set(Object.values(subCampaignGroups).flatMap((g) => Object.keys(g)))]),
    [subCampaignGroups]
  );

  currentPlatformsRef.current = allPlatforms;

  // ── Derived slides ────────────────────────────────────────────────────────
  const slides = useMemo<Slide[]>(() => {
    const result: Slide[] = [
      { id: "cover", type: "cover", label: "Cover", subtitle: campaign.campaignName },
    ];

    // Named sub-campaigns sorted, then "" (flat/no sub-campaign) last
    const orderedSubs = [
      ...namedSubCampaigns.sort(),
      ...(subCampaignGroups[""] ? [""] : []),
    ];

    orderedSubs.forEach((sub) => {
      const platformGroup = subCampaignGroups[sub] ?? {};
      sortByOrder(Object.keys(platformGroup)).forEach((platform) => {
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
      });
    });

    return result;
  }, [subCampaignGroups, campaign.campaignName, namedSubCampaigns]);

  // Keep selectedId valid
  useEffect(() => {
    if (!slides.find((s) => s.id === selectedId)) setSelectedId("cover");
  }, [slides, selectedId]);

  // Seed from campaign data on mount
  useEffect(() => {
    // si ya hay estado del builder persistido (ej. volviendo de la presentación), restaurarlo
    const bs = campaign.builderState;
    if (bs && Object.keys(bs.groups).length > 0) {
      setSubCampaignGroups(bs.groups as Record<string, Record<string, Piece[]>>);
      setIntroData(bs.introData);
      setPiecesData(bs.piecesData);
      setSlideLegals(bs.slideLegals);
      setAdCopyData(bs.adCopyData);
      setMeasuredAr(bs.measuredAr);
      const restored = new Set<string>();
      Object.entries(bs.groups).forEach(([sub, platforms]) => {
        restored.add(subExpandKey(sub));
        Object.keys(platforms).forEach((p) => restored.add(platExpandKey(sub, p)));
      });
      setExpanded(restored);
      return;
    }

    const hasGroups = Object.keys(campaign.uploadedGroups ?? {}).length > 0;
    const hasPlatforms = campaign.uploadedPlatforms.length > 0;
    if (!hasGroups && !hasPlatforms) return;

    const newGroups: Record<string, Record<string, Piece[]>> = {};
    const newIntroData: Record<string, { title: string; subtitle: string }> = {};
    const newExpanded = new Set<string>();

    if (hasGroups) {
      Object.entries(campaign.uploadedGroups).forEach(([sub, platforms]) => {
        newGroups[sub] = {};
        newExpanded.add(subExpandKey(sub));
        Object.entries(platforms).forEach(([platform, ups]) => {
          newGroups[sub][platform] = ups.map((up) => ({
            ...up, brand: campaign.clientName || "—", legal: LEGAL, title: "",
          }));
          newIntroData[introKey(sub, platform)] = { title: `${platform} Ads`, subtitle: "" };
          newExpanded.add(platExpandKey(sub, platform));
        });
      });
    } else {
      newGroups[""] = {};
      campaign.uploadedPlatforms.forEach((platform) => {
        newGroups[""][platform] = (campaign.uploadedPieces[platform] ?? []).map((up) => ({
          ...up, brand: campaign.clientName || "—", legal: LEGAL, title: "",
        }));
        newIntroData[introKey("", platform)] = { title: `${platform} Ads`, subtitle: "" };
        newExpanded.add(platExpandKey("", platform));
      });
    }

    setSubCampaignGroups(newGroups);
    setExpanded(newExpanded);
    setIntroData(newIntroData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir el estado editable hacia App para que la Presentación muestre lo mismo
  useEffect(() => {
    onUpdate({ builderState: { groups: subCampaignGroups, introData, piecesData, slideLegals, adCopyData, measuredAr } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subCampaignGroups, introData, piecesData, slideLegals, adCopyData, measuredAr]);

  const slide = slides.find((s) => s.id === selectedId) ?? slides[0];
  const slideIndex = slides.findIndex((s) => s.id === selectedId);

  const selectSlide = (id: string) => {
    const newIdx = slides.findIndex((s) => s.id === id);
    const curIdx = slides.findIndex((s) => s.id === selectedId);
    setDirection(newIdx >= curIdx ? 1 : -1);
    setSelectedId(id);
  };

  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const updateIntro = (sub: string, platform: string, u: Partial<{ title: string; subtitle: string }>) => {
    const key = introKey(sub, platform);
    setIntroData((prev) => ({ ...prev, [key]: { ...prev[key], ...u } }));
  };

  const updatePiece = (pid: string, u: PieceEdit) =>
    setPiecesData((prev) => ({ ...prev, [pid]: { ...prev[pid], ...u } }));

  const updateAdCopy = (pid: string, u: Partial<{ copy: string; headline: string; subtext: string }>) =>
    setAdCopyData((prev) => ({ ...prev, [pid]: { copy: "", headline: "", subtext: "", ...prev[pid], ...u } }));

  const updateSlideLegal = (slideId: string, u: Partial<{ legal: string; brand: string }>) =>
    setSlideLegals((prev) => ({ ...prev, [slideId]: { ...prev[slideId], ...u } }));

  // ── File handling ──────────────────────────────────────────────────────

  const applyGrouped = (grouped: Record<string, Piece[]>, newPlats: string[]) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      newPlats.forEach((p) => next.add(platExpandKey("", p)));
      return next;
    });
    setIntroData((prev) => {
      const next = { ...prev };
      newPlats.forEach((p) => {
        const key = introKey("", p);
        if (!next[key]) next[key] = { title: `${p} Ads`, subtitle: "" };
      });
      return next;
    });
    setSubCampaignGroups((prev) => {
      const next = { ...prev, "": { ...prev[""] } };
      Object.entries(grouped).forEach(([platform, pieces]) => {
        next[""][platform] = [...(next[""][platform] ?? []), ...pieces];
      });
      return next;
    });
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (!fileArr.length) return;
    setDetecting(true);
    const currentPlats = currentPlatformsRef.current;
    setTimeout(() => {
      setDetecting(false);
      const grouped: Record<string, Piece[]> = {};
      fileArr.forEach((file) => {
        const platform = detectPlatform(file.name) ?? "Meta";
        const isVideo = file.type.startsWith("video/");
        const dims = parseDimensions(file.name) ?? (isVideo ? { width: 1920, height: 1080 } : { width: 1080, height: 1080 });
        const piece = makePiece(file, dims.width, dims.height, campaign.clientName || "—");
        if (!grouped[platform]) grouped[platform] = [];
        grouped[platform].push(piece);
      });
      const newPlats = Object.keys(grouped).filter((p) => !currentPlats.includes(p));
      if (newPlats.length > 0) {
        setNewPlatformPrompt({ newPlatforms: newPlats, grouped });
      } else {
        applyGrouped(grouped, []);
      }
    }, 800);
  };

  const confirmNewPlatforms = () => {
    if (!newPlatformPrompt) return;
    applyGrouped(newPlatformPrompt.grouped, newPlatformPrompt.newPlatforms);
    setNewPlatformPrompt(null);
  };

  const cancelNewPlatforms = () => {
    if (!newPlatformPrompt) return;
    Object.values(newPlatformPrompt.grouped).flat().forEach((p) => {
      if (p.imageUrl) URL.revokeObjectURL(p.imageUrl);
    });
    setNewPlatformPrompt(null);
  };

  const removePiece = (subCampaign: string, platform: string, pieceId: string) => {
    setSubCampaignGroups((prev) => {
      const next = { ...prev };
      const sub = { ...next[subCampaign] };
      const platPieces = sub[platform] ?? [];
      const piece = platPieces.find((p) => p.id === pieceId);
      if (piece?.imageUrl) URL.revokeObjectURL(piece.imageUrl);
      const updated = platPieces.filter((p) => p.id !== pieceId);
      if (updated.length === 0) {
        delete sub[platform];
      } else {
        sub[platform] = updated;
      }
      if (Object.keys(sub).length === 0) {
        delete next[subCampaign];
      } else {
        next[subCampaign] = sub;
      }
      return next;
    });
  };

  // ── Drag handlers ──────────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Slide renderers ────────────────────────────────────────────────────

  const renderCover = () => (
    <div className="absolute inset-0">
      <CoverSlide campaign={campaign} />
    </div>
  );

  const renderIntro = (s: Slide) => {
    const key = introKey(s.subCampaign ?? "", s.platform!);
    const d = introData[key] ?? { title: `${s.platform} Ads`, subtitle: "" };
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center gap-4">
        {s.subCampaign && (
          <p className="text-gray-300 uppercase tracking-[0.15em]" style={{ fontSize: "9px" }}>
            {s.subCampaign}
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="h-px bg-gray-200 w-14" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.platformColor }} />
            <span className="text-gray-400 font-semibold tracking-widest uppercase" style={{ fontSize: "10px" }}>
              {s.platform}
            </span>
          </div>
          <div className="h-px bg-gray-200 w-14" />
        </div>
        <input
          value={d.title ?? ""}
          onChange={(e) => updateIntro(s.subCampaign ?? "", s.platform!, { title: e.target.value })}
          className="text-gray-900 font-bold text-center bg-transparent outline-none border-b-2 border-transparent focus:border-gray-200 w-full transition-colors"
          style={{ fontSize: "38px", fontWeight: 700, letterSpacing: "-0.5px" }}
        />
        <input
          value={d.subtitle ?? ""}
          onChange={(e) => updateIntro(s.subCampaign ?? "", s.platform!, { subtitle: e.target.value })}
          className="text-gray-400 text-center bg-transparent outline-none border-b border-transparent focus:border-gray-200 w-2/3 transition-colors"
          style={{ fontSize: "14px" }}
        />
        <div className="h-px bg-gray-100 w-20 mt-1" />
      </div>
    );
  };

  const renderMetaMockup = (piece: Piece, name: string, removeBtn: React.ReactNode) => (
    <MetaAdCard
      imageUrl={piece.imageUrl}
      fileType={piece.fileType}
      name={name}
      ar={measuredAr[piece.id] ?? piece.ar}
      ad={adCopyData[piece.id] ?? EMPTY_AD_COPY}
      brandName={campaign.clientName}
      logoUrl={campaign.logoUrl}
      editable
      onAdChange={(u) => updateAdCopy(piece.id, u)}
      onMediaSize={(w, h) => reportMediaSize(piece.id, w, h, piece.ar)}
      removeBtn={removeBtn}
    />
  );

  const renderPieces = (s: Slide) => {
    const pieces = s.pieces ?? [];
    const isMeta = s.platform === "Meta";
    const cols = pieces.length <= 1 ? 1 : pieces.length === 2 ? 2 : 3;
    const sl = slideLegals[s.id] ?? { legal: LEGAL, brand: "—" };

    return (
      <div className="absolute inset-0 flex">
        {/* LEFT — Legal, single block per slide */}
        <div className="p-3 flex flex-col gap-2 overflow-y-auto shrink-0" style={{ width: "20%", borderRight: "1px solid #f3f4f6" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.platformColor }} />
            <span className="text-gray-400 font-semibold tracking-widest uppercase" style={{ fontSize: "8px" }}>
              {s.platform}
            </span>
            {s.subCampaign && (
              <span className="text-gray-300 ml-1" style={{ fontSize: "7px" }}>{s.subCampaign}</span>
            )}
            {s.partLabel && (
              <span className="ml-auto text-gray-300" style={{ fontSize: "8px" }}>Part {s.partLabel}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-violet-500 rotate-45 shrink-0" />
              <span className="text-violet-600 font-semibold tracking-widest uppercase" style={{ fontSize: "8px" }}>Legales</span>
            </div>
            <textarea
              value={sl.legal ?? ""}
              onChange={(e) => updateSlideLegal(s.id, { legal: e.target.value })}
              className="text-gray-500 bg-transparent outline-none resize-none w-full flex-1"
              style={{ fontSize: "8px", lineHeight: "1.65", minHeight: "80px" }}
            />
            <input
              value={sl.brand ?? ""}
              onChange={(e) => updateSlideLegal(s.id, { brand: e.target.value })}
              className="self-start bg-violet-50 text-violet-700 rounded-full px-2 py-0.5 font-semibold outline-none focus:ring-1 focus:ring-violet-200"
              style={{ fontSize: "8px", maxWidth: "80px" }}
            />
          </div>
        </div>

        {/* RIGHT — Pieces grid: banners fill available space */}
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <div
            className="flex-1 grid min-h-0"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: "minmax(0, 1fr)", gap: "10px" }}
          >
            {pieces.map((piece) => {
              const pd = piecesData[piece.id] ?? {};
              const name = pd.name ?? piece.name;
              const ar = measuredAr[piece.id] ?? piece.ar;
              // mockup de feed solo para Collection/Post (cuadrado u horizontal);
              // historias (vertical) y videos/YouTube se muestran tal cual
              const useMockup = isMeta && piece.fileType !== "video" && ar >= 0.9;
              const pieceTitle = pd.title ?? piece.title;
              const showTitleField = !!pieceTitle || !!titleEditing[piece.id];

              const removeBtn = (
                <AnimatePresence>
                  {hoveredPieceId === piece.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => removePiece(s.subCampaign ?? "", s.platform!, piece.id)}
                      className="absolute top-1.5 right-1.5 z-10 w-5 h-5 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <Trash2 size={9} />
                    </motion.button>
                  )}
                </AnimatePresence>
              );

              return (
                <div
                  key={piece.id}
                  className="flex flex-col gap-1 relative min-h-0"
                  onMouseEnter={() => setHoveredPieceId(piece.id)}
                  onMouseLeave={() => setHoveredPieceId(null)}
                >
                  {useMockup ? (
                    renderMetaMockup(piece, name, removeBtn)
                  ) : (
                    <>
                      <div className="relative w-full min-h-0" style={{ aspectRatio: String(ar), flex: "0 1 auto" }}>
                        {removeBtn}
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
                            onLoadedMetadata={(e) => reportMediaSize(piece.id, e.currentTarget.videoWidth, e.currentTarget.videoHeight, piece.ar)}
                          />
                        ) : piece.imageUrl ? (
                          <img
                            src={piece.imageUrl}
                            alt={name}
                            className="absolute inset-0 w-full h-full object-contain"
                            onLoad={(e) => reportMediaSize(piece.id, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, piece.ar)}
                          />
                        ) : (
                          <div className="absolute inset-0 rounded-lg border flex items-center justify-center" style={{ background: "#f9fafb", borderColor: "#f3f4f6" }}>
                            <div className="w-8 h-4 rounded opacity-60" style={{ background: "#f3f4f6" }} />
                          </div>
                        )}
                      </div>
                      <input
                        value={name ?? ""}
                        onChange={(e) => updatePiece(piece.id, { name: e.target.value })}
                        className="bg-transparent outline-none border-b border-transparent focus:border-gray-200 transition-colors w-full shrink-0"
                        style={{ fontSize: "7px", fontFamily: "monospace", color: "#6b7280" }}
                      />
                      <span className="shrink-0" style={{ fontSize: "7px", color: "#d1d5db" }}>{piece.dim}</span>
                      <AnimatePresence>
                        {showTitleField ? (
                          <motion.input
                            key="title-input"
                            initial={{ opacity: 0, y: -3 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -3 }}
                            transition={{ duration: 0.14 }}
                            autoFocus={!!titleEditing[piece.id] && !pieceTitle}
                            value={pieceTitle ?? ""}
                            onChange={(e) => updatePiece(piece.id, { title: e.target.value })}
                            onBlur={() => {
                              if (!pieceTitle)
                                setTitleEditing((prev) => { const n = { ...prev }; delete n[piece.id]; return n; });
                            }}
                            placeholder="Add a title…"
                            className="bg-transparent outline-none border-b border-transparent focus:border-gray-200 w-full font-medium transition-colors shrink-0"
                            style={{ fontSize: "9px", color: "#6b7280" }}
                          />
                        ) : (
                          <motion.button
                            key="add-title"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            onClick={() => setTitleEditing((prev) => ({ ...prev, [piece.id]: true }))}
                            className="text-left hover:text-gray-400 cursor-pointer transition-colors shrink-0"
                            style={{ fontSize: "7px", color: "#d1d5db" }}
                          >
                            + Add title
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Properties panel ──────────────────────────────────────────────────────

  const ActionRow = ({ icon: Icon, label, danger }: { icon: React.ElementType; label: string; danger?: boolean }) => {
    const [hov, setHov] = useState(false);
    return (
      <button
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-100"
        style={{
          fontSize: "12px",
          color: danger && hov ? "#ef4444" : hov ? "#111827" : "#6b7280",
          backgroundColor: danger && hov ? "#fef2f2" : hov ? "#f9fafb" : "transparent",
        }}
      >
        <Icon size={12} style={{ color: danger && hov ? "#ef4444" : "#9ca3af" }} />
        {label}
      </button>
    );
  };

  const actions = (
    <div>
      <p className="text-gray-400 mb-2" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Actions
      </p>
      <div className="space-y-0.5">
        <ActionRow icon={Copy} label="Duplicate" />
        <ActionRow icon={ArrowUpDown} label="Reorder" />
        <ActionRow icon={Trash2} label="Delete" danger />
      </div>
    </div>
  );

  const InfoRow = ({ label, value, color }: { label: string; value?: string | null; color?: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-gray-400" style={{ fontSize: "12px" }}>{label}</span>
      <div className="flex items-center gap-1.5">
        {color && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
        <span className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>{value}</span>
      </div>
    </div>
  );

  const renderProperties = () => {
    const pos = slideIndex + 1;
    const total = slides.length;

    if (slide.type === "cover") {
      return (
        <div className="p-4 space-y-5">
          <div>
            <p className="text-gray-400 mb-2.5" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Slide Info</p>
            <div className="space-y-2">
              <InfoRow label="Type" value="Cover" />
              <InfoRow label="Position" value={`${pos} of ${total}`} />
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          <div>
            <p className="text-gray-400 mb-2.5" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Template</p>
            <div className="grid grid-cols-2 gap-2">
              {COVER_TEMPLATES.map((t) => {
                const active = (campaign.coverTemplate || "classic").toLowerCase() === t.id;
                const accent = campaign.brandColor || "#2c6bf2";
                return (
                  <button
                    key={t.id}
                    onClick={() => onUpdate({ coverTemplate: t.id })}
                    className="rounded-lg p-1.5 cursor-pointer transition-all text-left"
                    style={{ border: `1.5px solid ${active ? accent : "#f3f4f6"}`, background: active ? "#fafbff" : "#fff" }}
                  >
                    <div className="mb-1.5"><CoverTemplateMini id={t.id} accent={accent} /></div>
                    <span className="block text-center" style={{ fontSize: "10px", fontWeight: 500, color: active ? "#111827" : "#9ca3af" }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          <div>
            <p className="text-gray-400 mb-2.5" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Cover Color</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {COVER_COLORS.map((c) => {
                const active = (campaign.brandColor || "#2c6bf2").toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    onClick={() => onUpdate({ brandColor: c })}
                    className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{ background: c, boxShadow: active ? `0 0 0 2px #fff, 0 0 0 3.5px ${c}` : "none" }}
                    title={c}
                  />
                );
              })}
              {/* color personalizado */}
              <label className="w-6 h-6 rounded-full cursor-pointer overflow-hidden relative border border-gray-200 hover:scale-110 transition-transform" title="Color personalizado"
                style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
                <input
                  type="color"
                  value={campaign.brandColor || "#2c6bf2"}
                  onChange={(e) => onUpdate({ brandColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          {actions}
        </div>
      );
    }

    if (slide.type === "intro") {
      const key = introKey(slide.subCampaign ?? "", slide.platform!);
      const d = introData[key] ?? { title: `${slide.platform} Ads`, subtitle: "" };
      return (
        <div className="p-4 space-y-5">
          <div>
            <p className="text-gray-400 mb-2.5" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Section Info</p>
            <div className="space-y-2">
              {slide.subCampaign && <InfoRow label="Sub-campaign" value={slide.subCampaign} />}
              <InfoRow label="Platform" value={slide.platform} color={slide.platformColor} />
              <InfoRow label="Type" value="Intro slide" />
              <InfoRow label="Position" value={`${pos} of ${total}`} />
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          <div>
            <p className="text-gray-400 mb-2.5" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Section Text</p>
            <div className="space-y-2.5">
              <div>
                <label className="text-gray-400 block mb-1" style={{ fontSize: "11px" }}>Title</label>
                <input
                  value={d.title ?? ""}
                  onChange={(e) => updateIntro(slide.subCampaign ?? "", slide.platform!, { title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-800 outline-none focus:border-gray-300 transition-colors"
                  style={{ fontSize: "12px" }}
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1" style={{ fontSize: "11px" }}>Subtitle</label>
                <input
                  value={d.subtitle ?? ""}
                  onChange={(e) => updateIntro(slide.subCampaign ?? "", slide.platform!, { subtitle: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-800 outline-none focus:border-gray-300 transition-colors"
                  style={{ fontSize: "12px" }}
                />
              </div>
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          {actions}
        </div>
      );
    }

    const piecesCount = slide.pieces?.length ?? 0;
    return (
      <div className="p-4 space-y-5">
        <div>
          <p className="text-gray-400 mb-2.5" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Slide Info</p>
          <div className="space-y-2">
            {slide.subCampaign && <InfoRow label="Sub-campaign" value={slide.subCampaign} />}
            <InfoRow label="Platform" value={slide.platform} color={slide.platformColor} />
            <InfoRow label="Pieces" value={String(piecesCount)} />
            <InfoRow label="Position" value={`${pos} of ${total}`} />
            {slide.partLabel && <InfoRow label="Part" value={slide.partLabel} />}
          </div>
        </div>
        <div className="h-px bg-gray-100" />
        <div>
          <p className="text-gray-400 mb-2.5" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Layout</p>
          <div className="space-y-2">
            <InfoRow label="Legal side" value="Left" />
            <div className="flex items-center justify-between">
              <span className="text-gray-400" style={{ fontSize: "12px" }}>Pieces grid</span>
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-gray-400" />
                <span className="text-gray-600" style={{ fontSize: "12px", fontWeight: 500 }}>Auto</span>
              </div>
            </div>
          </div>
        </div>
        <div className="h-px bg-gray-100" />
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={10} className="text-gray-400" />
            <span className="text-gray-600 font-semibold" style={{ fontSize: "10px" }}>Auto-split</span>
          </div>
          <p className="text-gray-400" style={{ fontSize: "10px", lineHeight: "1.55" }}>
            Slides split automatically when pieces exceed {PIECES_PER_SLIDE} per slide. No manual setup needed.
          </p>
        </div>
        <div className="h-px bg-gray-100" />
        {actions}
      </div>
    );
  };

  // ── Slide tree ────────────────────────────────────────────────────────────

  // slides grouped by sub-campaign → platform (for tree rendering)
  const slidesBySubAndPlat = useMemo(() => {
    const map: Record<string, Record<string, Slide[]>> = {};
    slides.forEach((s) => {
      if (s.type === "cover") return;
      const sub = s.subCampaign ?? "";
      if (!map[sub]) map[sub] = {};
      if (!map[sub][s.platform!]) map[sub][s.platform!] = [];
      map[sub][s.platform!].push(s);
    });
    return map;
  }, [slides]);

  // In flat view: all slides for each platform (merged across sub-campaigns)
  const flatSlidesByPlat = useMemo(() => {
    const map: Record<string, Slide[]> = {};
    slides.forEach((s) => {
      if (s.type === "cover") return;
      if (!map[s.platform!]) map[s.platform!] = [];
      map[s.platform!].push(s);
    });
    return map;
  }, [slides]);

  const renderTree = () => {
    if (allPlatforms.length === 0) {
      return (
        <div className="px-4 py-6 text-center">
          <p style={{ fontSize: "11px", color: textDim }}>No platforms yet</p>
          <p style={{ fontSize: "10px", color: textDim, marginTop: "2px" }}>Upload banners to get started</p>
        </div>
      );
    }

    // Build a flat list of sections: each platform is a colored section header followed by its slides
    const sections: Array<{ platform: string; color: string; sub?: string; platSlides: Slide[] }> = [];
    if (showSubCampaigns) {
      const orderedSubs = [...namedSubCampaigns.sort(), ...(slidesBySubAndPlat[""] ? [""] : [])];
      orderedSubs.forEach((sub) => {
        sortByOrder(Object.keys(slidesBySubAndPlat[sub] ?? {})).forEach((platform) => {
          sections.push({ platform, sub: sub || undefined, color: PLATFORM_COLORS[platform] ?? "#888", platSlides: slidesBySubAndPlat[sub][platform] ?? [] });
        });
      });
    } else {
      allPlatforms.forEach((platform) => {
        const sub = Object.keys(slidesBySubAndPlat).find((s) => slidesBySubAndPlat[s][platform]) ?? "";
        sections.push({ platform, sub: sub || undefined, color: PLATFORM_COLORS[platform] ?? "#888", platSlides: flatSlidesByPlat[platform] ?? [] });
      });
    }

    return (
      <div className="py-1">
        {sections.map(({ platform, sub, color, platSlides }) => (
          <div key={`${sub ?? ""}|${platform}`} className="mb-1">
            {/* Platform header */}
            <div className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded-lg mb-0.5" style={{ background: `${color}15` }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="font-bold uppercase tracking-wider flex-1 truncate" style={{ fontSize: "9px", color }}>
                {platform}{sub ? ` · ${sub}` : ""}
              </span>
              <span className="tabular-nums font-medium" style={{ fontSize: "9px", color: `${color}99` }}>{platSlides.length}</span>
            </div>
            {/* Slides under this platform */}
            {platSlides.map((s) => {
              const globalIdx = slides.findIndex((sl) => sl.id === s.id);
              const isActive = selectedId === s.id;
              const typeLabel = s.type === "intro" ? "INTRO" : s.partLabel ? `PIECES ${s.partLabel}` : "PIECES";
              return (
                <button
                  key={s.id}
                  onClick={() => selectSlide(s.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 cursor-pointer text-left transition-all duration-100 mx-0 relative"
                  style={{
                    background: isActive ? (dark ? "#1e3a5f" : "#eff6ff") : "transparent",
                    borderLeft: `2px solid ${isActive ? color : "transparent"}`,
                  }}
                >
                  <span
                    className="shrink-0 font-semibold tabular-nums rounded"
                    style={{ fontSize: "9px", minWidth: "16px", color: isActive ? color : textDim, background: isActive ? `${color}20` : "transparent", padding: "1px 3px" }}
                  >{globalIdx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold uppercase tracking-wider truncate" style={{ fontSize: "8px", color: isActive ? color : textMuted }}>
                      {typeLabel}
                    </p>
                    <p className="truncate" style={{ fontSize: "10px", color: isActive ? (dark ? "#e5e7eb" : "#111827") : textMuted, fontWeight: isActive ? 500 : 400 }}>
                      {s.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────

  const bg = dark ? "#111827" : "#ffffff";
  const bg2 = dark ? "#1f2937" : "#f9fafb";
  const border = dark ? "#374151" : "#f3f4f6";
  const text = dark ? "#f9fafb" : "#111827";
  const textMuted = dark ? "#9ca3af" : "#6b7280";
  const textDim = dark ? "#6b7280" : "#d1d5db";
  const canvasBg = dark ? "#0f172a" : "#F1F3F4";
  // el slide es el entregable: siempre claro, el modo oscuro solo afecta la interfaz
  const slideBg = "#ffffff";

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: bg }}>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
      />

      {/* NAV MENU OVERLAY */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-gray-900/20"
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 h-full z-50 bg-white border-r border-gray-100 shadow-xl flex flex-col py-5 px-3"
              style={{ width: "224px" }}
            >
              <div className="flex items-center justify-between px-2 mb-7">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center shrink-0">
                    <svg width="13" height="11" viewBox="0 0 12.9104 10.3283" fill="none">
                      <path d="M12.799 0.211896V8.32163H6.49027V6.51912H10.9965V2.0144H1.98553V0.211896H12.799Z" fill="white" />
                      <path d="M6.49032 8.32165V10.1241H0.183076V2.0144H1.98558V8.32165H6.49032Z" fill="white" />
                    </svg>
                  </div>
                  <span className="text-gray-900 text-sm font-semibold tracking-tight">VisionStudio</span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors">
                  <X size={15} />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5">
                {[
                  { icon: LayoutGrid, label: "Dashboard", action: () => { onBack(); setMenuOpen(false); } },
                  { icon: Folder, label: "Campaigns", action: () => { onBack(); setMenuOpen(false); } },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-100"
                  >
                    <Icon size={14} />{label}
                  </button>
                ))}
              </nav>
              <div className="space-y-0.5 pt-4 border-t border-gray-100">
                {[{ icon: Settings, label: "Settings" }, { icon: HelpCircle, label: "Help" }].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all duration-100"
                  >
                    <Icon size={14} />{label}
                  </button>
                ))}
                <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
                  <div className="w-7 h-7 rounded-full bg-[#6715af] flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-semibold">FC</span>
                  </div>
                  <div>
                    <p className="text-gray-700 text-xs font-medium">Fabian Caamaño</p>
                    <p className="text-gray-400 text-[11px]">Designer</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* NEW PLATFORM CONFIRMATION MODAL */}
      <AnimatePresence>
        {newPlatformPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-gray-900/25"
              onClick={cancelNewPlatforms}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-80 pointer-events-auto">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Zap size={14} className="text-gray-600" />
                  </div>
                  <h3 className="text-gray-900 font-semibold" style={{ fontSize: "14px" }}>
                    New platform{newPlatformPrompt.newPlatforms.length > 1 ? "s" : ""} detected
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {newPlatformPrompt.newPlatforms.map((p) => (
                    <span key={p} className="px-2.5 py-1 rounded-full text-white font-semibold"
                      style={{ fontSize: "11px", backgroundColor: PLATFORM_COLORS[p] ?? "#888" }}>
                      {p}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400 mb-5" style={{ fontSize: "12px" }}>
                  Create new slide section{newPlatformPrompt.newPlatforms.length > 1 ? "s" : ""} in the deck?
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={cancelNewPlatforms}
                    className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                    style={{ fontSize: "13px", fontWeight: 500 }}>
                    Cancel
                  </button>
                  <button onClick={confirmNewPlatforms}
                    className="flex-1 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 cursor-pointer transition-colors"
                    style={{ fontSize: "13px", fontWeight: 500 }}>
                    Create section{newPlatformPrompt.newPlatforms.length > 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-100 shrink-0"
        >
          <Menu size={15} />
        </button>
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-all duration-100 shrink-0"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="h-4 w-px bg-gray-200 mx-1" />
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400" style={{ fontSize: "13px" }}>{campaign.clientName || "Client"}</span>
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 500 }}>{campaign.campaignName}</span>
        </div>
        <div className="h-4 w-px bg-gray-200 mx-1" />
        <div className="flex items-center gap-1.5">
          <Zap size={11} className="text-gray-400" />
          <span className="text-gray-400" style={{ fontSize: "12px" }}>Auto-organized from folder</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <AnimatePresence>
            {detecting && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                <span className="text-gray-500" style={{ fontSize: "12px" }}>Detecting…</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 cursor-pointer transition-all duration-100"
            style={{ fontSize: "12px", fontWeight: 500 }}
          >
            <Upload size={12} />
            Add banners
          </button>

          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              <Minus size={11} />
            </button>
            <span className="text-gray-600 w-10 text-center" style={{ fontSize: "12px", fontWeight: 500 }}>{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              <Plus size={11} />
            </button>
          </div>

          <button
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-lg cursor-pointer transition-all duration-100"
            style={{ color: textMuted }}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button className="p-2 rounded-lg cursor-pointer transition-all duration-100" style={{ color: textMuted }}>
            <RotateCcw size={13} />
          </button>
          <div className="w-px h-4" style={{ background: border }} />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPresent}
            className="flex items-center gap-1.5 bg-gray-900 text-white rounded-xl px-3.5 py-1.5 cursor-pointer"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
            <Eye size={13} />
            Present
          </motion.button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* LEFT: Slides tree — 3 levels: cover / sub-campaign / platform / slides */}
        <div className="w-64 flex flex-col shrink-0 overflow-hidden" style={{ background: bg, borderRight: `1px solid ${border}` }}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
            <span className="font-semibold" style={{ fontSize: "13px", color: text }}>Slides</span>
            <span className="rounded-md px-1.5 py-0.5 font-medium" style={{ fontSize: "10px", background: bg2, color: textMuted }}>
              {slides.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-1.5">
            {/* Cover */}
            <button
              onClick={() => selectSlide("cover")}
              className="w-full flex items-center gap-2.5 px-4 py-2 cursor-pointer text-left transition-all duration-100"
              style={{
                background: selectedId === "cover" ? (dark ? "#374151" : "#111827") : "transparent",
                borderLeft: `2px solid ${selectedId === "cover" ? (dark ? "#6b7280" : "#374151") : "transparent"}`,
              }}
            >
              <span
                className="shrink-0 font-semibold tabular-nums"
                style={{ fontSize: "10px", minWidth: "14px", color: selectedId === "cover" ? (dark ? "#9ca3af" : "#6b7280") : textDim }}
              >1</span>
              <div>
                <p className="font-medium" style={{ fontSize: "12px", color: selectedId === "cover" ? "#fff" : text }}>
                  Cover
                </p>
                <p style={{ fontSize: "10px", color: selectedId === "cover" ? (dark ? "#9ca3af" : "#6b7280") : textMuted }}>
                  {campaign.campaignName}
                </p>
              </div>
            </button>

            {renderTree()}
          </div>

          <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${border}` }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-2.5 cursor-pointer transition-colors duration-100"
              style={{ fontSize: "12px", color: textMuted, borderColor: border }}
            >
              <Plus size={13} />
              Add banners
            </button>
          </div>
        </div>

        {/* CENTER: Slide canvas */}
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{ backgroundColor: canvasBg }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-2 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl pointer-events-none"
                style={{ backgroundColor: "rgba(241,243,244,0.93)", border: "2px dashed #9ca3af" }}
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center">
                  <Upload size={20} className="text-gray-500" />
                </div>
                <p className="text-gray-700 font-semibold" style={{ fontSize: "15px" }}>Drop banners here</p>
                <p className="text-gray-400" style={{ fontSize: "13px" }}>We'll auto-sort by platform</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {detecting && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-2.5"
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-gray-700 animate-spin" />
                <span className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>Detecting platform…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {allPlatforms.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-2">
                <FolderOpen size={24} className="text-gray-400" />
              </div>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Drop your banners here</p>
              <p className="text-gray-400" style={{ fontSize: "13px", maxWidth: "280px", lineHeight: "1.5" }}>
                We'll auto-detect the platform and format from the filename
              </p>
              <p className="text-gray-300" style={{ fontSize: "11px" }}>
                e.g. <span className="font-mono">Meta_1080x1080.jpg</span> · <span className="font-mono">Display_300x250.png</span>
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gray-900 text-white rounded-xl px-5 py-2.5 cursor-pointer hover:bg-gray-800 transition-colors mt-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                <Upload size={13} />
                Browse files
              </button>
            </div>
          ) : (
            <>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 px-6 py-2.5 shrink-0 flex-wrap">
                <span className="text-gray-400" style={{ fontSize: "12px" }}>
                  Slide {slideIndex + 1} of {slides.length}
                </span>
                {slide.subCampaign && (
                  <>
                    <ChevronRight size={11} className="text-gray-300" />
                    <span className="text-gray-400" style={{ fontSize: "12px" }}>{slide.subCampaign}</span>
                  </>
                )}
                <ChevronRight size={11} className="text-gray-300" />
                <span className="text-gray-600" style={{ fontSize: "12px", fontWeight: 500 }}>{slide.label}</span>
                {slide.platform && (
                  <>
                    <ChevronRight size={11} className="text-gray-300" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: slide.platformColor }} />
                      <span className="text-gray-500" style={{ fontSize: "12px" }}>{slide.platform}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Canvas */}
              <div className="flex-1 overflow-hidden flex items-center justify-center" style={{ padding: "12px 20px 20px" }}>
                <div style={{
                  position: "relative",
                  aspectRatio: "16/9",
                  width: "min(100%, calc((100vh - 160px) * (16/9)))",
                }}>
                  <motion.div
                    animate={{ scale: zoom / 100 }}
                    style={{ transformOrigin: "center center", position: "absolute", inset: 0 }}
                  >
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={selectedId}
                        custom={direction}
                        variants={{
                          enter: (d: number) => ({ opacity: 0, x: d * 18 }),
                          center: { opacity: 1, x: 0 },
                          exit: (d: number) => ({ opacity: 0, x: d * -18 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute inset-0 rounded-2xl shadow-lg overflow-hidden"
                        style={{ background: slideBg }}
                      >
                        {slide.type === "cover" && renderCover()}
                        {slide.type === "intro" && renderIntro(slide)}
                        {slide.type === "pieces" && renderPieces(slide)}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Properties — collapsible */}
        <motion.div
          animate={{ width: propsOpen ? 256 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col overflow-hidden shrink-0"
          style={{ minWidth: 0, background: bg, borderLeft: `1px solid ${border}` }}
        >
          {/* Fixed inner width so content clips cleanly when panel animates closed */}
          <div className="w-64 flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={selectedId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-gray-800 font-semibold block truncate"
                style={{ fontSize: "13px" }}
              >
                {slide?.platform ? `Properties · ${slide.platform}` : "Properties"}
              </motion.span>
            </AnimatePresence>
            <button
              onClick={() => setPropsOpen(false)}
              className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-all duration-100 shrink-0"
              title="Collapse panel"
            >
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="w-64 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {renderProperties()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Re-open tab shown when properties panel is collapsed */}
        <AnimatePresence>
          {!propsOpen && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setPropsOpen(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 border-r-0 rounded-l-xl px-1.5 py-3 shadow-md flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              title="Open properties"
            >
              <ChevronLeft size={12} className="text-gray-400" />
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
