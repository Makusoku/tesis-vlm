import { DatasetView } from "@/features/dataset/dataset-view";
import { fetchDatasetRecords, fetchJsonlRecords } from "@/lib/api";

export default async function DatasetPage() {
  try {
    const [records, jsonlRecords] = await Promise.all([fetchDatasetRecords(), fetchJsonlRecords()]);
    return <DatasetView records={records} jsonlRecords={jsonlRecords} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return <DatasetView apiError={message} />;
  }
}
