import type {
  ClinicalMetadata,
  DatasetExportFormat,
  DatasetRecord,
  Deficiency,
  Expert,
  ExpertAnnotation,
  LeafImage,
} from "./types";

export const expert: Expert = {
  id: "exp-001",
  name: "Experto validador",
  role: "Analista Agronomico",
  level: 3,
  xp: 680,
  nextLevelXp: 1000,
};

export const deficiencies: Deficiency[] = [
  "Nitrogeno (N)",
  "Fosforo (P)",
  "Potasio (K)",
  "Magnesio (Mg)",
  "Hierro (Fe)",
  "Zinc (Zn)",
  "Boro (B)",
  "No determinado",
];

export const symptomCatalog = [
  "Clorosis intervenal",
  "Amarillamiento en hojas adultas",
  "Nervaduras verdes",
  "Necrosis marginal",
  "Manchas oscuras",
  "Bordes quemados",
  "Deformacion foliar",
  "Moteado irregular",
];

export const leafImage: LeafImage = {
  id: "img-00045",
  specimenCode: "IMG-CAF-00045",
  url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=85",
  leafStage: "Hoja madura",
  quality: "Alta",
  status: "En consenso",
  width: 1200,
  height: 800,
  storagePath: "local://uploads/img-caf-00045.jpg",
};

export const clinicalMetadata: ClinicalMetadata = {
  region: "Villa Rica, Peru",
  farm: "Parcela demostrativa",
  variety: "Caturra",
  captureDate: "2026-05-28",
  symptoms: ["Clorosis intervenal", "Nervaduras verdes", "Amarillamiento en hojas adultas"],
};

export const currentAnnotation: ExpertAnnotation = {
  id: "ann-00045-ev",
  imageId: leafImage.id,
  expertId: expert.id,
  deficiency: "Magnesio (Mg)",
  severity: "Moderada",
  confidence: 82,
  symptoms: clinicalMetadata.symptoms,
  clinicalDescription:
    "El patron de clorosis intervenal en hojas adultas sugiere deficiencia de magnesio. Las nervaduras permanecen relativamente verdes, diferenciandose de un amarillamiento generalizado por nitrogeno.",
  consensus: 0.86,
  expertValidated: true,
};

export const datasetRecords: DatasetRecord[] = [
  {
    id: "rec-00045",
    image: leafImage,
    metadata: clinicalMetadata,
    annotation: currentAnnotation,
    exportReady: true,
  },
  {
    id: "rec-00062",
    image: {
      ...leafImage,
      id: "img-00062",
      specimenCode: "IMG-CAF-00062",
      status: "Pendiente",
      quality: "Media",
      url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85",
      storagePath: "local://uploads/img-caf-00062.jpg",
    },
    metadata: {
      ...clinicalMetadata,
      region: "Chanchamayo, Peru",
      variety: "Bourbon",
      symptoms: ["Necrosis marginal", "Bordes quemados"],
    },
    annotation: {
      ...currentAnnotation,
      id: "ann-00062-ev",
      imageId: "img-00062",
      deficiency: "Potasio (K)",
      severity: "Severa",
      consensus: 0.61,
      expertValidated: false,
    },
    exportReady: false,
  },
  {
    id: "rec-00087",
    image: {
      ...leafImage,
      id: "img-00087",
      specimenCode: "IMG-CAF-00087",
      status: "Validada",
      url: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=1200&q=85",
      storagePath: "local://uploads/img-caf-00087.jpg",
    },
    metadata: {
      ...clinicalMetadata,
      region: "Satipo, Peru",
      farm: "Lote experimental norte",
      symptoms: ["Moteado irregular", "Deformacion foliar"],
    },
    annotation: {
      ...currentAnnotation,
      id: "ann-00087-ev",
      imageId: "img-00087",
      deficiency: "Zinc (Zn)",
      severity: "Leve",
      consensus: 0.91,
    },
    exportReady: true,
  },
];

export const exportFormats: DatasetExportFormat[] = [
  {
    id: "jsonl",
    name: "JSONL para fine-tuning",
    description: "Mensajes multimodales con trazabilidad, diagnostico y consenso.",
    recordCount: 812,
  },
  {
    id: "llava",
    name: "Formato LLaVA multimodal",
    description: "Referencia de imagen, prompt clinico y respuesta validada.",
    recordCount: 640,
  },
  {
    id: "csv",
    name: "CSV estadistico",
    description: "Variables tabulares para analisis descriptivo y control de calidad.",
    recordCount: 1248,
  },
  {
    id: "json",
    name: "JSON completo",
    description: "Registro integral con metadatos, sintomas y experto responsable.",
    recordCount: 812,
  },
];
