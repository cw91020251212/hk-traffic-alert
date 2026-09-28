import { describe, expect, it } from "vitest";
import { getPriorityAlertVisual } from "./priorityAlertVisuals";

describe("getPriorityAlertVisual", () => {
  it("maps each alert type to a distinct icon and plain-language label", () => {
    expect(getPriorityAlertVisual("road")).toEqual({ iconName: "CarFront", label: "道路交通" });
    expect(getPriorityAlertVisual("rail")).toEqual({ iconName: "TrainFront", label: "鐵路服務" });
    expect(getPriorityAlertVisual("weather")).toEqual({ iconName: "CloudLightning", label: "天氣警告" });
    expect(getPriorityAlertVisual("earthquake")).toEqual({ iconName: "Activity", label: "地震" });
  });
});
