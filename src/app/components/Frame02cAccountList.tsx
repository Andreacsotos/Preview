import { useState, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Search, Plus, LayoutGrid, Folder, Users, CheckSquare,
  HelpCircle, Bell, MoreHorizontal, Edit, Archive, Trash2, Mail, X,
} from "lucide-react";
import { NotificationPanel, UserMenu, HelpButton, CreateAINavItem } from "./TopBarComponents";

interface Props {
  onBack: () => void;
  onNewBrand: () => void;
  onOpenBrand: (brandName: string) => void;
  onViewCampaigns?: () => void;
  onViewApprovals?: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}

const ACCENT = "#2c6bf2";

type Status = "active" | "inactive" | "pending";

type Brand = { id: number; name: string; logo: string; color: string; industry: string; status: Status; campaigns: number; joined: string };
const INITIAL_BRANDS: Brand[] = [
  { id: 1, name: "Éxito", logo: "É", color: "#FFD100", industry: "Retail", status: "active", campaigns: 12, joined: "ene 2024" },
  { id: 2, name: "Homecenter", logo: "H", color: "#0033A0", industry: "Hogar y construcción", status: "active", campaigns: 9, joined: "mar 2024" },
  { id: 3, name: "Diageo", logo: "D", color: "#B91C1C", industry: "Bebidas", status: "active", campaigns: 8, joined: "feb 2024" },
  { id: 4, name: "ATT", logo: "A", color: "#00A8E0", industry: "Telecomunicaciones", status: "active", campaigns: 15, joined: "dic 2023" },
  { id: 5, name: "Postobón", logo: "P", color: "#E4002B", industry: "Bebidas", status: "active", campaigns: 11, joined: "ago 2023" },
  { id: 6, name: "Novobanco", logo: "N", color: "#00937B", industry: "Banca", status: "pending", campaigns: 4, joined: "may 2024" },
  { id: 7, name: "Unisys", logo: "U", color: "#1B1B6F", industry: "Tech", status: "active", campaigns: 6, joined: "jul 2023" },
];

const STATUS_CONFIG: Record<Status, { label: string; pill: string }> = {
  active:   { label: "Activa",   pill: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  pending:  { label: "Pendiente", pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  inactive: { label: "Inactiva",  pill: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" },
};

// ─── Brand menu ─────────────────────────────────────────────────────────
function BrandMenu({ onOpenBrand }: { onOpenBrand: () => void }) {
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
    { icon: Edit,    label: "Editar", action: () => onOpenBrand() },
    { icon: Mail,    label: "Contactar", action: () => toast.success("Email abierto") },
    { icon: Archive, label: "Desactivar", action: () => toast.info("Marca desactivada") },
  ];

  const dropdown = open && rect ? createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed", top: rect.top, right: rect.right,
        zIndex: 99999, width: 160, borderRadius: 12, overflow: "hidden",
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
          onClick={(e) => { e.stopPropagation(); setOpen(false); toast.error("Marca eliminada"); }}
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
          background: open ? "rgba(0,0,0,0.08)" : "transparent",
          color: "#9ca3af",
        }}
      >
        <MoreHorizontal size={14} />
      </button>
      {dropdown}
    </>
  );
}

