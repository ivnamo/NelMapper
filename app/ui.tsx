"use client";

import { useState } from "react";
import WorldMap from "@/components/WorldMap";
import DetailsPanel from "@/components/DetailsPanel";

type Grouped = Record<string, Record<string, { product: string; category: string }[]>>;

export default function ClientPage({
  grouped,
  countriesWithData,
}: {
  grouped: Grouped;
  countriesWithData: string[];
}) {
  const [selectedIso3, setSelectedIso3] = useState<string | null>(countriesWithData[0] ?? null);

  return (
    <main style={{ padding: 18 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Mapa de autorizaciones</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "start" }}>
        <WorldMap
          countriesWithData={countriesWithData}
          selectedIso3={selectedIso3}
          onSelectIso3={setSelectedIso3}
        />
        <DetailsPanel grouped={grouped} selectedIso3={selectedIso3} />
      </div>
    </main>
  );
}
