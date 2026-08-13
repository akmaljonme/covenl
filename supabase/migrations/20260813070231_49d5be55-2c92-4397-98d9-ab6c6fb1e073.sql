
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('director','developer');
CREATE TYPE public.application_status AS ENUM ('pending','accepted','rejected');
CREATE TYPE public.ai_level AS ENUM ('Beginner','Intermediate','Advanced','Expert');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role public.app_role NOT NULL DEFAULT 'developer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'director' THEN 'director'::public.app_role ELSE 'developer'::public.app_role END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COMPANIES
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  description text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX companies_owner_idx ON public.companies(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_public_read" ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies_insert_own" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_delete_own" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER companies_touch BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.owns_company(_company_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _company_id AND c.owner_id = auth.uid());
$$;

-- DEVELOPER PROFILES
CREATE TABLE public.developer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  headline text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  experience_years int NOT NULL DEFAULT 0,
  github_url text,
  linkedin_url text,
  avatar_url text,
  cv_path text,
  cv_url text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_profiles TO authenticated;
GRANT SELECT ON public.developer_profiles TO anon;
GRANT ALL ON public.developer_profiles TO service_role;
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devprofiles_public_read" ON public.developer_profiles FOR SELECT USING (true);
CREATE POLICY "devprofiles_insert_own" ON public.developer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "devprofiles_update_own" ON public.developer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER devprofiles_touch BEFORE UPDATE ON public.developer_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.owns_developer_profile(_dev_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.developer_profiles d WHERE d.id = _dev_id AND d.user_id = auth.uid());
$$;

-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  employment_type text NOT NULL DEFAULT 'Full-time',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_company_idx ON public.jobs(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_public_read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "jobs_insert_owner" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "jobs_update_owner" ON public.jobs FOR UPDATE TO authenticated USING (public.owns_company(company_id)) WITH CHECK (public.owns_company(company_id));
CREATE POLICY "jobs_delete_owner" ON public.jobs FOR DELETE TO authenticated USING (public.owns_company(company_id));
CREATE TRIGGER jobs_touch BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- APPLICATIONS
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  developer_id uuid NOT NULL REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  cover_note text NOT NULL DEFAULT '',
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, developer_id)
);
CREATE INDEX applications_company_idx ON public.applications(company_id);
CREATE INDEX applications_developer_idx ON public.applications(developer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_read" ON public.applications FOR SELECT TO authenticated
  USING (public.owns_company(company_id) OR public.owns_developer_profile(developer_id));
CREATE POLICY "applications_insert_dev" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (public.owns_developer_profile(developer_id));
CREATE POLICY "applications_update_owner" ON public.applications FOR UPDATE TO authenticated
  USING (public.owns_company(company_id)) WITH CHECK (public.owns_company(company_id));
CREATE POLICY "applications_delete_dev" ON public.applications FOR DELETE TO authenticated
  USING (public.owns_developer_profile(developer_id));
CREATE TRIGGER applications_touch BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TEAM MEMBERS
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  developer_id uuid NOT NULL REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  role_title text NOT NULL DEFAULT 'Developer',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, developer_id)
);
CREATE INDEX team_members_company_idx ON public.team_members(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT ON public.team_members TO anon;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_public_read" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "team_insert_owner" ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "team_delete_owner" ON public.team_members FOR DELETE TO authenticated USING (public.owns_company(company_id));

-- accepting an application auto-creates the team member
CREATE OR REPLACE FUNCTION public.sync_team_on_accept() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    SELECT COALESCE(NULLIF(d.headline,''), j.title) INTO _title
    FROM public.developer_profiles d, public.jobs j
    WHERE d.id = NEW.developer_id AND j.id = NEW.job_id;
    INSERT INTO public.team_members (company_id, developer_id, role_title)
    VALUES (NEW.company_id, NEW.developer_id, COALESCE(_title,'Developer'))
    ON CONFLICT (company_id, developer_id) DO NOTHING;
    INSERT INTO public.notifications (user_id, title, body)
    SELECT d.user_id, 'Application accepted', 'You have joined ' || c.name || ' as ' || COALESCE(_title,'Developer')
    FROM public.developer_profiles d, public.companies c
    WHERE d.id = NEW.developer_id AND c.id = NEW.company_id AND d.user_id IS NOT NULL;
  END IF;
  IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, body)
    SELECT d.user_id, 'Application update', 'Your application to ' || c.name || ' was not accepted'
    FROM public.developer_profiles d, public.companies c
    WHERE d.id = NEW.developer_id AND c.id = NEW.company_id AND d.user_id IS NOT NULL;
  END IF;
  RETURN NEW;
END; $$;

-- AI EMPLOYEES
CREATE TABLE public.ai_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  category text NOT NULL,
  avatar text NOT NULL DEFAULT '🤖',
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  level public.ai_level NOT NULL DEFAULT 'Beginner',
  monthly_price int NOT NULL DEFAULT 5 CHECK (monthly_price > 0 AND monthly_price <= 20),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_employees TO authenticated, anon;
GRANT ALL ON public.ai_employees TO service_role;
ALTER TABLE public.ai_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_employees_public_read" ON public.ai_employees FOR SELECT USING (true);

