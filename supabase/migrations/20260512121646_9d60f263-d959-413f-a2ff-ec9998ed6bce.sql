
CREATE TABLE public.audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id text NOT NULL UNIQUE,
  auditor_id text,
  auditor_name text,
  audit_type text,
  branch_name text,
  audit_period_from date,
  audit_period_to date,
  audit_start_date date,
  audit_end_date date,
  schedule_approve_date date,
  status text DEFAULT 'scheduled',
  workflow_stage text DEFAULT 'draft',
  audit_score numeric,
  audit_rating text,
  checkpoints jsonb NOT NULL DEFAULT '[]'::jsonb,
  audit_trail jsonb NOT NULL DEFAULT '[]'::jsonb,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  deferral_reason text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audits" ON public.audits FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audits" ON public.audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update audits" ON public.audits FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER audits_set_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
