import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster, toast } from "sonner";
import { NavContext } from "./components/TopBarComponents";
import { AIAssistant } from "./components/AIAssistant";
import { CreateChoiceModal } from "./components/CreateChoiceModal";
import { Frame00Home } from "./components/Frame00Home";
import { Frame01Login } from "./components/Frame01Login";
import { Frame01bSignup } from "./components/Frame01bSignup";
import { Frame01cLoading } from "./components/Frame01cLoading";
import { Frame02Dashboard } from "./components/Frame02Dashboard";
import { Frame02bCampaignList } from "./components/Frame02bCampaignList";
import { Frame02cAccountList } from "./components/Frame02cAccountList";
import { Frame02cAccountDetail } from "./components/Frame02cAccountDetail";
import { Frame02dAprobaciones } from "./components/Frame02dAprobaciones";
import { Frame02eSettings } from "./components/Frame02eSettings";
import { Frame02fHelp } from "./components/Frame02fHelp";
import { Frame02gCreateAI } from "./components/Frame02gCreateAI";
import { Frame02hCreateChoice } from "./components/Frame02hCreateChoice";
import { Frame03CampaignSetup } from "./components/Frame03CampaignSetup";
import { Frame04PreviewBuilder } from "./components/Frame04PreviewBuilder";
import { Frame05Presentation } from "./components/Frame05Presentation";
import { FrameBlog } from "./components/FrameBlog";

type Screen =
  | "home"
  | "login"
  | "signup"
  | "loading"
  | "dashboard"
  | "campaigns"
  | "accounts"
  | "account-detail"
  | "approvals"
  | "settings"
  | "help"
  | "create-choice"
  | "create-ai"
  | "campaign-detail"
  | "builder"
  | "presentation"
  | "blog";

export interface UploadedPiece {
  id: string;
  name: string;
  dim: string;
  ar: number;
  imageUrl: string;
  fileType?: "image" | "video" | "html" | "htmlbanner";
  fileName?: string;
}

// Pieza tal como vive en el builder (superset de UploadedPiece con campos editables)
export interface BuilderPiece {
  id: string;
  name: string;
  dim: string;
  ar: number;
  imageUrl?: string;
  fileType?: "image" | "video" | "html" | "htmlbanner";
  fileName?: string;
  brand?: string;
  legal?: string;
  title?: string;
}

// Estado editable del Preview Builder — se persiste aquí para que la
// Presentación muestre exactamente lo mismo que se armó en el builder
export interface BuilderState {
  groups: Record<string, Record<string, BuilderPiece[]>>;
  introData: Record<string, { title: string; subtitle: string }>;
  piecesData: Record<string, Partial<{ name: string; title: string }>>;
  slideLegals: Record<string, { legal: string; brand: string }>;
  adCopyData: Record<string, { copy: string; headline: string; subtext: string }>;
  measuredAr: Record<string, number>;
}

export interface CampaignState {
  campaignName: string;
  selectedFormats: string[];
  includeCover: boolean;
  coverTemplate: string;
  clientName: string;
  shippingDate: string;
  reviewRound: string;
  brandColor: string;
  brandColors: string[];
  brandFont: string | null;
  selectedBg: string;
  logoName: string | null;
  logoUrl: string | null;
  heroName: string | null;
  heroUrl: string | null;
  uploadedPlatforms: string[];
  uploadedPieces: Record<string, UploadedPiece[]>;
  uploadedGroups: Record<string, Record<string, UploadedPiece[]>>;
  builderState?: BuilderState;
}

const DEFAULT_CAMPAIGN: CampaignState = {
  campaignName: "",
  selectedFormats: [],
  includeCover: true,
  coverTemplate: "classic",
  clientName: "",
  shippingDate: "",
  reviewRound: "",
  brandColor: "",
  brandColors: [],
  brandFont: null,
  selectedBg: "dark",
  logoName: null,
  logoUrl: null,
  heroName: null,
  heroUrl: null,
  uploadedPlatforms: [],
  uploadedPieces: {},
  uploadedGroups: {},
};

