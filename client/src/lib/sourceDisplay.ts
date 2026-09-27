const FRIENDLY_SOURCE_NAMES: Record<string, string> = {
  "td-traffic": "運輸署交通消息",
  "hko-warning": "天文台天氣警告",
  "hko-earthquake-quick": "天文台地震速報",
  "hko-earthquake-felt": "天文台有感地震報告",
  "mtr-eal": "港鐵金鐘站・東鐵綫班次資料",
  "mtr-isl": "港鐵金鐘站・港島綫班次資料",
  "mtr-sil": "港鐵金鐘站・南港島綫班次資料",
};

export const SOURCE_DISPLAY_ORDER = [
  "td-traffic",
  "hko-warning",
  "hko-earthquake-quick",
  "hko-earthquake-felt",
  "mtr-eal",
  "mtr-isl",
  "mtr-sil",
] as const;

/** Keep the status lights and their expanded detail rows in the same stable order. */
export function orderSourceItems<T extends { id: string }>(items: T[]): T[] {
  const rank = new Map<string, number>(SOURCE_DISPLAY_ORDER.map((id, index) => [id, index]));
  return [...items].sort((a, b) => (rank.get(a.id) ?? rank.size) - (rank.get(b.id) ?? rank.size));
}

/** Return a plain-language label without exposing API names, URLs, or source ids. */
export function getSourceDisplayName(sourceId: string): string {
  return FRIENDLY_SOURCE_NAMES[sourceId] ?? "其他官方交通資料";
}

export type SourceIndicatorState = "success" | "failure" | "unknown";

/** Convert transport-fetch status into a stable, accessible light state. */
export function getSourceIndicatorState(status?: string): SourceIndicatorState {
  if (status === "ok") return "success";
  if (status === "unavailable") return "failure";
  return "unknown";
}

export function getSourceIndicatorLabel(state: SourceIndicatorState): string {
  if (state === "success") return "成功讀取";
  if (state === "failure") return "讀取失敗";
  return "未能確認";
}

export function countSourceIndicators(states: SourceIndicatorState[]) {
  return states.reduce((counts, state) => {
    counts[state] += 1;
    return counts;
  }, { success: 0, failure: 0, unknown: 0 });
}
