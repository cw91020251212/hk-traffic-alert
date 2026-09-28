import type { PriorityAlert } from "../../../server/transportData";
import type { RouteArea, RouteMode } from "./routePlanner";
import officialAreaBoundaries from "@/data/hk-area-boundaries";

export type DecisionTone = "loading" | "clear" | "watch" | "high" | "critical" | "unknown";

export type JourneyDecision = {
  tone: DecisionTone;
  kicker: string;
  title: string;
  detail: string;
  action: string;
};

const AREA_TERMS: Record<RouteArea, string[]> = {
  港島: ["港島", "中環", "金鐘", "灣仔", "銅鑼灣", "天后", "北角", "鰂魚涌", "太古", "西灣河", "筲箕灣", "柴灣", "香港仔", "黃竹坑", "薄扶林", "西營盤", "上環", "堅尼地城"],
  九龍: ["九龍", "尖沙咀", "佐敦", "油麻地", "旺角", "太子", "深水埗", "長沙灣", "荔枝角", "紅磡", "何文田", "土瓜灣", "啟德", "九龍灣", "觀塘", "藍田", "黃大仙", "鑽石山"],
  "新界／離島": ["新界", "沙田", "大圍", "火炭", "馬場", "大學", "中文大學", "大埔", "大埔墟", "粉嶺", "上水", "元朗", "天水圍", "屯門", "荃灣", "葵芳", "葵興", "青衣", "將軍澳", "西貢", "東涌", "機場", "迪士尼", "離島", "長洲", "坪洲", "南丫島"],
};

type Position = readonly [longitude: number, latitude: number];
type Ring = readonly Position[];
type Polygon = readonly Ring[];
type BoundaryFeature = {
  properties: { area: RouteArea };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Polygon | readonly Polygon[] };
};

// Do not guess close to an administrative boundary: the local polygons are simplified.
const BOUNDARY_UNCERTAINTY_METERS = 120;
const METERS_PER_LATITUDE_DEGREE = 110_574;
const HK_AREA_FEATURES = officialAreaBoundaries.features as unknown as BoundaryFeature[];

function inspectRing(latitude: number, longitude: number, ring: Ring): { inside: boolean; nearBoundary: boolean } {
  let inside = false;
  let nearBoundary = false;
  const longitudeMetersPerDegree = 111_320 * Math.cos(latitude * Math.PI / 180);
  const pointX = longitude * longitudeMetersPerDegree;
  const pointY = latitude * METERS_PER_LATITUDE_DEGREE;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x1Longitude, y1Latitude] = ring[previous];
    const [x2Longitude, y2Latitude] = ring[index];
    const x1 = x1Longitude * longitudeMetersPerDegree;
    const y1 = y1Latitude * METERS_PER_LATITUDE_DEGREE;
    const x2 = x2Longitude * longitudeMetersPerDegree;
    const y2 = y2Latitude * METERS_PER_LATITUDE_DEGREE;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const segmentLengthSquared = dx * dx + dy * dy;
    const t = segmentLengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((pointX - x1) * dx + (pointY - y1) * dy) / segmentLengthSquared));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    if ((pointX - closestX) ** 2 + (pointY - closestY) ** 2 <= BOUNDARY_UNCERTAINTY_METERS ** 2) {
      nearBoundary = true;
    }

    if ((y1Latitude > latitude) !== (y2Latitude > latitude)
      && longitude < (x2Longitude - x1Longitude) * (latitude - y1Latitude) / (y2Latitude - y1Latitude) + x1Longitude) {
      inside = !inside;
    }
  }
  return { inside, nearBoundary };
}

function inspectPolygon(latitude: number, longitude: number, polygon: Polygon): { inside: boolean; nearBoundary: boolean } {
  const [outerRing, ...holes] = polygon;
  if (!outerRing) return { inside: false, nearBoundary: false };

  const outer = inspectRing(latitude, longitude, outerRing);
  if (!outer.inside) return { inside: false, nearBoundary: outer.nearBoundary };
  const holeStatuses = holes.map((hole) => inspectRing(latitude, longitude, hole));
  const insideHole = holeStatuses.some((status) => status.inside && !status.nearBoundary);
  return {
    inside: !insideHole,
    nearBoundary: !insideHole && (outer.nearBoundary || holeStatuses.some((status) => status.nearBoundary)),
  };
}

