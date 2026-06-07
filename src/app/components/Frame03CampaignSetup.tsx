import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronRight, Folder, HelpCircle,
  LayoutGrid, Plus, Settings, Upload, X, Zap, Search, Type,
} from "lucide-react";
import type { CampaignState, UploadedPiece } from "../App";

interface Props {
  onBack: () => void;
  onGoToDashboard: () => void;
  onOpenBuilder: () => void;
  campaign: CampaignState;
  onUpdate: (updates: Partial<CampaignState>) => void;
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
const STEP_LABELS = ["Campaign Details", "Assets & Formats"];

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

function Sidebar({ onDashboard, onCampaigns }: { onDashboard: () => void; onCampaigns: () => void }) {
  return (
    <div className="w-56 border-r border-gray-100 flex flex-col py-5 px-3 shrink-0">
      <div className="flex items-center gap-2 px-2 mb-7">
        <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center shrink-0">
          <svg width="13" height="11" viewBox="0 0 12.9104 10.3283" fill="none">
            <path d="M12.799 0.211896V8.32163H6.49027V6.51912H10.9965V2.0144H1.98553V0.211896H12.799Z" fill="white" />
            <path d="M6.49032 8.32165V10.1241H0.183076V2.0144H1.98558V8.32165H6.49032Z" fill="white" />
          </svg>
        </div>
        <span className="text-gray-900 text-sm font-semibold tracking-tight">PreviewStudio</span>
      </div>
      <nav className="flex-1 space-y-0.5">
        <button onClick={onDashboard} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all duration-100">
          <LayoutGrid size={14} />Dashboard
        </button>
        <button onClick={onCampaigns} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] bg-gray-100 text-gray-900 font-medium">
          <Folder size={14} />Campaigns
        </button>
      </nav>
      <div className="space-y-0.5 pt-4 border-t border-gray-100">
        {[
          { icon: Settings, label: "Settings", action: () => toast.info("Settings coming soon") },
          { icon: HelpCircle, label: "Help",     action: () => toast.info("Help center coming soon") },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer text-[13px] transition-all duration-100">
            <Icon size={14} />{label}
          </button>
        ))}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <div className="w-6 h-6 rounded-full bg-[#6715af] flex items-center justify-center shrink-0">
            <span className="text-white text-[9px] font-bold">FC</span>
          </div>
          <div>
            <p className="text-gray-700 text-[12px] font-medium leading-tight">Fabian Caamaño</p>
            <p className="text-gray-400 text-[11px]">Designer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Frame03CampaignSetup({ onBack, onGoToDashboard, onOpenBuilder, campaign, onUpdate }: Props) {
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
  const isMediaFile = (file: File) =>
    file.type.startsWith("image/") || file.type.startsWith("video/") ||
    /\.(jpe?g|png|gif|webp|avif|svg|mp4|webm|mov|avi)$/i.test(file.name);
  const processFileEntries = async (entries: { file: File; pathParts: string[] }[]) => {
    const images = entries.filter(({ file }) => isMediaFile(file));
    if (!images.length) return;
    setDetecting(true);
    await new Promise((r) => setTimeout(r, 850));
    applyGrouped(buildGrouped(images));
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setUploadDragging(false);
    const items = Array.from(e.dataTransfer.items);
    const fsEntries = items.map((item) => item.webkitGetAsEntry?.()).filter((entry): entry is FileSystemEntry => !!entry);
    if (fsEntries.length > 0) {
      setDetecting(true);
      const t0 = Date.now();
      const results = await Promise.all(fsEntries.map((entry) => traverseFSEntry(entry)));
      const allEntries = results.flat();
      const delay = Math.max(0, 850 - (Date.now() - t0));
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      applyGrouped(buildGrouped(allEntries.filter(({ file }) => isMediaFile(file))));
    } else {
      processFileEntries(Array.from(e.dataTransfer.files).map((f) => ({ file: f, pathParts: [] })));
    }
  };
  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    processFileEntries(files.map((file) => {
      const relPath = file.webkitRelativePath ?? "";
      return { file, pathParts: relPath ? relPath.split("/").slice(0, -1) : [] };
    }));
  };
  const handleBannerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    processFileEntries(files.map((f) => ({ file: f, pathParts: [] })));
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
          <span className="text-gray-400 font-semibold uppercase tracking-wider" style={{ fontSize: "10px" }}>Detected sections</span>
          <span className="bg-gray-100 text-gray-500 rounded-md px-1.5 py-0.5 font-semibold" style={{ fontSize: "10px" }}>
            {totalPieces} files · {hasSubCampaigns ? `${subCampaignCount} sub-campaign${subCampaignCount !== 1 ? "s" : ""}` : `${allPlatforms.length} platform${allPlatforms.length !== 1 ? "s" : ""}`}
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
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar onDashboard={onGoToDashboard} onCampaigns={onBack} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top bar / Breadcrumb ── */}
        <div className="flex items-center gap-2 px-8 py-4 border-b border-gray-100">
          <button onClick={onGoToDashboard} className="text-gray-400 hover:text-gray-700 text-[13px] cursor-pointer transition-colors duration-100">Dashboard</button>
          <ChevronRight size={12} className="text-gray-300" />
          <button onClick={onBack} className="text-gray-400 hover:text-gray-700 text-[13px] cursor-pointer transition-colors duration-100">Campaigns</button>
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-700 text-[13px] font-medium truncate max-w-[200px]">
            {campaign.campaignName || "Untitled Campaign"}
          </span>
          {step === 2 && (
            <>
              <ChevronRight size={12} className="text-gray-300" />
              <span className="text-gray-500 text-[13px]">Assets & Formats</span>
            </>
          )}
          <div className="ml-auto">
            <button
              onClick={() => toast.info("Campaign archived")}
              className="text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-[13px] transition-all duration-100"
            >
              Archive
            </button>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="flex items-center gap-0 px-8 py-3.5 border-b border-gray-100">
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
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-200 ${done || active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                    {done ? "✓" : n}
                  </div>
                  <span className={`text-[12px] transition-colors duration-200 ${active ? "text-gray-900 font-semibold" : "text-gray-400 group-hover:text-gray-600"}`}>{label}</span>
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <div className="mx-4 flex items-center gap-0.5">
                    {Array.from({ length: 12 }).map((_, k) => (
                      <div key={k} className={`w-1 h-px rounded-full transition-colors duration-300 ${k < (done ? 12 : 0) ? "bg-gray-900" : "bg-gray-200"}`} />
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
              <div className="flex gap-8">

                {/* ── LEFT PANEL ── */}
                <div className="flex-1 max-w-xl">

                  {/* ═══ STEP 1: Campaign Details ═══ */}
                  {step === 1 && (
                    <>
                      {/* Section header */}
                      <div className="mb-8">
                        <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-widest mb-1">Step 1</p>
                        <h2 className="text-gray-900 text-xl font-semibold tracking-tight">Campaign Details</h2>
                      </div>

                      {/* ── Include Cover toggle ── */}
                      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
                        <div>
                          <p className="text-gray-800 text-[13px] font-semibold">Include cover page</p>
                          <p className="text-gray-400 text-[12px] mt-0.5">Add a branded cover slide to the preview</p>
                        </div>
                        <button
                          onClick={() => { onUpdate({ includeCover: !campaign.includeCover }); nudge(); }}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${campaign.includeCover ? "bg-gray-900" : "bg-gray-200"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${campaign.includeCover ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </div>

                      {/* ── Cover Template (hidden when toggle OFF) ── */}
                      <AnimatePresence>
                        {campaign.includeCover && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                          >
                            <div className="mb-6 pb-5 border-b border-gray-100">
                              <p className="text-gray-700 text-[13px] font-semibold mb-3">Cover Template</p>
                              <div className="grid grid-cols-3 gap-2.5">
                                {COVER_TEMPLATES.map((t) => (
                                  <button
                                    key={t.id}
                                    onClick={() => selectTemplate(t.id)}
                                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                                  >
                                    <div className={`w-full h-16 rounded-xl border-2 overflow-hidden transition-all duration-100 ${campaign.coverTemplate === t.id ? "border-gray-900 shadow-sm ring-1 ring-gray-900/10" : "border-gray-200 hover:border-gray-300"}`}>
                                      {t.preview}
                                    </div>
                                    <span className={`text-[11px] transition-colors ${campaign.coverTemplate === t.id ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                                      {t.label}
                                    </span>
                                  </button>
                                ))}
                              </div>

                              {/* Custom background picker */}
                              <AnimatePresence>
                                {campaign.coverTemplate === "custom" && (
                                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="mt-3 flex items-center gap-3">
                                    <span className="text-gray-400 text-[12px] w-24 shrink-0">Background</span>
                                    <div className="flex items-center gap-1.5">
                                      {CUSTOM_BG_OPTIONS.map((bg) => (
                                        <button
                                          key={bg.id}
                                          onClick={() => { onUpdate({ selectedBg: bg.id }); nudge(); }}
                                          title={bg.label}
                                          className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-100 ${bg.cls} ${campaign.selectedBg === bg.id ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                                        />
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Cover Details (always visible) ── */}
                      <div className="mb-6 pb-5 border-b border-gray-100">
                        <p className="text-gray-700 text-[13px] font-semibold mb-3">Cover Details</p>
                        <div className="space-y-3">
                          {[
                            { label: "Campaign title",  key: "campaignName" as const, type: "text", placeholder: "e.g. Summer Sale 2026" },
                            { label: "Client name",     key: "clientName"   as const, type: "text", placeholder: "e.g. Acme Corp" },
                            { label: "Shipping date",   key: "shippingDate" as const, type: "date", placeholder: "" },
                            { label: "Review round",    key: "reviewRound"  as const, type: "text", placeholder: "e.g. Round 1" },
                          ].map(({ label, key, type, placeholder }) => (
                            <div key={label} className="flex items-center gap-4">
                              <span className="text-gray-400 text-[12px] w-28 shrink-0">{label}</span>
                              <input
                                type={type}
                                value={campaign[key]}
                                placeholder={placeholder}
                                onChange={(e) => { onUpdate({ [key]: e.target.value }); nudge(); }}
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-gray-800 text-[13px] placeholder-gray-300 outline-none focus:border-gray-300 focus:bg-white transition-colors"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Assets & Brand (unified, always visible) ── */}
                      <div className="mb-6">
                        <p className="text-gray-700 text-[13px] font-semibold mb-3">Assets & Brand</p>
                        <div className="space-y-4">

                          {/* Logo */}
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-[12px] w-28 shrink-0 pt-1">Logo</span>
                            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            {campaign.logoUrl ? (
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                                  <img src={campaign.logoUrl} alt="logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-gray-700 text-[12px] font-medium leading-tight max-w-[120px] truncate">{campaign.logoName}</span>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => logoRef.current?.click()} className="text-gray-400 hover:text-gray-700 text-[11px] cursor-pointer transition-colors">Replace</button>
                                    <span className="text-gray-200 text-[10px]">·</span>
                                    <button onClick={removeLogo} className="text-gray-400 hover:text-red-500 text-[11px] cursor-pointer transition-colors">Remove</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => logoRef.current?.click()} className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer transition-colors">
                                <Upload size={12} className="text-gray-400" />
                                <span className="text-[12px] text-gray-500">Upload logo</span>
                              </button>
                            )}
                          </div>

                          {/* Cover Background / Hero Image */}
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-[12px] w-28 shrink-0 pt-1">Cover image</span>
                            <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={handleHeroChange} />
                            {campaign.heroUrl ? (
                              <div className="flex items-center gap-2.5">
                                <div className="w-16 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                                  <img src={campaign.heroUrl} alt="hero" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-gray-700 text-[12px] font-medium leading-tight max-w-[120px] truncate">{campaign.heroName}</span>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => heroRef.current?.click()} className="text-gray-400 hover:text-gray-700 text-[11px] cursor-pointer transition-colors">Replace</button>
                                    <span className="text-gray-200 text-[10px]">·</span>
                                    <button onClick={removeHero} className="text-gray-400 hover:text-red-500 text-[11px] cursor-pointer transition-colors">Remove</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => heroRef.current?.click()} className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer transition-colors">
                                <Upload size={12} className="text-gray-400" />
                                <span className="text-[12px] text-gray-500">Upload image</span>
                              </button>
                            )}
                          </div>

                          {/* Brand Font */}
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-[12px] w-28 shrink-0 pt-1">Brand font</span>
                            <FontPicker
                              value={campaign.brandFont}
                              onChange={(f) => { onUpdate({ brandFont: f }); nudge(); }}
                            />
                          </div>

                          {/* Brand Colors */}
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-[12px] w-28 shrink-0 pt-1.5">Brand colors</span>
                            <div className="flex flex-col gap-2">
                              <input
                                ref={colorRef}
                                type="color"
                                className="sr-only"
                                onChange={(e) => addColor(e.target.value)}
                              />
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {brandColors.map((c) => (
                                  <div key={c} className="relative group">
                                    <div
                                      className="w-6 h-6 rounded-full border border-black/10 cursor-pointer shrink-0"
                                      style={{ background: c }}
                                    />
                                    <button
                                      onClick={() => removeColor(c)}
                                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                                    >
                                      <X size={7} className="text-gray-600" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => colorRef.current?.click()}
                                  className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors shrink-0"
                                  title="Add color"
                                >
                                  <Plus size={10} className="text-gray-400" />
                                </button>
                              </div>
                              {brandColors.length === 0 && (
                                <p className="text-gray-300 text-[11px]">No colors added yet</p>
                              )}
                            </div>
                          </div>

                          {/* Background (read-only, derived from template) */}
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-[12px] w-28 shrink-0">Background</span>
                            {campaign.coverTemplate !== "custom" ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-full border border-black/10 shrink-0"
                                  style={{ background: currentTemplate.bg ?? "#FFFFFF" }}
                                />
                                <span className="text-gray-500 text-[12px]">
                                  {currentTemplate.label} — from template
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[12px]">Chosen above</span>
                            )}
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
                              <p className="text-gray-400 text-[12px]">Continuing to Assets & Formats…</p>
                              <button
                                onClick={() => { setLastInteraction(null); setAutoProgress(0); }}
                                className="text-gray-300 hover:text-gray-500 text-[11px] cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="w-full h-0.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gray-900 rounded-full"
                                style={{ width: `${autoProgress * 100}%` }}
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
                        <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-widest mb-1">Step 2</p>
                        <h2 className="text-gray-900 text-xl font-semibold tracking-tight">Assets & Formats</h2>
                      </div>

                      <input ref={bannersRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleBannerInput} />
                      <input ref={folderRef} type="file" multiple className="hidden" {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)} onChange={handleFolderInput} />

                      {/* 1. Campaign Name */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                          <span className="text-gray-700 text-[13px] font-semibold">Campaign Name</span>
                        </div>
                        <input value={campaign.campaignName} onChange={(e) => onUpdate({ campaignName: e.target.value })} className="w-full bg-transparent text-gray-900 outline-none border-b border-gray-100 pb-2 focus:border-gray-400 text-[22px] font-semibold tracking-tight transition-colors duration-150" />
                      </div>

                      {/* 2. Upload banners */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                          <span className="text-gray-700 text-[13px] font-semibold">Upload Banners</span>
                          {hasUploads && <span className="ml-auto text-gray-400 text-[11px]">{totalPieces} file{totalPieces !== 1 ? "s" : ""} · {allPlatforms.length} platform{allPlatforms.length !== 1 ? "s" : ""}</span>}
                        </div>
                        <div
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl transition-all duration-150 ${uploadDragging ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"}`}
                        >
                          <div className="p-7 flex flex-col items-center justify-center text-center">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${uploadDragging ? "bg-gray-200" : "bg-gray-100"}`}>
                              {uploadDragging ? <Folder size={16} className="text-gray-500" /> : <Upload size={16} className="text-gray-400" />}
                            </div>
                            <p className="text-gray-700 text-[13px] font-medium mb-1">{uploadDragging ? "Release to detect" : hasUploads ? "Add more banners" : "Drop a folder or files here"}</p>
                            <p className="text-gray-400 text-[12px] mb-5">{hasUploads ? "Platform detected from folder structure or filename" : "Folder structure auto-detected: Brand / Campaign / Sub-campaign / Channel"}</p>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button type="button" onClick={() => folderRef.current?.click()} className="flex items-center gap-1.5 bg-gray-900 text-white rounded-xl px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-gray-700 transition-colors duration-100">
                                <Folder size={11} />Select folder
                              </button>
                              <span className="text-gray-300" style={{ fontSize: "11px" }}>or</span>
                              <button type="button" onClick={() => bannersRef.current?.click()} className="text-gray-500 hover:text-gray-700 text-[12px] cursor-pointer transition-colors duration-100" style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>browse files</button>
                            </div>
                          </div>
                        </div>
                        <AnimatePresence>
                          {detecting && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mt-3 flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin shrink-0" />
                              <span className="text-gray-600 text-[12px]">Analyzing folder structure…</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <AnimatePresence>{hasUploads && !detecting && renderDetectedSections()}</AnimatePresence>

                      {/* 3. Formats */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                          <span className="text-gray-700 text-[13px] font-semibold">Select Formats</span>
                          {hasUploads && <span className="ml-auto text-gray-400 text-[11px]">Auto-selected from upload</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formats.map((f) => (
                            <button key={f} onClick={() => toggleFormat(f)} className={`px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-100 ${campaign.selectedFormats.includes(f) ? "bg-gray-900 text-white" : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"}`}>
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4. Generate Preview */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2.5 mb-4">
                          <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                          <span className="text-gray-700 text-[13px] font-semibold">Generate Preview</span>
                        </div>
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleGeneratePreview} className="w-full bg-gray-900 text-white rounded-2xl py-4 text-[15px] font-semibold tracking-tight flex items-center justify-center gap-2.5 hover:bg-black transition-colors duration-150 cursor-pointer">
                          <Zap size={16} />
                          {hasUploads ? `Build deck — ${allPlatforms.length} channel${allPlatforms.length !== 1 ? "s" : ""}, ${totalPieces} banners` : "Generate Preview"}
                        </motion.button>
                        {!hasUploads && <p className="text-center text-gray-400 text-[11px] mt-2">Upload banners to auto-build the slide deck</p>}
                      </div>
                    </>
                  )}

                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="w-64 shrink-0">
                  <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.35 }} className="space-y-4">

                    {step === 1 ? (
                      <>
                        {/* Live Cover Preview */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
                          <p className="text-gray-400 px-4 pt-4 pb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cover Preview</p>
                          <div className="px-4 pb-4">
                            <CoverPreviewCard campaign={campaign} brandColors={brandColors} />
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                          <p className="text-gray-400 mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Summary</p>
                          <div className="space-y-2">
                            {[
                              { label: "Template",    value: COVER_TEMPLATES.find((t) => t.id === campaign.coverTemplate)?.label ?? "—" },
                              { label: "Cover page",  value: campaign.includeCover ? "Included" : "Skipped" },
                              { label: "Client",      value: campaign.clientName || "—" },
                              { label: "Ship date",   value: campaign.shippingDate || "—" },
                              { label: "Review",      value: campaign.reviewRound || "—" },
                              { label: "Font",        value: campaign.brandFont || "System default" },
                              { label: "Colors",      value: brandColors.length > 0 ? `${brandColors.length} added` : "None" },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-gray-400" style={{ fontSize: "12px" }}>{label}</span>
                                <span className="text-gray-700 text-right max-w-[120px] truncate" style={{ fontSize: "12px", fontWeight: 500 }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Auto-detected */}
                        <div className="bg-gray-900 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap size={12} className="text-gray-300" />
                            <span className="text-white font-semibold" style={{ fontSize: "12px" }}>Auto-detected</span>
                          </div>
                          <AnimatePresence mode="wait">
                            {hasUploads ? (
                              <motion.div key="has-uploads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <div className="space-y-2 mb-3">
                                  {allPlatforms.map((p) => (
                                    <div key={p} className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[p] ?? "#888" }} />
                                      <span className="text-gray-300" style={{ fontSize: "12px" }}>{p}</span>
                                      <span className="text-gray-500 ml-auto" style={{ fontSize: "11px" }}>{Object.values(localGroups).reduce((s, g) => s + (g[p]?.length ?? 0), 0)} pcs</span>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={handleGeneratePreview} className="w-full flex items-center justify-center gap-1 bg-white text-gray-900 rounded-xl py-2 cursor-pointer hover:bg-gray-100 transition-colors font-semibold" style={{ fontSize: "12px" }}>
                                  Open in Builder <ChevronRight size={12} />
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <p className="text-white font-medium mb-1" style={{ fontSize: "12px" }}>{detecting ? "Detecting…" : "Waiting for assets"}</p>
                                <p className="text-gray-400" style={{ fontSize: "11px", lineHeight: "1.5" }}>Upload a folder to auto-detect channels and sub-campaigns.</p>
                                <button disabled className="mt-3 w-full flex items-center justify-center gap-1 bg-gray-700 text-gray-500 rounded-xl py-2 cursor-not-allowed" style={{ fontSize: "12px" }}>
                                  Open in Builder <ChevronRight size={12} />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Status */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                          <p className="text-gray-400 mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</p>
                          <div className="space-y-2">
                            {[
                              { label: "Banners",      value: hasUploads ? `${totalPieces} uploaded` : "None yet" },
                              ...(subCampaignCount > 0 ? [{ label: "Sub-campaigns", value: String(subCampaignCount) }] : []),
                              { label: "Channels",     value: hasUploads ? String(allPlatforms.length) : "—" },
                              { label: "Formats",      value: String(campaign.selectedFormats.length) },
                              { label: "Cover",        value: campaign.includeCover ? "Included" : "Skipped" },
                              { label: "Owner",        value: "Fabian C." },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-gray-400" style={{ fontSize: "12px" }}>{label}</span>
                                <span className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Team */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                          <p className="text-gray-400 mb-3" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Team</p>
                          <div className="space-y-2">
                            {[
                              { initials: "AS", name: "Andrea Soto",    role: "Lead" },
                              { initials: "FC", name: "Fabian Caamaño", role: "Designer" },
                              { initials: "AT", name: "Andrés Torres",  role: "Reviewer" },
                            ].map(({ initials, name, role }) => (
                              <div key={name} className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-600" style={{ fontSize: "9px", fontWeight: 700 }}>{initials}</span>
                                </div>
                                <div>
                                  <p className="text-gray-700" style={{ fontSize: "12px", fontWeight: 500 }}>{name}</p>
                                  <p className="text-gray-400" style={{ fontSize: "10px" }}>{role}</p>
                                </div>
                              </div>
                            ))}
                            <button onClick={() => { setInviteEmail(""); setInviteRole("Designer"); setInviteOpen(true); }} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 cursor-pointer mt-1 transition-colors duration-100" style={{ fontSize: "12px" }}>
                              <Plus size={11} />Invite
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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="bg-white rounded-2xl shadow-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-gray-900 font-semibold" style={{ fontSize: "14px" }}>Invite teammate</p>
                <button onClick={() => setInviteOpen(false)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"><X size={11} className="text-gray-500" /></button>
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-gray-500 block mb-1.5" style={{ fontSize: "12px" }}>Email address</label>
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@brand.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 outline-none focus:border-gray-400 transition-colors" style={{ fontSize: "13px" }} autoFocus />
                </div>
                <div>
                  <label className="text-gray-500 block mb-1.5" style={{ fontSize: "12px" }}>Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 outline-none focus:border-gray-400 transition-colors cursor-pointer" style={{ fontSize: "13px" }}>
                    <option>Lead</option><option>Designer</option><option>Reviewer</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setInviteOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors" style={{ fontSize: "13px" }}>Cancel</button>
                <button onClick={() => { setInviteOpen(false); toast.success(`Invite sent to ${inviteEmail || "teammate"}`); }} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-black cursor-pointer transition-colors font-medium" style={{ fontSize: "13px" }}>Send invite</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
