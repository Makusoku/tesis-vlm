import { DatasetView } from "@/features/dataset/dataset-view";
import { fetchDatasetMetrics, fetchDatasetRecords, fetchJsonlRecords } from "@/lib/api";

export default async function DatasetPage() {
  try {
    const [records, jsonlRecords, metrics] = await Promise.all([fetchDatasetRecords(), fetchJsonlRecords(), fetchDatasetMetrics()]);
    return <DatasetView records={records} jsonlRecords={jsonlRecords} metrics={metrics} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return <DatasetView apiError={message} />;
  }
}
