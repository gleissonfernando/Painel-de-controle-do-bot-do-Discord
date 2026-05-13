import React, { createContext, useContext, useState, useEffect } from "react";
import type { Language } from "@/lib/translations";
import { getTranslation } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("botpanel-language");
    if (stored === "pt" || stored === "en") {
      return stored;
    }

    const browserLang = navigator.language.split("-")[0];
    if (browserLang === "pt") {
      return "pt";
    }

    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("botpanel-language", lang);
  };

  const t = (path: string): string => {
    return getTranslation(language, path);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
