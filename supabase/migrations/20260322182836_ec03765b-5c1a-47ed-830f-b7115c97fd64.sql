
CREATE OR REPLACE FUNCTION public.get_cron_run_details()
 RETURNS TABLE(runid bigint, jobid bigint, job_pid integer, status text, return_message text, start_time timestamp with time zone, end_time timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  -- Auto-cleanup: delete entries older than 3 days
  -- (done via a separate function call, stable functions can't modify data)
  SELECT runid, jobid, job_pid, status::text, return_message::text, start_time, end_time
  FROM cron.job_run_details
  WHERE start_time > now() - interval '3 days'
  ORDER BY start_time DESC
  LIMIT 100;
$$;

-- Create a cleanup function for old cron run details
CREATE OR REPLACE FUNCTION public.cleanup_old_cron_runs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM cron.job_run_details WHERE start_time < now() - interval '3 days';
END;
$$;
