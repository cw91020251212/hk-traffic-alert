# 交通警報器：香港官方資料源備忘錄

資料查核日期：2026-09-27（香港時間）

> 不同資料源的「即時」含義、更新間隔及 API 支援程度不同。只有政府或營辦商公開 API／feed 的資料才標為可直接接入；官方網頁、歷史資料及 ETA 不等於事故警報。政府及營辦商資料按各自條款使用，來源可能改版或暫停。

## 現已接入原型

| 類別 | 官方來源／端點 | 提供內容及更新 | 存取／限制 |
|---|---|---|---|
| 道路／特別交通消息 | 運輸署第二代 XML：<https://www.td.gov.hk/tc/special_news/trafficnews.xml>；schema：<https://www.td.gov.hk/en/special_news/trafficnews.xsd>；[data.gov.hk 資料集](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) | 事故、道路封閉／重開及特別交通安排；資料目錄列為 real-time，XML 有事件編號、公告時間、狀態及中英文欄位。 | 公開 HTTPS XML，未見 API key 要求。按事件 ID／狀態更新；屬消息公告 feed，並非全路網所有路況。未公布延遲 SLA。原型伺服器 60 秒快取。 |
| 天氣警告 | 天文台 `warningInfo`：<https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc>；[API 說明書](https://www.hko.gov.hk/en/weatherAPI/doc/files/HKO_Open_Data_API_Documentation.pdf) | JSON 活躍警告；包括熱帶氣旋 `WTCSGNL`、暴雨 `WRAIN`（黃色 `WRAINA`／紅色 `WRAINR`／黑色 `WRAINB`）、山泥傾瀉 `WL`、海嘯 `WTMW`、雷暴、酷熱、寒冷等。 | 公開 GET JSON。原型輪詢 60 秒；這是本程式的輪詢間隔，不代表天文台端到端延遲 SLA。若 API 失效會顯示來源暫停。 |
| 地震 | 天文台速報：<https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php?dataType=qem&lang=tc>；本地有感報告：<https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php?dataType=feltearthquake&lang=tc>；[地震速報資料集](https://data.gov.hk/en-data/dataset/hk-hko-rss-quick-earthquake-messages) | `qem` 為天文台分析的全球 M6 或以上地震消息；`feltearthquake` 是香港有感地震報告，兩種資料不應混為一談。資料按有更新時發布。 | 公開 GET JSON。API 空物件代表目前沒有新報告，不可推論全球沒有地震。原型清楚分開全球速報與本地報告。 |
| 港鐵列車 | <https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=EAL&sta=ADM&lang=TC>；[data.gov.hk 資料集／API 規格](https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data) | 每站最多四班到站預報；data.gov.hk 列每 10 秒更新。原型目前試點為金鐘站東鐵綫、港島綫、南港島綫。 | 公開 GET；無帳戶登入欄位要求。規格列 429 Too Many Requests，應控制請求速率。到站 ETA 不是完整事故／延誤公告。資料集列 MTR Corporation Limited 為知識產權擁有人；發佈商業產品前應確認適用重用條款及標註要求。 |

| 巴士／小巴／渡輪 ETA | KMB/LWB、Citybus、TD GMB ETA，以及 HKKF ETA 官方 API。各資料集／規格連結見下方目錄。 | 已接入四個營辦商 API 試點：九巴麗城花園站、城巴一站／11 號線、綠色小巴港島 1 號線山頂總站、HKKF 中環－坪洲。KMB ETA 偶有較長回應；營辦商 API 與主要警報 endpoint 分開查詢。 | 僅固定示範少數站點／航線，不可宣稱全港路線覆蓋。ETA 是到站預估，不是事故、改道、服務中斷通知；現時無使用者路線選擇器。每個營辦商來源獨立顯示連線狀態，60 秒快取。 |

## 已核實、建議下一階段接入

| 類別 | 官方來源／API 基址 | 頻率／可用性 | 缺口／建議 |
|---|---|---|---|
| 九巴／龍運巴士 ETA | [政府資料集](https://data.gov.hk/en-data/dataset/hk-td-tis_21-etakmb)；API 基址 <https://data.etabus.gov.hk/v1/transport/kmb/>；[官方 API 規格](https://data.etabus.gov.hk/datagovhk/kmb_eta_api_specification.pdf) | ETA 每分鐘更新；路線／站點資料每日更新。原型現查麗城花園第一期 (TW367) 停站預報。 | 按路線、站點、服務類型查詢 JSON；後續可做常用路線／附近站收藏。服務改道及停駛仍須看營辦商公告。 |
| 城巴／新巴（Citybus／NWFB）ETA | [政府資料集](https://data.gov.hk/en-data/dataset/ctb-eta-transport-realtime-eta)；API 基址 <https://rt.data.gov.hk/v1/transport/citybus-nwfb/>；[營辦商 API 規格](https://www.citybus.com.hk/datagovhk/bus_eta_spi_specifications.pdf) | ETA 每分鐘更新；路線及站點調整時更新。原型示範城巴 11 號線、一個巴士站。 | ETA 不是延誤警報；需以營辦商公告補足臨時改道。非營運時段可能無 ETA。 |
| 綠色專線小巴 | [政府資料集](https://data.gov.hk/en-data/dataset/hk-td-sm_7-real-time-arrival-data-of-gmb)；API 基址 <https://data.etagmb.gov.hk/>；[官方規格 PDF](https://data.etagmb.gov.hk/static/GMB_ETA_API_Specification.pdf) | ETA 每分鐘更新；資料集說明涵蓋全數綠色專線小巴路線。原型示範港島 1 號線山頂總站。 | 到站預測不是交通事故、停駛或改道警報。紅色小巴未核實到同等全港官方 ETA 資料流；不可標稱全覆蓋。 |
| 渡輪／海路 | 香港九龍渡海小輪：[資料集](https://data.gov.hk/en-data/dataset/hkkf-hkkfdata-hkkf-eta-data)、[ETA 規格 PDF](https://www.hkkfeta.com/datagovhk/HKKF_ETA_API_Specification.pdf)、基址 <https://www.hkkfeta.com/opendata/eta/{route_id}/{direction}>；海事處[海事通告](https://www.mardep.gov.hk/en/legislation/notices/md-notices/index.html) | HKKF ETA 每分鐘更新；規格列 JSON 路線／方向 ETA。原型試點中環－坪洲航線。海事處通告按發布更新，無固定延遲 SLA。 | HKKF API 只涵蓋其自營路線，不是全港渡輪匯總；臨時停航／特別安排需營辦商通告。RSS／通告可作海上工程及航道安全補充。 |
| 航空／機場 | 機管局[data.gov.hk 航班資料集](https://data.gov.hk/en-data/dataset/aahk-team1-flight-info)、[機場即時航班頁](https://www.hongkongairport.com/en/flights/departures/passenger.page)、[API 規格 PDF](https://www.hongkongairport.com/iwov-resources/misc/opendata/Flight_Information_DataSpec_en.pdf) | 政府資料集每日更新至前一曆日；規格描述的是前一日航班資料。 | **不是即時航班 API**。本次查核到當日即時資訊有官方網頁／My HKG，但未核實到穩定公開的第三方即時 API；原型只提供官方查閱連結，不抓取網頁內部接口。 |
| 道路速度／流量 | 運輸署[data.gov.hk 策略及主要道路交通資料](https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads) | 目錄資料說明原始偵測器資料約每分鐘、處理後路段資料約每兩分鐘更新；包含流量、速度、佔用率。 | 本次未核實到穩定可直接呼叫的具體資源 URL；目前只記錄目錄頁。其資料為有偵測器覆蓋路段的車速／流量，不能代替事故公告；接入前先核實目前資源 endpoint/schema。 |
| 鐵路服務警報 | 港鐵[官方服務狀況網頁](https://www.mtr.com.hk/tc/customer/main/service_status.html)；運輸署特別交通消息 feed | 港鐵官方網頁呈現服務狀態；運輸署 feed 偶爾包含公共交通安排。 | 本次未找到港鐵專用、穩定公開的服務中斷警報 API。MTR Next Train ETA 的特別安排回應只可作輔助，不能取代官方服務公告。 |
| 停課／院校安排 | 教育局[繁體 RSS 頻道目錄](https://www.edb.gov.hk/tc/rss/index.html)：[最新消息 feed](https://www.edb.gov.hk/tc/whats_new_rss.xml)、[新聞資訊 feed](https://www.edb.gov.hk/tc/press_release_rss.xml)；[政府新聞公報繁體 RSS](https://www.info.gov.hk/gia/rss/general_zh.xml) | RSS 收錄一般消息／公報，官方新聞公報確曾刊載紅雨等情況下的學校停課安排。 | 沒有專用停課 API。可用關鍵詞篩選 feed 並連回公告原文，但可能漏報／誤判；大學、職訓和個別專上院校的決定可能分別公布，未核實有一個 feed 完整涵蓋。 |
| 政府公共公告 | 政府新聞處[一般新聞公報繁體 RSS](https://www.info.gov.hk/gia/rss/general_zh.xml)；[data.gov.hk 資源頁](https://data.gov.hk/tc-data/dataset/hk-isd-gnmis-gnmis/resource/cf9205c5-10f6-4fea-bad1-64a647004aae)；[GovHK RSS 分類目錄](https://www.gov.hk/tc/about/rss.htm) | 官方 RSS；data.gov.hk 標示更新頻率「有需要時」。其他類別 feed 包括教育與就業、環境、社區與健康、基建與物流。 | 涵蓋廣泛政策／一般新聞和公告，不等於只載緊急事件；需按部門與關鍵詞分類、去重及分開一般公告／警報，部分設施更新仍要個別部門 feed。 |
| 水浸風險資料 | 渠務署[data.gov.hk 水浸黑點](https://data.gov.hk/en-data/dataset/hk-dsd-dsd_psi_1-flooding-blackspots)；現已接入的天文台 `warningInfo` 包含雨警／山泥傾瀉警告 | 渠務署資料集更新頻率「有更新時」；說明是監察水浸黑點及防洪措施；天文台警告依生效訊號更新。 | DSD 黑點為風險地點，不是即時水位或「現正水浸」警報；本次未核實全港即時水浸事故 feed。可以先顯示風險地圖並明確標籤。 |
| 空氣質素健康指數 | 環保署[data.gov.hk AQHI 24 小時 XML 資料](https://data.gov.hk/tc-data/dataset/hk-epd-airteam-past24hr-aqhi-of-individual-air-quality-monitoring-stations/resource/f78f413a-627f-47de-8dea-c3baabebdecb)；XML：<https://www.aqhi.gov.hk/epd/ddata/html/out/24aqhi_ChT.xml> | 環保署一般及路邊監測站 AQHI；每小時更新，顯示健康風險級別與建議。 | 適合作戶外健康資訊，不是交通事故警報；建議獨立環境健康卡片。 |

## 資料授權與可靠性

- DATA.GOV.HK 條款：<https://data.gov.hk/en/terms-and-conditions>。允許免費商業及非商業重用，但須清楚標示資料來源，並適當致謝政府、相關資料機構及 DATA.GOV.HK。
- 政府資料按「AS IS」提供；政府不保證準確、完整、可靠、及時或持續供應。介面須展示「最後查詢／來源狀態」，並提供官方公告連結。
- 對有獨立知識產權擁有人的資料（如 MTR、Citybus、Airport Authority），正式公開或商用前須確認各自條款；不要把技術可呼叫誤當成所有用途都獲授權。
- 本原型只作資訊整合輔助；颱風、暴雨、山泥傾瀉、地震等緊急情況請以政府部門最新公告為準。

## 建議產品路線

1. 先完成「收藏地點／車站／路線」；僅接入使用者實際關心的巴士、小巴及渡輪 ETA，而不是在首頁大量抓取全港站點。
2. 先做「可調整路線清單 + 官方消息連結 + 來源狀態」，再做背景警報。公開 feed 大多採輪詢，沒有查到可依賴的推播 webhook；避免短間隔大量查詢。
3. 加入警報偏好：道路封閉半徑、常搭路線、天氣門檻及靜音時段。風險級別和推播必須對應官方 warning code／公告狀態，不用自由文字猜測嚴重度。
4. 使用官方繁體中文內容作主顯示，保留來源、原始更新時間、事件狀態、最近成功查詢時間、過期標籤和來源故障回退。
5. 完成端點速率限制／退避策略及來源故障監察後，才開啟瀏覽器通知或 PWA 推播；現有原型不會在背景推播，也不會在使用者關閉頁面時持續監察。
