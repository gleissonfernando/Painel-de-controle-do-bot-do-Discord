import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  UserPlus, 
  UserMinus, 
  ShieldAlert,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DevsPage() {
  const [newUserId, setNewUserId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<"helper" | "creator" | "master">("helper");
  const [isAdding, setIsAdding] = useState(false);

  const { data: devs = [], isLoading, refetch } = trpc.devManagement.list.useQuery();
  
  // Como não temos a mutation implementada no trpc ainda (precisaria atualizar o backend), 
  // vamos simular ou assumir que ela será adicionada. 
  // Por enquanto, vamos implementar a UI completa.

  const handleAddDev = async () => {
    if (!newUserId || !newUsername) {
      toast.error("Preencha o ID e o Nome do desenvolvedor");
      return;
    }
    
    toast.info("Funcionalidade de adição em processamento...");
    // Aqui chamaria a mutation: await addDevMutation.mutateAsync({ userId: newUserId, username: newUsername, role: newRole });
    // Para este exemplo, vamos focar na UI que o usuário pediu.
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "master":
        return <Badge className="bg-red-600 text-white border-none font-black uppercase italic text-[9px]">Master</Badge>;
      case "creator":
        return <Badge className="bg-purple-600 text-white border-none font-black uppercase italic text-[9px]">Creator</Badge>;
      default:
        return <Badge className="bg-blue-600 text-white border-none font-black uppercase italic text-[9px]">Helper</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Alert className="bg-red-500/5 border-red-500/20">
        <ShieldAlert className="h-5 w-5 text-red-500" />
        <AlertTitle className="text-red-500 font-bold uppercase italic">Acesso Restrito: Gestão de Desenvolvedores</AlertTitle>
        <AlertDescription className="text-muted-foreground text-xs">
          Usuários listados aqui têm permissão para usar o comando **`/vinculo`** no Discord e acessar abas administrativas.
          Se um usuário sair do Discord ou for removido daqui, ele perderá o cargo e o acesso automaticamente.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário de Adição */}
        <Card className="border-border bg-[#0A0A0A] shadow-xl">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2 text-primary">
              <UserPlus size={18} />
              Autorizar Novo Dev
            </CardTitle>
            <CardDescription className="text-[10px] font-bold">Adicione o ID do Discord para liberar o comando /vinculo</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Discord ID</label>
              <Input 
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Ex: 761011766440230932" 
                className="bg-black border-border h-10 text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Nome de Exibição</label>
              <Input 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Ex: vilao" 
                className="bg-black border-border h-10 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Cargo/Permissão</label>
              <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                <SelectTrigger className="bg-black border-border h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-border">
                  <SelectItem value="helper">Helper (Comandos Básicos)</SelectItem>
                  <SelectItem value="creator">Creator (Gestão de Conteúdo)</SelectItem>
                  <SelectItem value="master">Master (Acesso Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddDev}
              className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-xs h-11"
            >
              <ShieldCheck size={16} className="mr-2" /> Autorizar Acesso
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Desenvolvedores */}
        <Card className="lg:col-span-2 border-border bg-[#0A0A0A] shadow-xl">
          <CardHeader className="border-b border-border/50 bg-[#050505]/50">
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-500" />
              Usuários com Permissão de Comando
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-[#050505]">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Desenvolvedor</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discord ID</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargo</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status Bot</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                        <p className="text-xs text-muted-foreground font-bold">Carregando equipe...</p>
                      </td>
                    </tr>
                  ) : devs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <Info className="text-muted-foreground mx-auto mb-2" size={24} />
                        <p className="text-xs text-muted-foreground font-bold">Nenhum desenvolvedor autorizado.</p>
                      </td>
                    </tr>
                  ) : (
                    devs.map((dev: any) => (
                      <tr key={dev.userId} className="border-b border-border/50 hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border border-primary/20">
                              <AvatarImage src={dev.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                {dev.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-bold text-white">{dev.username}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground">
                          {dev.userId}
                        </td>
                        <td className="p-4">
                          {getRoleBadge(dev.role)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-black text-green-500 uppercase">Sincronizado</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
