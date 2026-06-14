"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "@/components/icons";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const specimenCode = window.prompt("Código de imagen foliar", defaultSpecimenCode());
    if (!specimenCode) {
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(
        `${getApiBaseUrl()}/images?specimen_code=${encodeURIComponent(specimenCode.trim())}`,
        {
          method: "POST",
          body: formData,
        }
      );

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
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
      <Button disabled={isUploading} onClick={() => inputRef.current?.click()}>
        <UploadIcon className="h-4 w-4" />
        {isUploading ? "Subiendo..." : "Subir hojas"}
      </Button>
      {message ? <p className="max-w-48 text-xs font-medium text-slate-500">{message}</p> : null}
    </div>
  );
}
