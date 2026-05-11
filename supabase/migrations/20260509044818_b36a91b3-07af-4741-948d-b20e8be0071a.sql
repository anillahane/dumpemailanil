CREATE TABLE public.audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id text NOT NULL UNIQUE,
  auditor_id text,
  auditor_name text,
  audit_type text,
  branch_name text,
  audit_period_from text,
  audit_period_to text,
  audit_start_date text,
  audit_end_date text,
  schedule_approve_date text,
  status text DEFAULT 'scheduled',
  deferral_reason text,
  remarks text,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  checkpoints jsonb NOT NULL DEFAULT '[]'::jsonb,
  audit_score numeric,
  audit_rating text,
  workflow_stage text DEFAULT 'draft',
  audit_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on audits" ON public.audits FOR SELECT USING (true);
CREATE POLICY "Allow all insert on audits" ON public.audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on audits" ON public.audits FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on audits" ON public.audits FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER audits_set_updated_at
BEFORE UPDATE ON public.audits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_audits_status ON public.audits(status);
CREATE INDEX idx_audits_audit_id ON public.audits(audit_id);