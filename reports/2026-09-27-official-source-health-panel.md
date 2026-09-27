# 官方資料來源狀態面板

- 日期（香港時間）：2026-09-27
- 狀態：完成、已合併、已發布
- 相關 PR：[PR #1](https://github.com/cw91020251212/hk-traffic-alert/pull/1)
- 功能合併 commit：`de974820d771089b407ef56e78093f17c5950904`
- Pages 發布 commit：`c7fc702f039fbc00e81efd7c52f423aaa64651b4`

## 使用者目標

為香港交通警報器公開 Pages 版增加清楚、低干擾的官方資料來源健康狀態，讓使用者能分辨「沒有符合門檻的警報」與「上游來源不可讀」，並可直接查看各官方來源。

## 完成內容

- 在警報區下方加入預設收合的「官方資料來源狀態」面板；避免增加手機首屏負擔。
- 逐項顯示官方來源標籤、可讀取／暫不可用狀態、HKT 檢查時間或失敗訊息，以及來源官方入口連結。
- 顯示提示：「可讀取」只代表剛才成功取得資料；內容更新時間及完整性以官方公告為準。
- 載入未完成或 dashboard 失敗時保留明確的降級提示，不會把資料不足當作一切正常。
- 為手機寬度、標準／大／特大文字模式及 `prefers-reduced-motion` 加上對應樣式。
- 主要檔案：`client/src/pages/StaticHome.tsx`、`client/src/index.css`；產品／交接紀錄同步更新 `README.md`、`todo.md`、`HANDOFF_AI_SUMMARY.md`。

## 驗證結果

- `pnpm test` — 5 個 test files，41 項測試通過。
- `pnpm check` — TypeScript 檢查通過。
- `pnpm pages:build` — GitHub Pages 專用 build 成功。
- `pnpm build` — server／一般 production build 成功。
- 375×812 行動版手動視覺驗收：正常情境顯示 7 個可讀取來源；模擬運輸署來源失效時，畫面清楚標示 1 項暫不可用並保留其他成功來源。兩情境均檢查未見橫向溢位。
- 發布後實際開啟正式網址核對新版 bundle；7 項官方來源當時均成功讀取並顯示狀態與 HKT 檢查時間。

## 發布與交付

- PR #1 已 squash merge 至 `main`；GitHub Pages 為舊式 `gh-pages` root 發布，main merge 不會自動部署。
- 已將 `main` 的 Pages build 輸出推送至 `gh-pages` commit `c7fc702f039fbc00e81efd7c52f423aaa64651b4`；保留原有 `.gitkeep` 及 `__manus__/debug-collector.js`，替換 HTML 與雜湊靜態資產。
- 公開網址：[https://cw91020251212.github.io/hk-traffic-alert/](https://cw91020251212.github.io/hk-traffic-alert/)
- 上線後核對首頁引用新 JS bundle `/hk-traffic-alert/assets/index-WtrCNG2H.js`，bundle 包含來源狀態元件字串，實際頁面可見「7 項可讀取」。

## 未完成事項與限制

- 本面板呈現官方來源的抓取結果，不保證上游內容完整、最新、無延遲或具 SLA；發生重大情況仍以官方公告為準。
- GitHub Pages 仍是瀏覽器直接讀取 CORS 允許的來源；不增加 server/API、背景推播或 TDAS POST 路線速度功能。

## 下一步／回復方式

- 正常維護請依 `reports/README.md` 為每項後續工作另建一份報告，並將報告和相關更新一同保存到 GitHub。
- 若需回退此次公開 Pages 資產更新，可在 `gh-pages` 建立對 `c7fc702f039fbc00e81efd7c52f423aaa64651b4` 的 revert commit；不要 force-push 或直接刪除歷史。

## 安全與資料注意事項

- 面板只連到已列明的公開官方資料來源；沒有收集或上傳使用者行程偏好。
- 本報告不包含 API key、token、密碼或使用者私隱資料。
