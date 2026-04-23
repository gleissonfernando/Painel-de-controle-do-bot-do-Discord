import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type ColorScheme = "red" | "orange" | "default";

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  toggleTheme?: () => void;
  switchable: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
  defaultColorScheme?: ColorScheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem("colorScheme");
    return (stored as ColorScheme) || "red";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Aplicar esquema de cores
    root.classList.remove("scheme-red", "scheme-orange", "scheme-default");
    root.classList.add(`scheme-${colorScheme}`);

    if (switchable) {
      localStorage.setItem("theme", theme);
      localStorage.setItem("colorScheme", colorScheme);
    }
  }, [theme, colorScheme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, toggleTheme, switchable, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
