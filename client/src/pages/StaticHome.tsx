import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, CarFront, ChevronRight, CloudLightning, MapPinned, Navigation, RefreshCw, ShieldAlert, TrainFront, TriangleAlert, Zap } from "lucide-react";
import { getJourneyDecision, inferRouteAreas, modeLabel } from "@/lib/journeyDecision";
import { buildDirectionsUrl, selectAlertsForRouteAreas, type RouteMode } from "@/lib/routePlanner";
import { getTransportDashboard, selectPriorityAlerts, type PriorityAlert, type TransportDashboard } from "../../../server/transportData";

function formatHkt(value?: string) {
  if (!value) return "未有時間";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-HK", { timeZone: "Asia/Hong_Kong", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function AlertCard({ alert }: { alert: PriorityAlert }) {
  const label = alert.level === "critical" ? "立即留意" : alert.level === "high" ? "重大影響" : "出行提醒";
  const href = alert.kind === "rail"
    ? "https://www.mtr.com.hk/tc/customer/main/service_status.html"
    : alert.kind === "weather" || alert.kind === "earthquake"
      ? "https://www.hko.gov.hk/tc/index.html"
      : "https://www.td.gov.hk/tc/special_news/spnews.htm";
  return <article className={`priority-card priority-${alert.level}`}>
    <div className="priority-card-top"><span className="priority-level">{label}</span><span className="priority-area">{alert.area}</span></div>
    <h3>{alert.title}</h3>
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
  const unavailableSources = dashboard ? dashboard.sources.filter((source) => source.status === "unavailable") : [];
  const degraded = loadError || unavailableSources.length > 0;
  const decisionAlerts = routeReady ? relatedAlerts : alerts;
  const decision = getJourneyDecision(decisionAlerts, { loading: !dashboard && !loadError, degraded, routeReady });
  const directionsUrl = routeReady ? buildDirectionsUrl(origin, destination, mode) : "";

  return <main className="traffic-app pages-app">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="交通警報器首頁"><span className="brand-mark"><Zap size={19} fill="currentColor" /></span><span className="brand-copy"><strong>交通警報器</strong><small>HONG KONG · ACTION FIRST</small></span></a>
      <div className="top-actions"><span className="preview-pill"><span /> 官方資料快照</span></div>
    </header>

    <div className="page-shell" id="top">
      <section className={`decision-hero decision-${decision.tone}`} aria-live="polite">
        <div className="decision-topline"><span className="decision-kicker"><i />{decision.kicker}</span><button className="decision-refresh" onClick={() => setReloadKey((value) => value + 1)} aria-label="重新載入警報"><RefreshCw size={16} /></button></div>
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
          <div className="route-mode-switch" role="group" aria-label="出行方式">{(["driving", "transit", "walking"] as RouteMode[]).map((item) => <button type="button" key={item} className={mode === item ? "active" : ""} aria-pressed={mode === item} onClick={() => setMode(item)}>{modeLabel(item)}</button>)}</div>
          {routeReady && <div className="route-inference"><span>自動篩選範圍</span><strong>{routeAreas.length ? routeAreas.join(" → ") : "只顯示全港警告"}</strong><small>按地名在此裝置估算；不讀取 GPS。</small></div>}
          {routeReady && <div className={`route-verdict route-verdict-${decision.tone}`}><span>{decision.kicker}</span><strong>{decision.title}</strong><p>{decision.detail}</p></div>}
          {directionsUrl ? <a className="route-submit" href={directionsUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> 在 Google Maps 查看建議路線 <ArrowUpRight size={14} /></a> : <div className="route-submit disabled"><Navigation size={16} /> 輸入起點及目的地</div>}
          <div className="route-safety-note">地區只由地名保守估算，並非精確封路比對；路線由 Google Maps 計算。</div>
        </div>
      </details>

      <section className="priority-feed" id="alerts" aria-labelledby="alerts-heading">
        <div className="priority-header"><div><div className="eyebrow small-eyebrow">ACTIONABLE ONLY</div><h2 id="alerts-heading">真正會影響出行嘅事</h2></div></div>
        {degraded && <div className="priority-degraded"><TriangleAlert size={19} /><div><strong>部分官方來源暫時未能讀取。</strong><span>唔會將資料不足當成一切正常。</span></div></div>}
        {decisionAlerts.length ? <div className="priority-list">{decisionAlerts.slice(0, 5).map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div> : <div className="priority-clear"><span className="clear-icon"><ShieldAlert size={20} /></span><div><strong>{degraded ? "目前未能完整確認。" : "目前沒有符合門檻的重大警報。"}</strong><span>{degraded ? "請稍後重新載入或查看官方消息。" : "普通天氣、AQHI 和常規 ETA 不會混入警報。"}</span></div></div>}
        <div className="quick-detail-links"><a href="https://www.td.gov.hk/tc/special_news/spnews.htm" target="_blank" rel="noreferrer"><CarFront size={17} /> 運輸署路況 <ArrowUpRight size={14} /></a><a href="https://www.mtr.com.hk/tc/customer/main/service_status.html" target="_blank" rel="noreferrer"><TrainFront size={17} /> 港鐵服務狀態 <ArrowUpRight size={14} /></a><a href="https://www.hko.gov.hk/tc/index.html" target="_blank" rel="noreferrer"><CloudLightning size={17} /> 天文台警告 <ArrowUpRight size={14} /></a></div>
        <div className="prototype-footnote"><ShieldAlert size={13} /> GitHub Pages 版直接讀取支援瀏覽器跨域的官方警報來源；TDAS 路線平均車速仍只在 server 版。遇緊急情況以官方公告為準。</div>
      </section>
    </div>
  </main>;
}
