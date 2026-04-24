import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Download, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  LogOut,
  LogIn,
  Settings,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogsTabProps {
  guildId: string;
  guildName: string;
}

const LOG_TYPE_ICONS = {
  member_join: <LogIn size={14} className="text-green-500" />,
  member_leave: <LogOut size={14} className="text-red-500" />,
  config_updated: <Settings size={14} className="text-blue-500" />,
  maintenance_started: <AlertTriangle size={14} className="text-yellow-500" />,
  maintenance_ended: <CheckCircle size={14} className="text-green-500" />,
  error: <AlertCircle size={14} className="text-red-500" />,
  warning: <AlertTriangle size={14} className="text-yellow-500" />,
  info: <Info size={14} className="text-blue-500" />
};

const SEVERITY_COLORS = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export function LogsTab({ guildId, guildName }: LogsTabProps) {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);

  // Buscar logs
  const { data: logsData, isLoading: isLoadingLogs, refetch } = trpc.logs.getLogs.useQuery(
    {
      guildId,
      type: typeFilter || undefined,
      limit: 20,
      skip: page * 20
    },
    { enabled: !!guildId }
  );

  // Mutation para limpar logs
  const clearLogsMutation = trpc.logs.clearOldLogs.useMutation({
    onSuccess: () => {
      toast.success('✅ Logs antigos removidos!');
      refetch();
    },
    onError: (err) => {
      toast.error(`❌ Erro: ${err.message}`);
    }
  });

  // Mutation para exportar logs
  const exportLogsMutation = trpc.logs.exportLogs.useMutation({
    onSuccess: (data) => {
      // Criar blob e download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${guildId}-${Date.now()}.csv`;
      a.click();
      toast.success('✅ Logs exportados!');
    },
    onError: (err) => {
      toast.error(`❌ Erro ao exportar: ${err.message}`);
    }
  });

  useEffect(() => {
    if (logsData) {
      setLogs(logsData.logs);
      setTotalLogs(logsData.total);
    }
  }, [logsData]);

  const handleClearLogs = async () => {
    if (!confirm('Tem certeza que deseja remover logs com mais de 30 dias?')) return;
    await clearLogsMutation.mutateAsync({ guildId, daysOld: 30 });
  };

  const handleExportLogs = async () => {
    await exportLogsMutation.mutateAsync({ guildId, type: typeFilter || undefined });
  };

  if (isLoadingLogs) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Ações */}
      <Card className="bg-[#0A0A0A] border-border">
        <CardHeader>
          <CardTitle className="text-lg">Filtros e Ações</CardTitle>
          <CardDescription>Filtre e gerencie os logs do servidor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-[#050505] border-border">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-border">
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="member_join">Membro Entrou</SelectItem>
                  <SelectItem value="member_leave">Membro Saiu</SelectItem>
                  <SelectItem value="config_updated">Configuração Atualizada</SelectItem>
                  <SelectItem value="maintenance_started">Manutenção Iniciada</SelectItem>
                  <SelectItem value="maintenance_ended">Manutenção Finalizada</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="w-full gap-2"
              >
                <RefreshCw size={14} />
                Atualizar
              </Button>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleExportLogs}
                disabled={exportLogsMutation.isPending}
                variant="outline"
                className="w-full gap-2"
              >
                <Download size={14} />
                Exportar CSV
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleClearLogs}
              disabled={clearLogsMutation.isPending}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 size={14} />
              Limpar Logs Antigos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card className="bg-[#0A0A0A] border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Histórico de Eventos</CardTitle>
              <CardDescription>
                Total: {totalLogs} evento{totalLogs !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Clock size={20} className="text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-lg border border-border bg-[#050505] hover:bg-[#0A0A0A] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {LOG_TYPE_ICONS[log.type as keyof typeof LOG_TYPE_ICONS] || <Info size={14} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{log.title}</p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${SEVERITY_COLORS[log.severity as keyof typeof SEVERITY_COLORS]}`}
                          >
                            {log.severity.toUpperCase()}
                          </Badge>
                        </div>
                        {log.description && (
                          <p className="text-[10px] text-muted-foreground mt-1">{log.description}</p>
                        )}
                        {log.userName && (
                          <p className="text-[9px] text-muted-foreground mt-1">
                            👤 {log.userName}
                            {log.channelName && ` • #${log.channelName}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.createdAt), 'HH:mm:ss', { locale: ptBR })}
                      </p>
                      <p className="text-[8px] text-muted-foreground">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalLogs > 20 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-[9px] text-muted-foreground">
                Mostrando {page * 20 + 1} a {Math.min((page + 1) * 20, totalLogs)} de {totalLogs}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 20 >= totalLogs}
                  variant="outline"
                  size="sm"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
