#!/usr/bin/env python3
"""Prepare a compact local GeoJSON from the Hong Kong Government district-boundary source.

This is a manual maintenance tool; it is not run at app runtime or during production builds.
"""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

SOURCE_URL = "https://www.had.gov.hk/psi/hong-kong-administrative-boundaries/hksar_18_district_boundary.json"
OUTPUT = Path(__file__).resolve().parents[1] / "client/src/data/hk-area-boundaries.ts"
SIMPLIFY_TOLERANCE_DEGREES = 0.001
AREA_BY_DISTRICT_CODE = {
    "A": "港島", "B": "港島", "C": "港島", "D": "港島",
    "E": "九龍", "F": "九龍", "G": "九龍", "H": "九龍", "J": "九龍",
    "K": "新界／離島", "L": "新界／離島", "M": "新界／離島", "N": "新界／離島",
    "P": "新界／離島", "Q": "新界／離島", "R": "新界／離島", "S": "新界／離島", "T": "新界／離島",
}


def point_segment_distance_squared(point: list[float], start: list[float], end: list[float]) -> float:
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    if dx == 0 and dy == 0:
        return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2
    t = max(0.0, min(1.0, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)))
    closest_x = start[0] + t * dx
    closest_y = start[1] + t * dy
    return (point[0] - closest_x) ** 2 + (point[1] - closest_y) ** 2


def simplify_open_line(points: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(points) <= 2:
        return points
    best_distance = tolerance * tolerance
    best_index = None
    for index in range(1, len(points) - 1):
        distance = point_segment_distance_squared(points[index], points[0], points[-1])
        if distance > best_distance:
            best_distance = distance
            best_index = index
    if best_index is None:
        return [points[0], points[-1]]
    return simplify_open_line(points[: best_index + 1], tolerance)[:-1] + simplify_open_line(points[best_index:], tolerance)


def simplify_ring(ring: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(ring) <= 4:
        return ring
    closed = ring[0] == ring[-1]
    points = ring[:-1] if closed else ring
    simplified = simplify_open_line(points, tolerance)
    if len(simplified) < 3:
        simplified = points
    return simplified + [simplified[0]] if closed else simplified


def main() -> None:
    with urllib.request.urlopen(SOURCE_URL, timeout=45) as response:
        source = json.load(response)

    features = []
    for source_feature in source.get("features", []):
        properties = source_feature.get("properties", {})
        district_code = properties.get("地區號碼")
        broad_area = AREA_BY_DISTRICT_CODE.get(district_code)
        geometry = source_feature.get("geometry") or {}
        if broad_area is None or geometry.get("type") not in {"Polygon", "MultiPolygon"}:
            continue

        # GeoJSON Polygon = rings; MultiPolygon = polygons containing rings.
        coordinates = geometry.get("coordinates", [])
        if geometry["type"] == "Polygon":
            simplified = [simplify_ring(ring, SIMPLIFY_TOLERANCE_DEGREES) for ring in coordinates]
        else:
            simplified = [[simplify_ring(ring, SIMPLIFY_TOLERANCE_DEGREES) for ring in polygon] for polygon in coordinates]
        features.append({
            "type": "Feature",
            "properties": {"area": broad_area, "district": properties.get("地區", "")},
            "geometry": {"type": geometry["type"], "coordinates": simplified},
        })

    result = {
        "type": "FeatureCollection",
        "source": SOURCE_URL,
        "coordinateOrder": "longitude,latitude",
        "simplificationToleranceDegrees": SIMPLIFY_TOLERANCE_DEGREES,
        "features": features,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    module = "// Generated from the official Home Affairs Department source by scripts/prepare-hk-area-boundaries.py.\n"
    module += "const HK_AREA_BOUNDARIES = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + " as const;\nexport default HK_AREA_BOUNDARIES;\n"
    OUTPUT.write_text(module, encoding="utf-8")
    print(f"Wrote {len(features)} official district polygons to {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
