"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertIcon, CheckIcon, DatabaseIcon, ImageIcon, UserIcon } from "@/components/icons";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchDatasetMetrics,
  fetchDatasetRecords,
  fetchJsonlRecords,
  type ApiDatasetMetrics,
  type ApiDatasetRecord,
  type ApiJsonlRecord,
} from "@/lib/api";

const requiredAnnotations = 4;

const exportFormats = [
  {
    id: "jsonl",
    name: "JSONL multimodal",
    description: "Formato línea por línea para pares imagen, pregunta, respuesta clínica y metadatos.",
  },
  {
    id: "csv",
    name: "CSV de auditoría",
    description: "Tabla plana para revisar códigos, estados, anotaciones, consenso y dimensiones.",
  },
  {
    id: "json",
    name: "JSON completo",
    description: "Registros estructurados del dataset con trazabilidad relacional.",
  },
  {
    id: "llava",
    name: "JSON para VLM",
    description: "Base exportable para adaptar el dataset a flujos tipo LLaVA u otros VLM.",
  },
];

type DatasetFilter = "all" | "pending" | "validated" | "conflict";

interface DatasetViewProps {
  records?: ApiDatasetRecord[];
  jsonlRecords?: ApiJsonlRecord[];
  metrics?: ApiDatasetMetrics | null;
  apiError?: string | null;
}

