import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, X } from "lucide-react";
import { askOpenAI } from "../lib/openai";

const ACCENT = "#2c6bf2";

type ChatMsg = { role: "user" | "bot"; text: string };

const pick = (...opts: string[]) => opts[Math.floor(Math.random() * opts.length)];

type Topic = "campaña" | "compartir" | "aprobaciones" | "integraciones" | "tema" | "seguridad" | "marcas" | "formatos" | "ia" | null;

const ELABORATIONS: Record<NonNullable<Topic>, string> = {
  campaña: "Te explico paso a paso: 1) Ve al sidebar y clic en \"Campañas\" o entra al Dashboard. 2) Clic en \"Nueva campaña\". 3) Le pones un nombre. 4) Configuras la portada: logo, color de marca y fuente. 5) Subes los assets — si tus carpetas están organizadas por plataforma, View Studio los detecta automáticamente. ¿En qué paso te trabas?",
  compartir: "Vamos despacio: abre la campaña que quieres compartir. Arriba a la derecha vas a ver un botón que dice \"Compartir\". Al darle clic genera un link único. Copias ese link y se lo mandas a tu cliente por donde prefieras — WhatsApp, email, lo que sea. El cliente lo abre en el navegador sin necesitar cuenta. ¿Pudiste encontrar el botón?",
  aprobaciones: "Te explico más claro: en el menú de la izquierda está la sección \"Aprobaciones\". Al entrar ves dos columnas — Pendientes y Aprobadas. Cada tarjeta es una campaña. El cliente, desde su link de preview, puede darle \"Aprobar\" o \"Solicitar cambios\", y eso actualiza el estado aquí al instante. ¿Lo encontraste en el menú?",
  integraciones: "Para conectar: ve a Ajustes (ícono abajo a la izquierda) → sección \"Integraciones\". Ahí aparecen COR, Slack, Google Drive y Figma. Cada uno tiene un botón \"Conectar\" — al darle clic te pide autorizar el acceso y listo. ¿Cuál integración necesitas conectar?",
  tema: "Es muy fácil: en el sidebar izquierdo, debajo del botón de Ayuda, hay un toggle con \"Claro\" y \"Oscuro\". Dale clic al que prefieras. También lo puedes cambiar desde Ajustes → Apariencia si prefieres ir por ahí.",
  seguridad: "En Ajustes → Privacidad y seguridad tienes tres cosas: activar autenticación en dos pasos (2FA), ver todos los dispositivos donde tienes sesión abierta y cerrarlas, y descargar una copia de tus datos. ¿Cuál de esas necesitas?",
  marcas: "En el menú izquierdo está \"Marcas\". Al entrar ves todas tus marcas/clientes en tarjetas. Al dar clic en una entras a su detalle: ves sus campañas, el link de COR y puedes agregar nuevas campañas para esa marca. Para crear una marca nueva, el botón está arriba a la derecha.",
  formatos: "Los formatos se eligen en el paso 2 al crear una campaña. Las opciones son: Social (Instagram, Facebook), Display Ads, Hero Banner, Stories y Custom (tú defines las medidas). Si subes una carpeta con las imágenes organizadas por plataforma, View Studio los detecta y pre-selecciona los formatos solos.",
  ia: "El Asistente IA está en el menú lateral, el ícono de destellos. Puedes escribirle en lenguaje natural: \"crea una campaña para Nike de redes sociales\" o \"agregar una marca para Éxito\". Él te hace las preguntas necesarias y arma todo paso a paso.",
};

