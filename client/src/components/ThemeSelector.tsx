import { Palette } from "lucide-react";

export default function ThemeSelector() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
      <Palette className="w-4 h-4 text-primary" />
      <span className="text-xs font-bold text-primary uppercase tracking-wider">Preto & Vermelho</span>
    </div>
  );
}
