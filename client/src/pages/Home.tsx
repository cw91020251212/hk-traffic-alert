import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bike,
  BusFront,
  CarFront,
  ChevronRight,
  CloudLightning,
  CloudRain,
  Menu,
  MapPinned,
  Navigation,
  Plane,
  RefreshCw,
  Search,
  Ship,
  ShieldAlert,
  TrainFront,
  TriangleAlert,
  Waves,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ALERT_AREA_OPTIONS, ALERT_AREA_PREFERENCE_KEY, parseAlertAreaPreference, type AlertAreaPreference } from "@/lib/alertPreferences";
import { buildDirectionsUrl, parseRouteBookmarks, ROUTE_BOOKMARKS_PREFERENCE_KEY, selectAlertsForRouteAreas, type RouteArea, type RouteBookmark, type RouteMode } from "@/lib/routePlanner";
import { filterPriorityAlerts, getPriorityFeedState, mergeEndpointFailureSources, prioritizeTrafficEvents, selectPriorityAlerts, type AQHIStation, type EarthquakeBulletin, type MobilityDemo, type PriorityAlert, type TrafficEvent, type WeatherWarning } from "../../../server/transportData";

type Mode = {
  id: string;
  label: string;
  subtitle: string;
  icon: typeof CarFront;
  tone: string;
  source: string;
};

type AlertAreaFilter = AlertAreaPreference;
type AlertKindFilter = PriorityAlert["kind"] | "all";

function loadPreferredAlertArea(): AlertAreaFilter {
  if (typeof window === "undefined") return "全部";
  try {
    return parseAlertAreaPreference(window.localStorage.getItem(ALERT_AREA_PREFERENCE_KEY));
  } catch {
    return "全部";
  }
}

function loadRouteBookmarks(): RouteBookmark[] {
  if (typeof window === "undefined") return [];
  try { return parseRouteBookmarks(window.localStorage.getItem(ROUTE_BOOKMARKS_PREFERENCE_KEY)); } catch { return []; }
}

const modes: Mode[] = [
  { id: "road", label: "道路交通", subtitle: "事故・封路・路線車速", icon: CarFront, tone: "coral", source: "運輸署" },
  { id: "rail", label: "港鐵／鐵路", subtitle: "到站 ETA・服務安排", icon: TrainFront, tone: "indigo", source: "港鐵／運輸署" },
  { id: "bus", label: "巴士・小巴", subtitle: "改道・班次・停駛", icon: BusFront, tone: "gold", source: "營辦商／運輸署" },
  { id: "ferry", label: "渡輪・海路", subtitle: "航班・碼頭・海況", icon: Ship, tone: "teal", source: "營辦商／海事處" },
  { id: "air", label: "航空・機場", subtitle: "航班・機場交通", icon: Plane, tone: "sky", source: "香港國際機場" },
  { id: "other", label: "其他出行", subtitle: "單車・泊車・充電", icon: Bike, tone: "slate", source: "政府開放資料" },
];

const hazardFallbacks = [
  { name: "颱風及熱帶氣旋", icon: CloudLightning, tone: "hazard-coral", codes: ["WTCSGNL", "WTCPRE8"] },
  { name: "暴雨警告：黃・紅・黑", icon: CloudRain, tone: "hazard-gold", codes: ["WRAIN"] },
  { name: "山泥傾瀉警告", icon: TriangleAlert, tone: "hazard-earth", codes: ["WL"] },
  { name: "地震及海嘯資訊", icon: Waves, tone: "hazard-blue", codes: ["WTMW", "earthquake"] },
  { name: "其他警告：雷暴・酷熱・寒冷等", icon: TriangleAlert, tone: "hazard-earth", codes: ["WTS", "WHOT", "WCOLD", "WFIRE", "WMSGNL", "WFROST", "WFNTSA"] },
];

const examples = [
  { tag: "道路", title: "道路事故與交通安排", detail: "運輸署特別交通消息 XML 官方資料流", icon: CarFront, tone: "coral" },
  { tag: "天氣", title: "颱風、雨警及山泥傾瀉", detail: "天文台 warningInfo 官方公開 API", icon: CloudRain, tone: "gold" },
  { tag: "地震", title: "全球地震速報與本地有感報告", detail: "天文台 earthquake.php 公開 API", icon: Waves, tone: "indigo" },
];

const sourceCatalog = [
  { category: "道路", title: "運輸署特別交通消息（第二代）", status: "已接入", freshness: "官方目錄列為即時；沒有延遲 SLA", detail: "道路事故、封路及交通安排；是公告 feed，不等於全路網車速。", href: "https://www.td.gov.hk/tc/special_news/trafficnews.xml" },
  { category: "道路車速", title: "運輸署 TDAS 路線速度估算", status: "已接入・吐露港走廊雙向", freshness: "資料集每 5 分鐘更新；原型每 5 分鐘查詢", detail: "官方 API 回傳指定起終點間的平均速度與估算行程時間；目前示範大圍—中文大學／大埔走廊，不等於逐路段交通感應器。", href: "https://data.gov.hk/en-data/dataset/hk-td-tis_28-traffic-data-tdas" },
  { category: "天氣警告", title: "天文台 warningInfo API", status: "已接入", freshness: "開放 JSON API；頁面約每 60 秒查詢", detail: "含颱風信號、黃／紅／黑雨、山泥傾瀉、雷暴、海嘯等警告。", href: "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc" },
  { category: "天氣預報", title: "天文台即時天氣及九日預報", status: "已接入", freshness: "即時天氣每小時／有更新時；預報按官方更新時間", detail: "顯示天文台測站溫度、濕度、雨量、當前紫外線讀數、天氣概況與九日預報。", href: "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc" },
  { category: "空氣質素", title: "環保署 AQHI 24 小時 XML", status: "已接入・監測站列表", freshness: "每小時公布；按站點取最新一小時", detail: "顯示一般及路邊監測站 AQHI。數字愈高代表健康風險愈高；屬環境健康讀數而非預測。", href: "https://www.aqhi.gov.hk/epd/ddata/html/out/24aqhi_ChT.xml" },
  { category: "地震", title: "天文台地震 API", status: "已接入", freshness: "有新資料時更新；頁面約每 60 秒查詢", detail: "地震速報涵蓋全球 M6+；本地有感報告是另一個資料類型，兩者不可混為一談。", href: "https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php?dataType=qem&lang=tc" },
  { category: "港鐵", title: "MTR Next Train API", status: "已接入・金鐘試點", freshness: "官方資料集列每 10 秒更新；本頁每 60 秒刷新", detail: "目前展示金鐘站東鐵綫、港島綫、南港島綫到站預報；API 非完整事故警報。", href: "https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data" },
  { category: "巴士", title: "KMB／LWB ETA API", status: "已接入・荃灣單站", freshness: "ETA 每分鐘更新；路線／站點資料每日更新", detail: "目前只示範麗城花園第一期一個站；不是全港巴士警報。即時改道另看營辦商公告。", href: "https://data.gov.hk/en-data/dataset/hk-td-tis_21-etakmb" },
  { category: "巴士", title: "Citybus Next Bus API", status: "已接入・單站／一路線", freshness: "ETA 每分鐘更新", detail: "目前只示範城巴 11 號線一個站；不是服務中斷警報 feed。", href: "https://data.gov.hk/en-data/dataset/ctb-eta-transport-realtime-eta" },
  { category: "公共小巴", title: "綠色專線小巴 ETA API", status: "已接入・港島 1 號線試點", freshness: "ETA API 可查詢；路線清單每日更新", detail: "目前示範山頂－中環 1 號線的一個站。官方 API 可覆蓋綠色小巴路線，但此畫面未覆蓋全港；紅色小巴沒有已核實 ETA feed。", href: "https://data.gov.hk/en-data/dataset/hk-td-sm_7-real-time-arrival-data-of-gmb" },
  { category: "渡輪", title: "香港九龍渡海小輪 ETA API", status: "已接入・中環－坪洲", freshness: "官方 ETA API；本頁每 60 秒刷新", detail: "目前只查詢中環 6 號碼頭－坪洲航線；不代表全港渡輪，臨時停航另看營辦商公告。", href: "https://data.gov.hk/en-data/dataset/hkkf-hkkfdata-hkkf-eta-data" },
  { category: "海事", title: "海事處海事通告／RSS", status: "有限替代", freshness: "發布通告時更新；沒有即時延遲承諾", detail: "可補充航道、海上工程及航行安全消息，不是全港渡輪班次 API。", href: "https://www.mardep.gov.hk/en/legislation/notices/md-notices/index.html" },
  { category: "航空", title: "機管局航班即時網頁／開放資料", status: "不是即時 API", freshness: "data.gov.hk 資料只更新至前一曆日", detail: "當日航班可連往機管局官方航班頁；本次未查到可穩定公開接入的第三方即時航班 API。", href: "https://www.hongkongairport.com/en/flights/departures/passenger.page" },
];

