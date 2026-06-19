import { motion, AnimatePresence } from "motion/react";
import { PenLine, Wand2, ChevronRight, Sparkles, X } from "lucide-react";

const ACCENT = "#2c6bf2";

export function CreateChoiceModal({
  open,
  onClose,
  onManual,
  onAI,
  dark,
}: {
  open: boolean;
  onClose: () => void;
  onManual: () => void;
  onAI: () => void;
  dark: boolean;
}) {
  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    surface: dark ? "#1d1d23" : "#f9fafb",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f3f4f6",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.4)", fontFamily: "'Roboto', sans-serif" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl rounded-3xl p-12"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-lg cursor-pointer" style={{ color: T.sub }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <X size={18} />
            </button>

            <div className="text-center mb-9">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: T.sub }}>Nueva campaña</p>
              <h1 className="text-3xl font-semibold tracking-tight" style={{ color: T.text }}>¿Cómo quieres crearla?</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Manual */}
              <motion.button
                whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                onClick={onManual}
                className="rounded-2xl p-7 text-left cursor-pointer transition-colors flex flex-col"
                style={{ background: T.page, border: `1px solid ${T.border}`, minHeight: 230 }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: T.hover }}>
                  <PenLine size={22} style={{ color: T.text }} />
                </div>
                <p className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>Crear manualmente</p>
                <p className="text-[12px] mb-3" style={{ color: T.sub }}>Configura cada detalle tú misma: portada, assets y formatos.</p>
                <span className="flex items-center gap-1 text-[13px] font-medium mt-auto" style={{ color: T.text }}>
                  Empezar <ChevronRight size={14} />
                </span>
              </motion.button>

              {/* AI */}
              <motion.button
                whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                onClick={onAI}
                className="rounded-2xl p-7 text-left cursor-pointer relative overflow-hidden flex flex-col"
                style={{ background: dark ? "#000" : "#111114", minHeight: 230 }}
              >
                <div className="absolute pointer-events-none" style={{ top: "-30%", right: "-10%", width: 240, height: 240, background: "radial-gradient(circle, rgba(44,107,242,0.4) 0%, transparent 65%)", filter: "blur(45px)" }} />
                <div className="relative flex flex-col flex-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${ACCENT}, #5b7cf0)` }}>
                    <Wand2 size={22} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[15px] font-semibold text-white">Crear con IA</p>
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(44,107,242,0.25)", color: "#aec4ff" }}>
                      <Sparkles size={10} /> Nuevo
                    </span>
                  </div>
                  <p className="text-[12px] mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>Cuéntale a la IA qué necesitas y la arma por ti, conversando.</p>
                  <span className="flex items-center gap-1 text-[13px] font-medium text-white mt-auto">
                    Probar asistente <ChevronRight size={14} />
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
