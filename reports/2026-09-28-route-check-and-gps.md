# 行程警報比對簡化與按需 GPS 起點

- 日期（香港時間）：2026-09-28
- 狀態：功能及本機 QA 完成；待建立／合併 PR；未發布至公開網站
- 分支：`feat/route-check-simplify`
- 相關 PR／Issue：待建立
- 相關 commit：待 commit

## 使用者目標

使用者選擇「先改善事故與實際路線的比對，不加 AI」及免費方案，並要求起點可在用家按鈕後以 GPS 取得，行程畫面不要一次展開太多資料；輸入起點與終點後，要讓用家看得明白程式如何判斷，而不能單用「安全／不安全」作保證。

## 完成內容

- 行程規劃面板預設收合；原先「輸入一次，程式替你篩走無關資料」改成清楚說明「按大區初步比對，不是實際路線檢查」。
- 新增「用目前位置作起點」按鈕。只有用家按下才呼叫 `navigator.geolocation.getCurrentPosition`；不使用 watch、不作背景追蹤。成功後以易讀「目前位置（GPS）」顯示，並提示裝置回報精度。權限被拒、逾時或裝置錯誤時提供手動輸入替代方案。
- GPS 座標只放在當前行程狀態供本地地區估算及用家自行選擇的 Google Maps 連結使用；不會自動寫入 localStorage。地區估算以香港民政事務總署公開的 18 區界線，在前端作點落多邊形判斷後合併為港島／九龍／新界及離島。若用家明確選擇保存常用行程，起點會保存於此裝置；選擇開啟 Google Maps 時，起點／目的地會交給 Google。
- 新增明確的「檢查這程的地區警報」按鈕；按下後以結果卡交代起點／目的地可辨認的大區、出行方式、命中官方警報項數，以及命中警報清單（收合細節）。大區位置不明時不宣稱完成比對。
- 將「安全／照常出發」等看似實際路線保證的措辭改為「暫未找到同區重大警報」等保守描述；明示目前只按地名／GPS 可辨認的大區及出行方式初步篩選，沒有核對實際道路或事故是否在路線上。
- 同步 GitHub Pages／Server 兩種首頁，並更新 README、roadmap、hand-off 和手機 QA 截圖。
- 區界線資料由 `scripts/prepare-hk-area-boundaries.py` 從官方 JSON 下載，簡化至 0.001 度後作本地靜態資料；不會呼叫後端或地圖 API。距離區界約 120 米內時不猜測大區。
- 主要檔案：`client/src/components/RouteLocationButton.tsx`、`client/src/data/hk-area-boundaries.ts`、`client/src/lib/journeyDecision.ts`、`client/src/lib/routePlanner.ts`、`client/src/pages/StaticHome.tsx`、`client/src/pages/Home.tsx`、`client/src/index.css`。

## 驗證結果

- `pnpm test` — 9 個 test files／80 tests 全通過。
- `pnpm check` — TypeScript 通過。
- `pnpm pages:build` 及 `pnpm build` — 公開 Pages 與 Server production build 均成功；Vite 仍提示既有主要 bundle 略高於 500 kB 門檻，為非阻擋 warning。
- `git diff --check` — 通過。
- Playwright 375×812 — 確認行程面板預設收合；頁面初載不呼叫 GPS，按定位按鈕後才呼叫一次；成功位置顯示易讀標籤；權限拒絕有手動輸入 fallback；座標在用家明確保存前不在 localStorage；命中結果清楚顯示地區／方式／數量及「沒有核對實際道路路線」限制；沒有水平溢位。
- 手機畫面：[`route-planner-collapsed-375.png`](assets/route-planner-collapsed-375.png)、[`route-planner-checked-375.png`](assets/route-planner-checked-375.png)。
- 沒有呼叫 AI API，沒有新增 API key、地圖 API 或付費服務。
- 官方界線資料來源：香港民政事務總署／[DATA.GOV.HK「District boundary」](https://data.gov.hk/en-data/dataset/hk-had-json1-hong-kong-administrative-boundaries)，[官方 JSON 資源](https://www.had.gov.hk/psi/hong-kong-administrative-boundaries/hksar_18_district_boundary.json)。

## 發布與交付

- 目標環境：GitHub Pages 靜態版和 Server 版，經 PR 合併後另行部署。
- 目前分支：`feat/route-check-simplify`。
- PR／commit：待建立。
- 使用者可見網址：<https://cw91020251212.github.io/hk-traffic-alert/>（目前仍是已發布舊版，本功能尚未公開）。
- 狀態：未發布；此次新功能沒有取得公開部署確認。

## 未完成事項與限制

- 本次刻意沒有精確計算 Google Maps／其他導航服務的路線幾何，故不會知道事故與封路是否實際落在該路線。
- GPS 只用官方行政區多邊形估算粗略大區；離線 polygon 為減少前端負擔而簡化，區界附近 120 米範圍回報未知；這仍不是實際路線 geometry、道路級事故或封路比對。運輸署事故資料本身多為文字地點且未全面使用事故座標。
- Google Maps URL 只在用家點擊外部導航連結時打開，路線由 Google Maps 自行計算；不代表本程式取得或驗證 Google 的替代路線。
- 使用者尚未要求公開部署本次 route planner 功能；PR 合併前後均不得把新 bundle 推到 `gh-pages`。

## 下一步／回復方式

- 推送此分支並建立 PR；讓使用者透過 PR review。未有本功能明確的公開發佈指示前，不合併部署至 Pages、不更新 `gh-pages`。
- 如需撤回，可 revert 相關 PR／commit；GPS 僅單次呼叫，沒有持續 watch 或自動座標上傳。

## 安全與資料注意事項

- Geolocation 需要用家按下按鈕並由瀏覽器授權。該座標不是帳戶資料，不會由本功能自動保存或傳送；常用行程只在用家明確保存後保存在本機。若用家選擇開啟 Google Maps，路線起點與目的地會交由 Google 處理。
- 不以 AI 或地區估算宣稱「安全」；官方警報清單與導航服務仍應作為出發前參考。