function formatHkt(value?: string) {
  if (!value) return "時間未提供";
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}+08:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-HK", { timeZone: "Asia/Hong_Kong", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function isClosed(event: TrafficEvent) {
  return /closed|完結|解封/i.test(event.status);
}

function warningTone(warning: WeatherWarning) {
  if (warning.code === "WRAIN") return warning.subtype === "WRAINB" ? "urgent" : warning.subtype === "WRAINR" ? "high" : "watch";
  if (warning.code === "WTCSGNL" && ["TC8NE", "TC8SE", "TC8SW", "TC8NW", "TC9", "TC10"].includes(warning.subtype ?? "")) return "urgent";
  if (["WL", "WTMW"].includes(warning.code)) return "high";
  return "watch";
}

export default function Home() {
  const [openPanels, setOpenPanels] = useState({ transport: false, weather: false, sources: false });
  const [alertArea, setAlertArea] = useState<AlertAreaFilter>(loadPreferredAlertArea);
  const [alertKind, setAlertKind] = useState<AlertKindFilter>("all");
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState("");
  const [routeDestination, setRouteDestination] = useState("");
  const [routeMode, setRouteMode] = useState<RouteMode>("driving");
  const [routeAreas, setRouteAreas] = useState<RouteArea[]>([]);
  const [routeBookmarks, setRouteBookmarks] = useState<RouteBookmark[]>(loadRouteBookmarks);
  const [activeMode, setActiveMode] = useState("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try { window.localStorage.setItem(ALERT_AREA_PREFERENCE_KEY, alertArea); } catch { /* local preference is optional */ }
  }, [alertArea]);
  useEffect(() => {
    try { window.localStorage.setItem(ROUTE_BOOKMARKS_PREFERENCE_KEY, JSON.stringify(routeBookmarks)); } catch { /* local preference is optional */ }
  }, [routeBookmarks]);
  const dashboard = trpc.transport.dashboard.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const mobility = trpc.transport.mobility.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const roadTraffic = trpc.transport.roadTraffic.useQuery(undefined, { refetchInterval: 5 * 60_000, refetchOnWindowFocus: true, retry: 1 });
  const environment = trpc.transport.environment.useQuery(undefined, { refetchInterval: 5 * 60_000, refetchOnWindowFocus: true, retry: 1 });

  const visibleModes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return modes.filter((mode) => {
      const matchesMode = activeMode === "all" || mode.id === activeMode;
      const matchesSearch = !normalized || `${mode.label} ${mode.subtitle} ${mode.source}`.toLowerCase().includes(normalized);
      return matchesMode && matchesSearch;
    });
  }, [activeMode, query]);

  const data = dashboard.data;
  const activeWarnings = data?.warnings ?? [];
  const trafficEvents = data?.trafficEvents ?? [];
  const priorityTrafficEvents = useMemo(() => prioritizeTrafficEvents(trafficEvents), [trafficEvents]);
  const mobilityDemos = mobility.data?.demos ?? [];
  const earthquakes = data?.earthquakes ?? [];
  const queriedSources = useMemo(() => [...(data?.sources ?? []), ...(mobility.data?.sources ?? []), ...(roadTraffic.data?.source ? [roadTraffic.data.source] : []), ...(environment.data?.sources ?? [])], [data?.sources, mobility.data?.sources, roadTraffic.data?.source, environment.data?.sources]);
  const activeSources = useMemo(() => mergeEndpointFailureSources(queriedSources, { dashboard: dashboard.isError, roadTraffic: roadTraffic.isError }), [queriedSources, dashboard.isError, roadTraffic.isError]);
  const warningsUnavailable = activeSources.some((source) => source.id === "hko-warning" && source.status === "unavailable");
  const trafficUnavailable = activeSources.some((source) => source.id === "td-traffic" && source.status === "unavailable");
  const railUnavailable = activeSources.some((source) => source.id.startsWith("mtr-") && source.status === "unavailable");
  const busSourceStatuses = ["kmb-eta", "citybus-eta", "gmb-eta"].map((id) => activeSources.find((source) => source.id === id)?.status);
  const busUnavailableCount = busSourceStatuses.filter((status) => status === "unavailable").length;
  const ferryUnavailable = activeSources.some((source) => source.id === "hkkf-eta" && source.status === "unavailable");
  const lastUpdated = data?.fetchedAt ? formatHkt(data.fetchedAt) : "正在讀取";
  const rainfallEntries = environment.data?.current?.rainfall ?? [];
  const highestRainfall = [...rainfallEntries].sort((a, b) => b.millimetres - a.millimetres)[0];
  const rainfallPeriod = environment.data?.current?.rainfallPeriod?.split(" – ") ?? [];
  const priorityAlerts = useMemo(() => selectPriorityAlerts({
    trafficEvents,
    warnings: activeWarnings,
    trains: data?.trains ?? [],
    earthquakes,
    roadRoutes: roadTraffic.data?.routes ?? [],
    roadUpdatedAt: roadTraffic.data?.fetchedAt,
  }), [trafficEvents, activeWarnings, data?.trains, earthquakes, roadTraffic.data?.routes, roadTraffic.data?.fetchedAt]);
  const priorityFeed = getPriorityFeedState(dashboard.isLoading || roadTraffic.isLoading, activeSources, priorityAlerts);
  const regionalAlerts = filterPriorityAlerts(priorityAlerts, alertArea, "all");
  const filteredPriorityAlerts = filterPriorityAlerts(priorityAlerts, alertArea, alertKind);
  const priorityKindCounts = { road: regionalAlerts.filter((alert) => alert.kind === "road").length, rail: regionalAlerts.filter((alert) => alert.kind === "rail").length, weather: regionalAlerts.filter((alert) => alert.kind === "weather").length, earthquake: regionalAlerts.filter((alert) => alert.kind === "earthquake").length };
  const routeDirectionsUrl = useMemo(() => routeOrigin.trim() && routeDestination.trim() ? buildDirectionsUrl(routeOrigin, routeDestination, routeMode) : "", [routeOrigin, routeDestination, routeMode]);
  const routeRelatedAlerts = useMemo(() => selectAlertsForRouteAreas(priorityAlerts, routeAreas, routeMode), [priorityAlerts, routeAreas, routeMode]);
  const hasUnavailableAlerts = priorityFeed.kind === "unavailable";
  const displayAlerts = hasUnavailableAlerts ? priorityFeed.alerts : priorityFeed.kind === "alerts" ? priorityFeed.alerts : [];
  const openPanel = (panel: "transport" | "weather" | "sources") => {
    setOpenPanels((current) => ({ ...current, [panel]: true }));
    const target = panel === "transport" ? "transport-details" : panel === "weather" ? "weather-details" : "source-details";
    window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };
  const togglePanel = (panel: "transport" | "weather" | "sources") => setOpenPanels((current) => ({ ...current, [panel]: !current[panel] }));
  const saveRouteBookmark = () => {
    const origin = routeOrigin.trim();
    const destination = routeDestination.trim();
    if (!origin || !destination) return;
    const id = `${origin.toLocaleLowerCase()}|${destination.toLocaleLowerCase()}|${routeMode}`;
    const bookmark: RouteBookmark = { id, origin, destination, mode: routeMode, areas: [...routeAreas] };
    setRouteBookmarks((current) => [bookmark, ...current.filter((item) => item.id !== id)].slice(0, 5));
  };
  const loadRouteBookmark = (bookmark: RouteBookmark) => {
    setRouteOrigin(bookmark.origin);
    setRouteDestination(bookmark.destination);
    setRouteMode(bookmark.mode);
    setRouteAreas(bookmark.areas);
  };

  return (
    <main className="traffic-app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="交通警報器首頁">
          <span className="brand-mark"><Zap size={19} fill="currentColor" /></span>
          <span className="brand-copy"><strong>交通警報器</strong><small>HONG KONG · MOVE SMARTER</small></span>
        </a>
        <nav className="top-nav" aria-label="主要導覽">
          <button className="nav-current" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>警報首頁</button>
          <button onClick={() => openPanel("transport")}>道路／列車</button>
          <button onClick={() => openPanel("weather")}>天氣警告</button>
          <button onClick={() => openPanel("sources")}>資料來源</button>
        </nav>
        <div className="top-actions">
          <span className="preview-pill"><span /> 官方資料測試版</span>
          <button className="icon-button mobile-menu" aria-label="開啟選單"><Menu size={19} /></button>
          <button className="bell-button" aria-label="警報設定尚未開放" onClick={() => setNotice("警報訂閱會在完成使用者偏好設定及推播接入後開放。") }><Bell size={18} /><span className="bell-dot" /></button>
        </div>
      </header>

      <div className="page-shell" id="top">
        <section className="hero" id="overview">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> 香港出行，一站掌握</div>
            <h1>出門前，<span>先知道要唔要改路。</span></h1>
            <p>先睇會影響出行的主要路況、列車故障和生效中的天氣警告。普通天氣、AQHI 和到站資料不會塞進警報清單。</p>
            <div className="hero-meta">
              <span className="data-state"><span className="pulse-dot" />官方資料讀取 {dashboard.isFetching ? "中" : "完成"}</span>
              <span className="meta-divider" />
              <span>更新時間 {lastUpdated} HKT</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun-disc" /><div className="route route-one" /><div className="route route-two" /><div className="route route-three" />
            <div className="route-pin pin-one">M</div><div className="route-pin pin-two">!</div><div className="route-pin pin-three">↗</div>
            <div className="art-caption"><span>HK</span><span>OFFICIAL DATA FIRST</span></div>
          </div>
        </section>

        {notice && <div className="inline-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="關閉">×</button></div>}

        <section className="priority-feed" aria-labelledby="priority-heading" id="priority-alerts">
          <div className="priority-header">
            <div><div className="eyebrow small-eyebrow">RIGHT NOW · ACTION FIRST</div><h2 id="priority-heading">而家有冇事要留意？</h2></div>
            <button className="refresh-button" onClick={() => { void dashboard.refetch(); void roadTraffic.refetch(); }} disabled={dashboard.isFetching || roadTraffic.isFetching}><RefreshCw size={15} className={dashboard.isFetching || roadTraffic.isFetching ? "spin" : ""} /> 更新警報</button>
          </div>
          {priorityFeed.kind === "loading" ? <div className="priority-state" aria-live="polite"><span className="priority-loader" /> 正在檢查運輸署、港鐵及天文台官方來源…</div>
            : <>
              {hasUnavailableAlerts && <div className="priority-degraded" role="status"><TriangleAlert size={19} /><div><strong>有官方來源暫時未能讀取，不能確認全部警報狀態。</strong><span>{priorityFeed.kind === "unavailable" ? priorityFeed.sources.map((source) => source.label).join("、") : "請稍後重試，或查看官方來源。"} · 已收到的警報仍會保留。</span></div><button onClick={() => { void dashboard.refetch(); void roadTraffic.refetch(); }}>重試</button></div>}
              {displayAlerts.length > 0 ? <>
                <PriorityFilters area={alertArea} kind={alertKind} counts={priorityKindCounts} onAreaChange={setAlertArea} onKindChange={setAlertKind} />
                <div className="priority-list">{filteredPriorityAlerts.slice(0, 6).map((alert) => <PriorityAlertCard key={alert.id} alert={alert} />)}{filteredPriorityAlerts.length > 6 && <div className="priority-more">另外 {filteredPriorityAlerts.length - 6} 張符合門檻的警報未展開，請先選地區或類別縮窄結果。</div>}{filteredPriorityAlerts.length === 0 && <div className="priority-filter-empty">此地區／類別目前沒有符合門檻的警報；其他地區仍有 {displayAlerts.length} 項。</div>}</div>
              </> : hasUnavailableAlerts ? <div className="priority-state">目前沒有已核實的重大警報；由於部分來源失效，不能確認其餘情況。</div>
                : <div className="priority-clear"><span className="clear-icon"><ShieldAlert size={20} /></span><div><strong>目前沒有已核實、符合門檻的重大交通警報。</strong><span>普通落雨、一般天氣、AQHI 和常規到站時間不會當作警報。資料源失效會另外提示。</span></div></div>}
            </>}
          <div className="journey-actions" aria-label="常用出行情境">
            <button onClick={() => openPanel("transport")}><CarFront size={17} /><span><strong>出門返工／放工</strong><small>查主幹道路況</small></span><ChevronRight size={16} /></button>
            <button onClick={() => openPanel("transport")}><TrainFront size={17} /><span><strong>轉乘／趕車</strong><small>查列車及 ETA</small></span><ChevronRight size={16} /></button>
            <button onClick={() => openPanel("weather")}><CloudLightning size={17} /><span><strong>惡劣天氣／跨區</strong><small>看生效警告</small></span><ChevronRight size={16} /></button>
          </div>
          <details className="route-planner" open={routePlannerOpen} onToggle={(event) => setRoutePlannerOpen((event.currentTarget as HTMLDetailsElement).open)}>
            <summary><MapPinned size={16} /><span><strong>規劃 A 到 B 路線</strong><small>查路線建議及沿途可能相關警報</small></span><ChevronRight size={16} /></summary>
            <div className="route-planner-body">
              <div className="route-inputs"><label>起點<input value={routeOrigin} onChange={(event) => setRouteOrigin(event.target.value)} placeholder="例如：金鐘站" autoComplete="street-address" /></label><span className="route-arrow">→</span><label>目的地<input value={routeDestination} onChange={(event) => setRouteDestination(event.target.value)} placeholder="例如：大埔墟站" autoComplete="street-address" /></label></div>
              <label className="route-mode-label">出行方式<select value={routeMode} onChange={(event) => setRouteMode(event.target.value as RouteMode)}><option value="driving">駕車（Google Maps 路線建議）</option><option value="transit">公共交通（Google Maps 路線建議）</option><option value="walking">步行（Google Maps 路線建議）</option></select></label>
              <div className="route-area-control"><strong>途中可能經過的地區（可多選）</strong><div className="route-area-chips">{(["港島", "九龍", "新界／離島"] as RouteArea[]).map((area) => <button type="button" key={area} className={routeAreas.includes(area) ? "route-area-chip active" : "route-area-chip"} aria-pressed={routeAreas.includes(area)} onClick={() => setRouteAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area])}>{area}</button>)}</div></div>
              {routeDirectionsUrl ? <a className="route-submit" href={routeDirectionsUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> 在 Google Maps 查看路線建議 <ArrowUpRight size={14} /></a> : <div className="route-submit disabled"><Navigation size={16} /> 輸入起點及目的地以查看路線建議</div>}
              <button type="button" className="route-save-button" disabled={!routeDirectionsUrl} onClick={saveRouteBookmark}>儲存為本機常用路線</button>
              {routeBookmarks.length > 0 && <div className="saved-routes"><strong>本機常用路線（最多 5 條）</strong>{routeBookmarks.map((bookmark) => <div className="saved-route-row" key={bookmark.id}><button type="button" className="saved-route-select" onClick={() => loadRouteBookmark(bookmark)}>{bookmark.origin} → {bookmark.destination}<small>{bookmark.mode === "driving" ? "駕車" : bookmark.mode === "transit" ? "公共交通" : "步行"} · {bookmark.areas.length ? bookmark.areas.join("／") : "只看全港警告"}</small></button><button type="button" className="saved-route-remove" aria-label={`刪除 ${bookmark.origin} 至 ${bookmark.destination} 常用路線`} onClick={() => setRouteBookmarks((current) => current.filter((item) => item.id !== bookmark.id))}>×</button></div>)}</div>}
              <div className="route-safety-note">路線及最快／替代選項由 Google Maps 計算；這裡只按你選的地區列出可能相關的官方警報，並非精確路線封路檢查或到達時間保證。</div>
              <div className="route-alerts"><strong>可能相關的官方警報{routeAreas.length ? ` · ${routeAreas.join("、")}` : " · 全港級別"}</strong>{routeRelatedAlerts.length ? routeRelatedAlerts.slice(0, 4).map((alert) => <PriorityAlertCard key={`route-${alert.id}`} alert={alert} />) : <p>目前沒有可列出的符合門檻警報。若想查途經地區的警報，請選上方地區。</p>}</div>
              <a className="official-route-fallback" href="https://www.hkemobility.gov.hk/" target="_blank" rel="noreferrer">亦可使用運輸署 HKeMobility 官方路線搜尋 <ArrowUpRight size={13} /></a>
            </div>
          </details>
          <div className="prototype-footnote"><ShieldAlert size={13} /> 資料測試版：只覆蓋吐露港走廊、金鐘港鐵及部分交通試點；並非全港全面警報服務。遇緊急情況請以官方公告為準。</div>
        </section>

        <details className="detail-accordion transport-accordion" id="transport-details" open={openPanels.transport} onToggle={(event) => setOpenPanels((current) => ({ ...current, transport: (event.currentTarget as HTMLDetailsElement).open }))}>
          <summary><span><CarFront size={17} /> 查道路、列車、巴士及渡輪詳情</span><ChevronRight className="disclosure-chevron" size={17} /><small>指定路段／站點 ETA</small></summary>
          <section className="section-block transport-section" aria-labelledby="transport-heading">
          <div className="section-heading">
            <div><div className="eyebrow small-eyebrow">TRANSPORT NETWORK</div><h2 id="transport-heading">交通網絡</h2></div>
            <button className="refresh-button" onClick={() => { void dashboard.refetch(); void mobility.refetch(); void roadTraffic.refetch(); void environment.refetch(); }} disabled={dashboard.isFetching}><RefreshCw size={15} className={dashboard.isFetching || mobility.isFetching || roadTraffic.isFetching || environment.isFetching ? "spin" : ""} /> 更新資料</button>
          </div>
          <div className="toolbar">
            <div className="filter-tabs" role="tablist" aria-label="交通類別篩選">
              <button className={activeMode === "all" ? "filter-tab active" : "filter-tab"} onClick={() => setActiveMode("all")}>全部</button>
              <button className={activeMode === "road" ? "filter-tab active" : "filter-tab"} onClick={() => setActiveMode("road")}>道路</button>
              <button className={activeMode === "rail" ? "filter-tab active" : "filter-tab"} onClick={() => setActiveMode("rail")}>鐵路</button>
              <button className={activeMode === "bus" ? "filter-tab active" : "filter-tab"} onClick={() => setActiveMode("bus")}>巴士・小巴</button>
              <button className={activeMode === "ferry" ? "filter-tab active" : "filter-tab"} onClick={() => setActiveMode("ferry")}>渡輪</button>
              <button className={activeMode === "air" ? "filter-tab active" : "filter-tab"} onClick={() => setActiveMode("air")}>航空</button>
            </div>
            <label className="search-box"><Search size={16} /><input aria-label="搜尋交通類別" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋交通方式" /></label>
          </div>
          <div className="transport-grid">
            {visibleModes.map((mode) => {
              const Icon = mode.icon;
              const connected = mode.id === "road" || mode.id === "rail" || mode.id === "bus" || mode.id === "ferry";
              const modeStatus = mode.id === "road"
                ? roadTraffic.data?.source.status === "unavailable" ? "車速來源暫停" : trafficUnavailable ? "已接車速，消息暫停" : "已接車速＋消息"
                : mode.id === "rail"
                  ? railUnavailable ? "來源暫停" : "已接金鐘 ETA"
                  : mode.id === "bus"
                    ? busUnavailableCount === 3 ? "ETA 來源暫停" : busUnavailableCount ? "ETA 部分可用" : "已接 ETA 試點"
                    : mode.id === "ferry"
                      ? ferryUnavailable ? "來源暫停" : "已接單一航線 ETA"
                      : "規劃接入";
              return <button key={mode.id} className="transport-card" onClick={() => setNotice(mode.id === "road" ? "下方有運輸署道路消息及吐露港雙向速度估算；如需全港即時圖，可開啟官方交通圖。" : connected ? "交通及到站資料已讀取於下方；ETA 與事故／停駛公告是不同資料。" : `${mode.label}：已查到可用官方資料源，完整路線／即時狀態頁面正在下一階段接入。`)}>
                <span className={`mode-icon ${mode.tone}`}><Icon size={20} strokeWidth={1.8} /></span>
                <span className="mode-text"><strong>{mode.label}</strong><small>{mode.subtitle}</small></span>
                <span className={`mode-status ${connected && !modeStatus.includes("暫停") ? "connected" : "planned"}`}><i />{modeStatus}</span>
                <ChevronRight className="mode-chevron" size={17} />
                <span className="mode-source">資料方向：{mode.source}</span>
              </button>;
            })}
            {visibleModes.length === 0 && <div className="empty-search">找不到相關交通類別，試試其他關鍵字。</div>}
          </div>
          <div className="road-traffic-panel" id="road-traffic">
            <div className="road-traffic-head"><span><CarFront size={16} /> 主要道路路況 <small>吐露港公路走廊 · 路線平均速度估算</small></span><span>{roadTraffic.isFetching ? "更新中" : `查詢時間 ${formatHkt(roadTraffic.data?.fetchedAt)} HKT`}</span></div>
            <div className="road-speed-grid">
              {(roadTraffic.data?.routes ?? []).map((route) => {
                const speed = route.speedKph;
                const condition = speed === undefined ? "資料暫缺" : speed < 25 ? "行車緩慢" : speed < 45 ? "車速偏慢" : "一般流速";
                const tone = speed === undefined ? "" : speed < 25 ? "road-slow" : speed < 45 ? "road-watch" : "road-clear";
                return <article className="road-speed-card" key={route.id}><div className="road-speed-route"><strong>{route.title}</strong><span>{route.direction}</span></div><div className={`road-speed-value ${tone}`}>{speed === undefined ? "—" : <>{speed}<small> km/h</small></>}</div><div className={`road-speed-condition ${tone}`}>{condition}</div><div className="road-speed-meta">行程 {route.distance || "—"} · 預計 {route.eta || "—"}</div>{route.message && <div className="road-speed-meta">{route.message}</div>}</article>;
              })}
              {!roadTraffic.data?.routes.length && <div className="road-speed-empty">{roadTraffic.isLoading ? "正在讀取運輸署路線速度…" : "TDAS 路況暫時未能讀取。"}</div>}
            </div>
            <div className="road-traffic-foot">運輸署 TDAS 路線平均速度估算，官方資料集每 5 分鐘更新；本卡為大圍—中文大學／大埔一段走廊，不代表每個路段。慢／快狀態按車速作參考，非運輸署官方警報級別。<a href="https://www.hkemobility.gov.hk/tc/traffic-information/live/cctv/all?cctv=on&jt=on&smp=on&ts=on" target="_blank" rel="noreferrer">查看全港即時交通圖 <ArrowUpRight size={12} /></a></div>
          </div>
          <div className="train-status-panel">
            <div className="train-status-head"><span><TrainFront size={15} /> 港鐵到站預報 <small>金鐘站 · 東鐵綫／港島綫／南港島綫</small></span><span>官方資料每 10 秒更新 · 本頁約每 60 秒刷新</span></div>
            <div className="train-status-grid">
              {(data?.trains ?? []).map((train) => {
                const sourceUnavailable = activeSources.find((source) => source.id === `mtr-${train.line.toLowerCase()}`)?.status === "unavailable";
                return <div className="train-line-card" key={train.line}>
                  <strong>{train.label}</strong>
                  {train.message ? <a className="train-service-alert" href={train.informationUrl || "https://www.mtr.com.hk/tc/customer/main/service_status.html"} target="_blank" rel="noreferrer">{train.message}<ArrowUpRight size={13} /></a>
                    : sourceUnavailable ? <span className="train-no-data">目前無法讀取此綫到站資料</span>
                      : <>{train.serviceDelayed && <a className="train-service-alert" href="https://www.mtr.com.hk/tc/customer/main/service_status.html" target="_blank" rel="noreferrer">港鐵官方 API 標記此綫服務延誤；查看最新車務狀況<ArrowUpRight size={13} /></a>}{train.arrivals.length ? <div className="train-arrivals">{train.arrivals.map((arrival) => <span key={arrival.direction}><small>{arrival.direction}</small><b>{arrival.minutes === "0" ? "即將到站" : `${arrival.minutes} 分鐘`}</b>{arrival.platform ? <i>{arrival.platform} 號月台</i> : null}</span>)}</div> : <span className="train-no-data">API 暫未提供到站預報</span>}</>}
                  <small className="train-line-time">{train.currentTime ? `資料時間 ${formatHkt(train.currentTime)} HKT` : "資料時間以港鐵回應為準"}</small>
                </div>;
              })}
              {!data?.trains?.length && <div className="train-no-data">{dashboard.isLoading ? "正在讀取港鐵資料…" : "港鐵到站資料暫時未能讀取。"}　<a href="https://www.mtr.com.hk/tc/customer/main/service_status.html" target="_blank" rel="noreferrer">查看港鐵服務狀態</a></div>}
            </div>
          </div>
          <div className="mobility-panel">
            <div className="mobility-head"><span><BusFront size={15} /> 巴士・小巴・渡輪 ETA <small>官方營辦商 API 示範資料</small></span><span>{mobility.isFetching ? "ETA 資料更新中" : `查詢時間 ${formatHkt(mobility.data?.fetchedAt)} HKT`}</span></div>
            <div className="mobility-grid">
              {mobilityDemos.map((demo: MobilityDemo) => {
                const source = activeSources.find((item) => item.id === `${demo.id === "hkkf" ? "hkkf" : demo.id}-eta`);
                return <article className="mobility-card" key={demo.id}>
                  <div className="mobility-card-heading"><strong>{demo.provider}</strong><span className={source?.status === "unavailable" ? "mobility-state error" : "mobility-state"}><i />{source?.status === "unavailable" ? "來源暫停" : source?.status === "ok" ? "API 可用" : "載入中"}</span></div>
                  <div className="mobility-place">{demo.location}</div>
                  <div className="mobility-scope">{demo.scope}</div>
                  {demo.arrivals.length ? <div className="mobility-arrivals">{demo.arrivals.map((arrival, index) => <div className="mobility-arrival" key={`${arrival.route}-${arrival.direction}-${index}`}>
                    <span className="mobility-route">{arrival.route}</span><span className="mobility-destination">{arrival.destination}{arrival.direction ? ` · ${arrival.direction}` : ""}</span>
                    <b>{arrival.minutes === undefined ? (arrival.note || "班次") : arrival.minutes <= 0 ? "即將到站" : `${arrival.minutes} 分鐘`}</b>
                    {arrival.note && arrival.minutes !== undefined ? <small>{arrival.note}</small> : null}
                  </div>)}</div> : <div className="mobility-empty">{source?.status === "unavailable" ? "目前無法讀取，稍後可重試。" : demo.message || "目前沒有即時班次；可能是服務時段外。"}</div>}
                  <div className="mobility-foot">{source?.status === "unavailable" ? "來源暫停" : `來源更新 ${formatHkt(source?.checkedAt)} HKT`} · 每分鐘快取</div>
                </article>;
              })}
              {!mobilityDemos.length && <div className="mobility-empty">{mobility.isLoading ? "正在分開查詢各營辦商 ETA；交通及天氣警告不會受此等待影響。" : "到站預報暫時未能讀取，請按上方更新資料重試。"}</div>}
            </div>
          </div>
          <div className="live-data-panel">
            <div className="live-panel-title"><span><CarFront size={15} /> 運輸署特別交通消息</span><span>{trafficUnavailable ? "暫時無法讀取" : dashboard.isLoading ? "正在讀取" : `${priorityTrafficEvents.filter((event) => !isClosed(event)).length} 則未完結 · ${trafficEvents.length} 則總消息`}</span></div>
            {trafficUnavailable && <div className="feed-empty">運輸署來源暫時未能連線；稍後可按「更新資料」重試，亦可直接查閱 <a href="https://www.td.gov.hk/tc/special_news/spnews.htm" target="_blank" rel="noreferrer">運輸署公告頁</a>。</div>}
            {!trafficUnavailable && trafficEvents.length === 0 && <div className="feed-empty">目前官方 feed 沒有交通消息紀錄。</div>}
            {!trafficUnavailable && priorityTrafficEvents.slice(0, 5).map((event) => <TrafficEventRow key={event.id} event={event} />)}
            <div className="live-panel-foot">官方 feed 更新時間：{activeSources.find((source) => source.id === "td-traffic") ? formatHkt(activeSources.find((source) => source.id === "td-traffic")?.checkedAt) : "—"} · 資料流列為即時；政府未公布延遲 SLA</div>
          </div>
          </section>
        </details>

        <details className="detail-accordion secondary-accordion" id="weather-details" open={openPanels.weather} onToggle={(event) => setOpenPanels((current) => ({ ...current, weather: (event.currentTarget as HTMLDetailsElement).open }))}>
          <summary><span><CloudRain size={17} /> 查看其他天氣、災害、預報及空氣質素</span><ChevronRight className="disclosure-chevron" size={17} /><small>普通落雨／AQHI 不屬重大警報</small></summary>
          <section className="hazard-section" id="weather">
          <div className="hazard-intro">
            <div className="eyebrow small-eyebrow">WEATHER & PUBLIC SAFETY</div>
            <h2>天氣轉變，<br /><span>出行計劃都要變。</span></h2>
            <p>直接讀取天文台公開警告與地震資料；交通影響及發布時間一併清楚顯示。</p>
            <a className="text-link" href="https://www.hko.gov.hk/tc/abouthko/opendata_intro.htm" target="_blank" rel="noreferrer">香港天文台開放數據說明 <ArrowRight size={16} /></a>
          </div>
          <div className="hazard-panel">
            <div className="hazard-panel-head"><div><span className="live-spark" /> 天文台警告監察</div><span className={warningsUnavailable ? "not-connected error" : "not-connected"}>{warningsUnavailable ? "來源暫停" : dashboard.isLoading ? "更新中" : `${activeWarnings.length} 項生效警告`}</span></div>
            <div className="hazard-list">
              {hazardFallbacks.filter((hazard) => activeWarnings.some((warning) => hazard.codes.includes(warning.code))).map((hazard) => {
                const Icon = hazard.icon;
                const matching = activeWarnings.filter((warning) => hazard.codes.includes(warning.code));
                const hasWarning = matching.length > 0;
                return <div className={`hazard-row ${hasWarning ? "has-warning" : ""}`} key={hazard.name}>
                  <span className={`hazard-icon ${hazard.tone}`}><Icon size={17} /></span>
                  <strong>{hazard.name}</strong>
                  <span className={`hazard-state ${hasWarning ? `level-${warningTone(matching[0])}` : ""}`}>{warningsUnavailable ? "來源暫停" : hasWarning ? matching.map((item) => item.label).join("、") : dashboard.isLoading ? "讀取中" : "現時沒有警告"}</span>
                  <ChevronRight size={15} />
                  {hasWarning && <div className="warning-detail">{matching[0].content.slice(0, 150)}{matching[0].updatedAt ? ` · ${formatHkt(matching[0].updatedAt)} HKT` : ""}</div>}
                </div>;
              })}
              {activeWarnings.length === 0 && <div className="hazard-no-active">{warningsUnavailable ? "天文台來源暫不可用，無法確認警告狀態。" : dashboard.isLoading ? "正在讀取目前生效的警告…" : "目前沒有天文台生效警告。一般落雨及預報留在天氣詳情，不會當作警報。"}</div>}
            </div>
            <div className="earthquake-feed">
              <div className="earthquake-feed-title"><Waves size={14} /> 地震資訊 <span>全球 M6+ 速報／香港有感報告</span></div>
              {earthquakes.length > 0 ? earthquakes.map((quake, index) => <EarthquakeRow key={`${quake.kind}-${index}`} quake={quake} />) : <div className="earthquake-empty">{activeSources.some((source) => source.id.startsWith("hko-earthquake") && source.status === "unavailable") ? "暫時無法讀取天文台地震資料。" : dashboard.isLoading ? "正在讀取地震資料…" : "目前沒有新的香港有感地震報告；全球 M6+ 速報如有則會顯示於此。"}</div>}
            </div>
            <div className="hazard-foot"><TriangleAlert size={15} /><span>本介面約每 60 秒查詢一次；資料以天文台公布時間為準。香港有感地震 API 空白回應表示暫無新報告，並不代表全球沒有地震。</span></div>
          </div>
          </section>

          <section className="environment-section" id="weather-report">
          <div className="section-heading"><div><div className="eyebrow small-eyebrow">WEATHER & ENVIRONMENT</div><h2>天氣與環境</h2></div><span className="example-label">天文台現況／九日預報 · 環保署 AQHI</span></div>
          <div className="environment-current-grid">
            <article className="environment-card"><span className="environment-label">天文台氣溫</span><strong>{environment.data?.current?.temperatures?.find((item) => item.place === "香港天文台")?.value ?? "—"}<small>{environment.data?.current?.temperatures?.some((item) => item.place === "香港天文台") ? " °C" : ""}</small></strong><span>香港天文台測站 · {formatHkt(environment.data?.current?.updatedAt)} HKT</span></article>
            <article className="environment-card"><span className="environment-label">相對濕度</span><strong>{environment.data?.current?.humidity ?? "—"}<small>{environment.data?.current?.humidity !== undefined ? "%" : ""}</small></strong><span>香港天文台 · {formatHkt(environment.data?.current?.humidityTime)} HKT</span></article>
            <article className="environment-card"><span className="environment-label">紫外線指數</span><strong>{environment.data?.current?.uvIndex ?? "—"}<small>{environment.data?.current?.uvDescription ? ` · ${environment.data.current.uvDescription}` : ""}</small></strong><span>{environment.data?.current?.uvIndex === undefined ? "天文台暫無最新指數（夜間或未發布）" : "天文台當前公開讀數"}</span></article>
            <article className="environment-card"><span className="environment-label">過去一小時雨量最高</span><strong>{highestRainfall?.millimetres ?? (rainfallEntries.length ? 0 : "—")}<small>{rainfallEntries.length ? " mm" : ""}</small></strong><span>{highestRainfall?.place ?? "未有讀數"} · 時段 {rainfallPeriod.length === 2 ? `${formatHkt(rainfallPeriod[0])}–${formatHkt(rainfallPeriod[1])}` : "天文台未提供"} HKT</span></article>
          </div>
          <div className="environment-situation"><strong>天氣概況</strong><span>{environment.data?.generalSituation || (environment.isLoading ? "正在讀取天氣概況…" : "天文台天氣概況暫時未能讀取。")}</span></div>
          <div className="forecast-heading"><h3>九日天氣預報</h3><span>更新時間 {formatHkt(environment.data?.forecastUpdatedAt)} HKT</span></div>
          <div className="forecast-grid">{(environment.data?.forecast ?? []).map((day) => <article className="forecast-card" key={day.date}><strong>{day.week || day.date}</strong><span>{day.date}</span><p>{day.description}</p><b>{day.minTemperature ?? "—"}° — {day.maxTemperature ?? "—"}°C</b><small>降雨機率：{day.rainProbability || "未提供"}</small></article>)}{!environment.data?.forecast.length && <div className="road-speed-empty">{environment.isLoading ? "正在讀取九日天氣預報…" : "九日天氣預報暫時未能讀取。"}</div>}</div>
          <div className="aqhi-panel"><div className="forecast-heading"><h3>空氣質素健康指數（AQHI）</h3><span>環保署全部可用監測站 · 每小時資料 · {formatHkt(environment.data?.aqhiUpdatedAt)} HKT</span></div><div className="aqhi-grid">{(environment.data?.aqhi ?? []).map((station: AQHIStation) => <article className="aqhi-card" key={`${station.type}-${station.place}`}><span>{station.place}</span><strong>{station.index}</strong><small>{station.type}</small></article>)}{!environment.data?.aqhi.length && <div className="road-speed-empty">{environment.isLoading ? "正在讀取 AQHI…" : "AQHI 暫時未能讀取。"}</div>}</div><div className="environment-source-note">AQHI 按監測站展示，數值越高代表健康風險越高；此卡不是預測。天文台及環保署讀數更新頻率不同，請以各官方公布時間為準。</div></div>
          </section>
        </details>

        <details className="detail-accordion source-accordion" id="source-details" open={openPanels.sources} onToggle={(event) => setOpenPanels((current) => ({ ...current, sources: (event.currentTarget as HTMLDetailsElement).open }))}>
          <summary><span><ShieldAlert size={17} /> 資料來源、覆蓋範圍與限制</span><ChevronRight className="disclosure-chevron" size={17} /><small>透明列出未覆蓋範圍</small></summary>
          <section className="section-block example-section">
          <div className="section-heading"><div><div className="eyebrow small-eyebrow">OFFICIAL DATA SOURCES</div><h2>已接入／已核實</h2></div><span className="example-label">來源狀態可見</span></div>
          <div className="example-grid">
            {examples.map((example) => {
              const Icon = example.icon;
              return <article className="example-card" key={example.title}><div className="example-top"><span className={`example-icon ${example.tone}`}><Icon size={18} /></span><span className="example-tag">官方來源</span></div><h3>{example.title}</h3><p>{example.detail}</p><div className="example-bottom"><span>公開 GET；目前測試接入</span><ArrowUpRight size={15} /></div></article>;
            })}
          </div>
          </section>

          <section className="section-block source-directory" id="source-directory">
          <div className="section-heading"><div><div className="eyebrow small-eyebrow">VERIFIED HONG KONG DATA</div><h2>政府及營辦商資料源地圖</h2></div><span className="example-label">已核實範圍／更新頻率</span></div>
          <div className="catalog-grid">
            {sourceCatalog.map((item) => <article className="catalog-card" key={item.title}>
              <div className="catalog-top"><span>{item.category}</span><span className={item.status.startsWith("已接入") ? "catalog-status connected" : "catalog-status"}>{item.status}</span></div>
              <h3>{item.title}</h3><p className="catalog-frequency">{item.freshness}</p><p className="catalog-detail">{item.detail}</p>
              <a href={item.href} target="_blank" rel="noreferrer">官方資料頁 <ArrowUpRight size={13} /></a>
            </article>)}
          </div>
          <p className="licence-note">開放資料可按 DATA.GOV.HK 條款重用；須標示來源並作適當致謝。官方資料以「現狀」提供，不保證準確、完整、及時或持續供應。</p>
          </section>

          <section className="source-strip" id="sources">
          <div className="source-mark"><Zap size={18} /></div><div className="source-copy"><strong>以官方資料為先，標示來源與更新時間。</strong><span>警報／ETA 約每 60 秒、道路速度及環境數據約每 5 分鐘快取；各自查詢，慢來源不會阻塞急務交通及天氣消息。</span></div>
          <div className="source-links"><a href="https://data.gov.hk/" target="_blank" rel="noreferrer">data.gov.hk <ArrowUpRight size={13} /></a><a href="https://www.hko.gov.hk/tc/abouthko/opendata_intro.htm" target="_blank" rel="noreferrer">香港天文台 <ArrowUpRight size={13} /></a><a href="https://www.td.gov.hk/tc/special_news/spnews.htm" target="_blank" rel="noreferrer">運輸署 <ArrowUpRight size={13} /></a></div>
          </section>
          <div className="source-status-list" aria-label="各官方資料源連線狀態">{activeSources.map((source) => <span key={source.id} className={source.status === "ok" ? "source-ok" : "source-error"}><i />{source.label} · {source.status === "ok" ? formatHkt(source.checkedAt) : "暫不可用"}</span>)}</div>
        </details>

        <footer className="footer"><span>交通警報器 <span className="footer-dot">·</span> 香港出行資訊整合原型</span><span><Zap size={13} /> 官方公告優先，安全出行</span></footer>
      </div>
      <div className="mobile-bottom-bar" role="navigation" aria-label="手機快速操作"><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ShieldAlert size={19} /><span>警報</span></button><button onClick={() => openPanel("transport")}><CarFront size={19} /><span>交通</span></button><button onClick={() => openPanel("weather")}><CloudRain size={19} /><span>天氣</span></button><button onClick={() => openPanel("sources")}><Menu size={19} /><span>更多</span></button></div>
    </main>
  );
}

