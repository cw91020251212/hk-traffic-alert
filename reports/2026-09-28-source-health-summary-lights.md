# 資料來源摘要列：七粒狀態燈

- 日期（香港時間）：2026-09-28
- 狀態：程式修改、驗證及 main 合併完成；公開 Pages 發布待使用者確認
- 分支：`feat/source-health-summary-lights`
- 相關 PR：[PR #9](https://github.com/cw91020251212/hk-traffic-alert/pull/9)，已合併
- main 合併 commit：`ac3ad6566063fb9cb691b92877a7584e1ac02f5a`
- 相關功能：[易讀來源診斷報告](2026-09-28-source-health-diagnostic-ux.md)
- 使用者需求：在第一行直接看到七個來源是否成功；全部正常便無需展開，有異常才點開檢查。

## 設計決策

- 收合的「資料連線檢查」摘要顯示固定七格，次序與展開清單一一相同。
- 綠色＝成功讀取；紅色＝讀取失敗；灰色＝狀態未能確認。摘要文字同時顯示成功／異常數量，避免只靠顏色辨認。
- 燈號有可存取標籤；每個資料列仍有文字狀態，兼顧色覺差異及螢幕閱讀器。
- 展開後保留來源名稱和檢查時間；資料源排序必須與燈號相同，讓使用者能判斷是哪一格異常。
- 不更改 API 讀取、官方來源、警報規則或行程功能。

## 驗證

新增 mapping／sorting tests 檢查成功、失敗、未知狀態的燈色文字及固定排序。

- `pnpm test` — 6 個 test files，49 項測試通過。
- `pnpm check` — TypeScript 檢查通過。
- `pnpm pages:build` — 正式 Pages build 成功。
- 本機 Browser 確認資料載入後有 7 粒綠燈及 7 項成功摘要。展開後七個燈的中文來源名與七列來源順序完全一致；清單內無 raw API 外連。
- 375px iframe 手機視窗檢查：viewport width 375px、layout client width 360px；收合和展開狀態 `scrollWidth === clientWidth`，沒有水平溢位，七燈容器寬 94px。標準／大／特大三種字級均無水平溢位。
- Browser 量度成功／失敗／未知燈實際色值分別為綠 `rgb(79, 154, 113)`、紅 `rgb(205, 104, 87)`、灰 `rgb(174, 184, 178)`。有「讀取失敗／未能確認」文字及每燈 aria-label，不單靠色彩辨識。

正式網站目前仍為 `gh-pages` `bc42bc8` 易讀診斷版；PR #9 已將七燈程式合併至 `main`，但尚未更新公開 Pages。發布公開首頁前先取得使用者確認。

## 預計 GitHub 操作

本次程式以 [PR #9](https://github.com/cw91020251212/hk-traffic-alert/pull/9) 合併至 `main` commit `ac3ad6566063fb9cb691b92877a7584e1ac02f5a`。此報告另經文件 PR 備份。公開 Pages 尚未更新；收到使用者確認後才從最新 `main` 建置部署，並在線上核對七粒燈／列表同序、紅灰異常提示、警報卡與易讀官方入口。
