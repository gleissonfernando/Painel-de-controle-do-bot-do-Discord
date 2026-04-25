import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAvailableLanguages } from "@/config/language.config";
import { Palette, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CentralizedHeaderProps {
  title?: string;
  showLogout?: boolean;
  onLogout?: () => void;
}

export default function CentralizedHeader({
  title = "Dashboard",
  showLogout = false,
  onLogout,
}: CentralizedHeaderProps) {
  const { language, setLanguage } = useLanguage();
  const languages = getAvailableLanguages();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0A] border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 gap-4">
        {/* Title */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Preto & Vermelho</span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span>{lang.flag} {lang.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logout Button */}
          {showLogout && onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
