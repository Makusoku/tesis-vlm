export interface ApiDatasetRecord {
  image_id: string;
  specimen_code: string;
  original_path: string;
  processed_path: string | null;
  preview_url: string | null;
  status: string;
  annotations: number;
  consensus: number;
  expert_validated: boolean;
  final_diagnosis: string | null;
  region: string | null;
  farm: string | null;
  variety: string | null;
  metadata_symptoms: string[];
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

export interface ApiDatasetMetrics {
  images: number;
  experts: number;
  active_experts: number;
  validated: number;
  conflicts: number;
  pending: number;
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

export async function fetchDatasetMetrics(): Promise<ApiDatasetMetrics> {
  const response = await fetch(`${getApiBaseUrl()}/dataset/metrics`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudieron cargar las metricas del dataset (${response.status})`);
  }

  return response.json();
}

export async function fetchPendingImage(
  expertName?: string,
  role = "Analista agronómico",
  expertAliases: string[] = [],
  excludedImageIds: string[] = []
): Promise<ApiPendingImage | null> {
  const params = new URLSearchParams();
  if (expertName) {
    params.set("expert_name", expertName);
    params.set("role", role);
  }
  expertAliases.forEach((alias) => {
    if (alias.trim()) {
      params.append("expert_alias", alias);
    }
  });
  excludedImageIds.forEach((imageId) => {
    if (imageId.trim()) {
      params.append("exclude_image_id", imageId);
    }
  });

  const query = params.toString();
  const response = await fetch(`${getApiBaseUrl()}/images/pending${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar una imagen pendiente (${response.status})`);
  }

  return response.json();
}

export async function ensureExpert(name: string, role = "Analista agronómico", aliases: string[] = []): Promise<ApiExpert> {
  const response = await fetch(`${getApiBaseUrl()}/experts/ensure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, role, aliases }),
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
    let detail = "";
    try {
      const errorBody = (await response.json()) as { detail?: unknown };
      detail = errorBody.detail ? `: ${JSON.stringify(errorBody.detail)}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`No se pudo guardar el juicio experto (${response.status})${detail}`);
  }

  return response.json();
}
