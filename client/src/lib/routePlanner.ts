import type { PriorityAlert } from "../../../server/transportData";

export type RouteMode = "driving" | "transit" | "walking";
export type RouteArea = "港島" | "九龍" | "新界／離島";
export type RouteBookmark = { id: string; origin: string; destination: string; mode: RouteMode; areas: RouteArea[] };
export const ROUTE_BOOKMARKS_PREFERENCE_KEY = "hk-traffic-alert:route-bookmarks";
const validModes: RouteMode[] = ["driving", "transit", "walking"];
const validAreas: RouteArea[] = ["港島", "九龍", "新界／離島"];

export function parseRouteBookmarks(value: string | null | undefined): RouteBookmark[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const bookmarks: RouteBookmark[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const item = entry as Record<string, unknown>;
      if (typeof item.id !== "string" || typeof item.origin !== "string" || typeof item.destination !== "string" || typeof item.mode !== "string" || !validModes.includes(item.mode as RouteMode)) continue;
      if (!item.origin.trim() || !item.destination.trim()) continue;
      const areas = Array.isArray(item.areas) ? validAreas.filter((area) => (item.areas as unknown[]).includes(area)) : [];
      bookmarks.push({ id: item.id, origin: item.origin, destination: item.destination, mode: item.mode as RouteMode, areas });
      if (bookmarks.length >= 5) break;
    }
    return bookmarks;
  } catch {
    return [];
  }
}

export function buildDirectionsUrl(origin: string, destination: string, mode: RouteMode): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", origin.trim());
  url.searchParams.set("destination", destination.trim());
  url.searchParams.set("travelmode", mode);
  return url.toString();
}

export function selectAlertsForRouteAreas(alerts: PriorityAlert[], areas: RouteArea[], mode: RouteMode): PriorityAlert[] {
  const rank: Record<string, number> = { critical: 0, urgent: 0, high: 1, watch: 2, info: 3 };
  const timestamp = (value?: string) => { const parsed = value ? Date.parse(value) : 0; return Number.isFinite(parsed) ? parsed : 0; };
  return alerts.filter((alert) => {
    if (alert.area === "全港") return true;
    if (!areas.includes(alert.area as RouteArea)) return false;
    if (alert.kind === "road") return mode === "driving";
    if (alert.kind === "rail") return mode === "transit";
    return alert.kind === "weather" || alert.kind === "earthquake";
  }).sort((a, b) => (rank[a.level] ?? 4) - (rank[b.level] ?? 4) || timestamp(b.updatedAt) - timestamp(a.updatedAt));
}
