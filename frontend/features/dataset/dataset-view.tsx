import { AlertIcon, CheckIcon, DatabaseIcon, ImageIcon, UserIcon } from "@/components/icons";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { datasetRecords, exportFormats } from "@/lib/mock-data";

const jsonlExample = {
  image: "s3://agrocafellm/processed/IMG-CAF-00045.jpg",
  messages: [
    {
      role: "user",
      content: "Que deficiencia nutricional presenta esta hoja de cafe?",
    },
    {
      role: "assistant",
      content:
        "Presenta sintomas compatibles con deficiencia de magnesio: clorosis intervenal en hojas adultas, nervaduras parcialmente verdes y severidad moderada.",
    },
  ],
  metadata: {
    consensus: 0.86,
    confidence: 82,
    expert_validated: true,
    deficiency: "Magnesio (Mg)",
    source_table: "annotations",
  },
};

export function DatasetView() {
  const readyRecords = datasetRecords.filter((record) => record.exportReady).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ImageIcon} label="Imagenes cargadas" value="1,248" sub="327 pendientes" />
        <StatCard icon={UserIcon} label="Expertos activos" value="24" sub="8 esta semana" />
        <StatCard icon={CheckIcon} label="Registros validados" value="812" sub={`${readyRecords} listos en muestra mock`} />
        <StatCard icon={AlertIcon} label="Casos conflictivos" value="93" sub="Requieren consenso" />
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-12">
        <Card className="2xl:col-span-7">
          <CardContent className="p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Exportacion para entrenamiento</h3>
                <p className="text-sm text-slate-500">Registros multimodales derivados de anotacion semantica experta.</p>
              </div>
              <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                PostgreSQL como fuente de verdad
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {exportFormats.map((format) => (
                <div key={format.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <DatabaseIcon className="mb-3 h-7 w-7 text-emerald-700" />
                  <p className="font-bold text-slate-950">{format.name}</p>
                  <p className="mt-1 min-h-10 text-xs text-slate-500">{format.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500">{format.recordCount} registros</span>
                    <Button variant="outline" className="px-3">
                      Exportar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-canopy-900 text-white 2xl:col-span-5">
          <CardContent className="p-6">
            <h3 className="mb-4 text-xl font-bold">Ejemplo de registro JSONL</h3>
            <pre className="max-h-[390px] overflow-auto rounded-2xl bg-black/25 p-4 text-xs leading-relaxed text-emerald-50">
              {JSON.stringify(jsonlExample, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Banco curado de imagenes foliares</h3>
              <p className="text-sm text-slate-500">Trazabilidad entre imagen depurada, metadatos clinicos y juicio experto.</p>
            </div>
            <Button variant="outline">Ver auditoria</Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
              <span>Imagen</span>
              <span>Diagnostico</span>
              <span>Metadatos</span>
              <span>Consenso</span>
              <span>Estado</span>
            </div>
            {datasetRecords.map((record) => (
              <div
                key={record.id}
                className="grid gap-3 border-t border-slate-200 px-4 py-4 text-sm lg:grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr] lg:items-center"
              >
                <div>
                  <p className="font-bold text-slate-950">{record.image.specimenCode}</p>
                  <p className="text-xs text-slate-500">{record.image.storagePath}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{record.annotation.deficiency}</p>
                  <p className="text-xs text-slate-500">Severidad {record.annotation.severity}</p>
                </div>
                <div>
                  <p className="text-slate-700">{record.metadata.region}</p>
                  <p className="text-xs text-slate-500">{record.metadata.variety}</p>
                </div>
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${record.annotation.consensus * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{Math.round(record.annotation.consensus * 100)}%</p>
                </div>
                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      record.exportReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {record.exportReady ? "Listo" : "Revision"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
