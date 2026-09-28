import { describe, expect, it } from "vitest";
import { locationErrorMessage } from "./RouteLocationButton";

describe("locationErrorMessage", () => {
  it("explains a denied permission and offers a manual-entry alternative", () => {
    expect(locationErrorMessage(1)).toContain("未批准定位");
    expect(locationErrorMessage(1)).toContain("手動輸入起點");
  });

  it("explains timeout separately and handles other device errors", () => {
    expect(locationErrorMessage(3)).toContain("逾時");
    expect(locationErrorMessage(2)).toContain("裝置暫時無法定位");
  });
});
