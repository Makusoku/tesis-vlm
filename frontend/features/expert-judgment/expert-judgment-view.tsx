"use client";

import Image from "next/image";
import { useState } from "react";
import { deficiencies, leafImage, symptomCatalog } from "@/lib/mock-data";
import type { Deficiency, ImageQuality, Severity } from "@/lib/types";
import { ArrowRightIcon, ClipboardIcon, ImageIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const severities: Severity[] = ["Leve", "Moderada", "Severa", "Critica"];
const qualities: ImageQuality[] = ["Alta", "Media", "Baja"];

export function ExpertJudgmentView() {
  const [selectedDeficiency, setSelectedDeficiency] = useState<Deficiency>("Magnesio (Mg)");
  const [severity, setSeverity] = useState<Severity>("Moderada");
  const [quality, setQuality] = useState<ImageQuality>("Alta");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "Clorosis intervenal",
    "Amarillamiento en hojas adultas",
    "Nervaduras verdes",
  ]);
  const [description, setDescription] = useState(
    "El patron de clorosis intervenal en hojas adultas sugiere deficiencia de magnesio. Las nervaduras permanecen relativamente verdes, diferenciandose de un amarillamiento generalizado por nitrogeno."
  );

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-12">
      <section className="2xl:col-span-7">
        <Card className="overflow-hidden">
          <CardContent>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500">Imagen asignada</p>
                <h3 className="text-lg font-bold text-slate-950">
                  {leafImage.specimenCode} · {leafImage.leafStage}
                </h3>
              </div>
              <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Pendiente de consenso
              </span>
            </div>

            <div className="relative bg-slate-100 p-5">
              <div className="relative h-[420px] overflow-hidden rounded-2xl shadow-inner md:h-[560px]">
                <Image src={leafImage.url} alt="Hoja de cafe para anotacion experta" fill className="object-cover" priority />
              </div>
              <div className="absolute left-8 top-8 max-w-xs rounded-2xl bg-white/90 p-3 shadow-md backdrop-blur">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-950">
                  <ImageIcon className="h-4 w-4 text-emerald-700" />
                  Zona visible sugerida
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Registre sintomas y ubique si la afectacion aparece en bordes, nervaduras o lamina foliar.
                </p>
              </div>
              <div className="absolute bottom-8 right-8 hidden gap-2 md:flex">
                {["Zoom", "Rotar", "Contraste", "Anotar"].map((action) => (
                  <button key={action} className="rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow-sm" type="button">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5 2xl:col-span-5">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardIcon className="h-5 w-5 text-emerald-700" />
              <h3 className="text-lg font-bold text-slate-950">Juicio experto estructurado</h3>
            </div>

            <label className="text-xs font-semibold text-slate-500">Deficiencia principal</label>
            <div className="mb-4 mt-2 grid grid-cols-2 gap-2">
              {deficiencies.map((deficiency) => (
                <button
                  key={deficiency}
                  onClick={() => setSelectedDeficiency(deficiency)}
                  className={`rounded-xl border px-3 py-2 text-xs transition ${
                    selectedDeficiency === deficiency
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50"
                  }`}
                  type="button"
                >
                  {deficiency}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">Severidad</label>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as Severity)}
                >
                  {severities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Calidad de imagen</label>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  value={quality}
                  onChange={(event) => setQuality(event.target.value as ImageQuality)}
                >
                  {qualities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 text-lg font-bold text-slate-950">Sintomas visibles</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {symptomCatalog.map((symptom) => (
                <label key={symptom} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(symptom)}
                    onChange={() => toggleSymptom(symptom)}
                    className="accent-emerald-700"
                  />
                  {symptom}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 text-lg font-bold text-slate-950">Descripcion clinica del experto</h3>
            <textarea
              className="h-28 w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm outline-none transition focus:border-emerald-500"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="mt-4 rounded-2xl bg-canopy-50 p-3 text-xs text-slate-600">
              <b className="text-slate-950">Registro actual:</b> {selectedDeficiency}, severidad {severity.toLowerCase()},
              imagen de calidad {quality.toLowerCase()}, {selectedSymptoms.length} sintomas marcados.
            </div>
            <Button className="mt-4 w-full">
              Guardar juicio y siguiente
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
