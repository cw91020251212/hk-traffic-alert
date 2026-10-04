# 天文台有效警告顯示：實作與交接報告

**日期：** 2026-10-04（香港時間）

**狀態：** PR #30 已合併；GitHub Pages 部署成功，公開網址已核實。

## 用戶需求與問題

用戶指出日常天氣警告也重要，包括氣溫下降、黃色暴雨、洪水及水浸。原先重大警報流程只把特定高嚴重程度的警告送進主要出行警報；其他天文台警告只在收合的天氣詳情區顯示，且重大警報卡片有限額，因此容易被忽略。

## 本次變更

新增共用的 **「天文台生效警告」** 摘要區，放在首屏主要提示下方，在 Static／GitHub Pages 版及 Server 版皆可直接看見，不需先展開天氣詳情。摘要區逐項列出 API 當前回傳的有效警告，不受主要警報卡片上限、地區篩選或類別篩選影響；每項可展開查看天文台原文、更新時間及官方連結。過往未進入重大警報判斷的有效警告也會進入共用提醒／路線提示，但低級別訊號仍是一般 `watch`，不會因此觸發重大警報的呼吸或音效提醒。

另外，洪水／水浸特別報告在天氣詳情中獨立成類；`WFNTSA` 明確標為新界北部並定位至新界／離島，不再當作全港事件；黃色暴雨標示全港，其他不宜猜測影響範圍的警告會提示「詳情見公告」。火災危險警告的黃／紅子類也新增中文標籤。

## 類別及嚴重程度原則

| 天文台訊號 | 應用顯示等級 | 說明 |
| --- | --- | --- |
| 黃色暴雨、寒冷、雷暴、強烈季候風、霜凍及新加入的 warningInfo 類別 | 一般提醒 `watch` | 保持可見，但不升格為重大事故 |
| 紅色暴雨、山泥傾瀉、新界北部水浸特別報告 | 較高注意 `high` | 水浸報告只作新界北部大區提示 |
| 黑色暴雨、八號及以上熱帶氣旋、海嘯 | 嚴重 `critical` | 沿用既有高嚴重級別 |

保留天文台原文，不推測實際受影響道路、樓宇或積水深度。黃色暴雨原文可能提及低窪地區水淹或山洪風險，但仍須看官方公告及現場情況。

## 官方資料核實

核對來源包括[天文台 Open Data API 說明（PDF）](https://www.hko.gov.hk/en/weatherAPI/doc/files/HKO_Open_Data_API_Documentation.pdf)、[天文台警告詳情](https://www.hko.gov.hk/en/wservice/warning/details.htm)及[暴雨警告系統](https://www.hko.gov.hk/en/wservice/warning/rainstor.htm)。API 文件說明 `warningInfo.details[]` 的 `warningStatementCode`、`subtype`、`contents[]` 及 `updateTime`，並列出暴雨、寒冷、雷暴、霜凍、北新界水浸等警告代碼。2026-10-04 直接查詢[warningInfo API](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warningInfo&lang=tc)時，回應含 `WTS` 雷暴和 `WRAIN/WRAINA` 黃色暴雨；黃色暴雨原文包括低窪地區水淹及山洪風險。這是當時的快照，不表示該訊號目前仍有效。

## 驗證結果

`pnpm test` 通過：**94 tests、11 個測試檔案**；`pnpm check` TypeScript 通過；`pnpm pages:build` 和 `pnpm build` 兩種 production build 均通過（Server build 有既存的大 chunk 提示，不影響完成）。Playwright Chromium 實際開啟 Pages build，在 375 × 812 手機尺寸以 8 種警告 fixture 驗證：黃雨、寒冷、新界北部水浸、雷暴、強烈季候風、霜凍、黃色火災危險及三號風球。8 項全數出現在獨立面板，水浸通告可展開，無橫向溢出或頁面錯誤。測試截圖：[assets/hko-warnings-375.png](assets/hko-warnings-375.png)。

## 部署界線

用戶確認後，PR [#30](https://github.com/cw91020251212/hk-traffic-alert/pull/30) 已於 2026-10-04 合併至 `main`，merge commit 為 `e34428d9129f1d8dd4256fbe0c07f31fe7b13a87`。GitHub Pages 靜態資產發佈至 `gh-pages` commit `49f79d51c5c90cd1dd1b6a55fb4b265b59136585`；[部署工作 37206484813](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/37206484813) 結果為 success。

正式網址 <https://cw91020251212.github.io/hk-traffic-alert/> 及其 JavaScript bundle 均回傳 HTTP 200。公開 bundle `assets/index-Bv4fPdfC.js` 已確認包含「天文台生效警告」、「黃色暴雨警告」、「寒冷天氣警告」及「新界北部水浸特別報告」文字。
