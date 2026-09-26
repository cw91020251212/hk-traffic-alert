import { describe, expect, it } from "vitest";
import {
  normalizeEarthquake,
  normalizeCurrentWeather,
  normalizeCitybusEta,
  normalizeGmbEta,
  normalizeKmbEta,
  normalizeMtrSchedule,
  normalizeTdasRoute,
  normalizeWeatherForecast,
  normalizeWeatherWarnings,
  parseAQHIXml,
  parseSpecialTrafficNewsXml,
  prioritizeTrafficEvents,
} from "./transportData";

describe("parseSpecialTrafficNewsXml", () => {
  it("extracts Chinese incident fields, decodes XML entities, and preserves closed status", () => {
    const xml = `<?xml version="1.0"?><list><message>
      <INCIDENT_NUMBER>IN-26-123</INCIDENT_NUMBER>
      <INCIDENT_HEADING_CN>道路事故</INCIDENT_HEADING_CN>
      <INCIDENT_DETAIL_CN>車輛故障</INCIDENT_DETAIL_CN>
      <LOCATION_CN>公主道</LOCATION_CN><DISTRICT_CN></DISTRICT_CN>
      <DIRECTION_CN>獅子山隧道</DIRECTION_CN>
      <ANNOUNCEMENT_DATE>2026-09-26T22:01:00</ANNOUNCEMENT_DATE>
      <INCIDENT_STATUS_CN>完結</INCIDENT_STATUS_CN><ID>146893</ID>
      <CONTENT_CN>道路 &amp; 隧道現已解封。</CONTENT_CN>
      <LATITUDE></LATITUDE><LONGITUDE></LONGITUDE>
    </message></list>`;
    expect(parseSpecialTrafficNewsXml(xml)).toEqual([{
      id: "146893",
      incidentNumber: "IN-26-123",
      title: "道路事故 · 車輛故障",
      detail: "道路 & 隧道現已解封。",
      location: "公主道",
      district: "",
      direction: "獅子山隧道",
      status: "完結",
      announcedAt: "2026-09-26T22:01:00",
    }]);
  });

  it("returns an empty array for a valid feed with no messages", () => {
    expect(parseSpecialTrafficNewsXml("<list />")).toEqual([]);
  });
});

describe("normalizeWeatherWarnings", () => {
  it("labels rainstorm levels and landslip signals from HKO warning codes", () => {
    expect(normalizeWeatherWarnings({ details: [
      { warningStatementCode: "WRAIN", subtype: "WRAINB", updateTime: "2026-09-26T10:00:00+08:00", contents: ["黑雨生效"] },
      { warningStatementCode: "WL", updateTime: "2026-09-26T10:02:00+08:00", contents: ["山泥傾瀉警告"] },
    ] })).toEqual([
      { code: "WRAIN", label: "黑色暴雨警告", subtype: "WRAINB", updatedAt: "2026-09-26T10:00:00+08:00", content: "黑雨生效" },
      { code: "WL", label: "山泥傾瀉警告", updatedAt: "2026-09-26T10:02:00+08:00", content: "山泥傾瀉警告" },
    ]);
  });

  it("returns no current warnings when the active warning list is empty", () => {
    expect(normalizeWeatherWarnings({ details: [] })).toEqual([]);
  });

  it("labels typhoon signal subtypes and filters the cancellation marker", () => {
    expect(normalizeWeatherWarnings({ details: [
      { warningStatementCode: "WTCSGNL", subtype: "TC8NE", contents: ["八號信號生效"] },
      { warningStatementCode: "WTCSGNL", subtype: "CANCEL", contents: ["所有信號取消"] },
    ] })).toEqual([{
      code: "WTCSGNL",
      label: "熱帶氣旋 · 八號東北烈風或暴風信號",
      subtype: "TC8NE",
      content: "八號信號生效",
    }]);
  });
});

describe("normalizeEarthquake", () => {
  it("preserves the official magnitude, region, and timestamps", () => {
    expect(normalizeEarthquake({ mag: 6.7, region: "洛亞蒂群島", ptime: "2026-09-26T05:23:00+08:00", updateTime: "2026-09-26T05:35:00+08:00", lat: -21.24, lon: 168.55 }, "quick")).toEqual([{
      kind: "quick",
      label: "天文台地震速報（全球 M6 或以上）",
      magnitude: 6.7,
      region: "洛亞蒂群島",
      occurredAt: "2026-09-26T05:23:00+08:00",
      updatedAt: "2026-09-26T05:35:00+08:00",
      latitude: -21.24,
      longitude: 168.55,
    }]);
  });

  it("treats an empty object as no earthquake bulletin", () => {
    expect(normalizeEarthquake({}, "felt")).toEqual([]);
  });
});

