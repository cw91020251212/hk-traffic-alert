# 交通警報器｜香港官方資料源備忘錄

最後核實：2026-09-27（香港時間）

> 「已接入」只表示本原型讀取過該官方資料；不等於全港資料完整、即時 SLA、營辦商認可或任何形式的緊急服務保證。各來源以自己的發布時間為準。

## 目前已接入

| 類別 | 官方 API／資料 | 本原型目前用途 | 更新、覆蓋與限制 |
|---|---|---|---|
| 道路事故／封路／特別安排 | 運輸署[第二代交通消息 XML](https://www.td.gov.hk/tc/special_news/trafficnews.xml)；[schema](https://www.td.gov.hk/en/special_news/trafficnews.xsd)；[data.gov.hk 資料集](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2) | 解析道路／交通事件、地點、地區、狀態、公告時間；未完結事件優先於已完結事件，最近公告在前。 | 官方資料目錄列為即時，但未公布端到端延遲 SLA。這是公告資料流，不是所有路段的塞車感應器。伺服器快取約 60 秒。 |
| 道路車速／行程時間 | 運輸署 [TDAS API](https://tdas-api.hkemobility.gov.hk/tdas/api/route)；[data.gov.hk 資料集](https://data.gov.hk/en-data/dataset/hk-td-tis_28-traffic-data-tdas)；[官方 API 規格](https://tdas-api.hkemobility.gov.hk/tdas/specification/TD_TDAS_API_Specifications.pdf) | POST 指定 WGS84 起終點座標，顯示「大圍 ↔ 中文大學／大埔」吐露港公路走廊雙向平均路線速度、距離和預計時間。兩方向官方 API 樣例已實測成功。 | data.gov.hk 列資料每 5 分鐘更新。這是起點至終點的平均路線估算，不是每個路段的偵測器速度；端點可能含接駁路段，不能單憑平均值宣稱某個路段塞車。UI 的「行車緩慢／偏慢／一般」門檻是產品參考，不是運輸署官方警報。快取約 5 分鐘。 |
| 港鐵到站／延誤旗標 | [MTR Next Train API](https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=EAL&sta=ADM&lang=TC)；[資料集及規格](https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data) | 金鐘站東鐵綫、港島綫、南港島綫到站預報；官方 `isdelay="Y"` 時在 UI 提示延誤並連往[港鐵車務狀況頁](https://www.mtr.com.hk/tc/customer/main/service_status.html)。 | 資料集列每 10 秒更新；API 規格列有 `429 Too Many Requests`。`isdelay` 是簡短狀態旗標，沒有事故原因／細節，不能取代港鐵服務公告。資料集列 MTR Corporation Limited 為知識產權擁有人，商用前須確認條款。本站 60 秒快取。 |
| 天氣警告／災害 | 天文台 `warningInfo`：[繁體中文 JSON](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc)；[官方 API 文件](https://www.hko.gov.hk/en/weatherAPI/doc/files/HKO_Open_Data_API_Documentation.pdf) | 颱風、黃／紅／黑雨、山泥傾瀉、海嘯、雷暴、酷熱／寒冷、火災危險等活躍警告。 | 本站約 60 秒查詢；不是天文台 SLA。若來源失效則標示暫停。警告訊號不能判斷哪條街正在水浸。 |
| 地震 | 天文台 [QEM 速報](https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php?dataType=qem&lang=tc)；[香港有感地震報告](https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php?dataType=feltearthquake&lang=tc) | 分開顯示全球 M6+ 速報和香港有感地震報告。 | 按有新報告時提供；空回應不代表全球沒有地震。本站約 60 秒查詢。 |
| 即時天氣／九日預報 | 天文台 [`rhrread`](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc)；[`fnd`](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc)；[官方文件](https://www.hko.gov.hk/en/weatherAPI/doc/files/HKO_Open_Data_API_Documentation.pdf) | 顯示天文台測站氣溫、相對濕度、各區過去一小時雨量及觀測時段、當前 UV（有資料時）、天氣概況、逐日最高／最低溫與降雨概率。 | data.gov.hk 將當前天氣列為每小時／有更新時；不同子資料有自己的時間。UV 夜間可能空白，介面不當成 0；雨量是時段讀數，不是即時雨率。本站快取約 5 分鐘。 |
| 空氣質素健康指數 | 環保署 [24 小時 AQHI XML](https://www.aqhi.gov.hk/epd/ddata/html/out/24aqhi_ChT.xml)；[data.gov.hk 資料頁](https://data.gov.hk/tc-data/dataset/hk-epd-airteam-past24hr-aqhi-of-individual-air-quality-monitoring-stations/resource/f78f413a-627f-47de-8dea-c3baabebdecb) | 每站從過去 24 小時資料中取最新一筆，展示一般及路邊測站；實測回應有 18 站。 | 官方列每小時更新。這是測站環境健康指數，不是未來預測或交通事故；每站更新時間可能有差異。本站快取約 5 分鐘，來源失效顯示「暫不可用」而非 0。 |
| 巴士／小巴／渡輪 ETA | 官方 API：KMB/LWB、Citybus/NWFB、TD 綠色專線小巴、香港九龍渡海小輪。各官方規格及端點見下方「交通補充」。 | KMB 荃灣麗城花園單站、城巴單站／路線、綠色小巴港島 1 號線單站、HKKF 中環－坪洲航線試點；每個 provider 個別顯示錯誤。 | 是固定示範站／航線，不是全港搜尋器；ETA 不代表事故、改道或停駛。各來源本地 60 秒快取。 |

## 交通補充：已核實 API 但仍需擴大使用者選擇

- **九巴／龍運：** [政府資料集](https://data.gov.hk/en-data/dataset/hk-td-tis_21-etakmb)，API 基址 `https://data.etabus.gov.hk/v1/transport/kmb/`；[規格 PDF](https://data.etabus.gov.hk/datagovhk/kmb_eta_api_specification.pdf)。ETA 每分鐘更新；目前只查一個荃灣站點。
- **城巴／新巴：** [政府資料集](https://data.gov.hk/en-data/dataset/ctb-eta-transport-realtime-eta)，基址 `https://rt.data.gov.hk/v1/transport/citybus-nwfb/`；[規格 PDF](https://www.citybus.com.hk/datagovhk/bus_eta_spi_specifications.pdf)。目前只作單站／單線試點。
- **綠色專線小巴：** [政府資料集](https://data.gov.hk/en-data/dataset/hk-td-sm_7-real-time-arrival-data-of-gmb)，基址 `https://data.etagmb.gov.hk/`；[規格 PDF](https://data.etagmb.gov.hk/static/GMB_ETA_API_Specification.pdf)。路線資料覆蓋綠色小巴，但原型只示範港島 1 號線。未核實到紅色小巴同等全港官方 ETA feed。
- **渡輪：** HKKF [資料集](https://data.gov.hk/en-data/dataset/hkkf-hkkfdata-hkkf-eta-data)，基址 `https://www.hkkfeta.com/opendata/eta/{route_id}/{direction}`；[規格 PDF](https://www.hkkfeta.com/datagovhk/HKKF_ETA_API_Specification.pdf)。只涵蓋其營辦航線；不是全港所有渡輪匯總。
- **航空：** [機管局即時航班頁](https://www.hongkongairport.com/en/flights/departures/passenger.page)可查當日資訊；[data.gov.hk 航班資料集](https://data.gov.hk/en-data/dataset/aahk-team1-flight-info)只更新至前一曆日，不是即時 API。原型不抓取未核實的機場網頁內部接口。
- **全港道路圖：**[香港智能交通網即時交通圖](https://www.hkemobility.gov.hk/tc/traffic-information/live/cctv/all?cctv=on&jt=on&smp=on&ts=on)提供主要道路交通資訊。原型目前提供吐露港雙向指定走廊速度估算並連往官方全港圖，不能稱為已嵌入全港逐路段速度圖。

## 待選／待接入的高影響公共消息

| 類別 | 官方來源及已核實限制 |
|---|---|
| 學校停課／復課 | 教育局[繁體 RSS 目錄](https://www.edb.gov.hk/tc/rss/index.html)：[最新消息](https://www.edb.gov.hk/tc/whats_new_rss.xml)、[新聞資訊](https://www.edb.gov.hk/tc/press_release_rss.xml)，以及[政府新聞處一般公報 RSS](https://www.info.gov.hk/gia/rss/general_zh.xml)。RSS 不是專用停課 API；關鍵字有漏報／誤判風險，大學及職訓院校安排可能各自公布。 |
| 政府／公共設施停開 | [政府新聞處 RSS](https://www.info.gov.hk/gia/rss/general_zh.xml)及[GovHK RSS 分類](https://www.gov.hk/tc/about/rss.htm)。含大量一般新聞，應分成一般公告與緊急通知，並按部門／關鍵字分類。 |
| 水浸 | 渠務署[水浸黑點資料集](https://data.gov.hk/en-data/dataset/hk-dsd-dsd_psi_1-flooding-blackspots)。這是易水浸地點／風險資料，非即時水位或「某街正水浸」feed；天文台暴雨及山泥警告可作警示背景，但不能替代現場水位。 |
| 海事／泳灘等 | 海事處[海事通告](https://www.mardep.gov.hk/en/legislation/notices/md-notices/index.html)可補充航道及海上安全；不同部門沒有一個涵蓋全部設施的統一 API，實作前逐個核實來源。 |

## 授權、品質與產品安排

- [DATA.GOV.HK 使用條款](https://data.gov.hk/en/terms-and-conditions)：免費商業及非商業重用仍須標示來源並適當致謝；請按原始資料集條款執行。
- 政府資料多按「AS IS」提供，不保證準確、完整、及時或持續供應。頁面須保留來源、原始資料時間、最近查詢時間、過期／失敗提示及官方連結。
- MTR、營辦商、機管局等資料可能有獨立知識產權／使用條款。技術上能讀取不代表所有商業用途均已獲授權。
- 已採用分離 tRPC 查詢：交通／災害公告約 60 秒、營辦商 ETA 約 60 秒、道路速度及環境資料約 5 分鐘。慢來源不應阻塞道路封閉或天氣警告。
- 下一個交通重點：增加更多有清晰起終點的 TDAS 主要道路走廊、使用者可選路線／車站／收藏；優先按「未完結、影響道路／人數、時間」排序。現有消息排序僅按未完結及最近時間，還沒有可信的受影響人數資料。
- 背景推播尚未實作。關閉頁面後本原型不持續監察，也不會發送通知。
