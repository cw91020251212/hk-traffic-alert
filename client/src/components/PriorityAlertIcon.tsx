import { createElement } from "react";
import { Activity, CarFront, CloudLightning, TrainFront, type LucideIcon } from "lucide-react";
import type { PriorityAlert } from "../../../server/transportData";
import { getPriorityAlertVisual, type PriorityAlertIconName } from "@/lib/priorityAlertVisuals";

const ICONS: Record<PriorityAlertIconName, LucideIcon> = {
  CarFront,
  TrainFront,
  CloudLightning,
  Activity,
};

export function PriorityAlertIcon({ kind }: { kind: PriorityAlert["kind"] }) {
  const visual = getPriorityAlertVisual(kind);
  const Icon = ICONS[visual.iconName];

  return createElement(
    "span",
    { className: `priority-card-icon priority-card-icon--${kind}`, role: "img", "aria-label": visual.label },
    createElement(Icon, { size: 18, strokeWidth: 2.2 }),
  );
}