describe("normalizeMtrSchedule", () => {
  it("extracts the next valid arrival in both directions", () => {
    expect(normalizeMtrSchedule({
      status: 1,
      data: { "EAL-ADM": {
        curr_time: "2026-09-26 18:25:00",
        UP: [{ valid: "Y", ttnt: "3", dest: "LOW", plat: "1" }],
        DOWN: [{ valid: "Y", ttnt: "5", dest: "ADM", plat: "2" }],
      } },
    }, "EAL", "東鐵綫", "金鐘")).toEqual({
      line: "EAL",
      label: "東鐵綫",
      station: "金鐘",
      currentTime: "2026-09-26 18:25:00",
      arrivals: [
        { direction: "UP", minutes: "3", destination: "LOW", platform: "1" },
        { direction: "DOWN", minutes: "5", destination: "ADM", platform: "2" },
      ],
    });
  });

  it("preserves the MTR service alert response and user-facing link", () => {
    expect(normalizeMtrSchedule({ status: 0, message: "此站暫停服務", url: "https://mtr.example/alert" }, "EAL", "東鐵綫", "金鐘")).toMatchObject({
      line: "EAL", message: "此站暫停服務", informationUrl: "https://mtr.example/alert", arrivals: [],
    });
  });
});

describe("MTR disruption, road speed and environment reports", () => {
  it("flags MTR's official isdelay marker even when no train ETA is returned", () => {
    expect(normalizeMtrSchedule({ status: 1, isdelay: "Y", data: { "EAL-ADM": { UP: [], DOWN: [] } } }, "EAL", "東鐵綫", "金鐘"))
      .toMatchObject({ line: "EAL", serviceDelayed: true, arrivals: [] });
  });

  it("extracts average route speed and ETA from TDAS localized fields", () => {
    expect(normalizeTdasRoute({ jSpeed: "53公里/小時", distU: "7.66公里", eta: "00:09" }, "tolo", "吐露港公路走廊", "大圍→大埔"))
      .toEqual({ id: "tolo", title: "吐露港公路走廊", direction: "大圍→大埔", speedKph: 53, distance: "7.66公里", eta: "00:09" });
  });

  it("normalizes current temperature, humidity, regional rainfall, UV and HKO messages", () => {
    expect(normalizeCurrentWeather({
      updateTime: "2026-09-27T00:02:00+08:00",
      temperature: { data: [{ place: "香港天文台", value: 28, unit: "C" }, { place: "屯門", value: 27, unit: "C" }] },
      humidity: { recordTime: "2026-09-27T00:00:00+08:00", data: [{ place: "香港天文台", value: 77 }] },
      uvindex: { value: 3, desc: "低" },
      rainfall: { startTime: "2026-09-26T22:45:00+08:00", endTime: "2026-09-26T23:45:00+08:00", data: [{ place: "北區", max: 12, unit: "mm" }] },
      warningMessage: ["火災危險警告為黃色"],
    })).toEqual({
      updatedAt: "2026-09-27T00:02:00+08:00",
      temperatures: [{ place: "香港天文台", value: 28 }, { place: "屯門", value: 27 }],
      humidity: 77,
      humidityTime: "2026-09-27T00:00:00+08:00",
      uvIndex: 3,
      uvDescription: "低",
      rainfall: [{ place: "北區", millimetres: 12 }],
      rainfallPeriod: "2026-09-26T22:45:00+08:00 – 2026-09-26T23:45:00+08:00",
      warningMessages: ["火災危險警告為黃色"],
    });
  });

  it("does not turn a blank night-time UV value into index zero", () => {
    expect(normalizeCurrentWeather({ uvindex: "" })).not.toHaveProperty("uvIndex");
  });

  it("normalizes HKO general weather situation and nine-day forecast", () => {
    expect(normalizeWeatherForecast({
      generalSituation: "未來兩三日天色大致良好。",
      updateTime: "2026-09-27T00:15:00+08:00",
      weatherForecast: [{ forecastDate: "20260927", week: "星期日", forecastWeather: "大致天晴。", forecastWind: "西南風3至4級。", forecastMintemp: { value: 27 }, forecastMaxtemp: { value: 33 }, PSR: "低" }],
    })).toEqual({
      generalSituation: "未來兩三日天色大致良好。",
      updateTime: "2026-09-27T00:15:00+08:00",
      days: [{ date: "20260927", week: "星期日", description: "大致天晴。", wind: "西南風3至4級。", minTemperature: 27, maxTemperature: 33, rainProbability: "低" }],
    });
  });

  it("selects the latest AQHI hour per station from the official 24-hour feed", () => {
    const result = parseAQHIXml(`<AQHI24HrReport><lastBuildDate>Sat, 26 Sep 2026 23:30:00 +0800</lastBuildDate>
      <item><type>一般監測站</type><StationName>中西區</StationName><DateTime>Sat, 26 Sep 2026 22:00:00 +0800</DateTime><aqhi>4</aqhi></item>
      <item><type>一般監測站</type><StationName>中西區</StationName><DateTime>Sat, 26 Sep 2026 23:00:00 +0800</DateTime><aqhi>5</aqhi></item>
      <item><type>路邊監測站</type><StationName>旺角</StationName><DateTime>Sat, 26 Sep 2026 23:00:00 +0800</DateTime><aqhi>7</aqhi></item>
    </AQHI24HrReport>`);
    expect(result).toEqual({ updatedAt: "Sat, 26 Sep 2026 23:30:00 +0800", stations: [
      { place: "旺角", type: "路邊監測站", time: "Sat, 26 Sep 2026 23:00:00 +0800", index: "7" },
      { place: "中西區", type: "一般監測站", time: "Sat, 26 Sep 2026 23:00:00 +0800", index: "5" },
    ] });
  });
});

