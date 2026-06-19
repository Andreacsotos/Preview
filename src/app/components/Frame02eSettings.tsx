import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "motion/react";
import {
  LayoutGrid, Folder, Users, CheckSquare, HelpCircle, Bell, ArrowLeft,
  User, Building2, Palette, BellRing, Sun, Moon, Check,
  Plug, Globe, Shield, Monitor, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { UserMenu, HelpButton, CreateAINavItem } from "./TopBarComponents";

interface Props {
  onBack: () => void;
  initialTab?: TabKey;
  dark: boolean;
  setDark: (v: boolean) => void;
}

type TabKey = "perfil" | "cuenta" | "apariencia" | "notificaciones" | "integraciones" | "idioma" | "seguridad";

const ACCENT = "#2c6bf2";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "cuenta", label: "Cuenta", icon: Building2 },
  { key: "apariencia", label: "Apariencia", icon: Palette },
  { key: "notificaciones", label: "Notificaciones", icon: BellRing },
  { key: "integraciones", label: "Integraciones", icon: Plug },
  { key: "idioma", label: "Idioma y región", icon: Globe },
  { key: "seguridad", label: "Privacidad y seguridad", icon: Shield },
];

const INTEGRATIONS = [
  { id: "cor", name: "COR", desc: "Sincroniza tareas y tiempos", color: "#2c6bf2", connected: true },
  { id: "slack", name: "Slack", desc: "Recibe notificaciones en tus canales", color: "#4A154B", connected: true },
  { id: "drive", name: "Google Drive", desc: "Importa assets directamente", color: "#1FA463", connected: false },
  { id: "figma", name: "Figma", desc: "Trae diseños desde tus archivos", color: "#F24E1E", connected: false },
];

