import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Sun, Moon, Folder, CheckSquare, Image as ImageIcon, Code2, Share2, Layers } from "lucide-react";
import { Orb } from "./Orb";

interface Props {
  onSignIn: () => void;
}

function LogoMark({ w = 30, h = 24, fill = "currentColor" }: { w?: number; h?: number; fill?: string }) {
  return (
    <svg width={w} height={h} viewBox="0 0 218 171" fill="none">
      <path d="M217.017 0V139.503H108.495V108.496H186.011V31.0065H31.0052V0H217.017Z" fill={fill} />
      <path d="M108.497 139.503V170.509H0V31.0066H31.0065V139.503H108.497Z" fill={fill} />
    </svg>
  );
}

const fade = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const ACCENT = "#2c6bf2";

export function Frame00Home({ onSignIn }: Props) {
  const [dark, setDark] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // scroll-linked motion (manual listener for reliability inside scroll container)
  const scrollY = useMotionValue(0);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      scrollY.set(el.scrollTop);
      setScrolled(el.scrollTop > window.innerHeight * 0.82);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollY]);

  const mockY = useTransform(scrollY, [0, 700], [0, -90]);
  const mockScale = useTransform(scrollY, [0, 700], [1, 1.06]);
  const heroTextY = useTransform(scrollY, [0, 500], [0, -60]);
  const heroTextOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  // full-bleed -> settles into rounded container on scroll
  const heroPad = useTransform(scrollY, [0, 260], [0, 24]);
  const heroRadius = useTransform(scrollY, [0, 260], [0, 28]);

  // theme tokens (shadow module-level usage)
  const INK = dark ? "#f4f5f7" : "#0d1117";
  const whiteBg = dark ? "#0a0a0d" : "#ffffff";

  // cursor glow tracking in hero
  const handleHeroMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  // custom cursor (adapts to bg via mix-blend-mode: difference)
  const curX = useMotionValue(-100);
  const curY = useMotionValue(-100);
  const ringX = useSpring(curX, { stiffness: 350, damping: 28, mass: 0.4 });
  const ringY = useSpring(curY, { stiffness: 350, damping: 28, mass: 0.4 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => { curX.set(e.clientX); curY.set(e.clientY); };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      setHovering(!!t.closest("button, a, [role='button'], .cursor-pointer"));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); };
  }, [curX, curY]);


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bacalar:wght@100..900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        .vh-body { font-family: 'Roboto', sans-serif; }
        .vh-display { font-family: 'Bacalar', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em; }
        /* hide native cursor — custom cursor takes over (only fine pointers) */
        @media (pointer: fine) {
          .vh-cursor-root, .vh-cursor-root * { cursor: none !important; }
        }
        .vh-cur-dot, .vh-cur-ring { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999; border-radius: 9999px; }
        .vh-scroll::-webkit-scrollbar { width: 0; background: transparent; }
        .vh-scroll { scrollbar-width: none; }
        @keyframes vh-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes vh-card-glow {
          0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,0.08), inset 0 0 0 1px #E9EBEF; }
          50% { box-shadow: 0 20px 50px rgba(44,107,242,0.15), inset 0 0 0 1px #2c6bf2; }
        }

        /* Glow button effect */
        .vh-glow { position: relative; transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); cursor: pointer; }
        .vh-glow::before {
          content: ""; position: absolute; inset: -3px; border-radius: 9999px;
          background: linear-gradient(120deg, #6816B0, #4960E6, #8a3df0, #4960E6);
          background-size: 200% 200%;
          opacity: 0; filter: blur(13px); z-index: 0;
          transition: opacity 0.4s ease; animation: vh-glow-shift 3s ease infinite;
        }
        .vh-glow:hover::before { opacity: 0.85; }
        .vh-glow:hover { transform: translateY(-2px) scale(1.03); }
        .vh-glow > * { position: relative; z-index: 1; }
        @keyframes vh-glow-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        /* shimmer line at top of glow buttons */
        .vh-glow::after {
          content: ""; position: absolute; top: 1px; left: 18%; right: 18%; height: 1px; z-index: 2;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .vh-glow:hover::after { opacity: 1; }

        /* Animated gradient border (works on any bg) */
        @property --vh-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        .vh-border { position: relative; cursor: pointer; transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease; }
        .vh-border::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.6px;
          background: conic-gradient(from var(--vh-angle), #6816B0, #4960E6, #00FFFF, #4960E6, #6816B0);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0; transition: opacity 0.4s ease;
        }
        .vh-border:hover::before { opacity: 1; animation: vh-rotate 2.5s linear infinite; }
        .vh-border:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(73,96,230,0.18); }
        @keyframes vh-rotate { to { --vh-angle: 360deg; } }

        /* Blue fill hover */
        .vh-btn { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); cursor: pointer; }
        .vh-btn:hover { background: #2c6bf2 !important; border-color: #2c6bf2 !important; transform: translateY(-2px); box-shadow: 0 10px 26px rgba(44,107,242,0.4); }
        .vh-btn:hover, .vh-btn:hover * { color: #fff !important; }

        /* Animated demo cursor inside mockup */
        @keyframes vh-cursor {
          0%   { top: 22%; left: 14%; opacity: 0; }
          8%   { opacity: 1; }
          22%  { top: 22%; left: 14%; }
          38%  { top: 22%; left: 62%; }
          46%  { top: 22%; left: 62%; transform: scale(0.85); }
          50%  { transform: scale(1); }
          66%  { top: 80%; left: 16%; }
          74%  { top: 80%; left: 16%; transform: scale(0.85); }
          78%  { transform: scale(1); }
          92%  { top: 14%; left: 86%; opacity: 1; }
          100% { top: 14%; left: 86%; opacity: 0; }
        }
        .vh-cursor { animation: vh-cursor 9s ease-in-out infinite; }
        /* highlight ring pulse when cursor "clicks" */
        @keyframes vh-tap {
          0%, 38%, 100% { opacity: 0; transform: scale(0.5); }
          44% { opacity: 0.45; transform: scale(1); }
          54% { opacity: 0; transform: scale(1.4); }
        }
      `}</style>

      {/* Custom cursor — anillo + punto (blanco/negro según tema) */}
      {dark ? (
        // Dark mode: anillo azul accent
        <>
          <motion.div style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999, borderRadius: 9999, x: ringX, y: ringY, width: hovering ? 44 : 28, height: hovering ? 44 : 28, marginLeft: hovering ? -22 : -14, marginTop: hovering ? -22 : -14, border: `1.5px solid ${ACCENT}`, opacity: hovering ? 0.9 : 0.5, transition: "width .2s, height .2s, margin .2s, opacity .2s" }} />
          <motion.div style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999, borderRadius: 9999, x: curX, y: curY, width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5, background: ACCENT }} />
        </>
      ) : (
        // Light mode: anillo y punto negro
        <>
          <motion.div style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999, borderRadius: 9999, x: ringX, y: ringY, width: hovering ? 44 : 28, height: hovering ? 44 : 28, marginLeft: hovering ? -22 : -14, marginTop: hovering ? -22 : -14, border: "1.5px solid rgba(0,0,0,0.5)", opacity: hovering ? 0.9 : 0.6, transition: "width .2s, height .2s, margin .2s, opacity .2s" }} />
          <motion.div style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999, borderRadius: 9999, x: curX, y: curY, width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5, background: "rgba(0,0,0,0.7)" }} />
        </>
      )}

      {/* Fixed nav — adapts to light/dark on scroll */}
      {(() => {
        const navLight = !dark; // nav claro cuando el tema es claro
        const txt = navLight ? "#0d1117" : "#fff";
        const subtleBg = navLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)";
        const subtleBorder = navLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.18)";
        return (
          <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-5" style={{
            background: navLight ? "rgba(255,255,255,0.7)" : "rgba(3,2,8,0.55)",
            backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            borderBottom: `1px solid ${navLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
            transition: "background 0.4s ease, border-color 0.4s ease",
          }}>
            <div className="flex items-center gap-4" style={{ color: txt }}>
              <img src="/ocx-logo.png" alt="OCX — Omnicom Content Experiences" style={{ height: 22, width: "auto", filter: navLight ? "invert(1)" : "none", transition: "filter 0.4s ease" }} />
              <div className="h-7 w-px" style={{ background: navLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)" }} />
              <span className="text-[18px] font-medium tracking-tight">View Studio</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDark(!dark)} aria-label="Toggle theme" className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all" style={{ background: subtleBg, border: `1px solid ${subtleBorder}`, color: txt }}>
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={onSignIn} className="vh-btn text-[13px] font-medium px-5 py-2.5 rounded-full" style={{ background: subtleBg, border: `1px solid ${subtleBorder}`, color: txt }}>Sign in</button>
            </div>
          </div>
        );
      })()}

      <div ref={scrollRef} className="vh-body vh-scroll vh-cursor-root w-full h-screen overflow-y-auto relative" style={{ background: whiteBg, transition: "background 0.4s ease" }}>

        {/* ═══════════ HERO BAND (aurora background) ═══════════ */}
        <motion.section className="relative" style={{ paddingLeft: heroPad, paddingRight: heroPad, paddingTop: heroPad, paddingBottom: 0 }}>
          <motion.div ref={heroRef} onMouseMove={handleHeroMove} className="relative overflow-hidden flex flex-col" style={{ minHeight: "calc(100vh - 24px)", background: dark ? "#030208" : "#f5f6fa", borderRadius: heroRadius, transition: "background 0.4s ease" }}>

            {/* Grid reticle */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: dark
                ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
                : "linear-gradient(rgba(40,50,120,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(40,50,120,0.06) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage: "radial-gradient(ellipse 75% 70% at 30% 60%, #000 20%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 30% 60%, #000 20%, transparent 78%)",
            }} />

            {/* Cursor-following glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: dark
                ? "radial-gradient(340px circle at var(--mx, 50%) var(--my, 30%), rgba(73,96,230,0.13), rgba(104,22,176,0.05) 42%, transparent 70%)"
                : "radial-gradient(260px circle at var(--mx, 50%) var(--my, 30%), rgba(255,255,255,0.55), transparent 70%)",
              transition: "background 0.1s ease-out",
            }} />
            {/* grid revealed by cursor — solo en dark */}
            {dark && (
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(120,150,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(120,150,255,0.12) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
                maskImage: "radial-gradient(200px circle at var(--mx, -200px) var(--my, -200px), #000 0%, transparent 70%)",
                WebkitMaskImage: "radial-gradient(200px circle at var(--mx, -200px) var(--my, -200px), #000 0%, transparent 70%)",
              }} />
            )}

            {/* Hero copy — top center */}
            <motion.div style={{ y: heroTextY, opacity: heroTextOpacity }} className="relative flex flex-col items-center text-center px-6 pt-44 md:pt-52">
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22,1,0.36,1] }}
                className="vh-display" style={{ fontSize: 58, lineHeight: 0.98, maxWidth: 880, color: dark ? "#ffffff" : "#0d1117" }}>
                Your review and approval studio.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 text-[18px] font-light leading-relaxed" style={{ color: dark ? "rgba(255,255,255,0.7)" : "#5b6473", maxWidth: 560 }}>
                Upload your campaigns, share them with a single link, and get feedback and approvals from your clients — all in one place.
              </motion.p>
            </motion.div>

            {/* Hero — AI orb con tags flotando */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45, ease: [0.22,1,0.36,1] }}
              style={{ y: mockY, scale: mockScale }}
              className="relative mx-auto w-full mt-auto flex items-center justify-center" >
              <div className="relative" style={{ width: 620, height: 440 }}>
                {/* tags flotantes */}
                {[
                  { icon: Code2,      label: "HTML5 banner",    x: 360, y: 78,  d: 0.6, dur: 5.2 },
                  { icon: CheckSquare,label: "Approvals",       x: 92,  y: 150, d: 1.1, dur: 4.8 },
                  { icon: ImageIcon,  label: "Preview",          x: 410, y: 210, d: 0.3, dur: 5.6 },
                  { icon: Share2,     label: "Share link",      x: 110, y: 300, d: 0.9, dur: 5.0 },
                  { icon: Layers,     label: "Multi-format",    x: 352, y: 338, d: 1.4, dur: 4.6 },
                ].map(({ icon: Icon, label, x, y, d, dur }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                    transition={{ opacity: { duration: 0.5, delay: 0.6 + d }, scale: { duration: 0.5, delay: 0.6 + d }, y: { duration: dur, repeat: Infinity, ease: "easeInOut", delay: d } }}
                    className="absolute flex items-center gap-2 rounded-full px-3.5 py-2"
                    style={{ left: x, top: y, zIndex: 10, background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.75)", border: `1px solid ${dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.06)"}`, backdropFilter: "blur(10px)", boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.35)" : "0 8px 24px rgba(40,50,120,0.12)" }}
                  >
                    <Icon size={14} style={{ color: dark ? "#aec4ff" : "#2c6bf2" }} />
                    <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: dark ? "#ffffff" : "#1c2452" }}>{label}</span>
                  </motion.div>
                ))}
                {/* orbe central */}
                <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%, -50%)", zIndex: 1 }}>
                  <Orb size={240} dark={dark} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ═══════════ FOOTER (black) ═══════════ */}
        <section className="relative px-6 pb-6">
          <div className="relative overflow-hidden rounded-[28px] px-6 py-16" style={{ background: "#030208" }}>
            {/* Grid reticle */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage: "radial-gradient(ellipse 70% 80% at 80% 20%, #000 10%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 80% 20%, #000 10%, transparent 75%)",
            }} />

            <div className="mx-auto w-full" style={{ maxWidth: 1200 }}>
            {/* Top — brand + legal */}
            <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
              className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-10">
              {/* brand col */}
              <div>
                <div className="flex items-center text-white mb-5">
                  <span className="text-[18px] font-medium tracking-tight">View Studio</span>
                </div>
                <p className="text-[14px] font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 320 }}>
                  The platform to share campaign previews and get approvals faster.
                </p>
              </div>

              {/* legal col */}
              <div>
                <p className="text-[12px] uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Legal</p>
                <div className="flex flex-col gap-3">
                  {["Terms", "Privacy", "Security"].map((it) => (
                    <span key={it} className="text-[14px] font-light cursor-pointer transition-colors" style={{ color: "rgba(255,255,255,0.7)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>{it}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Bottom bar */}
            <div className="relative mt-16 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>© 2026 View Studio. All rights reserved.</span>
            </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
