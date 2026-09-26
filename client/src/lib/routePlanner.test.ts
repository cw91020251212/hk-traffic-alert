import { describe, expect, it } from "vitest";
import type { PriorityAlert } from "../../../server/transportData";
import { buildDirectionsUrl, parseRouteBookmarks, selectAlertsForRouteAreas } from "./routePlanner";

const alerts: PriorityAlert[] = [
  { id: "road-1", kind: "road", level: "high", title: "吐露港公路塞車", detail: "行車緩慢", location: "大埔", area: "新界／離島", updatedAt: "2026-09-27T10:00:00+08:00" },
  { id: "rail-1", kind: "rail", level: "high", title: "東鐵綫服務延誤", detail: "官方延誤旗標", location: "金鐘", area: "港島", updatedAt: "2026-09-27T10:00:00+08:00" },
  { id: "weather-1", kind: "weather", level: "critical", title: "黑色暴雨警告", detail: "全港生效", location: "全港", area: "全港", updatedAt: "2026-09-27T10:00:00+08:00" },
];

describe("route planner", () => {
  it("constructs a cross-platform Google Maps directions URL with encoded Hong Kong places", () => {
    const url = new URL(buildDirectionsUrl("港鐵金鐘站", "大埔墟站", "transit"));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("origin")).toBe("港鐵金鐘站");
    expect(url.searchParams.get("destination")).toBe("大埔墟站");
    expect(url.searchParams.get("travelmode")).toBe("transit");
  });

  it("matches driving and transit alerts to selected region and travel mode", () => {
    expect(selectAlertsForRouteAreas(alerts, ["新界／離島"], "driving").map(({ id }) => id)).toEqual(["weather-1", "road-1"]);
    expect(selectAlertsForRouteAreas(alerts, ["港島"], "transit").map(({ id }) => id)).toEqual(["weather-1", "rail-1"]);
    expect(selectAlertsForRouteAreas(alerts, ["新界／離島"], "transit").map(({ id }) => id)).toEqual(["weather-1"]);
  });

  it("keeps territory-wide alerts visible even without a selected region", () => {
    expect(selectAlertsForRouteAreas(alerts, [], "driving").map(({ id }) => id)).toEqual(["weather-1"]);
  });

  it("restores only valid saved routes and limits the list to five", () => {
    const input = Array.from({ length: 7 }, (_, index) => ({ id: String(index), origin: `A${index}`, destination: `B${index}`, mode: "driving", areas: ["港島", "未知"] }));
    const result = parseRouteBookmarks(JSON.stringify(input));
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ id: "0", origin: "A0", destination: "B0", mode: "driving", areas: ["港島"] });
  });

  it("handles invalid or tampered local storage safely", () => {
    expect(parseRouteBookmarks(null)).toEqual([]);
    expect(parseRouteBookmarks("not json")).toEqual([]);
    expect(parseRouteBookmarks(JSON.stringify([{ id: "bad", origin: "", destination: "", mode: "rocket", areas: ["港島"] }]))).toEqual([]);
  });
});