export function Frame02eSettings({ onBack, initialTab = "perfil", dark, setDark }: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [name, setName] = useState("Andrea Camila");
  const [role, setRole] = useState("Diseñadora");
  const [email] = useState("andreacamila017@gmail.com");
  const [notifs, setNotifs] = useState({ comments: true, approvals: true, uploads: false, weekly: true });
  const [connections, setConnections] = useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.connected]))
  );
  const [language, setLanguage] = useState("es");
  const [timezone, setTimezone] = useState("America/Bogotá (GMT-5)");
  const [dateFormat, setDateFormat] = useState("DD/MM/AAAA");
  const [twoFA, setTwoFA] = useState(false);

  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    surface: dark ? "#1d1d23" : "#f9fafb",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f3f4f6",
    inputBg: dark ? "#26262e" : "#f9fafb",
  };

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", active: false, onClick: onBack },
    { icon: Folder, label: "Campañas", active: false, onClick: undefined },
    { icon: Users, label: "Marcas", active: false, onClick: undefined },
    { icon: CheckSquare, label: "Aprobaciones", active: false, onClick: undefined },
  ];

  const Field = ({ label, value, onChange, disabled }: { label: string; value: string; onChange?: (v: string) => void; disabled?: boolean }) => (
    <div>
      <label className="block text-[12px] mb-1.5" style={{ color: T.sub }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-colors"
        style={{ background: T.inputBg, border: `1px solid ${T.border}`, color: disabled ? T.sub : T.text, cursor: disabled ? "not-allowed" : "text" }}
      />
    </div>
  );

  const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
    <div>
      <label className="block text-[12px] mb-1.5" style={{ color: T.sub }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none cursor-pointer transition-colors"
        style={{ background: T.inputBg, border: `1px solid ${T.border}`, color: T.text }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="relative rounded-full transition-colors duration-200 cursor-pointer shrink-0" style={{ width: 44, height: 24, background: on ? ACCENT : (dark ? "#3a3a44" : "#d1d5db") }}>
      <span className="absolute rounded-full bg-white transition-all duration-200" style={{ width: 18, height: 18, top: 3, left: on ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');`}</style>
      <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif", background: T.surface }}>

        <Sidebar dark={dark} setDark={setDark} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TOP BAR */}
          <div className="flex items-center gap-3 px-8 py-4 border-b" style={{ background: T.page, borderColor: T.border }}>
            <button onClick={onBack} className="p-2 rounded-lg cursor-pointer transition-all" style={{ color: T.text }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1" />
            <button className="relative p-2 rounded-lg cursor-pointer" style={{ color: T.text }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-8 py-8" style={{ background: T.surface }}>
            <div className="max-w-3xl mx-auto">
              <div className="mb-7">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.sub }}>Configuración</p>
                <h1 className="text-2xl font-semibold" style={{ color: T.text }}>Ajustes</h1>
              </div>

              <div className="flex gap-8">
                {/* TABS */}
                <div className="w-44 shrink-0 space-y-0.5">
                  {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-left text-[13px] transition-all"
                      style={tab === key ? { background: "rgba(44,107,242,0.1)", color: ACCENT, fontWeight: 500 } : { color: T.sub }}
                      onMouseEnter={(e) => { if (tab !== key) e.currentTarget.style.background = T.hover; }}
                      onMouseLeave={(e) => { if (tab !== key) e.currentTarget.style.background = "transparent"; }}>
                      <Icon size={14} />{label}
                    </button>
                  ))}
                </div>

                {/* TAB CONTENT */}
                <div className="flex-1">
                  <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

                    {tab === "perfil" && (
                      <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
                          <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: ACCENT }}>
                            <span className="text-white text-xl font-semibold">AC</span>
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold" style={{ color: T.text }}>{name}</p>
                            <p className="text-[13px]" style={{ color: T.sub }}>{role}</p>
                            <button className="text-[12px] mt-1 cursor-pointer" style={{ color: ACCENT }}>Cambiar foto</button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Field label="Nombre completo" value={name} onChange={setName} />
                          <Field label="Rol" value={role} onChange={setRole} />
                          <button className="px-4 py-2 rounded-xl text-white text-[13px] font-medium cursor-pointer hover:brightness-110 transition-all" style={{ background: ACCENT }}>Guardar cambios</button>
                        </div>
                      </div>
                    )}

                    {tab === "cuenta" && (
                      <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                        <div className="space-y-4">
                          <Field label="Correo electrónico" value={email} disabled />
                          <Field label="Organización" value="OCX" disabled />
                          <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                            <p className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Contraseña</p>
                            <p className="text-[12px] mb-3" style={{ color: T.sub }}>Cambia tu contraseña periódicamente para mayor seguridad</p>
                            <button className="px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all" style={{ background: T.hover, color: T.text }}>Cambiar contraseña</button>
                          </div>
                          <div className="pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                            <p className="text-[13px] font-semibold mb-1" style={{ color: "#ef4444" }}>Zona de peligro</p>
                            <p className="text-[12px] mb-3" style={{ color: T.sub }}>Eliminar tu cuenta es permanente e irreversible</p>
                            <button className="px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Eliminar cuenta</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {tab === "apariencia" && (
                      <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                        <p className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Tema</p>
                        <p className="text-[12px] mb-4" style={{ color: T.sub }}>Elige cómo se ve View Studio para ti</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { mode: false, label: "Claro", icon: Sun, bg: "#ffffff", barBg: "#f0f0f2" },
                            { mode: true, label: "Oscuro", icon: Moon, bg: "#1d1d23", barBg: "#2c2c34" },
                          ].map(({ mode, label, icon: Icon, bg, barBg }) => (
                            <button key={label} onClick={() => setDark(mode)}
                              className="rounded-xl p-3 cursor-pointer transition-all text-left"
                              style={{ border: `2px solid ${dark === mode ? ACCENT : T.border}` }}>
                              <div className="rounded-lg h-20 mb-3 p-2 flex flex-col gap-1.5" style={{ background: bg, border: `1px solid ${barBg}` }}>
                                <div className="h-2 w-12 rounded" style={{ background: barBg }} />
                                <div className="h-2 w-8 rounded" style={{ background: barBg }} />
                                <div className="h-2 w-10 rounded mt-auto" style={{ background: ACCENT, opacity: 0.6 }} />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Icon size={14} style={{ color: T.text }} />
                                  <span className="text-[13px] font-medium" style={{ color: T.text }}>{label}</span>
                                </div>
                                {dark === mode && <Check size={14} style={{ color: ACCENT }} />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {tab === "notificaciones" && (
                      <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                        <div className="space-y-1">
                          {[
                            { key: "comments" as const, label: "Comentarios", desc: "Cuando un cliente comenta en un preview" },
                            { key: "approvals" as const, label: "Aprobaciones", desc: "Cuando una campaña es aprobada o rechazada" },
                            { key: "uploads" as const, label: "Nuevos assets", desc: "Cuando se suben assets a tus campañas" },
                            { key: "weekly" as const, label: "Resumen semanal", desc: "Un resumen de actividad cada lunes" },
                          ].map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                              <div>
                                <p className="text-[13px] font-medium" style={{ color: T.text }}>{label}</p>
                                <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>{desc}</p>
                              </div>
                              <Toggle on={notifs[key]} onToggle={() => setNotifs((p) => ({ ...p, [key]: !p[key] }))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tab === "integraciones" && (
                      <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                        <p className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Apps conectadas</p>
                        <p className="text-[12px] mb-4" style={{ color: T.sub }}>Conecta tus herramientas para automatizar tu flujo</p>
                        <div className="space-y-2.5">
                          {INTEGRATIONS.map((app) => {
                            const isOn = connections[app.id];
                            return (
                              <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: `1px solid ${T.border}` }}>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white text-[13px] font-bold" style={{ background: app.color }}>
                                  {app.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-medium" style={{ color: T.text }}>{app.name}</p>
                                    {isOn && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(0,197,102,0.15)", color: "#00C566" }}>Conectado</span>}
                                  </div>
                                  <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>{app.desc}</p>
                                </div>
                                <button
                                  onClick={() => { setConnections((p) => ({ ...p, [app.id]: !p[app.id] })); toast.success(isOn ? `${app.name} desconectado` : `${app.name} conectado`); }}
                                  className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all shrink-0"
                                  style={isOn ? { background: T.hover, color: T.sub } : { background: ACCENT, color: "#fff" }}
                                >
                                  {isOn ? "Desconectar" : "Conectar"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {tab === "idioma" && (
                      <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                        <div className="space-y-4">
                          <Select label="Idioma" value={language} onChange={setLanguage} options={["es", "en"]} />
                          <Select label="Zona horaria" value={timezone} onChange={setTimezone} options={["America/Bogotá (GMT-5)", "America/México (GMT-6)", "America/Buenos Aires (GMT-3)", "Europe/Madrid (GMT+1)"]} />
                          <Select label="Formato de fecha" value={dateFormat} onChange={setDateFormat} options={["DD/MM/AAAA", "MM/DD/AAAA", "AAAA-MM-DD"]} />
                          <button onClick={() => toast.success("Preferencias guardadas")} className="px-4 py-2 rounded-xl text-white text-[13px] font-medium cursor-pointer hover:brightness-110 transition-all" style={{ background: ACCENT }}>Guardar cambios</button>
                        </div>
                      </div>
                    )}

                    {tab === "seguridad" && (
                      <div className="space-y-4">
                        {/* 2FA */}
                        <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                          <div className="flex items-center justify-between">
                            <div className="pr-4">
                              <p className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Autenticación en dos pasos</p>
                              <p className="text-[12px]" style={{ color: T.sub }}>Añade una capa extra de seguridad con un código al iniciar sesión</p>
                            </div>
                            <Toggle on={twoFA} onToggle={() => { setTwoFA(!twoFA); toast.success(twoFA ? "2FA desactivado" : "2FA activado"); }} />
                          </div>
                        </div>

                        {/* Active sessions */}
                        <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                          <p className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Sesiones activas</p>
                          <p className="text-[12px] mb-4" style={{ color: T.sub }}>Dispositivos donde tu cuenta está abierta</p>
                          <div className="space-y-3">
                            {[
                              { icon: Monitor, device: "MacBook Pro — Chrome", loc: "Bogotá, CO · Este dispositivo", current: true },
                              { icon: Smartphone, device: "iPhone 15 — Safari", loc: "Bogotá, CO · hace 2h", current: false },
                            ].map(({ icon: Icon, device, loc, current }) => (
                              <div key={device} className="flex items-center gap-3 py-2">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: T.hover }}>
                                  <Icon size={16} style={{ color: T.sub }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium" style={{ color: T.text }}>{device}</p>
                                  <p className="text-[12px]" style={{ color: T.sub }}>{loc}</p>
                                </div>
                                {!current && (
                                  <button onClick={() => toast.success("Sesión cerrada")} className="text-[12px] font-medium cursor-pointer" style={{ color: "#ef4444" }}>Cerrar</button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button onClick={() => toast.success("Todas las otras sesiones cerradas")} className="mt-4 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all" style={{ background: T.hover, color: T.text }}>
                            Cerrar todas las otras sesiones
                          </button>
                        </div>

                        {/* Privacy */}
                        <div className="rounded-2xl p-6" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                          <p className="text-[13px] font-semibold mb-1" style={{ color: T.text }}>Privacidad</p>
                          <p className="text-[12px] mb-3" style={{ color: T.sub }}>Descarga una copia de todos tus datos en View Studio</p>
                          <button onClick={() => toast.success("Preparando tu descarga…")} className="px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all" style={{ background: T.hover, color: T.text }}>
                            Descargar mis datos
                          </button>
                        </div>
                      </div>
                    )}

                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
