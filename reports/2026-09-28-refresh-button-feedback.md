# 手動更新按鈕：真正重新檢查、動作回饋與錯誤狀態

- 日期（香港時間）：2026-09-28
- 狀態：修正及本機驗證完成；待 PR 建立／合併；**本次改動尚未發布到公開網站**。
- 分支：`feat/refresh-button-feedback`
- 適用介面：GitHub Pages 靜態版及 Server 版。
- 公開網站目前網址：<https://cw91020251212.github.io/hk-traffic-alert/>

## 使用者回報

右上角的循環箭嘴掣按下後，畫面幾乎沒反應，使用者無從判斷它是否真的有效。期望按下後有明顯動作和結果。

## 根因：只有「重讀畫面」不等於「取回新資料」

- Pages 版原先只改變 reload state，再呼叫 `getTransportDashboard()`。但 `getTransportDashboard()` 有約 60 秒的伺服器記憶體快取；快取有效期間重讀會立即拿到同一份舊 snapshot，畫面和時間戳都可能不變。按掣即使觸發程式流程，也不像真正重新讀官方來源。
- Server 版原先只 `refetch` 警報總覽和道路概況兩個 tRPC query，沒有把港鐵／環境面板一併重讀；而 tRPC query 之後仍會命中 server 端的 in-memory feed cache。
- 兩版沒有明確的「正在更新／已檢查／有資料源失敗」文字，圖示動畫也不保證有足夠時間被看見。因此「執行中」和「完成」對用家不可見；對無警報或來源資料沒有改變的情況尤其像無反應。

> **重要分別：**一次成功的重新檢查，只代表程式重新詢問官方來源，不代表一定有新資料，也不代表資料所述路段沒有事故。

## 修正內容

### Pages 靜態版

- 新增 `refreshTransportDashboard()`：等待舊請求完成、清除 60 秒 dashboard 快取，再重新讀取官方來源。
- 點按後至少維持 **650 ms** 的 loading 狀態，令快速回應也看得到動作；Refresh 圖示持續旋轉，完成後作一次彈動／轉回效果。
- 顯示「正在重新檢查…」；完成後顯示「已重新檢查官方資料 · HH:mm HKT」；部分來源失敗則顯示失敗數，不會假稱全部成功；整體錯誤會顯示「更新失敗，保留舊資料」。

### Server 版

- 新增 `transport.refresh` mutation：等待現有 requests，清除警報、港鐵／交通、道路及環境資料的記憶體快取，重新讀取四組資料，並回傳合併來源狀態。
- 成功後以 mutation 回傳內容更新四個 tRPC query cache，避免畫面再讀到舊的 client cache。
- 使用與 Pages 相同的 loading、成功、部分失敗、整體失敗文案與最短動畫時間。

### 可及性與動態偏好

- 按鈕有 `aria-busy` 及會隨狀態改變的 `aria-label`；結果以 `role="status"`、`aria-live="polite"` 公告。
- 尊重系統 `prefers-reduced-motion: reduce`：停用旋轉／彈動，但保留「正在檢查」文字、按鈕狀態與最後結果。
- 「已重新檢查」不是資料新鮮度保證；即使來源成功，也可能回傳與上次相同內容。

## 驗證

- `pnpm test`：**10 個 test files／88 tests 全部通過**。
- `pnpm check`：通過。
- `pnpm pages:build`、`pnpm build`、`git diff --check`：通過。
- 單元測試涵蓋成功／部分失敗／來源狀態缺失／錯誤文案、HKT 時間格式、至少 650 ms 可見狀態，以及 Pages／Server 更新時繞過 feed cache。
- 375×812 Playwright 以延遲的官方來源 mock 實測：按鈕 click 後發出額外來源 request、旋轉 icon 和 loading 文字可見、完成顯示結果，並釋放 busy 狀態。
- `prefers-reduced-motion` 實測確認 CSS 動畫為 `none`，但 loading 文字仍可見。
- 兩張實際 mobile 預覽：
  - 更新中：[refresh-button-progress-375.png](./assets/refresh-button-progress-375.png)
  - 更新完成：[refresh-button-complete-375.png](./assets/refresh-button-complete-375.png)

## 待辦／發布邊界

- 目前程式只在本地 feature branch；建立 PR 後可供 review。
- **未更新 `gh-pages`，亦未改公開網站。**使用者先前要求改善刷新按鈕，但沒有對這項新改動給出公開發布確認；如要更新網站，須另行確認後再合併／發布。
- 目前沒有引入 AI、第三方 API、API key 或任何付費服務。
- 舊 build 會提示 Server JS chunk 超過 500 kB；本次不是新引入路由拆分工作，應留作後續效能改善，不影響本次 build 成功。

## 下一位 AI 接手建議

1. 先查 `git status --short --branch`，確認仍在 `feat/refresh-button-feedback`。
2. 先重新跑 `pnpm test && pnpm check && pnpm pages:build && pnpm build && git diff --check`。
3. 確認 PR 描述清楚說明：cache bypass + 650 ms loading + 成功／部分失敗狀態；公開部署尚未確認。
4. 若用家確認發布，從合併後的 main 重建 Pages、部署至 `gh-pages`，再核實 Pages workflow 與公開 JS/CSS HTTP 200，更新本報告的發布狀態。
