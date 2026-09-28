import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, CarFront, ChevronRight, CloudLightning, Footprints, MapPinned, Navigation, RefreshCw, ShieldAlert, TrainFront, TriangleAlert, Zap } from "lucide-react";
import { PriorityAlertSignalIcon } from "@/components/PriorityAlertIcon";
import { getJourneyDecision, inferRouteAreas, modeLabel } from "@/lib/journeyDecision";
import { countSourceIndicators, getSourceDisplayName, getSourceIndicatorLabel, getSourceIndicatorState, orderSourceItems, SOURCE_DISPLAY_ORDER } from "@/lib/sourceDisplay";
import { buildDirectionsUrl, parseRouteBookmarks, ROUTE_BOOKMARKS_PREFERENCE_KEY, selectAlertsForRouteAreas, type RouteBookmark, type RouteMode } from "@/lib/routePlanner";
import { getTransportDashboard, selectPriorityAlerts, type PriorityAlert, type TransportDashboard } from "../../../server/transportData";

function formatHkt(value?: string) {
  if (!value) return "未有時間";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-HK", { timeZone: "Asia/Hong_Kong", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function AlertCard({ alert }: { alert: PriorityAlert }) {
  const label = alert.level === "critical" ? "立即留意" : alert.level === "high" ? "重大影響" : "出行提醒";
  const isIncident = alert.kind === "road" && /事故|故障|封閉|意外|阻塞/.test(`${alert.title} ${alert.detail}`);
  const href = alert.kind === "rail"
    ? "https://www.hkemobility.gov.hk/tc/route-search/pt"
    : alert.kind === "weather" || alert.kind === "earthquake"
      ? "https://www.hko.gov.hk/tc/index.html"
      : "https://www.td.gov.hk/tc/special_news/spnews.htm";
  return <article className={`priority-card priority-${alert.level}${isIncident ? " incident-card" : ""}`}>
    <div className="priority-card-top"><span className="priority-level">{label}</span>{isIncident && <span className="alert-breathing-light" aria-label="道路事故警示" />}<span className="priority-area">{alert.area}</span></div>
    <h3 className="priority-card-heading"><PriorityAlertSignalIcon alert={alert} /><span>{alert.title}</span></h3>
    <p>{alert.detail}</p>
    <div className="priority-card-meta"><span>{alert.location}</span>{alert.updatedAt && <span>{formatHkt(alert.updatedAt)} HKT</span>}</div>
    <a href={href} target="_blank" rel="noreferrer">查看官方消息 <ArrowUpRight size={13} /></a>
  </article>;
}

