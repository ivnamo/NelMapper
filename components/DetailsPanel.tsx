"use client";

import { useMemo, useState } from "react";

type Grouped = Record<string, Record<string, { product: string; category: string }[]>>;

export default function DetailsPanel({
  grouped,
  selectedIso3,
}: {
  grouped: Grouped;
  selectedIso3: string | null;
}) {
  const [q, setQ] = useState("");

  const iso3 = selectedIso3 ?? Object.keys(grouped)[0] ?? null;
  const distributors = iso3 ? grouped[iso3] : null;

  const filtered = useMemo(() => {
    if (!iso3 || !distributors) return null;
    const qq = q.trim().toLowerCase();
    const out: Record<string, { product: string; category: string }[]> = {};
    for (const [dist, items] of Object.entries(distributors)) {
      const items2 = qq
        ? items.filter((x) => x.product.toLowerCase().includes(qq) || x.category.toLowerCase().includes(qq))
        : items;
      if (items2.length) out[dist] = items2;
    }
    return out;
  }, [q, iso3, distributors]);

  if (!iso3) return <div style={{ padding: 16 }}>No hay datos.</div>;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>País (ISO3)</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{iso3}</div>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto o categoría…"
          style={{
            width: "100%",
            maxWidth: 320,
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: "10px 12px",
            outline: "none",
          }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        {!filtered || Object.keys(filtered).length === 0 ? (
          <div style={{ color: "#6b7280", padding: 8 }}>No hay resultados con ese filtro.</div>
        ) : (
          Object.entries(filtered).map(([dist, items]) => (
            <details key={dist} style={{ marginTop: 10, border: "1px solid #e5e7eb", borderRadius: 10 }}>
              <summary style={{ cursor: "pointer", padding: 12, fontWeight: 600 }}>
                {dist} — {items.length} productos
              </summary>
              <div style={{ padding: 12, paddingTop: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#6b7280", fontSize: 13 }}>
                      <th style={{ padding: "8px 0" }}>Categoría</th>
                      <th style={{ padding: "8px 0" }}>Producto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((x, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "8px 0", width: "35%" }}>{x.category}</td>
                        <td style={{ padding: "8px 0" }}>{x.product}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
