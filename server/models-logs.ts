/**
 * Modelo de Configurações de Logs por Servidor
 * Cada servidor pode ter seus próprios canais de log para diferentes eventos
 */

export interface LogChannelConfig {
  guildId: string;
  
  // Canais de log
  messageDeleteChannelId?: string;      // Mensagens apagadas
  messageEditChannelId?: string;        // Mensagens editadas
  memberJoinChannelId?: string;         // Membros entrando
  memberLeaveChannelId?: string;        // Membros saindo
  memberBanChannelId?: string;          // Membros banidos
  botActionChannelId?: string;          // Ações do bot
  alertChannelId?: string;              // Canal de alerta geral
  
  // Configurações
  enableMessageLogs: boolean;
  enableMemberLogs: boolean;
  enableBotLogs: boolean;
  enableAlerts: boolean;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
}

export interface LogEntry {
  id: string;
  guildId: string;
  type: "message_delete" | "message_edit" | "member_join" | "member_leave" | "member_ban" | "bot_action" | "alert";
  userId?: string;
  username?: string;
  content?: string;
  channelId?: string;
  channelName?: string;
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AlertMessage {
  id: string;
  guildId: string;
  type: "dev_mode_enabled" | "dev_mode_disabled" | "maintenance_enabled" | "maintenance_disabled" | "global_message" | "custom";
  title: string;
  description: string;
  color: number;
  sentAt: Date;
  sentBy?: string;
}

/**
 * Função para criar configuração padrão de logs
 */
export function createDefaultLogConfig(guildId: string): LogChannelConfig {
  return {
    guildId,
    enableMessageLogs: true,
    enableMemberLogs: true,
    enableBotLogs: true,
    enableAlerts: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Validar se um canal de log está configurado
 */
export function isLogChannelConfigured(config: LogChannelConfig, type: LogEntry["type"]): boolean {
  switch (type) {
    case "message_delete":
    case "message_edit":
      return !!config.messageDeleteChannelId && config.enableMessageLogs;
    case "member_join":
    case "member_leave":
      return !!config.memberJoinChannelId && config.enableMemberLogs;
    case "member_ban":
      return !!config.memberBanChannelId && config.enableMemberLogs;
    case "bot_action":
      return !!config.botActionChannelId && config.enableBotLogs;
    case "alert":
      return !!config.alertChannelId && config.enableAlerts;
    default:
      return false;
  }
}

/**
 * Obter o ID do canal apropriado para um tipo de log
 */
export function getLogChannelId(config: LogChannelConfig, type: LogEntry["type"]): string | undefined {
  switch (type) {
    case "message_delete":
      return config.messageDeleteChannelId;
    case "message_edit":
      return config.messageEditChannelId;
    case "member_join":
      return config.memberJoinChannelId;
    case "member_leave":
      return config.memberLeaveChannelId;
    case "member_ban":
      return config.memberBanChannelId;
    case "bot_action":
      return config.botActionChannelId;
    case "alert":
      return config.alertChannelId;
    default:
      return undefined;
  }
}
