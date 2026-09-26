import { useMemo, useState } from "react";
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
import type { EarthquakeBulletin, TrafficEvent, WeatherWarning } from "../../../server/transportData";

type Mode = {
  id: string;
  label: string;
  subtitle: string;
  icon: typeof CarFront;
  tone: string;
  source: string;
};

const modes: Mode[] = [
  { id: "road", label: "道路交通", subtitle: "事故・封路・特別安排", icon: CarFront, tone: "coral", source: "運輸署" },
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
  { category: "天氣警告", title: "天文台 warningInfo API", status: "已接入", freshness: "開放 JSON API；頁面約每 60 秒查詢", detail: "含颱風信號、黃／紅／黑雨、山泥傾瀉、雷暴、海嘯等警告。", href: "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc" },
  { category: "地震", title: "天文台地震 API", status: "已接入", freshness: "有新資料時更新；頁面約每 60 秒查詢", detail: "地震速報涵蓋全球 M6+；本地有感報告是另一個資料類型，兩者不可混為一談。", href: "https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php?dataType=qem&lang=tc" },
  { category: "港鐵", title: "MTR Next Train API", status: "已接入・金鐘試點", freshness: "官方資料集列每 10 秒更新；本頁每 60 秒刷新", detail: "目前展示金鐘站東鐵綫、港島綫、南港島綫到站預報；API 非完整事故警報。", href: "https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data" },
  { category: "巴士", title: "KMB／LWB ETA API", status: "待接入", freshness: "ETA 每分鐘更新；路線／站點資料每日更新", detail: "路線、站點和到站預報可按路線或站點查詢；即時改道應另看營辦商公告。", href: "https://data.gov.hk/en-data/dataset/hk-td-tis_21-etakmb" },
  { category: "巴士", title: "Citybus Next Bus API", status: "待接入", freshness: "ETA 每分鐘更新", detail: "城巴路線、站點及到站預報；不是服務中斷警報 feed。", href: "https://data.gov.hk/en-data/dataset/ctb-eta-transport-realtime-eta" },
  { category: "公共小巴", title: "綠色專線小巴 ETA API", status: "待接入", freshness: "ETA 每分鐘更新；官方稱涵蓋所有綠色小巴路線", detail: "到站預報不等於交通事故或停駛消息；紅色小巴未有同等全港官方 ETA feed 證據。", href: "https://data.gov.hk/en-data/dataset/hk-td-sm_7-real-time-arrival-data-of-gmb" },
  { category: "渡輪", title: "香港九龍渡海小輪 ETA API", status: "待接入", freshness: "ETA 每分鐘更新", detail: "只涵蓋該營辦商航線；臨時停航及改動仍須營辦商公告。", href: "https://data.gov.hk/en-data/dataset/hkkf-hkkfdata-hkkf-eta-data" },
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
  const [activeMode, setActiveMode] = useState("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const dashboard = trpc.transport.dashboard.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

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
  const earthquakes = data?.earthquakes ?? [];
  const activeSources = data?.sources ?? [];
  const warningsUnavailable = activeSources.some((source) => source.id === "hko-warning" && source.status === "unavailable");
  const trafficUnavailable = activeSources.some((source) => source.id === "td-traffic" && source.status === "unavailable");
  const railUnavailable = activeSources.some((source) => source.id.startsWith("mtr-") && source.status === "unavailable");
  const lastUpdated = data?.fetchedAt ? formatHkt(data.fetchedAt) : "正在讀取";

  return (
    <main className="traffic-app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="交通警報器首頁">
          <span className="brand-mark"><Zap size={19} fill="currentColor" /></span>
          <span className="brand-copy"><strong>交通警報器</strong><small>HONG KONG · MOVE SMARTER</small></span>
        </a>
        <nav className="top-nav" aria-label="主要導覽">
          <a className="nav-current" href="#overview">交通總覽</a>
          <a href="#weather">天氣與災害</a>
          <a href="#source-directory">資料來源</a>
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
            <h1>出門前，<span>睇清全港交通。</span></h1>
            <p>道路、鐵路、巴士、小巴、渡輪、航班，以至天氣災害警告——重要變化集中睇。</p>
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

        <section className="preview-notice" aria-label="資料狀態提示">
          <div className="notice-icon"><ShieldAlert size={17} /></div>
          <div><strong>資料測試版｜現已接入天文台警告／地震資料及運輸署特別交通消息。</strong><span> 到站、航班與部分營辦商服務狀態仍待接入；官方資料亦可能延遲或不完整，緊急情況請以政府公告為準。</span></div>
          <a href="#source-directory">資料與更新方式 <ArrowUpRight size={14} /></a>
        </section>

        {notice && <div className="inline-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="關閉">×</button></div>}

        <section className="section-block transport-section" aria-labelledby="transport-heading">
          <div className="section-heading">
            <div><div className="eyebrow small-eyebrow">TRANSPORT NETWORK</div><h2 id="transport-heading">交通網絡</h2></div>
            <button className="refresh-button" onClick={() => void dashboard.refetch()} disabled={dashboard.isFetching}><RefreshCw size={15} className={dashboard.isFetching ? "spin" : ""} /> 更新資料</button>
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
              const connected = mode.id === "road" || mode.id === "rail";
              const modeStatus = mode.id === "road"
                ? trafficUnavailable ? "來源暫停" : "已接官方消息"
                : mode.id === "rail"
                  ? railUnavailable ? "來源暫停" : "已接金鐘 ETA"
                  : "規劃接入";
              return <button key={mode.id} className="transport-card" onClick={() => setNotice(connected ? "交通消息已讀取於下方；此 feed 屬官方公告，並非每宗即時路況。" : `${mode.label}：已查到可用官方資料源，完整路線／即時狀態頁面正在下一階段接入。`)}>
                <span className={`mode-icon ${mode.tone}`}><Icon size={20} strokeWidth={1.8} /></span>
                <span className="mode-text"><strong>{mode.label}</strong><small>{mode.subtitle}</small></span>
                <span className={`mode-status ${connected && !modeStatus.includes("暫停") ? "connected" : "planned"}`}><i />{modeStatus}</span>
                <ChevronRight className="mode-chevron" size={17} />
                <span className="mode-source">資料方向：{mode.source}</span>
              </button>;
            })}
            {visibleModes.length === 0 && <div className="empty-search">找不到相關交通類別，試試其他關鍵字。</div>}
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
                      : train.arrivals.length ? <div className="train-arrivals">{train.arrivals.map((arrival) => <span key={arrival.direction}><small>{arrival.direction}</small><b>{arrival.minutes === "0" ? "即將到站" : `${arrival.minutes} 分鐘`}</b>{arrival.platform ? <i>{arrival.platform} 號月台</i> : null}</span>)}</div>
                        : <span className="train-no-data">API 暫未提供到站預報</span>}
                  <small className="train-line-time">{train.currentTime ? `資料時間 ${formatHkt(train.currentTime)} HKT` : "資料時間以港鐵回應為準"}</small>
                </div>;
              })}
              {!data?.trains?.length && <div className="train-no-data">{dashboard.isLoading ? "正在讀取港鐵資料…" : "港鐵到站資料暫時未能讀取。"}　<a href="https://www.mtr.com.hk/tc/customer/main/service_status.html" target="_blank" rel="noreferrer">查看港鐵服務狀態</a></div>}
            </div>
          </div>
          <div className="live-data-panel">
            <div className="live-panel-title"><span><CarFront size={15} /> 運輸署特別交通消息</span><span>{trafficUnavailable ? "暫時無法讀取" : dashboard.isLoading ? "正在讀取" : `${trafficEvents.length} 則官方消息`}</span></div>
            {trafficUnavailable && <div className="feed-empty">運輸署來源暫時未能連線；稍後可按「更新資料」重試，亦可直接查閱 <a href="https://www.td.gov.hk/tc/special_news/spnews.htm" target="_blank" rel="noreferrer">運輸署公告頁</a>。</div>}
            {!trafficUnavailable && trafficEvents.length === 0 && <div className="feed-empty">目前官方 feed 沒有交通消息紀錄。</div>}
            {!trafficUnavailable && trafficEvents.slice(0, 3).map((event) => <TrafficEventRow key={event.id} event={event} />)}
            <div className="live-panel-foot">官方 feed 更新時間：{activeSources.find((source) => source.id === "td-traffic") ? formatHkt(activeSources.find((source) => source.id === "td-traffic")?.checkedAt) : "—"} · 資料流列為即時；政府未公布延遲 SLA</div>
          </div>
        </section>

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
              {hazardFallbacks.map((hazard) => {
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
            </div>
            <div className="earthquake-feed">
              <div className="earthquake-feed-title"><Waves size={14} /> 地震資訊 <span>全球 M6+ 速報／香港有感報告</span></div>
              {earthquakes.length > 0 ? earthquakes.map((quake, index) => <EarthquakeRow key={`${quake.kind}-${index}`} quake={quake} />) : <div className="earthquake-empty">{activeSources.some((source) => source.id.startsWith("hko-earthquake") && source.status === "unavailable") ? "暫時無法讀取天文台地震資料。" : dashboard.isLoading ? "正在讀取地震資料…" : "目前沒有新的香港有感地震報告；全球 M6+ 速報如有則會顯示於此。"}</div>}
            </div>
            <div className="hazard-foot"><TriangleAlert size={15} /><span>本介面約每 60 秒查詢一次；資料以天文台公布時間為準。香港有感地震 API 空白回應表示暫無新報告，並不代表全球沒有地震。</span></div>
          </div>
        </section>

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
          <div className="source-mark"><Zap size={18} /></div><div className="source-copy"><strong>以官方資料為先，標示來源與更新時間。</strong><span>前端每 60 秒查詢一次；伺服器對官方資料流作 60 秒快取，減少重複請求。</span></div>
          <div className="source-links"><a href="https://data.gov.hk/" target="_blank" rel="noreferrer">data.gov.hk <ArrowUpRight size={13} /></a><a href="https://www.hko.gov.hk/tc/abouthko/opendata_intro.htm" target="_blank" rel="noreferrer">香港天文台 <ArrowUpRight size={13} /></a><a href="https://www.td.gov.hk/tc/special_news/spnews.htm" target="_blank" rel="noreferrer">運輸署 <ArrowUpRight size={13} /></a></div>
        </section>
        <div className="source-status-list" aria-label="各官方資料源連線狀態">{activeSources.map((source) => <span key={source.id} className={source.status === "ok" ? "source-ok" : "source-error"}><i />{source.label} · {source.status === "ok" ? formatHkt(source.checkedAt) : "暫不可用"}</span>)}</div>

        <footer className="footer"><span>交通警報器 <span className="footer-dot">·</span> 香港出行資訊整合原型</span><span><Zap size={13} /> 官方公告優先，安全出行</span></footer>
      </div>
      <div className="mobile-bottom-bar"><a href="#overview"><CarFront size={17} />交通</a><a href="#weather"><CloudRain size={17} />天氣警告</a><a href="#sources"><Zap size={17} />資料</a></div>
    </main>
  );
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