function PriorityFilters({ area, kind, counts, onAreaChange, onKindChange }: {
  area: AlertAreaFilter;
  kind: AlertKindFilter;
  counts: { road: number; rail: number; weather: number; earthquake: number };
  onAreaChange: (value: AlertAreaFilter) => void;
  onKindChange: (value: AlertKindFilter) => void;
}) {
  const areaOptions = ALERT_AREA_OPTIONS;
  const kindOptions: Array<{ id: AlertKindFilter; label: string; count: number }> = [
    { id: "all", label: "全部警報", count: counts.road + counts.rail + counts.weather + counts.earthquake },
    { id: "road", label: "道路", count: counts.road },
    { id: "rail", label: "鐵路", count: counts.rail },
    { id: "weather", label: "天氣", count: counts.weather },
    { id: "earthquake", label: "地震", count: counts.earthquake },
  ];
  return <div className="alert-filter-stack">
    <div className="alert-filter-note">自選常用地區 · 只儲存在此手機，不讀取 GPS</div>
    <div className="alert-filter-row" role="group" aria-label="按地區篩選警報">{areaOptions.map((option) => <button key={option} className={area === option ? "alert-filter active" : "alert-filter"} aria-pressed={area === option} onClick={() => onAreaChange(option)}>{option}</button>)}</div>
    <div className="alert-filter-row alert-kind-row" role="group" aria-label="按警報種類篩選">{kindOptions.map((option) => <button key={option.id} className={kind === option.id ? "alert-filter active" : "alert-filter"} aria-pressed={kind === option.id} onClick={() => onKindChange(option.id)}>{option.label}<span>{option.count}</span></button>)}</div>
  </div>;
}

