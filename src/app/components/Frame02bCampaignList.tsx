import { useState, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Search, Plus, ChevronRight, LayoutGrid, Folder, Users, CheckSquare,
  HelpCircle, Bell, MoreHorizontal, Image as ImageIcon, X,
  SquarePen, Share2, Copy, Settings, Archive, Trash2, ChevronDown,
} from "lucide-react";
import { NotificationPanel, UserMenu, HelpButton, CreateAINavItem } from "./TopBarComponents";

interface Props {
  onBack: () => void;
  onNewCampaign: () => void;
  onOpenCampaign: () => void;
  onViewAccounts?: () => void;
  onViewApprovals?: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}

const ACCENT = "#2c6bf2";

type Status = "active" | "review" | "draft" | "done";

const campaigns: { id: number; name: string; client: string; status: Status; previews: number; updated: string }[] = [
  { id: 1, name: "Mundial 2026", client: "Éxito", status: "active", previews: 2, updated: "hace 2h" },
  { id: 2, name: "Evento Etto Q2", client: "Éxito", status: "review", previews: 4, updated: "hace 2h" },
  { id: 3, name: "Catálogos Junio", client: "Éxito", status: "draft", previews: 8, updated: "hace 5h" },
  { id: 4, name: "Diageo HotSale", client: "Diageo", status: "done", previews: 6, updated: "ayer" },
  { id: 5, name: "Refresh de marca Q3", client: "Apex Corp", status: "active", previews: 8, updated: "hace 1 sem" },
  { id: 6, name: "Lanzamiento Verano 2026", client: "Bloom Studio", status: "review", previews: 14, updated: "ayer" },
];

