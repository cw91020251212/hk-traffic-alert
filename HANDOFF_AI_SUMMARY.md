# 交通警報器｜AI 接手總覽與經驗交接

更新時間：2026-09-28（香港時間）
最近的行程功能 PR #24 已合併至 GitHub `main`，merge commit `f83cbc74025cad84cccafb20800bdfc4187e3c01`；AI 接手檢討見本次新增報告。
目前公開 Pages：`gh-pages` commit `075f022a27bd16184b019ad1df2377c1d79b20fc`；workflow 成功，正式 JS／CSS 已核實。
本文件目的：讓下一位 AI 直接接續，勿重做已驗證工作或誤稱未完成項目已完成。若下面較早的歷史紀錄與此處不同，以本段及最新日期報告為準。

## 每次 AI 工作完成後的報告要求

- 每項工作完成後，在 [`reports/`](reports/) 建立一份 `YYYY-MM-DD-主題.md` 報告，依 [`reports/README.md`](reports/README.md) 的流程和 [`reports/TEMPLATE.md`](reports/TEMPLATE.md) 範本記錄需求、改動、驗證、發布狀態、限制及下一步。
- 報告必須隨工作變更一同提交到 GitHub（透過 PR 合併或依當前授權的 repo 流程），確認遠端已保存後才算完成；若工作中斷，先留下進度／未完成事項，後續再補成完整報告。
- 不寫入 API key、token、密碼、使用者私隱或未公開憑證；公開報告只放不敏感的摘要和可核對的 commit／PR／網站連結。

## 2026-09-27 最新接手更新

