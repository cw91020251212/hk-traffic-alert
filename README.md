# 交通警報器（香港）

**現階段：** 手機優先的 alert-first Web App 原型。這是一份持續開發中的工程專案，不要只看 README 就假設所有 TODO 已完成。

## 新接手 AI／開發者的閱讀次序

1. [`todo.md`](todo.md) — 已完成、明確未完成、每階段驗證結果。
2. [`工程交接報告.md`](工程交接報告.md) — 架構、實作決定、目前狀態、具體下一步。
3. [`開發說明.md`](開發說明.md) — 開發方式、手機規範、路由、測試與跨 AI 交接要求。
4. [`產品方向與警報規則.md`](產品方向與警報規則.md) — 產品目的、警報層級與什麼不應觸發警報。
5. [`DATA_SOURCES.md`](DATA_SOURCES.md)、[`政府公告與警報選項.md`](政府公告與警報選項.md) — 官方資料來源和限制。

**每次開發完成或被中斷時都要更新上述 handoff 文件，明確記錄已完成、未完成、半完成、驗證和下一步；不要把查到資料誤標為已接入，也不要讓第二、第三位 AI 重頭做或以為完成。**

## 目前功能摘要

- 首屏只凸顯符合原型門檻的交通／天氣／地震警報；普通天氣、AQHI 和常規 ETA 收合於詳情。
- 按警報類型／地區篩選，清楚分開「無符合門檻事件」和「官方來源不可用」。
- 道路：運輸署交通消息；吐露港走廊雙向路線平均車速試點，不是全港逐路段車速矩陣。
- 鐵路：金鐘三線 ETA 與 `isdelay`；巴士、小巴、渡輪為指定示範站／線路。
- 天氣與環境：天文台警告、天氣現況與九日預報、環保署 AQHI。
- A→B 路線：駕車／公共交通／步行，透過 Google Maps 官方 URL 及 HKeMobility 官方連結查路線；按使用者手選地區列出可能相關的官方警報。最多五條常用路線保存在此瀏覽器。

**A→B alert matching 不是精確地圖避障：**本站沒有 Google Maps route geometry，也不會自動判斷事故是否在該路線上；使用者須手選途經地區。普通預報／ETA 不應當成警報。本原型亦沒有背景監察、推播、PWA icon 或 app manifest；逐項查看 `todo.md`。

## 開發與測試

專案目錄：`/home/ubuntu/hk-traffic-alert`

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build
```

最近驗證為 36 項測試通過、TypeScript 檢查通過、正式 build 成功。若在一般 Node 環境啟動 Manus 模板，OAuth／DB 等平台整合要用正式環境 secrets；**不要將 `.env`、token 或使用者憑證放入 GitHub／交接 ZIP**。

## 預覽

目前預覽：<https://3000-ih1j11rgdevjk1295tsun-ba280051.sg2.manus.computer>。可複製連結於手機或桌面開啟；這是沙盒開發預覽，不是保證長期可用的 production hostname。
