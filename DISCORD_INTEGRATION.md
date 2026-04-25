# Integração Discord API v10

Este documento descreve a integração completa da Discord API v10 no dashboard, incluindo OAuth2, Widget, Webhooks e tratamento de rate limiting.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [OAuth2 Discord](#oauth2-discord)
3. [Widget de Membros](#widget-de-membros)
4. [Webhooks](#webhooks)
5. [Rate Limiting](#rate-limiting)
6. [API Reference](#api-reference)

---

## Configuração Inicial

### Passo 1: Discord Developer Portal

1. Acesse [discord.com/developers/applications](https://discord.com/developers/applications)
2. Clique em "New Application"
3. Dê um nome à sua aplicação
4. Vá para **OAuth2 → General**
5. Copie o **Client ID** e **Client Secret**
6. Vá para **Bot → Add Bot**
7. Copie o **Token** do bot

### Passo 2: Configurar Redirect URI

Em **OAuth2 → General → Redirects**, adicione:

```
http://localhost:3000/auth/discord/callback
https://seu-dominio.com/auth/discord/callback
```

### Passo 3: Ativar Intents

Em **Bot → Privileged Gateway Intents**, ative:

- ✅ PRESENCE INTENT
- ✅ SERVER MEMBERS INTENT
- ✅ MESSAGE CONTENT INTENT

### Passo 4: Criar Webhook

No Discord:

1. Vá para um canal
2. Clique em "Editar Canal" → "Integrações" → "Webhooks"
3. Clique em "Criar Webhook"
4. Copie a URL completa

### Passo 5: Preencher .env

```env
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_BOT_TOKEN=seu_bot_token
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
DISCORD_SERVER_ID=seu_server_id
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/id/token
```

---

## OAuth2 Discord

### Fluxo de Autenticação

O dashboard usa **Authorization Code Grant** (mais seguro que Implicit Grant):

```
1. Usuário clica "Login com Discord"
2. Redireciona para Discord com state (anti-CSRF)
3. Usuário autoriza a aplicação
4. Discord redireciona com code
5. Backend troca code por access_token
6. Backend busca dados do usuário
7. Sessão criada com access_token armazenado no servidor
```

### Endpoints Disponíveis

#### GET /auth/discord
Inicia o fluxo OAuth2

```javascript
// Redireciona para Discord
```

#### GET /auth/discord/callback
Callback após autorização

```javascript
// Processa code, obtém token e dados do usuário
// Cria sessão
// Redireciona para /dashboard
```

#### GET /auth/logout
Faz logout e revoga token

```javascript
// Revoga token no Discord
// Destrói sessão
// Redireciona para /
```

### Renovação Automática de Token

Tokens OAuth2 expiram em 7 dias. O middleware `verificarAuth` renova automaticamente:

```typescript
// Verifica se token expira em menos de 5 minutos
// Se sim, renova usando refresh_token
// Atualiza sessão com novo token
```

---

## Widget de Membros

### O que é?

Widget mostra membros online do servidor em tempo real.

### Ativar no Discord

1. Vá para "Configurações do Servidor" → "Widget"
2. Ative "Enable Server Widget"
3. Escolha o canal de convite padrão

### Endpoint da API

**GET /api/trpc/widget.get**

```json
{
  "input": {
    "serverId": "seu_server_id"
  }
}
```

**Resposta:**

```json
{
  "nome": "Nome do Servidor",
  "online": 42,
  "convite": "https://discord.gg/...",
  "membros": [
    {
      "nome": "username",
      "avatar": "https://cdn.discordapp.com/...",
      "status": "online"
    }
  ],
  "canais": [
    {
      "id": "123456",
      "nome": "geral",
      "posicao": 0
    }
  ]
}
```

### Cache

O widget é cacheado por **60 segundos** para evitar rate limits.

```typescript
// Primeira chamada: busca da API
// Próximas 60s: retorna do cache
// Após 60s: busca novamente
```

### Frontend

Atualizar widget a cada 60 segundos:

```javascript
async function atualizarWidget() {
  const dados = await fetch('/api/trpc/widget.get', {
    method: 'POST',
    body: JSON.stringify({
      input: { serverId: 'seu_server_id' }
    })
  }).then(r => r.json());

  // Atualizar DOM com dados
}

atualizarWidget();
setInterval(atualizarWidget, 60_000);
```

---

## Webhooks

### O que é?

Webhooks permitem enviar mensagens para Discord sem bot conectado.

### Tipos de Notificações

#### 1. Formulário de Contato

```typescript
await trpc.webhook.enviarContato.mutate({
  nome: "João",
  email: "joao@example.com",
  mensagem: "Olá, tenho uma dúvida...",
  pagina: "https://seu-site.com/contato"
});
```

Resultado no Discord:

```
📬 Nova Mensagem de Contato

Olá, tenho uma dúvida...

Nome: João
Email: joao@example.com
Página de Origem: https://seu-site.com/contato
```

#### 2. Novo Usuário

```typescript
await trpc.webhook.notificarNovoUsuario.mutate({
  id: "123456",
  username: "joao",
  global_name: "João Silva",
  email: "joao@example.com"
});
```

#### 3. Erro

```typescript
await trpc.webhook.notificarErro.mutate({
  titulo: "Erro de Autenticação",
  mensagem: "Token inválido",
  contexto: { userId: "123" }
});
```

### Cores Disponíveis

```typescript
CORES_DISCORD.BLURPLE      // Azul oficial Discord
CORES_DISCORD.GREYPLE      // Cinza
CORES_DISCORD.VERDE        // Verde
CORES_DISCORD.AMARELO      // Amarelo
CORES_DISCORD.LARANJA      // Laranja
CORES_DISCORD.VERMELHO     // Vermelho
```

---

## Rate Limiting

### Limites da API

- **Global**: 50 requests/segundo por bot
- **Por bucket**: Varia conforme o endpoint
- **Resposta 429**: Aguardar `retry_after` segundos

### Implementação

O utilitário `chamarDiscord()` trata automaticamente:

```typescript
// 1. Verifica headers de rate limit
// 2. Se 429 recebido, aguarda retry_after
// 3. Tenta novamente automaticamente
// 4. Loga aviso se < 5 requests restantes
```

### Monitoramento

Verificar status do cache:

```
GET /api/trpc/widget.cacheInfo
```

Resposta:

```json
{
  "123456": {
    "idade": "30s",
    "expirado": false,
    "membrosOnline": 42
  }
}
```

---

## API Reference

### Módulo: discordApi.ts

#### chamarDiscord(endpoint, opcoes)

Chamada genérica com rate limiting automático.

```typescript
const dados = await chamarDiscord('/users/@me', {
  token: accessToken,
  isBot: false
});
```

#### obterUsuarioAtual(accessToken)

```typescript
const usuario = await obterUsuarioAtual(accessToken);
// { id, username, avatar, email, ... }
```

#### obterServidoresUsuario(accessToken)

```typescript
const servidores = await obterServidoresUsuario(accessToken);
// [ { id, name, icon, ... }, ... ]
```

#### obterWidgetServidor(serverId)

```typescript
const widget = await obterWidgetServidor(serverId);
// { name, presence_count, members, channels, ... }
```

#### enviarWebhook(webhookUrl, payload)

```typescript
await enviarWebhook(process.env.DISCORD_WEBHOOK_URL, {
  username: 'Bot',
  embeds: [{ title: 'Teste', color: 0x5865F2 }]
});
```

### Módulo: webhooks.ts

#### enviarMensagemSimples(webhookUrl, mensagem, nomeBot)

```typescript
await enviarMensagemSimples(
  webhookUrl,
  'Olá, mundo!',
  'Meu Bot'
);
```

#### enviarEmbed(webhookUrl, embed, nomeBot, avatarUrl)

```typescript
await enviarEmbed(webhookUrl, {
  title: 'Título',
  description: 'Descrição',
  color: CORES_DISCORD.BLURPLE,
  fields: [
    { name: 'Campo', value: 'Valor', inline: true }
  ]
});
```

#### notificarFormularioContato(webhookUrl, dados)

```typescript
await notificarFormularioContato(webhookUrl, {
  nome: 'João',
  email: 'joao@example.com',
  mensagem: 'Mensagem',
  pagina: 'https://...'
});
```

### Routers tRPC

#### widget.get

```typescript
const widget = await trpc.widget.get.query({
  serverId: 'seu_server_id'
});
```

#### widget.cacheInfo

```typescript
const info = await trpc.widget.cacheInfo.query();
```

#### webhook.enviarContato

```typescript
await trpc.webhook.enviarContato.mutate({
  nome: 'João',
  email: 'joao@example.com',
  mensagem: 'Mensagem',
  pagina: 'https://...'
});
```

#### webhook.notificarNovoUsuario

```typescript
await trpc.webhook.notificarNovoUsuario.mutate({
  id: '123',
  username: 'joao',
  global_name: 'João',
  email: 'joao@example.com'
});
```

#### webhook.notificarErro

```typescript
await trpc.webhook.notificarErro.mutate({
  titulo: 'Erro',
  mensagem: 'Descrição do erro',
  contexto: { ... }
});
```

---

## Tratamento de Erros

### Códigos HTTP Comuns

| Código | Significado | Ação |
|--------|-------------|------|
| 200 | Sucesso | Processar resposta |
| 204 | Sucesso sem body | OK |
| 400 | Dados inválidos | Validar entrada |
| 401 | Token inválido | Fazer login novamente |
| 403 | Sem permissão | Verificar permissões |
| 404 | Não encontrado | Verificar ID |
| 429 | Rate limit | Aguardar e tentar novamente |
| 500 | Erro Discord | Tentar novamente depois |

### Exemplo de Tratamento

```typescript
try {
  const dados = await chamarDiscord('/users/@me', { token });
} catch (erro) {
  if (erro.message.includes('401')) {
    // Token expirado
    renovarToken();
  } else if (erro.message.includes('429')) {
    // Rate limit (já tratado automaticamente)
  } else {
    // Outro erro
    console.error(erro);
  }
}
```

---

## Segurança

### Checklist

- ✅ Tokens armazenados APENAS no servidor (sessão)
- ✅ HTTPS obrigatório em produção
- ✅ State gerado por sessão (anti-CSRF)
- ✅ Renovação automática de token
- ✅ Revogação no logout
- ✅ User-Agent em todas as requisições
- ✅ IDs como string (nunca Number)
- ✅ Validação de entrada em formulários
- ✅ Logs nunca contêm tokens

---

## Troubleshooting

### Erro: "Token inválido"

**Causa**: Token expirou ou foi revogado

**Solução**: Fazer login novamente

### Erro: "Rate limit atingido"

**Causa**: Muitas requisições em pouco tempo

**Solução**: Aguardar (automático) ou usar cache

### Erro: "Widget desativado"

**Causa**: Widget não ativado no Discord

**Solução**: Ativar em "Configurações do Servidor → Widget"

### Erro: "Webhook falhou"

**Causa**: URL inválida ou webhook deletado

**Solução**: Criar novo webhook e atualizar .env

---

## Referências

- [Discord Developer Documentation](https://docs.discord.com/developers)
- [OAuth2 Reference](https://docs.discord.com/developers/topics/oauth2)
- [Rate Limits](https://docs.discord.com/developers/topics/rate-limits)
- [Webhooks](https://docs.discord.com/developers/platform/webhooks)
- [Gateway](https://docs.discord.com/developers/events/gateway)

---

**Última atualização:** 25 de Abril de 2026
