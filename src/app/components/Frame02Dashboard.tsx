import { useState, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Search, Plus, ChevronRight, LayoutGrid, Folder, Users, CheckSquare,
  Settings, HelpCircle, Bell,
  MoreHorizontal, X, CheckCircle2, Clock, FileText, CheckCheck,
  User, LogOut, Sun, Moon, Image as ImageIcon,
  Share2, MessageSquare, UploadCloud, TrendingUp, Calendar,
} from "lucide-react";
import { NotificationPanel, UserMenu, HelpButton, CreateAINavItem } from "./TopBarComponents";

interface Props {
  onNewCampaign: (name: string) => void;
  onNewCampaignChoice?: () => void;
  onOpenCampaign: () => void;
  onViewCampaigns: () => void;
  onViewAccounts: () => void;
  onViewApprovals?: () => void;
  onLogout?: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}

type Status = "active" | "review" | "draft" | "done";

interface Campaign {
  id: number;
  name: string;
  client: string;
  status: Status;
  previews: number;
  approved: number;
  updated: string;
}

const ACCENT = "#2c6bf2";

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Mundial 2026",     client: "Éxito",  status: "active", previews: 2, approved: 1, updated: "hace 2h" },
  { id: 2, name: "Evento Etto Q2",   client: "Éxito",  status: "review", previews: 4, approved: 2, updated: "hace 2h" },
  { id: 3, name: "Catálogos Junio",  client: "Éxito",  status: "draft",  previews: 8, approved: 0, updated: "hace 5h" },
  { id: 4, name: "Diageo HotSale",   client: "Diageo", status: "done",   previews: 6, approved: 6, updated: "ayer" },
];

