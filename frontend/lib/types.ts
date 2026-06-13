export type ScreenId = "expert-judgment" | "dataset";

export type Deficiency =
  | "Nitrogeno (N)"
  | "Fosforo (P)"
  | "Potasio (K)"
  | "Magnesio (Mg)"
  | "Hierro (Fe)"
  | "Zinc (Zn)"
  | "Boro (B)"
  | "No determinado";

export type Severity = "Leve" | "Moderada" | "Severa" | "Critica";
export type ImageQuality = "Alta" | "Media" | "Baja";
export type AnnotationStatus = "Pendiente" | "En consenso" | "Validada" | "Rechazada";

export interface Expert {
  id: string;
  name: string;
  role: string;
  level: number;
  xp: number;
  nextLevelXp: number;
}

export interface LeafImage {
  id: string;
  specimenCode: string;
  url: string;
  leafStage: string;
  quality: ImageQuality;
  status: AnnotationStatus;
  width: number;
  height: number;
  storagePath: string;
}

export interface ClinicalMetadata {
  region: string;
  farm: string;
  variety: string;
  captureDate: string;
  symptoms: string[];
}

export interface ExpertAnnotation {
  id: string;
  imageId: string;
  expertId: string;
  deficiency: Deficiency;
  severity: Severity;
  confidence: number;
  symptoms: string[];
  clinicalDescription: string;
  consensus: number;
  expertValidated: boolean;
}

export interface DatasetRecord {
  id: string;
  image: LeafImage;
  metadata: ClinicalMetadata;
  annotation: ExpertAnnotation;
  exportReady: boolean;
}

export interface DatasetExportFormat {
  id: string;
  name: string;
  description: string;
  recordCount: number;
}
