import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Terminal, 
  ShieldAlert, 
  Send, 
  UserPlus, 
  UserMinus, 
  AlertTriangle,
  Cpu,
  Database,
  Globe
} from "lucide-react";
import RealTimeLogsPage from "./RealTimeLogsPage";
import MonitorPage from "./MonitorPage";
import WelcomeMagnatasPage from "./WelcomeMagnatasPage";
import ExitMagnatasPage from "./ExitMagnatasPage";
import DevsPage from "./DevsPage";

export default function DevCentralPage() {
  const [activeTab, setActiveTab] = useState("logs");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Terminal size={32} />
            Central do Desenvolvedor
          </h1>
          <p className="text-muted-foreground">Gerenciamento técnico, logs em tempo real e ferramentas de teste</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Activity size={14} className="text-primary animate-pulse" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Acesso Master</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#0A0A0A] border border-border p-1 h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4">
            <Activity size={16} />
            Logs Real-Time
          </TabsTrigger>
          <TabsTrigger value="monitor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4">
            <ShieldAlert size={16} />
            NOC & Monitoramento
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4">
            <Globe size={16} />
            Mensagem Global
          </TabsTrigger>
          <TabsTrigger value="test-welcome" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4">
            <UserPlus size={16} />
            Teste Entrada
          </TabsTrigger>
          <TabsTrigger value="test-exit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4">
            <UserMinus size={16} />
            Teste Saída
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-0 border-none p-0 outline-none">
          <RealTimeLogsPage />
        </TabsContent>

        <TabsContent value="monitor" className="mt-0 border-none p-0 outline-none">
          <MonitorPage />
        </TabsContent>

        <TabsContent value="broadcast" className="mt-0 border-none p-0 outline-none">
          <DevsPage />
        </TabsContent>

        <TabsContent value="test-welcome" className="mt-0 border-none p-0 outline-none">
          <WelcomeMagnatasPage />
        </TabsContent>

        <TabsContent value="test-exit" className="mt-0 border-none p-0 outline-none">
          <ExitMagnatasPage />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="bg-[#0A0A0A] border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <Cpu size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Status do Sistema</p>
              <p className="text-lg font-bold">Operacional</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
              <Database size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Banco de Dados</p>
              <p className="text-lg font-bold">Conectado</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0A0A] border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Alertas Ativos</p>
              <p className="text-lg font-bold">Nenhum</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
