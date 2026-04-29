-- Migración: tabla actas_visita
-- Ejecutar en Supabase SQL Editor

-- Secuencia para folio correlativo anual (reinicia si se desea por año;
-- para máxima simplicidad usamos una secuencia global y el año lo pone el trigger)
CREATE SEQUENCE IF NOT EXISTS public.actas_visita_folio_seq START 1;

CREATE TABLE IF NOT EXISTS public.actas_visita (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text UNIQUE NOT NULL DEFAULT '',
  tipo_acta text NOT NULL CHECK (tipo_acta IN ('asesoria', 'observacion', 'reunion', 'solicitud')),
  establecimiento_id text NOT NULL,
  establecimiento_nombre text,
  establecimiento_rbd text,
  establecimiento_comuna text,
  fecha_visita date NOT NULL,
  hora_inicio time NOT NULL,
  hora_termino time NOT NULL,
  participantes jsonb NOT NULL DEFAULT '[]'::jsonb,
  temas_anteriores text,
  actividad_realizada text,
  acuerdos jsonb NOT NULL DEFAULT '[]'::jsonb,
  pdf_path text,
  pdf_url text,
  estado text NOT NULL DEFAULT 'Registrada',
  created_by uuid NULL,
  created_by_nombre text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Función que genera el folio automáticamente antes de cada inserción
CREATE OR REPLACE FUNCTION public.generar_folio_acta()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := 'ACTA-' || to_char(now(), 'YYYY') || '-' ||
                 LPAD(nextval('public.actas_visita_folio_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_actas_visita_folio ON public.actas_visita;

CREATE TRIGGER trg_actas_visita_folio
  BEFORE INSERT ON public.actas_visita
  FOR EACH ROW EXECUTE FUNCTION public.generar_folio_acta();

CREATE INDEX IF NOT EXISTS idx_actas_visita_tipo_acta
  ON public.actas_visita (tipo_acta);

CREATE INDEX IF NOT EXISTS idx_actas_visita_establecimiento
  ON public.actas_visita (establecimiento_id);

CREATE INDEX IF NOT EXISTS idx_actas_visita_fecha
  ON public.actas_visita (fecha_visita DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_actas_visita_updated_at ON public.actas_visita;

CREATE TRIGGER trg_actas_visita_updated_at
  BEFORE UPDATE ON public.actas_visita
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.actas_visita ENABLE ROW LEVEL SECURITY;

-- Lectura pública (igual que la tabla de escuelas, sin auth por ahora)
DROP POLICY IF EXISTS "lectura publica actas" ON public.actas_visita;
CREATE POLICY "lectura publica actas"
  ON public.actas_visita
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Inserción pública (sin auth por ahora)
DROP POLICY IF EXISTS "insercion publica actas" ON public.actas_visita;
CREATE POLICY "insercion publica actas"
  ON public.actas_visita
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Actualización pública (para actualizar pdf_path / pdf_url)
DROP POLICY IF EXISTS "actualizacion publica actas" ON public.actas_visita;
CREATE POLICY "actualizacion publica actas"
  ON public.actas_visita
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Bucket actas-visita
INSERT INTO storage.buckets (id, name, public)
VALUES ('actas-visita', 'actas-visita', true)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage
DROP POLICY IF EXISTS "actas visita upload" ON storage.objects;
CREATE POLICY "actas visita upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'actas-visita');

DROP POLICY IF EXISTS "actas visita read" ON storage.objects;
CREATE POLICY "actas visita read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'actas-visita');
