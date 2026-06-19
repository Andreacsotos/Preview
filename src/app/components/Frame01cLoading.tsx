import { useEffect } from "react";
import { motion } from "motion/react";

interface Props {
  onDone: () => void;
  dark?: boolean;
}

export function Frame01cLoading({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "#050510", fontFamily: "'Roboto', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        @keyframes vs-aurora-1 {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.55; }
          33%       { transform: translate(-42%, -58%) scale(1.15) rotate(15deg); opacity: 0.7; }
          66%       { transform: translate(-58%, -44%) scale(0.92) rotate(-10deg); opacity: 0.5; }
        }
        @keyframes vs-aurora-2 {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.45; }
          33%       { transform: translate(-60%, -40%) scale(1.2) rotate(-20deg); opacity: 0.6; }
          66%       { transform: translate(-38%, -55%) scale(0.88) rotate(12deg); opacity: 0.4; }
        }
        @keyframes vs-aurora-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.35; }
          50%       { transform: translate(-45%, -52%) scale(1.1) rotate(8deg); opacity: 0.5; }
        }
        @keyframes vs-progress {
          0%   { width: 0%; }
          60%  { width: 75%; }
          85%  { width: 88%; }
          100% { width: 100%; }
        }
      `}</style>

      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{ left: "50%", top: "45%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(44,107,242,0.45) 0%, rgba(73,96,230,0.2) 40%, transparent 70%)", filter: "blur(80px)", animation: "vs-aurora-1 7s ease-in-out infinite" }} />
        <div className="absolute" style={{ left: "50%", top: "50%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(104,22,176,0.4) 0%, rgba(139,60,255,0.15) 45%, transparent 70%)", filter: "blur(90px)", animation: "vs-aurora-2 9s ease-in-out infinite" }} />
        <div className="absolute" style={{ left: "50%", top: "52%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,180,200,0.25) 0%, rgba(0,120,180,0.1) 50%, transparent 70%)", filter: "blur(70px)", animation: "vs-aurora-3 11s ease-in-out infinite" }} />
      </div>

      {/* Noise overlay for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Logo + text */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-4"
      >
        {/* OCX logo */}
        <img src="/ocx-logo.png" alt="OCX" style={{ height: 22, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.5 }} />

        <div className="h-px w-8" style={{ background: "rgba(255,255,255,0.15)" }} />

        <p className="text-white text-[22px] font-semibold tracking-tight">View Studio</p>

        <motion.p
          animate={{ opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-[13px] font-light"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Preparando tu espacio de trabajo…
        </motion.p>

        {/* Progress bar */}
        <div className="mt-4 rounded-full overflow-hidden" style={{ width: 160, height: 2, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #2c6bf2, #a78bfa)", borderRadius: 9999, animation: "vs-progress 2.8s cubic-bezier(0.4,0,0.2,1) forwards" }} />
        </div>
      </motion.div>
    </div>
  );
}
