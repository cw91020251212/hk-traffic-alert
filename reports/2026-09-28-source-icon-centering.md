# 官方來源入口圖示置中修正

- 日期（香港時間）：2026-09-28
- 狀態：**[PR #26 已合併並發布到公開 GitHub Pages](https://github.com/cw91020251212/hk-traffic-alert/pull/26)**；部署 workflow 成功，公開手機畫面實測通過。
- 分支：`fix/center-source-link-icons`
- 修正 commit：`b42983bd0580bab0d0a240be0ee4af654d55ecf9`；merge commit：`48da40c7ed36d93e4abb8fe049bdfeb170fce029`。
- Pages commit：`eacdae362d635648c66c20de4249be3f5c75b585`；workflow [#36413603189 成功](https://github.com/cw91020251212/hk-traffic-alert/actions/runs/36413603189)。

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
- 公開頁 live 375×812 實測亦確認三個中心差為 0×0px、右側箭頭留白 13px、無水平溢位；[live 驗收截圖](./assets/source-icons-live-centered-375.png)。

## 發布界線

- PR #26 已在使用者明確批准後合併；從合併版 main `48da40c7ed36d93e4abb8fe049bdfeb170fce029` 重建，再以 Pages commit `eacdae362d635648c66c20de4249be3f5c75b585` 發布。
- Pages workflow #36413603189 成功；公開 HTML 載入 `index-CGYbP6S9.js` 和 `index-DuqCFk-i.css`，兩者 HTTP 200；公開 CSS 已包含直接子元素限定規則。
- 公開網站：<https://cw91020251212.github.io/hk-traffic-alert/>。
