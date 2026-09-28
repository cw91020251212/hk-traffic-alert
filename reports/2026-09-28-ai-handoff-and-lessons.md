# AI 接手報告：最新狀態、已發布功能與修正教訓

- 日期（香港時間）：2026-09-28
- 目的：讓下一位 AI／工程同事快速接續，避免誤判目前版本、重做已完成工作或再把視覺 QA 誤當成正式站驗收。
- 最新 GitHub `main`（本報告提交前）：`c819820`；PR #24 已合併。
- 最新公開 GitHub Pages commit：`075f022a27bd16184b019ad1df2377c1d79b20fc`。
- 正式網站：<https://cw91020251212.github.io/hk-traffic-alert/>。
- 本報告是 AI 工程交接，不代表新的產品需求或超出使用者已授權的部署範圍。

## 目前可確認的事實

### Repo、PR、部署

- Repo：<https://github.com/cw91020251212/hk-traffic-alert>；正式原始碼主線為 `main`。
- 最近一項行程功能：PR [#24](https://github.com/cw91020251212/hk-traffic-alert/pull/24)，已於 2026-09-28 合併至 `main`，merge commit `f83cbc74025cad84cccafb20800bdfc4187e3c01`。
- PR #24 的程式 commit：`70add062cef06d39d6b1258c59d22ad30a580bd4`。
- 使用者已明確確認合併及公開發布；GitHub Pages 更新至 `gh-pages` commit `075f022a27bd16184b019ad1df2377c1d79b20fc`。
- Pages workflow [#36406863148](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36406863148) 結果為 success。
- 正式首頁實際載入 `assets/index-Cr6dghH4.js` 與 `assets/index-BtK7HkjM.css`。部署後曾比對線上與本機正式 build，JS/CSS 內容一致，公開資產 HTTP 200；JS 中確認有「檢查這程的地區警報」、「目前位置（GPS）」和「沒有核對實際道路路線」等文案。
- 截至本報告提交前，`main` 的最新 commit 是 `c819820`；這是部署後的文件紀錄，不是另一個網站版本。

### 主要產品功能狀態

- Pages 靜態首頁以手機直向使用為優先，摘要重要交通、天氣、鐵路等官方警報；來源健康指示、事故分類圖示及雨警／風球色標均在先前已發布版本中。
- PR #24 將行程面板改為預設收合；只有用家點定位按鈕後才呼叫一次瀏覽器 GPS，沒有背景定位。顯示易讀的「目前位置（GPS）」及裝置提供的精度；拒絕權限或定位失敗時可手動輸入。
- GPS 點位在前端以民政事務總署公開的 18 區 polygon 作大區提示，再合併為港島、九龍、新界／離島；接近界線約 120 米時避免猜測。資料由 `scripts/prepare-hk-area-boundaries.py` 產生，簡化 tolerance 0.001°，生成的資料在 `client/src/data/hk-area-boundaries.ts`。
- 用家輸入起點／終點後，要再按「檢查這程的地區警報」才顯示命中的大區、出行方式、警報數量和收合的警報清單；保存 GPS 行程前不會自動寫入 localStorage。點擊 Google Maps 才把起點與目的地交給 Google。
- 結果是**大區及出行方式層級的初步提示**，不是實際導航路線、道路事故定位、封路狀態或安全保證。程式沒有讀取 Google Maps 的 route geometry，也沒有道路級交通 API。
- 沒有新增 AI API、OpenRouter key、付費地圖 API 或需付費服務；Maps 仍是用家主動點擊後才開啟的外部導航連結。
- Server 版也有相同 UI 原始碼，且 `pnpm build` 通過；此部署更新的是 GitHub Pages 靜態版，並未另外部署 Express/tRPC server。

## 為甚麼曾經「改了顏色，畫面看起來仍然黑白」

這是功能覆蓋與驗收範圍漏看，不是使用者看錯：

1. 最初的分類配色只作用於「有符合門檻的重大警報卡」內的道路／鐵路／天氣／地震圖示。那些卡片是條件式內容；沒有重大警報卡時，使用者在首頁常看到的圖示不是這一組。
2. 首頁一直存在的交通方式按鈕、運輸署／港鐵／天文台入口及手機導覽圖示，原本仍沿用中性灰色。因此即使警報卡示例裡的 icon 已著色，整個常駐介面依然會給人黑白的感覺。
3. 前一輪 QA 驗了示例事故卡／天氣色標和窄螢幕排版，但沒有第一時間在「沒有事故卡的首頁初始狀態」逐個盤點並截取正式網站畫面；也沒有把所有持續可見與條件式圖示列成驗收矩陣。
4. 使用者指出後才補上常駐來源入口、行程方式按鈕和 Server 手機導覽配色，並再次核對正式頁的 computed style、bundle 與 375px 預覽。這一原因及修正紀錄另見 [`2026-09-28-interface-icon-colors.md`](2026-09-28-interface-icon-colors.md)。

### 給下一位 AI 的防重蹈指引

- 不要只看元件示例、Storybook 類預覽或 build 輸出，就宣稱使用者實際畫面已改善。先重現使用者指出的**原始頁面與狀態**，特別是零警報／空狀態、警報出現時、手機窄螢幕及已部署正式頁。
- 做 UI 配色時，先列完整 icon inventory：常駐控制、條件式警報卡、收合摘要、來源連結、手機導覽、錯誤／載入／空狀態；分別確認 Pages 與 Server 兩種介面。
- 發布前確認實際首頁 HTML 指向哪個 JS/CSS hash，檢查公開資產 HTTP 狀態及實際 DOM／computed style；成功 build 不等於已發布，已推 `gh-pages` 亦不等於 CDN 已更新。
- 報告要清楚分開 main merge、Pages deploy、workflow 結果、正式頁核實；不要將「PR 開了」「分支已推」「預覽可看」誤稱成「已發布」。部署後把準確 SHA、Actions run 與網址回填到 `reports/`、`todo.md`、`HANDOFF_AI_SUMMARY.md`。
- 新的高影響公開發布仍要依該次使用者的明確授權處理；以前某一功能獲授權，不應自動當作之後每項新功能均獲授權。

## 已知限制及後續方向

- 目前交通事件常以文字地點提供，沒有完整可靠的經緯度／道路 segment；單有 GPS 起點和目的地無法知道事件是否落在導航路線上。
- 真正做 route impact，需要可靠地名 geocoding、路線幾何、事故座標／道路 segment、事件更新頻率和 error/fallback 政策。AI 可以整理解說，但不能代替上述可驗證資料，也不能因此保證行程安全。
- 使用者本次選擇先做免費、簡潔、無 AI／無付費 API 的大區提示與按需 GPS；除非後續明確改變要求，勿擅自改成 OpenRouter key 收集或付費 Google Routes 整合。
- 近界 120 米與 0.001° polygon 簡化是保守工程門檻，不是測繪精度聲明；實際路線級比較仍未完成。
- 目前使用者已確認把 PR #24 發布到 GitHub Pages，該功能已上線。其他未來變更仍要依當次授權／repo 流程。

## 驗證摘要

- `pnpm test`：9 files／80 tests 通過。
- `pnpm check`：通過。
- `pnpm pages:build`、`pnpm build`：通過；Server bundler 有超過 500 kB 的既有非阻擋提示。
- Playwright 375×812：行程面板初始收合、初載不觸發 GPS、定位按鈕才觸發、拒絕時可手動輸入、結果清楚交代大區邏輯與限制、沒有水平溢位。
- Pages workflow #36406863148 success；正式頁 HTML 引用的新 JS/CSS 與已驗證的 main build 相同，皆為 HTTP 200。

## 主要交接連結

- 詳細行程功能與發布報告：[`2026-09-28-route-check-and-gps.md`](2026-09-28-route-check-and-gps.md)
- 常駐介面配色根因及修正：[`2026-09-28-interface-icon-colors.md`](2026-09-28-interface-icon-colors.md)
- PR #24：<https://github.com/cw91020251212/hk-traffic-alert/pull/24>
- 正式 Pages：<https://cw91020251212.github.io/hk-traffic-alert/>
