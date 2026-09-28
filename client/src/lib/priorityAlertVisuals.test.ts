import { describe, expect, it } from "vitest";
import { getPriorityAlertVisual, getWeatherSignalVisual } from "./priorityAlertVisuals";

describe("getPriorityAlertVisual", () => {
  it("maps each alert type to a distinct icon and plain-language label", () => {
    expect(getPriorityAlertVisual("road")).toEqual({ iconName: "CarFront", label: "道路交通" });
    expect(getPriorityAlertVisual("rail")).toEqual({ iconName: "TrainFront", label: "鐵路服務" });
    expect(getPriorityAlertVisual("weather")).toEqual({ iconName: "CloudLightning", label: "天氣警告" });
    expect(getPriorityAlertVisual("earthquake")).toEqual({ iconName: "Activity", label: "地震" });
  });
});

describe("getWeatherSignalVisual", () => {
  it.each([
    ["WRAIN", "WRAINY", "黃雨", "rain-yellow"],
    ["WRAIN", "WRAINR", "紅雨", "rain-red"],
    ["WRAIN", "WRAINB", "黑雨", "rain-black"],
  ])("uses the HKO rainstorm color for %s %s", (code, subtype, label, color) => {
    expect(getWeatherSignalVisual(code, subtype)).toMatchObject({ label, color, iconName: "CloudRain" });
  });

  it.each([
    ["TC1", "1號", "typhoon-1"],
    ["TC3", "3號", "typhoon-3"],
    ["TC8NE", "8號", "typhoon-8"],
    ["TC8NW", "8號", "typhoon-8"],
    ["TC8SE", "8號", "typhoon-8"],
    ["TC8SW", "8號", "typhoon-8"],
    ["TC9", "9號", "typhoon-9"],
    ["TC10", "10號", "typhoon-10"],
  ])("maps tropical cyclone subtype %s to its explicit signal label and color", (subtype, label, color) => {
    expect(getWeatherSignalVisual("WTCSGNL", subtype)).toMatchObject({ label, color, iconName: "Wind" });
  });

  it("keeps the official direction in accessible labels for the four No. 8 signals", () => {
    expect(getWeatherSignalVisual("WTCSGNL", "TC8NE")?.ariaLabel).toBe("八號東北烈風或暴風信號");
    expect(getWeatherSignalVisual("WTCSGNL", "TC8SW")?.ariaLabel).toBe("八號西南烈風或暴風信號");
  });

  it("does not guess colors for unsupported or cancelled warning subtypes", () => {
    for (const subtype of ["CANCEL", "TC8XX", "TC8NORTH", "TC8NEBAD", "TC1NE", "TC9NW", "toString"]) {
      expect(getWeatherSignalVisual("WTCSGNL", subtype)).toBeUndefined();
    }
    expect(getWeatherSignalVisual("WRAIN", "UNKNOWN")).toBeUndefined();
    expect(getWeatherSignalVisual("WRAIN", "toString")).toBeUndefined();
    expect(getWeatherSignalVisual("WL", "")).toBeUndefined();
  });
});
