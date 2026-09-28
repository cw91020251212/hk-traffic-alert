# 手機頁首品牌標題放大

- 日期（香港時間）：2026-09-28
- 狀態：已合併及發布；[PR #27](https://github.com/cw91020251212/hk-traffic-alert/pull/27) 已合併。
- 程式 commit：`b934d2b3e9430946a3537a2c9d829ae888d6b633`；main merge commit：`397b151647b7b01cd4b1d6145f3df95df380ddc1`。
- GitHub Pages 部署 commit：`0ad625dae42c29242cd67c28bae64ca8a2748b68`；工作流程 [#36416381354](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36416381354) 成功。
- 影響：公開 Pages 首頁和 Server 應用共用 `.brand-copy` header 樣式。

## 使用者回報及原因

使用者在手機頁首選了「特大」，但圈出的「交通警報器」標題仍細。原本 mobile breakpoint 在 `.brand-copy strong` 寫死 `font-size:14px`，而 `pages-text-large`／`pages-text-xlarge` 只覆寫正文、警報卡、路線欄位等，沒有覆寫品牌標題和副標；所以切換文字大小時頁首看起來沒有跟著放大。

## 修正

- Desktop 品牌標題由 16px 增至 18px，副標由 8px 增至 9px。
- 手機標題／副標跟隨文字大小：標準 `22/11px`、大 `26/12px`、特大 `30/14px`。
- 手機 logo tile 調整為 40×40px，內部閃電圖示 24×24px；頁首最少高度 66px。
- 320px 以下收窄頁首內距與文字大小按鈕，減少窄螢幕擠壓。

## 驗證

- `pnpm test`：10 files／88 tests 通過。
- `pnpm check`、`pnpm pages:build`、`pnpm build`、`git diff --check` 通過。
- Playwright 在 320、344、360、375、390、430px 檢查標題與文字大小按鈕沒有重疊，文件沒有橫向溢位。
- 驗證標題模式實際為 22px／26px／30px，副標為 11px／12px／14px。
- 375px「特大」模式截圖：[header-brand-large-375.png](./assets/header-brand-large-375.png)。
- 公開頁面 Playwright 實測 375px：「特大」標題 `30px`、副標 `14px`、右側按鈕間距 71.5px，沒有水平溢位；最新[公開頁截圖](./assets/header-brand-live-375.png)。HTML 載入新 JS/CSS，兩項資產均 HTTP 200。

## 發布界線

使用者已確認發布。公開網址：[Hong Kong Traffic Alert](https://cw91020251212.github.io/hk-traffic-alert/)。截至本報告記錄，Pages 已載入 30px 特大標題版本。
