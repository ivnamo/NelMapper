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
      .then((r) => r.json())
      .then(setGeojson)
      .catch(() => setGeojson(null));
  }, []);

  const countriesSet = useMemo(() => new Set(countriesWithData.map((c) => c.toUpperCase())), [countriesWithData]);

  // Pintar países con data distinto + resaltar seleccionado
  const fillLayer: any = useMemo(
    () => ({
      id: "countries-fill",
      type: "fill",
      paint: {
        "fill-opacity": [
          "case",
          ["==", ["get", "ISO3166-1-Alpha-3"], selectedIso3 ?? ""],
          0.75,
          0.25,
        ],
        "fill-color": [
          "case",
          ["in", ["get", "ISO3166-1-Alpha-3"], ["literal", Array.from(countriesSet)]],
          "#2E86DE",
          "#D5D8DC",
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
        // Estilo público (sin token). Si algún día cambiara, se sustituye por otro estilo OSM/Carto.
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onClick={(e) => {
          const features = e.features || [];
          const f = features.find((x: any) => x.layer?.id === "countries-fill" || x.layer?.id === "countries-line");
          const iso3 = f?.properties?.["ISO3166-1-Alpha-3"];
          if (iso3) onSelectIso3(String(iso3).toUpperCase());
        }}
        interactiveLayerIds={["countries-fill", "countries-line"]}
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
