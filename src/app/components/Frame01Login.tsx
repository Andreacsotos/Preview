import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import svgPaths from "@/imports/Logo-1/svg-kd82b58p62";

interface Props {
  onLogin: () => void;
}

// Inline dark-mode logo — white mark + "PreviewStudio" in white
function DarkLogo() {
  return (
    <div className="flex items-center gap-[14px]">
      {/* Icon container */}
      <div
        className="flex items-center justify-center rounded-[8px] shrink-0"
        style={{
          width: 38,
          height: 38,
          background: "linear-gradient(135deg, #1C1C1C 0%, #252525 100%)",
          border: "1px solid #2E2E2E",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        <svg width="21" height="17" viewBox="0 0 20.5018 16.4014" fill="none">
          <path d={svgPaths.pfc8bc00} fill="white" />
          <path d={svgPaths.p2c9417f2} fill="white" />
        </svg>
      </div>
      {/* Wordmark */}
      <span
        className="font-semibold tracking-[-0.8px] whitespace-nowrap"
        style={{ fontSize: 22, color: "#F9FAFB", fontFamily: "Inter, sans-serif" }}
      >
        PreviewStudio
      </span>
    </div>
  );
}

// Tiled background texture built from the logo mark paths
function LogoTexture() {
  // Place logo marks in a loose grid across the panel — various sizes & rotations
  const marks = [
    { x: -30,  y: -20,  scale: 7,   rotate: 0,   opacity: 0.045 },
    { x: 180,  y: 80,   scale: 4.5, rotate: 15,  opacity: 0.03  },
    { x: 340,  y: -40,  scale: 9,   rotate: -8,  opacity: 0.025 },
    { x: 60,   y: 200,  scale: 5.5, rotate: 5,   opacity: 0.035 },
    { x: 260,  y: 220,  scale: 3.5, rotate: -20, opacity: 0.04  },
    { x: 420,  y: 160,  scale: 6,   rotate: 10,  opacity: 0.03  },
    { x: 100,  y: 380,  scale: 8,   rotate: -5,  opacity: 0.025 },
    { x: 310,  y: 380,  scale: 4,   rotate: 18,  opacity: 0.035 },
    { x: 480,  y: 340,  scale: 5,   rotate: -12, opacity: 0.03  },
    { x: -20,  y: 500,  scale: 6.5, rotate: 8,   opacity: 0.025 },
    { x: 220,  y: 520,  scale: 3,   rotate: -3,  opacity: 0.04  },
    { x: 420,  y: 500,  scale: 7.5, rotate: 22,  opacity: 0.03  },
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      {marks.map((m, i) => {
        const w = 20.5018 * m.scale;
        const h = 16.4014 * m.scale;
        return (
          <g
            key={i}
            transform={`translate(${m.x + w / 2}, ${m.y + h / 2}) rotate(${m.rotate}) translate(${-w / 2}, ${-h / 2})`}
            opacity={m.opacity}
          >
            <svg
              x={0}
              y={0}
              width={w}
              height={h}
              viewBox="0 0 20.5018 16.4014"
              fill="none"
              overflow="visible"
            >
              <path d={svgPaths.pfc8bc00} fill="white" />
              <path d={svgPaths.p2c9417f2} fill="white" />
            </svg>
          </g>
        );
      })}
    </svg>
  );
}

export function Frame01Login({ onLogin }: Props) {
  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ background: "#0B0B0B" }}>
      {/* LEFT SIDE */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 left-0 w-1/2 overflow-hidden"
        style={{ background: "#111111", borderRight: "1px solid #1C1C1C" }}
      >
        {/* Subtle logo-shape texture */}
        <LogoTexture />

        {/* Brand mark — main focus */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute top-[52px] left-[64px]"
        >
          <DarkLogo />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="absolute bottom-[56px] left-[64px] right-[64px]"
        >
          <p style={{ color: "#F3F4F6" }} className="mb-4 text-[28px] font-semibold leading-[35px] tracking-[-0.22px]">
            Turn campaign assets into<br />client-ready previews instantly.
          </p>
          <p style={{ color: "#6B7280" }} className="text-[14px] leading-[22.4px] tracking-[-0.15px]">
            Automated layout detection, smart grouping, and<br />one-click sharing — all in one workspace.
          </p>
        </motion.div>
      </motion.div>

      {/* RIGHT SIDE */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 left-1/2 w-1/2 flex flex-col items-center justify-center"
        style={{ background: "#0D0D0D" }}
      >
        <div className="flex flex-col gap-[34px]">
          {/* Login header */}
          <div className="flex flex-col gap-[9px] w-[368px]">
            <h2 style={{ color: "#F9FAFB" }} className="text-[23px] font-semibold leading-[34.53px] tracking-[-0.98px]">
              Welcome back
            </h2>
            <p style={{ color: "#9CA3AF" }} className="text-[15px] leading-[22.44px] tracking-[-0.09px]">
              Sign in with your company account to continue.
            </p>
          </div>

          {/* SSO Button — gradient preserved */}
          <motion.button
            whileHover={{
              scale: 1.02,
              y: -2,
              boxShadow: "0 8px 24px rgba(226, 62, 130, 0.3)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogin}
            className="w-[368px] h-[56px] flex items-center justify-between text-white rounded-[16px] px-[23px] py-[16px] cursor-pointer"
            style={{ backgroundImage: "linear-gradient(90deg, rgb(226, 62, 130) 2.4701%, rgb(103, 21, 175) 32.022%, rgb(103, 21, 175) 69.429%, rgb(75, 200, 240) 98.578%)" }}
          >
            <span className="text-[16px] font-medium tracking-[-0.17px]">Continue with SSO</span>
            <ArrowRight size={17} />
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-[6px] w-[368px]">
            <div className="flex-1 h-px" style={{ background: "#1F1F1F" }} />
            <span style={{ color: "#4B5563" }} className="text-[12px] tracking-[0.07px]">or</span>
            <div className="flex-1 h-px" style={{ background: "#1F1F1F" }} />
          </div>

          {/* Email section */}
          <div className="flex flex-col gap-[14px] w-[368px]">
            <div
              className="w-full h-[54px] rounded-[16px] px-[18px] flex items-center transition-colors duration-200"
              style={{ background: "#161616", border: "1px solid #262626" }}
            >
              <input
                type="email"
                placeholder="Work email address"
                className="flex-1 bg-transparent outline-none text-[16px] tracking-[-0.17px]"
                style={{ color: "#F9FAFB", caretColor: "#F9FAFB" }}
                onFocus={(e) => ((e.currentTarget.parentElement as HTMLElement).style.borderColor = "#374151")}
                onBlur={(e) => ((e.currentTarget.parentElement as HTMLElement).style.borderColor = "#262626")}
              />
            </div>
            <style>{`input[type="email"]::placeholder { color: #4B5563; }`}</style>
            <button
              onClick={onLogin}
              className="w-full h-[54px] rounded-[16px] text-[14px] font-medium cursor-pointer transition-all duration-200"
              style={{ background: "#161616", border: "1px solid #262626", color: "#D1D5DB" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1C1C1C";
                e.currentTarget.style.borderColor = "#3F3F46";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#161616";
                e.currentTarget.style.borderColor = "#262626";
              }}
            >
              Continue with email
            </button>
          </div>

          {/* Security + Terms */}
          <div className="flex flex-col gap-[8px] w-[368px]">
            <div className="flex items-center gap-[9px]">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#374151" }} />
              <p style={{ color: "#6B7280" }} className="text-[12px] leading-[18.99px] tracking-[0.07px]">
                Enterprise SSO · SOC 2 Type II · End-to-end encrypted
              </p>
            </div>
            <p style={{ color: "#4B5563" }} className="text-[11px]">
              By continuing, you agree to our{" "}
              <span style={{ color: "#6B7280" }} className="underline cursor-pointer">Terms</span> and{" "}
              <span style={{ color: "#6B7280" }} className="underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