const STATUS_CONFIG: Record<Status, { label: string; pill: string }> = {
  active: { label: "Activa",      pill: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  review: { label: "En revisión", pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  draft:  { label: "Borrador",    pill: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" },
  done:   { label: "Aprobada",    pill: "bg-[#2c6bf2] text-white" },
};

const FILTERS: { key: string; label: string; status?: Status }[] = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Activas", status: "active" },
  { key: "review", label: "En revisión", status: "review" },
  { key: "draft", label: "Borradores", status: "draft" },
  { key: "done", label: "Aprobadas", status: "done" },
];

// ─── Card 3-dots menu ─────────────────────────────────────────────────────────
function CardMenu({ onOpenEditor }: { onOpenEditor: () => void }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const r = btnRef.current!.getBoundingClientRect();
    setRect({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const items = [
    { icon: SquarePen, label: "Abrir editor", action: () => onOpenEditor() },
    { icon: Share2,    label: "Compartir",    action: () => toast.success("Link copiado") },
    { icon: Copy,      label: "Duplicar",     action: () => toast.success("Campaña duplicada") },
    { icon: Settings,  label: "Ajustes",      action: () => toast.info("Ajustes") },
    { icon: Archive,   label: "Archivar",     action: () => toast.info("Archivada") },
  ];

  const dropdown = open && rect ? createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed", top: rect.top, right: rect.right,
        zIndex: 99999, width: 172, borderRadius: 12, overflow: "hidden",
        background: "#fff", border: "1px solid #e5e7eb",
        boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <div style={{ padding: "6px 0" }}>
        {items.map(({ icon: Icon, label, action }) => (
          <button key={label}
            onClick={(e) => { e.stopPropagation(); setOpen(false); action(); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", fontSize: 13, color: "#374151", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <Icon size={14} color="#9ca3af" /> {label}
          </button>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #f3f4f6", padding: "6px 0" }}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(false); toast.error("Campaña eliminada"); }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <Trash2 size={14} /> Eliminar
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: open ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.8)",
          color: "#6b7280", backdropFilter: "blur(4px)",
        }}
      >
        <MoreHorizontal size={15} />
      </button>
      {dropdown}
    </>
  );
}

export function Frame02bCampaignList({ onBack, onNewCampaign, onOpenCampaign, onViewAccounts, onViewApprovals, dark, setDark }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showNotifications, setShowNotifications] = useState(false);
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = Z-A, asc = A-Z

  let list = campaigns.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.client.toLowerCase().includes(q);
    const st = FILTERS.find((f) => f.key === filter)?.status;
    const matchBrand = brandFilter === "all" || c.client === brandFilter;
    return matchSearch && (!st || c.status === st) && matchBrand;
  });

  // Sort by name
  list = list.sort((a, b) => {
    return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    surface: dark ? "#1d1d23" : "#f9fafb",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f3f4f6",
    searchBg: dark ? "#26262e" : "#f3f4f6",
  };

  const navItems = [
    { icon: LayoutGrid,  label: "Dashboard",   active: false, onClick: onBack },
    { icon: Folder,      label: "Campañas",    active: true,  onClick: undefined as undefined | (() => void) },
    { icon: Users,       label: "Marcas",      active: false, onClick: onViewAccounts },
    { icon: CheckSquare, label: "Aprobaciones", active: false, onClick: onViewApprovals },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        @keyframes menuIn {
          from { opacity: 0; transform: scale(0.97) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif", background: T.surface }}>

        <Sidebar active="campaigns" dark={dark} setDark={setDark} />
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <div className="relative flex items-center gap-4 px-8 py-4 border-b" style={{ background: T.page, borderColor: T.border }}>
            <div className="flex items-center gap-2 flex-1 max-w-sm rounded-xl px-3.5 py-2" style={{ background: T.searchBg }}>
              <Search size={13} style={{ color: T.sub }} className="shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar campañas..."
                className="flex-1 bg-transparent outline-none placeholder-gray-400 text-[13px]"
                style={{ color: T.text }}
              />
              {search && <button onClick={() => setSearch("")} style={{ color: T.sub }} className="hover:opacity-75 cursor-pointer"><X size={12} /></button>}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg cursor-pointer transition-all duration-100" style={{ color: T.text }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Bell size={15} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} T={T} dark={dark} />}
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={onNewCampaign}
                className="flex items-center gap-1.5 text-white rounded-xl px-4 py-2 cursor-pointer text-[13px] font-medium transition-all duration-100 hover:brightness-110"
                style={{ background: "#111114" }}
              >
                <Plus size={14} />
                Nueva campaña
              </motion.button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-8 py-7" style={{ background: T.surface }}>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.sub }}>Todas las campañas</p>
                  <h2 className="text-xl font-semibold tracking-tight" style={{ color: T.text }}>Campañas</h2>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Estado filter */}
                <div className="flex items-center gap-1">
                  {FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className="px-3.5 py-1.5 rounded-full cursor-pointer text-[13px] transition-all duration-100"
                      style={filter === key ? { background: ACCENT, color: "#fff", fontWeight: 500 } : { color: T.sub }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* A-Z filter */}
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer text-[13px] transition-all"
                  style={{ background: T.hover, color: T.text, fontWeight: 500 }}
                  title={sortOrder === "asc" ? "A-Z" : "Z-A"}
                >
                  {sortOrder === "asc" ? "A-Z" : "Z-A"}
                  <ChevronDown size={12} style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>

                {/* Marca filter */}
                <button
                  onClick={(e) => {
                    const menu = document.getElementById("brand-menu");
                    if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer text-[13px] transition-all"
                  style={{ background: brandFilter !== "all" ? "rgba(44,107,242,0.1)" : T.hover, color: brandFilter !== "all" ? ACCENT : T.text, fontWeight: 500 }}
                >
                  {brandFilter === "all" ? "Marca" : brandFilter}
                  <ChevronDown size={12} />
                </button>

                {/* Brand dropdown */}
                <div id="brand-menu" style={{ display: "none", position: "absolute", zIndex: 50, background: T.page, border: `1px solid ${T.border}`, borderRadius: 12, minWidth: 160, marginTop: 40 }} className="shadow-lg">
                  {["all", ...new Set(campaigns.map((c) => c.client))].map((brand) => (
                    <button
                      key={brand}
                      onClick={() => {
                        setBrandFilter(brand as any);
                        document.getElementById("brand-menu")!.style.display = "none";
                      }}
                      className="w-full px-4 py-2 text-left text-[13px] cursor-pointer transition-colors"
                      style={{ color: T.text, background: brandFilter === brand ? T.hover : "transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = brandFilter === brand ? T.hover : "transparent")}
                    >
                      {brand === "all" ? "Todas las marcas" : brand}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Create New Campaign featured card */}
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(0,0,0,0.06)", transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.99 }}
              onClick={onNewCampaign}
              className="w-full flex items-center gap-5 rounded-2xl px-6 py-5 mb-5 cursor-pointer text-left transition-all duration-200 group"
              style={{ background: T.page, border: `1px solid ${T.border}` }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(44,107,242,0.12)" }}>
                <Plus size={20} style={{ color: ACCENT }} />
              </div>
              <div>
                <p className="text-[15px] font-semibold tracking-tight mb-0.5" style={{ color: T.text }}>Crear nueva campaña</p>
                <p className="text-[13px]" style={{ color: T.sub }}>Empieza una campaña y comparte previews en minutos</p>
              </div>
              <ChevronRight size={16} style={{ color: T.sub }} className="ml-auto shrink-0 group-hover:opacity-75 transition-opacity duration-150" />
            </motion.button>

            {/* Campaign grid */}
            {list.length > 0 ? (
              <div className="grid grid-cols-2 gap-5">
                {list.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    onClick={onOpenCampaign}
                    className="group rounded-2xl cursor-pointer transition-colors duration-200"
                    style={{ background: T.page, border: `1px solid ${T.border}` }}
                  >
                    {/* Thumbnail — 3-dots badge floats outside overflow via portal */}
                    <div className="relative m-3">
                      <div className="rounded-xl h-40 overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #eef1f5 0%, #e2e6ec 100%)", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <ImageIcon size={26} style={{ color: "rgba(0,0,0,0.14)" }} />
                      </div>
                      {/* Status badge — top left, outside overflow-hidden */}
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CONFIG[c.status].pill}`}>
                          {STATUS_CONFIG[c.status].label}
                        </span>
                      </div>
                      {/* 3-dots — top right, outside overflow-hidden */}
                      <div className="absolute top-2.5 right-2.5">
                        <CardMenu onOpenEditor={onOpenCampaign} />
                      </div>
                    </div>

                    {/* Card info */}
                    <div className="px-4 pb-4">
                      <p className="truncate text-[13px] font-semibold tracking-tight mb-0.5" style={{ color: T.text }}>{c.name}</p>
                      <p className="text-xs" style={{ color: T.sub }}>{c.client} · {c.previews} previews · {c.updated}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-[13px] mb-1" style={{ color: T.sub }}>No se encontraron campañas</p>
                <p className="text-[12px]" style={{ color: T.sub, opacity: 0.7 }}>Prueba ajustando tu búsqueda o filtro</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
