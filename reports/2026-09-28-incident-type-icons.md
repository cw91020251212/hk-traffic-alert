# 事故警報卡加入分類圖示

- 日期（香港時間）：2026-09-28
- 狀態：實作及驗證完成；PR 待完成，公開 Pages 尚未發布
- 分支：`feat/incident-type-icons`
- 主線基線：`f3fb150512d010a45e934fb4681faedaf0b386a6`
- 相關 PR：待建立

## 使用者需求

使用者同意在現有事故文字以外加上合適圖示；若沒有適合圖示則考慮預先製作。偏好在討論中確定：先按道路、鐵路、天氣、地震固定分類使用圖示，不逐宗事故臨時生成圖片。

## 修改

- 新增固定 mapping：道路＝`CarFront`、鐵路＝`TrainFront`、天氣＝`CloudLightning`、地震＝`Activity`（震波／活動線）。
- 新增共用 `PriorityAlertIcon` 元件，套用於 GitHub Pages `StaticHome` 與 Server `Home` 警報卡標題旁。
- 對應顏色用作輔助分類；每個圖示另附中文 `aria-label`，事故細節仍由官方文字提供，不以圖示替代警報內容。
- 使用專案已安裝的 `lucide-react` 本地 SVG 元件，無外部圖片依賴，也無需每次下載或生成素材。
- 新增 mapping 和元件單元測試。

## 驗證

- `pnpm test`：8 個測試檔／54 項通過；包含四類 mapping、元件 SVG 輸出、顏色 class 及中文 aria-label 測試。
- `pnpm check`、`pnpm pages:build`、`pnpm build` 全部通過。
- Desktop 與 375px browser preview：4 張代表性警報卡均顯示預期 Lucide SVG 和中文分類；375px 頁寬維持 375px，4 個標題 scrollWidth 均不大於 clientWidth，沒有橫向溢位。
- 驗收為本機示意卡視覺測試，不代表真實事故 feed 當時剛好同時有四種類型。

## 發布狀態與下一步

- 公開 GitHub Pages 尚未更新；目前只是本機 build 預覽。
- 下一步：建立並合併程式 PR；更新所有訪客可見的 Pages 前需另行確認。
- 後續 AI 請以本報告及 `HANDOFF_AI_SUMMARY.md` 為準，不要將尚未部署說成已上線。
