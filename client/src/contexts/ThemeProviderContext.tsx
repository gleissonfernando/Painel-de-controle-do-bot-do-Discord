import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeVariant = "dark-red" | "dark-orange" | "light-orange";

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
    primary: "#DC2626", // Vermelho
    secondary: "#1F2937", // Cinza escuro
    accent: "#EF4444", // Vermelho claro
    background: "#111827", // Preto
    foreground: "#F3F4F6", // Branco
    muted: "#374151", // Cinza
    mutedForeground: "#9CA3AF", // Cinza claro
  },
  "dark-orange": {
    variant: "dark-orange",
    primary: "#EA580C", // Laranja
    secondary: "#1F2937", // Cinza escuro
    accent: "#FB923C", // Laranja claro
    background: "#111827", // Preto
    foreground: "#F3F4F6", // Branco
    muted: "#374151", // Cinza
    mutedForeground: "#9CA3AF", // Cinza claro
  },
  "light-orange": {
    variant: "light-orange",
    primary: "#EA580C", // Laranja
    secondary: "#F3F4F6", // Branco
    accent: "#FB923C", // Laranja claro
    background: "#FFFFFF", // Branco
    foreground: "#111827", // Preto
    muted: "#E5E7EB", // Cinza claro
    mutedForeground: "#6B7280", // Cinza
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
    root.classList.remove("dark-red", "dark-orange", "light-orange");
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
