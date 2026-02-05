"use client";

import { useState } from "react";
import WorldMap from "@/components/WorldMap";
import DetailsPanel from "@/components/DetailsPanel";

type Grouped = Record<string, Record<string, { product: string; category: string }[]>>;

export default function ClientPage({
  grouped,
  countriesWithData,
  iso3ToName,
}: {
  grouped: Grouped;
  countriesWithData: string[];
  iso3ToName: Record<string, string>;
}) {
  const [selectedIso3, setSelectedIso3] = useState<string | null>(countriesWithData[0] ?? null);

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28 }}>
        Mapa de autorizaciones
      </h1>

      <div className="layout">
        <WorldMap
          countriesWithData={countriesWithData}
          selectedIso3={selectedIso3}
          onSelectIso3={setSelectedIso3}
        />

        <DetailsPanel
          grouped={grouped}
          selectedIso3={selectedIso3}
          iso3ToName={iso3ToName}
        />
      </div>
    </main>
  );
}
