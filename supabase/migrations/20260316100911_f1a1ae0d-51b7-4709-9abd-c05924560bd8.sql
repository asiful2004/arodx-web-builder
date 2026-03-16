
-- Function to get cron jobs (security definer to access cron schema)
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE(jobname text, schedule text, active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jobname::text, schedule::text, active
  FROM cron.job
  ORDER BY jobid;
$$;

-- Function to get recent cron run details
CREATE OR REPLACE FUNCTION public.get_cron_run_details()
RETURNS TABLE(runid bigint, jobid bigint, job_pid integer, status text, return_message text, start_time timestamptz, end_time timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT runid, jobid, job_pid, status::text, return_message::text, start_time, end_time
  FROM cron.job_run_details
  ORDER BY start_time DESC
  LIMIT 50;
$$;
