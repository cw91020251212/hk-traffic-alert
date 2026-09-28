# 首頁常駐介面圖示加色

- 日期（香港時間）：2026-09-28
- 狀態：修正、本機驗證、PR #23 合併及公開 Pages 發布完成
- 分支：`fix/always-visible-interface-icon-colors`
- 相關 PR：[PR #23](https://github.com/cw91020251212/hk-traffic-alert/pull/23)（已合併）
- Main merge commit：`640b354060a3637aab61a620f0da17011b91ba0b`
- GitHub Pages deployment commit：`deab64efe92a98c94d52c91716564a340b191c86`

## 使用者回報與原因

使用者看過上一版公開網站後指出，介面上的圖示仍是黑白。檢查當時正式頁面發現沒有重大警報卡，所以只會看見首頁常駐的行程按鈕、交通方式選擇和官方來源入口；上一輪顏色只套用於「有重大事件時出現」的事故卡圖示，沒有覆蓋這些常駐控制。這解釋了使用者看到黑白圖示的原因，並非發布失敗。

## 本次修正

- Pages 首頁三個官方入口圖示改為分類色 chip：運輸署道路＝橙、港鐵＝藍、天文台＝青綠；另有淡色底和細色框。
- 展開行程規劃後，駕車／公共交通／步行選項各自顯示汽車橙／列車藍／步行青綠圖示；選中模式以深綠底配淺色同類 icon，維持辨識度。
- Server 版手機快速導覽加入警報青綠、交通橙、天氣藍、更多紫色圖示。
- 圖示旁已有文字標籤，因此 SVG 設為裝飾用途，避免無障礙名稱重複；顏色只作視覺輔助。

## 主要檔案

- `client/src/pages/StaticHome.tsx`
- `client/src/pages/Home.tsx`
- `client/src/index.css`
- `reports/assets/interface-icons-preview-375.png`

## 驗證

- `pnpm test` — 8 個測試檔、71 項測試通過。
- `pnpm check` — TypeScript 型別檢查通過。
- `pnpm pages:build` — 通過。
- `pnpm build` — Server web 與 server bundle 通過。
- `git diff --check` — 通過。
- Playwright／Chromium 375 × 812 手機預覽：三個官方來源 icon、三種出行方式 icon 均有顏色；文件寬度等於 viewport 375px，沒有水平溢位。
- Server 版 375 × 812 預覽：手機底部警報／交通／天氣／更多四個 icon 的 computed style 為青綠／橙／藍／紫，四個入口均在畫面內可見。
- source icon 對比率（前景／淡色底）：道路 4.73:1、鐵路 6.16:1、天氣 5.26:1；行程未選中 icon 對比率至少 4.43:1，選中圖示 5.55:1–6.31:1。
- GitHub Pages Actions run [36373869213](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36373869213) 成功；公開 JS／CSS asset 回應 HTTP 200。
- 正式網站 browser computed style 已核實道路／鐵路／天氣入口的橙／藍／青綠底色和 icon；駕車／公共交通／步行 icon 為橙／淺藍／青綠。
- 預覽截圖：[`assets/interface-icons-preview-375.png`](assets/interface-icons-preview-375.png)。
- Server 手機導覽截圖：[`assets/server-mobile-navigation-preview-375.png`](assets/server-mobile-navigation-preview-375.png)。

## 發布狀態及下一步

- 使用者已明確要求顏色改善完成後發布；PR #23 已合併至 `main` commit `640b354060a3637aab61a620f0da17011b91ba0b`。
- GitHub Pages 已更新至 `gh-pages` commit `deab64efe92a98c94d52c91716564a340b191c86`；workflow 成功，公開頁目前載入 `index-CZWRhGAG.js`／`index-Dr0yaiPE.css`。
- 正式網址：<https://cw91020251212.github.io/hk-traffic-alert/>。

## 安全回復

若發布後需要撤回，先 revert 本次程式碼 PR，重新建立 Pages 靜態 build，再發布前一版；勿只改 `gh-pages` 而不回復原始碼。
