import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface Props {
  onSignup: () => void;
  onSignIn: () => void;
  onHome?: () => void;
}

const ACCENT = "#2c6bf2";

export function Frame01bSignup({ onSignup, onSignIn, onHome }: Props) {
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const e: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) e.name = "Ingresa tu nombre.";
    if (!email.trim()) e.email = "Ingresa tu correo.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "El correo no es válido.";
    if (!password) e.password = "Crea una contraseña.";
    else if (password.length < 6) e.password = "La contraseña debe tener al menos 6 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSignup(); };

  const errBorder = "#e5484d";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bacalar:wght@100..900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        .su-body { font-family: 'Roboto', sans-serif; }
        .su-display { font-family: 'Bacalar', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em; }
        .su-input::placeholder { color: #9aa3b2; }
        .su-sso { transition: all 0.2s ease; cursor: pointer; }
        .su-sso:hover { background: #f7f8fa !important; border-color: #c8cdd6 !important; }
        .su-primary { transition: all 0.25s cubic-bezier(0.22,1,0.36,1); cursor: pointer; }
        .su-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(44,107,242,0.4); }
      `}</style>

      <div className="su-body relative h-screen w-full overflow-hidden flex" style={{ background: "#ffffff" }}>

        {/* ════ LEFT — dark promo card ════ */}
        <div className="hidden lg:block w-1/2 p-3">
          <div className="relative h-full rounded-[28px] overflow-hidden flex flex-col" style={{ background: "#030208" }}>
            {/* grid reticle */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 90% 60% at 50% 30%, #000 20%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 60% at 50% 30%, #000 20%, transparent 80%)",
            }} />
            {/* blue glow */}
            <div className="absolute pointer-events-none" style={{ bottom: "-15%", left: "50%", transform: "translateX(-50%)", width: 600, height: 500, background: "radial-gradient(circle, rgba(44,107,242,0.22) 0%, transparent 65%)", filter: "blur(70px)" }} />

            {/* mockup — centered */}
            <div className="relative flex-1 flex items-center justify-center p-10">
              <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: 460, background: "#0e1018", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 80px rgba(0,0,0,0.45)" }}>
                <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-white text-[13px] font-semibold leading-tight">Spring Launch 2026</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Nike · 12 assets · Ronda 2</p>
                  </div>
                  <div className="h-7 px-3 rounded-md flex items-center" style={{ background: ACCENT }}><span className="text-white text-[10px] font-medium">Compartir</span></div>
                </div>
                <div className="grid grid-cols-4 gap-2.5 p-4">
                  {["#aec4ff","#cdd6e6","#5b7cf0","#2c6bf2"].map((c, i) => {
                    const st = ["ok","ok","wait","edit"][i];
                    return (
                      <div key={i} className="rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="h-16 relative" style={{ background: `linear-gradient(135deg, ${c}, rgba(255,255,255,0.04))` }}>
                          <div className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center" style={{ width: 15, height: 15, background: st === "ok" ? "#00C566" : st === "wait" ? "rgba(0,0,0,0.45)" : "#FFB020", border: "1.5px solid rgba(255,255,255,0.6)" }}>
                            {st === "ok" && <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            {st === "edit" && <span className="text-white text-[8px] font-bold">!</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 pb-4">
                  <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-medium mb-2.5" style={{ color: "rgba(255,255,255,0.6)" }}>Comentarios del cliente</p>
                    {[{ a: true, t: "¡Me encanta el nuevo banner! Aprobado." }, { a: false, t: "¿Podemos agrandar el logo?" }].map((m, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                        <div className="w-5 h-5 rounded-full shrink-0" style={{ background: m.a ? ACCENT : "rgba(255,255,255,0.25)" }} />
                        <div className="rounded-md px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.05)" }}><span className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>{m.t}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT — form (light) ════ */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6">
          <div className="flex flex-col w-full" style={{ maxWidth: 380 }}>
            {/* logo */}
            <div onClick={onHome} className="flex items-center gap-3 justify-center mb-8 cursor-pointer">
              <img src="/ocx-logo.png" alt="OCX" style={{ height: 22, width: "auto", filter: "invert(1)" }} />
              <div className="h-6 w-px" style={{ background: "rgba(0,0,0,0.15)" }} />
              <span className="text-[18px] font-medium tracking-tight" style={{ color: "#0d1117" }}>View Studio</span>
            </div>

            <h1 className="text-center font-semibold mb-8" style={{ fontSize: 26, color: "#0d1117", letterSpacing: "-0.01em" }}>
              Crea tu cuenta
            </h1>

            {/* SSO */}
            <div className="flex flex-col gap-2.5 mb-6">
              <button onClick={onSignup} className="su-sso w-full h-[48px] rounded-xl flex items-center justify-center gap-2.5 text-[14px] font-medium" style={{ background: "#fff", border: "1px solid #E3E6EB", color: "#0d1117" }}>
                <Lock size={15} /> Registrarse con SSO
              </button>
            </div>

            {/* divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: "#E3E6EB" }} />
              <span className="text-[12px]" style={{ color: "#9aa3b2" }}>o</span>
              <div className="flex-1 h-px" style={{ background: "#E3E6EB" }} />
            </div>

            {/* fields */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="w-full h-[50px] rounded-xl px-4 flex items-center" style={{ background: "#fff", border: `1px solid ${errors.name ? errBorder : "#E3E6EB"}` }}>
                  <input type="text" value={name} placeholder="Nombre completo" className="su-input flex-1 bg-transparent outline-none text-[14px]" style={{ color: "#0d1117", caretColor: ACCENT }}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    onFocus={(e) => { if (!errors.name) (e.currentTarget.parentElement as HTMLElement).style.borderColor = ACCENT; }}
                    onBlur={(e) => { if (!errors.name) (e.currentTarget.parentElement as HTMLElement).style.borderColor = "#E3E6EB"; }} />
                </div>
                {errors.name && <p className="text-[12px] mt-1.5 ml-1" style={{ color: errBorder }}>{errors.name}</p>}
              </div>
              <div>
                <div className="w-full h-[50px] rounded-xl px-4 flex items-center" style={{ background: "#fff", border: `1px solid ${errors.email ? errBorder : "#E3E6EB"}` }}>
                  <input type="email" value={email} placeholder="Correo laboral" className="su-input flex-1 bg-transparent outline-none text-[14px]" style={{ color: "#0d1117", caretColor: ACCENT }}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    onFocus={(e) => { if (!errors.email) (e.currentTarget.parentElement as HTMLElement).style.borderColor = ACCENT; }}
                    onBlur={(e) => { if (!errors.email) (e.currentTarget.parentElement as HTMLElement).style.borderColor = "#E3E6EB"; }} />
                </div>
                {errors.email && <p className="text-[12px] mt-1.5 ml-1" style={{ color: errBorder }}>{errors.email}</p>}
              </div>
              <div>
                <div className="w-full h-[50px] rounded-xl px-4 flex items-center gap-2" style={{ background: "#fff", border: `1px solid ${errors.password ? errBorder : "#E3E6EB"}` }}>
                  <input type={showPass ? "text" : "password"} value={password} placeholder="Crear una contraseña" className="su-input flex-1 bg-transparent outline-none text-[14px]" style={{ color: "#0d1117", caretColor: ACCENT }}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    onFocus={(e) => { if (!errors.password) (e.currentTarget.parentElement as HTMLElement).style.borderColor = ACCENT; }}
                    onBlur={(e) => { if (!errors.password) (e.currentTarget.parentElement as HTMLElement).style.borderColor = "#E3E6EB"; }} />
                  <button onClick={() => setShowPass(!showPass)} className="cursor-pointer" style={{ color: "#9aa3b2" }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                {errors.password && <p className="text-[12px] mt-1.5 ml-1" style={{ color: errBorder }}>{errors.password}</p>}
              </div>
            </div>

            <button onClick={handleSubmit} className="su-primary w-full h-[50px] rounded-xl text-[15px] font-semibold mt-5 text-white" style={{ background: ACCENT }}>
              Crear cuenta
            </button>

            <p className="text-[13px] text-center mt-6" style={{ color: "#5b6473" }}>
              ¿Ya tienes cuenta?{" "}
              <span onClick={onSignIn} className="cursor-pointer font-medium" style={{ color: ACCENT }}>Iniciar sesión</span>
            </p>

            <p className="text-[11px] text-center mt-4" style={{ color: "#9aa3b2" }}>
              Al continuar, aceptas nuestros{" "}
              <span className="underline cursor-pointer" style={{ color: "#5b6473" }}>Términos</span> y{" "}
              <span className="underline cursor-pointer" style={{ color: "#5b6473" }}>Política de privacidad</span>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
