// app/ui.tsx
"use client";

import { useState, useMemo } from "react";
import WorldMap from "@/components/WorldMap";
import FilterPanel from "@/components/FilterPanel";
import CountryList from "@/components/CountryList";

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
  const ALL = "";
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<string>(ALL);
  const [selectedProduct, setSelectedProduct] = useState<string>(ALL);

  // Opciones únicas sin filtrar (siguen igual)
  const uniqueDistributors = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.keys(distObj).forEach((d) => s.add(d));
    });
    return Array.from(s).sort();
  }, [grouped]);

  const uniqueProducts = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.values(distObj).forEach((items) => {
        items.forEach(({ product }) => s.add(product));
      });
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Países que cumplen filtros
  const filteredCountries = useMemo(() => {
    return Object.keys(grouped)
      .filter((iso3) => {
        const distObj = grouped[iso3];
        return Object.entries(distObj).some(([dist, items]) => {
          if (selectedDistributor && dist !== selectedDistributor) return false;
          if (selectedProduct) {
            return items.some((it) => it.product === selectedProduct);
          }
          return true;
        });
      })
      .sort();
  }, [grouped, selectedDistributor, selectedProduct]);

  // Países que se muestran (si se selecciona un país, solo ese; si no, todos los filtrados)
  const displayCountries = useMemo(() => {
    return selectedIso3 ? [selectedIso3] : filteredCountries;
  }, [selectedIso3, filteredCountries]);

  // === NUEVO: recálculo dinámico de distribuidores y productos ===
  const { distCount, prodCount } = useMemo(() => {
    const distSet = new Set<string>();
    const prodSet = new Set<string>();

    displayCountries.forEach((iso3) => {
      const distObj = grouped[iso3];
      if (!distObj) return;
      for (const [dist, items] of Object.entries(distObj)) {
        // Filtrar distribuidor si está seleccionado
        if (selectedDistributor && dist !== selectedDistributor) continue;
        // Filtrar productos si se ha seleccionado uno concreto
        items.forEach(({ product }) => {
          if (selectedProduct && product !== selectedProduct) return;
          distSet.add(dist);
          prodSet.add(product);
        });
      }
    });

    return { distCount: distSet.size, prodCount: prodSet.size };
  }, [grouped, displayCountries, selectedDistributor, selectedProduct]);

  // Pasa estos contadores al panel de filtros
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28 }}>
        Mapa de autorizaciones
      </h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <WorldMap
            countriesWithData={filteredCountries}
            selectedIso3={selectedIso3}
            onSelectIso3={setSelectedIso3}
          />
        </div>
        <div
          style={{
            width: 380,
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <FilterPanel
            uniqueDistributors={uniqueDistributors}
            uniqueProducts={uniqueProducts}
            selectedDistributor={selectedDistributor}
            setSelectedDistributor={setSelectedDistributor}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            totalDistributors={distCount}  {/* ahora dinámico */}
            totalProducts={prodCount}      {/* ahora dinámico */}
          />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <CountryList
          grouped={grouped}
          iso3ToName={iso3ToName}
          displayCountries={displayCountries}
          selectedDistributor={selectedDistributor}
          selectedProduct={selectedProduct}
        />
      </div>
    </main>
  );
}
