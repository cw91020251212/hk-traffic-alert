import type { PriorityAlert } from "../../../server/transportData";

export type AlertAreaPreference = "全部" | "全港" | "港島" | "九龍" | "新界／離島";
export type AlertFavoriteId = "tolo" | "adm-mtr";

export const ALERT_AREA_OPTIONS: AlertAreaPreference[] = ["全部", "全港", "港島", "九龍", "新界／離島"];
export const ALERT_AREA_PREFERENCE_KEY = "hk-traffic-alert:preferred-area";
export const ALERT_FAVORITE_OPTIONS: Array<{ id: AlertFavoriteId; label: string }> = [
  { id: "tolo", label: "吐露港公路" },
  { id: "adm-mtr", label: "金鐘港鐵" },
];
export const ALERT_FAVORITES_PREFERENCE_KEY = "hk-traffic-alert:favorite-routes";

export function parseAlertAreaPreference(value: string | null | undefined): AlertAreaPreference {
  return ALERT_AREA_OPTIONS.includes(value as AlertAreaPreference) ? value as AlertAreaPreference : "全部";
}

export function parseAlertFavoriteIds(value: string | null | undefined): AlertFavoriteId[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return ALERT_FAVORITE_OPTIONS.map(({ id }) => id).filter((id) => parsed.includes(id));
  } catch {
    return [];
  }
}

export function filterAlertsByFavorites(alerts: PriorityAlert[], favorites: AlertFavoriteId[]): PriorityAlert[] {
  if (favorites.length === 0) return alerts;
  return alerts.filter((alert) => {
    // Safety-critical territory-wide warnings and felt-earthquake reports must not be hidden by route filters.
    if (alert.area === "全港" || alert.kind === "earthquake") return true;
    const searchable = `${alert.id} ${alert.title} ${alert.detail} ${alert.location} ${alert.area}`;
    return favorites.some((favorite) => favorite === "tolo"
      ? alert.kind === "road" && /吐露港|大埔|大圍|沙田|tolo/i.test(searchable)
      : alert.kind === "rail" && /金鐘|東鐵綫|港島綫|南港島綫|adm/i.test(searchable));
  });
}
