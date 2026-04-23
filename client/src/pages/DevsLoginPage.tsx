import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

const DEV_USERNAME = "vilao";
const DEV_PASSWORD = "04042003";

export default function DevsLoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Simular delay de verificação
      await new Promise(resolve => setTimeout(resolve, 500));

      if (username !== DEV_USERNAME) {
        setError("❌ Usuário inválido");
        toast.error("Usuário inválido");
        setIsLoading(false);
        return;
      }

      if (password !== DEV_PASSWORD) {
        setError("❌ Senha incorreta");
        toast.error("Senha incorreta");
        setIsLoading(false);
        return;
      }

      // Armazenar sessão dev no localStorage
      localStorage.setItem("dev_session", JSON.stringify({
        username: DEV_USERNAME,
        timestamp: Date.now(),
        expiresIn: 24 * 60 * 60 * 1000, // 24 horas
      }));

      toast.success("✅ Acesso Dev liberado com sucesso!");
      
      // Redirecionar para a página de devs
      setTimeout(() => {
        setLocation("/devs");
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
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

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Usuário</label>
              <Input
                type="text"
                placeholder="Digite seu usuário..."
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                className="bg-input border-border focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  disabled={isLoading}
                  className="bg-input border-border focus:border-primary focus:ring-1 focus:ring-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 gap-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar como Dev
                </>
              )}
            </Button>
          </form>

          {/* Footer Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Acesso válido por 24 horas após o login
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
