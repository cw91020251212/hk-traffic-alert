import type { PriorityAlert } from "../../../server/transportData";
import type { RouteArea, RouteMode } from "./routePlanner";

export type DecisionTone = "loading" | "clear" | "watch" | "high" | "critical" | "unknown";

export type JourneyDecision = {
  tone: DecisionTone;
  kicker: string;
  title: string;
  detail: string;
  action: string;
};

const AREA_TERMS: Record<RouteArea, string[]> = {
  港島: ["港島", "中環", "金鐘", "灣仔", "銅鑼灣", "天后", "北角", "鰂魚涌", "太古", "西灣河", "筲箕灣", "柴灣", "香港仔", "黃竹坑", "薄扶林", "西營盤", "上環", "堅尼地城"],
  九龍: ["九龍", "尖沙咀", "佐敦", "油麻地", "旺角", "太子", "深水埗", "長沙灣", "荔枝角", "紅磡", "何文田", "土瓜灣", "啟德", "九龍灣", "觀塘", "藍田", "黃大仙", "鑽石山"],
  "新界／離島": ["新界", "沙田", "大圍", "火炭", "馬場", "大學", "中文大學", "大埔", "大埔墟", "粉嶺", "上水", "元朗", "天水圍", "屯門", "荃灣", "葵芳", "葵興", "青衣", "將軍澳", "西貢", "東涌", "機場", "迪士尼", "離島", "長洲", "坪洲", "南丫島"],
};

export function inferRouteAreas(...places: string[]): RouteArea[] {
  const value = places.join(" ").trim().toLowerCase();
  if (!value) return [];
  return (Object.entries(AREA_TERMS) as Array<[RouteArea, string[]]>)
    .filter(([, terms]) => terms.some((term) => value.includes(term.toLowerCase())))
    .map(([area]) => area);
}

export function getJourneyDecision(
  alerts: PriorityAlert[],
  options: { loading?: boolean; degraded?: boolean; routeReady?: boolean } = {},
): JourneyDecision {
  if (options.loading) {
    return { tone: "loading", kicker: "正在核對官方資料", title: "等一等，正在判斷。", detail: "正檢查道路、港鐵及生效中的天氣警告。", action: "正在更新" };
  }

  const top = alerts[0];
  if (top?.level === "critical") {
    return { tone: "critical", kicker: "需要立即留意", title: "建議改路或延後出發。", detail: top.title, action: "查看受影響事項" };
  }
  if (top?.level === "high") {
    return { tone: "high", kicker: "行程可能受影響", title: "建議預留時間。", detail: top.title, action: "查看影響" };
  }
  if (top) {
    return { tone: "watch", kicker: "可以出發，但要留意", title: "暫時毋須改路。", detail: top.title, action: "查看提醒" };
  }
  if (options.degraded) {
    return { tone: "unknown", kicker: "未能完整確認", title: "出發前請再核對一次。", detail: "部分官方來源暫時未能讀取，現時沒有足夠資料判斷。", action: "重新檢查" };
  }
  return {
    tone: "clear",
    kicker: options.routeReady ? "這程暫未見重大影響" : "全港重大警報",
    title: "暫時可以照常出發。",
    detail: options.routeReady ? "目前未找到與所選行程相關、達到警報門檻的事件。" : "目前沒有已核實、需要改路的重大事件。",
    action: options.routeReady ? "開啟路線" : "設定我的行程",
  };
}

export function modeLabel(mode: RouteMode) {
  return mode === "driving" ? "駕車" : mode === "transit" ? "公共交通" : "步行";
}