const FRAME_NAV: { key: Screen; label: string; num: string }[] = [
  { key: "home",            label: "Home",            num: "00" },
  { key: "blog",            label: "Blog / Academy",  num: "00b" },
  { key: "login",           label: "Login",           num: "01" },
  { key: "signup",          label: "Sign Up",         num: "01b" },
  { key: "loading",         label: "Loading",         num: "01c" },
  { key: "create-ai",       label: "Assistant",       num: "02g" },
  { key: "dashboard",       label: "Dashboard",       num: "02" },
  { key: "campaigns",       label: "Campaigns",       num: "02b" },
  { key: "accounts",        label: "Accounts",        num: "02c" },
  { key: "approvals",       label: "Approvals",       num: "02d" },
  { key: "campaign-detail", label: "Campaign Detail", num: "03" },
  { key: "builder",         label: "Preview Builder", num: "04" },
  { key: "presentation",    label: "Presentation",    num: "05" },
  { key: "settings",        label: "Settings",        num: "02e" },
  { key: "help",            label: "Help",            num: "02f" },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [showNav, setShowNav] = useState(false);
  const [campaign, setCampaign] = useState<CampaignState>(DEFAULT_CAMPAIGN);
  const [dark, setDark] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState("Éxito");
  const [settingsTab, setSettingsTab] = useState<"perfil" | "cuenta" | "apariencia" | "notificaciones">("perfil");
  const goSettings = (tab: "perfil" | "cuenta" | "apariencia" | "notificaciones") => { setSettingsTab(tab); setScreen("settings"); };
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [cookieAccepted, setCookieAccepted] = useState<boolean | null>(null);
  const PUBLIC_SCREENS: Screen[] = ["home", "login", "signup", "loading", "blog"];
  const showAssistant = !PUBLIC_SCREENS.includes(screen) && screen !== "create-ai";

  const go = (s: Screen) => setScreen(s);
  const updateCampaign = (updates: Partial<CampaignState>) =>
    setCampaign((prev) => ({ ...prev, ...updates }));

  return (
    <NavContext.Provider value={{
      goSettings,
      goHelp: () => go("help"),
      onLogout: () => go("home"),
      openAssistant: () => setAssistantOpen(true),
      goCreateAI: () => go("create-ai"),
      goDashboard: () => go("dashboard"),
      goCampaigns: () => go("campaigns"),
      goAccounts: () => go("accounts"),
      goApprovals: () => go("approvals"),
      collapsed: sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((v) => !v),
    }}>
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Toaster position="bottom-center" richColors />
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          {screen === "home" && (
            <Frame00Home
              onGetStarted={() => go("signup")}
              onSignIn={() => go("login")}
              onBlog={() => go("blog")}
            />
          )}
          {screen === "blog" && (
            <FrameBlog onBack={() => go("home")} onGetStarted={() => go("signup")} />
          )}
          {screen === "login" && (
            <Frame01Login onLogin={() => go("loading")} onCreateAccount={() => go("signup")} onHome={() => go("home")} />
          )}
          {screen === "signup" && (
            <Frame01bSignup
              onSignup={() => go("loading")}
              onSignIn={() => go("login")}
              onHome={() => go("home")}
            />
          )}
          {screen === "loading" && (
            <Frame01cLoading onDone={() => go("create-ai")} dark={dark} />
          )}
          {screen === "dashboard" && (
            <Frame02Dashboard
              onNewCampaign={(name: string) => { updateCampaign({ campaignName: name }); go("campaign-detail"); }}
              onNewCampaignChoice={() => setChoiceOpen(true)}
              onOpenCampaign={() => go("campaign-detail")}
              onViewCampaigns={() => go("campaigns")}
              onViewAccounts={() => go("accounts")}
              onViewApprovals={() => go("approvals")}
              onLogout={() => go("home")}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "campaigns" && (
            <Frame02bCampaignList
              onBack={() => go("dashboard")}
              onNewCampaign={() => setChoiceOpen(true)}
              onOpenCampaign={() => go("campaign-detail")}
              onViewAccounts={() => go("accounts")}
              onViewApprovals={() => go("approvals")}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "accounts" && (
            <Frame02cAccountList
              onBack={() => go("dashboard")}
              onNewBrand={() => toast.info("Crear nueva marca")}
              onOpenBrand={(brand: string) => { setSelectedBrand(brand); go("account-detail"); }}
              onViewCampaigns={() => go("campaigns")}
              onViewApprovals={() => go("approvals")}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "account-detail" && (
            <Frame02cAccountDetail
              onBack={() => go("accounts")}
              onViewDashboard={() => go("dashboard")}
              onViewCampaigns={() => go("campaigns")}
              onNewCampaign={() => setChoiceOpen(true)}
              onViewApprovals={() => go("approvals")}
              brandName={selectedBrand}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "approvals" && (
            <Frame02dAprobaciones
              onBack={() => go("dashboard")}
              onViewCampaigns={() => go("campaigns")}
              onViewAccounts={() => go("accounts")}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "settings" && (
            <Frame02eSettings
              onBack={() => go("dashboard")}
              initialTab={settingsTab}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "help" && (
            <Frame02fHelp
              onBack={() => go("dashboard")}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "create-choice" && (
            <Frame02hCreateChoice
              onBack={() => go("campaigns")}
              onManual={() => go("campaign-detail")}
              onAI={() => go("create-ai")}
              dark={dark}
            />
          )}
          {screen === "create-ai" && (
            <Frame02gCreateAI
              onBack={() => go("dashboard")}
              onCreateCampaign={({ name, brand, formats, assets, date, round, template }) => {
                const grouped: Record<string, UploadedPiece[]> = {};
                const order: string[] = [];
                assets.filter((a) => a.type === "image" || a.type === "video" || a.type === "htmlbanner").forEach((a) => {
                  if (!(a.format in grouped)) { grouped[a.format] = []; order.push(a.format); }
                  grouped[a.format].push({
                    id: a.id,
                    name: a.name.replace(/\.[^.]+$/, ""),
                    dim: a.dim,
                    ar: a.ar,
                    imageUrl: a.url,
                    fileType: a.type === "video" ? "video" : a.type === "htmlbanner" ? "html" : "image",
                    fileName: a.name,
                  });
                });
                updateCampaign({
                  campaignName: name,
                  clientName: brand,
                  selectedFormats: formats,
                  uploadedPlatforms: order,
                  uploadedPieces: grouped,
                  shippingDate: date ?? "",
                  reviewRound: round ?? "",
                  // plantilla de portada elegida en el chat (Classic/Bold/Minimal/Brand)
                  coverTemplate: (template ?? "classic").toLowerCase(),
                });
                toast.success(`Campaña "${name}" creada`);
                go("builder");
              }}
              onCreateBrand={({ name }) => {
                toast.success(`Marca "${name}" creada`);
                go("accounts");
              }}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "campaign-detail" && (
            <Frame03CampaignSetup
              onBack={() => go("campaigns")}
              onGoToDashboard={() => go("dashboard")}
              onOpenBuilder={() => go("builder")}
              campaign={campaign}
              onUpdate={updateCampaign}
              dark={dark}
              setDark={setDark}
            />
          )}
          {screen === "builder" && (
            <Frame04PreviewBuilder
              onBack={() => go("campaign-detail")}
              onPresent={() => go("presentation")}
              campaign={campaign}
              onUpdate={updateCampaign}
            />
          )}
          {screen === "presentation" && (
            <Frame05Presentation
              onExit={() => go("builder")}
              campaign={campaign}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* FRAME NAVIGATOR */}
      <div
        className="fixed bottom-5 right-5 z-50"
        onMouseEnter={() => setShowNav(true)}
        onMouseLeave={() => setShowNav(false)}
      >
        <AnimatePresence>
          {showNav && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
              style={{ minWidth: "200px" }}
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-gray-400" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Screen Flow
                </p>
              </div>
              <div className="p-2">
                {FRAME_NAV.map(({ key, label, num }) => (
                  <button
                    key={key}
                    onClick={() => go(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer text-left ${
                      screen === key ? "bg-gray-900" : "hover:bg-gray-50"
                    }`}
                    style={{ transition: "all 0.1s" }}
                  >
                    <span
                      className={screen === key ? "text-gray-500" : "text-gray-300"}
                      style={{ fontSize: "10px", fontWeight: 600, minWidth: "16px" }}
                    >
                      {num}
                    </span>
                    <span
                      className={screen === key ? "text-white" : "text-gray-600"}
                      style={{ fontSize: "12px", fontWeight: screen === key ? 600 : 400 }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowNav(!showNav)}
          className="flex items-center gap-2 bg-gray-900 text-white rounded-2xl px-4 py-2.5 shadow-lg cursor-pointer ml-auto"
          style={{ fontSize: "12px", fontWeight: 500 }}
        >
          <span className="text-gray-500" style={{ fontSize: "10px", fontWeight: 700 }}>
            {FRAME_NAV.find((f) => f.key === screen)?.num}
          </span>
          <span>{FRAME_NAV.find((f) => f.key === screen)?.label}</span>
          <div className="flex items-center gap-0.5">
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
          </div>
        </motion.button>
      </div>


      {/* Cookie banner */}
      <AnimatePresence>
        {cookieAccepted === null && screen === "home" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 1.5 } }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
            className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 px-4 py-4 rounded-xl shadow-xl"
            style={{ background: "#ffffff", border: "1px solid #e9ebef", boxShadow: "0 6px 28px rgba(0,0,0,0.12)", maxWidth: 280, fontFamily: "'Roboto', sans-serif" }}
          >
            <p className="text-[12px] leading-relaxed" style={{ color: "#5b6473" }}>
              Usamos cookies para mejorar tu experiencia. Al continuar, aceptas nuestra{" "}
              <span className="underline cursor-pointer" style={{ color: "#2c6bf2" }}>política de privacidad</span>.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCookieAccepted(false)}
                className="flex-1 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-all"
                style={{ background: "#f5f6f8", color: "#5b6473" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#e9ebef"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f5f6f8"; }}>
                Rechazar
              </button>
              <button onClick={() => setCookieAccepted(true)}
                className="flex-1 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all text-white"
                style={{ background: "#2c6bf2" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>
                Aceptar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateChoiceModal
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        onManual={() => { setChoiceOpen(false); go("campaign-detail"); }}
        onAI={() => { setChoiceOpen(false); go("create-ai"); }}
        dark={dark}
      />
    </div>
    </NavContext.Provider>
  );
}