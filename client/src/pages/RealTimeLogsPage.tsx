import React, { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { io, Socket } from "socket.io-client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Search, 
  Filter, 
  Clock, 
  Server, 
  User, 
  Bot, 
  ShieldAlert,
  Trash2,
  RefreshCw,
  FlaskConical,
  LogOut,
  Crown,
  Wifi,
  WifiOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface RealTimeLog {
  _id: string;
  guildId: string;
  title: string;
  description: string;
  type?: string;
  color?: number;
  footer?: string;
  imageUrl?: string;
  userName?: string;
  userId?: string;
  createdAt: string;
}

export default function RealTimeLogsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [logs, setLogs] = useState<RealTimeLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const { data: initialLogs, isLoading } = trpc.realTimeLogs.getLogs.useQuery(
    { guildId: guildId || "", limit: 50 },
    { enabled: !!guildId }
  );

  useEffect(() => {
    if (initialLogs) {
      setLogs(initialLogs as any);
    }
  }, [initialLogs]);

  useEffect(() => {
    if (!guildId) return;

    const socket: Socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("identify", { type: "dashboard", guildId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("new_log", (newLog: RealTimeLog) => {
      setLogs((prev) => [newLog, ...prev].slice(0, 100));
    });

    return () => {
      socket.disconnect();
    };
  }, [guildId]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || log.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getLogIcon = (type?: string) => {
    switch (type) {
      case "WELCOME": return <Crown className="text-yellow-500" size={16} />;
      case "EXIT": return <LogOut className="text-red-500" size={16} />;
      case "TEST": return <FlaskConical className="text-cyan-500" size={16} />;
      case "BOT": return <Bot className="text-primary" size={16} />;
      case "SERVER": return <Server className="text-blue-500" size={16} />;
      case "USER": return <User className="text-green-500" size={16} />;
      default: return <Activity className="text-gray-400" size={16} />;
    }
  };

  const formatColor = (color?: number) => {
    if (!color) return "#313338";
    return `#${color.toString(16).padStart(6, '0')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter italic uppercase">
            <Activity className="text-primary animate-pulse" size={32} />
            Logs em Tempo Real
          </h1>
          <p className="text-muted-foreground font-medium">Monitoramento instantâneo do império Magnatas</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? "outline" : "destructive"} className={isConnected ? "border-green-500 text-green-500 font-black uppercase italic" : "font-black uppercase italic"}>
            {isConnected ? <Wifi size={12} className="mr-1" /> : <WifiOff size={12} className="mr-1" />}
            {isConnected ? "● Conectado" : "○ Desconectado"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setLogs([])} className="gap-2 font-black uppercase italic text-[10px] h-8">
            <Trash2 size={14} /> Limpar Painel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-4">
          <Card className="bg-[#0A0A0A] border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
                <Filter size={16} className="text-primary" /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input 
                  placeholder="Buscar logs..." 
                  className="pl-9 bg-[#111] border-border/50 font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Separator className="bg-border/50" />
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tipo de Log</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: null, label: "Todos", icon: <Activity size={12} /> },
                    { id: "WELCOME", label: "Entrada", icon: <Crown size={12} /> },
                    { id: "EXIT", label: "Saída", icon: <LogOut size={12} /> },
                    { id: "TEST", label: "Testes", icon: <FlaskConical size={12} /> },
                    { id: "BOT", label: "Bot", icon: <Bot size={12} /> },
                    { id: "SERVER", label: "Servidor", icon: <Server size={12} /> },
                    { id: "USER", label: "Usuário", icon: <User size={12} /> },
                  ].map((type) => (
                    <Button
                      key={type.id || "all"}
                      variant={filterType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType(type.id)}
                      className="h-8 text-[10px] font-black uppercase italic gap-1.5"
                    >
                      {type.icon} {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0A0A] border-border shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Status do Sistema</span>
                <RefreshCw size={12} className={isConnected ? "animate-spin text-primary" : ""} />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Logs Carregadas</span>
                  <Badge variant="outline" className="text-[10px] font-black">{logs.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Servidor Ativo</span>
                  <span className="text-[10px] font-black text-primary uppercase italic">Magnatas 1v99</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Feed */}
        <div className="lg:col-span-3 space-y-4">
          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCw className="animate-spin text-primary" size={40} />
                  <p className="text-sm font-black uppercase italic text-muted-foreground">Carregando Logs...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-border/50 rounded-xl">
                  <ShieldAlert className="text-muted-foreground" size={48} />
                  <p className="text-sm font-black uppercase italic text-muted-foreground">Nenhuma log encontrada</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div 
                    key={log._id} 
                    className="group relative bg-[#1e1f22] rounded-lg overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-300 shadow-lg"
                  >
                    {/* Color Bar */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5" 
                      style={{ backgroundColor: formatColor(log.color) }}
                    />
                    
                    <div className="p-4 pl-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {getLogIcon(log.type)}
                            <h4 className="text-sm font-black text-white uppercase italic tracking-tight">
                              {log.title}
                            </h4>
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-black border-white/10 text-gray-400">
                              {log.type || "GERAL"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-300 font-medium leading-relaxed">
                            {log.description}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-gray-500 uppercase">
                            <Clock size={10} />
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                          {log.userName && (
                            <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-primary uppercase italic">
                              <User size={10} />
                              {log.userName}
                            </div>
                          )}
                        </div>
                      </div>

                      {log.imageUrl && (
                        <div className="mt-3 rounded-md overflow-hidden border border-white/5 max-w-md">
                          <img src={log.imageUrl} alt="Log Attachment" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                          {log.footer || "Sistema Magnatas"}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[9px] font-black text-gray-600 uppercase">
                            <Server size={10} /> {log.guildId.slice(0, 8)}...
                          </div>
                          {log.userId && (
                            <div className="flex items-center gap-1 text-[9px] font-black text-gray-600 uppercase">
                              <User size={10} /> {log.userId.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
