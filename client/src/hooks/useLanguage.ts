import { useState, useEffect } from "react";
import type { Language } from "@/lib/translations";
import { getTranslation } from "@/lib/translations";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    // Get language from localStorage or browser language
    const stored = localStorage.getItem("botpanel-language");
    if (stored === "pt" || stored === "en") {
      return stored;
    }

    // Try to detect browser language
    const browserLang = navigator.language.split("-")[0];
    if (browserLang === "pt") {
      return "pt";
    }

    return "en";
  });

  useEffect(() => {
    localStorage.setItem("botpanel-language", language);
  }, [language]);

  const t = (path: string): string => {
    return getTranslation(language, path);
  };

  return { language, setLanguage, t };
}
