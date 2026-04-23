import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Settings, Save, Bot, Globe, Clock, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GeneralSettingsPageProps {
  guildId: string;
}

const LANGUAGES = [
  { value: "en", label: "Inglês" },
  { value: "pt", label: "Português" },
  { value: "es", label: "Espanhol" },
  { value: "fr", label: "Francês" },
  { value: "de", label: "Alemão" },
  { value: "ja", label: "Japonês" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function GeneralSettingsPage({
  guildId,
}: GeneralSettingsPageProps) {
  const { data: settings, isLoading } = trpc.settings.get.useQuery({ guildId });
  const { data: channels } = trpc.guilds.channels.useQuery({ guildId });
  const { data: roles } = trpc.guilds.roles.useQuery({ guildId });
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    prefix: "!",
    language: "en",
    timezone: "UTC",
    adminRoleId: "",
    welcomeChannelId: "",
    logsChannelId: "",
    botToken: "",
    botEnabled: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        prefix: settings.prefix ?? "!",
        language: settings.language ?? "en",
        timezone: settings.timezone ?? "UTC",
        adminRoleId: settings.adminRoleId ?? "",
        welcomeChannelId: settings.welcomeChannelId ?? "",
        logsChannelId: settings.logsChannelId ?? "",
        botToken: settings.botToken ?? "",
        botEnabled: settings.botEnabled ?? true,
      });
    }
  }, [settings]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      utils.settings.get.invalidate({ guildId });
    },
    onError: err => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const handleSave = () => {
    // Log de Auditoria no Frontend (Opcional, o backend já faz)
    console.log(`[Config] Salvando configurações para o servidor ${guildId}...`);
    
    updateMutation.mutate({
      guildId,
      prefix: form.prefix,
      language: form.language,
      timezone: form.timezone,
      adminRoleId: form.adminRoleId || null,
      welcomeChannelId: form.welcomeChannelId || null,
      logsChannelId: form.logsChannelId || null,
      botToken: form.botToken || null,
      botEnabled: form.botEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-6 animate-pulse"
          >
            <div className="h-5 bg-muted rounded w-1/4 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings size={22} className="text-primary" />
            Configurações Gerais
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure as definições básicas do seu bot para este servidor
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Save size={14} />
          {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Bot Configuration */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bot size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Configuração do Bot</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Prefix */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <Hash size={14} className="inline mr-1.5 text-muted-foreground" />
              Prefixo de Comando
            </label>
            <input
              type="text"
              value={form.prefix}
              onChange={e =>
                setForm({ ...form, prefix: e.target.value.slice(0, 16) })
              }
              maxLength={16}
              placeholder="!"
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O prefixo usado para acionar comandos do bot (ex: ! ou /)
            </p>
          </div>

          {/* Bot Token */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <Save size={14} className="inline mr-1.5 text-muted-foreground" />
              Token do Bot (Substitui Variável de Ambiente)
            </label>
            <input
              type="password"
              value={form.botToken}
              onChange={e => setForm({ ...form, botToken: e.target.value })}
              placeholder="MTAy..."
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se o seu bot não estiver conectando, cole o token do bot aqui. Isso será usado especificamente para este servidor.
            </p>
          </div>

          {/* Bot Enabled */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Status do Bot
            </label>
            <div className="flex items-center gap-3 p-3 bg-input border border-border rounded-lg">
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, botEnabled: !form.botEnabled })
                }
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  form.botEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    form.botEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${form.botEnabled ? "text-primary" : "text-muted-foreground"}`}
              >
                {form.botEnabled ? "Ativado" : "Desativado"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ative ou desative o bot neste servidor
            </p>
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Localização</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Idioma
            </label>
            <select
              value={form.language}
              onChange={e => setForm({ ...form, language: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <Clock
                size={14}
                className="inline mr-1.5 text-muted-foreground"
              />
              Fuso Horário
            </label>
            <select
              value={form.timezone}
              onChange={e => setForm({ ...form, timezone: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Channel & Role Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Hash size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Canais e Cargos</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Admin Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Cargo Admin
            </label>
            <select
              value={form.adminRoleId}
              onChange={e => setForm({ ...form, adminRoleId: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">None selected</option>
              {(roles ?? []).map((r: { id: string; name: string }) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Cargo que pode gerenciar o bot
            </p>
          </div>

          {/* Welcome Channel */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Canal de Boas-vindas
            </label>
            <select
              value={form.welcomeChannelId}
              onChange={e =>
                setForm({ ...form, welcomeChannelId: e.target.value })
              }
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">None selected</option>
              {(channels ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Logs Channel */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Canal de Logs
            </label>
            <select
              value={form.logsChannelId}
              onChange={e =>
                setForm({ ...form, logsChannelId: e.target.value })
              }
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">None selected</option>
              {(channels ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Save size={14} />
          {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
