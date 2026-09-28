export type RefreshFeedback = {
  kind: "success" | "partial" | "error";
  message: string;
};

export async function keepRefreshVisible<T>(request: Promise<T>, minimumMs = 650): Promise<T> {
  const startedAt = Date.now();
  let result: T | undefined;
  let didFail = false;
  let failure: unknown;
  try {
    result = await request;
  } catch (error) {
    didFail = true;
    failure = error;
  }
  const remaining = minimumMs - (Date.now() - startedAt);
  if (remaining > 0) await new Promise<void>((resolve) => setTimeout(resolve, remaining));
  if (didFail) throw failure;
  return result as T;
}

type RefreshSourceStatus = { status: "ok" | "unavailable" };

function formatHktTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function makeRefreshFeedback(sources: readonly RefreshSourceStatus[], checkedAt?: string): RefreshFeedback {
  const failed = sources.filter((source) => source.status === "unavailable").length;
  const time = formatHktTime(checkedAt);
  const suffix = time ? ` · ${time} HKT` : "";
  if (sources.length === 0) {
    return { kind: "partial", message: `未能確認資料來源狀態${suffix}` };
  }
  if (failed > 0) {
    return { kind: "partial", message: `${failed} 項來源未能讀取${suffix}` };
  }
  return { kind: "success", message: `已重新檢查官方資料${suffix}` };
}

export function makeRefreshErrorFeedback(): RefreshFeedback {
  return { kind: "error", message: "更新失敗，保留舊資料" };
}
