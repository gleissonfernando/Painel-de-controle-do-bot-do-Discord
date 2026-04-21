import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Shield, Save, AlertTriangle, Ban, MessageSquare, Type, X, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AutoModerationPageProps {
  guildId: string;
}

const PUNISHMENT_OPTIONS = [
  { value: "warn", label: "Warn", color: "text-yellow-400" },
  { value: "mute", label: "Mute", color: "text-orange-400" },
  { value: "kick", label: "Kick", color: "text-red-400" },
  { value: "ban", label: "Ban", color: "text-red-600" },
];

export default function AutoModerationPage({ guildId }: AutoModerationPageProps) {
  const { data: settings, isLoading } = trpc.autoMod.get.useQuery({ guildId });
  const { data: channels } = trpc.guilds.channels.useQuery({ guildId });
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    antiSpamEnabled: false,
    antiSpamThreshold: 5,
    antiSpamInterval: 5,
    antiLinkEnabled: false,
    antiLinkWhitelist: [] as string[],
    wordFilterEnabled: false,
    wordFilterList: [] as string[],
    antiCapsEnabled: false,
    antiCapsThreshold: 70,
    punishmentType: "warn" as "warn" | "mute" | "kick" | "ban",
    punishmentDuration: 10,
    logChannelId: "",
  });

  const [newWord, setNewWord] = useState("");
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    if (settings) {
      setForm({
        antiSpamEnabled: settings.antiSpamEnabled ?? false,
        antiSpamThreshold: settings.antiSpamThreshold ?? 5,
        antiSpamInterval: settings.antiSpamInterval ?? 5,
        antiLinkEnabled: settings.antiLinkEnabled ?? false,
        antiLinkWhitelist: (settings.antiLinkWhitelist as string[]) ?? [],
        wordFilterEnabled: settings.wordFilterEnabled ?? false,
        wordFilterList: (settings.wordFilterList as string[]) ?? [],
        antiCapsEnabled: settings.antiCapsEnabled ?? false,
        antiCapsThreshold: settings.antiCapsThreshold ?? 70,
        punishmentType: (settings.punishmentType as "warn" | "mute" | "kick" | "ban") ?? "warn",
        punishmentDuration: settings.punishmentDuration ?? 10,
        logChannelId: settings.logChannelId ?? "",
      });
    }
  }, [settings]);

  const updateMutation = trpc.autoMod.update.useMutation({
    onSuccess: () => {
      toast.success("Auto Moderation settings saved!");
      utils.autoMod.get.invalidate({ guildId });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const handleSave = () => {
    updateMutation.mutate({
      guildId,
      ...form,
      logChannelId: form.logChannelId || null,
    });
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );

  const RuleCard = ({ title, desc, icon, enabled, onToggle, children }: {
    title: string; desc: string; icon: React.ReactNode;
    enabled: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode;
  }) => (
    <div className={`bg-card border rounded-xl p-5 transition-all ${enabled ? "border-primary/30" : "border-border"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${enabled ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"}`}>
            <span className={enabled ? "text-primary" : "text-muted-foreground"}>{icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <Toggle value={enabled} onChange={onToggle} />
      </div>
      {enabled && children && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
            <div className="h-5 bg-muted rounded w-1/3 mb-3" />
            <div className="h-3 bg-muted rounded w-1/2" />
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
            <Shield size={22} className="text-primary" />
            Auto Moderation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure automatic moderation rules for this server</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Save size={14} />
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Anti-Spam */}
      <RuleCard
        title="Anti-Spam"
        desc="Detect and punish users sending too many messages quickly"
        icon={<MessageSquare size={16} />}
        enabled={form.antiSpamEnabled}
        onToggle={(v) => setForm({ ...form, antiSpamEnabled: v })}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Max Messages</label>
            <input
              type="number"
              value={form.antiSpamThreshold}
              onChange={(e) => setForm({ ...form, antiSpamThreshold: Number(e.target.value) })}
              min={2} max={20}
              className="w-full px-3 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Interval (seconds)</label>
            <input
              type="number"
              value={form.antiSpamInterval}
              onChange={(e) => setForm({ ...form, antiSpamInterval: Number(e.target.value) })}
              min={1} max={60}
              className="w-full px-3 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </RuleCard>

      {/* Anti-Link */}
      <RuleCard
        title="Anti-Link"
        desc="Block users from posting unauthorized links"
        icon={<Ban size={16} />}
        enabled={form.antiLinkEnabled}
        onToggle={(v) => setForm({ ...form, antiLinkEnabled: v })}
      >
        <div>
          <label className="block text-xs font-medium text-foreground mb-2">Whitelisted Domains</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.antiLinkWhitelist.map((link) => (
              <span key={link} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
                {link}
                <button onClick={() => setForm({ ...form, antiLinkWhitelist: form.antiLinkWhitelist.filter((l) => l !== link) })}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. discord.com"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLink.trim()) {
                  setForm({ ...form, antiLinkWhitelist: [...form.antiLinkWhitelist, newLink.trim()] });
                  setNewLink("");
                }
              }}
              className="flex-1 px-3 py-1.5 bg-input border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => {
                if (newLink.trim()) {
                  setForm({ ...form, antiLinkWhitelist: [...form.antiLinkWhitelist, newLink.trim()] });
                  setNewLink("");
                }
              }}
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs hover:bg-primary/20 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </RuleCard>

      {/* Word Filter */}
      <RuleCard
        title="Word Filter"
        desc="Automatically delete messages containing banned words"
        icon={<AlertTriangle size={16} />}
        enabled={form.wordFilterEnabled}
        onToggle={(v) => setForm({ ...form, wordFilterEnabled: v })}
      >
        <div>
          <label className="block text-xs font-medium text-foreground mb-2">Banned Words</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.wordFilterList.map((word) => (
              <span key={word} className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">
                {word}
                <button onClick={() => setForm({ ...form, wordFilterList: form.wordFilterList.filter((w) => w !== word) })}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a word..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newWord.trim()) {
                  setForm({ ...form, wordFilterList: [...form.wordFilterList, newWord.trim()] });
                  setNewWord("");
                }
              }}
              className="flex-1 px-3 py-1.5 bg-input border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => {
                if (newWord.trim()) {
                  setForm({ ...form, wordFilterList: [...form.wordFilterList, newWord.trim()] });
                  setNewWord("");
                }
              }}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs hover:bg-red-500/20 transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </RuleCard>

      {/* Anti-Caps */}
      <RuleCard
        title="Anti-Caps"
        desc="Prevent excessive use of capital letters"
        icon={<Type size={16} />}
        enabled={form.antiCapsEnabled}
        onToggle={(v) => setForm({ ...form, antiCapsEnabled: v })}
      >
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Caps Threshold: <span className="text-primary">{form.antiCapsThreshold}%</span>
          </label>
          <input
            type="range"
            min={30} max={100}
            value={form.antiCapsThreshold}
            onChange={(e) => setForm({ ...form, antiCapsThreshold: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>30%</span><span>100%</span>
          </div>
        </div>
      </RuleCard>

      {/* Punishment Settings */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          Punishment Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Punishment Type</label>
            <div className="grid grid-cols-2 gap-2">
              {PUNISHMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, punishmentType: opt.value as "warn" | "mute" | "kick" | "ban" })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    form.punishmentType === opt.value
                      ? `bg-primary/10 border-primary/30 text-primary`
                      : "bg-input border-border text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Duration (minutes)</label>
            <input
              type="number"
              value={form.punishmentDuration}
              onChange={(e) => setForm({ ...form, punishmentDuration: Number(e.target.value) })}
              min={1}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Log Channel</label>
            <select
              value={form.logChannelId}
              onChange={(e) => setForm({ ...form, logChannelId: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">None</option>
              {(channels ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
