import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ChevronRight, Check, X } from "lucide-react";
import { NotificationPanel } from "./TopBarComponents";
import { ApprovalTimeline } from "./ApprovalTimeline";
import {
  WorkflowCampaign,
  STEP_META,
  STEP_BADGE,
  getNextAction,
  advanceStep,
  WORKFLOW_CAMPAIGNS,
} from "../lib/approvalWorkflow";

interface Props {
  onBack: () => void;
  onViewCampaigns?: () => void;
  onViewAccounts?: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}

const ACCENT = "#2c6bf2";

type Filter = "all" | "active" | "completed";

export function Frame02dAprobaciones({ onBack, onViewCampaigns, onViewAccounts, dark, setDark }: Props) {
  const [campaigns, setCampaigns] = useState<WorkflowCampaign[]>(WORKFLOW_CAMPAIGNS);
  const [filter, setFilter] = useState<Filter>("all");
  const [showNotifications, setShowNotifications] = useState(false);

  const T = {
    page:    dark ? "#0e0e12" : "#F7F7F8",
    surface: dark ? "#141418" : "#ffffff",
    border:  dark ? "#26262e" : "#f0f0f2",
    text:    dark ? "#f4f5f7" : "#111827",
    sub:     dark ? "#9aa3b2" : "#9ca3af",
    hover:   dark ? "#1d1d23" : "#f9fafb",
    divider: dark ? "#26262e" : "#f0f0f2",
  };

  function advance(id: number, decision?: "approved" | "changes") {
    setCampaigns((prev) => prev.map((c) => c.id === id ? advanceStep(c, decision) : c));
  }

  const filtered = campaigns.filter((c) =>
    filter === "all"       ? true :
    filter === "completed" ? c.currentStep === "completed" :
    c.currentStep !== "completed"
  );

  const activeCount    = campaigns.filter((c) => c.currentStep !== "completed").length;
  const completedCount = campaigns.filter((c) => c.currentStep === "completed").length;

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: "all",       label: "Todas",       count: campaigns.length },
    { key: "active",    label: "En progreso", count: activeCount },
    { key: "completed", label: "Completadas", count: completedCount },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');`}</style>
      <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Roboto', sans-serif", background: T.page }}>

        <Sidebar active="approvals" dark={dark} setDark={setDark} />

        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-end px-8 py-4" style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 rounded-lg cursor-pointer transition-all"
                onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Bell size={15} style={{ color: T.sub }} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationPanel onClose={() => setShowNotifications(false)} T={T} dark={dark} />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.sub }}>
                  Flujo de aprobación
                </p>
                <h1 className="text-2xl font-semibold" style={{ color: T.text }}>Aprobaciones</h1>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                {FILTERS.map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all"
                    style={
                      filter === key
                        ? { background: ACCENT, color: "#fff" }
                        : { background: "transparent", color: T.sub }
                    }
                  >
                    {label}
                    <span className="ml-1.5 text-[11px] opacity-70">({count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign cards */}
            <div className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((c, i) => {
                  const badge  = STEP_BADGE[c.currentStep];
                  const action = getNextAction(c.currentStep);
                  const isDone = c.currentStep === "completed";

                  return (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="rounded-2xl p-6"
                      style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          {/* Brand dot */}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
                            style={{ background: ACCENT }}>
                            {c.brand.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold leading-tight" style={{ color: T.text }}>{c.name}</p>
                            <p className="text-[12px] mt-0.5" style={{ color: T.sub }}>{c.brand}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Current step badge */}
                          <span className="px-3 py-1 rounded-full text-[12px] font-medium"
                            style={{ background: badge.bg, color: badge.color }}>
                            {STEP_META[c.currentStep].label}
                          </span>
                          {c.dueDate && !isDone && (
                            <span className="text-[12px]" style={{ color: T.sub }}>
                              Vence en {c.dueDate}
                            </span>
                          )}
                          <span className="text-[12px]" style={{ color: T.sub }}>{c.updatedAt}</span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <ApprovalTimeline campaign={c} dark={dark} />

                      {/* Preview image — shown on completed campaigns that have one */}
                      {isDone && c.previewUrl && (
                        <div className="mt-5 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                          <img
                            src={c.previewUrl}
                            alt={`Preview ${c.name}`}
                            className="w-full object-cover"
                            style={{ maxHeight: 220, display: "block" }}
                          />
                        </div>
                      )}

                      {/* Actions */}
                      {!isDone && (
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${T.divider}` }}>
                          {action.needsDecision ? (
                            <>
                              <button
                                onClick={() => advance(c.id, "changes")}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all"
                                style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.14)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                              >
                                <X size={13} />
                                Solicitar cambios
                              </button>
                              <button
                                onClick={() => advance(c.id, "approved")}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-all text-white"
                                style={{ background: "#00C566" }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                              >
                                <Check size={13} />
                                Aprobar
                              </button>
                            </>
                          ) : action.label ? (
                            <button
                              onClick={() => advance(c.id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all text-white"
                              style={{ background: ACCENT }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              {action.label}
                              <ChevronRight size={13} />
                            </button>
                          ) : null}
                        </div>
                      )}

                      {isDone && (
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${T.divider}` }}>
                          <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "#009d52" }}>
                            <Check size={13} />
                            Campaña completada
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <p className="text-[14px]" style={{ color: T.sub }}>No hay campañas en este estado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
