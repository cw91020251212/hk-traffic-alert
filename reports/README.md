# AI／開發工作報告

本目錄保存每項已完成工作（或需要跨 AI 接手的中斷工作），讓其他 AI／公司同事可從 GitHub 查到背景、決策、驗證與交付狀態。

## 強制流程

1. 每項工作完成後建立一份 `YYYY-MM-DD-主題.md`，例如 `2026-09-27-official-source-health-panel.md`。
2. 複製 [`TEMPLATE.md`](TEMPLATE.md)，記錄使用者目標、完成範圍、主要檔案／技術決策、測試結果、PR／commit／部署網址、尚未完成事項和下一步。簡單工作可精簡，但不得把未做的檢查寫成已通過。
3. 報告必須與程式碼／文件變更一同提交至 GitHub（一般走同一 PR；若工作只有報告，依使用者授權及 repo 慣例提交），並確認遠端已保存。僅存在本機或未合併的 PR，不算完成備份。
4. 工作被中斷時，先記錄已做、未做、目前分支／PR、驗證狀態及接續步驟；恢復後補上最後結果。
5. 每項工作完成時更新 `HANDOFF_AI_SUMMARY.md`；持續性待辦亦同步更新 `todo.md`。重大新決策可再更新 `開發說明.md` 或相應規格文件。

## 報告內容要求

- 以繁體中文撰寫，技術名稱／CLI 命令可用英文。
- 區分 **完成、未完成、半完成**；列出具體檔案、測試命令和結果。
- 部署必須提供目標環境、GitHub Pages／服務網址及部署 commit；沒有部署就明確寫「未發布」。
- 說明限制、已知風險和安全的回復方式；不要留下空泛的「已處理」。
- **禁止**寫入 API key、OAuth token、密碼、Cookie、使用者個人資料或未公開憑證。

## 本目錄內容

- [`2026-09-27-official-source-health-panel.md`](2026-09-27-official-source-health-panel.md) — 官方資料來源狀態面板：功能、測試、PR 合併及 GitHub Pages 發布結果。
- [`2026-09-27-source-health-mobile-tap-target.md`](2026-09-27-source-health-mobile-tap-target.md) — 整列來源連結修正、行動版觸控驗收及發布狀態。
- [`2026-09-28-source-health-diagnostic-ux.md`](2026-09-28-source-health-diagnostic-ux.md) — 撤回對一般用戶不友善的 raw API 跳轉，改為易讀的連線診斷（待發布狀態依報告記錄）。
- [`TEMPLATE.md`](TEMPLATE.md) — 後續每項工作的報告範本。
