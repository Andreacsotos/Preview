import { motion } from "motion/react";
import { ArrowLeft, PenLine, Wand2, ChevronRight, Sparkles } from "lucide-react";

interface Props {
  onBack: () => void;
  onManual: () => void;
  onAI: () => void;
  dark: boolean;
}

const ACCENT = "#2c6bf2";

export function Frame02hCreateChoice({ onBack, onManual, onAI, dark }: Props) {
  const T = {
    page: dark ? "#0e0e12" : "#ffffff",
    surface: dark ? "#1d1d23" : "#f9fafb",
    border: dark ? "#2c2c34" : "#f0f0f2",
    text: dark ? "#f4f5f7" : "#111827",
    sub: dark ? "#9aa3b2" : "#9ca3af",
    hover: dark ? "#26262e" : "#f3f4f6",
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');`}</style>
      <div className="h-screen w-full flex flex-col items-center justify-center px-6 relative" style={{ fontFamily: "'Roboto', sans-serif", background: T.surface }}>

        {/* back */}
        <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[13px]" style={{ color: T.sub }} onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: T.sub }}>Nueva campaña</p>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: T.text }}>¿Cómo quieres crearla?</h1>
          <p className="text-[14px] mt-2" style={{ color: T.sub }}>Hazlo a tu manera, paso a paso, o deja que la IA te guíe.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
          {/* Manual */}
          <motion.button
            whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
            onClick={onManual}
            className="rounded-2xl p-6 text-left cursor-pointer transition-colors"
            style={{ background: T.page, border: `1px solid ${T.border}` }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: T.hover }}>
              <PenLine size={22} style={{ color: T.text }} />
            </div>
            <p className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>Crear manualmente</p>
            <p className="text-[13px] mb-4" style={{ color: T.sub }}>Configura cada detalle tú misma: portada, assets, formatos y más.</p>
            <span className="flex items-center gap-1 text-[13px] font-medium" style={{ color: T.text }}>
              Empezar <ChevronRight size={14} />
            </span>
          </motion.button>

          {/* AI */}
          <motion.button
            whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
            onClick={onAI}
            className="rounded-2xl p-6 text-left cursor-pointer relative overflow-hidden"
            style={{ background: dark ? "#000" : "#111114" }}
          >
            <div className="absolute pointer-events-none" style={{ top: "-30%", right: "-10%", width: 280, height: 280, background: "radial-gradient(circle, rgba(44,107,242,0.4) 0%, transparent 65%)", filter: "blur(50px)" }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${ACCENT}, #5b7cf0)` }}>
                <Wand2 size={22} className="text-white" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[16px] font-semibold text-white">Crear con IA</p>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(44,107,242,0.25)", color: "#aec4ff" }}>
                  <Sparkles size={10} /> Nuevo
                </span>
              </div>
              <p className="text-[13px] mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Cuéntale a la IA qué necesitas y arma la campaña por ti, conversando.</p>
              <span className="flex items-center gap-1 text-[13px] font-medium text-white">
                Probar asistente <ChevronRight size={14} />
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </>
  );
}