- 首屏已改為直接回答「照常出發／預留時間／改路／未能完整確認」，而不是先叫市民逐項查資料。
- A→B 已移到首屏；輸入香港地名後在本機推斷相關地區並自動篩選，無法辨認時才讓使用者補充地區。
- 新增 `client/src/lib/journeyDecision.ts` 及測試；現為 5 個 test files、41 tests 通過，TypeScript 與 production build 通過。
- 已完成 375×812 展開表單實測：金鐘站→大埔墟站、公共交通、Google Maps URL、localStorage 及橫向溢位均已核驗。
- 已補 manifest／SVG app icon。仍然沒有精確 route geometry、背景推播或長駐 Express server deployment；不可誤稱已完成。
- GitHub Pages 已設定於 <https://cw91020251212.github.io/hk-traffic-alert/>，由 `gh-pages` branch 發布。由於 Pages 無 server runtime，該版本在瀏覽器直接讀取已核實 CORS 的道路消息、港鐵及天文台來源，每 60 秒更新；TDAS POST 路線車速及完整 Express／tRPC 功能仍需 server hosting。
- Pages 版已加入標準／大／特大文字、本機常用行程，以及道路事故慢速呼吸警示；`prefers-reduced-motion` 會關閉動畫。
- 2026-09-27 使用者實機截圖證實港鐵官網維護頁不可用；介面內鐵路外連已改用已核實的運輸署 HKeMobility 後備入口。港鐵 API 讀取邏輯不變。
- `client/src/pages/StaticHome.tsx` 的 Pages 公開版提供預設收合的資料連線診斷：可見官方來源是否成功讀取及檢查時間。一般用戶應看警報卡與易讀官方入口；不要將內部 JSON/API 點擊連結當成主要產品功能。原始健康面板詳見 PR #1 和報告 [`2026-09-27-official-source-health-panel.md`](reports/2026-09-27-official-source-health-panel.md)。
- 使用者指出 PR #3 曾發布的整列 raw API 連結會打開一般人看不懂的 JSON／程式碼。現行版本改為「資料連線檢查」：易讀中文來源名、讀取狀態和時間，不保留 raw API 外連／箭頭，並說明連線成功不代表內容最新或列車準時。`pnpm test` 6 files／44 tests、`pnpm check`、`pnpm pages:build` 通過。GitHub [PR #6](https://github.com/cw91020251212/hk-traffic-alert/pull/6) 合併至 `main` `b27ee1e` 後，依使用者確認將正式 Pages 更新至 `gh-pages` commit `bc42bc837e1be592ed44c2979baf186b1887008b`。正式頁實測 7 項易讀名稱、0 個來源 raw API 連結、無技術字串／箭頭，警報卡和易讀官方入口均正常。詳見 [`reports/2026-09-28-source-health-diagnostic-ux.md`](reports/2026-09-28-source-health-diagnostic-ux.md)。
- 使用者建議在收合摘要列顯示七粒燈，讓人一眼看到哪些資料源讀取失敗。PR #9 已將 7 格狀態燈合併到 `main` commit `ac3ad6566063fb9cb691b92877a7584e1ac02f5a`：綠＝成功、紅＝失敗、灰＝未確認；固定順序與展開清單對應，每項保留中文名稱／狀態和 aria-label。`pnpm test` 6 files／49 tests、`pnpm check`、`pnpm pages:build` 通過。375px browser 驗收收合／展開及普通／大／特大字級均無水平溢位；七燈與七列同序，綠紅灰色值正確。依使用者確認，七燈版已發布至 `gh-pages` commit `4a671bcb155cf5908674c32013fd926e5e0c2ee5`。正式頁 7 燈均綠、7 列同序、0 個 raw API 連結，警報卡及 3 個官方入口正常。詳見 [`reports/2026-09-28-source-health-summary-lights.md`](reports/2026-09-28-source-health-summary-lights.md)。
- 使用者指出舊「鐵路事故後備入口（香港出行易）」其實指向 `/tc/route-search/pt` 一般公共交通路線搜尋，沒有預設事故／車務狀況。PR #12 已將 Pages 後備入口，以及 Server 版列車消息／延誤／無到站資料連結，改為港鐵官方繁體「車務狀況」直達頁 `https://www.mtr.com.hk/ch/customer/main/service_status.html`；A→B 真正路線搜尋仍保留出行易。入口文字改成「港鐵車務狀況（官方）」。`pnpm test` 6 files／49 tests、`pnpm check`、`pnpm pages:build`、`pnpm build` 全通過；375px browser 確認 href 指向官方頁、新分頁開啟、沒有水平溢位。PR #12 已合併至 `main` commit `6d4e226ce38120646f522a5a7e0473a89886efcf`，依使用者確認，Pages 已發布至 `gh-pages` commit `ad2bf46532ab62927525d1cde27f4480fdd6a21a`。正式頁 DOM 已確認官方 MTR href／新分頁與入口文字；A→B 出行易路線搜尋仍保留。詳見 [`reports/2026-09-28-railway-status-direct-link.md`](reports/2026-09-28-railway-status-direct-link.md)。
- 使用者指出 `service_status.html` 只展示「正常／延誤／受阻」顏色圖例，沒有列出即時各綫狀態。親自檢查後確認港鐵首頁 `https://www.mtr.com.hk/ch/customer/main/index.html#RYGLineStatus` 才是實際即時狀況區：列出各路綫狀態及最後更新時間；該錨點可直接將頁面捲至狀態列表。PR #16 已把 Pages quick link 及 Server 三處港鐵服務／資料失效入口改到此錨點，入口改名「港鐵即時車務狀況（官方）」；A→B 搜尋不變。最新 main 的 49 tests、typecheck、Pages／Server build 通過。PR #16 合併至 `main` `398fffdd`；使用者先選擇暫不發布，隨後於 2026-09-28 更正並確認發布。Pages 已更新至 `gh-pages` commit `993361c0026ac851ff986d87feed0dc55e9eab1a`；正式頁 DOM 確認即時狀態 href、標籤、新分頁和不再連到圖例頁。詳見 [`reports/2026-09-28-mtr-live-status-anchor.md`](reports/2026-09-28-mtr-live-status-anchor.md)。

- 使用者同意在事故文字旁加適合的圖示。分支 `feat/incident-type-icons` 新增共用 `PriorityAlertIcon`：道路＝汽車、鐵路＝列車、天氣＝閃電雲、地震＝震波；以 Lucide 本地向量 icon，非每宗事故即時生成圖片。Pages／Server 共用並附中文無障礙標籤。`pnpm test` 8 files／54 tests、typecheck、Pages／Server build 通過；桌面和 375px browser preview 已確認四類圖示正確、中文 aria-label 存在、標題無水平溢位。PR #19 已合併至 `main`，commit `ad2c8bf96fd408d4a0c6b2e67d9d4725dbb7ca30`。使用者於 2026-09-28 09:21 明確要求發布；Pages 已更新至 `gh-pages` commit `88f701817cb17f010a55b7370b1bb7eccff430bd`，正式頁載入圖示 bundle，並在目前道路事故卡確認 SVG／`道路交通` aria-label。報告：[`reports/2026-09-28-incident-type-icons.md`](reports/2026-09-28-incident-type-icons.md)。

