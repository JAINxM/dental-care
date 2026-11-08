CREATE TABLE IF NOT EXISTS legacy_data_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file text NOT NULL,
  record_index integer NOT NULL,
  record jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_file,record_index)
);
