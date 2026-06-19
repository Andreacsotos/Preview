import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronRight, Folder, HelpCircle,
  LayoutGrid, Plus, Settings, Upload, X, Zap, Search, Type,
} from "lucide-react";
import { readPsd, initializeCanvas } from "ag-psd";
import type { CampaignState, UploadedPiece } from "../App";
import { Sidebar } from "./Sidebar";
import { storeBanner, registerBannerSW } from "../lib/bannerSW";

if (typeof document !== "undefined") {
  initializeCanvas((width: number, height: number) => {
    const c = document.createElement("canvas");
    c.width = width; c.height = height;
    return c as any;
  });
}

interface Props {
  onBack: () => void;
  onGoToDashboard: () => void;
  onOpenBuilder: () => void;
  campaign: CampaignState;
  onUpdate: (updates: Partial<CampaignState>) => void;
  dark?: boolean;
  setDark?: (v: boolean) => void;
}

// ─── Cover templates ───────────────────────────────────────────────────────────

const COVER_TEMPLATES = [
  {
    id: "dark",
    label: "Dark",
    bg: "#0D0D0D",
    textPrimary: "#F9FAFB",
    textSecondary: "#6B7280",
    accent: "#374151",
    selectedBg: "dark",
    preview: (
      <div className="w-full h-full flex flex-col p-2" style={{ background: "#0D0D0D" }}>
        <div className="w-3 h-3 rounded-[2px] mb-auto" style={{ background: "#374151" }} />
        <div className="space-y-[3px]">
          <div className="w-[38px] h-[4px] rounded-[1px]" style={{ background: "#F9FAFB" }} />
          <div className="w-[24px] h-[2px] rounded-[1px]" style={{ background: "#6B7280" }} />
          <div className="w-[14px] h-[2px] rounded-[1px] mt-[2px]" style={{ background: "#374151" }} />
        </div>
      </div>
    ),
  },
  {
    id: "light",
    label: "Light",
    bg: "#FFFFFF",
    textPrimary: "#111827",
    textSecondary: "#9CA3AF",
    accent: "#E5E7EB",
    selectedBg: "white",
    preview: (
      <div className="w-full h-full flex flex-col p-2 bg-white">
        <div className="w-3 h-3 rounded-[2px] mb-auto" style={{ background: "#E5E7EB" }} />
        <div className="space-y-[3px]">
          <div className="w-[38px] h-[4px] rounded-[1px]" style={{ background: "#111827" }} />
          <div className="w-[24px] h-[2px] rounded-[1px]" style={{ background: "#9CA3AF" }} />
          <div className="w-[14px] h-[2px] rounded-[1px] mt-[2px]" style={{ background: "#E5E7EB" }} />
        </div>
      </div>
    ),
  },
  {
    id: "custom",
    label: "Custom",
    bg: null,
    textPrimary: null,
    textSecondary: null,
    accent: null,
    selectedBg: "indigo",
    preview: (
      <div className="w-full h-full flex flex-col p-2 overflow-hidden" style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 100%)" }}>
        <div className="w-3 h-3 rounded-[2px] mb-auto bg-violet-400" />
        <div className="space-y-[3px]">
          <div className="w-[38px] h-[4px] rounded-[1px] bg-violet-800" />
          <div className="w-[24px] h-[2px] rounded-[1px] bg-violet-400" />
        </div>
      </div>
    ),
  },
];

const CUSTOM_BG_OPTIONS = [
  { id: "white",  label: "White",      cls: "bg-white border-gray-200",       hex: "#FFFFFF" },
  { id: "gray",   label: "Light Gray", cls: "bg-gray-50 border-gray-200",     hex: "#F9FAFB" },
  { id: "indigo", label: "Indigo",     cls: "bg-indigo-50 border-indigo-100", hex: "#EEF2FF" },
  { id: "rose",   label: "Rose",       cls: "bg-rose-50 border-rose-100",     hex: "#FFF1F2" },
];

// ─── Google Fonts ──────────────────────────────────────────────────────────────

const POPULAR_FONTS = [
  "Inter", "Roboto", "Poppins", "Montserrat", "Raleway",
  "Playfair Display", "Merriweather", "DM Sans", "Outfit",
  "Plus Jakarta Sans", "Space Grotesk", "Nunito", "Figtree",
  "Be Vietnam Pro", "Work Sans", "Manrope", "Josefin Sans",
  "Sora", "Karla", "Mulish",
];

// ─── Upload detection helpers ──────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  Meta: "#1877F2", Display: "#4285F4", YouTube: "#FF0000", TikTok: "#010101",
};
const PLATFORM_KEYWORDS: Array<[string, string]> = [
  ["youtube", "YouTube"], ["tiktok", "TikTok"],
  ["instagram", "Meta"], ["facebook", "Meta"],
  ["meta", "Meta"], ["fb_", "Meta"], ["ig_", "Meta"],
  ["display", "Display"], ["pmax", "Display"], ["gdn", "Display"],
  ["yt_", "YouTube"], ["tt_", "TikTok"],
];
const PLATFORM_FORMAT_MAP: Record<string, string[]> = {
  Meta: ["Social", "Stories"],
  Display: ["Display Ads"],
  YouTube: [],
  TikTok: ["Stories"],
};
const PLATFORM_ORDER = ["Meta", "Display", "YouTube", "TikTok"];

