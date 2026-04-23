import React, { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { io, Socket } from "socket.io-client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  Search, 
  Filter, 
  Clock, 
  Trash2, 
  ExternalLink,
  Terminal,
  Wifi,
  WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface LogField {
  name: string;
  value: string;
  inline?: boolean;
}

interface RealTimeLog {
  _id: string;
  title: string;
  description: string;
  fields?: LogField[];
  imageUrl?: string;
  footer?: string;
  color?: number;
  type?: string;
  createdAt: string;
}

export default function RealTimeLogsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [logs, setLogs] = useState<RealTimeLog[]>([]);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Carregar logs iniciais
  const { data: initialLogs, isLoading } = trpc.realTimeLogs.getLogs.useQuery(
    { guildId: guildId || "", limit: 50 },
    { enabled: !!guildId }
  );

  useEffect(() => {
    if (initialLogs) {
      setLogs(initialLogs as any);
    }
  }, [initialLogs]);

  // Configurar Socket.IO
  useEffect(() => {
    if (!guildId) return;

    // Conectar ao servidor (ajuste a URL se necessário)
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("identify", { type: "dashboard", guildId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("new_log", (log: RealTimeLog) => {
      setLogs((prev) => [log, ...prev].slice(0, 100));
    });

    return () => {
      socket.disconnect();
    };
  }, [guildId]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(filter.toLowerCase()) || 
                         log.description.toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter ? log.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  const getDiscordColor = (colorNum?: number) => {
    if (!colorNum) return "#2f3136";
    return `#${colorNum.toString(16).padStart(6, "0")}`;
  };

  const uniqueTypes = Array.from(new Set(logs.map(l => l.type).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Activity size={32} />
            Logs em Tempo Real
          </h1>
          <p className="text-muted-foreground">Monitore todas as atividades do bot instantaneamente</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? "outline" : "destructive"} className={isConnected ? "border-green-500 text-green-500" : ""}>
            {isConnected ? <Wifi size={12} className="mr-1" /> : <WifiOff size={12} className="mr-1" />}
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setLogs([])} className="gap-2">
            <Trash2 size={14} /> Limpar Painel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros Laterais */}
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Filter size={14} /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar logs..." 
                  className="pl-9 bg-input border-border"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Tipo de Log</label>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={typeFilter === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setTypeFilter(null)}
                  >
                    Todos
                  </Badge>
                  {uniqueTypes.map(type => (
                    <Badge 
                      key={type}
                      variant={typeFilter === type ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setTypeFilter(type as string)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Terminal size={14} /> Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Carregado:</span>
                <span className="font-mono">{logs.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Filtro Ativo:</span>
                <span className="font-mono">{filteredLogs.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Logs */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground animate-pulse">Sincronizando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <Card className="border-dashed border-2 border-border bg-transparent py-20">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 bg-muted rounded-full">
                  <Activity size={32} className="text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-lg">Nenhuma log encontrada</p>
                  <p className="text-sm text-muted-foreground">Aguardando novas atividades ou ajuste seus filtros.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div 
                  key={log._id} 
                  className="flex flex-col border-l-4 rounded-r-lg bg-[#1e1f22] shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300"
                  style={{ borderLeftColor: getDiscordColor(log.color) }}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        {log.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                        <Clock size={10} />
                        {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {log.description}
                    </p>

                    {log.fields && log.fields.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {log.fields.map((field, idx) => (
                          <div key={idx} className={field.inline ? "col-span-1" : "col-span-full"}>
                            <p className="text-xs font-bold text-white mb-1">{field.name}</p>
                            <p className="text-sm text-gray-300 bg-black/20 p-2 rounded border border-white/5">{field.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {log.imageUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-white/10 max-w-md">
                        <img src={log.imageUrl} alt="Log attachment" className="w-full h-auto object-cover" />
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.footer && <span className="text-[10px] text-gray-500 font-medium">{log.footer}</span>}
                        {log.type && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-white/5 text-gray-400 border-none">{log.type}</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-white">
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
