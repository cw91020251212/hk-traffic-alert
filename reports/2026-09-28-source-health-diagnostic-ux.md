# 官方來源狀態：一般用戶易讀化

- 日期（香港時間）：2026-09-28
- 狀態：程式修改、驗證及 main 合併完成；公開網站尚未發布
- 分支：`fix/source-health-human-friendly`
- 相關來源互動 PR：[PR #6](https://github.com/cw91020251212/hk-traffic-alert/pull/6)，已合併
- main 合併 commit：`b27ee1ef8ccb77f72c62e76b74fdd03988db6932`
- 前一個 raw API 連結版本的 PR：[PR #3](https://github.com/cw91020251212/hk-traffic-alert/pull/3)
- 使用者回饋：外連打開後顯示程式碼／原始資料，一般人看不懂，也不明白為甚麼顯示。

## 決策與改動

同意使用者的判斷：直接展示 JSON／API 原始回應不適合交通警報一般乘客。本面板目的只是讓有需要的人確認資料來源是否成功連線，不應讓整列看起來像主要出行功能，也不應將乘客帶到難讀的資料格式。

本次調整方向：

- 保留預設收合的資料來源狀態診斷，但移除每列 API 外連與右上箭頭。
- 顯示易讀的繁體中文名稱及「資料連線正常／暫時無法更新」和檢查時間，失敗時避免直接顯示 HTTP／網路內部錯誤文字。
- 來源摘要改為清楚說明只供連線檢查；「連線正常」只代表剛才成功取得資料，不代表內容最新或列車準時。實用內容請看警報卡和易讀官方入口。
- 以穩定 source id 對應使用者友善名稱；未知 ID 顯示「其他官方交通資料」，不洩漏內部 identifier。
- 無改動任何官方 API URL、資料抓取頻率、警報判斷規則或路線功能。

主要檔案：`client/src/pages/StaticHome.tsx`、`client/src/lib/sourceDisplay.ts`、`client/src/lib/sourceDisplay.test.ts`、`client/src/index.css`、`README.md`、`todo.md`、`HANDOFF_AI_SUMMARY.md`。

## 驗證

- `pnpm test` — 6 個 test files，44 項測試通過（含 3 項新增名稱映射測試）。
- `pnpm check` — TypeScript 檢查通過。
- `pnpm pages:build` — Pages build 成功。
- browser 預覽待資料載入後檢查 7 項來源：都顯示一般人可理解的中文名稱和「資料連線正常」及時間；面板內 `a[href]` 為 0，沒有 raw API URL、JSON／`warningInfo`／`qem`／`Next Train` 等技術名稱，沒有外連箭頭。警報卡、下方運輸署／HKeMobility／天文台易讀入口正常；診斷說明提醒連線成功不代表內容最新或列車準時。
- unknown source id 測試確認介面顯示通用中文名稱，不洩漏內部 id。

## 發布狀態與下一步

本次修改已透過 [PR #6](https://github.com/cw91020251212/hk-traffic-alert/pull/6) 合併至 `main` commit `b27ee1ef8ccb77f72c62e76b74fdd03988db6932`，尚未發布至 GitHub Pages。公開網站仍為 `gh-pages` commit `fdb17c6`，展開來源診斷會連到 raw API。測試及本機 browser 驗收已完成。發布 Pages 前須先取得使用者對此介面更新的明確確認；之後從最新 `main` 建置及發布至 `gh-pages`，在線上確認來源列表沒有 raw API 外連、技術名稱不再出現，警報和易讀官方入口仍正常。

已發布 raw API 互動版本的詳細記錄見 [`2026-09-27-source-health-mobile-tap-target.md`](2026-09-27-source-health-mobile-tap-target.md)。如需回復舊版，可用 Git revert 追溯此次 PR 與 `gh-pages` 部署 commit，不要 force-push。

## 安全與資料注意事項

仍然只從原本公開官方來源讀取資訊；此次只是顯示與互動調整，不增加資料蒐集、第三方服務或使用者追蹤。