export default function StaticHome() {
  const [dashboard, setDashboard] = useState<TransportDashboard | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [routeOpen, setRouteOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState<RouteMode>("transit");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">(() => {
    try {
      const saved = window.localStorage.getItem("hk-traffic-alert:font-size");
      return saved === "large" || saved === "xlarge" ? saved : "normal";
    } catch { return "normal"; }
  });
  const [bookmarks, setBookmarks] = useState<RouteBookmark[]>(() => {
    try { return parseRouteBookmarks(window.localStorage.getItem(ROUTE_BOOKMARKS_PREFERENCE_KEY)); }
    catch { return []; }
  });

  useEffect(() => {
    try { window.localStorage.setItem("hk-traffic-alert:font-size", fontSize); } catch { /* optional preference */ }
  }, [fontSize]);
  useEffect(() => {
    try { window.localStorage.setItem(ROUTE_BOOKMARKS_PREFERENCE_KEY, JSON.stringify(bookmarks)); } catch { /* optional preference */ }
  }, [bookmarks]);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    getTransportDashboard()
      .then((data) => { if (active) setDashboard(data); })
      .catch(() => { if (active) setLoadError(true); });
    const interval = window.setInterval(() => setReloadKey((value) => value + 1), 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [reloadKey]);

  const alerts = useMemo(() => dashboard ? selectPriorityAlerts({
    trafficEvents: dashboard.trafficEvents,
    warnings: dashboard.warnings,
    trains: dashboard.trains,
    earthquakes: dashboard.earthquakes,
    roadRoutes: [],
  }) : [], [dashboard]);
  const routeReady = Boolean(origin.trim() && destination.trim());
  const routeAreas = useMemo(() => inferRouteAreas(origin, destination), [origin, destination]);
  const relatedAlerts = useMemo(() => selectAlertsForRouteAreas(alerts, routeAreas, mode), [alerts, routeAreas, mode]);
  const allSources = dashboard?.sources ?? [];
  const sourceById = new Map(allSources.map((source) => [source.id, source]));
  const knownSourceIds = new Set<string>(SOURCE_DISPLAY_ORDER);
  const orderedSources = [
    ...SOURCE_DISPLAY_ORDER.map((id) => sourceById.get(id)),
    ...orderSourceItems(allSources.filter((source) => !knownSourceIds.has(source.id))),
  ];
  const sourceIndicators = orderedSources.map((source, index) => {
    const id = source?.id ?? SOURCE_DISPLAY_ORDER[index] ?? `other-${index}`;
    const state = getSourceIndicatorState(source?.status);
    return { id, source, state, label: getSourceIndicatorLabel(state) };
  });
  const { failure: failedSourceCount, unknown: unconfirmedSourceCount } = countSourceIndicators(sourceIndicators.map(({ state }) => state));
  const degraded = loadError || failedSourceCount > 0 || Boolean(dashboard && unconfirmedSourceCount > 0);
  const sourceSummary = !dashboard
    ? loadError ? "未能確認來源狀態，展開查看" : `正在檢查 ${sourceIndicators.length} 項官方資料`
    : failedSourceCount && unconfirmedSourceCount
      ? `${failedSourceCount} 項讀取失敗 · ${unconfirmedSourceCount} 項未能確認，展開查看`
      : failedSourceCount
        ? `${failedSourceCount} 項讀取失敗，展開查看`
        : unconfirmedSourceCount
          ? `${unconfirmedSourceCount} 項未能確認，展開查看`
          : `${sourceIndicators.length} 項資料均成功讀取`;
  const decisionAlerts = routeReady ? relatedAlerts : alerts;
  const hasIncident = alerts.some((alert) => alert.kind === "road" && /事故|故障|封閉|意外|阻塞/.test(`${alert.title} ${alert.detail}`));
  const decision = getJourneyDecision(decisionAlerts, { loading: !dashboard && !loadError, degraded, routeReady });
  const directionsUrl = routeReady ? buildDirectionsUrl(origin, destination, mode) : "";
  const cycleFontSize = () => setFontSize((current) => current === "normal" ? "large" : current === "large" ? "xlarge" : "normal");
  const saveRoute = () => {
    if (!routeReady) return;
    const cleanOrigin = origin.trim();
    const cleanDestination = destination.trim();
    const id = `${cleanOrigin.toLocaleLowerCase()}|${cleanDestination.toLocaleLowerCase()}|${mode}`;
    const bookmark: RouteBookmark = { id, origin: cleanOrigin, destination: cleanDestination, mode, areas: routeAreas };
    setBookmarks((current) => [bookmark, ...current.filter((item) => item.id !== id)].slice(0, 5));
  };
  const loadRoute = (bookmark: RouteBookmark) => {
    setOrigin(bookmark.origin);
    setDestination(bookmark.destination);
    setMode(bookmark.mode);
    setRouteOpen(true);
  };

  return <main className={`traffic-app pages-app pages-text-${fontSize}`}>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="交通警報器首頁"><span className="brand-mark"><Zap size={19} fill="currentColor" /></span><span className="brand-copy"><strong>交通警報器</strong><small>香港 · 先看警報</small></span></a>
      <div className="top-actions"><span className="preview-pill"><span /> 官方資料直讀</span><button className="font-size-toggle" onClick={cycleFontSize} aria-label={`文字大小：${fontSize === "normal" ? "標準" : fontSize === "large" ? "大" : "特大"}；按一下切換`}><b>Aa</b><span>{fontSize === "normal" ? "標準" : fontSize === "large" ? "大" : "特大"}</span></button></div>
    </header>

    <div className="page-shell" id="top">
      <section className={`decision-hero decision-${decision.tone}${hasIncident ? " incident-active" : ""}`} aria-live="polite">
        <div className="decision-topline"><span className="decision-kicker"><i className={hasIncident ? "incident-beacon" : ""} />{decision.kicker}</span><button className="decision-refresh" onClick={() => setReloadKey((value) => value + 1)} aria-label="重新載入警報"><RefreshCw size={16} /></button></div>
        {routeReady && <div className="decision-route"><span>{origin.trim()}</span><ArrowRight size={15} /><span>{destination.trim()}</span><b>{modeLabel(mode)}</b></div>}
        <h1>{decision.title}</h1>
        <p>{decision.detail}</p>
        <div className="decision-actions">
          {directionsUrl ? <a className="decision-primary" href={directionsUrl} target="_blank" rel="noreferrer"><Navigation size={17} /> 開啟路線建議 <ArrowUpRight size={14} /></a> : <button className="decision-primary" onClick={() => setRouteOpen(true)}><MapPinned size={17} /> 設定我的行程</button>}
          {decisionAlerts.length > 0 && <a className="decision-secondary" href="#alerts">查看影響 · {decisionAlerts.length}</a>}
        </div>
        <div className="decision-meta"><span>官方資料 {formatHkt(dashboard?.fetchedAt)} HKT</span><span>頁面每 60 秒更新</span><span>普通天氣／ETA 已略去</span></div>
      </section>

      <details className="route-planner route-planner-primary" open={routeOpen} onToggle={(event) => setRouteOpen((event.currentTarget as HTMLDetailsElement).open)}>
        <summary><MapPinned size={18} /><span><strong>我由邊度去邊度？</strong><small>輸入一次，程式替你篩走無關資料</small></span><ChevronRight size={17} /></summary>
        <div className="route-planner-body">
          <div className="route-inputs"><label>起點<input aria-label="起點" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="例如：金鐘站" /></label><span className="route-arrow">↓</span><label>目的地<input aria-label="目的地" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="例如：大埔墟站" /></label></div>
          <div className="route-mode-switch" role="group" aria-label="出行方式">{(["driving", "transit", "walking"] as RouteMode[]).map((item) => { const Icon = item === "driving" ? CarFront : item === "transit" ? TrainFront : Footprints; return <button type="button" key={item} className={`route-mode-${item}${mode === item ? " active" : ""}`} aria-pressed={mode === item} onClick={() => setMode(item)}><Icon size={16} aria-hidden="true" focusable="false" />{modeLabel(item)}</button>; })}</div>
          {routeReady && <div className="route-inference"><span>自動篩選範圍</span><strong>{routeAreas.length ? routeAreas.join(" → ") : "只顯示全港警告"}</strong><small>按地名在此裝置估算；不讀取 GPS。</small></div>}
          {routeReady && <div className={`route-verdict route-verdict-${decision.tone}`}><span>{decision.kicker}</span><strong>{decision.title}</strong><p>{decision.detail}</p></div>}
          {directionsUrl ? <a className="route-submit" href={directionsUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> 在 Google Maps 查看建議路線 <ArrowUpRight size={14} /></a> : <div className="route-submit disabled"><Navigation size={16} /> 輸入起點及目的地</div>}
          <button type="button" className="route-save-button" disabled={!routeReady} onClick={saveRoute}>儲存呢程喺本機</button>
          {bookmarks.length > 0 && <div className="saved-routes"><strong>已儲存行程</strong>{bookmarks.map((bookmark) => <div className="saved-route-row" key={bookmark.id}><button type="button" className="saved-route-select" onClick={() => loadRoute(bookmark)}>{bookmark.origin} → {bookmark.destination}<small>{modeLabel(bookmark.mode)}</small></button><button type="button" className="saved-route-remove" aria-label={`刪除 ${bookmark.origin} 至 ${bookmark.destination}`} onClick={() => setBookmarks((current) => current.filter((item) => item.id !== bookmark.id))}>×</button></div>)}</div>}
          <div className="route-safety-note">地區只由地名保守估算，並非精確封路比對；路線由 Google Maps 計算。</div>
        </div>
      </details>

      <section className="priority-feed" id="alerts" aria-labelledby="alerts-heading">
        <div className="priority-header"><div><div className="eyebrow small-eyebrow">只顯示重要事項</div><h2 id="alerts-heading">真正會影響出行嘅事</h2></div></div>
        {degraded && <div className="priority-degraded"><TriangleAlert size={19} /><div><strong>部分官方來源暫時未能讀取。</strong><span>唔會將資料不足當成一切正常。</span></div></div>}
        {decisionAlerts.length ? <div className="priority-list">{decisionAlerts.slice(0, 5).map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div> : <div className="priority-clear"><span className="clear-icon"><ShieldAlert size={20} /></span><div><strong>{degraded ? "目前未能完整確認。" : "目前沒有符合門檻的重大警報。"}</strong><span>{degraded ? "請稍後重新載入或查看官方消息。" : "普通天氣、AQHI 和常規 ETA 不會混入警報。"}</span></div></div>}
        <details className="source-health">
          <summary>
            <span className="source-health-summary">
              <span className="source-health-copy"><strong>資料連線檢查</strong><small>{sourceSummary}</small></span>
              <span className="source-health-lights" role="group" aria-label={`${sourceIndicators.length} 項官方資料狀態`}>
                {sourceIndicators.map(({ id, state, label }) => <span className={`source-health-light source-light-${state}`} key={id} title={`${getSourceDisplayName(id)}：${label}`} role="img" aria-label={`${getSourceDisplayName(id)}：${label}`} />)}
              </span>
            </span>
            <ChevronRight className="source-health-chevron" size={17} aria-hidden="true" />
          </summary>
          {dashboard ? <>
            <ul className="source-health-list">
              {sourceIndicators.map(({ id, source, state, label }) => <li className={`source-health-item source-${state}`} key={id}>
                <span className="source-status-dot" aria-hidden="true" />
                <span className="source-health-copy"><strong>{getSourceDisplayName(id)}</strong><small>{source ? `${label} · ${formatHkt(source.checkedAt)} HKT 檢查` : `${label} · 未收到來源狀態`}</small></span>
              </li>)}
            </ul>
            <p className="source-health-note">綠燈＝成功讀取；紅燈＝讀取失敗；灰燈＝未能確認。燈號只表示是否剛成功取得資料，不代表內容完整、正確或最新，也不代表列車準時。出行資訊請看上方警報；官方消息見下方易讀入口。</p>
          </> : <p className="source-health-note">目前未能連接官方資料；請稍後再試。緊急情況請以運輸署、港鐵或天文台公告為準，入口見下方。</p>}
        </details>
        <div className="quick-detail-links"><a href="https://www.td.gov.hk/tc/special_news/spnews.htm" target="_blank" rel="noreferrer"><span className="quick-detail-icon quick-detail-icon--road"><CarFront size={16} aria-hidden="true" /></span> 運輸署路況 <ArrowUpRight size={14} /></a><a href="https://www.mtr.com.hk/ch/customer/main/index.html#RYGLineStatus" target="_blank" rel="noreferrer"><span className="quick-detail-icon quick-detail-icon--rail"><TrainFront size={16} aria-hidden="true" /></span> 港鐵即時車務狀況（官方） <ArrowUpRight size={14} /></a><a href="https://www.hko.gov.hk/tc/index.html" target="_blank" rel="noreferrer"><span className="quick-detail-icon quick-detail-icon--weather"><CloudLightning size={16} aria-hidden="true" /></span> 天文台警告 <ArrowUpRight size={14} /></a></div>
        <div className="prototype-footnote"><ShieldAlert size={13} /> GitHub Pages 版直接讀取支援瀏覽器跨域的官方警報來源；TDAS 路線平均車速仍只在 server 版。遇緊急情況以官方公告為準。</div>
      </section>
    </div>
  </main>;
}
