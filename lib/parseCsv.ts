import fs from "fs";
import path from "path";

export type Row = {
  country_iso3: string;
  distributor: string;
  product: string;
  category: string;
};

export type Grouped = Record<
  string, // ISO3
  Record<
    string, // distributor
    { product: string; category: string }[]
  >
>;

function splitCsvLine(line: string): string[] {
  // MVP: asume que no hay comas escapadas dentro de campos
  return line.split(",").map((s) => s.trim());
}

export function loadAndGroupCsv(): { grouped: Grouped; countriesWithData: string[] } {
  const csvPath = path.join(process.cwd(), "data", "autorizaciones_mock.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);

  const header = splitCsvLine(lines[0]);
  const idx = {
    country_iso3: header.indexOf("country_iso3"),
    distributor: header.indexOf("distributor"),
    product: header.indexOf("product"),
    category: header.indexOf("category"),
  };

  const grouped: Grouped = {};

  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const row: Row = {
      country_iso3: (cols[idx.country_iso3] || "").toUpperCase(),
      distributor: cols[idx.distributor] || "",
      product: cols[idx.product] || "",
      category: cols[idx.category] || "",
    };

    if (!row.country_iso3 || !row.distributor || !row.product) continue;

    grouped[row.country_iso3] ||= {};
    grouped[row.country_iso3][row.distributor] ||= [];
    grouped[row.country_iso3][row.distributor].push({ product: row.product, category: row.category });
  }

  // De-dup productos por distribuidor
  for (const iso3 of Object.keys(grouped)) {
    for (const dist of Object.keys(grouped[iso3])) {
      const seen = new Set<string>();
      grouped[iso3][dist] = grouped[iso3][dist]
        .filter((x) => {
          const key = `${x.category}||${x.product}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => (a.category + a.product).localeCompare(b.category + b.product));
    }
  }

  return { grouped, countriesWithData: Object.keys(grouped).sort() };
}
