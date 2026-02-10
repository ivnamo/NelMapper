// components/CountryList.tsx
"use client";

type Grouped = Record<string, Record<string, { product: string; category: string }[]>>;

export default function CountryList({
  grouped,
  iso3ToName,
  displayCountries,
  selectedDistributor,
  selectedProduct,
}: {
  grouped: Grouped;
  iso3ToName: Record<string, string>;
  displayCountries: string[];
  selectedDistributor: string;
  selectedProduct: string;
}) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      {displayCountries.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          No hay países que cumplan los filtros seleccionados.
        </div>
      ) : (
        displayCountries.map((iso3) => {
          const distObj = grouped[iso3];
          if (!distObj) return null;

          // Filtrar distribuidores según el filtro activo
          const distEntries = Object.entries(distObj).filter(([dist]) =>
            selectedDistributor ? dist === selectedDistributor : true
          );

          return (
            <div key={iso3} style={{ marginBottom: 16 }}>
              {/* Nombre del país */}
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {iso3ToName[iso3] ?? iso3}
              </div>
              {/* Si no hay distribuidores tras aplicar el filtro */}
              {distEntries.length === 0 ? (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  No hay autorizaciones para este país.
                </div>
              ) : (
                distEntries.map(([dist, items]) => {
                  // Filtrar productos según el filtro activo
                  const filteredItems = selectedProduct
                    ? items.filter((item) => item.product === selectedProduct)
                    : items;
                  if (!filteredItems.length) return null;

                  return (
                    <details
                      key={dist}
                      style={{ marginTop: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}
                    >
                      <summary style={{ cursor: "pointer", padding: 12, fontWeight: 700 }}>
                        {dist} — {filteredItems.length} productos
                      </summary>
                      <div style={{ padding: 10, paddingTop: 0 }}>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {filteredItems.map((x, i) => (
                            <li key={i}>
                              {x.product}{" "}
                              <span style={{ color: "#6b7280" }}>({x.category})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  );
                })
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
