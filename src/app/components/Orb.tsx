import { useRef, useEffect } from "react";
import { motion } from "motion/react";

// Esfera de cristal con waveform luminoso (canvas). Se adapta al tema.
export function Orb({ size = 64, active = false, dark = false }: { size?: number; active?: boolean; dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, R = size / 2;
    let raf = 0;
    let t = 0;

    const COLS = Math.max(24, Math.floor(size * 0.42));
    const LINES = 11;
    const band = R * 0.5;
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const colAt = (k: number): [number, number, number] => {
      if (dark) {
        if (k < 0.5) { const u = k / 0.5; return [Math.round(lerp(120, 90, u)), Math.round(lerp(220, 150, u)), 255]; }
        const u = (k - 0.5) / 0.5; return [Math.round(lerp(90, 180, u)), Math.round(lerp(150, 130, u)), 255];
      }
      if (k < 0.5) { const u = k / 0.5; return [Math.round(lerp(70, 165, u)), Math.round(lerp(110, 90, u)), Math.round(lerp(255, 245, u))]; }
      const u = (k - 0.5) / 0.5; return [Math.round(lerp(165, 255, u)), Math.round(lerp(90, 120, u)), Math.round(lerp(245, 195, u))];
    };

    const draw = () => {
      const sp = activeRef.current ? 2.4 : 1;
      t += 0.02 * sp;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";

      for (let j = 0; j < LINES; j++) {
        const jn = j / (LINES - 1);
        const yOff = (jn - 0.5) * band;
        const depth = 1 - Math.abs(jn - 0.5) * 1.2;
        for (let i = 0; i <= COLS; i++) {
          const px = i / COLS;
          const x = px * size;
          const nx = (x - cx) / R;
          const env = Math.sqrt(Math.max(0, 1 - nx * nx));
          if (env <= 0.02) continue;
          const wave =
            Math.sin(px * Math.PI * 2 * 1.6 + t * 1.6 + jn * 2.2) * 0.5 +
            Math.sin(px * Math.PI * 2 * 2.7 - t * 1.1 + jn * 3.0) * 0.3;
          const y = cy + yOff * env + wave * R * 0.28 * env;
          const [r, g, b] = colAt(px);
          const a = Math.max(0, env * depth) * (dark ? 0.7 : 0.6);
          const rad = Math.max(0.6, size * 0.016) * (0.6 + env * 0.8);
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fill();
        }
      }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [size, dark]);

  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <motion.div
        animate={{ opacity: active ? [0.55, 0.9, 0.55] : [0.4, 0.6, 0.4], scale: active ? [1, 1.1, 1] : [1, 1.04, 1] }}
        transition={{ duration: active ? 1.2 : 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", inset: -size * 0.28, borderRadius: "50%",
          background: dark
            ? "radial-gradient(circle, rgba(90,150,255,0.7) 0%, rgba(150,120,255,0.2) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(150,140,255,0.5) 0%, rgba(255,160,210,0.25) 50%, transparent 72%)",
          filter: `blur(${size * 0.2}px)`,
        }}
      />
      <div style={{
        width: size, height: size, borderRadius: "50%", position: "relative", overflow: "hidden",
        background: dark
          ? "radial-gradient(circle at 50% 45%, rgba(20,28,70,0.9) 0%, rgba(6,8,24,0.95) 80%)"
          : "radial-gradient(circle at 50% 45%, #ffffff 0%, #f1eeff 88%)",
        boxShadow: dark
          ? `inset 0 0 ${size * 0.12}px rgba(150,180,255,0.4), 0 0 ${size * 0.2}px rgba(80,130,255,0.45)`
          : `inset 0 0 ${size * 0.08}px rgba(255,255,255,0.7), 0 0 ${size * 0.16}px rgba(170,160,255,0.45)`,
      }}>
        <canvas ref={canvasRef} style={{ width: size, height: size, display: "block", filter: `blur(${Math.max(0.5, size * 0.008)}px)` }} />
        <div style={{ position: "absolute", top: size * 0.1, left: size * 0.16, width: size * 0.4, height: size * 0.28, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,${dark ? 0.6 : 0.85}) 0%, transparent 65%)`, filter: `blur(${size * 0.02}px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${dark ? "rgba(180,205,255,0.5)" : "rgba(255,255,255,0.7)"}`, boxShadow: `inset 0 0 ${size * 0.04}px ${dark ? "rgba(210,225,255,0.55)" : "rgba(200,190,255,0.4)"}`, pointerEvents: "none" }} />
      </div>
    </div>
  );
}