describe("normalize bus and minibus arrival estimates", () => {
  it("keeps KMB service notes for routes without a live ETA", () => {
    expect(normalizeKmbEta({ data: [
      { route: "234C", dir: "O", dest_tc: "觀塘（翠屏北邨）", eta: null, rmk_tc: "服務只限於星期一至六" },
      { route: "234D", dest_tc: "觀塘", eta: null, rmk_tc: "" },
    ] }, "麗城花園")).toMatchObject({
      id: "kmb", provider: "九巴／龍運", location: "麗城花園", arrivals: [{ route: "234C", destination: "觀塘（翠屏北邨）", note: "服務只限於星期一至六" }],
    });
  });

  it("converts Citybus ETA to minutes and ignores null arrival entries", () => {
    const eta = new Date(Date.now() + 4 * 60_000).toISOString();
    expect(normalizeCitybusEta({ data: [
      { route: "11", dir: "O", dest_tc: "渣甸山", eta },
      { route: "11", dest_tc: "渣甸山", eta: null },
    ] }, "砵典乍街")).toMatchObject({
      id: "citybus", location: "砵典乍街", arrivals: [{ route: "11", destination: "渣甸山", direction: "O", eta }],
    });
  });

  it("preserves GMB relative minutes, timestamps, and service unavailability", () => {
    expect(normalizeGmbEta({ data: { enabled: true, eta: [{ eta_seq: 1, diff: 6, timestamp: "2026-09-27T10:20:00+08:00", remarks_tc: "" }] } }, "港島 1 號線", "山頂廣場", "中環")).toMatchObject({
      id: "gmb", location: "山頂廣場", arrivals: [{ route: "港島 1 號線", destination: "中環", minutes: 6 }],
    });
    expect(normalizeGmbEta({ data: { enabled: false, description_tc: "到站預報暫停" } }, "港島 1 號線", "山頂廣場", "中環")).toMatchObject({
      arrivals: [], message: "此路線站點沒有 ETA：到站預報暫停",
    });
  });
});
describe("prioritizeTrafficEvents", () => {
  it("places active notices before closed notices, then sorts each group by newest announcement", () => {
    const event = (id: string, status: string, announcedAt: string) => ({ id, incidentNumber: id, title: id, detail: "", location: "", district: "", direction: "", status, announcedAt });
    expect(prioritizeTrafficEvents([
      event("closed-new", "完結", "2026-09-27T10:00:00+08:00"),
      event("active-old", "仍然生效", "2026-09-27T08:00:00+08:00"),
      event("active-new", "仍然生效", "2026-09-27T09:00:00+08:00"),
    ]).map(({ id }) => id)).toEqual(["active-new", "active-old", "closed-new"]);
  });
});
