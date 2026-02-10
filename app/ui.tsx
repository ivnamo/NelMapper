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
  // Estados de selección (mapa) y filtros
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // Al cambiar filtros, limpiar selección de país
  useEffect(() => {
    setSelectedIso3(null);
  }, [selectedDistributor, selectedProduct]);

  // Distribuidores únicos (para opciones)
  const uniqueDistributors = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.keys(distObj).forEach((dist) => s.add(dist));
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Productos únicos (para opciones)
  const uniqueProducts = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.values(distObj).forEach((items) => {
        items.forEach(({ product }) => s.add(product));
      });
    });
    return Array.from(s).sort();
  }, [grouped]);

  /**
   * Normalizar los valores de los filtros:
   *  - Si el valor es "", "Todos" o "todos", lo tratamos como sin filtro (cadena vacía).
   */
  const normalizedDistributor =
    !selectedDistributor ||
    selectedDistributor.toLowerCase() === "todos"
      ? ""
      : selectedDistributor;
  const normalizedProduct =
    !selectedProduct || selectedProduct.toLowerCase() === "todos"
      ? ""
      : selectedProduct;

  // Países que cumplen los filtros normalizados
  const filteredCountries = useMemo(() => {
    return Object.keys(grouped)
      .filter((iso3) => {
        const distObj = grouped[iso3];
        return Object.entries(distObj).some(([dist, items]) => {
          // Si hay filtro de distribuidor y no coincide, descartar
          if (normalizedDistributor && dist !== normalizedDistributor) return false;
          // Si hay filtro de producto y no aparece en este distribuidor, descartar
          if (normalizedProduct) {
            return items.some((it) => it.product === normalizedProduct);
          }
          return true;
        });
      })
      .sort();
  }, [grouped, normalizedDistributor, normalizedProduct]);

  // Países a mostrar: uno (seleccionado) o todos los filtrados
  const displayCountries = useMemo(() => {
    return selectedIso3 ? [selectedIso3] : filteredCountries;
  }, [selectedIso3, filteredCountries]);

  // Recuento dinámico con deduplicación y fallback a totales globales
  const { distCount, prodCount } = useMemo(() => {
    // Caso sin país seleccionado ni filtros activos: mostrar totales únicos
    if (
      !selectedIso3 &&
      !normalizedDistributor &&
      !normalizedProduct
    ) {
      return {
        distCount: uniqueDistributors.length,
        prodCount: uniqueProducts.length,
      };
    }

    // De lo contrario, contar distribuidores y productos únicos en el subconjunto actual
    const dSet = new Set<string>();
    const pSet = new Set<string>();
    const isoList = selectedIso3 ? [selectedIso3] : filteredCountries;

    isoList.forEach((iso3) => {
      const distObj = grouped[iso3];
      if (!distObj) return;
      Object.entries(distObj).forEach(([dist, items]) => {
        // Filtro por distribuidor
        if (normalizedDistributor && dist !== normalizedDistributor) return;
        items.forEach(({ product }) => {
          // Filtro por producto
          if (normalizedProduct && product !== normalizedProduct) return;
          dSet.add(dist);
          pSet.add(product);
        });
      });
    });
    return { distCount: dSet.size, prodCount: pSet.size };
  }, [
    grouped,
    selectedIso3,
    normalizedDistributor,
    normalizedProduct,
    filteredCountries,
    uniqueDistributors.length,
    uniqueProducts.length,
  ]);

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12, fontSize: 28 }}>
        Mapa de autorizaciones
      </h1>

      {/* Distribución: mapa a la izquierda, panel de filtros a la derecha */}
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

      {/* Listado de países y detalles debajo del mapa */}
      <div style={{ marginTop: 20 }}>
        <CountryList
          grouped={grouped}
          iso3ToName={iso3ToName}
          displayCountries={displayCountries}
          selectedDistributor={normalizedDistributor}
          selectedProduct={normalizedProduct}
        />
      </div>
    </main>
  );
}
