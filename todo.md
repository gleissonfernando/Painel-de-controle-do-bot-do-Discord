# Discord Bot Dashboard - TODO

## Fase 1: Estrutura Base e Banco de Dados
- [x] Inicializar projeto com scaffold web-db-user
- [x] Configurar schema do banco de dados (guilds, settings, automod, notifications, logs)
- [x] Executar migrations do banco de dados

## Fase 2: Backend
- [x] Configurar variáveis de ambiente para Discord OAuth2 (CLIENT_ID, CLIENT_SECRET, BOT_TOKEN)
- [x] Implementar rota de autenticação (Manus OAuth + demo guilds)
- [x] Rota para listar guilds do usuário com verificação de permissões de admin
- [x] Rota para obter detalhes de uma guild específica
- [x] Rota para configurações gerais do bot por servidor (prefix, language, timezone)
- [x] Rota para módulo de Auto Moderation (anti-spam, anti-link, word filter, punishments)
- [x] Rota para módulo de Social Notifications (YouTube, Twitch, TikTok)
- [x] Rota para módulo de Logs (eventos do servidor)
- [x] Rota para módulo de Commands (lista de comandos ativos)
- [x] Middleware de autenticação e verificação de permissões
- [x] Integração com Discord API para buscar membros, canais e cargos

## Fase 3: Frontend - Layout e Autenticação
- [x] Configurar tema escuro com paleta preto e vermelho no index.css
- [x] Criar página de Login com botão OAuth2 do Discord
- [x] Criar página de Seleção de Servidor (lista de guilds com ícone e nome)
- [x] Criar layout principal com Sidebar fixa e área de conteúdo
- [x] Sidebar com módulos: General Settings, Commands, Messages, Auto Moderation, Social Notifications, Logs
- [x] Header do dashboard com nome do servidor, avatar do usuário e botão de logout
- [x] Roteamento entre módulos do dashboard

## Fase 4: Módulos do Dashboard
- [x] Dashboard principal com cards de estatísticas (membros, comandos, uptime, canais)
- [x] Módulo General Settings (prefix, language, timezone, admin role, default channels)
- [x] Módulo Commands (lista de comandos com toggle ativo/inativo)
- [x] Módulo Messages (mensagens de boas-vindas e despedida)
- [x] Módulo Auto Moderation (anti-spam, anti-link, word filter, punishments)
- [x] Módulo Social Notifications (YouTube, Twitch, TikTok - adicionar canais, mensagem, canal destino)
- [x] Módulo Logs (visualização de eventos: entradas, saídas, banimentos, edições)

## Fase 5: Finalização
- [x] Responsividade mobile e tablet
- [x] Animações e micro-interações
- [x] Testes unitários (vitest) - 9 testes passando
- [x] Checkpoint final e entrega
