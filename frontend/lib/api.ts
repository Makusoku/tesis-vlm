export interface ApiDatasetRecord {
  image_id: string;
  specimen_code: string;
  original_path: string;
  processed_path: string | null;
  status: string;
  annotations: number;
  consensus: number;
  expert_validated: boolean;
  final_diagnosis: string | null;
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

export interface ApiPendingImage extends ApiDatasetRecord {
  preview_url: string;
}

export interface ApiExpert {
  id: string;
  name: string;
  role: string;
}

export interface ApiAnnotationPayload {
  image_id: string;
  expert_id: string;
  deficiency: string;
  severity: string;
  confidence: number;
  symptoms: string[];
  clinical_description: string;
  consensus?: number;
  expert_validated?: boolean;
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

export async function fetchPendingImage(expertName?: string, role = "Analista agronómico"): Promise<ApiPendingImage | null> {
  const params = new URLSearchParams();
  if (expertName) {
    params.set("expert_name", expertName);
    params.set("role", role);
  }

  const query = params.toString();
  const response = await fetch(`${getApiBaseUrl()}/images/pending${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar una imagen pendiente (${response.status})`);
  }

  return response.json();
}

export async function ensureExpert(name: string, role = "Analista agronómico"): Promise<ApiExpert> {
  const response = await fetch(`${getApiBaseUrl()}/experts/ensure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, role }),
  });

  if (!response.ok) {
    throw new Error(`No se pudo preparar el experto (${response.status})`);
  }

  return response.json();
}

export async function createAnnotation(payload: ApiAnnotationPayload) {
  const response = await fetch(`${getApiBaseUrl()}/annotations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`No se pudo guardar el juicio experto (${response.status})`);
  }

  return response.json();
}
