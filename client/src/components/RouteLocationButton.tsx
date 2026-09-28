import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { formatGpsOrigin } from "@/lib/routePlanner";

type Props = { onLocate: (origin: string) => void };

export function locationErrorMessage(code: number): string {
  if (code === 1) return "你未批准定位；可以手動輸入起點。";
  if (code === 3) return "定位逾時；可以重試或手動輸入起點。";
  return "裝置暫時無法定位；可以重試或手動輸入起點。";
}

export function RouteLocationButton({ onLocate }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setMessage("此瀏覽器不支援定位，請手動輸入起點。");
      return;
    }
    setBusy(true);
    setMessage("正在向裝置要求目前位置…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin = formatGpsOrigin(coords.latitude, coords.longitude);
        setBusy(false);
        if (!origin) {
          setMessage("未能讀取有效座標，請手動輸入起點。");
          return;
        }
        onLocate(origin);
        const accuracy = Number.isFinite(coords.accuracy) && coords.accuracy > 0 ? `裝置估算精度約 ±${Math.round(coords.accuracy)} 米；` : "";
        setMessage(`已填入目前位置；${accuracy}按「檢查這程」才會作地區提示。程式不會背景追蹤。`);
      },
      (error) => {
        setBusy(false);
        setMessage(locationErrorMessage(error.code));
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  return <span className="route-location-control">
    <button type="button" className="route-location-button" onClick={requestLocation} disabled={busy}>
      <LocateFixed size={14} aria-hidden="true" /> {busy ? "定位中…" : "用目前位置作起點"}
    </button>
    <span className="route-location-status" role="status" aria-live="polite">{message}</span>
  </span>;
}
