// app/ui.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import WorldMap from "@/components/WorldMap";
import FilterPanel from "@/components/FilterPanel";
import CountryList from "@/components/CountryList";

type Grouped = Record<string, Record<string, { product: string; category: string }[]>>;

// Función para normalizar textos: quita tildes, recorta espacios y pasa a minúsculas
function normalizeStr(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .trim()
    .toLowerCase();
}

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

  // Al cambiar filtros, limpiar la selección del mapa
  useEffect(() => {
    setSelectedIso3(null);
  }, [selectedDistributor, selectedProduct]);

  /**
   * Listas de distribuidores y productos.
   * En esta opción se guardan como nombres *normalizados* para que
   * las comparaciones y los recuentos no se dupliquen por tildes o mayúsculas.
   * Si prefieres mostrar los nombres originales en los <select>, puedes adaptar
   * FilterPanel para aceptar objetos { normalized, display } en lugar de strings.
   */
  const uniqueDistributors = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.keys(distObj).forEach((dist) => {
        const normalized = normalizeStr(dist);
        s.add(normalized);
      });
    });
    return Array.from(s).sort();
  }, [grouped]);

  const uniqueProducts = useMemo(() => {
    const s = new Set<string>();
    Object.values(grouped).forEach((distObj) => {
      Object.values(distObj).forEach((items) => {
        items.forEach(({ product }) => {
          const normalized = normalizeStr(product);
          s.add(normalized);
        });
      });
    });
    return Array.from(s).sort();
  }, [grouped]);

  // Normalizamos los filtros seleccionados para compararlos después
  const normalizedDistributor = selectedDistributor || "";
  const normalizedProduct = selectedProduct || "";

  // Países que cumplen con los filtros (normalizados)
  const filteredCountries = useMemo(() => {
    return Object.keys(grouped)
      .filter((iso3) => {
        const distObj = grouped[iso3];
        return Object.entries(distObj).some(([dist, items]) => {
          const distNorm = normalizeStr(dist);
          // Filtro de distribuidor
          if (normalizedDistributor && distNorm !== normalizedDistributor) return false;
          // Filtro de producto
          if (normalizedProduct) {
            return items.some((it) => normalizeStr(it.product) === normalizedProduct);
          }
          return true;
        });
      })
      .sort();
  }, [grouped, normalizedDistributor, normalizedProduct]);

  // Países a mostrar en la lista (si hay selección en el mapa, sólo ese)
  const displayCountries = useMemo(() => {
    return selectedIso3 ? [selectedIso3] : filteredCountries;
  }, [selectedIso3, filteredCountries]);

  // Recuento dinámico de distribuidores y productos (deduplicados)
  const { distCount, prodCount } = useMemo(() => {
    // Si no hay país seleccionado ni filtros activos, devolvemos
    // directamente los tamaños de uniqueDistributors y uniqueProducts
    if (!selectedIso3 && !normalizedDistributor && !normalizedProduct) {
      return {
        distCount: uniqueDistributors.length,
        prodCount: uniqueProducts.length,
      };
      }

    // En caso contrario, contamos en el subconjunto filtrado
    const dSet = new Set<string>();
    const pSet = new Set<string>();
    const isoList = selectedIso3 ? [selectedIso3] : filteredCountries;

    isoList.forEach((iso3) => {
      const distObj = grouped[iso3];
      if (!distObj) return;
      Object.entries(distObj).forEach(([dist, items]) => {
        const distNorm = normalizeStr(dist);
        if (normalizedDistributor && distNorm !== normalizedDistributor) return;
        items.forEach(({ product }) => {
          const prodNorm = normalizeStr(product);
          if (normalizedProduct && prodNorm !== normalizedProduct) return;
          dSet.add(distNorm);
          pSet.add(prodNorm);
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

      {/* Mapa a la izquierda, filtros a la derecha */}
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
            // Aviso: los nombres de estas listas están normalizados (sin tildes y en minúsculas),
            // por lo que podrían verse diferentes a los originales en el select.
            // Si quieres conservar la presentación original, adapta FilterPanel para trabajar con pares {normalized, display}.
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

      {/* Listado de países debajo del mapa */}
      <div style={{ marginTop: 20 }}>
        <CountryList
          grouped={grouped}
          iso3ToName={iso3ToName}
          displayCountries={displayCountries}
          // Pasamos los filtros normalizados para que CountryList los utilice
          selectedDistributor={normalizedDistributor}
          selectedProduct={normalizedProduct}
        />
      </div>
    </main>
  );
}