const KNOWLEDGE: { test: (q: string) => boolean; topic: Topic; answer: () => string }[] = [
  {
    topic: null,
    test: (q) => /hola|buenas|hey|que tal|como estas/.test(q),
    answer: () => pick("¡Hola! Cuéntame, ¿en qué te puedo ayudar?", "¡Hola Andrea! Aquí estoy. ¿Qué necesitas?", "¡Buenas! Dime."),
  },
  {
    topic: "campaña",
    test: (q) => /crear|nueva campa|empezar campa|como hago una campa|nueva camp/.test(q),
    answer: () => pick(
      "Fácil. Ve a Campañas y toca \"Nueva campaña\". Le pones nombre, configuras la portada (logo, colores, fuente) y subes los assets. View Studio detecta las plataformas automáticamente.",
      "Desde el Dashboard o Campañas, clic en \"Nueva campaña\". Primero el nombre, luego la portada y al final los assets. Si tus carpetas están organizadas por plataforma, los formatos se auto-seleccionan.",
    ),
  },
  {
    topic: "compartir",
    test: (q) => /compartir|link|enviar.*cliente|mandar.*cliente|como comparto|preview.*cliente/.test(q),
    answer: () => pick(
      "Dentro de la campaña hay un botón \"Compartir\" — genera un link único. Tu cliente lo abre, ve el preview y puede dejar comentarios sin crear cuenta.",
      "Con el botón \"Compartir\" dentro de la campaña. Genera un link que le mandas directo. El cliente comenta y aprueba sin registrarse.",
    ),
  },
  {
    topic: "aprobaciones",
    test: (q) => /aprobacion|aprobar|aprobaciones|estado.*aprobacion|rechazar|cambios|ver.*aprobac|como.*aprobac/.test(q),
    answer: () => pick(
      "En la sección Aprobaciones del menú ves todo: campañas pendientes y aprobadas. Cuando el cliente revisa el preview puede aprobar o pedir cambios — el estado se actualiza al momento.",
      "En Aprobaciones tienes el estado de cada campaña en tiempo real. El cliente aprueba o solicita cambios desde su link, y tú lo ves reflejado de inmediato.",
    ),
  },
  {
    topic: "integraciones",
    test: (q) => /integracion|integrar|cor|slack|drive|google|figma|conectar|sincronizar/.test(q),
    answer: () => pick(
      "En Ajustes → Integraciones puedes conectar COR, Slack, Google Drive y Figma. Cada una con un clic.",
      "Desde Ajustes → Integraciones. Tienes COR, Slack, Google Drive y Figma. Solo autorizar acceso y listo.",
    ),
  },
  {
    topic: "tema",
    test: (q) => /tema|oscuro|claro|modo.*apariencia|cambiar.*color|apariencia/.test(q),
    answer: () => "El switch claro/oscuro está en el sidebar, debajo de Ayuda. También en Ajustes → Apariencia.",
  },
  {
    topic: "seguridad",
    test: (q) => /seguridad|contrasena|2fa|dos pasos|sesion|datos|privacidad/.test(q),
    answer: () => "En Ajustes → Privacidad: activás 2FA, ves sesiones abiertas en otros dispositivos y descargás tus datos.",
  },
  {
    topic: "marcas",
    test: (q) => /marca|marcas|cliente nuevo|nueva marca|agregar marca/.test(q),
    answer: () => "En Marcas ves todos tus clientes con sus campañas. Para crear una nueva, clic en \"Nueva marca\".",
  },
  {
    topic: "formatos",
    test: (q) => /formato|formatos|tamano|banner|stories|display|social|medidas/.test(q),
    answer: () => "Al crear una campaña, en el paso 2 eliges los formatos: Social, Display Ads, Hero Banner, Stories o Custom. Si subes carpetas organizadas, se auto-detectan.",
  },
  {
    topic: "ia",
    test: (q) => /asistente.*ia|inteligencia artificial|crear.*ia|gen.*ia/.test(q),
    answer: () => "El Asistente IA está en el menú lateral. Le describes lo que necesitas en texto normal y te guía paso a paso.",
  },
  {
    topic: null,
    test: (q) => /gracias|perfecto|genial|chevere|listo|entendi|^ok$|^okey$/.test(q),
    answer: () => pick("¡Con gusto! ¿Algo más?", "¡Claro! Aquí estoy si necesitas.", "Perfecto. Cualquier cosa me avisas."),
  },
];

const isConfused = (q: string) =>
  /no entend|sigo sin|no me queda|no se|no comprend|perdon|no te entend|como asi|que significa|puedes explicar|mas detalle/.test(q);

const isVague = (q: string) =>
  /^(tengo una duda|una pregunta|necesito ayuda|ayuda|ayudame|duda)\.?$/.test(q.trim());

let lastTopic: Topic = null;

