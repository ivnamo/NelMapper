"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Source, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  countriesWithData: string[];
  selectedIso3: string | null;
  onSelectIso3: (iso3: string) => void;
};

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

  // Ojo: expresiones Mapbox/MapLibre
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
    <div style={{ height: 620, borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.6 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        // IMPORTANTE: no dependas de e.features; usa queryRenderedFeatures
        onClick={(e) => {
          const map = mapRef.current?.getMap();
          if (!map) return;

          const feats = map.queryRenderedFeatures(e.point, { layers: ["countries-fill"] });
          const iso3 = feats?.[0]?.properties?.["ISO3166-1-Alpha-3"];
          if (iso3) onSelectIso3(String(iso3).toUpperCase());
        }}
      >
        {geojson && (
          <Source id="countries" type="geojson" data={geojson}>
            <Layer {...fillLayer} />
            <Layer {...lineLayer} />
          </Source>
        )}
      </Map>
    </div>
  );
}
