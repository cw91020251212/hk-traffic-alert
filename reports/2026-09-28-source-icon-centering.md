# 官方來源入口圖示置中修正

- 日期（香港時間）：2026-09-28
- 狀態：CSS 修正及本機手機 QA 完成；待 PR／合併／公開更新。
- 分支：`fix/center-source-link-icons`
- 本次不包含 Pages 部署；上一個已發布版本的外層箭頭選擇器缺陷由這份後續修正處理。

## 使用者觀察與根因

使用者提供公開網站手機截圖，指出運輸署、港鐵及天文台入口左邊彩色小圖示並非置中。

原本的 CSS 選擇器 `.quick-detail-links a svg:last-child` 意圖把最右側「外部連結」箭頭推到按鈕右邊，但它也匹配了巢狀 icon chip 內的 SVG（它亦是其包裝元素最後一個子節點）。由於 chip 是固定大小的 CSS grid，SVG 的 `margin-left:auto` 破壞 `place-items:center` 的置中效果，令圖案向右偏移。button 版本有相同的廣泛選擇器。

## 修正

把箭頭規則收窄為 `.quick-detail-links a > svg:last-child` 及 `.quick-detail-links button > svg:last-child`，只作用於 link/button 的直接子元素。內層分類 icon 不再命中自動左 margin，仍由 26×26 icon chip 的 grid 置中。

## 驗證

- `pnpm test`：10 個 test files／88 項通過。
- `pnpm check`、`pnpm pages:build`、`pnpm build`、`git diff --check`：全部通過。
- Playwright 375×812 實測道路、鐵路、天氣三個 SVG 的相對 chip 中心差 `dx=0px, dy=0px`；外側連結箭頭右方留白 13px；文件寬度 375px、無水平溢位。
- 手機截圖：[source-icons-centered-375.png](./assets/source-icons-centered-375.png)。

## 發布界線

- 這是針對截圖中新發現的 UI bug 的獨立後續修正；目前尚未推送／合併此修正，也未把它發布到 `gh-pages`。
- 先前更新刷新按鈕的 Pages 部署 workflow #36412068254 成功；公開 HTML 正載入刷新按鈕 bundle `index-vH88dwkP.js` 及 CSS `index-h2S6oUv9.css`，兩者 HTTP 200。但上述 icon-centering selector 修正是在那次部署之後修改的。
- 若要將置中修正一起更新至公開站，先建立 PR，並在得到這項新修正的明確發布確認後，從合併版 main 重建及發布。
