import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PriorityAlertIcon, PriorityAlertSignalIcon } from "../components/PriorityAlertIcon";

describe("PriorityAlertIcon", () => {
  it.each([
    ["road", "道路交通", "priority-card-icon--road"],
    ["rail", "鐵路服務", "priority-card-icon--rail"],
    ["weather", "天氣警告", "priority-card-icon--weather"],
    ["earthquake", "地震", "priority-card-icon--earthquake"],
  ] as const)("renders an accessible %s icon", (kind, label, className) => {
    const html = renderToStaticMarkup(createElement(PriorityAlertIcon, { kind }));
    expect(html).toContain(`aria-label=\"${label}\"`);
    expect(html).toContain(className);
    expect(html).toContain("<svg");
  });

  it.each([
    ["WRAIN", "WRAINY", "黃雨", "黃色暴雨警告信號", "priority-card-signal--rain-yellow"],
    ["WRAIN", "WRAINR", "紅雨", "紅色暴雨警告信號", "priority-card-signal--rain-red"],
    ["WRAIN", "WRAINB", "黑雨", "黑色暴雨警告信號", "priority-card-signal--rain-black"],
    ["WTCSGNL", "TC8NE", "8號", "八號東北烈風或暴風信號", "priority-card-signal--typhoon-8"],
  ])("renders a colored %s %s signal badge", (warningCode, warningSubtype, label, ariaLabel, className) => {
    const html = renderToStaticMarkup(createElement(PriorityAlertSignalIcon, {
      alert: { kind: "weather", warningCode, warningSubtype },
    }));
    expect(html).toContain(`aria-label="${ariaLabel}"`);
    expect(html).toContain(`title="${ariaLabel}；顏色只作視覺提示，正式級別以信號文字為準。"`);
    expect(html).toContain(className);
    expect(html).toContain(label);
    expect(html).toContain("<svg");
  });
});
