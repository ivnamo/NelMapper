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
  // País seleccionado en el mapa
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);

  // Filtros inicializados vacíos (no aplican filtro)
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // Al cambiar filtros, quitar la selección del mapa
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

  // Países que cumplen filtros (distribuidor y producto)
  const filteredCountries = useMemo(() => {
    return Object.keys(grouped)
      .filter((iso3) => {
        const distObj = grouped[iso3];
        // Debe haber al menos un distribuidor que cumpla
        return Object.entries(distObj).some(([dist, items]) => {
          // Filtrar por distribuidor
          if (selectedDistributor && dist !== selectedDistributor) return false;
          // Filtrar por producto
          if (selectedProduct) {
            return items.some((it) => it.product === selectedProduct);
          }
          return true;
        });
      })
      .sort();
  }, [grouped, selectedDistributor, selectedProduct]);

  // Países a mostrar: uno si está seleccionado, o todos los filtrados
  const displayCountries = useMemo(() => {
    return selectedIso3 ? [selectedIso3] : filteredCountries;
  }, [selectedIso3, filteredCountries]);

  // Recuento dinámico de distribuidores y productos
  const { distCount, prodCount } = useMemo(() => {
    // Sin filtros y sin país seleccionado → usar los totales globales
    if (!selectedIso3 && !selectedDistributor && !selectedProduct) {
      return {
        distCount: uniqueDistributors.length,
        prodCount: uniqueProducts.length,
      };
    }

    // Con filtros o país seleccionado → deduplicar en el subconjunto
    const distSet = new Set<string>();
    const prodSet = new Set<string>();
    const isoList = selectedIso3 ? [selectedIso3] : filteredCountries;

    isoList.forEach((iso3) => {
      const distObj = grouped[iso3];
      if (!distObj) return;

      Object.entries(distObj).forEach(([dist, items]) => {
        // Aplicar filtro por distribuidor
        if (selectedDistributor && dist !== selectedDistributor) return;

        items.forEach(({ product }) => {
          // Aplicar filtro por producto
          if (selectedProduct && product !== selectedProduct) return;

          distSet.add(dist);
          prodSet.add(product);
        });
      });
    });

    return {
      distCount: distSet.size,
      prodCount: prodSet.size,
    };
  }, [
    grouped,
    selectedIso3,
    selectedDistributor,
    selectedProduct,
    filteredCountries,
    uniqueDistributors.length,
    uniqueProducts.length,
  ]);

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>Mapa de autorizaciones</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <WorldMap
            countriesWithData={filteredCountries}
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
          selectedDistributor={selectedDistributor}
          selectedProduct={selectedProduct}
        />
      </div>
    </main>
  );
}
