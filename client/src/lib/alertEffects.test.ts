import { describe, expect, it } from "vitest";
import type { PriorityAlert } from "../../../server/transportData";
import {
  DEFAULT_ALERT_EFFECT_PREFERENCES,
  getNewHighImpactAlerts,
  parseAlertEffectPreferences,
} from "./alertEffects";

function alert(id: string, level: PriorityAlert["level"]): PriorityAlert {
  return { id, kind: "road", level, title: id, detail: "事件資料", location: "香港", area: "全港" };
}

describe("alert effect preferences", () => {
  it("defaults sound and breathing off", () => {
    expect(parseAlertEffectPreferences(null)).toEqual({ sound: false, breathing: false });
    expect(DEFAULT_ALERT_EFFECT_PREFERENCES).toEqual({ sound: false, breathing: false });
  });

  it("loads only valid boolean settings", () => {
    expect(parseAlertEffectPreferences('{"sound":true,"breathing":false}')).toEqual({ sound: true, breathing: false });
    expect(parseAlertEffectPreferences('{"sound":"yes","breathing":0}')).toEqual({ sound: false, breathing: false });
    expect(parseAlertEffectPreferences("not-json")).toEqual({ sound: false, breathing: false });
  });
});

describe("new high-impact alerts", () => {
  it("selects only previously unseen critical/high alerts, not routine watch items", () => {
    const alerts = [alert("new-critical", "critical"), alert("new-high", "high"), alert("watch", "watch"), alert("old", "high")];
    expect(getNewHighImpactAlerts(alerts, new Set(["old"])).map(({ id }) => id)).toEqual(["new-critical", "new-high"]);
  });

  it("returns nothing for an unchanged polling response", () => {
    expect(getNewHighImpactAlerts([alert("same", "critical")], new Set(["same"]))).toEqual([]);
  });
});
