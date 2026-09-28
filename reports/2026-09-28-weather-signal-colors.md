# 事故分類圖示、暴雨及風球信號加色

- 日期（香港時間）：2026-09-28
- 狀態：實作及本機驗證完成；PR #22 已開啟，尚未合併；**公開網站未發布**
- 分支：`feat/incident-icon-colors`
- 主線基線：`7453243abcf9d0ebdce7476d50cb81658dfeb9c9`（開始本次修改時的 `main`）
- 相關 PR：[PR #22](https://github.com/cw91020251212/hk-traffic-alert/pull/22)（Open）
- 功能 commit：`eb0429099a88366a8ef9ecfd6bc460ef1d2e8366`；畸形 subtype 防護：`9b837398e2e4949544e728c33e4e7c2025afdac9`
- 部署 commit：無

## 使用者目標

使用者補充，除暴雨和風球信號外，道路、鐵路、一般天氣、地震等其他事故分類圖示也應有清楚顏色，不要看起來黑白單調。並已明確要求完成後發布公開網站。

## 完成內容

- 保留天氣警報的 `warningCode`／`warningSubtype`，使 UI 可根據香港天文台訊號識別警告類別，而非從自由文字猜測。
- 將道路、鐵路、一般天氣、地震圖示強化為橙、藍、青綠、紫色前景，配淡色底及細色框；圖示使用原有 Lucide 向量，不靠顏色替代警報文字。
- 暴雨 `WRAINY`／`WRAINR`／`WRAINB` 分別顯示黃雨、紅雨、黑雨 chip 及雲雨圖示。
- 熱帶氣旋 `TC1`／`TC3`／`TC8`／`TC9`／`TC10` 顯示風圖示及號碼；八號信號保留東北／西北／東南／西南方向文字。
- 雨警 chip 使用對應警告色；風球藍／黃／橙／紅／深色 chip 是本產品自行採用的視覺分級，**不是天文台官方色標**。顏色只供快速辨識，正式信號級別仍以號碼與中文文字為準。
- 未識別／取消的 signal 不推測顏色，退回一般天氣分類圖示；八號只接受 NE／NW／SE／SW 四個方向，其他格式或方向不輸出錯誤標籤。
- badge 使用 Lucide 本地 SVG、繁體中文 `aria-label` 和說明 tooltip；非顏色資訊（雨警／風球號碼與標題）亦會直接顯示。
- 主要檔案：`client/src/components/PriorityAlertIcon.tsx`、`client/src/lib/priorityAlertVisuals.ts`、`client/src/index.css`、`client/src/pages/Home.tsx`、`client/src/pages/StaticHome.tsx`、`server/transportData.ts`。
- 加入 code mapping、四個八號方向、未知／畸形 subtype、元件輸出和 transport alert metadata 測試。

## 驗證結果

- `pnpm test` — **8 個測試檔、71 項測試全數通過**。
- `pnpm check` — TypeScript 型別檢查通過。
- `pnpm pages:build` — GitHub Pages 靜態版本建置通過。
- `pnpm build` — Server web build 與 `server/_core/index.ts` bundle 通過。
- `git diff --check` — 通過。
- PR 檢查：建立後查詢為「no checks reported」；沒有 GitHub CI 結果可報告，以上本機驗證不等同 CI。
- 顏色文字對比計算（正常文字，WCAG AA 4.5:1 參考）：雨黃 9.07:1、雨紅 6.52:1、雨黑 14.67:1；風球 1 號 6.40:1、3 號 9.40:1、8 號 7.38:1、9 號 6.82:1、10 號 14.67:1。全部超過 4.5:1。
- 分類圖示顏色對比：道路 4.73:1、鐵路 6.16:1、天氣 5.26:1、地震 6.51:1；均高於 4.5:1。
- 手機視覺驗收：使用實際 React renderer 和 Pages CSS，於 Chromium **375 × 812** 本機預覽顯示三色暴雨警告及 1／3／8／9／10 號風球共八張示意卡；方向／正式文字清楚保留，未見卡片水平裁切。截圖：[`assets/weather-signals-preview-375.png`](assets/weather-signals-preview-375.png)。
- 同一 375 × 812 裝置尺寸檢查四個一般事故分類圖示；橙／藍／青綠／紫辨識明確，卡片無裁切。截圖：[`assets/category-icons-preview-375.png`](assets/category-icons-preview-375.png)。
- 預覽為本機示意卡，並非聲稱天文台當時正發布全部這些警告。

## 發布與交付

- 目標環境／分支：目前是 GitHub branch `feat/incident-icon-colors`；公開 Pages branch `gh-pages` 不變。
- 發布 commit：無。
- 使用者可見網址：正式網站 <https://cw91020251212.github.io/hk-traffic-alert/> 保持既有版本；此次程式碼**尚未發布**。
- 狀態：PR #22 已推送／開啟，尚未合併；公開部署未發布，須先取得使用者明確確認。

## 未完成事項與限制

- PR #22 審查／合併尚未完成；不得把未合併內容描述成主線已完成。
- 公開站部署尚未進行；即使 PR 合併，仍要等使用者明確同意才可更新 `gh-pages`。
- 此次手機畫面是信號元件示意，不取代正式網站端到端 feed 的現場警報資料驗證。

## 下一步／回復方式

- 檢視及處理 PR #22；若之後要發布到公開 Pages，須另外取得使用者明確確認。不得在本項工作中部署公開站。
- 若需回復程式碼，在 PR 內要求更改或撤回相關 commit；公開 Pages 尚未更改，毋須回復網站。

## 安全與資料注意事項

- 未新增 API 權限、憑證或外部圖片下載；預覽伺服器僅供本次 QA，完成後關閉。
- HKO 官方訊號文字及編號為最終依據；熱帶氣旋 chip 顏色僅是本產品的視覺輔助，不代表天文台官方色標。

## 官方依據

- 香港天文台：[Rainstorm Warning System](https://www.hko.gov.hk/en/wservice/warning/rainstor.htm) — 列出 Amber、Red、Black 三級暴雨警告。
- 香港天文台：[The Tropical Cyclone Warning System in Hong Kong](https://www.hko.gov.hk/en/education/weather/weather-warnings/00054-the-tropical-cyclone-warning-system-in-hong-kong.html) 及 [Tropical Cyclone Warning Signals](https://www.hko.gov.hk/en/wxinfo/climat/warndb/warndb1.shtml) — 說明數字信號及八號方向代碼；風球 chip 色彩不冒充官方色標。
