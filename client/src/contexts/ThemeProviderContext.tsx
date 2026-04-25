import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeVariant = "dark-red";

interface ThemeConfig {
  variant: ThemeVariant;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
}

const THEME_CONFIGS: Record<ThemeVariant, ThemeConfig> = {
  "dark-red": {
    variant: "dark-red",
    primary: "#FF0000", // Vermelho Puro
    secondary: "#0A0A0A", // Preto quase puro
    accent: "#CC0000", // Vermelho Escuro
    background: "#050505", // Preto Profundo
    foreground: "#FFFFFF", // Branco Puro
    muted: "#1A1A1A", // Cinza muito escuro
    mutedForeground: "#A0A0A0", // Cinza
  },
};

interface ThemeContextType {
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeVariant>("dark-red");
  const [mounted, setMounted] = useState(false);

  // Carregar tema do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeVariant | null;
    if (savedTheme && THEME_CONFIGS[savedTheme]) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  // Atualizar tema
  const setTheme = (newTheme: ThemeVariant) => {
    if (THEME_CONFIGS[newTheme]) {
      setThemeState(newTheme);
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    }
  };

  // Aplicar tema ao DOM
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const applyTheme = (themeVariant: ThemeVariant) => {
    const config = THEME_CONFIGS[themeVariant];
    const root = document.documentElement;

    root.style.setProperty("--primary", config.primary);
    root.style.setProperty("--secondary", config.secondary);
    root.style.setProperty("--accent", config.accent);
    root.style.setProperty("--background", config.background);
    root.style.setProperty("--foreground", config.foreground);
    root.style.setProperty("--muted", config.muted);
    root.style.setProperty("--muted-foreground", config.mutedForeground);

    // Atualizar classe do documento
    root.classList.remove("dark-red");
    root.classList.add(themeVariant);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config: THEME_CONFIGS[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return context;
}
