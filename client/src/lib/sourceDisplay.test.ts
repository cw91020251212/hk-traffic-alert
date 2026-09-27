import { describe, expect, it } from "vitest";
import { getSourceDisplayName } from "./sourceDisplay";

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