function sortByOrder(plats: string[]): string[] {
  return [...plats].sort((a, b) => {
    const ai = PLATFORM_ORDER.indexOf(a), bi = PLATFORM_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}
function detectPlatform(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [kw, p] of PLATFORM_KEYWORDS) { if (lower.includes(kw)) return p; }
  return null;
}
function parseDims(filename: string): { w: number; h: number } | null {
  const m = filename.match(/(\d{2,4})[xX×](\d{2,4})/);
  if (!m) return null;
  return { w: parseInt(m[1]), h: parseInt(m[2]) };
}
async function traverseFSEntry(entry: FileSystemEntry, pathParts: string[] = []): Promise<{ file: File; pathParts: string[] }[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file((f) => resolve([{ file: f, pathParts }]), () => resolve([]));
    });
  }
  if (entry.isDirectory) {
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const allEntries: FileSystemEntry[] = [];
    await new Promise<void>((resolve) => {
      const readBatch = () => {
        dirReader.readEntries((batch) => {
          if (batch.length === 0) { resolve(); return; }
          allEntries.push(...batch);
          readBatch();
        }, () => resolve());
      };
      readBatch();
    });
    const childResults = await Promise.all(allEntries.map((e) => traverseFSEntry(e, [...pathParts, entry.name])));
    return childResults.flat();
  }
  return [];
}
let _uid = 0;
function buildGrouped(entries: { file: File; pathParts: string[] }[]): Record<string, Record<string, UploadedPiece[]>> {
  const result: Record<string, Record<string, UploadedPiece[]>> = {};
  entries.forEach(({ file, pathParts }) => {
    let channelIdx = -1;
    for (let i = pathParts.length - 1; i >= 0; i--) { if (detectPlatform(pathParts[i])) { channelIdx = i; break; } }
    let platform: string;
    let subCampaign: string;
    if (channelIdx >= 0) {
      platform = detectPlatform(pathParts[channelIdx])!;
      subCampaign = channelIdx > 0 ? pathParts[channelIdx - 1] : "";
    } else {
      platform = detectPlatform(file.name) ?? "Other";
      subCampaign = "";
    }
    const isVideo = file.type.startsWith("video/");
    const dims = parseDims(file.name) ?? (isVideo ? { w: 1920, h: 1080 } : { w: 1080, h: 1080 });
    const piece: UploadedPiece = {
      id: `up-${++_uid}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      dim: `${dims.w}×${dims.h}`,
      ar: dims.w / dims.h,
      imageUrl: URL.createObjectURL(file),
      fileType: isVideo ? "video" : "image",
      fileName: file.name,
    };
    result[subCampaign] = result[subCampaign] ?? {};
    result[subCampaign][platform] = result[subCampaign][platform] ?? [];
    result[subCampaign][platform].push(piece);
  });
  return result;
}

const formats = ["Social", "Display Ads", "Hero Banner", "Stories", "Custom"];
const STEP_LABELS = ["Detalles de campaña", "Assets y Formatos"];

// ─── PSD artboard extraction ───────────────────────────────────────────────────
async function extractPsdArtboards(file: File): Promise<UploadedPiece[]> {
  const buf = await file.arrayBuffer();
  const psd = readPsd(buf, { skipThumbnail: true });
  const composite: HTMLCanvasElement | undefined = psd.canvas;
  const base = file.name.replace(/\.psd$/i, "");
  const out: UploadedPiece[] = [];

  const artboards: any[] = [];
  const walk = (nodes: any[]) => { for (const n of nodes) { if (n?.artboard?.rect) artboards.push(n); if (Array.isArray(n?.children)) walk(n.children); } };
  walk(psd.children ?? []);

  const cropToUrl = (l: number, t: number, w: number, h: number, src: HTMLCanvasElement) => {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    cv.getContext("2d")!.drawImage(src, l, t, w, h, 0, 0, w, h);
    return cv.toDataURL("image/png");
  };

  if (artboards.length && composite) {
    artboards.forEach((ab: any, i: number) => {
      const r = ab.artboard.rect;
      const l = Math.round(Math.max(0, r.left)), t = Math.round(Math.max(0, r.top));
      const w = Math.round(r.right - r.left), h = Math.round(r.bottom - r.top);
      if (w <= 0 || h <= 0) return;
      const url = ab.canvas?.width ? ab.canvas.toDataURL("image/png") : cropToUrl(l, t, w, h, composite);
      out.push({ id: `up-${++_uid}`, name: ab.name || `${base} — Mesa ${i + 1}`, dim: `${w}×${h}`, ar: w / h, imageUrl: url, fileType: "image", fileName: file.name });
    });
  }
  if (!out.length && composite) {
    out.push({ id: `up-${++_uid}`, name: base, dim: `${composite.width}×${composite.height}`, ar: composite.width / composite.height, imageUrl: composite.toDataURL("image/png"), fileType: "image", fileName: file.name });
  }
  return out;
}

// ─── HTML5 banner (via Service Worker) ────────────────────────────────────────
let _bannerId03 = 0;
const ENABLER_STUB_03 = `<script>(function(){var base={isInitialized:function(){return true;},isVisible:function(){return true;},isPageLoaded:function(){return true;},isServingInLiveEnvironment:function(){return false;},addEventListener:function(t,fn){setTimeout(function(){try{fn({});}catch(e){}},0);},removeEventListener:function(){},getUrl:function(u){return u;},getParameter:function(){return '';},getDevDinamicContent:function(){return null;}};window.Enabler=new Proxy(base,{get:function(t,p){return p in t?t[p]:function(){return undefined;};}});})();<\/script>`;

async function buildHtmlBannerPiece(htmlFile: File, groupFiles: File[], bannerRoot: string): Promise<UploadedPiece | null> {
  try {
    const id = `b03-${++_bannerId03}-${Date.now()}`;
    const swFiles: { path: string; file: File }[] = [];
    for (const f of groupFiles) {
      const rel = (f as any).webkitRelativePath as string | undefined;
      const path = rel && bannerRoot && rel.startsWith(bannerRoot + "/") ? rel.slice(bannerRoot.length + 1) : f.name;
      swFiles.push({ path, file: f });
    }
    swFiles.push({ path: "index.html", file: htmlFile });
    await storeBanner(id, swFiles);

    let html = await htmlFile.text();
    html = html.split("https://s0.2mdn.net/ads/studio/Enabler.js").join("data:text/javascript,");
    html = html.split("http://s0.2mdn.net/ads/studio/Enabler.js").join("data:text/javascript,");
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + ENABLER_STUB_03);
    else html = ENABLER_STUB_03 + html;

    const patchedFile = new File([new Blob([html], { type: "text/html" })], "index.html", { type: "text/html" });
    await storeBanner(id, [{ path: "index.html", file: patchedFile }, ...swFiles.filter(f => f.path !== "index.html")]);

    let w = 0, h = 0;
    const meta = html.match(/width\s*=\s*(\d+)\s*,\s*height\s*=\s*(\d+)/i);
    if (meta) { w = +meta[1]; h = +meta[2]; }
    const folderName = bannerRoot.split("/").pop() || htmlFile.name;
    const m = folderName.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})/);
    const W = m ? +m[1] : (w || 300), H = m ? +m[2] : (h || 250);

    return { id: `up-${++_uid}`, name: folderName, dim: `${W}×${H}`, ar: W / H, imageUrl: `/banner-preview/${id}/index.html`, fileType: "htmlbanner" as any, fileName: htmlFile.name };
  } catch { return null; }
}

// ─── Font Picker ───────────────────────────────────────────────────────────────

function FontPicker({ value, onChange }: { value: string | null; onChange: (f: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Load selected Google Font
  useEffect(() => {
    if (!value) return;
    const id = `gf-${value.replace(/\s+/g, "-").toLowerCase()}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(value)}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [value]);

  const filtered = POPULAR_FONTS.filter((f) => f.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <input ref={fontRef} type="file" accept=".ttf,.woff,.woff2,.otf" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const name = file.name.replace(/\.[^.]+$/, "");
        const url = URL.createObjectURL(file);
        const style = document.createElement("style");
        style.textContent = `@font-face { font-family: "${name}"; src: url("${url}"); }`;
        document.head.appendChild(style);
        onChange(name);
        e.target.value = "";
      }} />

      {value ? (
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
            <Type size={12} className="text-gray-400 shrink-0" />
            <span style={{ fontFamily: `${value}, sans-serif` }} className="text-gray-800 text-[13px]">{value}</span>
          </div>
          <button onClick={() => onChange(null)} className="text-gray-300 hover:text-gray-500 cursor-pointer transition-colors"><X size={13} /></button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
        >
          <Search size={12} className="text-gray-400" />
          <span className="text-[12px] text-gray-500">Search Google Fonts…</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full mt-1.5 z-20 bg-white border border-gray-200 rounded-xl shadow-xl shadow-black/[0.08] w-64 overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                <Search size={11} className="text-gray-400 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search fonts…"
                  className="flex-1 bg-transparent outline-none text-[12px] text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map((font) => (
                <button
                  key={font}
                  onClick={() => { onChange(font); setOpen(false); setQuery(""); }}
                  className="w-full text-left px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  style={{ fontFamily: `${font}, sans-serif` }}
                >
                  {font}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3.5 py-4 text-[12px] text-gray-400 text-center">No fonts match "{query}"</p>
              )}
            </div>
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => { setOpen(false); fontRef.current?.click(); }}
                className="w-full flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-[12px] py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Upload size={11} />
                Upload custom font (.ttf, .woff, .woff2)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Live Cover Preview ────────────────────────────────────────────────────────

