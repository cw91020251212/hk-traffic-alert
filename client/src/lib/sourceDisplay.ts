const FRIENDLY_SOURCE_NAMES: Record<string, string> = {
  "td-traffic": "運輸署交通消息",
  "hko-warning": "天文台天氣警告",
  "hko-earthquake-quick": "天文台地震速報",
  "hko-earthquake-felt": "天文台有感地震報告",
  "mtr-eal": "港鐵金鐘站・東鐵綫班次資料",
  "mtr-isl": "港鐵金鐘站・港島綫班次資料",
  "mtr-sil": "港鐵金鐘站・南港島綫班次資料",
};

/** Return a plain-language label without exposing API names, URLs, or source ids. */
export function getSourceDisplayName(sourceId: string): string {
  return FRIENDLY_SOURCE_NAMES[sourceId] ?? "其他官方交通資料";
}
