# Guia de Deploy Permanente

Este guia descreve como fazer deploy do dashboard em plataformas de hosting permanente.

## 🚀 Opções de Deploy

### 1. Vercel (Recomendado - Mais Fácil)

**Vantagens:**
- ✅ Deploy automático via GitHub
- ✅ Suporte nativo para Node.js
- ✅ Plano gratuito generoso
- ✅ Escalabilidade automática

**Passos:**

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione seu repositório GitHub
4. Configure as variáveis de ambiente:
   ```
   DISCORD_CLIENT_ID=seu_client_id
   DISCORD_CLIENT_SECRET=seu_client_secret
   DISCORD_BOT_TOKEN=seu_bot_token
   DISCORD_REDIRECT_URI=https://seu-projeto.vercel.app/auth/discord/callback
   DISCORD_SERVER_ID=seu_server_id
   DISCORD_WEBHOOK_URL=seu_webhook_url
   MONGODB_URI=sua_mongodb_uri
   SESSION_SECRET=gere_uma_chave_aleatoria
   ```
5. Clique em "Deploy"

**Arquivo de configuração:** `vercel.json`

---

### 2. Railway (Alternativa)

**Vantagens:**
- ✅ Interface simples
- ✅ Suporte a Docker
- ✅ Créditos gratuitos mensais
- ✅ Deploy via GitHub

**Passos:**

1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Autorize e selecione o repositório
5. Configure as variáveis de ambiente (mesmas do Vercel)
6. Railway fará o deploy automaticamente

**Arquivo de configuração:** `railway.json`

---

### 3. Heroku (Clássico)

**Vantagens:**
- ✅ Muito popular
- ✅ Fácil de usar
- ✅ Suporte a MongoDB via add-ons

**Passos:**

1. Instale [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Faça login:
   ```bash
   heroku login
   ```
3. Crie a aplicação:
   ```bash
   heroku create seu-app-name
   ```
4. Configure as variáveis:
   ```bash
   heroku config:set DISCORD_CLIENT_ID=seu_client_id
   heroku config:set DISCORD_CLIENT_SECRET=seu_client_secret
   # ... (configure todas as variáveis)
   ```
5. Faça push:
   ```bash
   git push heroku main
   ```

**Arquivo de configuração:** `Procfile`

---

### 4. Docker (Seu Próprio Servidor)

**Vantagens:**
- ✅ Controle total
- ✅ Sem limites de recursos
- ✅ Pode rodar em qualquer servidor

**Passos:**

1. Construa a imagem:
   ```bash
   docker build -t discord-bot-dashboard .
   ```

2. Execute o container:
   ```bash
   docker run -p 80:80 \
     -e DISCORD_CLIENT_ID=seu_client_id \
     -e DISCORD_CLIENT_SECRET=seu_client_secret \
     -e DISCORD_BOT_TOKEN=seu_bot_token \
     -e DISCORD_REDIRECT_URI=https://seu-dominio.com/auth/discord/callback \
     -e DISCORD_SERVER_ID=seu_server_id \
     -e DISCORD_WEBHOOK_URL=seu_webhook_url \
     -e MONGODB_URI=sua_mongodb_uri \
     -e SESSION_SECRET=sua_chave_secreta \
     discord-bot-dashboard
   ```

3. Ou use docker-compose:
   ```bash
   docker-compose up -d
   ```

**Arquivo de configuração:** `Dockerfile`, `docker-compose.yml`

---

## 🔐 Variáveis de Ambiente Obrigatórias

```env
# Discord OAuth2
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_BOT_TOKEN=seu_bot_token
DISCORD_REDIRECT_URI=https://seu-dominio.com/auth/discord/callback
DISCORD_SERVER_ID=seu_server_id
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/id/token

# Banco de Dados
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database

# Segurança
SESSION_SECRET=gere_uma_chave_aleatoria_longa_e_segura

# Aplicação
NODE_ENV=production
PORT=80
```

---

## 📊 Comparação de Plataformas

| Plataforma | Custo | Facilidade | Escalabilidade | Recomendado |
|-----------|-------|-----------|----------------|------------|
| Vercel | Gratuito | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ SIM |
| Railway | Gratuito | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ SIM |
| Heroku | Pago | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ Talvez |
| Docker | Variável | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Avançado |

---

## ✅ Checklist Pré-Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Domínio customizado configurado (opcional)
- [ ] SSL/HTTPS ativado
- [ ] Banco de dados MongoDB acessível
- [ ] Webhook do Discord criado
- [ ] OAuth2 Redirect URI atualizado no Discord Developer Portal
- [ ] Build local testado: `npm run build:fast`
- [ ] Sem erros de TypeScript: `npm run check`

---

## 🔍 Troubleshooting

### Erro: "Build failed - JavaScript heap out of memory"

**Solução:** A plataforma já usa `NODE_OPTIONS=--max-old-space-size=2048`

Se ainda falhar, tente:
1. Aumentar memória da função (Vercel)
2. Usar Railway em vez de Vercel
3. Deploy com Docker em servidor próprio

### Erro: "Cannot find module 'discord.js'"

**Solução:** Reinstalar dependências

```bash
npm install
npm run build:fast
```

### Erro: "DISCORD_CLIENT_SECRET is not defined"

**Solução:** Verificar se as variáveis estão configuradas na plataforma

```bash
# Vercel
vercel env list

# Heroku
heroku config

# Railway
railway variables
```

### Erro: "Webhook URL inválido"

**Solução:** Criar novo webhook no Discord

1. Vá para o canal
2. Editar Canal → Integrações → Webhooks
3. Criar novo webhook
4. Copiar URL completa
5. Atualizar `DISCORD_WEBHOOK_URL`

---

## 📈 Monitoramento

### Vercel

Dashboard em [vercel.com/dashboard](https://vercel.com/dashboard)

### Railway

Dashboard em [railway.app/dashboard](https://railway.app/dashboard)

### Heroku

```bash
heroku logs --tail
```

### Docker

```bash
docker logs container_id
```

---

## 🔄 Atualizações

Para atualizar o código em produção:

1. Faça as mudanças localmente
2. Teste: `npm run build:fast`
3. Faça commit: `git commit -m "..."`
4. Faça push: `git push origin main`
5. A plataforma fará deploy automaticamente

---

## 💡 Dicas

- **Usar Vercel** para máxima facilidade
- **Usar Railway** se Vercel falhar
- **Usar Docker** para máximo controle
- **Monitorar logs** regularmente
- **Fazer backup** do banco de dados

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs da plataforma
2. Leia a documentação oficial
3. Abra uma issue no GitHub

---

**Última atualização:** 25 de Abril de 2026
