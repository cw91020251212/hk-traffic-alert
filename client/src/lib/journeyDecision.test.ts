import { describe, expect, it } from "vitest";
import { getJourneyDecision, inferRouteAreas } from "./journeyDecision";
import type { PriorityAlert } from "../../../server/transportData";

const alert = (level: PriorityAlert["level"]): PriorityAlert => ({
  id: level,
  kind: "road",
  level,
  area: "新界／離島",
  title: `${level} event`,
  detail: "test",
  location: "大埔",
});

describe("inferRouteAreas", () => {
  it("infers areas from Hong Kong place names", () => {
    expect(inferRouteAreas("金鐘站", "大埔墟站")).toEqual(["港島", "新界／離島"]);
  });

  it("returns no guessed area for unknown text", () => {
    expect(inferRouteAreas("屋企", "公司")).toEqual([]);
  });
});

describe("getJourneyDecision", () => {
  it("tells the user to change route for a critical alert", () => {
    expect(getJourneyDecision([alert("critical")]).tone).toBe("critical");
    expect(getJourneyDecision([alert("critical")]).title).toContain("改路");
  });

  it("does not claim all clear when a source is unavailable", () => {
    expect(getJourneyDecision([], { degraded: true }).tone).toBe("unknown");
  });

  it("gives a direct clear answer when verified alerts are empty", () => {
    expect(getJourneyDecision([], { routeReady: true }).title).toContain("照常出發");
  });
});
