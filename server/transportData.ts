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
};

export type TransportDashboard = {
  fetchedAt: string;
  sources: TrafficSource[];
  warnings: WeatherWarning[];
  earthquakes: EarthquakeBulletin[];
  trafficEvents: TrafficEvent[];
  trains: TrainLineStatus[];
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
const MTR_LINES = [
  { line: "EAL", label: "東鐵綫", station: "金鐘", stationCode: "ADM" },
  { line: "ISL", label: "港島綫", station: "金鐘", stationCode: "ADM" },
  { line: "SIL", label: "南港島綫", station: "金鐘", stationCode: "ADM" },
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
  return {
    line,
    label,
    station,
    ...(textValue(schedule.curr_time) && textValue(schedule.curr_time) !== "-" ? { currentTime: textValue(schedule.curr_time) } : {}),
    arrivals,
    ...(status === 0 ? { message: textValue(root.message) || "港鐵回報特別服務安排" } : {}),
    ...(textValue(root.url) ? { informationUrl: textValue(root.url) } : {}),
  };
}

type FetchResult<T> = { data: T; source: TrafficSource };

async function fetchSource<T>(
  id: string,
  label: string,
  url: string,
  parse: (response: Response) => Promise<T>,
): Promise<FetchResult<T>> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "HK-Traffic-Alert/0.1 (public-data prototype)" },
      signal: AbortSignal.timeout(9000),
    });
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
