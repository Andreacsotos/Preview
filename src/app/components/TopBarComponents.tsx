import { useState, useRef, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Share2, MessageSquare, UploadCloud, X, User, Settings, MoreHorizontal, LogOut, Sun, Moon, HelpCircle, Wand2 } from "lucide-react";

const ACCENT = "#2c6bf2";

// ─── Navigation context (lets shared UserMenu navigate without prop drilling) ──
type SettingsTab = "perfil" | "cuenta" | "apariencia" | "notificaciones";
export const NavContext = createContext<{
  goSettings?: (tab: SettingsTab) => void;
  goHelp?: () => void;
  onLogout?: () => void;
  openAssistant?: () => void;
  goCreateAI?: () => void;
  goDashboard?: () => void;
  goCampaigns?: () => void;
  goAccounts?: () => void;
  goApprovals?: () => void;
  collapsed?: boolean;
  toggleSidebar?: () => void;
}>({});

// ─── Shared Help button (navigates via NavContext) ─────────────────────────────
export function HelpButton({ T, active = false }: { T: any; active?: boolean }) {
  const nav = useContext(NavContext);
  return (
    <button
      onClick={() => nav.goHelp?.()}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-all duration-100"
      style={active ? { background: "rgba(44,107,242,0.1)", color: ACCENT, fontWeight: 500 } : { color: T.sub }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.hover; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <HelpCircle size={14} />
      Ayuda
    </button>
  );
}

// ─── Shared "Create with AI" nav item (navigates via NavContext) ──────────────
export function CreateAINavItem({ T, active = false }: { T: any; active?: boolean }) {
  const nav = useContext(NavContext);
  return (
    <button
      onClick={() => nav.goCreateAI?.()}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] transition-all duration-100"
      style={active ? { background: "rgba(44,107,242,0.1)", color: ACCENT, fontWeight: 500 } : { color: T.sub }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.hover; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Wand2 size={14} />
      Crear con IA
    </button>
  );
}

type NotifType = "share" | "review" | "upload";
export const NOTIF_ICON: Record<NotifType, { icon: React.ElementType; tint: string }> = {
  share:  { icon: Share2,        tint: "#2c6bf2" },
  review: { icon: MessageSquare, tint: "#FFB020" },
  upload: { icon: UploadCloud,   tint: "#00C566" },
};

export const NOTIFICATIONS: { id: number; type: NotifType; title: string; sub: string; time: string; unread: boolean }[] = [
  { id: 1, type: "share",  title: "Diageo HotSale", sub: "Compartiste el preview con el cliente", time: "hace 5m", unread: true },
  { id: 2, type: "review", title: "Catálogos Junio", sub: "Éxito solicitó una revisión", time: "hace 1h", unread: true },
  { id: 3, type: "upload", title: "Mundial 2026", sub: "Se subieron 4 assets nuevos", time: "hace 3h", unread: false },
];

// ─── Notification Panel ───────────────────────────────────────────────────────
export function NotificationPanel({ onClose, T, dark }: { onClose: () => void; T: any; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-full mt-2 z-30 rounded-2xl overflow-hidden w-80"
      style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold" style={{ color: T.text }}>Notificaciones</p>
          {unread > 0 && (
            <span className="px-1.5 h-5 min-w-5 rounded-full text-white text-[11px] font-semibold flex items-center justify-center" style={{ background: ACCENT }}>{unread}</span>
          )}
        </div>
        <button onClick={onClose} className="rounded-md p-1 cursor-pointer transition-colors" style={{ color: T.sub }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <X size={14} />
        </button>
      </div>

      {/* items */}
      <div className="py-1.5">
        {NOTIFICATIONS.map((n) => {
          const cfg = NOTIF_ICON[n.type];
          return (
            <div key={n.id} className="relative flex items-start gap-3 px-3 mx-1.5 py-2.5 rounded-xl cursor-pointer transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${cfg.tint}1f` }}>
                <cfg.icon size={15} style={{ color: cfg.tint }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug truncate" style={{ color: T.text }}>{n.title}</p>
                <p className="text-[12px] leading-snug" style={{ color: T.sub }}>{n.sub}</p>
                <p className="text-[11px] mt-0.5" style={{ color: T.sub, opacity: 0.7 }}>{n.time}</p>
              </div>
              {n.unread && <div className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: ACCENT }} />}
            </div>
          );
        })}
      </div>

      {/* footer */}
      <button
        onClick={onClose}
        className="w-full py-3 text-[12px] font-medium cursor-pointer transition-colors"
        style={{ borderTop: `1px solid ${T.border}`, color: ACCENT }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        Marcar todas como leídas
      </button>
    </motion.div>
  );
}

// ─── User Menu ───────────────────────────────────────────────────────────
export function UserMenu({ dark, setDark, onLogout, collapsed }: { dark: boolean; setDark: (v: boolean) => void; onLogout?: () => void; collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useContext(NavContext);
  const logout = onLogout ?? nav.onLogout;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const surface = dark ? "#1d1d23" : "#ffffff";
  const border = dark ? "#2c2c34" : "#f0f0f2";
  const text = dark ? "#f4f5f7" : "#111827";
  const sub = dark ? "#9aa3b2" : "#9ca3af";
  const hover = dark ? "#26262e" : "#f9fafb";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? "Andrea Camila" : undefined}
        className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg cursor-pointer transition-colors"
        style={{ background: open ? hover : "transparent", justifyContent: collapsed ? "center" : "flex-start" }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = hover; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: ACCENT }}>
          <span className="text-white text-[10px] font-semibold">AC</span>
        </div>
        {!collapsed && (
          <>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: text }}>Andrea Camila</p>
              <p className="text-[11px] truncate" style={{ color: sub }}>Diseñadora</p>
            </div>
            <MoreHorizontal size={14} style={{ color: sub }} />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-full left-0 right-0 mb-2 z-30 rounded-xl overflow-hidden"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
          >
            {/* header */}
            <div className="flex items-center gap-2.5 px-3.5 py-3" style={{ borderBottom: `1px solid ${border}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ACCENT }}>
                <span className="text-white text-[12px] font-semibold">AC</span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: text }}>Andrea Camila</p>
                <p className="text-[11px] truncate" style={{ color: sub }}>andreacamila017@gmail.com</p>
              </div>
            </div>

            {/* items */}
            <div className="py-1.5">
              {[
                { icon: User, label: "Ver perfil", action: () => { setOpen(false); nav.goSettings ? nav.goSettings("perfil") : toast.info("Perfil próximamente"); } },
                { icon: Settings, label: "Ajustes", action: () => { setOpen(false); nav.goSettings ? nav.goSettings("apariencia") : toast.info("Ajustes próximamente"); } },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] cursor-pointer transition-colors" style={{ color: text }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <Icon size={15} style={{ color: sub }} /> {label}
                </button>
              ))}
            </div>

            {/* logout */}
            <div className="py-1.5" style={{ borderTop: `1px solid ${border}` }}>
              <button onClick={() => { setOpen(false); logout?.(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] cursor-pointer transition-colors" style={{ color: "#e5484d" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "rgba(229,72,77,0.12)" : "#fef2f2")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
