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

  const visit = (c: any) => {
    const lon = c?.[0], lat = c?.[1];
    if (typeof lon !== "number" || typeof lat !== "number") return;
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  };

  const walk = (coords: any) => {
    if (!coords) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      visit(coords);
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
      .then((g) => {
        // Normaliza a properties.iso3 (solo A-Z{3}, ignora -99)
        
        
        const candidates = ["ISO3166-1-Alpha-3", "ISO_A3", "ADM0_A3", "iso_a3"];
        for (const f of g.features || []) {
          const p = f.properties || {};
          let iso = "";
          for (const k of candidates) {
            const v = p[k];
            if (typeof v === "string" && /^[A-Z]{3}$/.test(v.toUpperCase())) {
              iso = v.toUpperCase();
              break;
            }
          }
          p.iso3 = iso;
          f.properties = p;
        }
        const fr = (g.features || []).find((f: any) => (f?.properties?.name || "").toLowerCase() === "france");
        console.log("FRANCE feature properties:", fr?.properties);

        setGeojson(g);
      })
      .catch((e) => {
        console.error("GeoJSON load error:", e);
        setGeojson(null);
      });
  }, []);

  const isReady = !!geojson;

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
          ["in", ["get", "iso3"], ["literal", Array.from(countriesSet)]],
          "#2E86DE",
          "#D5D8DC",
        ],
        "fill-opacity": [
          "case",
          ["==", ["get", "iso3"], selectedIso3 ?? ""],
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

  const getCountryFeatureAtPoint = (point: { x: number; y: number }) => {
    const map = mapRef.current?.getMap();
    if (!map || !isReady) return null;

    // Query robusto: consulta todo, filtra por source id "countries"
    //const feats = map.queryRenderedFeatures(point) as any[];
    const feats = map.queryRenderedFeatures([point.x, point.y]) as any[];

    const fromCountries = feats.filter((f) => f?.source === "countries");

    // Coge el primero con iso3 válido
    const fValid = fromCountries.find((f) => /^[A-Z]{3}$/.test(String(f?.properties?.iso3 || "")));
    return fValid || null;
  };

  return (
    <div className="mapWrap">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.6 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onMouseMove={(e) => {
          const map = mapRef.current?.getMap();
          if (!map || !isReady) return;

          const f = getCountryFeatureAtPoint(e.point);
          map.getCanvas().style.cursor = f ? "pointer" : "";
        }}
        onMouseLeave={() => {
          const map = mapRef.current?.getMap();
          if (!map) return;
          map.getCanvas().style.cursor = "";
        }}
        onClick={(e) => {
          const map = mapRef.current?.getMap();
          if (!map || !isReady) return;

          const f = getCountryFeatureAtPoint(e.point);
          if (!f) return;

          const iso3Up = String(f.properties.iso3).toUpperCase();
          onSelectIso3(iso3Up);

          const bbox = getFeatureBBox(f);
          if (bbox) {
            const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
            map.fitBounds(bbox, { padding: isMobile ? 20 : 60, duration: 900, maxZoom: 5.2 });
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
          position: relative;
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
