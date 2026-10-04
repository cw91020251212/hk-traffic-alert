# 事故位置地圖：來源研究、實作與交接報告

**更新日期：** 2026-10-05（香港時間）
**狀態：** 本機功能分支已實作並測試；預備建立 PR。**尚未合併，亦未更新 GitHub Pages 公開網站。**

## 用戶需求

在道路事故、山泥傾瀉等有指定地點的警報中，提供可即時查看的事故位置地圖。地圖必須清楚區分官方提供的事故座標與單靠文字搜尋得到的地名參考點；不為只有區域範圍的天文台警告假造事故位置。

## 官方交通資料與位置精度

香港運輸署「特別交通消息（第二代）」官方即時資料集：[data.gov.hk](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2)。其 [v4.0 資料規格](http://static.data.gov.hk/td/special-traffic-news/en/Data_Specification_for_STN_Eng_v4.0.pdf) 定義可選的 `LATITUDE`／`LONGITUDE` WGS-84 欄位，實際訊息亦可能留空。2026-10-04 檢查程式當時讀取的即時 XML，事故「新清水灣道」只有文字地點而沒有座標。因此只有來源提供完整且合理的座標配對時，才可標作「官方座標」。

天文台 `warningInfo` 中的山泥傾瀉警告代表警告範圍／公告，不等於某一宗有特定座標的塌方事故。若公告沒有個別位置，介面只顯示沒有個別事故座標的說明，不放置虛構標記。

另已擴充道路事故優先分類器，納入「山泥傾瀉、山泥滑坡、山體滑坡、山崩、泥石流、塌方、塌樹、塌陷、落石、路面陷落」及 landslide／rockfall 等英文字眼，避免有具體位置的個別事故因舊有關鍵字規則而未進入可開地圖的事故列表。非交通影響及已完結／解除事件仍按原有規則排除。

## 香港政府 GeoInfo 地名搜尋

地政總署／CSDI 的[位置搜尋 API 文件](https://portal.csdi.gov.hk/csdi-webpage/apidoc/LocationSearchAPI) 說明 `GET https://www.map.gov.hk/gs/api/v1.0.0/locationSearch?q=...` 可搜尋道路、地址和設施，並提醒避免短時間大量請求。使用者明確打開事故地圖後才按需查詢；查詢會在瀏覽器快取七天，並節制新查詢頻率，不在背景定時把事故逐一送去搜尋。

對「新清水灣道」的真實瀏覽器查詢曾成功返回多個結果，包括道路本身及附近設施；因此文字搜尋可能有歧義。結果由使用者選擇後，才顯示「地名參考點，並非已確認事故點」，並展示候選名稱／地址／地區。CSDI 結果為香港 1980 方格座標 EPSG:2326；以 [EPSG:2326 投影定義](https://epsg.io/2326.proj4) 轉為 WGS-84，再限制轉換結果必須落在合理的香港範圍。

CSDI [資料使用條款](https://portal.csdi.gov.hk/csdi-webpage/doc/TNC)要求清楚標示香港政府及 CSDI Portal 資料來源。介面在搜尋提示及候選地點說明中標出政府 GeoInfo Map。

## 互動底圖與替代方式

最初測試 OpenStreetMap 自己的 export iframe 曾遇 HTTP 429，故現改採官方 [OpenFreeMap Quick Start](https://openfreemap.org/quick_start/) 建議的 MapLibre GL JS + OpenFreeMap vector style，採用 `https://tiles.openfreemap.org/styles/bright`。MapLibre 以動態 `import()` 延遲載入，只有打開地圖才會載入較大的地圖程式碼／網絡資源。地圖內保留縮放／導覽及 cooperative gestures。畫面同時展示 MapLibre 內建來源署名和明顯的 OpenFreeMap、OpenMapTiles、OpenStreetMap 貢獻者連結。

[OpenFreeMap 條款](https://openfreemap.org/tos/)表示服務免費提供、按現況提供，並可能更改或停止；不能承諾其永久可用。地圖面板另提供 Google Maps 的座標／地名外部連結作備用；[Google 官方 Maps URLs 文件](https://developers.google.com/maps/documentation/urls/get-started)指 Maps URLs 不需 API key。

## 實作規則

- 官方交通署／有感地震來源的完整有效座標：地圖標為「官方座標」，並保留以官方公告和現場情況為準的提醒。
- 只有道路文字地名：使用者打開地圖後，按需呼叫香港政府 GeoInfo 搜尋；必須由使用者選擇一項候選，標籤清楚說明它是「地名參考點，並非已確認事故點」。
- 沒有個別位置的天文台山泥傾瀉區域警告：不做地名搜尋、不顯示任何事故針；只解釋來源未提供單一事故座標。
- 當政府搜尋或互動底圖不可用：顯示錯誤／空結果及 Google Maps 外連，不把查無結果誤說成沒有事故。

## 驗證結果

- `pnpm test`：**98 項測試通過**（12 個測試檔案），包括 HK80 轉換、座標驗證、搜尋快取及山泥／落石等分類回歸測試。
- `pnpm check`：TypeScript 檢查通過。
- `pnpm pages:build` 與 `pnpm build`：GitHub Pages 及 Server 兩個正式建置通過。
- 真實 Chromium／Playwright，375px 寬：真實 GeoInfo 搜尋及候選選擇、官方座標標記、OpenFreeMap style 與 vector tile HTTP 200、署名、天文台區域警告不產生假標記，以及無水平溢出均通過。
- 截圖：[375px 地圖驗證畫面](assets/incident-map-375.png)。
- MapLibre chunk 約 1.05 MB 未壓縮／285.63 KB gzip，獨立拆分並延遲載入。正式建置會顯示 Vite 的 chunk 大小提醒；首屏不載入此 chunk，日後可再按需要評估更細分拆包。

## GitHub 與發布界線

本次依用戶指定，只完成程式、測試、交接報告與 review-only PR；不合併 PR、不推送至 `gh-pages`、不發布網站。公開網站仍是本 PR 合併前版本。
