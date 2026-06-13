CREATE TABLE IF NOT EXISTS experts (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaf_images (
  id UUID PRIMARY KEY,
  specimen_code VARCHAR(60) UNIQUE NOT NULL,
  original_path TEXT NOT NULL,
  processed_path TEXT,
  width INTEGER,
  height INTEGER,
  color_mode VARCHAR(30),
  image_format VARCHAR(30),
  status VARCHAR(40) NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_metadata (
  id UUID PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES leaf_images(id) ON DELETE CASCADE,
  region VARCHAR(120),
  farm VARCHAR(120),
  variety VARCHAR(120),
  symptoms TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES leaf_images(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE RESTRICT,
  deficiency VARCHAR(80) NOT NULL,
  severity VARCHAR(40) NOT NULL,
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  clinical_description TEXT NOT NULL,
  consensus DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (consensus >= 0 AND consensus <= 1),
  expert_validated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset_exports (
  id UUID PRIMARY KEY,
  format VARCHAR(40) NOT NULL,
  record_count INTEGER NOT NULL,
  export_path TEXT,
  export_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
