import { useContext } from "react";
import {
  Sparkles, LayoutGrid, Folder, Users, CheckSquare, HelpCircle, ChevronLeft, Sun, Moon,
} from "lucide-react";
import { NavContext, UserMenu } from "./TopBarComponents";

const ACCENT = "#2c6bf2";

export type SidebarActive = "assistant" | "dashboard" | "campaigns" | "accounts" | "approvals" | "help" | null;

// Ícono de la marca OCX (solo el símbolo)
function OcxMark({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size * (10 / 13)} viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.7035 0V8.16602H6.35097V6.351H10.8885V1.81501H1.81496V0H12.7035Z" fill={color} />
      <path d="M6.35097 8.16602L6.35102 9.981H0V1.81501H1.81496L1.81501 8.16604L6.35097 8.16602Z" fill={color} />
    </svg>
  );
}

export function Sidebar({ active, dark, setDark }: { active?: SidebarActive; dark: boolean; setDark: (v: boolean) => void }) {
  const nav = useContext(NavContext);
  const collapsed = !!nav.collapsed;

  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f9fafb",
  };

  const items: { key: SidebarActive; icon: React.ElementType; label: string; onClick?: () => void }[] = [
    { key: "assistant", icon: Sparkles, label: "Asistente", onClick: nav.goCreateAI },
    { key: "dashboard", icon: LayoutGrid, label: "Dashboard", onClick: nav.goDashboard },
    { key: "campaigns", icon: Folder, label: "Campañas", onClick: nav.goCampaigns },
    { key: "accounts", icon: Users, label: "Marcas", onClick: nav.goAccounts },
    { key: "approvals", icon: CheckSquare, label: "Aprobaciones", onClick: nav.goApprovals },
  ];

  const navBtn = (key: SidebarActive, Icon: React.ElementType, label: string, onClick?: () => void) => {
    const isActive = key === active;
    return (
      <button
        key={String(key)}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] transition-all duration-100"
        style={{
          ...(isActive ? { background: "rgba(44,107,242,0.1)", color: ACCENT, fontWeight: 500 } : { color: T.sub }),
          justifyContent: collapsed ? "center" : "flex-start",
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = T.hover; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
      >
        <Icon size={15} className="shrink-0" />
        {!collapsed && label}
      </button>
    );
  };

  return (
    <div
      className="relative flex flex-col py-5 px-3 shrink-0"
      style={{ width: collapsed ? 64 : 224, background: T.page, borderRight: `1px solid ${T.border}`, transition: "width 0.2s ease" }}
    >
      {/* Floating collapse arrow on the edge */}
      <button
        onClick={nav.toggleSidebar}
        title={collapsed ? "Mostrar menú" : "Ocultar menú"}
        className="absolute z-20 flex items-center justify-center cursor-pointer"
        style={{
          top: 22, right: -11, width: 22, height: 22, borderRadius: "50%",
          background: T.page, border: `1px solid ${T.border}`, color: T.sub,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = ACCENT; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = T.sub; e.currentTarget.style.borderColor = T.border; }}
      >
        <ChevronLeft size={13} style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-7" style={{ justifyContent: collapsed ? "center" : "flex-start", paddingLeft: collapsed ? 0 : 8, height: 24 }}>
        {collapsed ? (
          <OcxMark size={20} color={dark ? "#f4f5f7" : "#111114"} />
        ) : (
          <>
            <img src="/ocx-logo.png" alt="OCX" style={{ height: 18, width: "auto", filter: dark ? "invert(0)" : "invert(1)" }} />
            <div className="h-5 w-px" style={{ background: dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
            <span className="text-sm font-semibold tracking-tight" style={{ color: T.text }}>View Studio</span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {items.map(({ key, icon, label, onClick }) => navBtn(key, icon, label, onClick))}
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
        {navBtn("help", HelpCircle, "Ayuda", nav.goHelp)}

        {/* Theme toggle */}
        {collapsed ? (
          <button
            onClick={() => setDark(!dark)}
            title={dark ? "Modo claro" : "Modo oscuro"}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-100"
            style={{ color: T.sub }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        ) : (
          <div className="flex gap-1 mx-1 p-1 rounded-lg mt-1" style={{ background: dark ? "#1a1a22" : "#ebebef", border: `1px solid ${T.border}` }}>
            <button
              onClick={() => setDark(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium cursor-pointer transition-all"
              style={{ background: !dark ? "#ffffff" : "transparent", color: !dark ? T.text : T.sub, boxShadow: !dark ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
            >
              <Sun size={13} /> Claro
            </button>
            <button
              onClick={() => setDark(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium cursor-pointer transition-all"
              style={{ background: dark ? "#26262e" : "transparent", color: dark ? T.text : T.sub, boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.3)" : "none" }}
            >
              <Moon size={13} /> Oscuro
            </button>
          </div>
        )}

        <UserMenu dark={dark} setDark={setDark} collapsed={collapsed} />
      </div>
    </div>
  );
}
