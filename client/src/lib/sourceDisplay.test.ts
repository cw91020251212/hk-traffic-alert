import { describe, expect, it } from "vitest";
import { countSourceIndicators, getSourceDisplayName, getSourceIndicatorLabel, getSourceIndicatorState, orderSourceItems } from "./sourceDisplay";

describe("getSourceDisplayName", () => {
  it("shows plain-language names for public data sources", () => {
    expect(getSourceDisplayName("td-traffic")).toBe("運輸署交通消息");
    expect(getSourceDisplayName("hko-warning")).toBe("天文台天氣警告");
    expect(getSourceDisplayName("hko-earthquake-quick")).toBe("天文台地震速報");
    expect(getSourceDisplayName("hko-earthquake-felt")).toBe("天文台有感地震報告");
  });

  it("shows human-readable labels for MTR lines", () => {
    expect(getSourceDisplayName("mtr-eal")).toBe("港鐵金鐘站・東鐵綫班次資料");
    expect(getSourceDisplayName("mtr-isl")).toBe("港鐵金鐘站・港島綫班次資料");
    expect(getSourceDisplayName("mtr-sil")).toBe("港鐵金鐘站・南港島綫班次資料");
  });

  it("does not expose unknown source ids", () => {
    expect(getSourceDisplayName("private-internal-feed-name")).toBe("其他官方交通資料");
  });
});

describe("getSourceIndicatorState", () => {
  it("maps fetched, failed, and not-yet-known states", () => {
    expect(getSourceIndicatorState("ok")).toBe("success");
    expect(getSourceIndicatorState("unavailable")).toBe("failure");
    expect(getSourceIndicatorState(undefined)).toBe("unknown");
    expect(getSourceIndicatorState("unexpected")).toBe("unknown");
  });

  it("provides accessible plain-language state labels", () => {
    expect(getSourceIndicatorLabel("success")).toBe("成功讀取");
    expect(getSourceIndicatorLabel("failure")).toBe("讀取失敗");
    expect(getSourceIndicatorLabel("unknown")).toBe("未能確認");
  });
});

describe("orderSourceItems", () => {
  it("keeps the seven lights aligned to their detail rows in the expected order", () => {
    const shuffled = ["mtr-sil", "hko-warning", "mtr-isl", "td-traffic", "hko-earthquake-felt", "mtr-eal", "hko-earthquake-quick"].map((id) => ({ id }));
    expect(orderSourceItems(shuffled).map(({ id }) => id)).toEqual([
      "td-traffic",
      "hko-warning",
      "hko-earthquake-quick",
      "hko-earthquake-felt",
      "mtr-eal",
      "mtr-isl",
      "mtr-sil",
    ]);
  });

  it("keeps unknown future feeds visible after the seven known feeds", () => {
    const items = [{ id: "new-feed" }, { id: "mtr-sil" }, { id: "other-feed" }];
    expect(orderSourceItems(items).map(({ id }) => id)).toEqual(["mtr-sil", "new-feed", "other-feed"]);
  });
});

describe("countSourceIndicators", () => {
  it("counts successful, failed, and unconfirmed sources for the summary", () => {
    expect(countSourceIndicators(["success", "success", "failure", "unknown", "success", "success", "success"])).toEqual({
      success: 5,
      failure: 1,
      unknown: 1,
    });
    expect(countSourceIndicators(Array(7).fill("success"))).toEqual({ success: 7, failure: 0, unknown: 0 });
  });
});
