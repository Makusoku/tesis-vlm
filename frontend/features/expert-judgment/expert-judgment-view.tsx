"use client";

import { useCallback, useEffect, useState } from "react";
import { deficiencies, symptomCatalog } from "@/lib/mock-data";
import type { Deficiency, ImageQuality, Severity } from "@/lib/types";
import type { ApiPendingImage } from "@/lib/api";
import { createAnnotation, ensureExpert, fetchPendingImage } from "@/lib/api";
import { ArrowRightIcon, ClipboardIcon, ImageIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const severities: Severity[] = ["Leve", "Moderada", "Severa", "Critica"];
const qualities: ImageQuality[] = ["Alta", "Media", "Baja"];
const zoomLevels = [1, 1.5, 2];
const contrastLevels = [1, 1.25, 1.5];

interface ExpertJudgmentViewProps {
  expertName: string;
  expertAliases?: string[];
  pendingImage?: ApiPendingImage | null;
  apiError?: string | null;
}

export function ExpertJudgmentView({
  expertName,
  expertAliases = [],
  pendingImage = null,
  apiError = null,
}: ExpertJudgmentViewProps) {
  const [currentPendingImage, setCurrentPendingImage] = useState<ApiPendingImage | null>(pendingImage);
  const [selectedDeficiency, setSelectedDeficiency] = useState<Deficiency>("Magnesio (Mg)");
  const [severity, setSeverity] = useState<Severity>("Moderada");
  const [quality, setQuality] = useState<ImageQuality>("Alta");
  const [confidence, setConfidence] = useState(82);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "Clorosis intervenal",
    "Amarillamiento en hojas adultas",
    "Nervaduras verdes",
  ]);
  const [description, setDescription] = useState(
    "El patrón de clorosis intervenal en hojas adultas sugiere deficiencia de magnesio. Las nervaduras permanecen relativamente verdes, diferenciándose de un amarillamiento generalizado por nitrógeno."
  );
  const [zoomIndex, setZoomIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [contrastIndex, setContrastIndex] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const imageSrc = currentPendingImage?.preview_url;
  const specimenCode = currentPendingImage?.specimen_code ?? "Sin imagen asignada";
  const imageStatus = currentPendingImage
    ? "Pendiente de juicio experto"
    : isLoadingImage
      ? "Actualizando cola"
      : apiError
        ? "Backend no disponible"
        : "Sin imagen pendiente";
  const canSave = Boolean(currentPendingImage);
  const zoom = zoomLevels[zoomIndex];
  const contrast = contrastLevels[contrastIndex];
  const canPan = zoom > 1;

  const loadPendingImage = useCallback(async () => {
    setIsLoadingImage(true);
    try {
      const nextPendingImage = await fetchPendingImage(expertName, "Analista agronómico", expertAliases);
      setCurrentPendingImage(nextPendingImage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la cola de imágenes.");
    } finally {
      setIsLoadingImage(false);
    }
  }, [expertAliases, expertName]);

  useEffect(() => {
    setCurrentPendingImage(pendingImage);
  }, [pendingImage]);

  useEffect(() => {
    window.addEventListener("agrocafellm:image-uploaded", loadPendingImage);
    return () => window.removeEventListener("agrocafellm:image-uploaded", loadPendingImage);
  }, [loadPendingImage]);

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]
    );
  }

  function cycleZoom() {
    setZoomIndex((current) => {
      const next = (current + 1) % zoomLevels.length;
      if (zoomLevels[next] === 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!canPan) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart || dragStart.pointerId !== event.pointerId) {
      return;
    }

    setPan({
      x: dragStart.panX + event.clientX - dragStart.x,
      y: dragStart.panY + event.clientY - dragStart.y,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStart?.pointerId === event.pointerId) {
      setDragStart(null);
    }
  }

  async function handleSave() {
    if (!currentPendingImage) {
      setMessage("No hay una imagen pendiente real para anotar.");
      return;
    }

    const clinicalDescription = description.trim();
    if (clinicalDescription.length < 10) {
      setMessage("La descripción clínica debe tener al menos 10 caracteres.");
      return;
    }

    if (selectedSymptoms.length === 0) {
      setMessage("Marca al menos un síntoma visible antes de guardar.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const expert = await ensureExpert(expertName, "Analista agronómico", expertAliases);
      await createAnnotation({
        image_id: currentPendingImage.image_id,
        expert_id: expert.id,
        deficiency: selectedDeficiency,
        severity,
        confidence,
        symptoms: selectedSymptoms,
        clinical_description: clinicalDescription,
      });

      setMessage("Juicio experto guardado correctamente.");
      await loadPendingImage();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el juicio experto.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-12">
      <section className="2xl:col-span-7">
        <Card className="overflow-hidden">
          <CardContent>
            {apiError ? (
              <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-900">
                Backend no disponible: no se puede cargar una imagen pendiente. {apiError}
              </div>
            ) : null}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500">Imagen asignada</p>
                <h3 className="text-lg font-bold text-slate-950">{specimenCode} · Hoja foliar</h3>
              </div>
              <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {imageStatus}
              </span>
            </div>

            <div className="bg-slate-100 p-5">
              {imageSrc ? (
                <>
                  <div className="mb-4 rounded-2xl bg-white/85 p-3 shadow-sm">
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-950">
                      <ImageIcon className="h-4 w-4 text-emerald-700" />
                      Zona visible sugerida
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Registre síntomas y ubique si la afectación aparece en bordes, nervaduras o lámina foliar.
                    </p>
                  </div>
                  <div
                    className={`relative h-[420px] touch-none overflow-hidden rounded-2xl shadow-inner md:h-[560px] ${
                      canPan ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onDoubleClick={() => {
                      setPan({ x: 0, y: 0 });
                      setZoomIndex(0);
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt="Hoja de café para anotación experta"
                      draggable={false}
                      className="h-full w-full select-none object-contain transition duration-300"
                      style={{
                        filter: `contrast(${contrast})`,
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      className="min-h-10 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-emerald-50"
                      type="button"
                      onClick={cycleZoom}
                      aria-label="Cambiar zoom de la imagen"
                    >
                      Zoom {zoom === 1 ? "1x" : `${zoom}x`}
                    </button>
                    <button
                      className="min-h-10 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-emerald-50"
                      type="button"
                      onClick={() => setRotation((current) => (current + 90) % 360)}
                      aria-label="Rotar imagen 90 grados"
                    >
                      Rotar {rotation}°
                    </button>
                    <button
                      className="min-h-10 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-emerald-50"
                      type="button"
                      onClick={() => setContrastIndex((current) => (current + 1) % contrastLevels.length)}
                      aria-label="Cambiar contraste de la imagen"
                    >
                      Contraste {Math.round(contrast * 100)}%
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center md:min-h-[560px]">
                  <ImageIcon className="h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-lg font-bold text-slate-950">
                    {apiError ? "No se pudo cargar la cola" : "No hay imágenes pendientes"}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    {apiError
                      ? "Revisa que el backend esté encendido y que pueda conectarse con PostgreSQL y Storage."
                      : "Sube nuevas hojas o espera a que otros expertos completen nuevas imágenes para consenso."}
                  </p>
                </div>
              )}
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

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-slate-500">Confianza experta</label>
                <span className="text-xs font-bold text-emerald-700">{confidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(event) => setConfidence(Number(event.target.value))}
                className="mt-2 w-full accent-emerald-700"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 text-lg font-bold text-slate-950">Síntomas visibles</h3>
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
            <h3 className="mb-3 text-lg font-bold text-slate-950">Descripción clínica del experto</h3>
            <textarea
              className="h-28 w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm outline-none transition focus:border-emerald-500"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="mt-4 rounded-2xl bg-canopy-50 p-3 text-xs text-slate-600">
              <b className="text-slate-950">Registro actual:</b> {selectedDeficiency}, severidad {severity.toLowerCase()},
              imagen de calidad {quality.toLowerCase()}, {selectedSymptoms.length} síntomas marcados, confianza {confidence}%.
            </div>
            {message ? (
              <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-medium text-slate-600">{message}</p>
            ) : null}
            <Button className="mt-4 w-full" disabled={isSaving || !canSave} onClick={handleSave}>
              {isSaving ? "Guardando..." : "Guardar juicio y siguiente"}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
