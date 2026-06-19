import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  LayoutGrid, Folder, Users, CheckSquare, HelpCircle, Bell, ArrowLeft,
  Search, ChevronDown, Rocket, Share2, MessageSquare, CheckSquare as CheckIcon,
  Sparkles, Send, X,
} from "lucide-react";
import { useContext } from "react";
import { UserMenu, HelpButton, CreateAINavItem, NavContext } from "./TopBarComponents";

interface Props {
  onBack: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}

const ACCENT = "#2c6bf2";

const GUIDES = [
  { icon: Rocket, title: "Primeros pasos", desc: "Crea tu primera campaña en minutos", color: "#2c6bf2" },
  { icon: Share2, title: "Compartir previews", desc: "Envía un link a tus clientes", color: "#00C566" },
  { icon: MessageSquare, title: "Comentarios", desc: "Recibe feedback en cada asset", color: "#FFB020" },
  { icon: CheckIcon, title: "Aprobaciones", desc: "Gestiona el flujo de aprobación", color: "#8B5CF6" },
];

const FAQS = [
  { q: "¿Cómo creo una nueva campaña?", a: "Desde el Dashboard o la página de Campañas, haz clic en \"Nueva campaña\", dale un nombre y sigue los pasos para subir tus assets y configurar la portada." },
  { q: "¿Cómo comparto un preview con mi cliente?", a: "Dentro de una campaña, usa el botón \"Compartir\" para generar un link. Tu cliente podrá ver los assets y dejar comentarios sin necesidad de crear una cuenta." },
  { q: "¿Cómo funcionan las aprobaciones?", a: "Cuando un cliente revisa un preview, puede aprobarlo o solicitar cambios. Verás el estado de cada campaña en la sección Aprobaciones, organizado por Pendientes y Aprobadas." },
  { q: "¿Puedo conectar otras herramientas?", a: "Sí. En Ajustes → Integraciones puedes conectar COR, Slack, Google Drive y Figma para automatizar tu flujo de trabajo." },
  { q: "¿Cómo cambio entre modo claro y oscuro?", a: "Abre el menú de tu perfil (abajo a la izquierda) y usa el selector de Tema, o ve a Ajustes → Apariencia." },
  { q: "¿Mis datos están seguros?", a: "Sí. Puedes activar la autenticación en dos pasos en Ajustes → Privacidad y seguridad, y descargar una copia de tus datos cuando quieras." },
];

export function Frame02fHelp({ onBack, dark, setDark }: Props) {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const nav = useContext(NavContext);

  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    surface: dark ? "#1d1d23" : "#f9fafb",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f3f4f6",
    inputBg: dark ? "#26262e" : "#f3f4f6",
  };

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", active: false, onClick: onBack },
    { icon: Folder, label: "Campañas", active: false, onClick: undefined },
    { icon: Users, label: "Marcas", active: false, onClick: undefined },
    { icon: CheckSquare, label: "Aprobaciones", active: false, onClick: undefined },
  ];

  const filteredFaqs = FAQS.filter((f) => {
    const q = search.toLowerCase();
    return !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
  });

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');`}</style>
      <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif", background: T.surface }}>

        <Sidebar active="help" dark={dark} setDark={setDark} />
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

              {/* Hero + search */}
              <div className="text-center mb-10">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: T.sub }}>Centro de ayuda</p>
                <h1 className="text-3xl font-semibold mb-5" style={{ color: T.text }}>¿En qué te podemos ayudar?</h1>
                <div className="flex items-center gap-2 max-w-md mx-auto rounded-xl px-4 py-3" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                  <Search size={16} style={{ color: T.sub }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Busca en la ayuda..."
                    className="flex-1 bg-transparent outline-none text-[14px]"
                    style={{ color: T.text }}
                  />
                </div>
              </div>

              {/* Guides */}
              <div className="mb-10">
                <p className="text-[13px] font-semibold mb-3" style={{ color: T.text }}>Guías rápidas</p>
                <div className="grid grid-cols-2 gap-3">
                  {GUIDES.map(({ icon: Icon, title, desc, color }) => (
                    <motion.button
                      key={title}
                      whileHover={{ y: -2 }}
                      onClick={() => toast.info(`Abriendo guía: ${title}`)}
                      className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer text-left transition-colors"
                      style={{ background: T.page, border: `1px solid ${T.border}` }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}1f` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: T.text }}>{title}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>{desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="mb-10">
                <p className="text-[13px] font-semibold mb-3" style={{ color: T.text }}>Preguntas frecuentes</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: T.page, border: `1px solid ${T.border}` }}>
                  {filteredFaqs.length > 0 ? filteredFaqs.map((faq, i) => (
                    <div key={faq.q} style={{ borderBottom: i < filteredFaqs.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-left"
                      >
                        <span className="text-[13px] font-medium" style={{ color: T.text }}>{faq.q}</span>
                        <ChevronDown size={16} style={{ color: T.sub, transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                      </button>
                      <AnimatePresence>
                        {openFaq === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 pb-4 text-[13px] leading-relaxed" style={{ color: T.sub }}>{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )) : (
                    <p className="px-5 py-6 text-center text-[13px]" style={{ color: T.sub }}>No encontramos resultados para "{search}"</p>
                  )}
                </div>
              </div>

              {/* AI Assistant */}
              <div className="rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden" style={{ background: dark ? "#000" : "#111114" }}>
                <div className="absolute pointer-events-none" style={{ top: "-40%", right: "-5%", width: 300, height: 300, background: "radial-gradient(circle, rgba(44,107,242,0.35) 0%, transparent 65%)", filter: "blur(50px)" }} />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: `linear-gradient(135deg, ${ACCENT}, #5b7cf0)` }}>
                  <Sparkles size={20} className="text-white" />
                </div>
                <div className="flex-1 relative">
                  <p className="text-[14px] font-semibold text-white">Pregúntale al asistente IA</p>
                  <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>Resuelve tus dudas al instante, con el contexto de View Studio</p>
                </div>
                <button
                  onClick={() => nav.openAssistant?.()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer hover:brightness-110 transition-all text-white shrink-0 relative"
                  style={{ background: ACCENT }}
                >
                  <Sparkles size={14} /> Abrir asistente
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
