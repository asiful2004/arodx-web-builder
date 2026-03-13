
-- Add sub-roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'graphics_designer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'web_developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'digital_marketer';
