import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "motion/react";
import { ArrowLeft, ExternalLink, LayoutGrid, Folder, Users, CheckSquare, HelpCircle, Bell, MoreHorizontal } from "lucide-react";
import { NotificationPanel, UserMenu, HelpButton, CreateAINavItem } from "./TopBarComponents";

interface Props {
  onBack: () => void;
  onViewDashboard?: () => void;
  onViewCampaigns?: () => void;
  onNewCampaign?: () => void;
  onViewApprovals?: () => void;
  brandName?: string;
  dark: boolean;
  setDark: (v: boolean) => void;
}

const ACCENT = "#2c6bf2";

type Status = "active" | "review" | "draft" | "done";

const campaignsByBrand: Record<string, { id: number; name: string; status: Status; previews: number; updated: string }[]> = {
  "Éxito": [
    { id: 1, name: "Mundial 2026", status: "active", previews: 2, updated: "hace 2h" },
    { id: 2, name: "Evento Etto Q2", status: "review", previews: 4, updated: "hace 2h" },
    { id: 3, name: "Catálogos Junio", status: "draft", previews: 8, updated: "hace 5h" },
  ],
  "Diageo": [
    { id: 4, name: "Diageo HotSale", status: "done", previews: 6, updated: "ayer" },
  ],
  "Homecenter": [
    { id: 6, name: "Especial Hogar 2026", status: "review", previews: 14, updated: "ayer" },
    { id: 7, name: "Feria de la Construcción", status: "active", previews: 5, updated: "hace 3h" },
  ],
  "ATT": [
    { id: 5, name: "Lanzamiento 5G+", status: "active", previews: 8, updated: "hace 1 sem" },
  ],
  "Postobón": [
    { id: 8, name: "Verano Tropical", status: "active", previews: 10, updated: "hace 4h" },
  ],
  "Novobanco": [
    { id: 9, name: "Cuenta Digital", status: "draft", previews: 3, updated: "hace 2 días" },
  ],
  "Unisys": [
    { id: 10, name: "Cloud Forward", status: "review", previews: 6, updated: "ayer" },
  ],
};

const STATUS_CONFIG: Record<Status, { label: string; pill: string }> = {
  active: { label: "Activa", pill: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  review: { label: "En revisión", pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  draft: { label: "Borrador", pill: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" },
  done: { label: "Aprobada", pill: "bg-[#2c6bf2] text-white" },
};

export function Frame02cAccountDetail({ onBack, onViewDashboard, onViewCampaigns, onNewCampaign, onViewApprovals, brandName = "Éxito", dark, setDark }: Props) {
  const [showNotifications, setShowNotifications] = useState(false);

  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    surface: dark ? "#1d1d23" : "#f9fafb",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f3f4f6",
    searchBg: dark ? "#26262e" : "#f3f4f6",
  };

  const campaigns = campaignsByBrand[brandName] || [];
  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", active: false, onClick: onViewDashboard },
    { icon: Folder, label: "Campañas", active: false, onClick: onViewCampaigns },
    { icon: Users, label: "Marcas", active: true, onClick: undefined },
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
            <button onClick={onBack} className="p-2 rounded-lg cursor-pointer transition-all" style={{ color: T.text }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1" />
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg cursor-pointer transition-all duration-100" style={{ color: T.text }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} T={T} dark={dark} />}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-7" style={{ background: T.surface }}>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: T.sub }}>Marca</p>
                  <h1 className="text-4xl font-semibold tracking-tight" style={{ color: T.text }}>{brandName}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onNewCampaign}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all hover:brightness-110 text-white"
                    style={{ background: "#111114" }}
                  >
                    + Nueva campaña
                  </button>
                  <a
                    href="https://cor.ocx.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all hover:brightness-110"
                    style={{ background: ACCENT, color: "#fff" }}
                  >
                    <ExternalLink size={14} />
                    Ir a tarea COR
                  </a>
                </div>
              </div>
            </div>

            {/* Campaigns */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: T.sub }}>Campañas de {brandName}</p>

              {campaigns.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {campaigns.map((camp, i) => (
                    <motion.div
                      key={camp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35 }}
                      className="rounded-2xl cursor-pointer transition-colors duration-200"
                      style={{ background: T.page, border: `1px solid ${T.border}` }}
                    >
                      <div className="p-5">
                        <p className="text-[13px] font-semibold tracking-tight mb-2" style={{ color: T.text }}>{camp.name}</p>
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CONFIG[camp.status].pill}`}>
                            {STATUS_CONFIG[camp.status].label}
                          </span>
                          <p className="text-[11px]" style={{ color: T.sub }}>{camp.previews} previews · {camp.updated}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-[13px]" style={{ color: T.sub }}>No hay campañas para esta marca</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
