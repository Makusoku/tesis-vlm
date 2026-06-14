export interface ApiDatasetRecord {
  image_id: string;
  specimen_code: string;
  original_path: string;
  processed_path: string | null;
  status: string;
  annotations: number;
  width: number | null;
  height: number | null;
  color_mode: string | null;
  image_format: string | null;
}

export interface ApiJsonlRecord {
  image: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  metadata: Record<string, unknown>;
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export async function fetchDatasetRecords(): Promise<ApiDatasetRecord[]> {
  const response = await fetch(`${getApiBaseUrl()}/dataset`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el dataset (${response.status})`);
  }

  return response.json();
}

export async function fetchJsonlRecords(): Promise<ApiJsonlRecord[]> {
  const response = await fetch(`${getApiBaseUrl()}/dataset/export/jsonl`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar la exportacion JSONL (${response.status})`);
  }

  return response.json();
}
