# 官方資料來源列：手機整列點擊修正

- 日期（香港時間）：2026-09-27
- 狀態：程式修正及驗證完成；已合併，公開發布待確認
- 分支：`fix/source-health-row-tap-target`
- 相關 PR：[PR #3](https://github.com/cw91020251212/hk-traffic-alert/pull/3)，已 squash merge
- 合併 commit：`a79dde4d1c1095064728e8a158c34e7afc909716`
- 相關使用者回報：手機版紅圈中的港鐵資料列「按下冇反應」

## 使用者目標

了解圈住的三條港鐵 Next Train 列是甚麼，並解決在手機點按時感覺沒有反應的問題。

## 問題與修正

舊版每行只有右側約 28×28px 的「↗」按鈕是 `<a>` 連結；來源名稱、綠點、可讀取狀態和檢查時間都是非互動文字。手機上直接按文字自然不會開啟內容，箭頭亦偏小。三列分別是金鐘站東鐵綫、港島綫及南港島綫 Next Train 官方即時資料端點；綠點／狀態文字是讀取狀態，不是按鈕。

修正後，每個來源列以單一 `<a>` 包住狀態、名稱、檢查時間和箭頭，任何位置均開啟該官方資料的新分頁。整列觸控高度至少 50px，箭頭按鈕視覺區加大至 36×36px，新增 hover／keyboard focus-visible 狀態、正確可存取名稱，以及「點按任何來源列可開啟其官方資料」的說明。保留 `target="_blank"`，避免使用者離開警報頁。

主要檔案：`client/src/pages/StaticHome.tsx`、`client/src/index.css`、`README.md`、`todo.md`、`HANDOFF_AI_SUMMARY.md` 和本報告。

## 驗證結果

- `pnpm test` — 5 個 test files，41 項測試通過。
- `pnpm check` — TypeScript 檢查通過。
- `pnpm pages:build` — Pages build 成功。
- 瀏覽器檢查 7 個來源列：每列連結均為正確官方 URL、開新分頁、包含可存取名稱；每列約 53px 高，連結高 52px，連結左右邊界與來源列對齊。
- 本機預覽實際顯示 7 列來源及新增提示文字；包含港鐵三線資料列。

## 合併與發布狀態

修正已透過 [PR #3](https://github.com/cw91020251212/hk-traffic-alert/pull/3) 合併至 `main`（commit `a79dde4d1c1095064728e8a158c34e7afc909716`），但尚未推送新的 `gh-pages` build。正式網站 https://cw91020251212.github.io/hk-traffic-alert/ 仍使用上一版，因此目前手機可能仍只有右側箭頭點擊有效。公開 Pages 是廣泛受眾可見的網站；發布本次修正前須先取得使用者明確確認。

## 下一步與回復方式

取得發布確認後，從合併後 `main` 執行 `pnpm pages:build` 並以正常 Git commit 更新 `gh-pages`，實際確認正式網站七列都可點。若有回歸，以 revert commit 回復造成此修正的變更，不使用 force-push。

## 安全與資料注意事項

所有來源列只指向既有公開官方資料網址；不涉及使用者帳戶、敏感資料或新增資料收集。
