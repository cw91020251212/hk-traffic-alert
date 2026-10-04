import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MapPin, MapPinned, Search, TriangleAlert } from "lucide-react";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  buildGoogleMapsSearchUrl,
  buildOpenFreeMapUrl,
  isValidMapCoordinate,
  officialCoordinatePoint,
  searchIncidentPlace,
  type IncidentMapPoint,
} from "@/lib/incidentMap";

type IncidentLocationMapProps = {
  label: string;
  searchQuery?: string;
  latitude?: number;
  longitude?: number;
  noLocationMessage?: string;
};

function MapView({ point }: { point: IncidentMapPoint }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;
    let marker: import("maplibre-gl").Marker | undefined;

    void import("maplibre-gl").then(({ Map, Marker, NavigationControl, setWorkerUrl }) => {
      if (disposed || !containerRef.current) return;
      setWorkerUrl(maplibreWorkerUrl);
      map = new Map({
        container: containerRef.current,
        style: buildOpenFreeMapUrl(),
        center: [point.longitude, point.latitude],
        zoom: 15,
        cooperativeGestures: true,
      });
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      const markerElement = document.createElement("div");
      markerElement.className = `incident-map-marker ${point.precision === "official-coordinate" ? "official" : "reference"}`;
      markerElement.setAttribute("role", "img");
      markerElement.setAttribute("aria-label", point.precision === "official-coordinate" ? `警報來源官方座標：${point.label}` : `地名參考點，並非已確認事故點：${point.label}`);
      marker = new Marker({ element: markerElement, anchor: "bottom" })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map);
      map.once("style.load", () => { if (!disposed) { loadedRef.current = true; setReady(true); } });
      map.on("render", () => {
        if (!disposed && !loadedRef.current && map?.isStyleLoaded()) {
          loadedRef.current = true;
          setReady(true);
        }
      });
      map.on("error", (event) => {
        if (!disposed && !loadedRef.current && event.error) setError("互動地圖暫時未能載入；可改用外部地圖查看該位置。");
      });
    }).catch(() => {
      if (!disposed) setError("互動地圖暫時未能載入；可改用外部地圖查看該位置。");
    });

    return () => {
      disposed = true;
      marker?.remove();
      map?.remove();
    };
  // The point object is reconstructed by the parent during render; coordinates/label are the stable identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point.latitude, point.longitude, point.label, point.precision]);

  const externalMapUrl = buildGoogleMapsSearchUrl(`${point.latitude},${point.longitude}`);
  return <div className="incident-map-result">
    <div className="incident-map-map-wrap" data-map-ready={ready ? "true" : "false"}>
      {!ready && <div className="incident-map-loading" role="status">{error || "正在載入互動地圖…"}</div>}
      <div ref={containerRef} className="incident-map-frame" role="region" aria-label={`${point.label}互動地圖`} />
    </div>
    <div className="incident-map-caption">
      <span><MapPin size={13} aria-hidden="true" />{point.label}{point.description ? ` · ${point.description}` : ""}</span>
      <a href={externalMapUrl} target="_blank" rel="noreferrer">在 Google Maps 查看位置 <ArrowUpRight size={12} aria-hidden="true" /></a>
    </div>
    {point.precision === "official-coordinate"
      ? <p className="incident-map-precision precise"><strong>官方座標</strong> · 位置來自警報來源；仍請以官方公告及現場情況為準。</p>
      : <p className="incident-map-precision approximate"><strong>地名參考點，並非已確認事故點</strong> · 位置由香港政府地名搜尋按警報文字配對；同一道路可能有多個可能位置。</p>}
    <div className="incident-map-attribution"><a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> · © <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · 地圖資料 <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap 貢獻者</a></div>
  </div>;
}

export function IncidentLocationMap({ label, searchQuery, latitude, longitude, noLocationMessage }: IncidentLocationMapProps) {
  const hasExactCoordinates = isValidMapCoordinate(latitude, longitude);
  const exactPoint = hasExactCoordinates
    ? officialCoordinatePoint(latitude!, longitude!, label)
    : null;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<IncidentMapPoint[]>([]);
  const [selected, setSelected] = useState<IncidentMapPoint | null>(null);

  useEffect(() => {
    if (!open || hasExactCoordinates || !searchQuery) return;
    let active = true;
    setLoading(true);
    setError("");
    void searchIncidentPlace(searchQuery)
      .then((points) => { if (active) setResults(points); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "暫時無法搜尋這個地點。");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, hasExactCoordinates, searchQuery]);

  if (!exactPoint && !searchQuery) {
    return noLocationMessage
      ? <p className="incident-map-unavailable"><TriangleAlert size={14} aria-hidden="true" />{noLocationMessage}</p>
      : null;
  }

  return <div className="incident-map-widget">
    <button
      type="button"
      className="incident-map-toggle"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
    >
      <MapPinned size={15} aria-hidden="true" />
      {open ? "收起位置地圖" : hasExactCoordinates ? "查看官方座標地圖" : "搜尋並查看地圖位置"}
    </button>
    {open && <div className="incident-map-panel" aria-live="polite">
      {exactPoint ? <MapView point={exactPoint} /> : <>
        <p className="incident-map-search-note"><Search size={13} aria-hidden="true" />按警報地名向香港政府 GeoInfo Map 搜尋，只在你開啟地圖時查詢。</p>
        {loading && <p className="incident-map-state" role="status">正在搜尋可能地點…</p>}
        {error && <p className="incident-map-state error" role="alert">{error}</p>}
        {!loading && !error && results.length === 0 && <p className="incident-map-state">未找到可用的地名結果。這不代表事件沒有發生；可直接用地名搜尋地圖。</p>}
        {results.length > 0 && !selected && <>
          <p className="incident-map-candidates-title">選擇可能位置（政府搜尋結果，不代表已確認事故點）</p>
          <div className="incident-map-candidates">
            {results.map((point, index) => <button key={`${point.latitude}-${point.longitude}-${index}`} type="button" onClick={() => setSelected(point)}>
              <MapPin size={13} aria-hidden="true" /><span>{point.label}{point.description && <small>{point.description}</small>}</span>
            </button>)}
          </div>
        </>}
        {selected && <>
          <button type="button" className="incident-map-change-place" onClick={() => setSelected(null)}>返回選擇其他可能地點</button>
          <MapView point={selected} />
        </>}
        {!loading && (error || results.length === 0) && <a className="incident-map-search-fallback" href={buildGoogleMapsSearchUrl(searchQuery ?? label)} target="_blank" rel="noreferrer">在 Google Maps 搜尋「{searchQuery ?? label}」 <ArrowUpRight size={12} aria-hidden="true" /></a>}
      </>}
    </div>}
  </div>;
}
