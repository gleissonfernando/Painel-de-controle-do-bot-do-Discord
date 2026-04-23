# 🎮 Discord Bot Dashboard

Um painel de controle completo para gerenciar configurações do seu bot Discord por servidor. Construído com **React**, **TypeScript**, **tRPC** e **MongoDB**.

![Status](https://img.shields.io/badge/status-ativo-brightgreen)
![Node](https://img.shields.io/badge/node-20+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Funcionalidades

- 🔐 **Autenticação OAuth2** - Login seguro com Discord
- ⚙️ **Configurações Gerais** - Prefixo, idioma, timezone, canais e cargos
- 🤖 **Gerenciamento de Comandos** - Ativar/desativar comandos por servidor
- 📨 **Mensagens Personalizadas** - Boas-vindas e despedida
- 🛡️ **Auto Moderação** - Anti-spam, anti-link, filtro de palavras
- 📺 **Notificações Sociais** - YouTube, Twitch, TikTok
- 📊 **Logs de Eventos** - Rastreamento de atividades do servidor
- 📱 **Responsivo** - Funciona em desktop, tablet e mobile
- 🎨 **Tema Escuro** - Interface moderna com paleta preta e vermelha

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- npm ou pnpm
- MongoDB
- Conta Discord Developer

### Instalação Local

```bash
# 1. Clonar repositório
git clone https://github.com/gleissonfernando/Painel-de-controle-do-bot-do-Discord.git
cd Painel-de-controle-do-bot-do-Discord

# 2. Instalar dependências
npm install --legacy-peer-deps

# 3. Copiar variáveis de ambiente
cp .env.example .env

# 4. Preencher .env com suas credenciais
# (veja seção Configuração abaixo)

# 5. Iniciar em desenvolvimento
npm run dev

# 6. Abrir no navegador
# http://localhost:3000
```

### Compilar para Produção

```bash
# Build
npm run build

# Testar build
npm start

# Ou com Docker
docker build -t discord-bot-dashboard .
docker run -p 3000:80 --env-file .env discord-bot-dashboard
```

## ⚙️ Configuração

### 1. Discord Developer Portal

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Vá para "OAuth2" e copie:
   - **Client ID**
   - **Client Secret**
4. Vá para "Bot" e crie um bot, copie o **Token**
5. Em "OAuth2" → "Redirects", adicione:
   ```
   https://seu-dominio.com/auth/discord/callback
   ```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# Discord
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_BOT_TOKEN=seu_bot_token

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database

# Manus OAuth
OAUTH_SERVER_URL=https://seu-oauth-server.com
MANUS_PROJECT_ID=seu_project_id

# Segurança
SESSION_SECRET=gere_uma_chave_aleatoria_segura

# Aplicação
APP_URL=https://seu-dominio.com
NODE_ENV=production
```

### 3. Permissões do Bot

No Discord Developer Portal, certifique-se de que o bot tem:
- ✅ View Channels
- ✅ Read Messages/View Channels
- ✅ Send Messages
- ✅ Manage Roles
- ✅ Manage Channels
- ✅ Read Message History

## 📖 Uso

### Acessar o Dashboard

1. Vá para `https://seu-dominio.com`
2. Clique em "Login with Discord"
3. Autorize a aplicação
4. Selecione um servidor para gerenciar

### Módulos Disponíveis

#### 🏠 Dashboard
- Estatísticas do servidor (membros, canais, cargos)
- Atividade recente

#### ⚙️ General Settings
- Prefixo de comandos
- Idioma da interface
- Timezone do servidor
- Cargo de administrador
- Canais padrão

#### 🤖 Commands
- Lista de comandos disponíveis
- Ativar/desativar por servidor
- Configurar cooldown

#### 📨 Messages
- Mensagem de boas-vindas
- Mensagem de despedida
- Mensagens em DM

#### 🛡️ Auto Moderation
- Anti-spam
- Anti-link
- Filtro de palavras
- Anti-caps
- Tipos de punição

#### 📺 Social Notifications
- YouTube
- Twitch
- TikTok
- Configurar canais e mensagens

#### 📊 Logs
- Eventos de entrada/saída
- Banimentos
- Edições de mensagens
- Histórico completo

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
.
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas do dashboard
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Utilitários e hooks
│   └── index.html
├── server/                 # Backend Node.js
│   ├── _core/             # Configuração core
│   ├── routers.ts         # Rotas tRPC
│   ├── models.ts          # Schemas MongoDB
│   └── db.ts              # Funções de banco de dados
├── shared/                # Código compartilhado
├── package.json
└── vite.config.ts
```

### Scripts Disponíveis

```bash
npm run dev       # Iniciar em desenvolvimento
npm run build     # Compilar para produção
npm start         # Rodar build de produção
npm run check     # Verificar tipos TypeScript
npm run format    # Formatar código com Prettier
npm test          # Rodar testes
```

### Tecnologias

- **Frontend:** React 19, TypeScript, TailwindCSS, Shadcn/ui
- **Backend:** Express, tRPC, Node.js
- **Database:** MongoDB, Mongoose
- **Autenticação:** OAuth2 Discord, JWT
- **Build:** Vite, esbuild
- **Testes:** Vitest

## 🐳 Docker

### Build

```bash
docker build -t discord-bot-dashboard .
```

### Run

```bash
docker run -p 3000:80 \
  -e DISCORD_CLIENT_ID=xxx \
  -e DISCORD_CLIENT_SECRET=xxx \
  -e DISCORD_BOT_TOKEN=xxx \
  -e MONGODB_URI=xxx \
  discord-bot-dashboard
```

### Docker Compose

```bash
docker-compose up -d
```

## 🚀 Deploy

### Vercel

```bash
# Fazer push para GitHub
git push origin main

# Conectar ao Vercel e configurar variáveis de ambiente
# Vercel fará deploy automaticamente
```

### Railway

```bash
# Fazer push para GitHub
git push origin main

# Conectar ao Railway
# Railway fará deploy automaticamente
```

### Docker (VPS/Servidor)

```bash
# Build
docker build -t discord-bot-dashboard .

# Run
docker run -d -p 80:80 \
  --env-file .env \
  --name discord-bot \
  discord-bot-dashboard

# Logs
docker logs -f discord-bot
```

Veja [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções detalhadas.

## 📝 Testes

```bash
# Rodar testes
npm test

# Com coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
npm install --legacy-peer-deps
npm run build
```

### Erro: "MongoDB connection failed"

- Verifique `MONGODB_URI`
- Certifique-se de que o IP está whitelisted
- Verifique credenciais

### Erro: "Discord OAuth failed"

- Verifique `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`
- Certifique-se de que Redirect URI está correto
- Verifique se `APP_URL` corresponde ao domínio

### Porta 80 em uso

```bash
# Mudar para porta 3000 em desenvolvimento
npm run dev
```

## 📚 Documentação

- [Deployment Guide](./DEPLOYMENT.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Discord.js Documentation](https://discord.js.org)
- [tRPC Documentation](https://trpc.io)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Gleisson Fernando**
- GitHub: [@gleissonfernando](https://github.com/gleissonfernando)

## 🙏 Agradecimentos

- [Discord.js](https://discord.js.org) - Discord API wrapper
- [tRPC](https://trpc.io) - Type-safe RPC
- [React](https://react.dev) - UI library
- [TailwindCSS](https://tailwindcss.com) - CSS framework
- [Shadcn/ui](https://ui.shadcn.com) - Component library

## 📞 Suporte

Se encontrar problemas:

1. Verifique [Issues](https://github.com/gleissonfernando/Painel-de-controle-do-bot-do-Discord/issues)
2. Abra uma nova issue com detalhes
3. Consulte [DEPLOYMENT.md](./DEPLOYMENT.md) para troubleshooting

---

**Última atualização:** 23 de Abril de 2026

⭐ Se este projeto foi útil, considere dar uma estrela!
