import type { PriorityAlert } from "../../../server/transportData";

export type PriorityAlertIconName = "CarFront" | "TrainFront" | "CloudLightning" | "Activity";

export const PRIORITY_ALERT_VISUALS = {
  road: { iconName: "CarFront", label: "道路交通" },
  rail: { iconName: "TrainFront", label: "鐵路服務" },
  weather: { iconName: "CloudLightning", label: "天氣警告" },
  earthquake: { iconName: "Activity", label: "地震" },
} as const satisfies Record<PriorityAlert["kind"], { iconName: PriorityAlertIconName; label: string }>;

export function getPriorityAlertVisual(kind: PriorityAlert["kind"]) {
  return PRIORITY_ALERT_VISUALS[kind];
}
