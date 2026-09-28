import { describe, expect, it } from "vitest";
import { getJourneyDecision, inferRouteAreas } from "./journeyDecision";
import type { PriorityAlert } from "../../../server/transportData";

const alert = (level: PriorityAlert["level"], area: PriorityAlert["area"] = "新界／離島"): PriorityAlert => ({
  id: level,
  kind: "road",
  level,
  area,
  title: `${level} event`,
  detail: "test",
  location: "大埔",
});

describe("inferRouteAreas", () => {
  it("infers broad areas from Hong Kong place names", () => {
    expect(inferRouteAreas("金鐘站", "大埔墟站")).toEqual(["港島", "新界／離島"]);
  });

  it("maps a device coordinate to a broad area only when unambiguous", () => {
    expect(inferRouteAreas("22.28190, 114.15500")).toEqual(["港島"]);
    expect(inferRouteAreas("22.32000, 114.18000")).toEqual(["九龍"]);
    expect(inferRouteAreas("22.38100, 114.18800")).toEqual(["新界／離島"]);
    expect(inferRouteAreas("22.29000, 114.18000")).toEqual([]);
  });

  it("returns no guessed area for unknown text or coordinates outside Hong Kong", () => {
    expect(inferRouteAreas("屋企", "公司")).toEqual([]);
    expect(inferRouteAreas("40.71280, -74.00600")).toEqual([]);
  });
});

describe("getJourneyDecision", () => {
  it("tells the user to inspect a critical warning without guaranteeing route impact", () => {
    const decision = getJourneyDecision([alert("critical")], { routeReady: true, routeAreas: ["新界／離島"] });
    expect(decision.tone).toBe("critical");
    expect(decision.title).toContain("官方警報");
    expect(decision.detail).toContain("未核對實際道路路線");
  });

  it("does not claim all clear when a source is unavailable", () => {
    expect(getJourneyDecision([], { degraded: true }).tone).toBe("unknown");
  });

  it("states the limitations of a no-alert area check", () => {
    const decision = getJourneyDecision([], { routeReady: true, routeAreas: ["港島"] });
    expect(decision.title).toContain("同區");
    expect(decision.detail).toContain("不代表實際路線安全");
  });

  it("does not treat an unrecognized route as clear", () => {
    const decision = getJourneyDecision([], { routeReady: true, routeAreas: [] });
    expect(decision.tone).toBe("unknown");
    expect(decision.title).toContain("無法比對");
  });

  it("keeps a territory-wide warning visible when place names are not recognized", () => {
    const decision = getJourneyDecision([alert("high", "全港")], { routeReady: true, routeAreas: [] });
    expect(decision.tone).toBe("high");
    expect(decision.kicker).toContain("全港");
  });

  it("does not describe the overall dashboard as a journey safety guarantee", () => {
    const decision = getJourneyDecision([]);
    expect(decision.title).toContain("未見需要改路");
    expect(decision.detail).toContain("不是對路況或旅程安全的保證");
  });
});
