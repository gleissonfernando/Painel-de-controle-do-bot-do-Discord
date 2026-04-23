/**
 * Configuração Centralizada de Temas
 * Este arquivo centraliza todas as configurações de temas e cores
 */

export type ThemeVariant = "dark-red" | "dark-orange" | "light-orange";

export interface ThemeConfig {
  variant: ThemeVariant;
  label: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
}

export const THEME_CONFIGS: Record<ThemeVariant, ThemeConfig> = {
  "dark-red": {
    variant: "dark-red",
    label: "Preto & Vermelho",
    description: "Tema escuro com destaque em vermelho",
    primary: "#DC2626",
    secondary: "#1F2937",
    accent: "#EF4444",
    background: "#111827",
    foreground: "#F3F4F6",
    muted: "#374151",
    mutedForeground: "#9CA3AF",
  },
  "dark-orange": {
    variant: "dark-orange",
    label: "Preto & Laranja",
    description: "Tema escuro com destaque em laranja",
    primary: "#EA580C",
    secondary: "#1F2937",
    accent: "#FB923C",
    background: "#111827",
    foreground: "#F3F4F6",
    muted: "#374151",
    mutedForeground: "#9CA3AF",
  },
  "light-orange": {
    variant: "light-orange",
    label: "Branco & Laranja",
    description: "Tema claro com destaque em laranja",
    primary: "#EA580C",
    secondary: "#F3F4F6",
    accent: "#FB923C",
    background: "#FFFFFF",
    foreground: "#111827",
    muted: "#E5E7EB",
    mutedForeground: "#6B7280",
  },
};

// Configuração de tema
export const THEME_STORAGE_KEY = "magnatas_theme";
export const DEFAULT_THEME: ThemeVariant = "dark-red";

/**
 * Obtém o tema salvo ou o padrão
 */
export function getSavedTheme(): ThemeVariant {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeVariant | null;
  return (saved && THEME_CONFIGS[saved]) ? saved : DEFAULT_THEME;
}

/**
 * Salva o tema
 */
export function saveTheme(theme: ThemeVariant): void {
  if (THEME_CONFIGS[theme]) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

/**
 * Obtém a configuração do tema
 */
export function getThemeConfig(theme: ThemeVariant): ThemeConfig {
  return THEME_CONFIGS[theme] || THEME_CONFIGS[DEFAULT_THEME];
}

/**
 * Aplica o tema ao DOM
 */
export function applyTheme(theme: ThemeVariant): void {
  const config = getThemeConfig(theme);
  const root = document.documentElement;

  // Aplicar variáveis CSS
  root.style.setProperty("--primary", config.primary);
  root.style.setProperty("--secondary", config.secondary);
  root.style.setProperty("--accent", config.accent);
  root.style.setProperty("--background", config.background);
  root.style.setProperty("--foreground", config.foreground);
  root.style.setProperty("--muted", config.muted);
  root.style.setProperty("--muted-foreground", config.mutedForeground);

  // Atualizar classe do documento
  root.classList.remove("dark-red", "dark-orange", "light-orange");
  root.classList.add(theme);

  // Salvar tema
  saveTheme(theme);
}

/**
 * Lista todos os temas disponíveis
 */
export function getAvailableThemes(): ThemeConfig[] {
  return Object.values(THEME_CONFIGS);
}
