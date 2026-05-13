export const translations = {
  pt: {
    // Login Page
    login: {
      title: "BotPanel",
      subtitle:
        "O painel definitivo de gerenciamento de bot Discord. Controle seus servidores com precisão.",
      welcome: "Bem-vindo de volta",
      signIn: "Entre com sua conta do Discord para continuar",
      loginButton: "Entrar com Discord",
      terms:
        "Ao fazer login, você concorda com nossos Termos de Serviço e Política de Privacidade",
      footer: "© 2024-2026 BotPanel • Todos os direitos reservados",
      features: {
        autoMod: "Auto Moderação",
        autoModDesc: "Anti-spam, anti-link e filtros de palavras",
        socialNotif: "Notificações Sociais",
        socialNotifDesc: "Alertas de YouTube, Twitch e TikTok",
        commands: "Comandos Personalizados",
        commandsDesc: "Gerencie todos os comandos do bot facilmente",
      },
    },

    // Onboarding Page
    onboarding: {
      title: "Bem-vindo ao BotPanel!",
      subtitle:
        "Para começar, você precisa adicionar o bot ao seu servidor Discord.",
      subtitleDesc:
        "Depois de adicionado, você poderá gerenciar todos os seus servidores em um painel.",
      step1: "Clique no botão abaixo",
      step1Desc: "Você será redirecionado para o Discord para autorizar o bot",
      step2: "Selecione seu servidor",
      step2Desc: "Escolha qual servidor você deseja adicionar o bot",
      step3: "Conceda permissões",
      step3Desc:
        "O bot precisa de permissões de admin para gerenciar seu servidor",
      step4: "Pronto!",
      step4Desc:
        "Seu servidor aparecerá no painel e você pode começar a gerenciá-lo",
      addBotButton: "Adicionar Bot ao Servidor",
      dashboardButton: "Ir para o Painel",
      tip: "💡 Dica",
      tipDesc:
        "Depois de adicionar o bot, volte para esta página ou vá para o painel. Seu servidor aparecerá na lista e você pode começar a gerenciá-lo imediatamente.",
    },

    // Server Select Page
    servers: {
      loggedInAs: "Conectado como",
      noServers: "Nenhum servidor ainda",
      addServer: "Adicionar Servidor",
      addAServer: "Adicionar um servidor",
      selectServer: "Selecione um Servidor",
      selectServerDesc:
        "Escolha um servidor da lista à esquerda para gerenciá-lo",
      noServersYet: "Nenhum Servidor Ainda",
      noServersDesc:
        "Adicione o bot ao seu servidor Discord para começar com o BotPanel",
      addBotToServer: "Adicionar Bot ao Servidor",
    },

    // Dashboard
    dashboard: {
      title: "Painel",
      subtitle: "Bem-vindo ao seu painel de gerenciamento",
      stats: {
        members: "Membros",
        channels: "Canais",
        roles: "Cargos",
        commands: "Comandos",
      },
    },

    // General Settings
    generalSettings: {
      title: "Configurações Gerais",
      subtitle: "Configure as configurações básicas do bot para seu servidor",
      botConfig: "Configuração do Bot",
      commandPrefix: "Prefixo de Comando",
      botStatus: "Status do Bot",
      enabled: "Ativado",
      disabled: "Desativado",
      localization: "Localização",
      language: "Idioma",
      timezone: "Fuso Horário",
      channelsRoles: "Canais e Cargos",
      adminRole: "Cargo de Admin",
      noneSelected: "Nenhum selecionado",
      welcomeChannel: "Canal de Boas-vindas",
      logsChannel: "Canal de Logs",
      saveChanges: "Salvar Alterações",
      saved: "Alterações salvas com sucesso!",
      error: "Erro ao salvar alterações",
    },

    // Commands Page
    commands: {
      title: "Comandos",
      subtitle: "Gerencie os comandos do seu bot",
      addCommand: "Adicionar Comando",
      noCommands: "Nenhum comando ainda",
      name: "Nome",
      description: "Descrição",
      enabled: "Ativado",
      disabled: "Desativado",
      delete: "Deletar",
      edit: "Editar",
    },

    // Messages Page
    messages: {
      title: "Mensagens",
      subtitle: "Configure mensagens de boas-vindas e despedida",
      welcomeMessage: "Mensagem de Boas-vindas",
      welcomeChannel: "Canal de Boas-vindas",
      welcomeContent: "Conteúdo da Mensagem",
      goodbyeMessage: "Mensagem de Despedida",
      goodbyeChannel: "Canal de Despedida",
      goodbyeContent: "Conteúdo da Mensagem",
      enabled: "Ativado",
      disabled: "Desativado",
      saveChanges: "Salvar Alterações",
      saved: "Mensagens salvas com sucesso!",
      error: "Erro ao salvar mensagens",
    },

    // Auto Moderation Page
    autoMod: {
      title: "Auto Moderação",
      subtitle: "Configure regras de moderação automática",
      antiSpam: "Anti-Spam",
      antiSpamDesc: "Detectar e punir spam",
      antiLink: "Anti-Link",
      antiLinkDesc: "Detectar e punir links não autorizados",
      wordFilter: "Filtro de Palavras",
      wordFilterDesc: "Filtrar palavras proibidas",
      enabled: "Ativado",
      disabled: "Desativado",
      maxMessages: "Máximo de Mensagens",
      timeWindow: "Janela de Tempo (segundos)",
      punishment: "Punição",
      warn: "Aviso",
      mute: "Mutar",
      kick: "Expulsar",
      ban: "Banir",
      saveChanges: "Salvar Alterações",
      saved: "Configurações salvas com sucesso!",
      error: "Erro ao salvar configurações",
    },

    // Social Notifications Page
    socialNotif: {
      title: "Notificações Sociais",
      subtitle: "Configure notificações de YouTube, Twitch e TikTok",
      youtube: "YouTube",
      twitch: "Twitch",
      tiktok: "TikTok",
      enabled: "Ativado",
      disabled: "Desativado",
      channel: "Canal",
      channelName: "Nome do Canal",
      notificationChannel: "Canal de Notificação",
      message: "Mensagem",
      addChannel: "Adicionar Canal",
      removeChannel: "Remover Canal",
      saveChanges: "Salvar Alterações",
      saved: "Configurações salvas com sucesso!",
      error: "Erro ao salvar configurações",
    },

    // Logs Page
    logs: {
      title: "Logs",
      subtitle: "Visualize os eventos do seu servidor",
      noLogs: "Nenhum log ainda",
      event: "Evento",
      user: "Usuário",
      timestamp: "Data/Hora",
      details: "Detalhes",
      memberJoined: "Membro Entrou",
      memberLeft: "Membro Saiu",
      memberBanned: "Membro Banido",
      memberKicked: "Membro Expulso",
      messageDeleted: "Mensagem Deletada",
      messageEdited: "Mensagem Editada",
      roleCreated: "Cargo Criado",
      roleDeleted: "Cargo Deletado",
      channelCreated: "Canal Criado",
      channelDeleted: "Canal Deletado",
    },

    // Welcome/Goodbye Messages
    welcomeGoodbye: {
      title: "Mensagens de Entrada e Saída",
      subtitle:
        "Configure mensagens personalizadas para quando usuários entram ou saem do servidor",
      welcomeMessage: "Mensagem de Entrada",
      welcomeChannel: "Canal de Destino",
      welcomeContent: "Mensagem",
      goodbyeMessage: "Mensagem de Saída",
      goodbyeChannel: "Canal de Destino",
      goodbyeContent: "Mensagem",
      enabled: "Ativado",
      disabled: "Desativado",
      preview: "Preview",
      saveChanges: "Salvar Configurações",
      saved: "Configurações salvas!",
      error: "Erro ao salvar",
      variables: "Variáveis disponíveis",
      userMention: "Menção do usuário",
      username: "Nome do usuário",
      server: "Nome do servidor",
      memberCount: "Total de membros",
      joinPosition: "Posição de entrada",
    },

    // Sidebar
    sidebar: {
      dashboard: "Painel",
      generalSettings: "Configurações Gerais",
      commands: "Comandos",
      messages: "Mensagens",
      welcomeGoodbye: "Entrada e Saída",
      autoModeration: "Auto Moderação",
      socialNotifications: "Notificações Sociais",
      logs: "Logs",
      logout: "Sair",
    },

    // Common
    common: {
      loading: "Carregando...",
      error: "Erro",
      success: "Sucesso",
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Deletar",
      edit: "Editar",
      add: "Adicionar",
      close: "Fechar",
      search: "Pesquisar",
      noResults: "Nenhum resultado encontrado",
      selectServer: "Selecione um servidor",
      clickToChange: "Clique para alterar",
      botOnline: "Bot Online",
      botOffline: "Bot Offline",
    },
  },

  en: {
    // Login Page
    login: {
      title: "BotPanel",
      subtitle:
        "The ultimate Discord bot management dashboard. Control your servers with precision.",
      welcome: "Welcome back",
      signIn: "Sign in with your Discord account to continue",
      loginButton: "Login with Discord",
      terms:
        "By logging in, you agree to our Terms of Service and Privacy Policy",
      footer: "© 2024-2026 BotPanel • All rights reserved",
      features: {
        autoMod: "Auto Moderation",
        autoModDesc: "Anti-spam, anti-link and word filters",
        socialNotif: "Social Notifications",
        socialNotifDesc: "YouTube, Twitch and TikTok alerts",
        commands: "Custom Commands",
        commandsDesc: "Manage all bot commands easily",
      },
    },

    // Onboarding Page
    onboarding: {
      title: "Welcome to BotPanel!",
      subtitle:
        "To get started, you need to add the bot to your Discord server.",
      subtitleDesc:
        "Once added, you'll be able to manage all your servers from one dashboard.",
      step1: "Click the button below",
      step1Desc: "You'll be redirected to Discord to authorize the bot",
      step2: "Select your server",
      step2Desc: "Choose which server you want to add the bot to",
      step3: "Grant permissions",
      step3Desc: "The bot needs admin permissions to manage your server",
      step4: "Done!",
      step4Desc:
        "Your server will appear in the dashboard and you can start managing it",
      addBotButton: "Add Bot to Server",
      dashboardButton: "Go to Dashboard",
      tip: "💡 Tip",
      tipDesc:
        "After adding the bot, return to this page or go to the dashboard. Your server will appear in the list and you can start managing it immediately.",
    },

    // Server Select Page
    servers: {
      loggedInAs: "Logged in as",
      noServers: "No servers yet",
      addServer: "Add Server",
      addAServer: "Add a server",
      selectServer: "Select a Server",
      selectServerDesc:
        "Choose a server from the list on the left to manage it",
      noServersYet: "No Servers Yet",
      noServersDesc:
        "Add the bot to your Discord server to get started with BotPanel",
      addBotToServer: "Add Bot to Server",
    },

    // Dashboard
    dashboard: {
      title: "Dashboard",
      subtitle: "Welcome to your management dashboard",
      stats: {
        members: "Members",
        channels: "Channels",
        roles: "Roles",
        commands: "Commands",
      },
    },

    // General Settings
    generalSettings: {
      title: "General Settings",
      subtitle: "Configure your bot's basic settings for this server",
      botConfig: "Bot Configuration",
      commandPrefix: "Command Prefix",
      botStatus: "Bot Status",
      enabled: "Enabled",
      disabled: "Disabled",
      localization: "Localization",
      language: "Language",
      timezone: "Timezone",
      channelsRoles: "Channels & Roles",
      adminRole: "Admin Role",
      noneSelected: "None selected",
      welcomeChannel: "Welcome Channel",
      logsChannel: "Logs Channel",
      saveChanges: "Save Changes",
      saved: "Changes saved successfully!",
      error: "Error saving changes",
    },

    // Commands Page
    commands: {
      title: "Commands",
      subtitle: "Manage your bot's commands",
      addCommand: "Add Command",
      noCommands: "No commands yet",
      name: "Name",
      description: "Description",
      enabled: "Enabled",
      disabled: "Disabled",
      delete: "Delete",
      edit: "Edit",
    },

    // Messages Page
    messages: {
      title: "Messages",
      subtitle: "Configure welcome and goodbye messages",
      welcomeMessage: "Welcome Message",
      welcomeChannel: "Welcome Channel",
      welcomeContent: "Message Content",
      goodbyeMessage: "Goodbye Message",
      goodbyeChannel: "Goodbye Channel",
      goodbyeContent: "Message Content",
      enabled: "Enabled",
      disabled: "Disabled",
      saveChanges: "Save Changes",
      saved: "Messages saved successfully!",
      error: "Error saving messages",
    },

    // Auto Moderation Page
    autoMod: {
      title: "Auto Moderation",
      subtitle: "Configure automatic moderation rules",
      antiSpam: "Anti-Spam",
      antiSpamDesc: "Detect and punish spam",
      antiLink: "Anti-Link",
      antiLinkDesc: "Detect and punish unauthorized links",
      wordFilter: "Word Filter",
      wordFilterDesc: "Filter prohibited words",
      enabled: "Enabled",
      disabled: "Disabled",
      maxMessages: "Max Messages",
      timeWindow: "Time Window (seconds)",
      punishment: "Punishment",
      warn: "Warn",
      mute: "Mute",
      kick: "Kick",
      ban: "Ban",
      saveChanges: "Save Changes",
      saved: "Settings saved successfully!",
      error: "Error saving settings",
    },

    // Social Notifications Page
    socialNotif: {
      title: "Social Notifications",
      subtitle: "Configure YouTube, Twitch and TikTok notifications",
      youtube: "YouTube",
      twitch: "Twitch",
      tiktok: "TikTok",
      enabled: "Enabled",
      disabled: "Disabled",
      channel: "Channel",
      channelName: "Channel Name",
      notificationChannel: "Notification Channel",
      message: "Message",
      addChannel: "Add Channel",
      removeChannel: "Remove Channel",
      saveChanges: "Save Changes",
      saved: "Settings saved successfully!",
      error: "Error saving settings",
    },

    // Logs Page
    logs: {
      title: "Logs",
      subtitle: "View your server's events",
      noLogs: "No logs yet",
      event: "Event",
      user: "User",
      timestamp: "Date/Time",
      details: "Details",
      memberJoined: "Member Joined",
      memberLeft: "Member Left",
      memberBanned: "Member Banned",
      memberKicked: "Member Kicked",
      messageDeleted: "Message Deleted",
      messageEdited: "Message Edited",
      roleCreated: "Role Created",
      roleDeleted: "Role Deleted",
      channelCreated: "Channel Created",
      channelDeleted: "Channel Deleted",
    },

    // Welcome/Goodbye Messages
    welcomeGoodbye: {
      title: "Welcome & Goodbye Messages",
      subtitle:
        "Configure custom messages for when users join or leave your server",
      welcomeMessage: "Welcome Message",
      welcomeChannel: "Destination Channel",
      welcomeContent: "Message",
      goodbyeMessage: "Goodbye Message",
      goodbyeChannel: "Destination Channel",
      goodbyeContent: "Message",
      enabled: "Enabled",
      disabled: "Disabled",
      preview: "Preview",
      saveChanges: "Save Settings",
      saved: "Settings saved!",
      error: "Error saving",
      variables: "Available variables",
      userMention: "User mention",
      username: "Username",
      server: "Server name",
      memberCount: "Total members",
      joinPosition: "Join position",
    },

    // Sidebar
    sidebar: {
      dashboard: "Dashboard",
      generalSettings: "General Settings",
      commands: "Commands",
      messages: "Messages",
      welcomeGoodbye: "Join & Leave",
      autoModeration: "Auto Moderation",
      socialNotifications: "Social Notifications",
      logs: "Logs",
      logout: "Logout",
    },

    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      close: "Close",
      search: "Search",
      noResults: "No results found",
      selectServer: "Select a server",
      clickToChange: "Click to change",
      botOnline: "Bot Online",
      botOffline: "Bot Offline",
    },
  },
};

export type Language = "pt" | "en";

export function getTranslation(language: Language, path: string): string {
  const keys = path.split(".");
  let value: any = translations[language];

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return path; // Fallback to path if translation not found
    }
  }

  return typeof value === "string" ? value : path;
}
