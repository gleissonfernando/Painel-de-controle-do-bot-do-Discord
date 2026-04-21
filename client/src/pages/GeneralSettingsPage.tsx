import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Settings, Save, Bot, Globe, Clock, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GeneralSettingsPageProps {
  guildId: string;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "pt", label: "Portuguese" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Sao_Paulo", "Europe/London",
  "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
  "Australia/Sydney",
];

export default function GeneralSettingsPage({ guildId }: GeneralSettingsPageProps) {
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
        botEnabled: settings.botEnabled ?? true,
      });
    }
  }, [settings]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      utils.settings.get.invalidate({ guildId });
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      guildId,
      prefix: form.prefix,
      language: form.language,
      timezone: form.timezone,
      adminRoleId: form.adminRoleId || null,
      welcomeChannelId: form.welcomeChannelId || null,
      logsChannelId: form.logsChannelId || null,
      botEnabled: form.botEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
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
            General Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure your bot's basic settings for this server</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Save size={14} />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Bot Configuration */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bot size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Bot Configuration</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Prefix */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <Hash size={14} className="inline mr-1.5 text-muted-foreground" />
              Command Prefix
            </label>
            <input
              type="text"
              value={form.prefix}
              onChange={(e) => setForm({ ...form, prefix: e.target.value.slice(0, 16) })}
              maxLength={16}
              placeholder="!"
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">The prefix used to trigger bot commands (e.g., ! or /)</p>
          </div>

          {/* Bot Enabled */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Bot Status</label>
            <div className="flex items-center gap-3 p-3 bg-input border border-border rounded-lg">
              <button
                type="button"
                onClick={() => setForm({ ...form, botEnabled: !form.botEnabled })}
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
              <span className={`text-sm font-medium ${form.botEnabled ? "text-green-400" : "text-muted-foreground"}`}>
                {form.botEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Enable or disable the bot in this server</p>
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Localization</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Language</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <Clock size={14} className="inline mr-1.5 text-muted-foreground" />
              Timezone
            </label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Channel & Role Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Hash size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Channels & Roles</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Admin Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Admin Role</label>
            <select
              value={form.adminRoleId}
              onChange={(e) => setForm({ ...form, adminRoleId: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">None selected</option>
              {(roles ?? []).map((r: { id: string; name: string }) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Role that can manage the bot</p>
          </div>

          {/* Welcome Channel */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Welcome Channel</label>
            <select
              value={form.welcomeChannelId}
              onChange={(e) => setForm({ ...form, welcomeChannelId: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">None selected</option>
              {(channels ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>

          {/* Logs Channel */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Logs Channel</label>
            <select
              value={form.logsChannelId}
              onChange={(e) => setForm({ ...form, logsChannelId: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">None selected</option>
              {(channels ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
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
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
