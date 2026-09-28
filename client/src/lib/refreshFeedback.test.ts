import { describe, expect, it, vi } from "vitest";
import { keepRefreshVisible, makeRefreshErrorFeedback, makeRefreshFeedback } from "./refreshFeedback";

describe("makeRefreshFeedback", () => {
  it("confirms a successful manual refresh with a Hong Kong time", () => {
    expect(makeRefreshFeedback([{ status: "ok" }, { status: "ok" }], "2026-09-28T10:15:00.000Z")).toEqual({
      kind: "success",
      message: "已重新檢查官方資料 · 18:15 HKT",
    });
  });

  it("does not claim every source succeeded when feeds are unavailable", () => {
    expect(makeRefreshFeedback([{ status: "ok" }, { status: "unavailable" }, { status: "unavailable" }])).toEqual({
      kind: "partial",
      message: "2 項來源未能讀取",
    });
  });

  it("does not claim success when no source status was returned", () => {
    expect(makeRefreshFeedback([])).toEqual({
      kind: "partial",
      message: "未能確認資料來源狀態",
    });
  });

  it("handles an invalid or missing checked-at time without hiding the result", () => {
    expect(makeRefreshFeedback([{ status: "ok" }], "not-a-date")).toEqual({
      kind: "success",
      message: "已重新檢查官方資料",
    });
  });

  it("keeps the failure feedback distinct from a successful check", () => {
    expect(makeRefreshErrorFeedback()).toEqual({
      kind: "error",
      message: "更新失敗，保留舊資料",
    });
  });

  it("keeps the loading state visible for at least 650 ms on a fast response", async () => {
    vi.useFakeTimers();
    try {
      let settled = false;
      const refresh = keepRefreshVisible(Promise.resolve("fresh data")).then((value) => {
        settled = true;
        return value;
      });
      await Promise.resolve();
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(649);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await refresh).toBe("fresh data");
      expect(settled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
