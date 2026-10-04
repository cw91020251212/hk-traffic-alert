# 事故位置地圖：來源研究、實作與交接報告

**更新日期：** 2026-10-05（香港時間）
**狀態：** PR #32 已合併；繁體中文地圖與互動事故地圖已部署到用戶自己的 GitHub Pages 公開網站，並完成線上核實。

## 用戶需求

在道路事故、山泥傾瀉等有指定地點的警報中，提供可即時查看的地圖；中文用戶可看懂地名和操作提示。地圖必須區分官方事故座標與文字搜尋的參考位置，不能為區域預警假造事故位置。

## 官方交通資料與位置精度

香港運輸署「特別交通消息（第二代）」官方即時資料集：[data.gov.hk](https://data.gov.hk/en-data/dataset/hk-td-tis_19-special-traffic-news-v2)。其 [v4.0 資料規格](http://static.data.gov.hk/td/special-traffic-news/en/Data_Specification_for_STN_Eng_v4.0.pdf) 定義可選的 `LATITUDE`／`LONGITUDE` WGS-84 欄位，實際訊息亦可能留空。2026-10-04 檢查程式當時讀取的即時 XML，事故「新清水灣道」只有文字地點而沒有座標。因此只有來源提供完整且合理的座標配對時，才可標作「官方座標」。

天文台 `warningInfo` 的山泥傾瀉警告代表區域預警／公告，不等於某一宗有特定座標的塌方事故。來源沒有個別位置時，介面只解釋沒有事故座標，不放置虛構標記。

道路事故優先分類器納入「山泥傾瀉、山泥滑坡、山體滑坡、山崩、泥石流、塌方、塌樹、塌陷、落石、路面陷落」及 landslide／rockfall 等英文字眼，避免有具體位置的個別事故被漏出可開地圖的事故列表。非交通影響及已完結／解除事件仍按原有規則排除。

## 香港政府 GeoInfo 地名搜尋

地政總署／CSDI 的[位置搜尋 API 文件](https://portal.csdi.gov.hk/csdi-webpage/apidoc/LocationSearchAPI)說明 `GET https://www.map.gov.hk/gs/api/v1.0.0/locationSearch?q=...` 可搜尋道路、地址和設施，並提醒避免短時間大量請求。使用者明確打開事故地圖後才按需查詢；查詢會在瀏覽器快取七天，並節制新查詢頻率，不在背景定時把事故逐一送去搜尋。

對「新清水灣道」的真實瀏覽器查詢曾成功返回多個結果，包括道路本身及附近設施；因此文字搜尋可能有歧義。結果由使用者選擇後，才顯示「地名參考點，並非已確認事故點」，並展示候選名稱／地址／地區。CSDI 結果為香港 1980 方格座標 EPSG:2326；以[EPSG:2326 投影定義](https://epsg.io/2326.proj4)轉為 WGS-84，再限制轉換結果必須落在合理的香港範圍。CSDI [資料使用條款](https://portal.csdi.gov.hk/csdi-webpage/doc/TNC)要求清楚標示香港政府及 CSDI Portal 資料來源。

## 互動地圖及繁體中文

底圖採用官方[OpenFreeMap Quick Start](https://openfreemap.org/quick_start/)建議的 MapLibre GL JS + OpenFreeMap vector style：`https://tiles.openfreemap.org/styles/bright`。MapLibre 程式碼動態載入，只在用戶打開地圖時載入。

底圖預設文字欄位原本偏向拉丁／英文名稱，操作按鈕和觸控提示也使用英文。現於地圖樣式載入後，把有文字的標籤改為依序尋找 `name:zh-Hant`、`name:zh`、`name:nonlatin`、本地 `name`，再後備至英文名稱欄位。放大、縮小、署名、全螢幕、位置及 MapLibre cooperative gesture 提示均使用繁體中文；地圖下方亦有手機／桌面操作說明。若地圖資料本身沒有中文名稱，才會用現有名稱作後備；OpenFreeMap、OpenMapTiles 等名稱仍保留原名，署名不被移除。

語言標籤採用 [MapLibre 官方語言標籤範例](https://maplibre.org/maplibre-gl-js/docs/examples/change-a-maps-language/)、[MapOptions locale 文件](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/)及 [OpenMapTiles multilingual schema](https://openmaptiles.org/schema/)；locale 字典亦覆蓋 MapLibre 官方 default locale 中的 cooperative gesture 提示鍵。

地圖保留縮放／導覽及 cooperative gestures，並列出 OpenFreeMap、OpenMapTiles 和 OpenStreetMap 來源。OpenFreeMap [條款](https://openfreemap.org/tos/)說明服務免費提供、按現況提供，可能更改或停止，因此不能承諾該第三方底圖永久可用。地圖面板另提供 Google Maps 的座標／地名外部連結作備用；[Google 官方 Maps URLs 文件](https://developers.google.com/maps/documentation/urls/get-started)指 Maps URLs 不需 API key。

## 實作規則

- 官方交通署／有感地震來源的完整有效座標：標為「官方座標」，並提醒以官方公告和現場情況為準。
- 只有道路文字地名：用戶打開地圖後才查詢香港政府 GeoInfo；用戶選擇候選後，標為「地名參考點，並非已確認事故點」。
- 沒有個別位置的天文台山泥傾瀉區域警告：不做地名搜尋、不顯示事故針，只解釋沒有單一事故座標。
- 搜尋或互動底圖不可用：顯示錯誤／空結果及 Google Maps 外連；查無結果不等於沒有事故。

## 驗證結果

- `pnpm test`：**99 項測試通過**（12 個測試檔案），包括繁中標籤欄位優先序、MapLibre 按鈕與手機／桌面手勢提示翻譯測試。
- `pnpm check`：TypeScript 檢查通過。
- `pnpm pages:build` 與 `pnpm build`：GitHub Pages 及 Server 建置通過。建置會顯示 MapLibre chunk 大小提醒（約 1.05 MB 未壓縮／285.63 KB gzip）；地圖程式碼獨立拆分並按需載入。
- 375px Chromium／Playwright：GeoInfo 候選選取、互動地圖、繁體中文縮放提示、手機／桌面手勢提示及無水平溢出均通過；並檢查實際地圖畫面有中文道路標示。
- 截圖：[375px 地圖驗證畫面](assets/incident-map-375.png)。
- 部署後直接以 cache-busting 請求核實 [GitHub Pages 正式網站](https://cw91020251212.github.io/hk-traffic-alert/)及其新 JavaScript 資源：HTML、JS 均回覆 HTTP 200，bundle 內確認有 `name:zh-Hant`、「放大地圖」及「使用兩隻手指移動地圖」等繁中項目。

## 發布記錄

用戶確認後，PR [#32](https://github.com/cw91020251212/hk-traffic-alert/pull/32) 於 2026-10-05（香港時間）合併到 `main`，merge commit：`b48342fe60851b4c688ed812405a3b31cd610bf6`。

GitHub Pages 使用的來源是 `gh-pages` 根目錄。從合併後的 `main` 建置並部署，`gh-pages` commit 為 `1b8bc395d7ee462a1ebb941f63a670d41b23542b`。GitHub Pages Actions run [#37226770123](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/37226770123) 結果為 **success**。最後直接核實正式網址和新 JS bundle 回覆正常；公開站已包含繁體中文地圖標示及互動事故地圖功能。
