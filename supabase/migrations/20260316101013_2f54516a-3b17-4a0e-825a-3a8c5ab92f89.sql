
-- Function to update cron job schedule (security definer to access cron schema)
CREATE OR REPLACE FUNCTION public.update_cron_schedule(_jobname text, _schedule text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cron.job SET schedule = _schedule WHERE jobname = _jobname;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$;
