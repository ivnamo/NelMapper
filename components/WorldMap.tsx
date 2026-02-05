"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Source, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  countriesWithData: string[];
  selectedIso3: string | null;
  onSelectIso3: (iso3: string) => void;
};

function getFeatureBBox(feature: any): [[number, number], [number, number]] | null {
  const geom = feature?.geometry;
  if (!geom) return null;

  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

  const visitCoord = (c: any) => {
    const lon = c?.[0];
    const lat = c?.[1];
    if (typeof lon !== "number" || typeof lat !== "number") return;
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  };

  const walk = (coords: any) => {
    if (!coords) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      visitCoord(coords);
      return;
    }
    for (const x of coords) walk(x);
  };

  walk(geom.coordinates);

  if (!isFinite(minLon) || !isFinite(minLat) || !isFinite(maxLon) || !isFinite(maxLat)) return null;
  return [[minLon, minLat], [maxLon, maxLat]];
}


export default function WorldMap({ countriesWithData, selectedIso3, onSelectIso3 }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [geojson, setGeojson] = useState<any>(null);

  useEffect(() => {
    fetch("/countries.geojson")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} cargando /countries.geojson`);
        return r.json();
      })
      .then(setGeojson)
      .catch((e) => {
        console.error("GeoJSON load error:", e);
        setGeojson(null);
      });
  }, []);

  const countriesSet = useMemo(
    () => new Set(countriesWithData.map((c) => c.toUpperCase())),
    [countriesWithData]
  );

  const fillLayer: any = useMemo(
    () => ({
      id: "countries-fill",
      type: "fill",
      paint: {
        "fill-color": [
          "case",
          ["in", ["get", "ISO3166-1-Alpha-3"], ["literal", Array.from(countriesSet)]],
          "#2E86DE",
          "#D5D8DC",
        ],
        "fill-opacity": [
          "case",
          ["==", ["get", "ISO3166-1-Alpha-3"], selectedIso3 ?? ""],
          0.75,
          0.25,
        ],
      },
    }),
    [countriesSet, selectedIso3]
  );

  const lineLayer: any = {
    id: "countries-line",
    type: "line",
    paint: { "line-color": "#566573", "line-width": 0.6 },
  };

  return (
    <div className="mapWrap">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.6 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onClick={(e) => {
          const map = mapRef.current?.getMap();
          if (!map) return;
        
          const feats = map.queryRenderedFeatures(e.point, { layers: ["countries-fill"] });
          const f = feats?.[0] as any;
          const iso3 = f?.properties?.["ISO3166-1-Alpha-3"];
          if (!iso3) return;
        
          const iso3Up = String(iso3).toUpperCase();
          onSelectIso3(iso3Up);
        
          const bbox = getFeatureBBox(f);
          if (bbox) {
            // padding más grande en móvil
            const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
            map.fitBounds(bbox, {
              padding: isMobile ? 20 : 60,
              duration: 900,
              maxZoom: 5.2,
            });
          }
        }}
      >
        {geojson && (
          <Source id="countries" type="geojson" data={geojson}>
            <Layer {...fillLayer} />
            <Layer {...lineLayer} />
          </Source>
        )}
      </Map>

      <style jsx>{`
        .mapWrap {
          height: 52vh;
          min-height: 360px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        @media (min-width: 1024px) {
          .mapWrap {
            height: 620px;
            min-height: 620px;
          }
        }
      `}</style>
    </div>
  );
}
