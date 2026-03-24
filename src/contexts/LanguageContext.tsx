import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type Language = "bn" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectDeviceLanguage = (): Language => {
  const stored = localStorage.getItem("app-language");
  if (stored === "en" || stored === "bn") return stored;
  
  const browserLang = navigator.language || (navigator as any).userLanguage || "";
  if (browserLang.startsWith("bn")) return "bn";
  return "en";
};

// Lazy-load translations
let translationsCache: Record<string, Record<string, string>> | null = null;
const getTranslations = async () => {
  if (!translationsCache) {
    const mod = await import("@/lib/translations");
    translationsCache = mod.translations;
  }
  return translationsCache;
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectDeviceLanguage);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>> | null>(null);

  useEffect(() => {
    getTranslations().then(setTranslations);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  }, []);

  const t = useCallback((key: string): string => {
    if (!translations) return key;
    return translations[language]?.[key] || translations["bn"]?.[key] || key;
  }, [language, translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