CREATE TABLE public.hired_ai_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ai_employee_id uuid NOT NULL REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  hired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, ai_employee_id)
);
CREATE INDEX hired_ai_company_idx ON public.hired_ai_employees(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hired_ai_employees TO authenticated;
GRANT SELECT ON public.hired_ai_employees TO anon;
GRANT ALL ON public.hired_ai_employees TO service_role;
ALTER TABLE public.hired_ai_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hired_ai_public_read" ON public.hired_ai_employees FOR SELECT USING (true);
CREATE POLICY "hired_ai_insert_owner" ON public.hired_ai_employees FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "hired_ai_delete_owner" ON public.hired_ai_employees FOR DELETE TO authenticated USING (public.owns_company(company_id));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER applications_accept_sync AFTER UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.sync_team_on_accept();

-- SEED: AI employees
INSERT INTO public.ai_employees (name, role, category, avatar, description, skills, level, monthly_price) VALUES
('Coven Dev Jr','AI Developer','Developer','🧑‍💻','An entry-level AI software developer that handles small features, bug fixes and code cleanup for your team.','{HTML,CSS,JavaScript,Git}','Beginner',5),
('Coven Dev Pro','AI Developer','Developer','⚙️','An AI software developer designed to help your team build and maintain production applications end to end.','{React,"Next.js","Node.js","API Integration",Debugging}','Advanced',15),
('Coven Designer','AI Designer','Designer','🎨','An AI product designer that produces UI concepts, design systems and polished interface specs.','{"UI Design","Design Systems",Figma,Prototyping}','Intermediate',10),
('Coven Marketer','AI Marketing Specialist','Marketing','📣','An AI marketing specialist that writes campaigns, landing copy and growth experiments.','{Copywriting,SEO,"Email Campaigns",Analytics}','Intermediate',10),
('Coven Researcher','AI Researcher','Researcher','🔬','An AI researcher that gathers market intelligence, benchmarks competitors and summarises findings.','{"Market Research","Data Analysis","Competitive Analysis",Reporting}','Advanced',15),
('Coven PM','AI Product Manager','Product Manager','🗂️','An expert AI product manager that turns strategy into roadmaps, specs and prioritised backlogs.','{Roadmapping,"User Stories",Prioritisation,Analytics,Stakeholders}','Expert',20);

-- SEED: demo company, developers, jobs, applications
INSERT INTO public.companies (id, name, description, industry, location, is_demo, logo_url)
VALUES ('11111111-1111-1111-1111-111111111111','Nova Systems','A demo virtual company on COVENL building developer tooling and AI-assisted products for global teams.','Software','Almaty, Kazakhstan', true, null);

INSERT INTO public.developer_profiles (id, full_name, headline, bio, skills, experience_years, github_url, linkedin_url, is_demo) VALUES
('22222222-0000-0000-0000-000000000001','John Carter','Full Stack Developer','Builds product-grade web apps end to end with a focus on DX and performance.','{React,"Next.js","Node.js",PostgreSQL,TypeScript}',4,'https://github.com/johncarter','https://linkedin.com/in/johncarter',true),
('22222222-0000-0000-0000-000000000002','Sarah Lee','Frontend Developer','Design-minded frontend engineer specialising in accessible, animated interfaces.','{React,TypeScript,Tailwind,"Framer Motion"}',3,'https://github.com/sarahlee','https://linkedin.com/in/sarahlee',true),
('22222222-0000-0000-0000-000000000003','Daniyar Ospanov','Backend Developer','Distributed systems engineer with a background in fintech payment rails.','{Go,PostgreSQL,Redis,Kubernetes}',5,'https://github.com/daniyar','https://linkedin.com/in/daniyar',true),
('22222222-0000-0000-0000-000000000004','Mei Tanaka','Mobile Developer','Ships cross-platform mobile apps with a strong eye for motion and detail.','{"React Native",TypeScript,Swift,Kotlin}',2,'https://github.com/meitanaka','https://linkedin.com/in/meitanaka',true),
('22222222-0000-0000-0000-000000000005','Ahmed Nasser','DevOps Engineer','Automates delivery pipelines and keeps production boringly reliable.','{Terraform,AWS,Docker,"CI/CD"}',6,'https://github.com/ahmednasser','https://linkedin.com/in/ahmednasser',true),
('22222222-0000-0000-0000-000000000006','Elena Petrova','Data Engineer','Builds analytics platforms and streaming data pipelines at scale.','{Python,dbt,Airflow,BigQuery}',4,'https://github.com/elenapetrova','https://linkedin.com/in/elenapetrova',true);

INSERT INTO public.jobs (id, company_id, title, description, skills, employment_type, status) VALUES
('33333333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Frontend Developer','Own our web client: build polished product surfaces in React and TypeScript alongside the design team.','{React,TypeScript,"Next.js"}','Full-time','open'),
('33333333-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Backend Developer','Design and ship the APIs and data model powering our platform.','{"Node.js",PostgreSQL,"REST APIs"}','Full-time','open'),
('33333333-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','DevOps Engineer','Own CI/CD, observability and infrastructure as code across our environments.','{Terraform,AWS,Docker}','Contract','open'),
('33333333-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Mobile Developer','Build our cross-platform mobile client from first commit to store release.','{"React Native",TypeScript}','Part-time','open');

INSERT INTO public.applications (job_id, company_id, developer_id, cover_note, status) VALUES
('33333333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000002','I would love to own the web client — sending along recent work.','pending'),
('33333333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000001','Full stack, but frontend is where I do my best work.','pending'),
('33333333-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000003','Five years on high-throughput backend systems.','pending'),
('33333333-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000005','I have run platform teams and would like to do it again here.','pending'),
('33333333-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000004','Mobile is all I do. Happy to walk through my latest release.','pending');
