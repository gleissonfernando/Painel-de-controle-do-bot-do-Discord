import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function DevActivationPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [devCode, setDevCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activateDevMutation = trpc.settings.activateDev.useMutation({
    onSuccess: () => {
      toast.success("✅ Modo Dev ativado com sucesso!");
      setDevCode("");
      // Recarregar a página para refletir as mudanças
      window.location.reload();
    },
    onError: (error) => {
      toast.error("❌ Código inválido ou expirado");
      console.error("Dev activation error:", error);
    },
  });

  const handleActivateDev = async () => {
    if (!devCode.trim()) {
      toast.error("Por favor, insira o código de ativação");
      return;
    }

    setIsLoading(true);
    try {
      await activateDevMutation.mutateAsync({
        guildId: guildId || "",
        devCode,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-background/50 p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <Lock size={32} className="text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Ativar Modo Dev</CardTitle>
          <CardDescription>
            Insira o código de ativação para liberar funcionalidades avançadas
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-foreground/80">
              Apenas administradores autorizados podem ativar o modo Dev. Este código é pessoal e intransferível.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium">Código de Ativação</label>
            <Input
              type="password"
              placeholder="Digite o código aqui..."
              value={devCode}
              onChange={(e) => setDevCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleActivateDev()}
              disabled={isLoading}
              className="text-center tracking-widest"
            />
          </div>

          <Button
            onClick={handleActivateDev}
            disabled={isLoading || !devCode.trim()}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                Ativando...
              </>
            ) : (
              <>
                <Unlock size={18} className="mr-2" />
                Ativar Dev
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Usuário: <span className="font-semibold text-foreground">{user?.name}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
