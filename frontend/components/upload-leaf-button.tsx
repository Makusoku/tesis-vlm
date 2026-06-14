"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";

function defaultSpecimenCode() {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return `IMG-CAF-${timestamp}`;
}

export function UploadLeafButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [specimenCode, setSpecimenCode] = useState(defaultSpecimenCode);
  const [region, setRegion] = useState("");
  const [farm, setFarm] = useState("");
  const [variety, setVariety] = useState("");
  const [symptoms, setSymptoms] = useState("");

  function resetForm() {
    setFile(null);
    setSpecimenCode(defaultSpecimenCode());
    setRegion("");
    setFarm("");
    setVariety("");
    setSymptoms("");
  }

  function closeModal() {
    if (!isUploading) {
      setIsOpen(false);
      resetForm();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setMessage("Selecciona una imagen foliar.");
      return;
    }

    if (!specimenCode.trim()) {
      setMessage("Ingresa un código de imagen.");
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("specimen_code", specimenCode.trim());
      formData.append("file", file);

      if (region.trim()) {
        formData.append("region", region.trim());
      }
      if (farm.trim()) {
        formData.append("farm", farm.trim());
      }
      if (variety.trim()) {
        formData.append("variety", variety.trim());
      }
      if (symptoms.trim()) {
        formData.append("symptoms", symptoms.trim());
      }

      const uploadResponse = await fetch(`${getApiBaseUrl()}/images`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`No se pudo subir la imagen (${uploadResponse.status})`);
      }

      const image = (await uploadResponse.json()) as { id: string };
      const preprocessResponse = await fetch(`${getApiBaseUrl()}/images/${image.id}/preprocess`, {
        method: "POST",
      });

      if (!preprocessResponse.ok) {
        throw new Error(`La imagen subió, pero no se pudo preprocesar (${preprocessResponse.status})`);
      }

      setMessage("Imagen subida y preprocesada");
      setIsOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button disabled={isUploading} onClick={() => setIsOpen(true)}>
        <UploadIcon className="h-4 w-4" />
        {isUploading ? "Subiendo..." : "Subir hojas"}
      </Button>
      {message ? <p className="max-w-48 text-xs font-medium text-slate-500">{message}</p> : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <form
            className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl"
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Subir imagen foliar</h2>
                <p className="mt-1 text-sm text-slate-500">Registra la imagen y sus metadatos clínicos iniciales.</p>
              </div>
              <button
                aria-label="Cerrar formulario"
                className="rounded-2xl bg-slate-100 p-3 text-slate-700 transition hover:bg-slate-200"
                disabled={isUploading}
                onClick={closeModal}
                type="button"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-xs font-semibold text-slate-500">Imagen</span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  required
                  type="file"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-xs font-semibold text-slate-500">Código de imagen</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-500"
                  onChange={(event) => setSpecimenCode(event.target.value)}
                  required
                  value={specimenCode}
                />
              </label>

              <label>
                <span className="text-xs font-semibold text-slate-500">Región</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-500"
                  onChange={(event) => setRegion(event.target.value)}
                  placeholder="Ej. Chanchamayo"
                  value={region}
                />
              </label>

              <label>
                <span className="text-xs font-semibold text-slate-500">Finca</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-500"
                  onChange={(event) => setFarm(event.target.value)}
                  placeholder="Ej. Parcela 03"
                  value={farm}
                />
              </label>

              <label>
                <span className="text-xs font-semibold text-slate-500">Variedad</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-500"
                  onChange={(event) => setVariety(event.target.value)}
                  placeholder="Ej. Caturra"
                  value={variety}
                />
              </label>

              <label>
                <span className="text-xs font-semibold text-slate-500">Síntomas iniciales</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-500"
                  onChange={(event) => setSymptoms(event.target.value)}
                  placeholder="clorosis, manchas"
                  value={symptoms}
                />
              </label>
            </div>

            {message ? (
              <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-medium text-slate-600">{message}</p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button disabled={isUploading} type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button disabled={isUploading} type="submit">
                <UploadIcon className="h-4 w-4" />
                {isUploading ? "Procesando..." : "Subir y preprocesar"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
