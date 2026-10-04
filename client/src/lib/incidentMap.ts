import proj4 from "proj4";

const CSDI_API = "https://www.map.gov.hk/gs/api/v1.0.0/locationSearch";
const CSDI_CACHE_KEY = "hk-traffic-alert:location-search:v1";
const CSDI_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
export const TRADITIONAL_CHINESE_LABEL_FIELDS = ["name:zh-Hant", "name:zh", "name:nonlatin", "name", "name_en", "name:latin"] as const;
export const TRADITIONAL_CHINESE_MAP_LOCALE = {
  "AttributionControl.ToggleAttribution": "切換地圖資料來源",
  "AttributionControl.MapFeedback": "地圖意見回饋",
  "FullscreenControl.Enter": "進入全螢幕",
  "FullscreenControl.Exit": "離開全螢幕",
  "GeolocateControl.FindMyLocation": "顯示我的位置",
  "GeolocateControl.LocationNotAvailable": "暫時無法取得你的位置",
  "LogoControl.Title": "MapLibre 地圖",
  "Map.Title": "互動地圖",
  "Marker.Title": "地圖標記",
  "NavigationControl.ResetBearing": "恢復地圖方向",
  "NavigationControl.ZoomIn": "放大地圖",
  "NavigationControl.ZoomOut": "縮小地圖",
  "CooperativeGesturesHandler.WindowsHelpText": "按住 Ctrl 鍵並滾動滑鼠滾輪以縮放地圖",
  "CooperativeGesturesHandler.MacHelpText": "按住 ⌘ 鍵並滾動滑鼠滾輪以縮放地圖",
  "CooperativeGesturesHandler.MobileHelpText": "使用兩隻手指移動地圖",
  "Popup.Close": "關閉地圖提示",
  "ScaleControl.Feet": "英尺",
  "ScaleControl.Meters": "米",
  "ScaleControl.Kilometers": "公里",
  "ScaleControl.Miles": "英里",
  "ScaleControl.NauticalMiles": "海里",
  "GlobeControl.Enable": "切換至地球模式",
  "GlobeControl.Disable": "切換至平面地圖",
} as const;
const COORDINATE_HK80 = "EPSG:2326";
const COORDINATE_WGS84 = "EPSG:4326";

proj4.defs(
  COORDINATE_HK80,
  "+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,-0.067753,2.243648,1.158828,-1.094246 +units=m +no_defs +type=crs",
);

export type IncidentMapPoint = {
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
  precision: "official-coordinate" | "government-place-reference";
};

type GeoInfoSearchResult = {
  x?: unknown;
  y?: unknown;
  nameZH?: unknown;
  nameEN?: unknown;
  addressZH?: unknown;
  addressEN?: unknown;
  districtZH?: unknown;
  districtEN?: unknown;
};

type CachedResults = { savedAt: number; results: IncidentMapPoint[] };

type NameGetExpression = ["get", typeof TRADITIONAL_CHINESE_LABEL_FIELDS[number]];
export type TraditionalChineseLabelExpression = ["coalesce", ...NameGetExpression[]];

export function buildTraditionalChineseLabelExpression(): TraditionalChineseLabelExpression {
  const nameFields: NameGetExpression[] = TRADITIONAL_CHINESE_LABEL_FIELDS.map((field) => ["get", field]);
  return ["coalesce", ...nameFields];
}

const memoryCache = new Map<string, IncidentMapPoint[]>();
let searchQueue = Promise.resolve();
let lastSearchStartedAt = 0;

export function isValidMapCoordinate(latitude?: number, longitude?: number): latitude is number {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude! >= -90 && latitude! <= 90
    && longitude! >= -180 && longitude! <= 180;
}

export function officialCoordinatePoint(latitude: number, longitude: number, label: string): IncidentMapPoint | null {
  if (!isValidMapCoordinate(latitude, longitude)) return null;
  return {
    latitude,
    longitude,
    label,
    precision: "official-coordinate",
  };
}

function normalizeSearchQuery(value: string): string {
  return value.replace(/[\s·•]+/g, " ").trim().replace(/\s+/g, " ").slice(0, 100);
}

function gridResultToPoint(result: GeoInfoSearchResult): IncidentMapPoint | null {
  const x = typeof result.x === "number" ? result.x : Number(result.x);
  const y = typeof result.y === "number" ? result.y : Number(result.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  const [longitude, latitude] = proj4(COORDINATE_HK80, COORDINATE_WGS84, [x, y]);
  if (!isValidMapCoordinate(latitude, longitude)) return null;
  // GeoInfo search is Hong Kong-specific; discard implausible coordinate transforms/results.
  if (latitude < 22.0 || latitude > 22.7 || longitude < 113.7 || longitude > 114.6) return null;

  const name = String(result.nameZH ?? result.nameEN ?? "").trim();
  const address = String(result.addressZH ?? result.addressEN ?? "").trim();
  const district = String(result.districtZH ?? result.districtEN ?? "").trim();
  const label = name || address || "政府地名搜尋結果";
  const description = [address && address !== name ? address : "", district].filter(Boolean).join(" · ");
  return {
    latitude,
    longitude,
    label,
    ...(description ? { description } : {}),
    precision: "government-place-reference",
  };
}

function readCached(query: string): IncidentMapPoint[] | undefined {
  const inMemory = memoryCache.get(query);
  if (inMemory) return inMemory;
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(CSDI_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, CachedResults>;
    const entry = parsed[query];
    if (!entry || Date.now() - entry.savedAt > CSDI_CACHE_TTL || !Array.isArray(entry.results)) return undefined;
    memoryCache.set(query, entry.results);
    return entry.results;
  } catch {
    return undefined;
  }
}

function writeCached(query: string, results: IncidentMapPoint[]) {
  memoryCache.set(query, results);
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(CSDI_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, CachedResults> : {};
    const validEntries = Object.fromEntries(Object.entries(parsed).filter(([, value]) => Date.now() - value.savedAt <= CSDI_CACHE_TTL).slice(-20));
    validEntries[query] = { savedAt: Date.now(), results };
    window.localStorage.setItem(CSDI_CACHE_KEY, JSON.stringify(validEntries));
  } catch {
    // Private browsing/storage limits must not prevent showing a map.
  }
}

async function fetchGeoInfoResults(query: string): Promise<IncidentMapPoint[]> {
  const cached = readCached(query);
  if (cached) return cached;

  const task = searchQueue.then(async () => {
    const latest = readCached(query);
    if (latest) return latest;
    const waitMs = Math.max(0, 1000 - (Date.now() - lastSearchStartedAt));
    if (waitMs) await new Promise((resolve) => globalThis.setTimeout(resolve, waitMs));
    lastSearchStartedAt = Date.now();
    const url = `${CSDI_API}?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`政府地名搜尋暫時無法使用（HTTP ${response.status}）`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error("政府地名搜尋回應格式未能識別");
    const results = payload.map((item) => gridResultToPoint(item as GeoInfoSearchResult)).filter((item): item is IncidentMapPoint => Boolean(item)).slice(0, 5);
    writeCached(query, results);
    return results;
  });
  searchQueue = task.then(() => undefined, () => undefined);
  return task;
}

export function searchIncidentPlace(queryText: string): Promise<IncidentMapPoint[]> {
  const query = normalizeSearchQuery(queryText);
  if (query.length < 2) return Promise.resolve([]);
  return fetchGeoInfoResults(query);
}

export function buildOpenFreeMapUrl(): string {
  return "https://tiles.openfreemap.org/styles/bright";
}

export function buildGoogleMapsSearchUrl(value: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}
