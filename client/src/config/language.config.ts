/**
 * Configuração Centralizada de Idiomas
 * Este arquivo centraliza todas as configurações de idiomas
 */

export type Language = "pt-BR" | "en-US" | "es-ES";

export const SUPPORTED_LANGUAGES: Record<Language, { label: string; flag: string }> = {
  "pt-BR": { label: "Português (BR)", flag: "🇧🇷" },
  "en-US": { label: "English (US)", flag: "🇺🇸" },
  "es-ES": { label: "Español (ES)", flag: "🇪🇸" },
};

export const LANGUAGE_STORAGE_KEY = "magnatas_language";
export const DEFAULT_LANGUAGE: Language = "pt-BR";

/**
 * Obtém o idioma salvo ou o padrão
 */
export function getSavedLanguage(): Language {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
  return (saved && SUPPORTED_LANGUAGES[saved]) ? saved : DEFAULT_LANGUAGE;
}

/**
 * Salva o idioma
 */
export function saveLanguage(language: Language): void {
  if (SUPPORTED_LANGUAGES[language]) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
}

/**
 * Obtém a label do idioma
 */
export function getLanguageLabel(language: Language): string {
  return SUPPORTED_LANGUAGES[language]?.label || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE].label;
}

/**
 * Lista todos os idiomas disponíveis
 */
export function getAvailableLanguages(): Array<{ code: Language; label: string; flag: string }> {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, { label, flag }]) => ({
    code: code as Language,
    label,
    flag,
  }));
}
