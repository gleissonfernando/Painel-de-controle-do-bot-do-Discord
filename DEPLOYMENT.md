# Guia de Deployment - Discord Bot Dashboard

Este documento descreve como fazer deploy do Dashboard em diferentes plataformas.

## Pré-requisitos

- Node.js 20+
- npm ou pnpm
- Conta Discord Developer
- Banco de dados MongoDB

## Configuração Inicial

### 1. Criar Aplicação no Discord Developer Portal

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em "New Application"
3. Dê um nome à sua aplicação
4. Vá para "OAuth2" → "General"
5. Copie o **Client ID** e **Client Secret**
6. Vá para "Bot" → "Add Bot"
7. Copie o **Token** do bot

### 2. Configurar OAuth2 Redirect

1. Em "OAuth2" → "Redirects", adicione:
   ```
   https://seu-dominio.com/auth/discord/callback
   https://seu-dominio.com/api/auth/discord/callback
   ```

### 3. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Preencha com suas credenciais:

```env
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_BOT_TOKEN=seu_bot_token
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
OAUTH_SERVER_URL=https://seu-oauth-server.com
MANUS_PROJECT_ID=seu_project_id
SESSION_SECRET=gere_uma_chave_segura_aleatoria
APP_URL=https://seu-dominio.com
NODE_ENV=production
```

## Opção 1: Deploy com Docker

### Localmente

```bash
# Copiar .env.example para .env e preencher
cp .env.example .env

# Construir imagem
docker build -t discord-bot-dashboard .

# Rodar container
docker run -p 3000:80 --env-file .env discord-bot-dashboard
```

### Com Docker Compose

```bash
# Copiar e preencher .env
cp .env.example .env

# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down
```

## Opção 2: Deploy com Vercel

### Passos

1. **Fazer push para GitHub**
   ```bash
   git push origin main
   ```

2. **Conectar ao Vercel**
   - Acesse [Vercel](https://vercel.com)
   - Clique "New Project"
   - Selecione seu repositório GitHub
   - Clique "Import"

3. **Configurar Variáveis de Ambiente**
   - Em "Environment Variables", adicione:
     - `DISCORD_CLIENT_ID`
     - `DISCORD_CLIENT_SECRET`
     - `DISCORD_BOT_TOKEN`
     - `MONGODB_URI`
     - `OAUTH_SERVER_URL`
     - `MANUS_PROJECT_ID`
     - `SESSION_SECRET`
     - `APP_URL`

4. **Deploy**
   - Clique "Deploy"
   - Aguarde a compilação

### URL do Vercel

Após o deploy, você terá uma URL como:
```
https://seu-projeto.vercel.app
```

## Opção 3: Deploy com Railway

### Passos

1. **Fazer push para GitHub**
   ```bash
   git push origin main
   ```

2. **Conectar ao Railway**
   - Acesse [Railway](https://railway.app)
   - Clique "New Project"
   - Selecione "Deploy from GitHub repo"
   - Autorize e selecione seu repositório

3. **Adicionar Banco de Dados**
   - Clique "Add Service"
   - Selecione "MongoDB"
   - Configure o banco

4. **Configurar Variáveis**
   - Vá para "Variables"
   - Adicione todas as variáveis do `.env.example`

5. **Deploy**
   - Railway fará deploy automaticamente

## Opção 4: Deploy com Shard Cloud

### Passos

1. **Preparar o projeto**
   ```bash
   npm run build
   ```

2. **Fazer push para GitHub**
   ```bash
   git push origin main
   ```

3. **Conectar ao Shard Cloud**
   - Acesse Shard Cloud
   - Crie novo projeto
   - Conecte seu repositório GitHub
   - Configure variáveis de ambiente

4. **Deploy**
   - Shard Cloud fará deploy automaticamente

## Verificação Pós-Deploy

Após o deploy, verifique se tudo está funcionando:

```bash
# Testar página principal
curl https://seu-dominio.com

# Testar API
curl https://seu-dominio.com/api/trpc/auth.me

# Verificar logs
# (Varia conforme plataforma)
```

## Troubleshooting

### Erro: "EACCES: permission denied 0.0.0.0:80"

**Solução:** Use porta 3000 em desenvolvimento ou execute com `sudo` em produção.

### Erro: "Cannot find module"

**Solução:** 
```bash
npm install --legacy-peer-deps
npm run build
```

### Erro: "MongoDB connection failed"

**Solução:** Verifique se:
- `MONGODB_URI` está correto
- IP está whitelisted no MongoDB Atlas
- Banco de dados existe

### Erro: "Discord OAuth failed"

**Solução:** Verifique se:
- `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET` estão corretos
- Redirect URI está configurado no Discord Developer Portal
- `APP_URL` corresponde ao domínio do seu app

## Monitoramento

### Logs

Acesse os logs da sua plataforma:
- **Vercel:** Dashboard → Deployments → Logs
- **Railway:** Project → Logs
- **Docker:** `docker logs <container_id>`

### Métricas

Monitore:
- CPU e memória
- Requisições HTTP
- Erros de aplicação
- Latência da API

## Atualizações

Para atualizar o código em produção:

```bash
# Fazer alterações localmente
git add .
git commit -m "descrição da mudança"
git push origin main

# A plataforma fará deploy automaticamente (se configurado)
```

## Segurança

- ✅ Nunca commitar `.env` com credenciais reais
- ✅ Usar variáveis de ambiente para secrets
- ✅ Manter dependências atualizadas: `npm audit fix`
- ✅ Usar HTTPS em produção
- ✅ Whitelist IPs do MongoDB se possível
- ✅ Rotar `SESSION_SECRET` periodicamente

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs
2. Consulte a documentação da plataforma
3. Abra uma issue no GitHub

---

**Última atualização:** 23 de Abril de 2026
