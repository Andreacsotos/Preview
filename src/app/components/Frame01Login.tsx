import { useState } from "react";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";

interface Props {
  onLogin: () => void;
  onHome?: () => void;
}

const ACCENT = "#2c6bf2";
const ERR = "#e5484d";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "login" | "email" | "code" | "reset" | "success";

export function Frame01Login({ onLogin, onHome }: Props) {
  const [step, setStep] = useState<Step>("login");
  const [showPass, setShowPass] = useState(false);

  // login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // recovery
  const [recEmail, setRecEmail] = useState("");
  const [recErr, setRecErr] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [resetErr, setResetErr] = useState<{ p?: string; c?: string }>({});

  const inputBox = (hasErr: boolean) => ({ background: "#fff", border: `1px solid ${hasErr ? ERR : "#E3E6EB"}` });

  const isLoginFormValid = email.trim() !== "" && password.trim() !== "";

  // ── handlers ──
  const handleLogin = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Ingresa tu correo.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "El correo no es válido.";
    if (!password) e.password = "Ingresa tu contraseña.";
    else if (password.length < 6) e.password = "La contraseña debe tener al menos 6 caracteres.";
    setErrors(e);
    if (Object.keys(e).length === 0) onLogin();
  };

  const sendCode = () => {
    if (!recEmail.trim()) { setRecErr("Ingresa tu correo."); return; }
    if (!EMAIL_RE.test(recEmail.trim())) { setRecErr("El correo no es válido."); return; }
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(generated);
    setRecErr("");
    setCode("");
    setStep("code");
    toast.success(`Código enviado a ${recEmail}`, { description: `Demo: tu código es ${generated}`, duration: 8000 });
  };

  const verifyCode = () => {
    if (code.length !== 6) { setCodeErr("Ingresa el código de 6 dígitos."); return; }
    if (code !== sentCode) { setCodeErr("El código es incorrecto."); return; }
    setCodeErr("");
    setStep("reset");
  };

  const saveNewPass = () => {
    const e: typeof resetErr = {};
    if (!newPass) e.p = "Crea una contraseña.";
    else if (newPass.length < 6) e.p = "La contraseña debe tener al menos 6 caracteres.";
    if (confirmPass !== newPass) e.c = "Las contraseñas no coinciden.";
    setResetErr(e);
    if (Object.keys(e).length === 0) setStep("success");
  };

  const backToLogin = () => {
    setStep("login"); setRecEmail(""); setCode(""); setSentCode(""); setNewPass(""); setConfirmPass("");
    setRecErr(""); setCodeErr(""); setResetErr({});
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bacalar:wght@100..900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        .ls-body { font-family: 'Roboto', sans-serif; }
        .ls-display { font-family: 'Bacalar', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em; }
        .ls-input::placeholder { color: #9aa3b2; }
        .ls-sso { transition: all 0.2s ease; cursor: pointer; }
        .ls-sso:hover { background: #f7f8fa !important; border-color: #c8cdd6 !important; }
        .ls-primary { transition: all 0.25s cubic-bezier(0.22,1,0.36,1); cursor: pointer; }
        .ls-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(44,107,242,0.4); }
      `}</style>

      <div className="ls-body relative h-screen w-full overflow-hidden flex" style={{ background: "#ffffff" }}>

        {/* ════ LEFT — dark card with mockup ════ */}
        <div className="hidden lg:block w-1/2 p-3">
          <div className="relative h-full rounded-[28px] overflow-hidden flex flex-col" style={{ background: "#030208" }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 90% 60% at 50% 30%, #000 20%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 60% at 50% 30%, #000 20%, transparent 80%)",
            }} />
            <div className="absolute pointer-events-none" style={{ bottom: "-15%", left: "50%", transform: "translateX(-50%)", width: 600, height: 500, background: "radial-gradient(circle, rgba(44,107,242,0.22) 0%, transparent 65%)", filter: "blur(70px)" }} />

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
                          <div className="absolute top-1.5 right-1.5 rounded-full" style={{ width: 15, height: 15, background: st === "ok" ? "#00C566" : st === "wait" ? "rgba(255,255,255,0.25)" : "#FFB020", border: "1.5px solid rgba(255,255,255,0.6)" }} />
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

        {/* ════ RIGHT — form ════ */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6">
          <div className="flex flex-col w-full" style={{ maxWidth: 380 }}>
            {/* logo */}
            <div onClick={onHome} className="flex items-center gap-3 justify-center mb-8 cursor-pointer">
              <img src="/ocx-logo.png" alt="OCX" style={{ height: 22, width: "auto", filter: "invert(1)" }} />
              <div className="h-6 w-px" style={{ background: "rgba(0,0,0,0.15)" }} />
              <span className="text-[18px] font-medium tracking-tight" style={{ color: "#0d1117" }}>View Studio</span>
            </div>

            {/* ─────── LOGIN ─────── */}
            {step === "login" && (
              <>
                <h1 className="text-center font-semibold mb-8" style={{ fontSize: 26, color: "#0d1117", letterSpacing: "-0.01em" }}>Inicia sesión en tu cuenta</h1>
                <button onClick={onLogin} className="ls-sso w-full h-[48px] rounded-xl flex items-center justify-center gap-2.5 text-[14px] font-medium mb-6" style={{ background: "#fff", border: "1px solid #E3E6EB", color: "#0d1117" }}>
                  <Lock size={15} /> Continuar con SSO
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px" style={{ background: "#E3E6EB" }} /><span className="text-[12px]" style={{ color: "#9aa3b2" }}>o</span><div className="flex-1 h-px" style={{ background: "#E3E6EB" }} />
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="w-full h-[50px] rounded-xl px-4 flex items-center" style={inputBox(!!errors.email)}>
                      <input type="email" required value={email} placeholder="Correo laboral" className="ls-input flex-1 bg-transparent outline-none text-[14px]" style={{ color: "#0d1117", caretColor: ACCENT }}
                        onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                        onKeyDown={(e) => e.key === "Enter" && isLoginFormValid && handleLogin()} />
                    </div>
                    {errors.email && <p className="text-[12px] mt-1.5 ml-1" style={{ color: ERR }}>{errors.email}</p>}
                  </div>
                  <div>
                    <div className="w-full h-[50px] rounded-xl px-4 flex items-center gap-2" style={inputBox(!!errors.password)}>
                      <input type={showPass ? "text" : "password"} required value={password} placeholder="Contraseña" className="ls-input flex-1 bg-transparent outline-none text-[14px]" style={{ color: "#0d1117", caretColor: ACCENT }}
                        onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                        onKeyDown={(e) => e.key === "Enter" && isLoginFormValid && handleLogin()} />
                      <button onClick={() => setShowPass(!showPass)} className="cursor-pointer" style={{ color: "#9aa3b2" }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                    {errors.password && <p className="text-[12px] mt-1.5 ml-1" style={{ color: ERR }}>{errors.password}</p>}
                  </div>
                </div>
                <span onClick={() => setStep("email")} className="text-[13px] font-medium mt-3 cursor-pointer w-fit" style={{ color: ACCENT }}>¿Olvidaste tu contraseña?</span>
                <button onClick={handleLogin} disabled={!isLoginFormValid} className="ls-primary w-full h-[50px] rounded-xl text-[15px] font-semibold mt-5 text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none" style={{ background: ACCENT }}>Continuar</button>
              </>
            )}

            {/* ─────── FORGOT: EMAIL ─────── */}
            {step === "email" && (
              <>
                <h1 className="text-center font-semibold mb-2" style={{ fontSize: 24, color: "#0d1117", letterSpacing: "-0.01em" }}>Recuperar contraseña</h1>
                <p className="text-center text-[14px] mb-8" style={{ color: "#5b6473" }}>Ingresa tu correo y te enviaremos un código de verificación.</p>
                <div>
                  <div className="w-full h-[50px] rounded-xl px-4 flex items-center" style={inputBox(!!recErr)}>
                    <input type="email" value={recEmail} placeholder="Correo laboral" className="ls-input flex-1 bg-transparent outline-none text-[14px]" style={{ color: "#0d1117", caretColor: ACCENT }}
                      onChange={(e) => { setRecEmail(e.target.value); if (recErr) setRecErr(""); }}
                      onKeyDown={(e) => e.key === "Enter" && sendCode()} />
                  </div>
                  {recErr && <p className="text-[12px] mt-1.5 ml-1" style={{ color: ERR }}>{recErr}</p>}
                </div>
                <button onClick={sendCode} className="ls-primary w-full h-[50px] rounded-xl text-[15px] font-semibold mt-5 text-white" style={{ background: ACCENT }}>Enviar código</button>
                <button onClick={backToLogin} className="flex items-center justify-center gap-1.5 text-[13px] font-medium mt-6 cursor-pointer" style={{ color: "#5b6473" }}><ArrowLeft size={14} /> Volver a iniciar sesión</button>
              </>
            )}

            {/* ─────── FORGOT: CODE ─────── */}
            {step === "code" && (
              <>
                <h1 className="text-center font-semibold mb-2" style={{ fontSize: 24, color: "#0d1117", letterSpacing: "-0.01em" }}>Ingresa el código</h1>
                <p className="text-center text-[14px] mb-8" style={{ color: "#5b6473" }}>Enviamos un código de 6 dígitos a <span className="font-medium" style={{ color: "#0d1117" }}>{recEmail}</span>.</p>
                <div>
                  <div className="w-full h-[50px] rounded-xl px-4 flex items-center" style={inputBox(!!codeErr)}>
                    <input inputMode="numeric" maxLength={6} value={code} placeholder="••••••" className="ls-input flex-1 bg-transparent outline-none text-[18px] tracking-[0.4em] text-center" style={{ color: "#0d1117", caretColor: ACCENT }}
                      onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); if (codeErr) setCodeErr(""); }}
                      onKeyDown={(e) => e.key === "Enter" && verifyCode()} />
                  </div>
                  {codeErr && <p className="text-[12px] mt-1.5 ml-1" style={{ color: ERR }}>{codeErr}</p>}
                </div>
                <button onClick={verifyCode} className="ls-primary w-full h-[50px] rounded-xl text-[15px] font-semibold mt-5 text-white" style={{ background: ACCENT }}>Verificar</button>
                <p className="text-[13px] text-center mt-5" style={{ color: "#5b6473" }}>¿No te llegó? <span onClick={sendCode} className="cursor-pointer font-medium" style={{ color: ACCENT }}>Reenviar código</span></p>
                <button onClick={backToLogin} className="flex items-center justify-center gap-1.5 text-[13px] font-medium mt-4 cursor-pointer" style={{ color: "#5b6473" }}><ArrowLeft size={14} /> Volver a iniciar sesión</button>
              </>
            )}

            {/* ─────── FORGOT: RESET ─────── */}
            {step === "reset" && (
              <>
                <h1 className="text-center font-semibold mb-2" style={{ fontSize: 24, color: "#0d1117", letterSpacing: "-0.01em" }}>Nueva contraseña</h1>
                <p className="text-center text-[14px] mb-8" style={{ color: "#5b6473" }}>Crea una contraseña nueva para tu cuenta.</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="w-full h-[50px] rounded-xl px-4 flex items-center gap-2" style={inputBox(!!resetErr.p)}>
                      <input type={showPass ? "text" : "password"} value={newPass} placeholder="Nueva contraseña" className="ls-input flex-1 bg-transparent outline-none text-[14px]" style={{ color: "#0d1117", caretColor: ACCENT }}
                        onChange={(e) => { setNewPass(e.target.value); if (resetErr.p) setResetErr((p) => ({ ...p, p: undefined })); }} />
                      <button onClick={() => setShowPass(!showPass)} className="cursor-pointer" style={{ color: "#9aa3b2" }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                    {resetErr.p && <p className="text-[12px] mt-1.5 ml-1" style={{ color: ERR }}>{resetErr.p}</p>}
                  </div>
                  <div>
                    <div className="w-full h-[50px] rounded-xl px-4 flex items-center" style={inputBox(!!resetErr.c)}>
                      <input type={showPass ? "text" : "password"} value={confirmPass} placeholder="Confirmar contraseña" className="ls-input flex-1 bg-transparent outline-none text-[14px]" style={{ color: "#0d1117", caretColor: ACCENT }}
                        onChange={(e) => { setConfirmPass(e.target.value); if (resetErr.c) setResetErr((p) => ({ ...p, c: undefined })); }}
                        onKeyDown={(e) => e.key === "Enter" && saveNewPass()} />
                    </div>
                    {resetErr.c && <p className="text-[12px] mt-1.5 ml-1" style={{ color: ERR }}>{resetErr.c}</p>}
                  </div>
                </div>
                <button onClick={saveNewPass} className="ls-primary w-full h-[50px] rounded-xl text-[15px] font-semibold mt-5 text-white" style={{ background: ACCENT }}>Guardar contraseña</button>
              </>
            )}

            {/* ─────── SUCCESS ─────── */}
            {step === "success" && (
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(0,197,102,0.12)", border: "1px solid rgba(0,197,102,0.4)" }}>
                  <Check size={26} style={{ color: "#00C566" }} />
                </div>
                <h1 className="font-semibold mb-2" style={{ fontSize: 24, color: "#0d1117" }}>¡Contraseña actualizada!</h1>
                <p className="text-[14px] mb-8" style={{ color: "#5b6473", maxWidth: 300 }}>Tu contraseña se cambió correctamente. Ya puedes iniciar sesión.</p>
                <button onClick={backToLogin} className="ls-primary w-full h-[50px] rounded-xl text-[15px] font-semibold text-white" style={{ background: ACCENT }}>Volver a iniciar sesión</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
