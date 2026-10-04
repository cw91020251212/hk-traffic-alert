import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleMapsSearchUrl,
  buildOpenFreeMapUrl,
  buildTraditionalChineseLabelExpression,
  isValidMapCoordinate,
  officialCoordinatePoint,
  searchIncidentPlace,
  TRADITIONAL_CHINESE_LABEL_FIELDS,
  TRADITIONAL_CHINESE_MAP_LOCALE,
} from "./incidentMap";

describe("incident map locations", () => {
  it("prefers Traditional Chinese and local-script labels and translates MapLibre controls", () => {
    expect(TRADITIONAL_CHINESE_LABEL_FIELDS.slice(0, 3)).toEqual(["name:zh-Hant", "name:zh", "name:nonlatin"]);
    expect(buildTraditionalChineseLabelExpression()).toEqual([
      "coalesce",
      ["get", "name:zh-Hant"],
      ["get", "name:zh"],
      ["get", "name:nonlatin"],
      ["get", "name"],
      ["get", "name_en"],
      ["get", "name:latin"],
    ]);
    expect(TRADITIONAL_CHINESE_MAP_LOCALE["NavigationControl.ZoomIn"]).toBe("放大地圖");
    expect(TRADITIONAL_CHINESE_MAP_LOCALE["NavigationControl.ZoomOut"]).toBe("縮小地圖");
    expect(TRADITIONAL_CHINESE_MAP_LOCALE["AttributionControl.ToggleAttribution"]).toBe("切換地圖資料來源");
    expect(TRADITIONAL_CHINESE_MAP_LOCALE["CooperativeGesturesHandler.MobileHelpText"]).toBe("使用兩隻手指移動地圖");
    expect(TRADITIONAL_CHINESE_MAP_LOCALE["CooperativeGesturesHandler.WindowsHelpText"]).toContain("Ctrl");
    expect(TRADITIONAL_CHINESE_MAP_LOCALE["CooperativeGesturesHandler.MacHelpText"]).toContain("⌘");
  });

  it("accepts a complete geographic coordinate pair and rejects invalid or partial values", () => {
    expect(isValidMapCoordinate(22.31, 114.18)).toBe(true);
    expect(isValidMapCoordinate(undefined, 114.18)).toBe(false);
    expect(isValidMapCoordinate(22.31, undefined)).toBe(false);
    expect(isValidMapCoordinate(95, 114.18)).toBe(false);
    expect(isValidMapCoordinate(22.31, 194)).toBe(false);
    expect(officialCoordinatePoint(22.31, 114.18, "事故地點")).toMatchObject({ precision: "official-coordinate", latitude: 22.31, longitude: 114.18 });
    expect(officialCoordinatePoint(95, 114.18, "錯誤座標")).toBeNull();
  });

  it("converts GeoInfo Hong Kong 1980 Grid results into explicitly approximate WGS84 map references", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { nameZH: "新清水灣道", districtZH: "觀塘區", x: 840547.17885, y: 821558.88634 },
        { nameZH: "明顯錯誤的座標", x: 0, y: 0 },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchIncidentPlace("新清水灣道 map-test-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      label: "新清水灣道",
      latitude: expect.closeTo(22.333554, 0.00001),
      longitude: expect.closeTo(114.180856, 0.00001),
      precision: "government-place-reference",
    });
  });

  it("caches a repeated user-triggered location search and provides no-key OpenFreeMap and Google Maps URLs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ nameZH: "測試道路 map-test-cache", x: 840547.17885, y: 821558.88634 }],
    });
    vi.stubGlobal("fetch", fetchMock);
    const query = "測試道路 map-test-cache";
    const [first, second] = await Promise.all([searchIncidentPlace(query), searchIncidentPlace(query)]);
    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(buildOpenFreeMapUrl()).toBe("https://tiles.openfreemap.org/styles/bright");
    const googleUrl = new URL(buildGoogleMapsSearchUrl(`${first[0].latitude},${first[0].longitude}`));
    expect(googleUrl.hostname).toBe("www.google.com");
    expect(googleUrl.pathname).toBe("/maps/search/");
    expect(googleUrl.searchParams.get("api")).toBe("1");
    expect(googleUrl.searchParams.get("query")).toContain("22.333");
  });
});
