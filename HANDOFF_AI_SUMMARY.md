# 交通警報器｜AI 接手總覽與經驗交接

更新時間：2026-09-27（香港時間）  
功能合併至 GitHub `main`：`de974820d771089b407ef56e78093f17c5950904`（PR #1）
本文件目的：讓下一位 AI 直接接續，勿重做已驗證工作或誤稱未完成項目已完成。

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
- 使用者指出 PR #3 曾發布的整列 raw API 連結會打開一般人看不懂的 JSON／程式碼。此用途不適合一般乘客；新分支 `fix/source-health-human-friendly` 改為「資料連線檢查」：保留預設收合、易讀繁體名稱、讀取狀態和檢查時間，移除 API 外連及箭頭，並說明它不是即時班次資訊。`pnpm test` 6 files／44 tests、`pnpm check`、`pnpm pages:build` 通過；瀏覽器確認 7 項顯示友善名稱、無來源連結／raw 技術代碼／箭頭，警報卡與易讀官方入口正常。**本次修改尚未合併或發布；公開 Pages 仍是 `gh-pages` `fdb17c6` raw API 連結版。** 詳見 [`reports/2026-09-28-source-health-diagnostic-ux.md`](reports/2026-09-28-source-health-diagnostic-ux.md)。

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
