"use client";

import { useState } from "react";
import WorldMap from "@/components/WorldMap";
import DetailsPanel from "@/components/DetailsPanel";
import FilterPanel from "@/components/FilterPanel";

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
  const [selectedIso3, setSelectedIso3] = useState<string | null>(countriesWithData[0] ?? null);
  const [selectedDistributor, setSelectedDistributor] = useState<string>(ALL);
  const [selectedProduct, setSelectedProduct] = useState<string>(ALL);

  // Distribuidores únicos
  const uniqueDistributors = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.keys(distObj).forEach((d) => s.add(d));
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Productos únicos
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
    return Object.keys(grouped).filter((iso3) => {
      const distObj = grouped[iso3];
      return Object.entries(distObj).some(([dist, items]) => {
        // Si hay filtro de distribuidor, comprueba
        if (selectedDistributor && dist !== selectedDistributor) return false;
        // Si hay filtro de producto, comprueba
        if (selectedProduct) {
          return items.some((it) => it.product === selectedProduct);
        }
        return true;
      });
    }).sort();
  }, [grouped, selectedDistributor, selectedProduct]);

  const totalDistributors = uniqueDistributors.length;
  const totalProducts = uniqueProducts.length;

  // Cambia el listado de países resaltados en el mapa: usa filteredCountries para destacar
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28 }}>Mapa de autorizaciones</h1>
      <div className="layout" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <WorldMap
            countriesWithData={filteredCountries}
            selectedIso3={selectedIso3}
            onSelectIso3={setSelectedIso3}
          />
        </div>
        <div style={{ width: 380, minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
          <FilterPanel
            uniqueDistributors={uniqueDistributors}
            uniqueProducts={uniqueProducts}
            selectedDistributor={selectedDistributor}
            setSelectedDistributor={setSelectedDistributor}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            totalDistributors={totalDistributors}
            totalProducts={totalProducts}
            filteredCountries={filteredCountries}
            iso3ToName={iso3ToName}
          />
          <DetailsPanel
            grouped={grouped}
            selectedIso3={selectedIso3}
            iso3ToName={iso3ToName}
          />
        </div>
      </div>
    </main>
  );
}

