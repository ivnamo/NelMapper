"use client";

type Grouped = Record<string, Record<string, { product: string; category: string }[]>>;

export default function FilterPanel({
  uniqueDistributors,
  uniqueProducts,
  selectedDistributor,
  setSelectedDistributor,
  selectedProduct,
  setSelectedProduct,
  totalDistributors,
  totalProducts,
  filteredCountries,
  iso3ToName,
}: {
  uniqueDistributors: string[];
  uniqueProducts: string[];
  selectedDistributor: string;
  setSelectedDistributor: (s: string) => void;
  selectedProduct: string;
  setSelectedProduct: (s: string) => void;
  totalDistributors: number;
  totalProducts: number;
  filteredCountries: string[];
  iso3ToName: Record<string, string>;
}) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      {/* Filtros */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: "#6b7280" }}>Distribuidor</div>
        <select
          value={selectedDistributor}
          onChange={(e) => setSelectedDistributor(e.target.value)}
          style={{ width: "100%", padding: 6, marginTop: 4 }}
        >
          <option value="">Todos</option>
          {uniqueDistributors.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: "#6b7280" }}>Producto</div>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          style={{ width: "100%", padding: 6, marginTop: 4 }}
        >
          <option value="">Todos</option>
          {uniqueProducts.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Indicadores */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "#f9fafb", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Distribuidores</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{totalDistributors}</div>
        </div>
        <div style={{ flex: 1, background: "#f9fafb", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Productos</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{totalProducts}</div>
        </div>
      </div>

      {/* Listado de países */}
      <div>
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          Países ({filteredCountries.length})
        </div>
        {filteredCountries.length === 0 ? (
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            No hay países que cumplan esta combinación.
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {filteredCountries.map((iso3) => (
              <li key={iso3} style={{ fontSize: 13 }}>
                {iso3ToName[iso3] ?? iso3}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
