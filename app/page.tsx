import { loadAndGroupCsv } from "@/lib/parseCsv";
import ClientPage from "./ui";

export default function Page() {
  const { grouped, countriesWithData } = loadAndGroupCsv();
  return <ClientPage grouped={grouped} countriesWithData={countriesWithData} />;
}
