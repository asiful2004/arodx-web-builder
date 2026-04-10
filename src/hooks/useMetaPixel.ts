import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export function useMetaPixel() {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const metaPixel = settings?.meta_pixel as any;
    if (!metaPixel?.enabled || !metaPixel?.pixel_id) return;

    const pixelId = metaPixel.pixel_id.trim();
    if (!pixelId) return;

    // Avoid double-init
    if (window.fbq) return;

    // Facebook Pixel base code
    const f = window;
    const b = document;
    const e = "script";
    let n: any;
    const t = b.createElement(e) as HTMLScriptElement;
    const s = b.getElementsByTagName(e)[0];

    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    s?.parentNode?.insertBefore(t, s);

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");

    // Add noscript pixel in body
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    return () => {
      // Cleanup on unmount
      try {
        t.remove();
        noscript.remove();
      } catch {}
    };
  }, [settings?.meta_pixel]);
}
