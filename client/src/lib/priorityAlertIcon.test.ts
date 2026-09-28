import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PriorityAlertIcon } from "../components/PriorityAlertIcon";

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
});
