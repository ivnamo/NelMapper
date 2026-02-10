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

  // Obtener distribuidores únicos
  const uniqueDistributors = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.keys(distObj).forEach((d) => s.add(d));
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Obtener productos únicos
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

  // Países a mostrar: uno (si hay seleccionado) o todos los filtrados
  const displayCountries = useMemo(() => {
    return selectedIso3 ? [selectedIso3] : filteredCountries;
  }, [selectedIso3, filteredCountries]);

  // Cálculo dinámico de distribuidores y productos según selección/filtros
  const { distCount, prodCount } = useMemo(() => {
    const distSet = new Set<string>();
    const prodSet = new Set<string>();
    displayCountries.forEach((iso3) => {
      const distObj = grouped[iso3];
      if (!distObj) return;
      Object.entries(distObj).forEach(([dist, items]) => {
        if (selectedDistributor && dist !== selectedDistributor) return;
        items.forEach(({ product }) => {
          if (selectedProduct && product !== selectedProduct) return;
          distSet.add(dist);
          prodSet.add(product);
        });
      });
    });
    return { distCount: distSet.size, prodCount: prodSet.size };
  }, [grouped, displayCountries, selectedDistributor, selectedProduct]);

  // Asignamos los contadores dinámicos a las props esperadas por FilterPanel
  const totalDistributors = distCount;
  const totalProducts = prodCount;

  // A partir de aquí cerramos todos los scopes antes del return
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
            totalDistributors={totalDistributors}
            totalProducts={totalProducts}
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
