
-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_minutes int NOT NULL DEFAULT 30,
  price_local numeric(10,2) NOT NULL DEFAULT 0,
  price_home numeric(10,2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active services" ON public.services FOR SELECT USING (active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update services" ON public.services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete services" ON public.services FOR DELETE TO authenticated USING (true);

-- CLIENTS
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  whatsapp text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- APPOINTMENTS
CREATE TYPE public.appointment_location AS ENUM ('local', 'home');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  client_name_snapshot text NOT NULL,
  client_whatsapp_snapshot text NOT NULL,
  service_name_snapshot text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  location public.appointment_location NOT NULL DEFAULT 'local',
  address text,
  scheduled_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  is_walkin boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can read appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (true);

-- BUSINESS HOURS
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  active boolean NOT NULL DEFAULT true,
  daily_goal numeric(10,2) NOT NULL DEFAULT 0,
  UNIQUE(day_of_week)
);
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read business hours" ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert business hours" ON public.business_hours FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update business hours" ON public.business_hours FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete business hours" ON public.business_hours FOR DELETE TO authenticated USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
