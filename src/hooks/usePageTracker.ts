import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function detectDevice(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  return "Other";
}

function getSessionId(): string {
  let sid = sessionStorage.getItem("_pvs");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("_pvs", sid);
  }
  return sid;
}

export function usePageTracker() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    // Don't track admin pages
    if (path.startsWith("/admin")) return;

    const track = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("page_views" as any).insert({
        page_path: path,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
        session_id: getSessionId(),
        user_id: user?.id || null,
      } as any);
    };

    // Small delay to not block rendering
    const timer = setTimeout(track, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);
}
