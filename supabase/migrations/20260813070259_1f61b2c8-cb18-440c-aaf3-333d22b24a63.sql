
CREATE OR REPLACE FUNCTION public.owns_company(_company_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _company_id AND c.owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.owns_developer_profile(_dev_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.developer_profiles d WHERE d.id = _dev_id AND d.user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.touch_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_team_on_accept() FROM anon, authenticated;
