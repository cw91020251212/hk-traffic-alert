export type TrafficSource = {
  id: string;
  label: string;
  url: string;
  status: "ok" | "unavailable";
  checkedAt: string;
  message?: string;
};

export type TrafficEvent = {
  id: string;
  incidentNumber: string;
  title: string;
  detail: string;
  location: string;
  district: string;
  direction: string;
  status: string;
  announcedAt: string;
  latitude?: number;
  longitude?: number;
};

export function prioritizeTrafficEvents(events: TrafficEvent[]): TrafficEvent[] {
  return [...events].sort((a, b) => {
    const aClosed = /closed|完結|解封/i.test(a.status);
    const bClosed = /closed|完結|解封/i.test(b.status);
    if (aClosed !== bClosed) return Number(aClosed) - Number(bClosed);
    const aTime = Date.parse(a.announcedAt);
    const bTime = Date.parse(b.announcedAt);
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

export type PriorityAlert = {
  id: string;
  kind: "road" | "rail" | "weather" | "earthquake";
  level: "critical" | "high" | "watch";
  title: string;
  detail: string;
  location: string;
  area: "全港" | "港島" | "九龍" | "新界／離島" | "未標示";
  updatedAt?: string;
};

const MAJOR_TRAFFIC_PATTERN = /封路|封閉|封閉行車線|交通意外|道路事故|交通事故|車輛故障|行車線阻塞|行車線受阻|嚴重擠塞|嚴重阻塞|交通改道|巴士改道|交通管制|road closure|lane closure|traffic accident|major congestion|diversion|service disruption/i;

function alertArea(value: string): PriorityAlert["area"] {
  if (/中西區|灣仔|東區|南區|港島|金鐘|中環|銅鑼灣|柴灣|香港仔/.test(value)) return "港島";
  if (/九龍|油尖旺|深水埗|九龍城|黃大仙|觀塘|旺角|紅磡/.test(value)) return "九龍";
  if (/新界|離島|大圍|沙田|大埔|吐露港|中文大學|北區|西貢|將軍澳|荃灣|屯門|元朗|葵青|上水|粉嶺/.test(value)) return "新界／離島";
  return "未標示";
}

export function isMajorTrafficEvent(event: TrafficEvent): boolean {
  if (/closed|完結|解封|已清除|已取消/i.test(event.status)) return false;
  return MAJOR_TRAFFIC_PATTERN.test(`${event.title} ${event.detail}`);
}

export function selectPriorityAlerts(input: {
  trafficEvents: TrafficEvent[];
  warnings: WeatherWarning[];
  trains: TrainLineStatus[];
  earthquakes: EarthquakeBulletin[];
  roadRoutes: RoadSpeedRoute[];
  roadUpdatedAt?: string;
}): PriorityAlert[] {
  const alerts: PriorityAlert[] = [];
  for (const event of input.trafficEvents.filter(isMajorTrafficEvent)) {
    const location = [event.location, event.district, event.direction].filter(Boolean).join(" · ") || "地點以運輸署公告為準";
    alerts.push({ id: `road-${event.id}`, kind: "road", level: "high", title: event.title || "主要道路交通事件", detail: event.detail || "運輸署公布主要道路安排。", location, area: alertArea(`${event.location} ${event.district} ${event.direction}`), updatedAt: event.announcedAt });
  }
  for (const warning of input.warnings) {
    const subtype = warning.subtype ?? "";
    let level: PriorityAlert["level"] | undefined;
    if (warning.code === "WRAIN") level = subtype === "WRAINB" ? "critical" : subtype === "WRAINR" ? "high" : "watch";
    else if (warning.code === "WTCSGNL") level = /TC(?:8|9|10)/.test(subtype) ? "critical" : "watch";
    else if (warning.code === "WTMW") level = "critical";
    else if (warning.code === "WL" || warning.code === "WFNTSA") level = "high";
    if (!level) continue;
    alerts.push({ id: `weather-${warning.code}-${subtype}`, kind: "weather", level, title: warning.label, detail: warning.content || "香港天文台官方警告目前生效。", location: "香港天文台官方訊號", area: "全港", updatedAt: warning.updatedAt });
  }
  for (const train of input.trains.filter((item) => item.serviceDelayed || Boolean(item.message))) {
    alerts.push({ id: `rail-${train.line}`, kind: "rail", level: "high", title: `${train.label}服務延誤／安排`, detail: train.message || "港鐵 API 標記此綫服務延誤；原因及最新安排請查看官方消息。", location: `${train.station} · 以港鐵公告為準`, area: alertArea(train.station), updatedAt: train.currentTime });
  }
  for (const quake of input.earthquakes.filter((item) => item.kind === "felt")) {
    alerts.push({ id: `earthquake-felt-${quake.occurredAt ?? quake.updatedAt ?? quake.region ?? "latest"}`, kind: "earthquake", level: "high", title: "香港有感地震報告", detail: quake.content || [quake.region, quake.magnitude ? `M${quake.magnitude}` : ""].filter(Boolean).join(" · ") || "天文台有感地震報告。", location: quake.region || "香港天文台本地報告", area: alertArea(quake.region || "香港"), updatedAt: quake.updatedAt || quake.occurredAt });
  }
  for (const route of input.roadRoutes.filter((item) => item.speedKph !== undefined && item.speedKph < 25)) {
    const speed = route.speedKph ?? 0;
    alerts.push({ id: `road-speed-${route.id}`, kind: "road", level: speed < 15 ? "high" : "watch", title: `${route.title}車速偏慢`, detail: `${speed} km/h · 路線平均速度估算，並非運輸署官方警告。行程約 ${route.eta || "資料未提供"}。`, location: route.direction, area: alertArea(`${route.title} ${route.direction}`), updatedAt: input.roadUpdatedAt });
  }
  const rank: Record<PriorityAlert["level"], number> = { critical: 0, high: 1, watch: 2 };
  return alerts.sort((a, b) => rank[a.level] - rank[b.level] || (Date.parse(b.updatedAt ?? "") || 0) - (Date.parse(a.updatedAt ?? "") || 0));
}

export function filterPriorityAlerts(
  alerts: PriorityAlert[],
  area: "全部" | "全港" | "港島" | "九龍" | "新界／離島",
  kind: PriorityAlert["kind"] | "all",
): PriorityAlert[] {
  return alerts.filter((alert) => (area === "全部" || alert.area === area || alert.area === "全港") && (kind === "all" || alert.kind === kind));
}

export type PriorityFeedState =
  | { kind: "loading" }
  | { kind: "unavailable"; sources: TrafficSource[]; alerts: PriorityAlert[] }
  | { kind: "alerts"; alerts: PriorityAlert[] }
  | { kind: "clear" };

export function mergeEndpointFailureSources(
  sources: TrafficSource[],
  failures: { dashboard?: boolean; roadTraffic?: boolean },
): TrafficSource[] {
  const merged = [...sources];
  const markUnavailable = (source: TrafficSource) => {
    const existing = merged.findIndex((item) => item.id === source.id);
    if (existing >= 0) merged[existing] = source;
    else merged.push(source);
  };
  if (failures.dashboard) markUnavailable({ id: "td-traffic", label: "交通與災害主要警報資料", url: "https://www.td.gov.hk/tc/special_news/trafficnews.xml", status: "unavailable", checkedAt: new Date().toISOString(), message: "主要交通警報查詢端點暫時未能讀取。" });
  if (failures.roadTraffic) markUnavailable({ id: "tdas-road-speed", label: "吐露港道路速度估算", url: "https://data.gov.hk/en-data/dataset/hk-td-tis_28-traffic-data-tdas", status: "unavailable", checkedAt: new Date().toISOString(), message: "運輸署路況查詢端點暫時未能讀取。" });
  return merged;
}

export function getPriorityFeedState(loading: boolean, sources: TrafficSource[], alerts: PriorityAlert[]): PriorityFeedState {
  if (loading) return { kind: "loading" };
  const coreIds = new Set(["td-traffic", "hko-warning", "tdas-road-speed"]);
  const unavailable = sources.filter((source) => (coreIds.has(source.id) || source.id.startsWith("mtr-")) && source.status === "unavailable");
  if (unavailable.length) return { kind: "unavailable", sources: unavailable, alerts };
  if (alerts.length) return { kind: "alerts", alerts };
  return { kind: "clear" };
}

export type WeatherWarning = {
  code: string;
  label: string;
  subtype?: string;
  updatedAt?: string;
  content: string;
};

export type EarthquakeBulletin = {
  kind: "quick" | "felt";
  label: string;
  magnitude?: number;
  region?: string;
  occurredAt?: string;
  updatedAt?: string;
  latitude?: number;
  longitude?: number;
  content?: string;
};

export type TrainLineStatus = {
  line: string;
  label: string;
  station: string;
  currentTime?: string;
  arrivals: Array<{ direction: string; minutes: string; destination?: string; platform?: string }>;
  message?: string;
  informationUrl?: string;
  serviceDelayed?: boolean;
};

export type ArrivalEstimate = {
  route: string;
  destination: string;
  direction?: string;
  eta?: string;
  minutes?: number;
  note?: string;
};

export type MobilityDemo = {
  id: string;
  provider: string;
  location: string;
  scope: string;
  arrivals: ArrivalEstimate[];
  message?: string;
};

export type TransportDashboard = {
  fetchedAt: string;
  sources: TrafficSource[];
  warnings: WeatherWarning[];
  earthquakes: EarthquakeBulletin[];
  trafficEvents: TrafficEvent[];
  trains: TrainLineStatus[];
};

export type MobilityDashboard = {
  fetchedAt: string;
  sources: TrafficSource[];
  demos: MobilityDemo[];
};

export type RoadSpeedRoute = {
  id: string;
  title: string;
  direction: string;
  speedKph?: number;
  distance?: string;
  eta?: string;
  message?: string;
};

export type RoadTrafficDashboard = { fetchedAt: string; routes: RoadSpeedRoute[]; source: TrafficSource };

export type CurrentWeather = {
  updatedAt?: string;
  temperatures: Array<{ place: string; value: number }>;
  humidity?: number;
  humidityTime?: string;
  uvIndex?: number;
  uvDescription?: string;
  rainfall: Array<{ place: string; millimetres: number }>;
  rainfallPeriod?: string;
  warningMessages: string[];
};

export type WeatherForecastDay = {
  date: string;
  week: string;
  description: string;
  wind: string;
  minTemperature?: number;
  maxTemperature?: number;
  rainProbability: string;
};

export type AQHIStation = { place: string; type: string; index: string; time: string };

export type EnvironmentDashboard = {
  fetchedAt: string;
  current: CurrentWeather;
  generalSituation: string;
  forecastUpdatedAt?: string;
  forecast: WeatherForecastDay[];
  aqhiUpdatedAt?: string;
  aqhi: AQHIStation[];
  sources: TrafficSource[];
};

const WARNING_LABELS: Record<string, string> = {
  WTCSGNL: "颱風警告",
  WRAIN: "暴雨警告",
  WL: "山泥傾瀉警告",
  WTMW: "海嘯警告",
  WTS: "雷暴警告",
  WFNTSA: "新界北部水浸特別報告",
  WHOT: "酷熱天氣警告",
  WCOLD: "寒冷天氣警告",
  WFROST: "霜凍警告",
  WFIRE: "火災危險警告",
  WMSGNL: "強烈季候風信號",
  WTCPRE8: "熱帶氣旋特別報告",
};

const RAIN_LABELS: Record<string, string> = {
  WRAINA: "黃色暴雨警告",
  WRAINR: "紅色暴雨警告",
  WRAINB: "黑色暴雨警告",
};

const TYPHOON_LABELS: Record<string, string> = {
  TC1: "一號戒備信號",
  TC3: "三號強風信號",
  TC8NE: "八號東北烈風或暴風信號",
  TC8SE: "八號東南烈風或暴風信號",
  TC8SW: "八號西南烈風或暴風信號",
  TC8NW: "八號西北烈風或暴風信號",
  TC9: "九號烈風或暴風風力增強信號",
  TC10: "十號颶風信號",
  CANCEL: "所有熱帶氣旋信號已取消",
};

const TRAFFIC_FEED_URL = "https://www.td.gov.hk/tc/special_news/trafficnews.xml";
const WEATHER_API_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc";
const EARTHQUAKE_API_URL = "https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php?dataType=qem&lang=tc";
const FELT_EARTHQUAKE_API_URL = "https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php?dataType=feltearthquake&lang=tc";
const CURRENT_WEATHER_API_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc";
const FORECAST_API_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc";
const AQHI_XML_URL = "https://www.aqhi.gov.hk/epd/ddata/html/out/24aqhi_ChT.xml";
const TDAS_ROUTE_API_URL = "https://tdas-api.hkemobility.gov.hk/tdas/api/route";
const KMB_STOP_ID = "B8B04CD1E568B8F6";
const CITYBUS_ROUTE = "11";
const CITYBUS_STOP = "001145";
const HKKF_ROUTE_ID = 3;
const MTR_LINES = [
  { line: "EAL", label: "東鐵綫", station: "金鐘", stationCode: "ADM" },
  { line: "ISL", label: "港島綫", station: "金鐘", stationCode: "ADM" },
  { line: "SIL", label: "南港島綫", station: "金鐘", stationCode: "ADM" },
];
const MOBILITY_FALLBACKS: MobilityDemo[] = [
  { id: "kmb", provider: "九巴／龍運", location: "麗城花園第一期 (TW367)", scope: "單一荃灣站點 · 到站預報", arrivals: [] },
  { id: "citybus", provider: "城巴", location: "中環碼頭 - 巴士總站", scope: `路線 ${CITYBUS_ROUTE} · 單一站點 · 到站預報`, arrivals: [] },
  { id: "gmb", provider: "綠色專線小巴", location: "山頂廣場（下層巴士總站）", scope: "港島 1 號線 · 山頂－中環 · 到站預報", arrivals: [] },
  { id: "hkkf", provider: "香港九龍渡海小輪", location: "中環 6 號碼頭／坪洲", scope: "中環－坪洲航線 · 到船預報", arrivals: [] },
];

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .trim();
}

function readXmlField(xml: string, field: string): string {
  const match = xml.match(new RegExp(`<${field}>([\\s\\S]*?)</${field}>`, "i"));
  return match ? decodeXml(match[1].replace(/<[^>]*>/g, "")) : "";
}

function readCoordinate(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseSpecialTrafficNewsXml(xml: string): TrafficEvent[] {
  const entries = Array.from(xml.matchAll(/<message\b[^>]*>([\s\S]*?)<\/message>/gi));
  return entries.map(([, body], index) => {
    const latitude = readCoordinate(readXmlField(body, "LATITUDE"));
    const longitude = readCoordinate(readXmlField(body, "LONGITUDE"));
    return {
      id: readXmlField(body, "ID") || readXmlField(body, "INCIDENT_NUMBER") || `traffic-${index}`,
      incidentNumber: readXmlField(body, "INCIDENT_NUMBER"),
      title: [readXmlField(body, "INCIDENT_HEADING_CN"), readXmlField(body, "INCIDENT_DETAIL_CN")]
        .filter(Boolean)
        .join(" · ") || readXmlField(body, "INCIDENT_HEADING_EN"),
      detail: readXmlField(body, "CONTENT_CN") || readXmlField(body, "CONTENT_EN"),
      location: readXmlField(body, "LOCATION_CN") || readXmlField(body, "LOCATION_EN"),
      district: readXmlField(body, "DISTRICT_CN") || readXmlField(body, "DISTRICT_EN"),
      direction: readXmlField(body, "DIRECTION_CN") || readXmlField(body, "DIRECTION_EN"),
      status: readXmlField(body, "INCIDENT_STATUS_CN") || readXmlField(body, "INCIDENT_STATUS_EN"),
      announcedAt: readXmlField(body, "ANNOUNCEMENT_DATE"),
      ...(latitude === undefined ? {} : { latitude }),
      ...(longitude === undefined ? {} : { longitude }),
    };
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numericValue(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function normalizeWeatherWarnings(payload: unknown): WeatherWarning[] {
  const root = asRecord(payload);
  const details = Array.isArray(root.details) ? root.details : [];
  return details.flatMap((raw) => {
    const item = asRecord(raw);
    const code = textValue(item.warningStatementCode);
    if (!code) return [];
    const subtype = textValue(item.subtype) || undefined;
    if (code === "WTCSGNL" && subtype === "CANCEL") return [];
    const contents = Array.isArray(item.contents)
      ? item.contents.filter((line): line is string => typeof line === "string")
      : [];
    const label = code === "WRAIN" && subtype
      ? RAIN_LABELS[subtype] || WARNING_LABELS[code]
      : code === "WTCSGNL" && subtype
        ? `熱帶氣旋 · ${TYPHOON_LABELS[subtype] || subtype}`
        : WARNING_LABELS[code] || code;
    return [{
      code,
      label,
      ...(subtype ? { subtype } : {}),
      ...(textValue(item.updateTime) ? { updatedAt: textValue(item.updateTime) } : {}),
      content: contents.join("\n"),
    }];
  });
}

export function normalizeEarthquake(payload: unknown, kind: "quick" | "felt"): EarthquakeBulletin[] {
  const item = asRecord(payload);
  if (!Object.keys(item).length) return [];
  const contents = Array.isArray(item.contents)
    ? item.contents.filter((line): line is string => typeof line === "string")
    : [];
  const magnitude = numericValue(item.mag ?? item.magnitude);
  const occurredAt = textValue(item.ptime ?? item.time ?? item.occurredAt) || undefined;
  const updatedAt = textValue(item.updateTime) || undefined;
  const region = textValue(item.region ?? item.location) || undefined;
  const latitude = numericValue(item.lat ?? item.latitude);
  const longitude = numericValue(item.lon ?? item.longitude);
  return [{
    kind,
    label: kind === "quick" ? "天文台地震速報（全球 M6 或以上）" : "香港有感地震報告",
    ...(magnitude === undefined ? {} : { magnitude }),
    ...(region ? { region } : {}),
    ...(occurredAt ? { occurredAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    ...(latitude === undefined ? {} : { latitude }),
    ...(longitude === undefined ? {} : { longitude }),
    ...(contents.length ? { content: contents.join("\n") } : {}),
  }];
}

function numberFromWeatherValue(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) return undefined;
  const record = asRecord(value);
  if (record.value === "" || record.value === null) return undefined;
  const parsed = numericValue(record.value ?? value);
  return parsed === undefined ? undefined : parsed;
}

export function normalizeCurrentWeather(payload: unknown): CurrentWeather {
  const root = asRecord(payload);
  const temperatureRoot = asRecord(root.temperature);
  const temperatures = (Array.isArray(temperatureRoot.data) ? temperatureRoot.data : []).flatMap((raw) => {
    const item = asRecord(raw);
    const value = numericValue(item.value);
    return textValue(item.place) && value !== undefined ? [{ place: textValue(item.place), value }] : [];
  });
  const humidityRoot = asRecord(root.humidity);
  const hkoHumidity = (Array.isArray(humidityRoot.data) ? humidityRoot.data : []).map(asRecord).find((item) => item.place === "香港天文台");
  const uv = asRecord(root.uvindex);
  const rainfallRoot = asRecord(root.rainfall);
  const rainfall = (Array.isArray(rainfallRoot.data) ? rainfallRoot.data : []).flatMap((raw) => {
    const item = asRecord(raw);
    const value = numericValue(item.max ?? item.value);
    return textValue(item.place) && value !== undefined ? [{ place: textValue(item.place), millimetres: value }] : [];
  });
  const rainfallPeriod = [textValue(rainfallRoot.startTime), textValue(rainfallRoot.endTime)].filter(Boolean).join(" – ");
  const uvIndex = numberFromWeatherValue(uv);
  return {
    ...(textValue(root.updateTime) ? { updatedAt: textValue(root.updateTime) } : {}),
    temperatures,
    ...(hkoHumidity && numericValue(hkoHumidity.value) !== undefined ? { humidity: numericValue(hkoHumidity.value) } : {}),
    ...(textValue(humidityRoot.recordTime) ? { humidityTime: textValue(humidityRoot.recordTime) } : {}),
    ...(uvIndex === undefined ? {} : { uvIndex }),
    ...(textValue(uv.desc) ? { uvDescription: textValue(uv.desc) } : {}),
    rainfall,
    ...(rainfallPeriod ? { rainfallPeriod } : {}),
    warningMessages: (Array.isArray(root.warningMessage) ? root.warningMessage : []).filter((value): value is string => typeof value === "string" && Boolean(value.trim())),
  };
}

export function normalizeWeatherForecast(payload: unknown): { generalSituation: string; updateTime?: string; days: WeatherForecastDay[] } {
  const root = asRecord(payload);
  const entries = Array.isArray(root.weatherForecast) ? root.weatherForecast : [];
  const days = entries.flatMap((raw) => {
    const item = asRecord(raw);
    const date = textValue(item.forecastDate);
    if (!date) return [];
    const minTemperature = numberFromWeatherValue(item.forecastMintemp);
    const maxTemperature = numberFromWeatherValue(item.forecastMaxtemp);
    return [{
      date,
      week: textValue(item.week),
      description: textValue(item.forecastWeather),
      wind: textValue(item.forecastWind),
      ...(minTemperature === undefined ? {} : { minTemperature }),
      ...(maxTemperature === undefined ? {} : { maxTemperature }),
      rainProbability: textValue(item.PSR),
    }];
  });
  return {
    generalSituation: textValue(root.generalSituation),
    ...(textValue(root.updateTime) ? { updateTime: textValue(root.updateTime) } : {}),
    days,
  };
}

export function parseAQHIXml(xml: string): { updatedAt?: string; stations: AQHIStation[] } {
  const updatedAt = readXmlField(xml, "lastBuildDate");
  const latestByStation = new Map<string, AQHIStation>();
  for (const [, body] of Array.from(xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi))) {
    const place = readXmlField(body, "StationName");
    const time = readXmlField(body, "DateTime");
    const index = readXmlField(body, "aqhi");
    if (!place || !time || !index) continue;
    const old = latestByStation.get(place);
    if (!old || Date.parse(time) > Date.parse(old.time)) {
      latestByStation.set(place, { place, time, index, type: readXmlField(body, "type") });
    }
  }
  return { ...(updatedAt ? { updatedAt } : {}), stations: Array.from(latestByStation.values()).sort((a, b) => Number(b.index) - Number(a.index)) };
}

export function normalizeMtrSchedule(payload: unknown, line: string, label: string, station: string): TrainLineStatus {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const firstKey = Object.keys(data)[0];
  const schedule = asRecord(firstKey ? data[firstKey] : undefined);
  const arrivals: TrainLineStatus["arrivals"] = [];
  for (const direction of ["UP", "DOWN"]) {
    const trains = Array.isArray(schedule[direction]) ? schedule[direction] : [];
    const nextTrain = trains.map(asRecord).find((train) => train.valid === "Y" && textValue(train.ttnt) && textValue(train.ttnt) !== "-");
    if (nextTrain) {
      arrivals.push({
        direction,
        minutes: textValue(nextTrain.ttnt),
        ...(textValue(nextTrain.dest) ? { destination: textValue(nextTrain.dest) } : {}),
        ...(textValue(nextTrain.plat) ? { platform: textValue(nextTrain.plat) } : {}),
      });
    }
  }
  const status = numericValue(root.status);
  const serviceDelayed = textValue(root.isdelay) === "Y";
  return {
    line,
    label,
    station,
    ...(textValue(schedule.curr_time) && textValue(schedule.curr_time) !== "-" ? { currentTime: textValue(schedule.curr_time) } : {}),
    arrivals,
    ...(status === 0 ? { message: textValue(root.message) || "港鐵回報特別服務安排" } : {}),
    ...(serviceDelayed ? { serviceDelayed: true } : {}),
    ...(textValue(root.url) ? { informationUrl: textValue(root.url) } : {}),
  };
}

export function normalizeTdasRoute(payload: unknown, id: string, title: string, direction: string): RoadSpeedRoute {
  const root = asRecord(payload);
  const match = textValue(root.jSpeed).match(/[\d.]+/);
  const speedKph = match ? Number(match[0]) : undefined;
  return {
    id,
    title,
    direction,
    ...(speedKph === undefined || !Number.isFinite(speedKph) ? {} : { speedKph }),
    ...(textValue(root.distU) ? { distance: textValue(root.distU) } : {}),
    ...(textValue(root.eta) ? { eta: textValue(root.eta) } : {}),
    ...(!Object.keys(root).length || (!textValue(root.jSpeed) && !textValue(root.eta)) ? { message: textValue(root.Message) || "官方路況暫未提供" } : {}),
  };
}

export function normalizeKmbEta(payload: unknown, stopName: string): MobilityDemo {
  const root = asRecord(payload);
  const records = Array.isArray(root.data) ? root.data : [];
  const arrivals = records.flatMap((raw) => {
    const item = asRecord(raw);
    const eta = textValue(item.eta);
    const note = textValue(item.rmk_tc);
    if (!eta && !note) return [];
    const minutes = eta ? Math.max(0, Math.round((new Date(eta).getTime() - Date.now()) / 60_000)) : undefined;
    return [{
      route: textValue(item.route),
      destination: textValue(item.dest_tc) || "目的地未提供",
      direction: textValue(item.dir),
      ...(eta ? { eta, minutes } : {}),
      ...(note ? { note } : {}),
    }];
  }).slice(0, 6);
  return { id: "kmb", provider: "九巴／龍運", location: stopName, scope: "單一荃灣站點 · 到站預報", arrivals, ...(!arrivals.length ? { message: "現時沒有可顯示班次；可能是深夜、預定班次或站點資料暫缺。" } : {}) };
}

export function normalizeCitybusEta(payload: unknown, stopName: string): MobilityDemo {
  const root = asRecord(payload);
  const records = Array.isArray(root.data) ? root.data : [];
  const arrivals = records.flatMap((raw) => {
    const item = asRecord(raw);
    const eta = textValue(item.eta);
    const note = textValue(item.rmk_tc);
    if (!eta && !note) return [];
    const minutes = eta ? Math.max(0, Math.round((new Date(eta).getTime() - Date.now()) / 60_000)) : undefined;
    return [{ route: textValue(item.route), destination: textValue(item.dest_tc) || "目的地未提供", direction: textValue(item.dir), ...(eta ? { eta, minutes } : {}), ...(note ? { note } : {}) }];
  }).slice(0, 6);
  return { id: "citybus", provider: "城巴", location: stopName, scope: `路線 ${CITYBUS_ROUTE} · 單一站點 · 到站預報`, arrivals, ...(!arrivals.length ? { message: "此站此路線目前沒有回傳到站預報。" } : {}) };
}

export function normalizeGmbEta(payload: unknown, routeLabel: string, stopName: string, destination: string): MobilityDemo {
  const root = asRecord(payload);
  const result = asRecord(root.data);
  const rawEta = Array.isArray(result.eta) ? result.eta : [];
  const arrivals = rawEta.flatMap((raw) => {
    const item = asRecord(raw);
    const timestamp = textValue(item.timestamp);
    const diff = numericValue(item.diff);
    if (diff === undefined && !timestamp) return [];
    return [{
      route: routeLabel,
      destination,
      ...(timestamp ? { eta: timestamp } : {}),
      ...(diff === undefined ? {} : { minutes: diff }),
      ...(textValue(item.remarks_tc) ? { note: textValue(item.remarks_tc) } : {}),
    }];
  }).slice(0, 3);
  const reason = textValue(result.description_tc);
  return {
    id: "gmb",
    provider: "綠色專線小巴",
    location: stopName,
    scope: `${routeLabel} · 單一站點 · 到站預報`,
    arrivals,
    ...(!arrivals.length ? { message: result.enabled === false && reason ? `此路線站點沒有 ETA：${reason}` : "此站點目前沒有回傳到站預報；可能是服務時段外。" } : {}),
  };
}

function normalizeFerryEta(payload: unknown, routeName: string, direction: string): ArrivalEstimate[] {
  const root = asRecord(payload);
  const records = Array.isArray(root.data) ? root.data : [];
  return records.flatMap((raw) => {
    const item = asRecord(raw);
    const eta = textValue(item.ETA);
    if (!eta) return [];
    const minutes = Math.max(0, Math.round((new Date(eta).getTime() - Date.now()) / 60_000));
    return [{ route: routeName, destination: routeName, direction, eta, minutes, ...(textValue(item.session_time) ? { note: `班次 ${textValue(item.session_time)}` } : {}) }];
  }).slice(0, 3);
}

type FetchResult<T> = { data: T; source: TrafficSource };

async function fetchJson(url: string, timeoutMs = 9000): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "User-Agent": "HK-Traffic-Alert/0.1 (public-data prototype)" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchSource<T>(
  id: string,
  label: string,
  url: string,
  parse: (response: Response) => Promise<T>,
  timeoutMs = 12_000,
): Promise<FetchResult<T>> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(url, { headers: { "User-Agent": "HK-Traffic-Alert/0.1 (public-data prototype)" }, signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await parse(response);
    return { data, source: { id, label, url, status: "ok", checkedAt } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知錯誤";
    return {
      data: [] as T,
      source: { id, label, url, status: "unavailable", checkedAt, message },
    };
  }
}

let cached: { expiresAt: number; data: TransportDashboard } | undefined;
let inFlight: Promise<TransportDashboard> | undefined;
let mobilityCached: { expiresAt: number; data: MobilityDashboard } | undefined;
let mobilityInFlight: Promise<MobilityDashboard> | undefined;
let roadTrafficCached: { expiresAt: number; data: RoadTrafficDashboard } | undefined;
let roadTrafficInFlight: Promise<RoadTrafficDashboard> | undefined;
let environmentCached: { expiresAt: number; data: EnvironmentDashboard } | undefined;
let environmentInFlight: Promise<EnvironmentDashboard> | undefined;

export async function getTransportDashboard(): Promise<TransportDashboard> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.data;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const [traffic, weather, quickQuake, feltQuake, mtrResults] = await Promise.all([
      fetchSource("td-traffic", "運輸署特別交通消息（第二代 XML）", TRAFFIC_FEED_URL, async (response) => parseSpecialTrafficNewsXml(await response.text())),
      fetchSource("hko-warning", "香港天文台天氣警告（warningInfo）", WEATHER_API_URL, async (response) => normalizeWeatherWarnings(await response.json())),
      fetchSource("hko-earthquake-quick", "香港天文台地震速報（qem）", EARTHQUAKE_API_URL, async (response) => normalizeEarthquake(await response.json(), "quick")),
      fetchSource("hko-earthquake-felt", "香港天文台有感地震報告", FELT_EARTHQUAKE_API_URL, async (response) => normalizeEarthquake(await response.json(), "felt")),
      Promise.all(MTR_LINES.map(({ line, label, station, stationCode }) => fetchSource(
        `mtr-${line.toLowerCase()}`,
        `港鐵 Next Train · ${label} · ${station}`,
        `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${stationCode}&lang=TC`,
        async (response) => [normalizeMtrSchedule(await response.json(), line, label, station)],
      ))),
    ]);
    const fetchedAt = new Date().toISOString();
    const data: TransportDashboard = {
      fetchedAt,
      sources: [traffic.source, weather.source, quickQuake.source, feltQuake.source, ...mtrResults.map((result) => result.source)],
      trafficEvents: traffic.data as TrafficEvent[],
      warnings: weather.data as WeatherWarning[],
      earthquakes: [...quickQuake.data as EarthquakeBulletin[], ...feltQuake.data as EarthquakeBulletin[]],
      trains: mtrResults.flatMap((result) => result.data),
    };
    cached = { data, expiresAt: Date.now() + 60_000 };
    return data;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = undefined;
  }
}

export async function getMobilityDashboard(): Promise<MobilityDashboard> {
  const now = Date.now();
  if (mobilityCached && mobilityCached.expiresAt > now) return mobilityCached.data;
  if (mobilityInFlight) return mobilityInFlight;

  mobilityInFlight = (async () => {
    const results = await Promise.all([
      fetchSource("kmb-eta", "九巴／龍運 ETA · 麗城花園第一期", `https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${KMB_STOP_ID}`, async (response) => [normalizeKmbEta(await response.json(), "麗城花園第一期 (TW367)")], 16_000),
      fetchSource("citybus-eta", `城巴 ETA · 路線 ${CITYBUS_ROUTE}`, `https://rt.data.gov.hk/v1/transport/citybus-nwfb/eta/CTB/${CITYBUS_STOP}/${CITYBUS_ROUTE}`, async (response) => {
        const [etaPayload, stopPayload] = await Promise.all([response.json(), fetchJson(`https://rt.data.gov.hk/v1/transport/citybus-nwfb/stop/${CITYBUS_STOP}`)]);
        const stopData = asRecord(asRecord(stopPayload).data);
        return [normalizeCitybusEta(etaPayload, textValue(stopData.name_tc) || `城巴站 ${CITYBUS_STOP}`)];
      }),
      fetchSource("gmb-eta", "綠色專線小巴 ETA · 港島 1 號線", "https://data.etagmb.gov.hk/route/HKI/1", async (response) => {
        const routePayload = asRecord(await response.json());
        const routeList = Array.isArray(routePayload.data) ? routePayload.data : [];
        const route = routeList.map(asRecord).find((item) => item.region === "HKI" && item.route_code === "1");
        if (!route) throw new Error("找不到港島 1 號線路線資料");
        const routeId = numericValue(route.route_id);
        const directions = Array.isArray(route.directions) ? route.directions.map(asRecord) : [];
        const direction = directions.find((item) => numericValue(item.route_seq) === 1);
        if (!routeId || !direction) throw new Error("小巴路線方向資料不完整");
        const routeSequence = numericValue(direction.route_seq) ?? 1;
        const stopResponse = asRecord(await fetchJson(`https://data.etagmb.gov.hk/route-stop/${routeId}/${routeSequence}`));
        const stopData = asRecord(stopResponse.data);
        const routeStops = Array.isArray(stopData.route_stops) ? stopData.route_stops.map(asRecord) : [];
        const firstStop = routeStops[0];
        if (!firstStop) throw new Error("小巴路線沒有站點資料");
        const stopSequence = numericValue(firstStop.stop_seq) ?? 1;
        const stopName = textValue(firstStop.name_tc) || "山頂廣場（下層巴士總站）";
        const eta = await fetchJson(`https://data.etagmb.gov.hk/eta/route-stop/${routeId}/${routeSequence}/${stopSequence}`);
        const routeLabel = `港島 1 號線 · ${textValue(direction.orig_tc)} → ${textValue(direction.dest_tc)}`;
        return [normalizeGmbEta(eta, routeLabel, stopName, textValue(direction.dest_tc) || "中環")];
      }, 18_000),
      fetchSource("hkkf-eta", "香港九龍渡海小輪 ETA · 中環－坪洲", `https://www.hkkfeta.com/opendata/eta/${HKKF_ROUTE_ID}/inbound`, async (response) => {
        const [inboundPayload, outboundPayload] = await Promise.all([
          response.json(),
          fetchJson(`https://www.hkkfeta.com/opendata/eta/${HKKF_ROUTE_ID}/outbound`, 18_000),
        ]);
        const routeName = "中環－坪洲";
        const arrivals = [
          ...normalizeFerryEta(inboundPayload, routeName, "往中環"),
          ...normalizeFerryEta(outboundPayload, routeName, "往坪洲"),
        ];
        return [{ id: "hkkf", provider: "香港九龍渡海小輪", location: "中環 6 號碼頭／坪洲", scope: "中環－坪洲航線 · 到船預報", arrivals, ...(!arrivals.length ? { message: "目前沒有正在營運的到船預報，請核對渡輪時間表。" } : {}) }];
      }, 20_000),
    ]);
    const demos = results.map((result, index) => {
      const rows = Array.isArray(result.data) ? result.data as unknown as MobilityDemo[] : [];
      return rows[0] ?? { ...MOBILITY_FALLBACKS[index], ...(result.source.message ? { message: `來源錯誤：${result.source.message}` } : { message: "目前沒有即時班次；可能是服務時段外。" }) };
    });
    const data: MobilityDashboard = { fetchedAt: new Date().toISOString(), sources: results.map((result) => result.source), demos };
    mobilityCached = { data, expiresAt: Date.now() + 60_000 };
    return data;
  })();

  try {
    return await mobilityInFlight;
  } finally {
    mobilityInFlight = undefined;
  }
}

async function fetchTdasRoute(id: string, title: string, direction: string, start: { lat: number; long: number }, end: { lat: number; long: number }): Promise<RoadSpeedRoute> {
  const response = await fetch(TDAS_ROUTE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "HK-Traffic-Alert/0.1 (public-data prototype)" },
    body: JSON.stringify({ start: { ...start, buffer: 300 }, end: { ...end, buffer: 300 }, departIn: 0, lang: "tc", type: "ST" }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`TDAS HTTP ${response.status}`);
  return normalizeTdasRoute(await response.json(), id, title, direction);
}

export async function getRoadTrafficDashboard(): Promise<RoadTrafficDashboard> {
  const now = Date.now();
  if (roadTrafficCached && roadTrafficCached.expiresAt > now) return roadTrafficCached.data;
  if (roadTrafficInFlight) return roadTrafficInFlight;
  roadTrafficInFlight = (async () => {
    const checkedAt = new Date().toISOString();
    const routes = await Promise.allSettled([
      fetchTdasRoute("tolo-northbound", "吐露港公路走廊", "大圍 → 中文大學／大埔方向", { lat: 22.3720, long: 114.1780 }, { lat: 22.4136, long: 114.2105 }),
      fetchTdasRoute("tolo-southbound", "吐露港公路走廊", "中文大學／大埔 → 大圍方向", { lat: 22.4136, long: 114.2105 }, { lat: 22.3720, long: 114.1780 }),
    ]);
    const failed = routes.every((route) => route.status === "rejected");
    const rows: RoadSpeedRoute[] = routes.map((route, index) => route.status === "fulfilled" ? route.value : ({
      id: index === 0 ? "tolo-northbound" : "tolo-southbound",
      title: "吐露港公路走廊",
      direction: index === 0 ? "大圍 → 中文大學／大埔方向" : "中文大學／大埔 → 大圍方向",
      message: "暫時無法讀取路況，請查看運輸署即時交通圖。",
    }));
    const data: RoadTrafficDashboard = {
      fetchedAt: new Date().toISOString(),
      routes: rows,
      source: { id: "tdas-road-speed", label: "運輸署 TDAS 主要道路路線速度估算", url: TDAS_ROUTE_API_URL, status: failed ? "unavailable" : "ok", checkedAt, ...(failed ? { message: "所有路線速度查詢失敗" } : {}) },
    };
    roadTrafficCached = { data, expiresAt: Date.now() + 5 * 60_000 };
    return data;
  })();
  try { return await roadTrafficInFlight; } finally { roadTrafficInFlight = undefined; }
}

export async function getEnvironmentDashboard(): Promise<EnvironmentDashboard> {
  const now = Date.now();
  if (environmentCached && environmentCached.expiresAt > now) return environmentCached.data;
  if (environmentInFlight) return environmentInFlight;
  environmentInFlight = (async () => {
    const [current, forecast, aqhi] = await Promise.all([
      fetchSource("hko-current-weather", "香港天文台即時天氣（rhrread）", CURRENT_WEATHER_API_URL, async (response) => normalizeCurrentWeather(await response.json())),
      fetchSource("hko-9day-forecast", "香港天文台九日天氣預報（fnd）", FORECAST_API_URL, async (response) => normalizeWeatherForecast(await response.json())),
      fetchSource("epd-aqhi", "環保署空氣質素健康指數（AQHI）", AQHI_XML_URL, async (response) => parseAQHIXml(await response.text())),
    ]);
    const aqhiValue = asRecord(aqhi.data);
    const forecastValue = asRecord(forecast.data);
    const data: EnvironmentDashboard = {
      fetchedAt: new Date().toISOString(),
      current: current.data as CurrentWeather,
      generalSituation: textValue(forecastValue.generalSituation),
      ...(textValue(forecastValue.updateTime) ? { forecastUpdatedAt: textValue(forecastValue.updateTime) } : {}),
      forecast: Array.isArray(forecastValue.days) ? forecastValue.days as WeatherForecastDay[] : [],
      ...(textValue(aqhiValue.updatedAt) ? { aqhiUpdatedAt: textValue(aqhiValue.updatedAt) } : {}),
      aqhi: Array.isArray(aqhiValue.stations) ? aqhiValue.stations as AQHIStation[] : [],
      sources: [current.source, forecast.source, aqhi.source],
    };
    environmentCached = { data, expiresAt: Date.now() + 5 * 60_000 };
    return data;
  })();
  try { return await environmentInFlight; } finally { environmentInFlight = undefined; }
}
