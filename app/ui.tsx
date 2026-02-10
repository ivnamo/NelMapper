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
  // Estado de selección para país (clicado en el mapa) y filtros
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // Al cambiar los filtros, limpiamos la selección de país
  useEffect(() => {
    setSelectedIso3(null);
  }, [selectedDistributor, selectedProduct]);

  // Lista de distribuidores únicos (sin normalización)
  const uniqueDistributors = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.keys(distObj).forEach((dist) => s.add(dist));
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Lista de productos únicos (sin normalización)
  const uniqueProducts = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.values(distObj).forEach((items) => {
        items.forEach(({ product }) => s.add(product));
      });
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Interpretamos cadenas vacías o "todos"/"Todos" como ausencia de filtro
  const normalizedDistributor =
    !selectedDistributor || selectedDistributor.toLowerCase() === "todos"
      ? ""
      : selectedDistributor;
  const normalizedProduct =
    !selectedProduct || selectedProduct.toLowerCase() === "todos"
      ? ""
      : selectedProduct;

  // Países que cumplen con los filtros
  const filteredCountries = useMemo(() => {
    return Object.keys(grouped)
      .filter((iso3) => {
        const distObj = grouped[iso3];
        return Object.entries(distObj).some(([dist, items]) => {
          // Aplicar filtro de distribuidor
          if (normalizedDistributor && dist !== normalizedDistributor) return false;
          // Aplicar filtro de producto
          if (normalizedProduct) {
            return items.some((it) => it.product === normalizedProduct);
          }
          return true;
        });
      })
      .sort();
  }, [grouped, normalizedDistributor, normalizedProduct]);

  // Países a mostrar en la lista: si se selecciona un país, sólo ese; si no, todos los filtrados
  const displayCountries = useMemo(() => {
    return selectedIso3 ? [selectedIso3] : filteredCountries;
  }, [selectedIso3, filteredCountries]);

  // Recuento dinámico de distribuidores y productos
  const { distCount, prodCount } = useMemo(() => {
    // Si no hay país seleccionado ni filtros activos, devolvemos los valores globales
    if (!selectedIso3 && !normalizedDistributor && !normalizedProduct) {
      return {
        distCount: uniqueDistributors.length,
        prodCount: uniqueProducts.length,
      };
    }

    // En cualquier otro caso, contamos los distribuidores y productos únicos en el subconjunto actual
    const distSet = new Set<string>();
    const prodSet = new Set<string>();
    const isoList = selectedIso3 ? [selectedIso3] : filteredCountries;

    isoList.forEach((iso3) => {
      const distObj = grouped[iso3];
      if (!distObj) return;
      Object.entries(distObj).forEach(([dist, items]) => {
        if (normalizedDistributor && dist !== normalizedDistributor) return;
        items.forEach(({ product }) => {
          if (normalizedProduct && product !== normalizedProduct) return;
          distSet.add(dist);
          prodSet.add(product);
        });
      });
    });

    return { distCount: distSet.size, prodCount: prodSet.size };
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

      {/* Distribución de la página: mapa a la izquierda, filtros a la derecha */}
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

      {/* Listado de países y detalles, debajo del mapa */}
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
