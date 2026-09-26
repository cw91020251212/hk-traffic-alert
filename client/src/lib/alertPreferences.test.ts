import { describe, expect, it } from "vitest";
import { parseAlertAreaPreference } from "./alertPreferences";

describe("parseAlertAreaPreference", () => {
  it("restores each supported user-selected region", () => {
    expect(parseAlertAreaPreference("港島")).toBe("港島");
    expect(parseAlertAreaPreference("九龍")).toBe("九龍");
    expect(parseAlertAreaPreference("新界／離島")).toBe("新界／離島");
    expect(parseAlertAreaPreference("全港")).toBe("全港");
  });

  it("falls back safely for empty, stale or untrusted values", () => {
    expect(parseAlertAreaPreference(null)).toBe("全部");
    expect(parseAlertAreaPreference("")).toBe("全部");
    expect(parseAlertAreaPreference("未知地區")).toBe("全部");
  });
});
