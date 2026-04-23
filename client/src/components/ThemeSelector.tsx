import { useTheme, type ThemeVariant } from "@/contexts/ThemeProviderContext";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const THEMES: { value: ThemeVariant; label: string; description: string }[] = [
  {
    value: "dark-red",
    label: "Preto & Vermelho",
    description: "Tema escuro com destaque em vermelho",
  },
  {
    value: "dark-orange",
    label: "Preto & Laranja",
    description: "Tema escuro com destaque em laranja",
  },
  {
    value: "light-orange",
    label: "Branco & Laranja",
    description: "Tema claro com destaque em laranja",
  },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Palette className="w-4 h-4 text-muted-foreground" />
      <Select value={theme} onValueChange={(value) => setTheme(value as ThemeVariant)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {THEMES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              <div className="flex flex-col">
                <span className="font-medium">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
