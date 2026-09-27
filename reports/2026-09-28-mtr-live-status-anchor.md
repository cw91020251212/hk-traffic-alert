# 港鐵入口修正：直達即時路綫狀態

- 日期（香港時間）：2026-09-28
- 狀態：程式已合併並驗證；公開 Pages 發布待使用者確認
- 分支：`fix/mtr-live-status-anchor`
- 前置入口修正：[鐵路事故後備入口報告](2026-09-28-railway-status-direct-link.md)

## 使用者回饋

使用者發現當時已上線的「港鐵車務狀況（官方）」會進入 `service_status.html`。親自開啟後確認該頁主要只顯示「服務正常／服務延誤／服務受阻」等顏色圖例與解釋，沒有列出當下各路綫狀況；不符合「點一下查看哪條綫有事」的用途。

## 實地核實與決策

- 港鐵真正的即時狀況列在繁體首頁 `https://www.mtr.com.hk/ch/customer/main/index.html` 的 `#RYGLineStatus` 區。
- 實際 DOM 顯示該區列出荃灣綫、觀塘綫、港島綫、將軍澳綫、屯馬綫、南港島綫、東涌綫、迪士尼綫、機場快綫、東鐵綫等各綫狀態；狀態圖示有相應 aria-label（例如「荃灣綫 服務正常」），並顯示最後更新時間。
- 用完整深層連結 `https://www.mtr.com.hk/ch/customer/main/index.html#RYGLineStatus` 實際開啟後，瀏覽器已跳到狀態列表（`#RYGLineStatus` 頂端在 viewport top），不是落在港鐵首頁頂部。
- 港鐵 `MTR Mobile` 的 `traffic-news/` 網頁是功能介紹／App 下載頁，不是網頁版 live status；故不採用作「一按查看」目的地。
- 因此把入口改為指向港鐵首頁中的即時路綫狀況錨點；舊 `service_status.html` 留作圖例說明時才有用途，不用作事故／延誤查詢入口。

## 修改範圍

- `client/src/pages/StaticHome.tsx`：GitHub Pages 底部港鐵官方入口改為即時狀況錨點，文字改為「港鐵即時車務狀況（官方）」。
- `client/src/pages/Home.tsx`：三個列車服務消息／延誤／資料不可用後備入口一併改到同一個錨點。
- 保持真正的 A→B 路線搜尋和 HKeMobility 連結不變。
- `README.md`、`HANDOFF_AI_SUMMARY.md`、`todo.md`、`reports/README.md`：記錄決策及驗收。

## 驗證

- `pnpm test`：6 個 test files、49 項測試通過。
- `pnpm check`：TypeScript 通過；`pnpm pages:build` 和 `pnpm build` 均成功。Pages bundle 為 `assets/index-C6nSl6QM.js`。
- Browser 實際開啟舊圖例頁、新港鐵首頁和新錨點：舊頁只有圖例；新錨點跳到即時路綫狀況清單，並能顯示最後更新時間。
- 本地 Pages browser 確認入口文字「港鐵即時車務狀況（官方）」、href 精確為 `https://www.mtr.com.hk/ch/customer/main/index.html#RYGLineStatus`、target 為新分頁，且不再連到 `service_status.html` 圖例頁。
- 在 375px 外框的實際 360px viewport 中，頁面 `scrollWidth` 和 `clientWidth` 同為 360px；新入口右側界線在 viewport 內，沒有水平溢位。
- 官方 MTR 首頁深層連結實際驗證：`location.hash` 為 `#RYGLineStatus`、頁面自動捲動至該元素（viewport top 為 0），列表列出 10 條路綫並顯示最後更新時間。

## 合併與發布

- PR #16 已合併到 `main` commit `398fffdd877a255ad73c7f2604c5e3af4238080d`；正式 GitHub Pages 仍是前一版 `ad2bf46`，尚未包含本次錨點修正。
- 正式發布至 `gh-pages` 前需另行取得使用者確認；部署後重驗正式頁 DOM 的 href、錨點和新分頁行為。
- 若發布後要回復，可 revert 對應 Pages deployment commit；不改動港鐵服務。