export function Frame02cAccountList({ onBack, onNewBrand, onOpenBrand, onViewCampaigns, onViewApprovals, dark, setDark }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [showNotifications, setShowNotifications] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [newBrandOpen, setNewBrandOpen] = useState(false);
  const [nbName, setNbName] = useState("");
  const [nbIndustry, setNbIndustry] = useState("Retail");

  const BRAND_COLORS = ["#FF6B35", "#1E40AF", "#EC4899", "#8B5CF6", "#DC2626", "#00C566", "#FFB020", "#06B6D4"];
  const createBrand = () => {
    const name = nbName.trim();
    if (!name) return;
    const color = BRAND_COLORS[brands.length % BRAND_COLORS.length];
    setBrands((b) => [{ id: Date.now(), name, logo: name[0].toUpperCase(), color, industry: nbIndustry, status: "active", campaigns: 0, joined: "ahora" }, ...b]);
    toast.success(`Marca "${name}" creada`);
    setNbName(""); setNbIndustry("Retail"); setNewBrandOpen(false);
  };

  const list = brands.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.industry.toLowerCase().includes(q);
    return matchSearch && (statusFilter === "all" || b.status === statusFilter);
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
    { icon: Folder,      label: "Campañas",    active: false, onClick: onViewCampaigns },
    { icon: Users,       label: "Marcas",      active: true,  onClick: undefined as undefined | (() => void) },
    { icon: CheckSquare, label: "Aprobaciones", active: false, onClick: onViewApprovals },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
      `}</style>
      <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif", background: T.surface }}>

        <Sidebar active="accounts" dark={dark} setDark={setDark} />
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <div className="relative flex items-center gap-4 px-8 py-4 border-b" style={{ background: T.page, borderColor: T.border }}>
            <div className="flex items-center gap-2 flex-1 max-w-sm rounded-xl px-3.5 py-2" style={{ background: T.searchBg }}>
              <Search size={13} style={{ color: T.sub }} className="shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar marcas..."
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
              <button
                onClick={() => setNewBrandOpen(true)}
                className="flex items-center gap-1.5 text-white rounded-xl px-4 py-2 cursor-pointer text-[13px] font-medium transition-all duration-100 hover:brightness-110"
                style={{ background: "#111114" }}
              >
                <Plus size={14} />
                Nueva marca
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-8 py-7" style={{ background: T.surface }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.sub }}>Todas las marcas</p>
                <h2 className="text-xl font-semibold tracking-tight" style={{ color: T.text }}>Marcas</h2>
              </div>
              <div className="flex items-center gap-1">
                {(["all", "active", "pending", "inactive"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className="px-3.5 py-1.5 rounded-full cursor-pointer text-[13px] transition-all duration-100"
                    style={statusFilter === status ? { background: ACCENT, color: "#fff", fontWeight: 500 } : { color: T.sub }}
                  >
                    {status === "all" ? "Todas" : status === "active" ? "Activas" : status === "pending" ? "Pendientes" : "Inactivas"}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands grid */}
            {list.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((brand, i) => (
                  <motion.div
                    key={brand.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    onClick={() => onOpenBrand(brand.name)}
                    className="group rounded-2xl cursor-pointer transition-colors duration-200 overflow-hidden"
                    style={{ background: T.page, border: `1px solid ${T.border}` }}
                  >
                    {/* Logo section — just color, no text */}
                    <div className="relative h-24 rounded-t-2xl" style={{ background: `linear-gradient(135deg, ${brand.color}88 0%, ${brand.color}44 100%)` }}>
                      {/* 3-dots menu */}
                      <div className="absolute top-3 right-3">
                        <BrandMenu onOpenBrand={onOpenBrand} />
                      </div>
                    </div>

                    {/* Info section */}
                    <div className="p-4">
                      <p className="truncate text-[14px] font-semibold tracking-tight mb-1" style={{ color: T.text }}>{brand.name}</p>
                      <p className="text-xs mb-3" style={{ color: T.sub }}>{brand.industry} · {brand.campaigns} campañas</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CONFIG[brand.status].pill}`}>
                          {STATUS_CONFIG[brand.status].label}
                        </span>
                        <p className="text-[11px]" style={{ color: T.sub }}>{brand.joined}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-[13px] mb-1" style={{ color: T.sub }}>No se encontraron marcas</p>
                <p className="text-[12px]" style={{ color: T.sub, opacity: 0.7 }}>Prueba ajustando tu búsqueda o filtro</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Nueva marca modal */}
      <AnimatePresence>
        {newBrandOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setNewBrandOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md rounded-2xl p-6"
              style={{ background: T.page, border: `1px solid ${T.border}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: T.sub }}>Marca</p>
                  <h2 className="text-[17px] font-semibold" style={{ color: T.text }}>Nueva marca</h2>
                </div>
                <button onClick={() => setNewBrandOpen(false)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: T.sub }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[12px] mb-1.5" style={{ color: T.sub }}>Nombre de la marca</label>
                  <input value={nbName} autoFocus onChange={(e) => setNbName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createBrand(); }}
                    placeholder="ej. Nike" className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none" style={{ background: T.searchBg, border: `1px solid ${T.border}`, color: T.text }} />
                </div>
                <div>
                  <label className="block text-[12px] mb-1.5" style={{ color: T.sub }}>Industria</label>
                  <select value={nbIndustry} onChange={(e) => setNbIndustry(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none cursor-pointer" style={{ background: T.searchBg, border: `1px solid ${T.border}`, color: T.text }}>
                    {["Retail", "Bebidas", "Tech", "Deportes", "Moda", "Otro"].map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <button onClick={createBrand} disabled={!nbName.trim()}
                  className="w-full py-2.5 rounded-xl text-white text-[13px] font-medium cursor-pointer hover:brightness-110 transition-all disabled:opacity-40"
                  style={{ background: ACCENT }}>
                  Crear marca
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
