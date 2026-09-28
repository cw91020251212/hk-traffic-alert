import { createElement } from "react";
import { Activity, CarFront, CloudLightning, CloudRain, TrainFront, Wind, type LucideIcon } from "lucide-react";
import type { PriorityAlert } from "../../../server/transportData";
import { getPriorityAlertVisual, getWeatherSignalVisual, type PriorityAlertIconName } from "@/lib/priorityAlertVisuals";

const ICONS: Record<PriorityAlertIconName, LucideIcon> = {
  CarFront,
  TrainFront,
  CloudLightning,
  Activity,
};

export function PriorityAlertIcon({ kind }: { kind: PriorityAlert["kind"] }) {
  const visual = getPriorityAlertVisual(kind);
  const Icon = ICONS[visual.iconName];

  return renderIcon(visual.label, `priority-card-icon priority-card-icon--${kind}`, Icon);
}

function renderIcon(label: string, className: string, Icon: LucideIcon, children?: ReturnType<typeof createElement>) {
  return createElement(
    "span",
    { className, role: "img", "aria-label": label },
    children ?? createElement(Icon, { size: 18, strokeWidth: 2.2 }),
  );
}

export function PriorityAlertSignalIcon({ alert }: { alert: Pick<PriorityAlert, "kind" | "warningCode" | "warningSubtype"> }) {
  const signal = getWeatherSignalVisual(alert.warningCode, alert.warningSubtype);
  if (alert.kind !== "weather" || !signal) return createElement(PriorityAlertIcon, { kind: alert.kind });

  const SignalIcon = signal.iconName === "CloudRain" ? CloudRain : Wind;
  return createElement(
    "span",
    {
      className: `priority-card-icon priority-card-icon--weather priority-card-signal priority-card-signal--${signal.color}`,
      role: "img",
      "aria-label": signal.ariaLabel,
      title: `${signal.ariaLabel}；顏色只作視覺提示，正式級別以信號文字為準。`,
    },
    createElement(SignalIcon, { size: 16, strokeWidth: 2.3 }),
    createElement("strong", null, signal.label),
  );
}
