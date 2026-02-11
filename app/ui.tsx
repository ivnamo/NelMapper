// app/ui.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import WorldMap from "@/components/WorldMap";
import FilterPanel from "@/components/FilterPanel";
import CountryList from "@/components/CountryList";

type Grouped = Record<string, Record<string, { product: string; category: string }[]>>;

const ALL = "__ALL__"; // sentinela para "Todos"

export default function ClientPage({
  grouped,
  countriesWithData,
  iso3ToName,
}: {
  grouped: Grouped;
  countriesWithData: string[];
  iso3ToName: Record<string, string>;
}) {
  // País seleccionado en el mapa
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);

  /**
   * Filtros:
   *  - ""        => — Sin filtro — (NINGUNO)
   *  - "__ALL__" => Todos
   *  - otro      => valor específico
   */
  const [selectedDistributor, setSelectedDistributor] = useState<string>(ALL);
  const [selectedProduct, setSelectedProduct] = useState<string>(ALL);

  // Si cambian los filtros, quitamos selección del mapa
  useEffect(() => {
    setSelectedIso3(null);
  }, [selectedDistributor, selectedProduct]);

  // Distribuidores únicos
  const uniqueDistributors = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.keys(distObj).forEach((dist) => s.add(dist));
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

  // Modos
  const distNone = selectedDistributor === "";
  const prodNone = selectedProduct === "";
  const distAll = selectedDistributor === ALL;
  const prodAll = selectedProduct === ALL;

  // Filtros efectivos (null = sin restricción)
  const distFilter: string | null = distAll ? null : distNone ? "__NONE__" : selectedDistributor;
  const prodFilter: string | null = prodAll ? null : prodNone ? "__NONE__" : selectedProduct;

  /**
   * Si alguno está en "— Sin filtro —" => NINGUNO
   * (no hay países resaltados, ni lista)
   */
  const showNone = distNone || prodNone;

  // Países que cumplen filtros (para colorear en el mapa)
  const filteredCountries = useMemo(() => {
    if (showNone) return [];

    return Object.keys(grouped)
      .filter((iso3) => {
        const distObj = grouped[iso3];

        return Object.entries(distObj).some(([dist, items]) => {
          // Filtro distribuidor si aplica
          if (distFilter && dist !== distFilter) return false;

          // Filtro producto si aplica
          if (prodFilter) {
            return items.some((it) => it.product === prodFilter);
          }

          // Si no hay filtro de producto, cualquier item vale
          return true;
        });
      })
      .sort();
  }, [grouped, showNone, distFilter, prodFilter]);

  // Países a mostrar en la lista (si hay seleccionado en mapa, solo ese; si no, los filtrados)
  const displayCountries = useMemo(() => {
    if (showNone) return [];
    return selectedIso3 ? [selectedIso3] : filteredCountries;
  }, [showNone, selectedIso3, filteredCountries]);

  // Contadores dinámicos
  const { distCount, prodCount } = useMemo(() => {
    if (showNone) {
      return { distCount: 0, prodCount: 0 };
    }

    // Caso "Todos / Todos" y sin país seleccionado: totales globales
    if (!selectedIso3 && distAll && prodAll) {
      return {
        distCount: uniqueDistributors.length,
        prodCount: uniqueProducts.length,
      };
    }

    // Subconjunto: deduplicar sobre países visibles
    const distSet = new Set<string>();
    const prodSet = new Set<string>();

    const isoList = selectedIso3 ? [selectedIso3] : filteredCountries;

    isoList.forEach((iso3) => {
      const distObj = grouped[iso3];
      if (!distObj) return;

      Object.entries(distObj).forEach(([dist, items]) => {
        if (distFilter && dist !== distFilter) return;

        items.forEach(({ product }) => {
          if (prodFilter && product !== prodFilter) return;
          distSet.add(dist);
          prodSet.add(product);
        });
      });
    });

    return { distCount: distSet.size, prodCount: prodSet.size };
  }, [
    grouped,
    showNone,
    selectedIso3,
    distAll,
    prodAll,
    distFilter,
    prodFilter,
    filteredCountries,
    uniqueDistributors.length,
    uniqueProducts.length,
  ]);

  // Lo que se pinta en el mapa:
  // - si showNone => []
  // - si no => países filtrados
  const countriesForMap = showNone ? [] : filteredCountries;

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>Mapa de autorizaciones</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <WorldMap
            countriesWithData={countriesForMap}
            selectedIso3={selectedIso3}
            onSelectIso3={setSelectedIso3}
          />
        </div>

        <div style={{ width: 380, minWidth: 280 }}>
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

      <div style={{ marginTop: 20 }}>
        <CountryList
          grouped={grouped}
          iso3ToName={iso3ToName}
          displayCountries={displayCountries}
          // OJO: a CountryList le pasamos filtros reales ("" no tiene sentido aquí; showNone ya lo controla)
          selectedDistributor={distAll ? "" : distNone ? "" : selectedDistributor}
          selectedProduct={prodAll ? "" : prodNone ? "" : selectedProduct}
        />
      </div>
    </main>
  );
}