function CoverPreviewCard({
  campaign,
  brandColors,
}: {
  campaign: CampaignState;
  brandColors: string[];
}) {
  const tmpl = COVER_TEMPLATES.find((t) => t.id === campaign.coverTemplate) ?? COVER_TEMPLATES[0];
  const isCustom = campaign.coverTemplate === "custom";
  const customBg = CUSTOM_BG_OPTIONS.find((b) => b.id === campaign.selectedBg);

  const bg = isCustom ? (customBg?.hex ?? "#F3F4F6") : (tmpl.bg ?? "#0D0D0D");
  const textPrimary = isCustom ? "#111827" : (tmpl.textPrimary ?? "#F9FAFB");
  const textSecondary = isCustom ? "#6B7280" : (tmpl.textSecondary ?? "#6B7280");
  const accentColor = brandColors[0] ?? (tmpl.accent ?? "#374151");

  return (
    <div
      className="aspect-[16/9] rounded-xl overflow-hidden relative"
      style={{ background: bg }}
    >
      {/* Hero overlay */}
      {campaign.heroUrl && (
        <img
          src={campaign.heroUrl}
          alt="hero"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
      )}

      <div
        className="absolute inset-0 p-3.5 flex flex-col"
        style={{ fontFamily: campaign.brandFont ? `${campaign.brandFont}, sans-serif` : undefined }}
      >
        {/* Logo */}
        <div className="mb-auto">
          {campaign.logoUrl ? (
            <img src={campaign.logoUrl} alt="logo" className="h-4 object-contain object-left" style={{ maxWidth: 56 }} />
          ) : (
            <div className="w-4 h-4 rounded-[3px]" style={{ background: accentColor }} />
          )}
        </div>

        {/* Brand color accent */}
        {brandColors[0] && (
          <div className="mb-2 h-[2px] w-6 rounded-full" style={{ background: brandColors[0] }} />
        )}

        {/* Campaign info */}
        <div>
          <p className="text-[9px] font-semibold leading-tight mb-0.5" style={{ color: textPrimary }}>
            {campaign.campaignName || "Campaign Title"}
          </p>
          <p className="text-[7px] leading-tight" style={{ color: textSecondary }}>
            {[campaign.clientName, campaign.reviewRound].filter(Boolean).join(" · ") || "Client"}
          </p>
          {campaign.shippingDate && (
            <p className="text-[6px] mt-0.5" style={{ color: textSecondary, opacity: 0.7 }}>
              {campaign.shippingDate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar (shared) ──────────────────────────────────────────────────────────

const ACCENT = "#2c6bf2";

// ─── Main Component ────────────────────────────────────────────────────────────

export function Frame03CampaignSetup({ onBack, onGoToDashboard, onOpenBuilder, campaign, onUpdate, dark = false, setDark = () => {} }: Props) {
  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    surface: dark ? "#1d1d23" : "#ffffff",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f9fafb",
    inputBg: dark ? "#26262e" : "#f9fafb",
  };
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [localGroups, setLocalGroups] = useState<Record<string, Record<string, UploadedPiece[]>>>({});
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [lastInteraction, setLastInteraction] = useState<number | null>(null);
  const [autoProgress, setAutoProgress] = useState(0);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Designer");

  const logoRef    = useRef<HTMLInputElement>(null);
  const heroRef    = useRef<HTMLInputElement>(null);
  const bannersRef = useRef<HTMLInputElement>(null);
  const folderRef  = useRef<HTMLInputElement>(null);
  const colorRef   = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const goStep = (s: number) => { setDirection(s > step ? 1 : -1); setStep(s); setAutoProgress(0); setLastInteraction(null); };
  const handleBack = () => step === 2 ? goStep(1) : onBack();

  // ── Interaction tracking for auto-advance ─────────────────────────────────
  const nudge = useCallback(() => setLastInteraction(Date.now()), []);

  useEffect(() => {
    if (step !== 1 || !lastInteraction) { setAutoProgress(0); return; }
    const DURATION = 3000;
    const start = lastInteraction;
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / DURATION, 1);
      setAutoProgress(progress);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        goStep(2);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lastInteraction, step]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const subCampaignNames = Object.keys(localGroups).sort();
  const hasSubCampaigns = subCampaignNames.some((k) => k !== "");
  const totalPieces = Object.values(localGroups).flatMap((g) => Object.values(g)).flat().length;
  const allPlatforms = sortByOrder([...new Set(Object.values(localGroups).flatMap((g) => Object.keys(g)))]);
  const subCampaignCount = subCampaignNames.filter((k) => k !== "").length;
  const hasUploads = totalPieces > 0;
  const currentTemplate = COVER_TEMPLATES.find((t) => t.id === campaign.coverTemplate) ?? COVER_TEMPLATES[0];

  // ── Logo / hero handlers ───────────────────────────────────────────────────
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (campaign.logoUrl) URL.revokeObjectURL(campaign.logoUrl);
    onUpdate({ logoName: file.name, logoUrl: URL.createObjectURL(file) });
    nudge();
  };
  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (campaign.heroUrl) URL.revokeObjectURL(campaign.heroUrl);
    onUpdate({ heroName: file.name, heroUrl: URL.createObjectURL(file) });
    nudge();
  };
  const removeLogo = () => { if (campaign.logoUrl) URL.revokeObjectURL(campaign.logoUrl); onUpdate({ logoName: null, logoUrl: null }); if (logoRef.current) logoRef.current.value = ""; };
  const removeHero = () => { if (campaign.heroUrl) URL.revokeObjectURL(campaign.heroUrl); onUpdate({ heroName: null, heroUrl: null }); if (heroRef.current) heroRef.current.value = ""; };

  // ── Template selection (auto-sets background) ─────────────────────────────
  const selectTemplate = (id: string) => {
    const tmpl = COVER_TEMPLATES.find((t) => t.id === id);
    onUpdate({ coverTemplate: id, selectedBg: tmpl?.selectedBg ?? "white" });
    nudge();
  };

  // ── Brand colors ──────────────────────────────────────────────────────────
  const addColor = (hex: string) => {
    if (brandColors.includes(hex)) return;
    const next = [...brandColors, hex];
    setBrandColors(next);
    onUpdate({ brandColor: next[0], brandColors: next });
    nudge();
  };
  const removeColor = (hex: string) => {
    const next = brandColors.filter((c) => c !== hex);
    setBrandColors(next);
    onUpdate({ brandColor: next[0] ?? "", brandColors: next });
  };

  // ── Format toggle ─────────────────────────────────────────────────────────
  const toggleFormat = (f: string) =>
    onUpdate({
      selectedFormats: campaign.selectedFormats.includes(f)
        ? campaign.selectedFormats.filter((x) => x !== f)
        : [...campaign.selectedFormats, f],
    });

  // ── Banner upload core ─────────────────────────────────────────────────────
  const applyGrouped = (grouped: Record<string, Record<string, UploadedPiece[]>>) => {
    setDetecting(false);
    if (!Object.keys(grouped).length) return;
    setLocalGroups((prev) => {
      const next = { ...prev };
      Object.entries(grouped).forEach(([sub, platforms]) => {
        next[sub] = { ...next[sub] };
        Object.entries(platforms).forEach(([platform, pieces]) => {
          next[sub][platform] = [...(next[sub][platform] ?? []), ...pieces];
        });
      });
      return next;
    });
    const newPlatforms = Object.values(grouped).flatMap((g) => Object.keys(g));
    const autoFormats = new Set<string>(campaign.selectedFormats);
    newPlatforms.forEach((p) => (PLATFORM_FORMAT_MAP[p] ?? []).forEach((f) => autoFormats.add(f)));
    onUpdate({ selectedFormats: [...autoFormats] });
  };
  useEffect(() => { registerBannerSW().catch(() => {}); }, []);

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    setDetecting(true);
    const all = files.filter(f => !/^\./.test(f.name)); // skip hidden/system files

    // ── Group HTML5 banners by the folder containing each HTML file ──
    const htmlFiles = all.filter(f => /\.html?$/i.test(f.name));
    const htmlByDir = new Map<string, File>();
    for (const f of htmlFiles) {
      const rel = (f as any).webkitRelativePath as string ?? f.name;
      const parts = rel.split("/");
      const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      if (!htmlByDir.has(dir) || f.name.toLowerCase() === "index.html") {
        htmlByDir.set(dir, f);
      }
    }

    const consumed = new Set<File>();
    const extraPieces: { piece: UploadedPiece; pathParts: string[] }[] = [];

    // HTML5 banners
    for (const [bannerDir, htmlFile] of htmlByDir) {
      const groupFiles = bannerDir
        ? all.filter(f => {
            const rel = (f as any).webkitRelativePath as string | undefined;
            return rel && (rel === `${bannerDir}/${htmlFile.name}` || rel.startsWith(`${bannerDir}/`));
          })
        : [htmlFile];
      if (!groupFiles.length) continue;
      const piece = await buildHtmlBannerPiece(htmlFile, groupFiles, bannerDir);
      if (piece) {
        groupFiles.forEach(f => consumed.add(f));
        const relPath = (htmlFile as any).webkitRelativePath as string || "";
        const pathParts = relPath ? relPath.split("/").slice(0, -1) : [];
        extraPieces.push({ piece, pathParts });
      }
    }

    // PSD files
    const psdFiles = all.filter(f => /\.psd$/i.test(f.name) && !consumed.has(f));
    for (const f of psdFiles) {
      consumed.add(f);
      try {
        const pieces = await extractPsdArtboards(f);
        const relPath = (f as any).webkitRelativePath as string || "";
        const pathParts = relPath ? relPath.split("/").slice(0, -1) : [];
        pieces.forEach(p => extraPieces.push({ piece: p, pathParts }));
      } catch { /* skip */ }
    }

    // Regular media files
    const mediaFiles = all.filter(f =>
      !consumed.has(f) &&
      (f.type.startsWith("image/") || f.type.startsWith("video/") || /\.(jpe?g|png|gif|webp|mp4|webm|mov)$/i.test(f.name))
    );
    const mediaEntries = mediaFiles.map(file => {
      const relPath = (file as any).webkitRelativePath as string || "";
      return { file, pathParts: relPath ? relPath.split("/").slice(0, -1) : [] };
    });

    const grouped = buildGrouped(mediaEntries);

    // Inject HTML5 banners and PSD artboards into grouped structure
    for (const { piece, pathParts } of extraPieces) {
      let channelIdx = -1;
      for (let i = pathParts.length - 1; i >= 0; i--) { if (detectPlatform(pathParts[i])) { channelIdx = i; break; } }
      const platform = channelIdx >= 0 ? detectPlatform(pathParts[channelIdx])! : (detectPlatform(piece.name) ?? "HTML5");
      const subCampaign = channelIdx > 0 ? pathParts[channelIdx - 1] : "";
      grouped[subCampaign] = grouped[subCampaign] ?? {};
      grouped[subCampaign][platform] = grouped[subCampaign][platform] ?? [];
      grouped[subCampaign][platform].push(piece);
    }

    await new Promise(r => setTimeout(r, 400));
    applyGrouped(grouped);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setUploadDragging(false);
    const items = Array.from(e.dataTransfer.items);
    const fsEntries = items.map(item => item.webkitGetAsEntry?.()).filter((entry): entry is FileSystemEntry => !!entry);
    if (fsEntries.length > 0) {
      setDetecting(true);
      const results = await Promise.all(fsEntries.map(entry => traverseFSEntry(entry)));
      await processFiles(results.flat().map(e => e.file));
    } else {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };
  const handleFolderInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await processFiles(files);
  };
  const handleBannerInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await processFiles(files);
  };
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; if (dragCounter.current === 1) setUploadDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setUploadDragging(false); };
  const removePiece = (subCampaign: string, platform: string, pieceId: string) => {
    setLocalGroups((prev) => {
      const next = { ...prev };
      const group = next[subCampaign];
      if (!group) return next;
      const current = group[platform] ?? [];
      const piece = current.find((p) => p.id === pieceId);
      if (piece?.imageUrl) URL.revokeObjectURL(piece.imageUrl);
      const updated = current.filter((p) => p.id !== pieceId);
      const newGroup = { ...group };
      if (updated.length === 0) { delete newGroup[platform]; } else { newGroup[platform] = updated; }
      if (Object.keys(newGroup).length === 0) { delete next[subCampaign]; } else { next[subCampaign] = newGroup; }
      return next;
    });
  };
  const handleGeneratePreview = () => {
    const flatPlatforms: string[] = [];
    const flatPieces: Record<string, UploadedPiece[]> = {};
    Object.values(localGroups).forEach((platforms) => {
      Object.entries(platforms).forEach(([platform, pieces]) => {
        if (!flatPlatforms.includes(platform)) flatPlatforms.push(platform);
        flatPieces[platform] = [...(flatPieces[platform] ?? []), ...pieces];
      });
    });
    onUpdate({ uploadedPlatforms: sortByOrder(flatPlatforms), uploadedPieces: flatPieces, uploadedGroups: localGroups });
    onOpenBuilder();
  };

  // ── Detected sections ─────────────────────────────────────────────────────
  const renderDetectedSections = () => {
    if (!hasUploads || detecting) return null;
    const sortedSubs = [...subCampaignNames.filter((k) => k !== "").sort(), ...(subCampaignNames.includes("") ? [""] : [])];
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={11} className="text-gray-400" />
          <span className="text-gray-400 font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Secciones detectadas</span>
          <span className="bg-gray-100 text-gray-500 rounded-md px-1.5 py-0.5 font-semibold" style={{ fontSize: "10px" }}>
            {totalPieces} archivos · {hasSubCampaigns ? `${subCampaignCount} sub-campaña${subCampaignCount !== 1 ? "s" : ""}` : `${allPlatforms.length} plataforma${allPlatforms.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="space-y-3">
          {sortedSubs.map((sub, subIdx) => {
            const group = localGroups[sub] ?? {};
            const platforms = sortByOrder(Object.keys(group));
            const subTotalPieces = Object.values(group).flat().length;
            return (
              <motion.div key={sub || "__flat__"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.22, delay: subIdx * 0.05 }} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {hasSubCampaigns && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/60 border-b border-gray-100">
                    <Folder size={11} className="text-gray-400 shrink-0" />
                    <span className="text-gray-800 font-semibold" style={{ fontSize: "12px" }}>{sub || "General"}</span>
                    <span className="text-gray-400 ml-auto" style={{ fontSize: "11px" }}>{subTotalPieces} file{subTotalPieces !== 1 ? "s" : ""}</span>
                  </div>
                )}
                <div className="p-3 space-y-3">
                  {platforms.map((platform, pidx) => {
                    const pieces = group[platform] ?? [];
                    const visible = pieces.slice(0, 8);
                    const overflow = pieces.length - 8;
                    return (
                      <motion.div key={platform} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: subIdx * 0.05 + pidx * 0.04 }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[platform] ?? "#888" }} />
                          <span className="text-gray-800 font-semibold" style={{ fontSize: "12px" }}>{platform}</span>
                          <span className="text-gray-400 ml-auto" style={{ fontSize: "11px" }}>{pieces.length} piece{pieces.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          <AnimatePresence>
                            {visible.map((piece) => (
                              <motion.div key={piece.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} transition={{ duration: 0.14 }} className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0 group" title={`${piece.name} · ${piece.dim}`}>
                                {piece.fileType === "video"
                                  ? <video src={piece.imageUrl} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                                  : <img src={piece.imageUrl} alt={piece.name} className="w-full h-full object-cover" />
                                }
                                <button onClick={(e) => { e.stopPropagation(); removePiece(sub, platform, piece.id); }} className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-100 cursor-pointer">
                                  <X size={10} className="text-white" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {overflow > 0 && (
                            <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                              <span className="text-gray-400 font-semibold" style={{ fontSize: "10px" }}>+{overflow}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: T.surface }}>
      <Sidebar active="campaigns" dark={dark} setDark={setDark} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top bar / Breadcrumb ── */}
        <div className="flex items-center gap-2 px-8 py-4 border-b" style={{ borderColor: T.border, background: T.page }}>
          <button onClick={onGoToDashboard} className="text-[13px] cursor-pointer transition-colors duration-100" style={{ color: T.sub }}>Dashboard</button>
          <ChevronRight size={12} style={{ color: T.sub, opacity: 0.6 }} />
          <button onClick={onBack} className="text-[13px] cursor-pointer transition-colors duration-100" style={{ color: T.sub }}>Campañas</button>
          <ChevronRight size={12} style={{ color: T.sub, opacity: 0.6 }} />
          <span className="text-[13px] font-medium truncate max-w-[200px]" style={{ color: T.text }}>
            {campaign.campaignName || "Campaña sin título"}
          </span>
          {step === 2 && (
            <>
              <ChevronRight size={12} style={{ color: T.sub, opacity: 0.6 }} />
              <span className="text-[13px]" style={{ color: T.sub }}>Assets y Formatos</span>
            </>
          )}
          <div className="ml-auto">
            <button
              onClick={() => toast.info("Campaña archivada")}
              className="px-3 py-1.5 rounded-lg cursor-pointer text-[13px] transition-all duration-100"
              style={{ color: T.sub }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Archivar
            </button>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="flex items-center gap-0 px-8 py-3.5 border-b" style={{ borderColor: T.border, background: T.page }}>
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={label} className="flex items-center">
                <button
                  onClick={() => goStep(n)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-200" style={done || active ? { background: ACCENT, color: "#fff" } : { background: T.hover, color: T.sub }}>
                    {done ? "✓" : n}
                  </div>
                  <span className="text-[12px] transition-colors duration-200" style={active ? { color: T.text, fontWeight: 600 } : { color: T.sub }}>{label}</span>
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <div className="mx-4 flex items-center gap-0.5">
                    {Array.from({ length: 12 }).map((_, k) => (
                      <div key={k} className="w-1 h-px rounded-full transition-colors duration-300" style={{ background: k < (done ? 12 : 0) ? ACCENT : T.border }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ x: direction * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -40, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 overflow-y-auto px-8 py-6"
            >
              <div className="flex gap-8 max-w-5xl">

                {/* ── LEFT PANEL ── */}
                <div className="flex-1 min-w-0">

                  {/* ═══ STEP 1: Campaign Details ═══ */}
                  {step === 1 && (
                    <>
                      <div className="mb-7">
                        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.sub }}>Paso 1</p>
                        <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: T.text }}>Detalles de campaña</h2>
                      </div>

                      {/* ── Información general ── */}
                      <div className="mb-6 pb-6 border-b" style={{ borderColor: T.border }}>
                        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: T.sub }}>Información</p>
                        <div className="space-y-3">
                          {[
                            { label: "Nombre de campaña", key: "campaignName" as const, type: "text", placeholder: "ej. Venta de Verano 2026" },
                            { label: "Cliente / Marca",   key: "clientName"   as const, type: "text", placeholder: "ej. Éxito" },
                            { label: "Fecha de entrega",  key: "shippingDate" as const, type: "date", placeholder: "" },
                            { label: "Ronda de revisión", key: "reviewRound"  as const, type: "text", placeholder: "ej. Ronda 1" },
                          ].map(({ label, key, type, placeholder }) => (
                            <div key={label} className="flex items-center gap-4">
                              <span className="text-[12px] w-36 shrink-0" style={{ color: T.sub }}>{label}</span>
                              <input
                                type={type}
                                value={campaign[key]}
                                placeholder={placeholder}
                                onChange={(e) => { onUpdate({ [key]: e.target.value }); nudge(); }}
                                className="flex-1 rounded-lg px-3 py-1.5 text-[13px] placeholder-gray-300 outline-none transition-colors"
                                style={{ background: T.inputBg, border: `1px solid ${T.border}`, color: T.text }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Portada ── */}
                      <div className="mb-6 pb-6 border-b" style={{ borderColor: T.border }}>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: T.sub }}>Portada del preview</p>
                          <button
                            onClick={() => { onUpdate({ includeCover: !campaign.includeCover }); nudge(); }}
                            className="relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0"
                            style={{ background: campaign.includeCover ? ACCENT : (dark ? "#3a3a44" : "#d1d5db") }}
                          >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${campaign.includeCover ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {campaign.includeCover && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              {/* Template selector */}
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                {COVER_TEMPLATES.map((t) => (
                                  <button key={t.id} onClick={() => selectTemplate(t.id)} className="flex flex-col gap-2 cursor-pointer group text-left">
                                    <div className="w-full rounded-xl overflow-hidden transition-all duration-150"
                                      style={{ height: 80, border: campaign.coverTemplate === t.id ? `2px solid ${ACCENT}` : `1px solid ${T.border}`, boxShadow: campaign.coverTemplate === t.id ? `0 0 0 3px rgba(44,107,242,0.15)` : "none" }}>
                                      {t.preview}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-0.5">
                                      <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                                        style={{ borderColor: campaign.coverTemplate === t.id ? ACCENT : T.border, background: campaign.coverTemplate === t.id ? ACCENT : "transparent" }}>
                                        {campaign.coverTemplate === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                      <span className="text-[12px] font-medium" style={{ color: campaign.coverTemplate === t.id ? T.text : T.sub }}>{t.label}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>

                              {/* Custom bg swatches */}
                              <AnimatePresence>
                                {campaign.coverTemplate === "custom" && (
                                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }} className="flex items-center gap-3 mb-4">
                                    <span className="text-[12px] w-36 shrink-0" style={{ color: T.sub }}>Color de fondo</span>
                                    <div className="flex items-center gap-2">
                                      {CUSTOM_BG_OPTIONS.map((bg) => (
                                        <button key={bg.id} onClick={() => { onUpdate({ selectedBg: bg.id }); nudge(); }} title={bg.label}
                                          className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-100 ${bg.cls} ${campaign.selectedBg === bg.id ? "ring-2 ring-offset-1 ring-blue-400" : ""}`} />
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Logo + Hero */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                  <span className="text-[12px] w-36 shrink-0" style={{ color: T.sub }}>Logo</span>
                                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                  {campaign.logoUrl ? (
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-9 h-9 rounded-lg border overflow-hidden shrink-0 flex items-center justify-center" style={{ borderColor: T.border, background: T.inputBg }}>
                                        <img src={campaign.logoUrl} alt="logo" className="w-full h-full object-contain" />
                                      </div>
                                      <span className="text-[12px] font-medium max-w-[100px] truncate" style={{ color: T.text }}>{campaign.logoName}</span>
                                      <button onClick={removeLogo} className="text-[11px] cursor-pointer transition-colors" style={{ color: T.sub }}>Quitar</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => logoRef.current?.click()} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer transition-colors" style={{ background: T.inputBg, border: `1px solid ${T.border}`, color: T.sub }}>
                                      <Upload size={11} /><span className="text-[12px]">Subir logo</span>
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-[12px] w-36 shrink-0" style={{ color: T.sub }}>Imagen de portada</span>
                                  <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={handleHeroChange} />
                                  {campaign.heroUrl ? (
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-14 h-9 rounded-lg border overflow-hidden shrink-0" style={{ borderColor: T.border }}>
                                        <img src={campaign.heroUrl} alt="hero" className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-[12px] font-medium max-w-[100px] truncate" style={{ color: T.text }}>{campaign.heroName}</span>
                                      <button onClick={removeHero} className="text-[11px] cursor-pointer transition-colors" style={{ color: T.sub }}>Quitar</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => heroRef.current?.click()} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer transition-colors" style={{ background: T.inputBg, border: `1px solid ${T.border}`, color: T.sub }}>
                                      <Upload size={11} /><span className="text-[12px]">Subir imagen</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Identidad de marca ── */}
                      <div className="mb-6">
                        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: T.sub }}>Identidad de marca</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-4">
                            <span className="text-[12px] w-36 shrink-0 pt-1" style={{ color: T.sub }}>Fuente</span>
                            <FontPicker value={campaign.brandFont} onChange={(f) => { onUpdate({ brandFont: f }); nudge(); }} />
                          </div>
                          <div className="flex items-start gap-4">
                            <span className="text-[12px] w-36 shrink-0 pt-1.5" style={{ color: T.sub }}>Colores</span>
                            <div className="flex flex-col gap-2">
                              <input ref={colorRef} type="color" className="sr-only" onChange={(e) => addColor(e.target.value)} />
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {brandColors.map((c) => (
                                  <div key={c} className="relative group">
                                    <div className="w-6 h-6 rounded-full border border-black/10 cursor-pointer" style={{ background: c }} />
                                    <button onClick={() => removeColor(c)} className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm">
                                      <X size={7} className="text-gray-600" />
                                    </button>
                                  </div>
                                ))}
                                <button onClick={() => colorRef.current?.click()} className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center cursor-pointer transition-colors shrink-0" style={{ borderColor: T.sub }}>
                                  <Plus size={10} style={{ color: T.sub }} />
                                </button>
                              </div>
                              {brandColors.length === 0 && <p className="text-[11px]" style={{ color: T.sub, opacity: 0.6 }}>Sin colores aún</p>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Auto-advance indicator ── */}
                      <AnimatePresence>
                        {lastInteraction && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className="mt-2 mb-4"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[12px]" style={{ color: T.sub }}>Continuando a Assets y Formatos…</p>
                              <button
                                onClick={() => { setLastInteraction(null); setAutoProgress(0); }}
                                className="text-[11px] cursor-pointer transition-colors"
                                style={{ color: T.sub }}
                              >
                                Cancelar
                              </button>
                            </div>
                            <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ width: `${autoProgress * 100}%`, background: ACCENT }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {/* ═══ STEP 2: Assets & Formats ═══ */}
                  {step === 2 && (
                    <>
                      <div className="mb-8">
                        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.sub }}>Paso 2</p>
                        <h2 className="text-xl font-semibold tracking-tight" style={{ color: T.text }}>Assets y Formatos</h2>
                      </div>

                      <input ref={bannersRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleBannerInput} />
                      <input ref={folderRef} type="file" multiple className="hidden" {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)} onChange={handleFolderInput} />

                      {/* 1. Campaign Name */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: ACCENT }}>1</span>
                          <span className="text-[13px] font-semibold" style={{ color: T.text }}>Nombre de campaña</span>
                        </div>
                        <input value={campaign.campaignName} onChange={(e) => onUpdate({ campaignName: e.target.value })} className="w-full bg-transparent outline-none border-b pb-2 text-[22px] font-semibold tracking-tight transition-colors duration-150" style={{ color: T.text, borderColor: T.border }} />
                      </div>

                      {/* 2. Upload banners */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: ACCENT }}>2</span>
                          <span className="text-[13px] font-semibold" style={{ color: T.text }}>Subir banners</span>
                          {hasUploads && <span className="ml-auto text-[11px]" style={{ color: T.sub }}>{totalPieces} archivo{totalPieces !== 1 ? "s" : ""} · {allPlatforms.length} plataforma{allPlatforms.length !== 1 ? "s" : ""}</span>}
                        </div>
                        <div
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl transition-all duration-150 ${uploadDragging ? "border-gray-500" : "hover:border-gray-500"}`}
                          style={{ borderColor: uploadDragging ? (dark ? "#555" : "#9ca3af") : undefined, background: uploadDragging ? (dark ? "#2a2a32" : "#f3f4f6") : (dark ? "#1a1a22" : "#f9fafb") }}
                        >
                          <div className="p-7 flex flex-col items-center justify-center text-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${uploadDragging ? "bg-gray-200" : "bg-gray-100"}`}>
                              {uploadDragging ? <Folder size={16} className="text-gray-500" /> : <Upload size={16} className="text-gray-400" />}
                            </div>
                            <p className="text-[13px] font-medium mb-1" style={{ color: T.text }}>{uploadDragging ? "Suelta para detectar" : hasUploads ? "Añadir más banners" : "Arrastra una carpeta o archivos aquí"}</p>
                            <p className="text-[12px] mb-5" style={{ color: T.sub }}>{hasUploads ? "Plataforma detectada por estructura de carpetas o nombre" : "Estructura auto-detectada: Marca / Campaña / Sub-campaña / Canal"}</p>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button type="button" onClick={() => folderRef.current?.click()} className="flex items-center gap-1.5 text-white rounded-xl px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-colors duration-100 hover:brightness-110" style={{ background: ACCENT }}>
                                <Folder size={11} />Seleccionar carpeta
                              </button>
                              <span style={{ fontSize: "11px", color: T.sub }}>o</span>
                              <button type="button" onClick={() => bannersRef.current?.click()} className="text-[12px] cursor-pointer transition-colors duration-100" style={{ textDecoration: "underline", textUnderlineOffset: "2px", color: T.sub }}>explorar archivos</button>
                            </div>
                          </div>
                        </div>
                        <AnimatePresence>
                          {detecting && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: T.inputBg, border: `1px solid ${T.border}` }}>
                              <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin shrink-0" style={{ borderColor: T.border, borderTopColor: ACCENT }} />
                              <span className="text-[12px]" style={{ color: T.sub }}>Analizando estructura de carpetas…</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <AnimatePresence>{hasUploads && !detecting && renderDetectedSections()}</AnimatePresence>

                      {/* 3. Formats */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: ACCENT }}>3</span>
                          <span className="text-[13px] font-semibold" style={{ color: T.text }}>Seleccionar formatos</span>
                          {hasUploads && <span className="ml-auto text-[11px]" style={{ color: T.sub }}>Auto-seleccionado del upload</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formats.map((f) => (
                            <button key={f} onClick={() => toggleFormat(f)}
                              className="px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-100"
                              style={campaign.selectedFormats.includes(f)
                                ? { background: dark ? "#3a3a48" : "#111827", color: "#fff", border: `1px solid ${dark ? "#5a5a6e" : "#111827"}` }
                                : { background: T.inputBg, border: `1px solid ${T.border}`, color: T.text }}
                              onMouseEnter={(e) => { if (!campaign.selectedFormats.includes(f)) (e.currentTarget as HTMLElement).style.background = dark ? "#2a2a34" : "#e9eaec"; }}
                              onMouseLeave={(e) => { if (!campaign.selectedFormats.includes(f)) (e.currentTarget as HTMLElement).style.background = T.inputBg; }}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4. Generate Preview */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2.5 mb-4">
                          <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: ACCENT }}>4</span>
                          <span className="text-[13px] font-semibold" style={{ color: T.text }}>Generar preview</span>
                        </div>
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleGeneratePreview} className="w-full text-white rounded-2xl py-4 text-[15px] font-semibold tracking-tight flex items-center justify-center gap-2.5 transition-colors duration-150 cursor-pointer hover:brightness-110" style={{ background: ACCENT }}>
                          <Zap size={16} />
                          {hasUploads ? `Construir deck — ${allPlatforms.length} canal${allPlatforms.length !== 1 ? "es" : ""}, ${totalPieces} banners` : "Generar preview"}
                        </motion.button>
                        {!hasUploads && <p className="text-center text-[11px] mt-2" style={{ color: T.sub }}>Sube banners para construir el deck automáticamente</p>}
                      </div>
                    </>
                  )}

                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="w-72 shrink-0">
                  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.35 }} className="space-y-4">

                    {step === 1 ? (
                      <>
                        {/* Live Cover Preview */}
                        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.sub }}>Vista previa</p>
                            {campaign.includeCover && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(44,107,242,0.12)", color: ACCENT }}>
                                {COVER_TEMPLATES.find(t => t.id === campaign.coverTemplate)?.label ?? "Dark"}
                              </span>
                            )}
                          </div>
                          <div className="px-4 pb-4">
                            {campaign.includeCover
                              ? <CoverPreviewCard campaign={campaign} brandColors={brandColors} />
                              : <div className="aspect-[16/9] rounded-xl flex items-center justify-center" style={{ background: T.inputBg, border: `1px dashed ${T.border}` }}>
                                  <p className="text-[11px]" style={{ color: T.sub }}>Sin portada</p>
                                </div>
                            }
                          </div>
                        </div>

                        {/* Quick summary */}
                        <div className="rounded-2xl p-4" style={{ background: T.inputBg, border: `1px solid ${T.border}` }}>
                          <p className="mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.sub }}>Resumen</p>
                          <div className="space-y-2.5">
                            {[
                              { label: "Campaña",  value: campaign.campaignName || "—" },
                              { label: "Cliente",  value: campaign.clientName || "—" },
                              { label: "Entrega",  value: campaign.shippingDate || "—" },
                              { label: "Revisión", value: campaign.reviewRound || "—" },
                              { label: "Fuente",   value: campaign.brandFont || "Por defecto" },
                              { label: "Colores",  value: brandColors.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  {brandColors.slice(0, 4).map(c => <div key={c} className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ background: c }} />)}
                                  {brandColors.length > 4 && <span style={{ fontSize: "10px", color: T.sub }}>+{brandColors.length - 4}</span>}
                                </div>
                              ) : "—" },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex items-center justify-between gap-2">
                                <span style={{ fontSize: "12px", color: T.sub }}>{label}</span>
                                {typeof value === "string"
                                  ? <span className="text-right truncate max-w-[130px]" style={{ fontSize: "12px", fontWeight: 500, color: T.text }}>{value}</span>
                                  : value
                                }
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Auto-detected */}
                        <div className="rounded-2xl p-4" style={{ background: dark ? "#000" : "#111114" }}>
                          <div className="flex items-center gap-2 mb-3">
                            <Zap size={12} className="text-gray-300" />
                            <span className="text-white font-semibold" style={{ fontSize: "12px" }}>Auto-detectado</span>
                          </div>
                          <AnimatePresence mode="wait">
                            {hasUploads ? (
                              <motion.div key="has-uploads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <div className="space-y-2 mb-3">
                                  {allPlatforms.map((p) => (
                                    <div key={p} className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[p] ?? "#888" }} />
                                      <span className="text-gray-300" style={{ fontSize: "12px" }}>{p}</span>
                                      <span className="text-gray-500 ml-auto" style={{ fontSize: "11px" }}>{Object.values(localGroups).reduce((s, g) => s + (g[p]?.length ?? 0), 0)} pzs</span>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={handleGeneratePreview} className="w-full flex items-center justify-center gap-1 bg-white text-gray-900 rounded-xl py-2 cursor-pointer hover:bg-gray-100 transition-colors font-semibold" style={{ fontSize: "12px" }}>
                                  Abrir en Builder <ChevronRight size={12} />
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <p className="text-white font-medium mb-1" style={{ fontSize: "12px" }}>{detecting ? "Detectando…" : "Esperando assets"}</p>
                                <p className="text-gray-400" style={{ fontSize: "11px", lineHeight: "1.5" }}>Sube una carpeta para auto-detectar canales y sub-campañas.</p>
                                <button disabled className="mt-3 w-full flex items-center justify-center gap-1 bg-gray-700 text-gray-500 rounded-xl py-2 cursor-not-allowed" style={{ fontSize: "12px" }}>
                                  Abrir en Builder <ChevronRight size={12} />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Status */}
                        <div className="rounded-2xl p-4" style={{ background: T.inputBg, border: `1px solid ${T.border}` }}>
                          <p className="mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.sub }}>Estado</p>
                          <div className="space-y-2">
                            {[
                              { label: "Banners",       value: hasUploads ? `${totalPieces} subidos` : "Ninguno" },
                              ...(subCampaignCount > 0 ? [{ label: "Sub-campañas", value: String(subCampaignCount) }] : []),
                              { label: "Canales",       value: hasUploads ? String(allPlatforms.length) : "—" },
                              { label: "Formatos",      value: String(campaign.selectedFormats.length) },
                              { label: "Portada",       value: campaign.includeCover ? "Incluida" : "Omitida" },
                              { label: "Responsable",   value: "Andrea C." },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span style={{ fontSize: "12px", color: T.sub }}>{label}</span>
                                <span style={{ fontSize: "12px", fontWeight: 500, color: T.text }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Team */}
                        <div className="rounded-2xl p-4" style={{ background: T.inputBg, border: `1px solid ${T.border}` }}>
                          <p className="mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.sub }}>Equipo</p>
                          <div className="space-y-2">
                            {[
                              { initials: "AC", name: "Andrea Camila", role: "Lead" },
                              { initials: "MR", name: "María Rodríguez", role: "Diseñadora" },
                              { initials: "AT", name: "Andrés Torres",  role: "Revisor" },
                            ].map(({ initials, name, role }) => (
                              <div key={name} className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: T.hover }}>
                                  <span style={{ fontSize: "9px", fontWeight: 700, color: T.sub }}>{initials}</span>
                                </div>
                                <div>
                                  <p style={{ fontSize: "12px", fontWeight: 500, color: T.text }}>{name}</p>
                                  <p style={{ fontSize: "10px", color: T.sub }}>{role}</p>
                                </div>
                              </div>
                            ))}
                            <button onClick={() => { setInviteEmail(""); setInviteRole("Diseñadora"); setInviteOpen(true); }} className="flex items-center gap-1.5 cursor-pointer mt-1 transition-colors duration-100" style={{ fontSize: "12px", color: T.sub }}>
                              <Plus size={11} />Invitar
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                  </motion.div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Invite Modal ── */}
      <AnimatePresence>
        {inviteOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} onClick={() => setInviteOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="rounded-2xl shadow-2xl p-6 w-80" style={{ background: T.page }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-semibold" style={{ fontSize: "14px", color: T.text }}>Invitar al equipo</p>
                <button onClick={() => setInviteOpen(false)} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors" style={{ background: T.hover }}><X size={11} style={{ color: T.sub }} /></button>
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "12px", color: T.sub }}>Correo electrónico</label>
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colega@marca.com" className="w-full rounded-xl px-3 py-2 outline-none transition-colors" style={{ fontSize: "13px", background: T.inputBg, border: `1px solid ${T.border}`, color: T.text }} autoFocus />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "12px", color: T.sub }}>Rol</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full rounded-xl px-3 py-2 outline-none transition-colors cursor-pointer" style={{ fontSize: "13px", background: T.inputBg, border: `1px solid ${T.border}`, color: T.text }}>
                    <option>Lead</option><option>Diseñadora</option><option>Revisor</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setInviteOpen(false)} className="flex-1 py-2.5 rounded-xl cursor-pointer transition-colors" style={{ fontSize: "13px", border: `1px solid ${T.border}`, color: T.sub }}>Cancelar</button>
                <button onClick={() => { setInviteOpen(false); toast.success(`Invitación enviada a ${inviteEmail || "tu colega"}`); }} className="flex-1 py-2.5 rounded-xl text-white cursor-pointer transition-colors font-medium hover:brightness-110" style={{ fontSize: "13px", background: ACCENT }}>Enviar invitación</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
