import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import { Frame01Login } from "./components/Frame01Login";
import { Frame02Dashboard } from "./components/Frame02Dashboard";
import { Frame02bCampaignList } from "./components/Frame02bCampaignList";
import { Frame03CampaignSetup } from "./components/Frame03CampaignSetup";
import { Frame04PreviewBuilder } from "./components/Frame04PreviewBuilder";
import { Frame05Presentation } from "./components/Frame05Presentation";

type Screen =
  | "login"
  | "dashboard"
  | "campaigns"
  | "campaign-detail"
  | "builder"
  | "presentation";

export interface UploadedPiece {
  id: string;
  name: string;
  dim: string;
  ar: number;
  imageUrl: string;
  fileType?: "image" | "video";
  fileName?: string;
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
}

const DEFAULT_CAMPAIGN: CampaignState = {
  campaignName: "",
  selectedFormats: [],
  includeCover: true,
  coverTemplate: "dark",
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
  { key: "login", label: "Login", num: "01" },
  { key: "dashboard", label: "Dashboard", num: "02" },
  { key: "campaigns", label: "Campaigns", num: "02b" },
  { key: "campaign-detail", label: "Campaign Detail", num: "03" },
  { key: "builder", label: "Preview Builder", num: "04" },
  { key: "presentation", label: "Presentation", num: "05" },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [showNav, setShowNav] = useState(false);
  const [campaign, setCampaign] = useState<CampaignState>(DEFAULT_CAMPAIGN);

  const go = (s: Screen) => setScreen(s);
  const updateCampaign = (updates: Partial<CampaignState>) =>
    setCampaign((prev) => ({ ...prev, ...updates }));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Toaster position="bottom-center" richColors />
      {/* SCREEN RENDERER */}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          {screen === "login" && (
            <Frame01Login onLogin={() => go("dashboard")} />
          )}
          {screen === "dashboard" && (
            <Frame02Dashboard
              onNewCampaign={(name: string) => { updateCampaign({ campaignName: name }); go("campaign-detail"); }}
              onOpenCampaign={() => go("campaign-detail")}
              onViewCampaigns={() => go("campaigns")}
            />
          )}
          {screen === "campaigns" && (
            <Frame02bCampaignList
              onBack={() => go("dashboard")}
              onNewCampaign={() => go("campaign-detail")}
              onOpenCampaign={() => go("campaign-detail")}
            />
          )}
          {screen === "campaign-detail" && (
            <Frame03CampaignSetup
              onBack={() => go("campaigns")}
              onGoToDashboard={() => go("dashboard")}
              onOpenBuilder={() => go("builder")}
              campaign={campaign}
              onUpdate={updateCampaign}
            />
          )}
          {screen === "builder" && (
            <Frame04PreviewBuilder
              onBack={() => go("campaign-detail")}
              onPresent={() => go("presentation")}
              campaign={campaign}
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
                    onClick={() => { go(key); }}
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
    </div>
  );
}
