import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  BarChart3,
  Database,
  LogOut,
  Settings,
  Zap,
  AlertTriangle,
  Clock,
  Users,
  Server,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface DevSession {
  username: string;
  timestamp: number;
  expiresIn: number;
}

export default function DevsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [session, setSession] = useState<DevSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "stats" | "settings">("overview");

  // Verificar se o usuario esta autenticado via Discord OAuth2
  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }
  }, [user, setLocation]);

  useEffect(() => {
    // Verificar sessão dev
    const devSession = localStorage.getItem("dev_session");
    if (!devSession) {
      setLocation("/devs/login");
      return;
    }

    try {
      const parsed = JSON.parse(devSession) as DevSession;
      const now = Date.now();
      const expiresAt = parsed.timestamp + parsed.expiresIn;

      if (now > expiresAt) {
        localStorage.removeItem("dev_session");
        toast.error("Sessão expirada. Faça login novamente.");
        setLocation("/devs/login");
        return;
      }

      setSession(parsed);

      // Atualizar tempo restante a cada segundo
      const interval = setInterval(() => {
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
          localStorage.removeItem("dev_session");
          setLocation("/devs/login");
          return;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("Erro ao verificar sessão dev:", error);
      setLocation("/devs/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("dev_session");
    toast.success("Sessão encerrada");
    setLocation("/");
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Shield className="text-primary" size={32} />
              Painel de Desenvolvedores
            </h1>
            <p className="text-muted-foreground mt-1">Bem-vindo, {session.username} 🔐</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground">Sessão expira em:</p>
              <p className="text-lg font-bold text-primary">{timeRemaining}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2"
            >
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Servidores Ativos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">12</p>
                </div>
                <Server className="text-primary/50" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Totais</p>
                  <p className="text-3xl font-bold text-foreground mt-1">2.4K</p>
                </div>
                <Users className="text-blue-500/50" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-3xl font-bold text-foreground mt-1">99.8%</p>
                </div>
                <Activity className="text-green-500/50" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erros (24h)</p>
                  <p className="text-3xl font-bold text-foreground mt-1">3</p>
                </div>
                <AlertTriangle className="text-yellow-500/50" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {[
            { id: "overview", label: "Visão Geral", icon: BarChart3 },
            { id: "logs", label: "Logs Brutos", icon: Database },
            { id: "stats", label: "Estatísticas", icon: Activity },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === "overview" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Visão Geral do Sistema</CardTitle>
                <CardDescription>Informações gerais sobre o estado do bot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Status do Bot</p>
                    <p className="text-lg font-bold text-green-500">🟢 Online</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Banco de Dados</p>
                    <p className="text-lg font-bold text-green-500">🟢 Conectado</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">API Discord</p>
                    <p className="text-lg font-bold text-green-500">🟢 Respondendo</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Modo Manutenção</p>
                    <p className="text-lg font-bold text-red-500">🔴 Desativado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "logs" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Logs Brutos do Sistema</CardTitle>
                <CardDescription>Últimos eventos do servidor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  <div className="p-2 bg-muted/50 rounded text-green-500">[INFO] Bot iniciado com sucesso</div>
                  <div className="p-2 bg-muted/50 rounded text-blue-500">[DEBUG] Conectando ao banco de dados...</div>
                  <div className="p-2 bg-muted/50 rounded text-green-500">[INFO] 12 servidores carregados</div>
                  <div className="p-2 bg-muted/50 rounded text-yellow-500">[WARN] Taxa de requisições elevada</div>
                  <div className="p-2 bg-muted/50 rounded text-green-500">[INFO] Sincronização concluída</div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "stats" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Estatísticas Globais</CardTitle>
                <CardDescription>Análise de uso e performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Comandos Executados (24h)</p>
                    <p className="text-2xl font-bold">15,234</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Mensagens Processadas</p>
                    <p className="text-2xl font-bold">89,456</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tempo Médio de Resposta</p>
                    <p className="text-2xl font-bold">125ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-green-500">99.8%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Configurações de Desenvolvedor</CardTitle>
                <CardDescription>Ajustes avançados do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Debug Mode</p>
                    <p className="text-sm text-muted-foreground">Ativa logs detalhados</p>
                  </div>
                  <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                    Ativar
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Rate Limit Override</p>
                    <p className="text-sm text-muted-foreground">Ignora limites de requisição</p>
                  </div>
                  <button className="px-3 py-1 bg-muted text-foreground rounded text-sm">
                    Desativar
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Cache Limpo</p>
                    <p className="text-sm text-muted-foreground">Limpa cache do sistema</p>
                  </div>
                  <button className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm">
                    Limpar
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
