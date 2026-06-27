export type WorkflowStep =
  | "sent_lead"
  | "opened_lead"
  | "lead_review"
  | "adjustments_lead"
  | "sent_client"
  | "opened_client"
  | "client_review"
  | "adjustments_client"
  | "completed";

export interface WorkflowCampaign {
  id: number;
  name: string;
  brand: string;
  currentStep: WorkflowStep;
  leadDecision?: "approved" | "changes";
  clientDecision?: "approved" | "changes";
  updatedAt: string;
  dueDate?: string;
}

export const STEP_ORDER: WorkflowStep[] = [
  "sent_lead", "opened_lead", "lead_review", "adjustments_lead",
  "sent_client", "opened_client", "client_review", "adjustments_client", "completed",
];

export const STEP_META: Record<WorkflowStep, { label: string; short: string; num: number }> = {
  sent_lead:          { label: "Enviado al Lead",      short: "Enviado",    num: 1 },
  opened_lead:        { label: "Abierto por Lead",     short: "Abierto",    num: 2 },
  lead_review:        { label: "Revisión Lead",        short: "Revisión",   num: 3 },
  adjustments_lead:   { label: "En ajustes",           short: "Ajustes",    num: 4 },
  sent_client:        { label: "Enviado al Cliente",   short: "Al cliente", num: 5 },
  opened_client:      { label: "Abierto por Cliente",  short: "Abierto",    num: 6 },
  client_review:      { label: "Revisión Cliente",     short: "Revisión",   num: 7 },
  adjustments_client: { label: "En ajustes",           short: "Ajustes",    num: 8 },
  completed:          { label: "Completado",           short: "Listo",      num: 9 },
};

export const STEP_BADGE: Record<WorkflowStep, { bg: string; color: string }> = {
  sent_lead:          { bg: "rgba(44,107,242,0.10)", color: "#2c6bf2" },
  opened_lead:        { bg: "rgba(44,107,242,0.10)", color: "#2c6bf2" },
  lead_review:        { bg: "rgba(255,176,32,0.12)", color: "#b07200" },
  adjustments_lead:   { bg: "rgba(239,68,68,0.10)",  color: "#dc2626" },
  sent_client:        { bg: "rgba(44,107,242,0.10)", color: "#2c6bf2" },
  opened_client:      { bg: "rgba(44,107,242,0.10)", color: "#2c6bf2" },
  client_review:      { bg: "rgba(255,176,32,0.12)", color: "#b07200" },
  adjustments_client: { bg: "rgba(239,68,68,0.10)",  color: "#dc2626" },
  completed:          { bg: "rgba(0,197,102,0.10)",  color: "#009d52" },
};

export type StepStatus = "done" | "active" | "upcoming";

/** Returns the ordered list of steps visible for a campaign (conditionals only shown when applicable). */
export function getVisibleSteps(c: WorkflowCampaign): WorkflowStep[] {
  const steps: WorkflowStep[] = ["sent_lead", "opened_lead", "lead_review"];
  if (c.leadDecision === "changes" || c.currentStep === "adjustments_lead") {
    steps.push("adjustments_lead");
  }
  steps.push("sent_client", "opened_client", "client_review");
  if (c.clientDecision === "changes" || c.currentStep === "adjustments_client") {
    steps.push("adjustments_client");
  }
  steps.push("completed");
  return steps;
}

export function getStepStatus(step: WorkflowStep, c: WorkflowCampaign, visible: WorkflowStep[]): StepStatus {
  const i = visible.indexOf(step);
  const cur = visible.indexOf(c.currentStep);
  if (i < cur) return "done";
  if (i === cur) return "active";
  return "upcoming";
}

/** Returns the action label(s) for the current step. */
export function getNextAction(step: WorkflowStep): { label?: string; needsDecision: boolean } {
  switch (step) {
    case "sent_lead":           return { label: "Marcar como abierto",  needsDecision: false };
    case "opened_lead":         return { label: "Iniciar revisión",      needsDecision: false };
    case "lead_review":         return { needsDecision: true };
    case "adjustments_lead":    return { label: "Enviar al cliente",     needsDecision: false };
    case "sent_client":         return { label: "Marcar como abierto",   needsDecision: false };
    case "opened_client":       return { label: "Iniciar revisión",      needsDecision: false };
    case "client_review":       return { needsDecision: true };
    case "adjustments_client":  return { label: "Completar campaña",     needsDecision: false };
    case "completed":           return { needsDecision: false };
  }
}

/** Advances a campaign to its next step, applying a decision when required. */
export function advanceStep(c: WorkflowCampaign, decision?: "approved" | "changes"): WorkflowCampaign {
  const map: Partial<Record<WorkflowStep, WorkflowStep>> = {
    sent_lead:           "opened_lead",
    opened_lead:         "lead_review",
    lead_review:         decision === "changes" ? "adjustments_lead" : "sent_client",
    adjustments_lead:    "sent_client",
    sent_client:         "opened_client",
    opened_client:       "client_review",
    client_review:       decision === "changes" ? "adjustments_client" : "completed",
    adjustments_client:  "completed",
  };
  const next = map[c.currentStep];
  if (!next) return c;
  return {
    ...c,
    currentStep: next,
    leadDecision:   c.currentStep === "lead_review"   ? decision : c.leadDecision,
    clientDecision: c.currentStep === "client_review" ? decision : c.clientDecision,
    updatedAt: "ahora",
  };
}

export const WORKFLOW_CAMPAIGNS: WorkflowCampaign[] = [
  {
    id: 1, name: "Mundial 2026", brand: "Éxito",
    currentStep: "opened_lead",
    updatedAt: "hace 2h", dueDate: "2 días",
  },
  {
    id: 2, name: "Evento Etto Q2", brand: "Éxito",
    currentStep: "adjustments_lead", leadDecision: "changes",
    updatedAt: "hace 3h", dueDate: "1 día",
  },
  {
    id: 3, name: "Catálogos Junio", brand: "Éxito",
    currentStep: "client_review", leadDecision: "approved",
    updatedAt: "hace 5h", dueDate: "hoy",
  },
  {
    id: 4, name: "Diageo HotSale", brand: "Diageo",
    currentStep: "sent_client", leadDecision: "approved",
    updatedAt: "ayer", dueDate: "3 días",
  },
  {
    id: 5, name: "Refresh Q3", brand: "Apex Corp",
    currentStep: "adjustments_client", leadDecision: "approved", clientDecision: "changes",
    updatedAt: "hace 1h", dueDate: "2 días",
  },
  {
    id: 6, name: "Verano 2026", brand: "Bloom Studio",
    currentStep: "completed", leadDecision: "approved", clientDecision: "approved",
    updatedAt: "hace 6h",
  },
];
