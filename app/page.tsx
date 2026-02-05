import { loadAndGroupCsv, loadIso3ToCountryName } from "../lib/parseCsv";
import ClientPage from "./ui";

export default function Page() {
  const { grouped, countriesWithData } = loadAndGroupCsv();
  const iso3ToName = loadIso3ToCountryName();

  return (
    <ClientPage
      grouped={grouped}
      countriesWithData={countriesWithData}
      iso3ToName={iso3ToName}
    />
  );
}
