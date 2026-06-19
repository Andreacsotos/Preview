import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "motion/react";
import { LayoutGrid, Folder, Users, CheckSquare, HelpCircle, Bell, MoreHorizontal, Check, Clock } from "lucide-react";
import { NotificationPanel, UserMenu, HelpButton, CreateAINavItem } from "./TopBarComponents";

interface Props {
  onBack: () => void;
  onViewCampaigns?: () => void;
  onViewAccounts?: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}

const ACCENT = "#2c6bf2";

type ApprovalStatus = "pending" | "approved";

interface Approval {
  id: number;
  campaign: string;
  brand: string;
  approver: string;
  status: ApprovalStatus;
  dueDate?: string;
  date: string;
}

const approvals: Approval[] = [
  { id: 1, campaign: "Mundial 2026", brand: "Éxito", approver: "Gerente Marketing", status: "pending", dueDate: "2 días", date: "hace 2h" },
  { id: 2, campaign: "Evento Q2", brand: "Éxito", approver: "Director Creativo", status: "pending", dueDate: "1 día", date: "hace 5h" },
  { id: 3, campaign: "Catálogos Junio", brand: "Éxito", approver: "Gerente Producto", status: "approved", date: "hace 4h" },
  { id: 5, campaign: "Refresh Q3", brand: "Apex Corp", approver: "CEO", status: "pending", dueDate: "3 días", date: "hace 1h" },
  { id: 6, campaign: "Verano 2026", brand: "Bloom Studio", approver: "Design Lead", status: "approved", date: "hace 6h" },
];

export function Frame02dAprobaciones({ onBack, onViewCampaigns, onViewAccounts, dark, setDark }: Props) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    surface: dark ? "#1d1d23" : "#f9fafb",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f3f4f6",
  };

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", active: false, onClick: onBack },
    { icon: Folder, label: "Campañas", active: false, onClick: onViewCampaigns },
    { icon: Users, label: "Marcas", active: false, onClick: onViewAccounts },
    { icon: CheckSquare, label: "Aprobaciones", active: true, onClick: undefined },
  ];

  const filtered = approvals.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const pending = approvals.filter((a) => a.status === "pending").length;
  const approved = approvals.filter((a) => a.status === "approved").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
      `}</style>
      <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif", background: T.surface }}>

        <Sidebar active="approvals" dark={dark} setDark={setDark} />
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* TOP BAR */}
          <div className="flex items-center justify-end px-8 py-4 border-b" style={{ background: T.page, borderColor: T.border }}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg cursor-pointer" style={{ color: T.text }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} T={T} dark={dark} />}
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-8 py-8" style={{ background: T.surface }}>

            {/* Header + filters */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.sub }}>Estado de aprobaciones</p>
                <h1 className="text-2xl font-semibold" style={{ color: T.text }}>Aprobaciones</h1>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { key: "all", label: "Todas", count: approvals.length },
                  { key: "pending", label: "Pendientes", count: pending },
                  { key: "approved", label: "Aprobadas", count: approved },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className="px-3.5 py-1.5 rounded-full text-[13px] cursor-pointer transition-all font-medium"
                    style={
                      filter === key
                        ? { background: ACCENT, color: "#fff" }
                        : { background: "transparent", color: T.sub }
                    }
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((app, i) => {
                const isPending = app.status === "pending";
                const bgColor = isPending ? "rgba(255,176,32,0.08)" : "rgba(0,197,102,0.08)";
                const borderColor = isPending ? "rgba(255,176,32,0.2)" : "rgba(0,197,102,0.2)";
                const statusColor = isPending ? "#FFB020" : "#00C566";
                const StatusIcon = isPending ? Clock : Check;

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35 }}
                    className="rounded-2xl p-6 cursor-pointer transition-all"
                    style={{ background: bgColor, border: `1px solid ${borderColor}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)", e.currentTarget.style.boxShadow = `0 12px 32px ${statusColor}20`)}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold" style={{ color: T.text }}>{app.campaign}</p>
                        <p className="text-[12px] mt-1" style={{ color: T.sub }}>{app.brand}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: statusColor }}>
                        <StatusIcon size={14} />
                      </div>
                    </div>

                    {/* Approver */}
                    <div className="mb-4">
                      <p className="text-[11px]" style={{ color: T.sub }}>Aprobador</p>
                      <p className="text-[13px] font-medium mt-0.5" style={{ color: T.text }}>{app.approver}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: `${statusColor}30` }}>
                      <div>
                        {isPending ? (
                          <p className="text-[12px] font-medium" style={{ color: statusColor }}>Vence en {app.dueDate}</p>
                        ) : (
                          <p className="text-[12px]" style={{ color: T.sub }}>Aprobado hace {app.date.replace("hace ", "")}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-[14px]" style={{ color: T.sub }}>No hay aprobaciones en este estado</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