export function DatasetView({ records = [], jsonlRecords = [], metrics = null, apiError = null }: DatasetViewProps) {
  const [datasetRecords, setDatasetRecords] = useState(records);
  const [datasetJsonlRecords, setDatasetJsonlRecords] = useState(jsonlRecords);
  const [datasetMetrics, setDatasetMetrics] = useState(metrics);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DatasetFilter>("all");
  const hasRecords = datasetRecords.length > 0;
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return datasetRecords.filter((record) => {
      const metadataText = [record.region, record.farm, record.variety, ...(record.metadata_symptoms ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        record.specimen_code.toLowerCase().includes(normalizedQuery) ||
        (record.final_diagnosis ?? "").toLowerCase().includes(normalizedQuery) ||
        record.status.toLowerCase().includes(normalizedQuery) ||
        metadataText.includes(normalizedQuery);

      const isConflict = record.annotations >= requiredAnnotations && !record.expert_validated;
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && record.annotations < requiredAnnotations) ||
        (filter === "validated" && record.expert_validated) ||
        (filter === "conflict" && isConflict);

      return matchesQuery && matchesFilter;
    });
  }, [datasetRecords, filter, query]);

  const readyRecords = datasetMetrics?.validated ?? datasetRecords.filter((record) => record.expert_validated).length;
  const conflictRecords =
    datasetMetrics?.conflicts ??
    datasetRecords.filter((record) => record.annotations >= requiredAnnotations && !record.expert_validated).length;
  const pendingRecords = datasetMetrics?.pending ?? datasetRecords.filter((record) => record.annotations < requiredAnnotations).length;
  const jsonlExample = datasetJsonlRecords[0] ?? null;

  useEffect(() => {
    setDatasetRecords(records);
    setDatasetJsonlRecords(jsonlRecords);
    setDatasetMetrics(metrics);
  }, [jsonlRecords, metrics, records]);

  useEffect(() => {
    async function refreshDataset() {
      const [nextRecords, nextJsonlRecords, nextMetrics] = await Promise.all([
        fetchDatasetRecords(),
        fetchJsonlRecords(),
        fetchDatasetMetrics(),
      ]);
      setDatasetRecords(nextRecords);
      setDatasetJsonlRecords(nextJsonlRecords);
      setDatasetMetrics(nextMetrics);
    }

    window.addEventListener("agrocafellm:image-uploaded", refreshDataset);
    return () => window.removeEventListener("agrocafellm:image-uploaded", refreshDataset);
  }, []);

  function downloadText(filename: string, content: string, type = "application/json") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleExport(formatId: string) {
    if (formatId === "jsonl") {
      const lines = datasetJsonlRecords.map((record) => JSON.stringify(record)).join("\n");
      downloadText("agrocafellm-dataset.jsonl", lines ? `${lines}\n` : "", "application/x-ndjson");
      return;
    }

    if (formatId === "csv") {
      const header =
        "image_id,specimen_code,status,annotations,consensus,expert_validated,final_diagnosis,region,farm,variety,width,height\n";
      const rows = datasetRecords
        .map((record) =>
          [
            record.image_id,
            record.specimen_code,
            record.status,
            record.annotations,
            record.consensus,
            record.expert_validated,
            record.final_diagnosis ?? "",
            record.region ?? "",
            record.farm ?? "",
            record.variety ?? "",
            record.width ?? "",
            record.height ?? "",
          ]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(",")
        )
        .join("\n");
      downloadText("agrocafellm-dataset.csv", `${header}${rows}\n`, "text/csv");
      return;
    }

    downloadText(
      formatId === "llava" ? "agrocafellm-llava.json" : "agrocafellm-dataset.json",
      JSON.stringify(datasetRecords, null, 2)
    );
  }

  return (
    <div className="space-y-6">
      {apiError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Backend no disponible: no se mostrarán datos de demostración. {apiError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ImageIcon}
          label="Imágenes cargadas"
          value={String(datasetMetrics?.images ?? datasetRecords.length)}
          sub={`${pendingRecords} pendientes`}
        />
        <StatCard
          icon={UserIcon}
          label="Expertos activos"
          value={String(datasetMetrics?.active_experts ?? 0)}
          sub={`${datasetMetrics?.experts ?? 0} registrados`}
        />
        <StatCard icon={CheckIcon} label="Registros validados" value={String(readyRecords)} sub="con consenso suficiente" />
        <StatCard icon={AlertIcon} label="Casos conflictivos" value={String(conflictRecords)} sub="sin consenso suficiente" />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-12">
        <Card className="2xl:col-span-7">
          <CardContent className="p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Exportación para entrenamiento</h3>
                <p className="text-sm text-slate-500">Registros multimodales derivados de anotación semántica experta.</p>
              </div>
              <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                PostgreSQL como fuente de verdad
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {exportFormats.map((format) => {
                const disabled = format.id === "jsonl" ? datasetJsonlRecords.length === 0 : !hasRecords;

                return (
                  <div key={format.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <DatabaseIcon className="mb-3 h-7 w-7 text-emerald-700" />
                    <p className="font-bold text-slate-950">{format.name}</p>
                    <p className="mt-1 min-h-10 text-xs text-slate-500">{format.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {format.id === "jsonl" ? datasetJsonlRecords.length : datasetRecords.length} registros
                      </span>
                      <Button variant="outline" className="px-3" onClick={() => handleExport(format.id)} disabled={disabled}>
                        Exportar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-canopy-900 text-white 2xl:col-span-5">
          <CardContent className="p-6">
            <h3 className="mb-4 text-xl font-bold">Ejemplo de registro JSONL</h3>
            {jsonlExample ? (
              <pre className="max-h-[390px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-emerald-100 shadow-inner">
                {JSON.stringify(jsonlExample, null, 2)}
              </pre>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-emerald-50">
                Aún no hay anotaciones exportables. Cuando un experto guarde juicios, aquí aparecerá un ejemplo real.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Banco curado de imágenes foliares</h3>
              <p className="text-sm text-slate-500">Trazabilidad entre imagen depurada, metadatos clínicos y juicio experto.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500"
                placeholder="Buscar código, estado, región o diagnóstico"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500"
                value={filter}
                onChange={(event) => setFilter(event.target.value as DatasetFilter)}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="validated">Validados</option>
                <option value="conflict">Conflictivos</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[1.35fr_1fr_1fr_1fr_0.8fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
              <span>Imagen</span>
              <span>Diagnóstico</span>
              <span>Metadatos</span>
              <span>Consenso</span>
              <span>Estado</span>
            </div>

            {filteredRecords.map((record) => {
              const progress = Math.min(100, Math.round((record.annotations / requiredAnnotations) * 100));

              return (
                <div
                  key={record.image_id}
                  className="grid gap-3 border-t border-slate-200 px-4 py-4 text-sm lg:grid-cols-[1.35fr_1fr_1fr_1fr_0.8fr] lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {record.preview_url ? (
                        <img src={record.preview_url} alt={record.specimen_code} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">IMG</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950">{record.specimen_code}</p>
                      <p className="truncate text-xs text-slate-500">{record.processed_path ?? record.original_path}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {record.final_diagnosis ?? (record.annotations > 0 ? "En consenso" : "Pendiente de juicio")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {record.annotations}/{requiredAnnotations} anotaciones
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-700">{record.region ?? "Sin región registrada"}</p>
                    <p className="text-xs text-slate-500">{[record.farm, record.variety].filter(Boolean).join(" · ") || "Sin finca/variedad"}</p>
                    {record.metadata_symptoms.length > 0 ? (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">{record.metadata_symptoms.join(", ")}</p>
                    ) : null}
                  </div>
                  <div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${record.expert_validated ? "bg-emerald-600" : "bg-amber-400"}`}
                        style={{ width: `${record.annotations > 0 ? Math.max(progress, 8) : 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {record.annotations > 0 ? `${Math.round(record.consensus * 100)}% consenso` : `${progress}% avance`}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        record.expert_validated ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {record.expert_validated ? "Validada" : record.annotations >= requiredAnnotations ? "Conflictiva" : "Pendiente"}
                    </span>
                  </div>
                </div>
              );
            })}

            {hasRecords && filteredRecords.length === 0 ? (
              <div className="border-t border-slate-200 px-4 py-10 text-center">
                <p className="font-bold text-slate-950">No hay registros con esos filtros</p>
                <p className="mt-1 text-sm text-slate-500">Ajusta la búsqueda o cambia el estado seleccionado.</p>
              </div>
            ) : null}

            {!hasRecords ? (
              <div className="border-t border-slate-200 px-4 py-10 text-center">
                <p className="font-bold text-slate-950">Todavía no hay imágenes en el dataset</p>
                <p className="mt-1 text-sm text-slate-500">
                  {apiError
                    ? "No se pudo consultar el backend. Cuando vuelva a estar disponible se cargarán los registros reales."
                    : "Sube hojas desde la barra superior para empezar la curación experta."}
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