function PriorityAlertCard({ alert }: { alert: PriorityAlert }) {
  const levelLabel = alert.level === "critical" ? "立即留意" : alert.level === "high" ? "重大影響" : "留意路況";
  const sourceUrl = alert.kind === "rail"
    ? "https://www.mtr.com.hk/tc/customer/main/service_status.html"
    : alert.kind === "weather" || alert.kind === "earthquake"
      ? "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc"
      : "https://www.td.gov.hk/tc/special_news/spnews.htm";
  return <article className={`priority-card priority-${alert.level}`}>
    <div className="priority-card-top"><span className="priority-level">{levelLabel}</span><span className="priority-area">{alert.area} · {alert.kind === "road" ? "道路" : alert.kind === "rail" ? "鐵路" : alert.kind === "weather" ? "天氣警告" : "地震"}</span></div>
    <h3>{alert.title}</h3><p>{alert.detail}</p>
    <div className="priority-card-meta"><span>{alert.location}</span>{alert.updatedAt && <span>官方更新 {formatHkt(alert.updatedAt)} HKT</span>}</div>
    <a href={sourceUrl} target="_blank" rel="noreferrer">查看官方消息 <ArrowUpRight size={13} /></a>
  </article>;
}

function TrafficEventRow({ event }: { event: TrafficEvent }) {
  const closed = isClosed(event);
  return <article className="traffic-event-row">
    <span className={`event-status-dot ${closed ? "closed" : "open"}`} />
    <div className="event-content"><div className="event-heading"><strong>{event.title || "交通消息"}</strong><span className={closed ? "event-badge closed" : "event-badge open"}>{event.status || "官方消息"}</span></div>
      <p>{event.detail || "官方消息內容未提供"}</p>
      <div className="event-meta"><span>{[event.location, event.district, event.direction].filter(Boolean).join(" · ") || "地點未提供"}</span><span>{formatHkt(event.announcedAt)} HKT</span></div>
    </div>
  </article>;
}

function EarthquakeRow({ quake }: { quake: EarthquakeBulletin }) {
  return <div className="earthquake-row"><span className="quake-mark"><Waves size={13} /></span><div><strong>{quake.label}</strong><span>{[quake.region, quake.magnitude ? `M${quake.magnitude}` : "", quake.occurredAt ? formatHkt(quake.occurredAt) + " HKT" : ""].filter(Boolean).join(" · ") || quake.content || "官方報告"}</span></div></div>;
}
