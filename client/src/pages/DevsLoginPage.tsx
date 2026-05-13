import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function DevsLoginPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isDeveloper = user?.role === "admin";

  useEffect(() => {
    if (!user) {
      toast.error("❌ Você precisa fazer login com o Discord primeiro");
      setLocation("/");
      return;
    }
    if (isDeveloper) {
      setLocation("/devs");
    }
  }, [user, isDeveloper, setLocation]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/50 border-2 border-primary/30 flex items-center justify-center shadow-lg">
              <Lock size={40} className="text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Acesso Devs
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Área restrita para desenvolvedores
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <Alert className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-foreground/80">
              Este é um acesso restrito. Apenas desenvolvedores autorizados podem prosseguir.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => setLocation(isDeveloper ? "/devs" : "/")}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 gap-2"
            size="lg"
          >
            <LogIn size={18} />
            {isDeveloper ? "Acessar Devs" : "Voltar ao login"}
          </Button>

          {/* Footer Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              O acesso dev é validado pela conta autenticada no servidor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
