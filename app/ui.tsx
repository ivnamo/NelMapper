// app/ui.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
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
  // Estado de selección del mapa y filtros
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // Si cambia algún filtro, limpiamos la selección de país
  useEffect(() => {
    setSelectedIso3(null);
  }, [selectedDistributor, selectedProduct]);

  // Distribuidores únicos globales
  const uniqueDistributors = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.keys(distObj).forEach((dist) => s.add(dist));
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Productos únicos globales
  const uniqueProducts = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.values(distObj).forEach((items) => {
        items.forEach(({ product }) => s.add(product));
      });
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Países que cumplen los filtros activos (para colorear el mapa)
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

  // Lista de países a mostrar: uno (si hay seleccionado) o todos los filtrados
  const displayCountries = useMemo(() => {
    return selectedIso3 ? [selectedIso3] : filteredCountries;
  }, [selectedIso3, filteredCountries]);

  // Recuento dinámico de distribuidores y productos deduplicados
  const { distCount, prodCount } = useMemo(() => {
    // Sin filtros ni país seleccionado → totales globales
    if (!selectedIso3 && !selectedDistributor && !selectedProduct) {
      return {
        distCount: uniqueDistributors.length,
        prodCount: uniqueProducts.length,
      };
    }
    // En caso contrario, calcula sobre países filtrados
    const dSet = new Set<string>();
    const pSet = new Set<string>();
    const isoList = selectedIso3 ? [selectedIso3] : filteredCountries;
    isoList.forEach((iso3) => {
      const distObj = grouped[iso3];
      if (!distObj) return;
      Object.entries(distObj).forEach(([dist, items]) => {
        if (selectedDistributor && dist !== selectedDistributor) return;
        items.forEach(({ product }) => {
          if (selectedProduct && product !== selectedProduct) return;
          dSet.add(dist);
          pSet.add(product);
        });
      });
    });
    return { distCount: dSet.size, prodCount: pSet.size };
  }, [
    grouped,
    selectedIso3,
    selectedDistributor,
    selectedProduct,
    filteredCountries,
    uniqueDistributors,
    uniqueProducts,
  ]);

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28 }}>
        Mapa de autorizaciones
      </h1>

      {/* Distribución en dos columnas: Mapa a la izquierda, filtros a la derecha */}
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
            totalDistributors={distCount}
            totalProducts={prodCount}
          />
        </div>
      </div>

      {/* Listado de países y detalles bajo el mapa */}
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
