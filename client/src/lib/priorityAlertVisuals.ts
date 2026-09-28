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

export type WeatherSignalColor = "rain-yellow" | "rain-red" | "rain-black" | "typhoon-1" | "typhoon-3" | "typhoon-8" | "typhoon-9" | "typhoon-10";

export type WeatherSignalVisual = {
  label: string;
  ariaLabel: string;
  color: WeatherSignalColor;
  iconName: "CloudRain" | "Wind";
};

const RAINSTORM_SIGNALS: Record<string, WeatherSignalVisual> = {
  WRAINY: { label: "黃雨", ariaLabel: "黃色暴雨警告信號", color: "rain-yellow", iconName: "CloudRain" },
  WRAINR: { label: "紅雨", ariaLabel: "紅色暴雨警告信號", color: "rain-red", iconName: "CloudRain" },
  WRAINB: { label: "黑雨", ariaLabel: "黑色暴雨警告信號", color: "rain-black", iconName: "CloudRain" },
};

const TYPHOON_SIGNALS: Record<string, WeatherSignalVisual> = {
  TC1: { label: "1號", ariaLabel: "一號戒備信號", color: "typhoon-1", iconName: "Wind" },
  TC3: { label: "3號", ariaLabel: "三號強風信號", color: "typhoon-3", iconName: "Wind" },
  TC8: { label: "8號", ariaLabel: "八號烈風或暴風信號", color: "typhoon-8", iconName: "Wind" },
  TC9: { label: "9號", ariaLabel: "九號烈風或暴風風力增強信號", color: "typhoon-9", iconName: "Wind" },
  TC10: { label: "10號", ariaLabel: "十號颶風信號", color: "typhoon-10", iconName: "Wind" },
};

export function getWeatherSignalVisual(code?: string, subtype?: string): WeatherSignalVisual | undefined {
  if (code === "WRAIN") return subtype ? RAINSTORM_SIGNALS[subtype] : undefined;
  if (code !== "WTCSGNL" || !subtype) return undefined;

  const match = /^TC(10|9|8|3|1)([A-Z]{2})?$/.exec(subtype);
  if (!match) return undefined;
  const signal = TYPHOON_SIGNALS[`TC${match[1]}`];
  if (match[1] !== "8" || !match[2]) return signal;

  const direction: Record<string, string> = { NE: "東北", NW: "西北", SE: "東南", SW: "西南" };
  return { ...signal, ariaLabel: `八號${direction[match[2]]}烈風或暴風信號` };
}
