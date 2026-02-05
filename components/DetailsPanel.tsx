"use client";

type Grouped = Record<string, Record<string, { product: string; category: string }[]>>;

export default function DetailsPanel({
  grouped,
  selectedIso3,
}: {
  grouped: Grouped;
  selectedIso3: string | null;
}) {
  const iso3 = selectedIso3 ?? Object.keys(grouped)[0] ?? null;
  const distributors = iso3 ? grouped[iso3] : null;

  if (!iso3) return <div style={{ padding: 16 }}>No hay datos.</div>;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 14, color: "#6b7280" }}>País (ISO3)</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{iso3}</div>

      {!distributors ? (
        <div style={{ color: "#6b7280" }}>No hay autorizaciones para este país.</div>
      ) : (
        Object.entries(distributors).map(([dist, items]) => (
          <details key={dist} style={{ marginTop: 10, border: "1px solid #e5e7eb", borderRadius: 10 }}>
            <summary style={{ cursor: "pointer", padding: 14, fontWeight: 700, fontSize: 15 }}>

              {dist} — {items.length} productos
            </summary>
            <div style={{ padding: 12, paddingTop: 0 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {items.map((x, i) => (
                  <li key={i}>
                    {x.product} <span style={{ color: "#6b7280" }}>({x.category})</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))
      )}
    </div>
  );
}