type NotifType = "share" | "review" | "upload";
const NOTIF_ICON: Record<NotifType, { icon: React.ElementType; tint: string }> = {
  share:  { icon: Share2,        tint: "#2c6bf2" },
  review: { icon: MessageSquare, tint: "#FFB020" },
  upload: { icon: UploadCloud,   tint: "#00C566" },
};
const NOTIFICATIONS: { id: number; type: NotifType; title: string; sub: string; time: string; unread: boolean }[] = [
  { id: 1, type: "share",  title: "Diageo HotSale", sub: "Compartiste el preview con el cliente", time: "hace 5m", unread: true },
  { id: 2, type: "review", title: "Catálogos Junio", sub: "Éxito solicitó una revisión", time: "hace 1h", unread: true },
  { id: 3, type: "upload", title: "Mundial 2026", sub: "Se subieron 4 assets nuevos", time: "hace 3h", unread: false },
];

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; pill: string }> = {
  active: { label: "Activa",     icon: CheckCircle2, pill: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  review: { label: "En revisión", icon: Clock,       pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  draft:  { label: "Borrador",   icon: FileText,     pill: "bg-white/80 text-gray-500 ring-1 ring-gray-200" },
  done:   { label: "Aprobada",   icon: CheckCheck,   pill: "bg-[#2c6bf2] text-white" },
};

// ─── New Campaign Modal ───────────────────────────────────────────────────────
function NewCampaignModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setTitle(""); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  function submit() {
    const name = title.trim();
    if (!name) { inputRef.current?.focus(); return; }
    onCreate(name);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto bg-white rounded-2xl shadow-2xl shadow-black/[0.12] border border-gray-100 w-[420px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-0">
                <div>
                  <h2 className="text-gray-900 text-[15px] font-semibold tracking-tight">Nueva campaña</h2>
                  <p className="text-gray-400 text-[13px] mt-0.5">Dale un nombre a tu campaña para empezar.</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer rounded-lg p-1 hover:bg-gray-50"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 pt-5 pb-6">
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                  Nombre de la campaña
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
                  placeholder="ej. Venta de Verano 2026"
                  className="w-full h-[46px] rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-[#2c6bf2] focus:bg-white transition-colors duration-150"
                />
                <div className="flex items-center justify-end gap-2.5 mt-5">
                  <button
                    onClick={onClose}
                    className="h-[38px] px-4 rounded-xl border border-gray-200 text-gray-600 text-[13px] font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submit}
                    disabled={!title.trim()}
                    className="h-[38px] px-5 rounded-xl text-white text-[13px] font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                    style={{ background: ACCENT }}
                  >
                    Crear campaña
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Frame02Dashboard({ onNewCampaign, onNewCampaignChoice, onOpenCampaign, onViewCampaigns, onViewAccounts, onViewApprovals, onLogout, dark, setDark }: Props) {
  const [campaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  function handleCreate(name: string) {
    onNewCampaign(name);
  }

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  // overview data
  const needsAttention = campaigns.filter((c) => c.status === "review" || c.status === "draft");
  const KPIS = [
    { label: "Campañas activas", value: campaigns.filter((c) => c.status === "active").length, icon: CheckCircle2, tint: "#2c6bf2", delta: "+2", up: true },
    { label: "Pendientes de aprobación", value: campaigns.filter((c) => c.status === "review").length, icon: Clock, tint: "#FFB020", delta: "+1", up: true },
    { label: "Aprobadas esta semana", value: campaigns.filter((c) => c.status === "done").length, icon: CheckCheck, tint: "#00C566", delta: "+3", up: true },
    { label: "Previews compartidos", value: campaigns.reduce((s, c) => s + c.previews, 0), icon: ImageIcon, tint: "#6816B0", delta: "+12", up: true },
  ];
  const ACTIVITY = [
    { who: "Diageo", text: "aprobó 4 previews de Diageo HotSale", time: "hace 5m", dot: "#00C566" },
    { who: "Éxito", text: "dejó un comentario en Catálogos Junio", time: "hace 1h", dot: "#FFB020" },
    { who: "Tú", text: "compartiste el link de Evento Etto Q2", time: "hace 2h", dot: "#2c6bf2" },
    { who: "Éxito", text: "solicitó cambios en Mundial 2026", time: "hace 3h", dot: "#FFB020" },
  ];

  const T = dark
    ? { page: "#0b0b0f", surface: "#141418", border: "#26262e", text: "#f4f5f7", sub: "#9aa3b2", hover: "#1d1d23", searchBg: "#1d1d23" }
    : { page: "#F7F7F8", surface: "#ffffff", border: "#f0f0f2", text: "#111827", sub: "#9ca3af", hover: "#f9fafb", searchBg: "#f9fafb" };

  const navItems = [
    { icon: LayoutGrid,  label: "Dashboard",   active: true,  onClick: undefined as undefined | (() => void) },
    { icon: Folder,      label: "Campañas",    active: false, onClick: onViewCampaigns },
    { icon: Users,       label: "Marcas",      active: false, onClick: onViewAccounts },
    { icon: CheckSquare, label: "Aprobaciones", active: false, onClick: onViewApprovals },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');`}</style>
      <NewCampaignModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />

      <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif", background: T.page, transition: "background 0.3s ease" }}>

        <Sidebar active="dashboard" dark={dark} setDark={setDark} />
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center gap-4 px-8 py-4" style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, transition: "background 0.3s ease" }}>
            <div className="flex items-center gap-2 flex-1 max-w-sm rounded-xl px-3.5 py-2 transition-all" style={{ background: T.searchBg }}>
              <Search size={13} className="shrink-0" style={{ color: T.sub }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar campañas, previews..."
                className="flex-1 bg-transparent outline-none text-[13px]"
                style={{ color: T.text }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-300 hover:text-gray-500 cursor-pointer">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative p-2 rounded-lg cursor-pointer transition-all duration-100"
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Bell size={15} style={{ color: T.sub }} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <NotificationPanel onClose={() => setShowNotifications(false)} T={T} dark={dark} />
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => (onNewCampaignChoice ? onNewCampaignChoice() : setShowModal(true))}
                className="flex items-center gap-1.5 text-white rounded-xl px-4 py-2 cursor-pointer text-[13px] font-medium transition-all duration-100 hover:brightness-110"
                style={{ background: dark ? "#ffffff" : "#111114", color: dark ? "#111114" : "#fff" }}
              >
                <Plus size={14} />
                Nueva campaña
              </motion.button>
            </div>
          </div>

          {/* Scrollable content — OVERVIEW (bento) */}
          <div className="flex-1 overflow-y-auto px-8 py-7">

            {/* Greeting + date */}
            <div className="flex items-end justify-between mb-7">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight" style={{ color: T.text }}>Hola, Andrea 👋</h1>
                <p className="text-[14px] mt-1" style={{ color: T.sub }}>Esto es lo que está pasando con tus campañas hoy.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px]" style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.sub }}>
                <Calendar size={14} /> 7 de junio, 2026
              </div>
            </div>

            {/* KPIs with trend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {KPIS.map((k, i) => (
                <motion.div key={k.label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.tint}1f` }}>
                      <k.icon size={16} style={{ color: k.tint }} />
                    </div>
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: "#009d52", background: "rgba(0,197,102,0.12)" }}>
                      <TrendingUp size={11} /> {k.delta}
                    </span>
                  </div>
                  <p className="text-[28px] font-semibold leading-none mb-1.5" style={{ color: T.text }}>{k.value}</p>
                  <p className="text-[12px]" style={{ color: T.sub }}>{k.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Main bento: attention (2/3) + activity timeline (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Requiere tu atención */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: T.text }}>Requiere tu atención</h2>
                    <span className="px-1.5 h-5 min-w-5 rounded-full text-white text-[11px] font-semibold flex items-center justify-center" style={{ background: ACCENT }}>{needsAttention.length}</span>
                  </div>
                  <button onClick={onViewCampaigns} className="flex items-center gap-1 text-[12px] font-medium cursor-pointer" style={{ color: ACCENT }}>Ver todas <ChevronRight size={12} /></button>
                </div>

                {needsAttention.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {needsAttention.map((c) => {
                      const meta = c.status === "review"
                        ? { hint: "El cliente solicitó cambios", cta: "Revisar", icon: MessageSquare, tint: "#FFB020" }
                        : { hint: "Borrador sin compartir", cta: "Continuar", icon: FileText, tint: "#6b7280" };
                      return (
                        <motion.div key={c.id} onClick={onOpenCampaign}
                          whileHover={{ y: -2 }}
                          className="group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-shadow hover:shadow-md"
                          style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                          {/* accent icon */}
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.tint}1f` }}>
                            <meta.icon size={17} style={{ color: meta.tint }} />
                          </div>
                          {/* info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-semibold truncate" style={{ color: T.text }}>{c.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CONFIG[c.status].pill}`}>{STATUS_CONFIG[c.status].label}</span>
                            </div>
                            <p className="text-[12.5px] mt-0.5" style={{ color: T.sub }}>{meta.hint} · {c.client}</p>
                          </div>
                          {/* CTA — subtle arrow */}
                          <button onClick={(e) => { e.stopPropagation(); onOpenCampaign(); }}
                            aria-label={meta.cta}
                            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                            style={{ background: T.hover, color: T.sub }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.sub; }}>
                            <ChevronRight size={16} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl px-4 py-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[13px]" style={{ color: T.sub }}>Todo al día ✨ Nada pendiente.</p>
                  </div>
                )}
              </div>

              {/* Actividad reciente — timeline */}
              <div className="lg:col-span-1 rounded-2xl flex flex-col" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: T.text }}>Actividad reciente</h2>
                </div>
                <div className="p-5 flex-1">
                  <div className="relative">
                    {/* vertical connector */}
                    <div className="absolute left-[5px] top-1 bottom-1 w-px" style={{ background: T.border }} />
                    {ACTIVITY.map((a, i) => (
                      <div key={i} className={`relative pl-6 ${i < ACTIVITY.length - 1 ? "pb-5" : ""}`}>
                        <div className="absolute left-0 top-0.5 w-[11px] h-[11px] rounded-full" style={{ background: a.dot, border: `2px solid ${T.surface}`, boxShadow: `0 0 0 1px ${a.dot}55` }} />
                        <p className="text-[13px] leading-snug" style={{ color: T.text }}><span className="font-semibold">{a.who}</span> <span style={{ color: T.sub }}>{a.text}</span></p>
                        <p className="text-[11px] mt-1" style={{ color: T.sub, opacity: 0.7 }}>{a.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}