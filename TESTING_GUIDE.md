# Discord Bot Dashboard - Testing Guide

## Overview

Este painel permite gerenciar configurações do seu bot Discord por servidor. Cada servidor tem suas próprias configurações salvas no banco de dados.

## Fluxo de Teste Completo

### 1. Adicionar o Bot a um Servidor

1. Acesse o painel: `https://seu-painel.manus.space/servers`
2. Clique no botão **"Add to a new server"** (ou em qualquer servidor que não tenha o bot)
3. Você será redirecionado para Discord OAuth
4. Selecione o servidor onde deseja adicionar o bot
5. Clique em "Autorizar"
6. Você será redirecionado de volta ao painel

### 2. Verificar se o Bot Aparece na Lista

Após adicionar o bot:

- Volte para a página `/servers`
- O servidor deve aparecer na lista "Your Servers"
- Clique em **"Manage"** para acessar o dashboard

### 3. Acessar o Dashboard do Servidor

Na página do dashboard, você verá:

- **Dashboard**: Estatísticas do servidor (membros, canais, cargos, etc.)
- **General Settings**: Configurações básicas (prefixo, idioma, timezone, canais e cargos)
- **Commands**: Gerenciar comandos do bot
- **Messages**: Configurar mensagens de boas-vindas e despedida
- **Auto Moderation**: Configurar regras de moderação automática
- **Social Notifications**: Configurar notificações de YouTube, Twitch, TikTok
- **Logs**: Visualizar logs de eventos do servidor

### 4. Configurar General Settings

Na página "General Settings":

1. **Command Prefix**: Define o prefixo dos comandos (ex: `!`, `/`, etc.)
2. **Bot Status**: Ativa ou desativa o bot no servidor
3. **Language**: Seleciona o idioma (English, Portuguese, Spanish, French, German, Japanese)
4. **Timezone**: Define o timezone do servidor
5. **Admin Role**: Seleciona qual cargo pode gerenciar o bot
6. **Welcome Channel**: Canal onde mensagens de boas-vindas serão enviadas
7. **Logs Channel**: Canal onde os logs de eventos serão registrados

> **Importante**: Os canais e cargos são buscados em tempo real da Discord API. Se não aparecerem, verifique se o bot tem permissões no servidor.

### 5. Dados Reais do Discord

O painel busca dados reais do Discord:

- **Canais**: Lista todos os canais de texto do servidor
- **Cargos**: Lista todos os cargos do servidor
- **Membros**: Exibe o número de membros
- **Eventos**: Mostra eventos recentes (entradas, saídas, banimentos, etc.)

## Troubleshooting

### Problema: "Missing Access" ao buscar canais/cargos

**Causa**: O bot não tem permissões no servidor ou não está adicionado.

**Solução**:

1. Verifique se o bot está no servidor (em Membros)
2. Verifique as permissões do bot (deve ter permissão de "Ver Canais" e "Gerenciar Cargos")
3. Tente adicionar o bot novamente

### Problema: Canais/Cargos não aparecem na lista

**Causa**: O bot não tem permissão para listar canais ou cargos.

**Solução**:

1. Vá para Configurações do Servidor → Funções
2. Selecione o cargo do bot
3. Ative as permissões:
   - ✅ Ver Canais
   - ✅ Gerenciar Cargos (se necessário)
   - ✅ Ler Histórico de Mensagens

### Problema: Configurações não são salvas

**Causa**: Erro ao salvar no banco de dados.

**Solução**:

1. Verifique a conexão com o banco de dados
2. Tente salvar novamente
3. Verifique os logs do servidor para mais detalhes

## Recursos Principais

### 1. Configurações por Servidor

- Cada servidor tem suas próprias configurações
- Configurações são salvas automaticamente quando você clica "Save Changes"
- Dados são armazenados no banco de dados MySQL/TiDB

### 2. Dados em Tempo Real

- Canais, cargos e membros são buscados da Discord API
- Dados são atualizados cada vez que você acessa a página
- Sem cache - sempre dados atualizados

### 3. Segurança

- Apenas usuários autenticados podem acessar o painel
- Apenas administradores do servidor podem gerenciar configurações
- Token do bot é armazenado com segurança no servidor

## Próximas Funcionalidades

- [ ] Integração com webhooks do Discord para eventos em tempo real
- [ ] Dashboard com gráficos de atividade
- [ ] Sistema de permissões por cargo
- [ ] Backup e restore de configurações
- [ ] Suporte a múltiplos idiomas na interface

## Suporte

Se encontrar problemas:

1. Verifique este guia
2. Verifique os logs do servidor
3. Verifique as permissões do bot no Discord
4. Tente fazer logout e login novamente
