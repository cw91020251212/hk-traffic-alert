# 鐵路事故後備入口：改為港鐵車務狀況直達頁

- 日期（香港時間）：2026-09-28
- 狀態：修改、驗證及 main 合併完成；公開 Pages 發布待使用者確認
- 分支：`fix/railway-service-status-direct-link`
- 相關 PR：[PR #12](https://github.com/cw91020251212/hk-traffic-alert/pull/12)，已合併
- main 合併 commit：`6d4e226ce38120646f522a5a7e0473a89886efcf`
- 使用者目標：點一下就到相關鐵路事故／服務狀況，不要先進一般出行易路線搜尋再自行找。

## 查證與決策

- 舊網址 `https://www.hkemobility.gov.hk/tc/route-search/pt` 是香港出行易「乘車」路線搜尋頁，並非鐵路事故／列車狀況頁；使用者指出它不能達到後備入口的目的。
- 查證港鐵官方繁體頁 `https://www.mtr.com.hk/ch/customer/main/service_status.html` 可直接開啟，頁面標示「車務狀況」，列出港鐵路綫及服務正常／延誤／受阻等圖例與資訊。它比一般路線搜尋更符合旅客遇到事故時要查列車服務的目的。
- 因此把快速入口改為「港鐵車務狀況（官方）」，指向港鐵官方車務狀況頁，保留新分頁開啟。
- 不變更事故偵測、警報規則、官方資料讀取、A→B 路線功能或出行易一般路線搜尋連結。

## 變更

- `client/src/pages/StaticHome.tsx`：底部後備入口替換原出行易 `/route-search/pt` 外連，改到港鐵車務狀況官方頁。
- `client/src/pages/Home.tsx`：列車消息、延誤提示及到站資料失效的後備連結也改到港鐵車務狀況官方頁；只保留真正用來搜尋路線的 HKeMobility links。
- `README.md`、`HANDOFF_AI_SUMMARY.md`、`todo.md`、`reports/README.md`：記錄新入口及目前待發布狀態。

## 驗證

- 網路查證 `https://www.hkemobility.gov.hk/tc/route-search/pt` 頁面確實是公共交通路線搜尋。
- 網路查證 `https://www.mtr.com.hk/ch/customer/main/service_status.html` 港鐵官網直達頁，包含「車務狀況」和列車服務狀態圖例；HTTP GET 成功。
- `pnpm test` — 6 個 test files，49 項測試通過。
- `pnpm check` — TypeScript 檢查通過。
- `pnpm pages:build` — 正式 Pages build 成功，輸出 JS `assets/index-B0r4a0Ur.js`。
- `pnpm build` — Server 版前端及 server bundle build 成功。
- 本機 Browser 確認連結文字「港鐵車務狀況（官方）」指向精確的官方 URL，`target="_blank"`；375px viewport `clientWidth`／`scrollWidth` 都是 375，沒有橫向溢位。
- 已用官方網址直接檢查港鐵繁體「車務狀況」頁成功回應，頁面包含服務狀態圖例。舊 HKeMobility 網址已查證為一般乘車路線搜尋頁。

## 後續與發布

- 程式已透過 PR #12 合併到 `main` commit `6d4e226ce38120646f522a5a7e0473a89886efcf`；公開網站目前仍是 `gh-pages` `4a671bc`，該版的鐵路入口仍指向出行易公共交通路線搜尋。
- 是否將修正更新到所有訪客可見的 GitHub Pages，等待使用者確認。部署後要在線上核對直接開啟港鐵繁體車務狀況頁。
- 若已發布後需要回復，可 revert 對應 Pages deployment commit；不改動港鐵或出行易服務。
