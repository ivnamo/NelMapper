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
    <main style={{ padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28 }}>Mapa de autorizaciones</h1>

      <div className="layout">
        <div>
          <WorldMap
            countriesWithData={countriesWithData}
            selectedIso3={selectedIso3}
            onSelectIso3={setSelectedIso3}
          />
        </div>

        <div className="panel">
          <DetailsPanel grouped={grouped} selectedIso3={selectedIso3} />
        </div>
      </div>

      <style jsx>{`
        .layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: start;
        }
        .panel {
          position: static;
        }

        /* Desktop */
        @media (min-width: 1024px) {
          .layout {
            grid-template-columns: 1.2fr 1fr;
            gap: 16px;
          }
          .panel {
            position: sticky;
            top: 16px;
          }
        }
      `}</style>
    </main>
  );
}