function getCoordinateAreas(latitude: number, longitude: number): RouteArea[] {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
  const areas = new Set<RouteArea>();
  const nearBoundaryAreas = new Set<RouteArea>();

  for (const feature of HK_AREA_FEATURES) {
    const polygons = feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates as Polygon]
      : feature.geometry.coordinates as readonly Polygon[];
    const statuses = polygons.map((polygon) => inspectPolygon(latitude, longitude, polygon));
    if (statuses.some((status) => status.inside)) areas.add(feature.properties.area);
    if (statuses.some((status) => status.nearBoundary)) nearBoundaryAreas.add(feature.properties.area);
  }

  // Accept a near-boundary point only when it is inside a district and all plausible
  // districts resolve to the same broad region; points just outside Hong Kong stay unknown.
  if (nearBoundaryAreas.size) {
    const plausibleAreas = new Set(Array.from(areas).concat(Array.from(nearBoundaryAreas)));
    return areas.size === 1 && plausibleAreas.size === 1 ? Array.from(areas) : [];
  }
  return areas.size === 1 ? Array.from(areas) : [];
}

export function inferRouteAreas(...places: string[]): RouteArea[] {
  const value = places.join(" ").trim().toLowerCase();
  if (!value) return [];
  const matchedByName = (Object.entries(AREA_TERMS) as Array<[RouteArea, string[]]>)
    .filter(([, terms]) => terms.some((term) => value.includes(term.toLowerCase())))
    .map(([area]) => area);
  const coordinatePattern = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/g;
  const coordinateMatches = Array.from(value.matchAll(coordinatePattern));
  const matchedByCoordinates = coordinateMatches.flatMap(([, latitudeText, longitudeText]) =>
    getCoordinateAreas(Number(latitudeText), Number(longitudeText)));
  return Array.from(new Set([...matchedByName, ...matchedByCoordinates]));
}

export function getJourneyDecision(
  alerts: PriorityAlert[],
  options: { loading?: boolean; degraded?: boolean; routeReady?: boolean; routeAreas?: RouteArea[] } = {},
): JourneyDecision {
  if (options.loading) {
    return { tone: "loading", kicker: "正在核對官方資料", title: "等一等，正在判斷。", detail: "正檢查道路、港鐵及生效中的天氣警告。", action: "正在更新" };
  }

  const top = alerts[0];
  if (options.routeReady) {
    const areas = options.routeAreas ?? [];
    const allHongKongWarning = top?.area === "全港";
    if (!areas.length && !allHongKongWarning && !top) {
      return { tone: "unknown", kicker: "未能估算涉及地區", title: "暫時無法比對這程。", detail: "請輸入較完整的起點和目的地。即使找到地區警報，現時也沒有核對實際道路路線。", action: "查看官方路線" };
    }
    if (top?.level === "critical") {
      return { tone: "critical", kicker: allHongKongWarning ? "全港警報生效" : "所選地區有嚴重警報", title: "請先查看官方警報。", detail: `${top.title}。目前只按地區提示，未核對實際道路路線。`, action: "查看警報" };
    }
    if (top?.level === "high") {
      return { tone: "high", kicker: allHongKongWarning ? "全港有重大警報" : "所選地區有重大警報", title: "請查看警報詳情再出發。", detail: `${top.title}。地區提示不代表事件一定在你的實際路線上。`, action: "查看警報" };
    }
    if (top) {
      return { tone: "watch", kicker: "所選地區有出行提醒", title: "出發前請看提醒詳情。", detail: `${top.title}。程式只按大區和出行方式篩選，未核對實際路線。`, action: "查看提醒" };
    }
    if (options.degraded) {
      return { tone: "unknown", kicker: "資料未齊，未能完整核對", title: "目前不能確認這程的情況。", detail: "部分官方來源暫時未能讀取；大區內亦沒有已讀取到的相關警報。", action: "重新檢查" };
    }
    return {
      tone: "clear",
      kicker: "初步地區比對完成",
      title: "暫未找到同區重大警報。",
      detail: "只按起點／目的地可辨認的大區及出行方式篩選，沒有檢查途經道路；這不代表實際路線安全或沒有事故。",
      action: "查看官方路線",
    };
  }
  if (top?.level === "critical") {
    return { tone: "critical", kicker: "需要立即留意", title: "請先查看官方警報。", detail: top.title, action: "查看警報詳情" };
  }
  if (top?.level === "high") {
    return { tone: "high", kicker: "有重大警報", title: "出發前請查看警報詳情。", detail: top.title, action: "查看警報詳情" };
  }
  if (top) {
    return { tone: "watch", kicker: "有出行提醒", title: "請查看相關提醒。", detail: top.title, action: "查看提醒" };
  }
  if (options.degraded) {
    return { tone: "unknown", kicker: "未能完整確認", title: "出發前請再核對一次。", detail: "部分官方來源暫時未能讀取，現時沒有足夠資料判斷。", action: "重新檢查" };
  }
  return {
    tone: "clear",
    kicker: "全港重大警報",
    title: "目前未見需要改路的重大警報。",
    detail: "這只表示已讀取的官方資料中未見達門檻的重大警報，不是對路況或旅程安全的保證。",
    action: "設定我的行程",
  };
}

export function modeLabel(mode: RouteMode) {
  return mode === "driving" ? "駕車" : mode === "transit" ? "公共交通" : "步行";
}
