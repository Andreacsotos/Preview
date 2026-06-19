import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Clock, Tag } from "lucide-react";

const ACCENT = "#2c6bf2";

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const CATEGORIES = ["Todos", "Aprobaciones", "Flujo de trabajo", "Clientes", "Tips"];

const POSTS = [
  {
    id: 1,
    category: "Aprobaciones",
    title: "Cómo reducir los ciclos de revisión con tus clientes",
    excerpt: "Aprende las mejores prácticas para estructurar el proceso de aprobación y evitar idas y venidas interminables.",
    readTime: "5 min",
    img: "linear-gradient(135deg, #aec4ff 0%, #5b7cf0 60%, #2748b8 100%)",
    featured: true,
  },
  {
    id: 2,
    category: "Flujo de trabajo",
    title: "Organiza tus campañas por plataforma desde el primer día",
    excerpt: "Una estructura clara desde el inicio te ahorra horas de trabajo. Te mostramos cómo hacerlo en View Studio.",
    readTime: "4 min",
    img: "linear-gradient(135deg, #c9d6ff 0%, #a78bfa 100%)",
    featured: true,
  },
  {
    id: 3,
    category: "Clientes",
    title: "El link de preview que tus clientes van a amar",
    excerpt: "Comparte un link limpio, sin logins complicados, y recibe feedback estructurado en minutos.",
    readTime: "3 min",
    img: "linear-gradient(135deg, #1b2b5e 0%, #2c6bf2 100%)",
    featured: false,
  },
  {
    id: 4,
    category: "Tips",
    title: "5 errores comunes al presentar assets de campaña",
    excerpt: "Desde adjuntar PDFs en emails hasta Google Drive sin orden: los errores que todos cometemos y cómo evitarlos.",
    readTime: "6 min",
    img: "linear-gradient(135deg, #fbc2eb 0%, #a18cd1 100%)",
    featured: false,
  },
  {
    id: 5,
    category: "Aprobaciones",
    title: "Comentarios en contexto: el superpoder del feedback visual",
    excerpt: "Ver el asset mientras se deja el comentario cambia todo. Descubre por qué el feedback visual acelera las aprobaciones.",
    readTime: "4 min",
    img: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    featured: false,
  },
  {
    id: 6,
    category: "Flujo de trabajo",
    title: "Cómo manejar múltiples marcas sin perder la cabeza",
    excerpt: "Si trabajas con varios clientes a la vez, esta guía es para ti. Estructura, etiquetas y flujos que escalan.",
    readTime: "5 min",
    img: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    featured: false,
  },
];

interface Props {
  onBack: () => void;
  onGetStarted: () => void;
}

export function FrameBlog({ onBack, onGetStarted }: Props) {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered = activeCategory === "Todos" ? POSTS : POSTS.filter((p) => p.category === activeCategory);
  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="w-full h-screen overflow-y-auto" style={{ background: "#ffffff", fontFamily: "'Roboto', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');`}</style>

      {/* Nav */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-8 py-4" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #f0f0f2" }}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] cursor-pointer transition-colors" style={{ color: "#9ca3af" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; }}>
            <ArrowLeft size={15} /> Volver
          </button>
          <div className="h-5 w-px" style={{ background: "#f0f0f2" }} />
          <span className="text-[15px] font-semibold" style={{ color: "#111827" }}>View Studio Academy</span>
        </div>
        <button onClick={onGetStarted} className="text-[13px] font-semibold px-5 py-2 rounded-full text-white cursor-pointer transition-all"
          style={{ background: ACCENT }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
          Crear cuenta gratis
        </button>
      </div>

      <div className="mx-auto px-6 py-16" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <motion.div variants={fade} initial="hidden" animate="show" className="mb-14">
          <span className="text-[12px] uppercase tracking-widest" style={{ color: "#9ca3af" }}>Recursos</span>
          <h1 className="mt-3 mb-4" style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#111827" }}>
            Aprende a lanzar campañas<br />más rápido
          </h1>
          <p style={{ fontSize: 18, color: "#5b6473", maxWidth: 520, lineHeight: 1.6 }}>
            Guías, tips y buenas prácticas para equipos que presentan y aprueban contenido con clientes.
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="flex items-center gap-2 mb-12 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-full text-[13px] font-medium cursor-pointer transition-all"
              style={{
                background: activeCategory === cat ? "#111827" : "#f5f6f8",
                color: activeCategory === cat ? "#ffffff" : "#5b6473",
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Featured grid */}
        {featured.length > 0 && (
          <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show"
            className="grid md:grid-cols-2 gap-6 mb-6">
            {featured.map((post) => (
              <motion.div key={post.id} variants={fade} whileHover={{ y: -4 }}
                className="rounded-[24px] overflow-hidden cursor-pointer group"
                style={{ background: "#ffffff", border: "1px solid #f0f0f2", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="h-[220px]" style={{ background: post.img }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center gap-1 text-[11px] uppercase tracking-widest" style={{ color: ACCENT }}>
                      <Tag size={10} /> {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "#9ca3af" }}>
                      <Clock size={10} /> {post.readTime}
                    </span>
                  </div>
                  <h2 className="mb-2" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.01em", color: "#111827" }}>{post.title}</h2>
                  <p className="text-[14px] leading-relaxed mb-5" style={{ color: "#5b6473" }}>{post.excerpt}</p>
                  <div className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: ACCENT }}>
                    Leer artículo <ArrowUpRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Rest list */}
        {rest.length > 0 && (
          <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show"
            className="grid md:grid-cols-3 gap-5">
            {rest.map((post) => (
              <motion.div key={post.id} variants={fade} whileHover={{ y: -4 }}
                className="rounded-[20px] overflow-hidden cursor-pointer"
                style={{ background: "#ffffff", border: "1px solid #f0f0f2", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div className="h-[140px]" style={{ background: post.img }} />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] uppercase tracking-widest" style={{ color: ACCENT }}>{post.category}</span>
                    <span className="text-[11px]" style={{ color: "#c4c9d4" }}>·</span>
                    <span className="text-[11px]" style={{ color: "#9ca3af" }}>{post.readTime}</span>
                  </div>
                  <h3 className="mb-2" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, color: "#111827" }}>{post.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#9ca3af" }}>{post.excerpt}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p style={{ color: "#9ca3af", fontSize: 15 }}>No hay artículos en esta categoría aún.</p>
          </div>
        )}

        {/* CTA bottom */}
        <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="mt-20 rounded-[28px] p-14 text-center" style={{ background: "#030208" }}>
          <h3 className="mb-4" style={{ fontSize: 36, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Listo para probarlo
          </h3>
          <p className="mb-8 text-[16px]" style={{ color: "rgba(255,255,255,0.6)" }}>
            Crea tu cuenta gratis y empieza a compartir previews hoy.
          </p>
          <button onClick={onGetStarted} className="px-8 py-3.5 rounded-full text-[14px] font-semibold cursor-pointer transition-all"
            style={{ background: ACCENT, color: "#fff" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
            Crear cuenta gratis
          </button>
        </motion.div>
      </div>
    </div>
  );
}
