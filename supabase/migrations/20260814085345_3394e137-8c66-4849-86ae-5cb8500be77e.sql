CREATE TYPE public.presence_status AS ENUM ('online','working','meeting','away','offline');
CREATE TYPE public.meeting_status AS ENUM ('live','ended');

CREATE TABLE public.presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status public.presence_status NOT NULL DEFAULT 'online',
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presence TO authenticated;
GRANT ALL ON public.presence TO service_role;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY presence_read ON public.presence FOR SELECT TO authenticated USING (true);
CREATE POLICY presence_insert_own ON public.presence FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY presence_update_own ON public.presence FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY presence_delete_own ON public.presence FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  host_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Stand-up',
  status public.meeting_status NOT NULL DEFAULT 'live',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY meetings_read ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY meetings_insert ON public.meetings FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id) OR auth.uid() = host_id);
CREATE POLICY meetings_update ON public.meetings FOR UPDATE TO authenticated USING (public.owns_company(company_id) OR auth.uid() = host_id) WITH CHECK (public.owns_company(company_id) OR auth.uid() = host_id);
CREATE POLICY meetings_delete ON public.meetings FOR DELETE TO authenticated USING (public.owns_company(company_id) OR auth.uid() = host_id);
CREATE TRIGGER meetings_touch BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_participants TO authenticated;
GRANT ALL ON public.meeting_participants TO service_role;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY meeting_participants_read ON public.meeting_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY meeting_participants_insert_own ON public.meeting_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY meeting_participants_delete_own ON public.meeting_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.hired_ai_employees ADD COLUMN current_task text NOT NULL DEFAULT '';
CREATE POLICY hired_ai_update_owner ON public.hired_ai_employees FOR UPDATE TO authenticated USING (public.owns_company(company_id)) WITH CHECK (public.owns_company(company_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hired_ai_employees;