function getAnswer(question: string): string {
  const q = question.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  if (isVague(q)) return pick("Claro, dime. ¿Sobre qué tienes la duda?", "Cuéntame, ¿qué necesitas?", "Dime, te ayudo.");

  const isFollowUp = /(pero que|y que|y alli|y ahi|que (hay|tiene|puedo|opciones|encuentro|contiene)|que mas (hay|tiene)|como se usa|para que sirve|como funciona|y eso que|que incluye|que trae)/.test(q);
  if ((isConfused(q) || isFollowUp) && lastTopic) return ELABORATIONS[lastTopic];

  for (const entry of KNOWLEDGE) {
    if (entry.test(q)) {
      if (entry.topic) lastTopic = entry.topic;
      return entry.answer();
    }
  }

  return pick(
    "Mmm, no entendí bien eso. ¿Me puedes contar un poco más? Puedo ayudarte con campañas, aprobaciones, integraciones o ajustes.",
    "No tengo eso claro. Pregúntame sobre campañas, compartir previews, aprobaciones o integraciones.",
    "¿Puedes darme más contexto? No quiero darte una respuesta equivocada.",
  );
}

const SUGGESTIONS = [
  "¿Cómo creo una campaña?",
  "¿Cómo comparto un preview con el cliente?",
  "¿Cómo conecto COR o Slack?",
  "¿Dónde veo las aprobaciones?",
];

export function AIAssistant({ open, setOpen, dark }: { open: boolean; setOpen: (v: boolean) => void; dark: boolean }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "bot", text: "¡Hola Andrea! Soy tu asistente de View Studio. ¿En qué te puedo ayudar?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const T = {
    page: dark ? "#1d1d23" : "#ffffff",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f3f4f6",
    inputBg: dark ? "#26262e" : "#f3f4f6",
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const renderText = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    return lines.map((line, i) => {
      // numbered list
      const numMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*:?\s*(.*)/);
      if (numMatch) return (
        <div key={i} className="flex gap-2 mt-1.5 first:mt-0">
          <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style={{ background: "rgba(44,107,242,0.15)", color: ACCENT }}>{numMatch[1]}</span>
          <span><strong className="font-semibold">{numMatch[2]}</strong>{numMatch[3] ? `: ${numMatch[3]}` : ""}</span>
        </div>
      );
      // bold inline
      const parts = line.split(/\*\*(.+?)\*\*/g);
      const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold">{p}</strong> : p);
      return <p key={i} className={i > 0 ? "mt-1.5" : ""}>{rendered}</p>;
    });
  };

  const sendMessage = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    const updated = [...messages, { role: "user" as const, text: q }];
    setMessages(updated);
    setInput("");
    setTyping(true);
    try {
      const history = updated.map((m) => ({ role: m.role === "bot" ? "assistant" as const : "user" as const, content: m.text }));
      const reply = await askOpenAI(history);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Ups, tuve un problema de conexión. Intenta de nuevo en un momento." }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer"
        style={{ background: dark ? "#f4f5f7" : "#111114", boxShadow: "0 8px 28px rgba(0,0,0,0.28)" }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} style={{ color: dark ? "#111114" : "#fff" }} />
            </motion.span>
          ) : (
            <motion.span key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles size={22} style={{ color: dark ? "#111114" : "#fff" }} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* CHAT PANEL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "bottom left", background: T.page, border: `1px solid ${T.border}`, fontFamily: "'Roboto', sans-serif" }}
            className="fixed bottom-24 left-6 z-50 w-[380px] h-[520px] max-h-[75vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: T.border }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}, #5b7cf0)` }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: T.text }}>Asistente View Studio</p>
                <p className="text-[11px] flex items-center gap-1" style={{ color: "#00C566" }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#00C566" }} /> En línea
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: T.sub }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ scrollbarWidth: "none" }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                    style={m.role === "user"
                      ? { background: ACCENT, color: "#fff", borderBottomRightRadius: 4 }
                      : { background: T.hover, color: T.text, borderBottomLeftRadius: 4 }}>
                    {m.role === "bot" ? renderText(m.text) : m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-3.5 py-3 flex items-center gap-1" style={{ background: T.hover, borderBottomLeftRadius: 4 }}>
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="w-1.5 h-1.5 rounded-full block" style={{ background: T.sub }}
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                    ))}
                  </div>
                </div>
              )}
              {messages.length === 1 && !typing && (
                <div className="pt-1 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.sub }}>Prueba preguntando</p>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] cursor-pointer transition-colors"
                      style={{ background: T.hover, color: T.text }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t shrink-0" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: T.inputBg }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-transparent outline-none text-[13px]"
                  style={{ color: T.text }}
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0 disabled:opacity-30"
                  style={{ background: ACCENT }}>
                  <Send size={13} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
