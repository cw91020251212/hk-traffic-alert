import type { PriorityAlert } from "../../../server/transportData";

export const ALERT_EFFECTS_PREFERENCE_KEY = "hk-traffic-alert:alert-effects";

export type AlertEffectPreferences = {
  sound: boolean;
  breathing: boolean;
};

export const DEFAULT_ALERT_EFFECT_PREFERENCES: AlertEffectPreferences = {
  sound: false,
  breathing: false,
};

export function parseAlertEffectPreferences(value: string | null | undefined): AlertEffectPreferences {
  if (!value) return { ...DEFAULT_ALERT_EFFECT_PREFERENCES };
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_ALERT_EFFECT_PREFERENCES };
    const settings = parsed as Record<string, unknown>;
    return {
      sound: typeof settings.sound === "boolean" ? settings.sound : DEFAULT_ALERT_EFFECT_PREFERENCES.sound,
      breathing: typeof settings.breathing === "boolean" ? settings.breathing : DEFAULT_ALERT_EFFECT_PREFERENCES.breathing,
    };
  } catch {
    return { ...DEFAULT_ALERT_EFFECT_PREFERENCES };
  }
}

export function getNewHighImpactAlerts(alerts: PriorityAlert[], previouslySeenIds: ReadonlySet<string>): PriorityAlert[] {
  return alerts.filter((alert) => alert.level !== "watch" && !previouslySeenIds.has(alert.id));
}
