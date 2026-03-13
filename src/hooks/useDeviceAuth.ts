import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

function getDeviceFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    nav.hardwareConcurrency,
  ].join("|");
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return { browser, os, deviceName: `${browser} on ${os}`, fingerprint: getDeviceFingerprint() };
}

export function useDeviceAuth() {
  const checkDeviceCount = useCallback(async (userId: string) => {
    const { count } = await supabase
      .from("user_devices")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);
    return count || 0;
  }, []);

  const isDeviceRegistered = useCallback(async (userId: string) => {
    const fp = getDeviceFingerprint();
    const { data } = await supabase
      .from("user_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("device_fingerprint", fp)
      .eq("is_active", true)
      .maybeSingle();
    return !!data;
  }, []);

  const registerDevice = useCallback(async (userId: string) => {
    const info = getDeviceInfo();
    // Upsert based on fingerprint
    const { data: existing } = await supabase
      .from("user_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("device_fingerprint", info.fingerprint)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_devices")
        .update({ is_active: true, last_active: new Date().toISOString(), device_name: info.deviceName, browser: info.browser, os: info.os })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("user_devices")
        .insert({
          user_id: userId,
          device_name: info.deviceName,
          browser: info.browser,
          os: info.os,
          device_fingerprint: info.fingerprint,
        });
    }
  }, []);

  const updateLastActive = useCallback(async (userId: string) => {
    const fp = getDeviceFingerprint();
    await supabase
      .from("user_devices")
      .update({ last_active: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("device_fingerprint", fp);
  }, []);

  const removeDevice = useCallback(async (deviceId: string) => {
    await supabase
      .from("user_devices")
      .update({ is_active: false })
      .eq("id", deviceId);
  }, []);

  const createLoginRequest = useCallback(async (email: string) => {
    const info = getDeviceInfo();
    const { data, error } = await supabase
      .from("device_login_requests")
      .insert({
        user_email: email,
        device_info: info as any,
      })
      .select("token")
      .single();
    if (error) throw error;
    return data.token;
  }, []);

  return {
    getDeviceInfo,
    getDeviceFingerprint,
    checkDeviceCount,
    isDeviceRegistered,
    registerDevice,
    updateLastActive,
    removeDevice,
    createLoginRequest,
  };
}

export { getDeviceFingerprint, getDeviceInfo };