- 使用者接着要求暴雨、風球以外的分類 icon 也要更有顏色，避免黑白單調；已把道路／鐵路／天氣／地震圖示改為橙／藍／青綠／紫色配色，分別對比率 4.73／6.16／5.26／6.51:1。另含雨警黃／紅／黑信號色及風球 1／3／8／9／10 號產品自訂顏色 badge；保留 HKO warning code，只接受八號 NE／NW／SE／SW 方向，未知／取消／畸形 subtype 不猜色。8 files／71 tests、typecheck、Pages／Server build 通過；375×812 分別預覽四種分類 icon 和八種天氣信號。PR [#22](https://github.com/cw91020251212/hk-traffic-alert/pull/22) 已合併至 `main` commit `a3a6759e5b8ebd4cafb398416e5d124366336d68`；依使用者於 2026-09-28 10:58 的明確要求，GitHub Pages 已部署至 `gh-pages` commit `797e827df38f5e14b9e48e7ed930cfa4246bf23c`，workflow run [36372370048](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36372370048) 成功。正式 browser computed style 確認四色背景／圖示顏色已載入。報告：[`reports/2026-09-28-weather-signal-colors.md`](reports/2026-09-28-weather-signal-colors.md)；預覽：[`reports/assets/category-icons-preview-375.png`](reports/assets/category-icons-preview-375.png)、[`reports/assets/weather-signals-preview-375.png`](reports/assets/weather-signals-preview-375.png)。

- 後續使用者於 2026-09-28 11:15 指出公開頁常駐介面 icon 仍呈黑白。原因是前一版只替「有重大事件時才會出現」的警報卡分類 icon 加色，當時沒有警報卡，看到的便是仍用中性色的常駐來源入口和行程控制。本 follow-up 把運輸署／港鐵／天文台快捷入口改為橙／藍／青綠 chip，行程模式加入汽車／列車／步行彩色 icon，Server 手機列的警報／交通／天氣／更多入口亦加色。`pnpm test` 8 files／71 tests、typecheck、Pages／Server build 通過；375×812 Pages／Server 預覽無水平溢位。PR [#23](https://github.com/cw91020251212/hk-traffic-alert/pull/23) 已合併至 `main` commit `640b354060a3637aab61a620f0da17011b91ba0b`；依使用者先前明確授權已發布至 `gh-pages` commit `deab64efe92a98c94d52c91716564a340b191c86`，Pages workflow [36373869213](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36373869213) 成功。公開頁新 JS／CSS HTTP 200，browser computed styles 確認常駐來源和出行模式圖示有色。報告：[`reports/2026-09-28-interface-icon-colors.md`](reports/2026-09-28-interface-icon-colors.md)；預覽：[`reports/assets/interface-icons-preview-375.png`](reports/assets/interface-icons-preview-375.png)、[`reports/assets/server-mobile-navigation-preview-375.png`](reports/assets/server-mobile-navigation-preview-375.png)。

## 先把這三種網址分清楚

1. **公開 GitHub 原始碼**：<https://github.com/cw91020251212/hk-traffic-alert>  
   Repository visibility 已查證為 **Public**，預設分支 `main`。這條是程式碼，不是可長期承諾的正式網站。
2. **目前可直接分享的 WebDev 預覽**：<https://3000-ih1j11rgdevjk1295tsun-ba280051.sg2.manus.computer>  
   可用手機直向開啟給人試用；這是 sandbox preview，可能隨環境而變，**不是正式長期部署網址**。
3. **正式公開網站**：GitHub Pages 版已設定於 <https://cw91020251212.github.io/hk-traffic-alert/>，在瀏覽器每 60 秒讀取支援 CORS 的核心警報來源。GitHub Pages 不能運行 Express/tRPC，TDAS POST 路線車速及其他 server 功能未包含。Cloudflare Workers 尚未建立／發布；不可把 Pages 稱為長駐 API server。

## 使用者要的產品（以此作為需求準繩）

- 名稱暫用「交通警報器」；使用者要求手機直向使用。畫面空間有限，不能把上百條 source/API data 全攤出來。
- 核心是**代使用者篩選值得注意、會影響出行的真警報**，不是炫耀接了多少 API。
- 道路交通最優先：塞車／擠塞／封路／事故，特別包括吐露港公路；其次是港鐵壞車、延誤或服務中斷；再顯示惡劣天氣及其他重大出行風險。
- 一般落雨、常規 ETA、溫度、AQHI 等日常資料不應被誤稱警報或推到第一屏。有效黃雨、紅雨、黑雨、颱風等官方警告要用易辨認的顏色和等級置頂；已取消訊號要退場。
- 主頁應在手機上一眼回答：有沒有需要改路／注意的事？使用者可按港島、九龍、新界等地區與道路、鐵路、天氣、地震篩選；清單不用一次全顯示。
- 真實生活情境包括上班／放工、轉乘趕車、惡劣天氣、跨區或旅行。需短、可掃讀、垂直單欄和明確行動入口。
- 使用者要 A→B 最佳路線建議；原型以 Google Maps route URL 提供實際 route suggestions，附香港運輸署 HKeMobility 官方連結。App 會按使用者手選沿線地區提示可能相關警報，並非自動精確檢查每段路／封路。

## 已完成（來源程式碼在 public GitHub main）

- React 19 / Vite / TypeScript 前端；Express + tRPC server；手機優先警報首頁。
- 首頁重大警報選擇器：道路、港鐵延誤、有效天氣警告、本地有感地震、極慢指定走廊；雨量一般讀數本身不觸發警報；普通資訊收合於詳情。
- 嚴重程度、地區、警報種類 chips；全港氣象警報在所選地區仍保留；「無符合門檻」與「來源不可用」分開，來源故障不會冒充一切正常。
- 目前只有保守 keyword-based 道路事件 classifier，已加入塞車／擠塞字眼，排除明示「不影響交通」和已解除等狀態，仍需更多實際 feed 樣本校正。
- 運輸署第二代特別交通消息 XML；TDAS 吐露港附近大圍↔中文大學／大埔兩向「整條指定路線平均速度與 ETA」試點。不是逐路段流量、不是全港塞車地圖。
- 港鐵金鐘東鐵綫／港島綫／南港島綫 ETA 試點；`isdelay` 僅旗標，不是完整故障事故內容。
- KMB 荃灣單站、Citybus 單線站點、綠色小巴港島 1 號線、HKKF 中環－坪洲 ETA 示範。
- 天文台官方 `warningInfo`、地震速報 `qem`、香港有感地震 `feltearthquake`、即時天氣 `rhrread`、九日預報 `fnd`；環保署 AQHI 24 小時 XML 取每站最新讀數。
- A→B：駕車／公共交通／步行；Google Maps URL 不用 API key，HKeMobility 官方頁作備用；最多五條路線存在**使用者同一瀏覽器的 `localStorage`**，不讀 GPS、不上傳伺服器。
- 官方 API timeout、分開快取，慢 ETA 不阻塞主要事故／天災 query。
- 所有資料來源覆蓋、端點、頻率、限制見 `DATA_SOURCES.md`；候選停課／水浸／公共公告限制見 `政府公告與警報選項.md`。

## 已驗證狀態

本次分支由 main `0bc7790` 建立；合併後請以 GitHub 顯示的最新 main commit 更新本文件。原有主線記錄：

- 階段二當時為 4 個 test files、36 tests；階段三最新驗證為 `pnpm check` 通過、**5 個 test files／41 tests 通過**、`pnpm build` 成功。
- Desktop 及 375px 直向首頁 preview 已截圖檢查。首頁收合狀態確認手機警報優先；**375px 展開 A→B route form 的長文字／溢位仍未驗**。
- Browser 實際填過「金鐘→大埔墟」、公共交通，確認 Google Maps URL；常用路線存在 localStorage 後已清除這次測試資料。
- 最新功能/完成/缺口要看 `todo.md`，不要只根據本摘要推斷。

## 之前處理錯了甚麼（下一位請避免）

1. **把原意做成 API 看板。** 最初我把交通、天氣、AQHI、ETA、來源清單一次攤在畫面上。使用者直接指出這是把工作推回給市民，沒人會逐行找重點。雖然後來已改為 alert-first 手機首頁，classifier 和覆蓋還是原型級；下一步要實際打磨「只把達門檻的事件推到主頁」。
2. **桌面思維套在手機。** 使用者明確要求手機垂直小螢幕；左右欄或寬表格都不能以桌面截圖當完成標準。每次 UI 改動先驗 375px portrait，特別是打開 route form／多警報的狀態。
3. **過度解釋、過度查核與反覆問技術選擇。** 我花太多時間講可能方案，卻遲遲沒給使用者要的結果；對使用者這是「扮做嘢」。後續應在低風險範圍先做 MVP、展示可用成果、明確列限制，再按回饋修正，不要用一連串自我保護的「不能保證」取代實際行動。
4. **錯誤預設 private。** 我一度假設 GitHub repo 要 private，與使用者想公開相反；後來已確認和改為 public。不可再次擅自更改 visibility。
5. **把 GitHub 原始碼誤當網站網址。** 使用者要能直接給人用的網站 URL；GitHub repo 只提供源碼。預覽 URL 有效但可能臨時；正式網站至今沒發布。我曾先後講平台比較，但沒有交到正式網址。要真正完成，就要部署並實際打開測試後才回覆 URL。
6. **交接資訊必須交接資訊，不要空泛。** 使用者要求所有前因後果、完成／未完成、做錯之處要寫出，令第二、第三位 AI 可接手；`README.md`、`todo.md`、`工程交接報告.md`、`開發說明.md` 已有詳細資訊，這份摘要是快速入口。

## 最優先續做（按依賴次序）

1. 先檢查公開 repo latest commit 和本文件，不要重做已驗證 endpoints。
2. 完成 route form **展開後** 375px 直向溢位／操作驗收（已知缺口）。若看到 UI 問題先修、補測、建置，再存 checkpoint／commit。
3. 繼續校正 alert-only UX／classifier：有效 severity 放最前；普通雨、普通 ETA、已取消訊號不能誤報；來源暫不可用一定另顯示。用真實 TD/HKO payload 做 false positive/negative tests。
4. 擴充 TDAS 主要道路 preset 前，逐路線核實座標、兩個方向、距離及回應時間。需要逐段車速／車流時須另接相應 sensor feed，不能以 TDAS route average 代替。
5. 提升精確 route-to-alert matching 前，先確認能安全合法取得 route geometry，並有帶座標的交通事故 feed／geocoding；本版只做手選沿線地區「可能相關」，不可稱自動避封路。
6. GitHub Pages 靜態版已完成，核心警報來源每 60 秒由瀏覽器查詢。若下一階段要 TDAS POST、完整 ETA 及真正 `/api/trpc`，才部署長駐 server／Worker，並從外網驗證首頁與 API。
7. 完成使用者之前要求但未做的手機 app icon／Manifest/PWA；見 `todo.md`。
8. 擴充停課、水浸、更多公共通告以前，先確認有權威且 machine-readable 的即時來源；目前 `政府公告與警報選項.md` 只列研究結果。DSD water blackspots 不是實況、EDB RSS 不是專用停課 feed。
9. Web push/background monitor 最後才考慮；本版關頁後不監察、不推送。

## 主要檔案／讀取順序

1. `README.md`
2. `HANDOFF_AI_SUMMARY.md`（本檔，快速總覽／錯誤回顧／續做）
3. `todo.md`（最新完成、缺口與測試）
4. `工程交接報告.md`（較完整架構、API、門檻、續做順序）
5. `開發說明.md`（環境、開發、驗證和跨 AI 接棒流程）
6. `產品方向與警報規則.md`（使用者意圖與警報設計）
7. `DATA_SOURCES.md`、`政府公告與警報選項.md`（官方來源與限制）

## 給下一位 AI 的溝通原則

- 簡短說現在做緊乜，然後動手；每個階段交付一個可見結果。
- 不要問使用者已講過的決定（手機優先、公開 GitHub、只需直接網址），也不要再解釋多次平台概念。
- 避免全量顯示。主畫面預設只篩出可核實、具出行影響的事件；其他放詳情，並讓嚴重警報視覺上即刻分辨。
- 若功能未完成，直講未完成，提供最短下一步；不得把預覽、repo、deployment 混為一談。
- 每棒更新 `todo.md`、工程交接與驗證數字；此承諾對第二位、第三位接手者同樣有效。


- 使用者於 2026-09-28 表示想用外部地圖提供路線，但選擇先改善實際路線與警報的比對、不加 AI、不啟用付費 API；亦要求起點可按需 GPS，並避免把所有邏輯／欄位同時攤開。已改為 `feat/route-check-simplify`：Pages／Server 的行程卡預設收合；GPS 只在按鈕後請求，顯示「目前位置（GPS）」和裝置估算精度，權限拒絕可手動輸入；按「檢查這程」後明示大區／方式／命中警報數，沒有核對實際路線或事故是否在該路段。整體首頁警報也不再用「安全」或「照常出發」作無根據承諾。GPS 不會自動存入 localStorage；使用者明確保存常用行程才留在本機；點 Google Maps 時才把起點／目的地交給 Google。`pnpm test` 9 files／80 tests、`pnpm check`、Pages／Server build、`git diff --check` 全通過；Playwright 375×812 驗證初始收合、點擊才取 GPS、拒絕 fallback、座標未自動持久化及無水平溢位。手機圖：[`reports/assets/route-planner-collapsed-375.png`](reports/assets/route-planner-collapsed-375.png)、[`reports/assets/route-planner-checked-375.png`](reports/assets/route-planner-checked-375.png)。詳見 [`reports/2026-09-28-route-check-and-gps.md`](reports/2026-09-28-route-check-and-gps.md)。目前待推送／開 PR；此 route-check 更新**未發布到公開 Pages**，需本功能的明確發布指示後才可更新 `gh-pages`。


- 2026-09-28 17:19 補充：為免手繪 GPS bounding boxes 誤分類，改用民政事務總署公開 18 區多邊形（本地 0.001° 簡化資料）作點內判斷；離區界 120 米內會保守不猜大區。DATA.GOV.HK／官方 JSON 來源、測試與 375px 最終畫面記於 `reports/2026-09-28-route-check-and-gps.md`。`pnpm test` 80 tests、typecheck、Pages／Server build 通過；新的 route-check 功能尚未推送／發布。


- 2026-09-28 17:22 發布狀態更新：已推送程式 commit `70add062cef06d39d6b1258c59d22ad30a580bd4` 並建立 [PR #24](https://github.com/cw91020251212/hk-traffic-alert/pull/24)；PR OPEN／MERGEABLE，建立時 GitHub 未報 CI checks。PR branch 及報告已備份到 GitHub；尚未合併、未更新 `gh-pages`、公開網站維持舊版。新的 route planner 要等使用者另行明確確認發布。


- 2026-09-28 18:04 最終發布核實：使用者已於 17:57 明確批准合併並發布。PR #24 merged，merge commit `f83cbc74025cad84cccafb20800bdfc4187e3c01`。主線 build 後推送 Pages commit `075f022a27bd16184b019ad1df2377c1d79b20fc`；Pages workflow [#36406863148](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36406863148) success；公開首頁已載入新 JS/CSS，兩個資產 HTTP 200。詳見 `reports/2026-09-28-route-check-and-gps.md`。


- 2026-09-28 18:37 手動更新掣新工作（分支 `feat/refresh-button-feedback`）：根因是 Pages 按鈕只重讀有 60 秒記憶體快取的 `getTransportDashboard()`，Server 按鈕只 refetch 部分 tRPC query，而後端來源快取仍會回舊資料；兩版又欠缺 loading／完成狀態，所以用家看不出更新是否執行。已改 Pages 手動 cache bypass、Server `transport.refresh` 清除四類 server cache 並以 mutation 結果更新四個 tRPC client caches；按鈕至少轉 650 ms，顯示「正在重新檢查…」、成功 HKT 時間、來源失敗數或整體失敗文案。加入 reduced-motion、aria busy/live feedback、快取刷新及狀態單元測試。`pnpm test` 10 files／88 tests、`pnpm check`、Pages build、Server build、`git diff --check` 通過；375×812 Playwright 用來源 mock 驗證多發出官方 request、loading／完成提示及 reduced-motion。證據：`reports/assets/refresh-button-progress-375.png`、`refresh-button-complete-375.png`；完整原因和限制在 `reports/2026-09-28-refresh-button-feedback.md`。**尚未推送／開 PR／部署；須對這項新改動另行取得公開發布確認。**


- 2026-09-28 18:39 PR 狀態更新（覆蓋上一行「尚未推送／開 PR」）：功能 commit `f0ff9b354a29adf8af6f4be33912b4e75cba1fe7` 已推送，GitHub [PR #25](https://github.com/cw91020251212/hk-traffic-alert/pull/25) OPEN／MERGEABLE；建立時 GitHub 未報 CI checks。報告與兩張 mobile QA 截圖已在 PR branch。仍未合併／未部署；刷新按鈕這項新改動的公開發布尚待使用者另行確認。


- 2026-09-28 18:57 refresh release verification: PR #25 merged to main at `2dc3d47e0dd5bfcb86666db922db581128712771`; Pages commit `219f4a6dbce459625fa4e01de1061ba26465fb2b`; workflow [#36412068254](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36412068254) success. Public HTML loads `index-vH88dwkP.js` and `index-h2S6oUv9.css`, both HTTP 200; JS has loading/success copy. The first async watcher exited early because `jq` could not parse formatted CLI output; a direct `gh run list` plus `curl` verification subsequently confirmed the successful run and assets.

- 2026-09-28 18:58 new screenshot bug fix, branch `fix/center-source-link-icons`: selectors `.quick-detail-links a svg:last-child` and button equivalent matched both the trailing external arrow and nested icon-chip SVGs, so `margin-left:auto` defeated grid centering. Changed to direct-child selectors (`a > svg:last-child`, `button > svg:last-child`). Full 88-test suite, typecheck, Pages/Server builds and whitespace check passed. At 375px, Playwright measured road/rail/weather icon center deltas of 0×0 px, 13px external-arrow right gap and no horizontal overflow; screenshot at `reports/assets/source-icons-centered-375.png`. CSS fix is not yet pushed/merged/deployed; user screenshot reported the visible issue. A separate report is `reports/2026-09-28-source-icon-centering.md`. Public deployment of this new fix requires explicit confirmation.


- 2026-09-28 19:00 PR update: centering fix commit `b42983bd0580bab0d0a240be0ee4af654d55ecf9` pushed to [PR #26](https://github.com/cw91020251212/hk-traffic-alert/pull/26), state OPEN／MERGEABLE; GitHub reported no CI checks. The previous refresh commit remains live. The centered-icon CSS update is not merged and not deployed; wait for explicit confirmation before updating `gh-pages`.


- 2026-09-28 19:07 final release status (supersedes the 19:00 pending-deploy note): user explicitly approved PR #26 merge/deploy. PR #26 merged at `48da40c7ed36d93e4abb8fe049bdfeb170fce029`; Pages deployment commit `eacdae362d635648c66c20de4249be3f5c75b585`; workflow [#36413603189](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36413603189) succeeded. Public HTML loads `index-CGYbP6S9.js` and `index-DuqCFk-i.css` (both HTTP 200); CSS selector verified. Playwright on the public page at 375×812 measured road/rail/weather centers 0×0px, arrow right gap 13px and no horizontal overflow. Live screenshot: `reports/assets/source-icons-live-centered-375.png`; complete report: `reports/2026-09-28-source-icon-centering.md`.


- 2026-09-28 19:27 header title follow-up on `fix/header-brand-size`: user says the circled “交通警報器” title is still too small. Cause: mobile `.brand-copy strong` was fixed at 14px and the Pages normal/large/xlarge classes never overrode it. Local CSS now sets title/subtitle 22/11px standard, 26/12px large, 30/14px extra-large, logo tile 40px, min header height 66px. Full 88 tests, typecheck, Pages/Server builds pass; Playwright confirms no title/control overlap or page overflow at widths 320–430px. Report/screenshot: `reports/2026-09-28-header-brand-size.md`, `reports/assets/header-brand-large-375.png`. Not yet PR’d, merged or deployed; public publication needs explicit confirmation for this new change.
