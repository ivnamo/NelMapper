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
