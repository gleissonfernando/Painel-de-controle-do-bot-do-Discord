import { trpc } from "@/lib/trpc";
import {
  FileText,
  Search,
  Filter,
  Users,
  MessageSquare,
  Shield,
  Activity,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface LogsPageProps {
  guildId: string;
}

const EVENT_TYPES = [
  { value: "all", label: "Todos os Eventos" },
  { value: "member_join", label: "Entrada de Membro" },
  { value: "member_leave", label: "Saída de Membro" },
  { value: "member_ban", label: "Banimento" },
  { value: "member_unban", label: "Desbanimento" },
  { value: "message_delete", label: "Mensagem Deletada" },
  { value: "message_edit", label: "Mensagem Editada" },
  { value: "command_used", label: "Comando Utilizado" },
  { value: "live_notification", label: "Notificação ao Vivo" },
];

const EVENT_ICONS: Record<string, React.ReactNode> = {
  member_join: <Users size={14} />,
  member_leave: <Users size={14} />,
  member_ban: <Shield size={14} />,
  member_unban: <Shield size={14} />,
  message_delete: <Trash2 size={14} />,
  message_edit: <MessageSquare size={14} />,
  command_used: <Activity size={14} />,
  live_notification: <Activity size={14} />,
};

const EVENT_COLORS: Record<string, string> = {
  member_join: "text-primary bg-primary/10 border-primary/20",
  member_leave: "text-muted-foreground bg-muted/10 border-border",
  member_ban: "text-red-500 bg-red-500/10 border-red-500/20",
  member_unban: "text-primary bg-primary/10 border-primary/20",
  message_delete: "text-red-400 bg-red-400/10 border-red-400/20",
  message_edit: "text-primary bg-primary/10 border-primary/20",
  command_used: "text-primary bg-primary/10 border-primary/20",
  live_notification: "text-primary bg-primary/10 border-primary/20",
};

const EVENT_LABELS: Record<string, string> = {
  member_join: "Entrada de Membro",
  member_leave: "Saída de Membro",
  member_ban: "Membro Banido",
  member_unban: "Membro Desbanido",
  message_delete: "Mensagem Deletada",
  message_edit: "Mensagem Editada",
  command_used: "Comando Utilizado",
  live_notification: "Notificação ao Vivo",
};

export default function LogsPage({ guildId }: LogsPageProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [limit] = useState(50);

  const { data: allLogs, isLoading } = trpc.logs.list.useQuery({
    guildId,
    limit,
  });

  const logs =
    selectedType === "all"
      ? allLogs
      : (allLogs ?? []).filter(l => l.eventType === selectedType);

  const filtered = (logs ?? []).filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (log.userName ?? "").toLowerCase().includes(s) ||
      (log.eventType ?? "").toLowerCase().includes(s) ||
      JSON.stringify(log.details ?? "")
        .toLowerCase()
        .includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText size={22} className="text-primary" />
          Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Veja todos os eventos do servidor e atividades do bot
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total de Eventos",
            value: logs?.length ?? 0,
            color: "text-foreground",
          },
          {
            label: "Eventos de Membros",
            value: (logs ?? []).filter(l => l.eventType?.startsWith("member"))
              .length,
            color: "text-primary",
          },
          {
            label: "Ações de Mod",
            value: (logs ?? []).filter(l =>
              ["member_ban", "member_unban"].includes(l.eventType ?? "")
            ).length,
            color: "text-red-500",
          },
          {
            label: "Mensagens",
            value: (logs ?? []).filter(l => l.eventType?.startsWith("message"))
              .length,
            color: "text-primary",
          },
        ].map(s => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-xl p-4"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Pesquisar por usuário, evento ou detalhes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground flex-shrink-0" />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          >
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border bg-muted/30">
          <div className="col-span-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Evento
          </div>
          <div className="col-span-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Usuário
          </div>
          <div className="col-span-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Detalhes
          </div>
          <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
            Hora
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="grid grid-cols-12 gap-4 animate-pulse">
                <div className="col-span-3 h-4 bg-muted rounded" />
                <div className="col-span-3 h-4 bg-muted rounded" />
                <div className="col-span-4 h-4 bg-muted rounded" />
                <div className="col-span-2 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <FileText
              size={32}
              className="text-muted-foreground mx-auto mb-2"
            />
            <p className="text-muted-foreground text-sm">Nenhum log encontrado</p>
            {search && (
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar sua pesquisa ou filtro
              </p>
            )}
          </div>
        )}

        {/* Rows */}
        {!isLoading && filtered.length > 0 && (
          <div className="divide-y divide-border">
            {filtered.map((log, i) => {
              const colorClass =
                EVENT_COLORS[log.eventType ?? ""] ??
                "text-muted-foreground bg-muted border-border";
              const icon = EVENT_ICONS[log.eventType ?? ""] ?? (
                <Activity size={14} />
              );
              const label = EVENT_LABELS[log.eventType ?? ""] ?? log.eventType;

              return (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-4 px-5 py-3 hover:bg-accent/30 transition-colors items-center"
                >
                  {/* Event Type */}
                  <div className="col-span-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
                    >
                      {icon}
                      {label}
                    </span>
                  </div>

                  {/* User */}
                  <div className="col-span-3">
                    <p className="text-sm text-foreground font-medium truncate">
                      {log.userName ?? "Unknown"}
                    </p>
                    {log.userId && (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {log.userId}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="col-span-4">
                    <p className="text-xs text-muted-foreground truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="col-span-2 text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(log.createdAt).toLocaleDateString("pt-BR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando {filtered.length} de {logs?.length ?? 0} eventos
        </p>
      )}
    </div>
  );
}
