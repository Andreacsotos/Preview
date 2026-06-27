import { Check } from "lucide-react";
import {
  WorkflowCampaign,
  getVisibleSteps,
  getStepStatus,
  STEP_META,
  StepStatus,
} from "../lib/approvalWorkflow";

const NODE_COLOR: Record<StepStatus, string> = {
  done:     "#00C566",
  active:   "#2c6bf2",
  upcoming: "transparent",
};

const LABEL_COLOR: Record<StepStatus, string> = {
  done:     "#00C566",
  active:   "#2c6bf2",
  upcoming: "", // filled at render time from theme
};

interface Props {
  campaign: WorkflowCampaign;
  dark?: boolean;
}

/** Full horizontal timeline — used in Approvals page. */
export function ApprovalTimeline({ campaign, dark = false }: Props) {
  const steps = getVisibleSteps(campaign);
  const upcomingBorder = dark ? "#3a3a44" : "#d1d5db";
  const upcomingText   = dark ? "#4b5563" : "#c4c9d4";
  const subText        = dark ? "#6b7280" : "#9ca3af";
  const connectorBase  = dark ? "#2c2c34" : "#e5e7eb";

  return (
    <div className="flex items-start w-full">
      {steps.map((step, i) => {
        const status = getStepStatus(step, campaign, steps);
        const meta   = STEP_META[step];
        const isLast = i === steps.length - 1;
        const nodeColor      = status === "upcoming" ? "transparent" : NODE_COLOR[status];
        const nodeBorder     = status === "upcoming" ? upcomingBorder : NODE_COLOR[status];
        const connectorColor = status === "done" ? "#00C566" : connectorBase;

        return (
          <div key={step} className="flex items-start flex-1 min-w-0">
            {/* Step node + label */}
            <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: nodeColor,
                border: `1.5px solid ${nodeBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {status === "done" ? (
                  <Check size={12} color="#fff" strokeWidth={2.5} />
                ) : (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: status === "active" ? "#fff" : upcomingText,
                  }}>
                    {meta.num}
                  </span>
                )}
              </div>
              <p style={{
                fontSize: 9, marginTop: 5, textAlign: "center",
                maxWidth: 52, lineHeight: 1.3,
                color: status === "upcoming"
                  ? subText
                  : LABEL_COLOR[status],
                fontWeight: status === "active" ? 600 : 400,
              }}>
                {meta.short}
              </p>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div style={{
                flex: 1, height: 1.5, marginTop: 13,
                background: connectorColor,
                minWidth: 8,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Compact dot strip — used in Dashboard Campaign Status widget. */
export function ApprovalTimelineCompact({ campaign, dark = false }: Props) {
  const steps = getVisibleSteps(campaign);
  const connectorBase = dark ? "#2c2c34" : "#e5e7eb";

  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const status  = getStepStatus(step, campaign, steps);
        const isLast  = i === steps.length - 1;
        const dotColor =
          status === "done"   ? "#00C566" :
          status === "active" ? "#2c6bf2" :
          dark ? "#2c2c34" : "#e5e7eb";
        const connColor = status === "done" ? "#00C566" : connectorBase;

        return (
          <div key={step} className="flex items-center">
            <div style={{
              width:  status === "active" ? 9 : 6,
              height: status === "active" ? 9 : 6,
              borderRadius: "50%",
              background: dotColor,
              flexShrink: 0,
              boxShadow: status === "active" ? "0 0 0 3px rgba(44,107,242,0.18)" : "none",
              transition: "all 0.15s",
            }} />
            {!isLast && (
              <div style={{ width: 10, height: 1.5, background: connColor, flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
