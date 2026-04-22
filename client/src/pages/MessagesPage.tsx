import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { MessageSquare, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MessagesPageProps {
  guildId: string;
}

export default function MessagesPage({ guildId }: MessagesPageProps) {
  const { data: msgs, isLoading } = trpc.messages.get.useQuery({ guildId });
  const { data: channels } = trpc.guilds.channels.useQuery({ guildId });
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    welcomeEnabled: false,
    welcomeChannelId: "",
    welcomeMessage: "Welcome to the server, {user}! 🎉",
    goodbyeEnabled: false,
    goodbyeChannelId: "",
    goodbyeMessage: "{user} has left the server.",
    dmWelcome: false,
    dmMessage: "Welcome to {server}! Please read the rules.",
  });

  useEffect(() => {
    if (msgs) {
      setForm({
        welcomeEnabled: msgs.welcomeEnabled ?? false,
        welcomeChannelId: msgs.welcomeChannelId ?? "",
        welcomeMessage:
          msgs.welcomeMessage ?? "Welcome to the server, {user}! 🎉",
        goodbyeEnabled: msgs.goodbyeEnabled ?? false,
        goodbyeChannelId: msgs.goodbyeChannelId ?? "",
        goodbyeMessage: msgs.goodbyeMessage ?? "{user} has left the server.",
        dmWelcome: msgs.dmWelcome ?? false,
        dmMessage:
          msgs.dmMessage ?? "Welcome to {server}! Please read the rules.",
      });
    }
  }, [msgs]);

  const updateMutation = trpc.messages.update.useMutation({
    onSuccess: () => {
      toast.success("Messages saved!");
      utils.messages.get.invalidate({ guildId });
    },
    onError: err => toast.error(`Failed: ${err.message}`),
  });

  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );

  const VARIABLES = ["{user}", "{server}", "{memberCount}", "{channel}"];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-6 animate-pulse"
          >
            <div className="h-5 bg-muted rounded w-1/4 mb-4" />
            <div className="h-24 bg-muted rounded" />
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
            <MessageSquare size={22} className="text-primary" />
            Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure welcome and goodbye messages
          </p>
        </div>
        <Button
          onClick={() =>
            updateMutation.mutate({
              guildId,
              ...form,
              welcomeChannelId: form.welcomeChannelId || null,
              goodbyeChannelId: form.goodbyeChannelId || null,
            })
          }
          disabled={updateMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Save size={14} />
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Variables reference */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-primary mb-2">
          Available Variables
        </p>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map(v => (
            <code
              key={v}
              className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono"
            >
              {v}
            </code>
          ))}
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-foreground">Welcome Message</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sent when a new member joins the server
            </p>
          </div>
          <Toggle
            value={form.welcomeEnabled}
            onChange={v => setForm({ ...form, welcomeEnabled: v })}
          />
        </div>
        <div
          className={`space-y-4 transition-opacity ${form.welcomeEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Channel
            </label>
            <select
              value={form.welcomeChannelId}
              onChange={e =>
                setForm({ ...form, welcomeChannelId: e.target.value })
              }
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">Select a channel...</option>
              {(channels ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Message
            </label>
            <textarea
              value={form.welcomeMessage}
              onChange={e =>
                setForm({ ...form, welcomeMessage: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Goodbye Message */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-foreground">Goodbye Message</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sent when a member leaves the server
            </p>
          </div>
          <Toggle
            value={form.goodbyeEnabled}
            onChange={v => setForm({ ...form, goodbyeEnabled: v })}
          />
        </div>
        <div
          className={`space-y-4 transition-opacity ${form.goodbyeEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Channel
            </label>
            <select
              value={form.goodbyeChannelId}
              onChange={e =>
                setForm({ ...form, goodbyeChannelId: e.target.value })
              }
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">Select a channel...</option>
              {(channels ?? []).map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Message
            </label>
            <textarea
              value={form.goodbyeMessage}
              onChange={e =>
                setForm({ ...form, goodbyeMessage: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* DM Welcome */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-foreground">DM Welcome</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send a private message to new members
            </p>
          </div>
          <Toggle
            value={form.dmWelcome}
            onChange={v => setForm({ ...form, dmWelcome: v })}
          />
        </div>
        <div
          className={`transition-opacity ${form.dmWelcome ? "opacity-100" : "opacity-40 pointer-events-none"}`}
        >
          <label className="block text-sm font-medium text-foreground mb-1.5">
            DM Message
          </label>
          <textarea
            value={form.dmMessage}
            onChange={e => setForm({ ...form, dmMessage: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}
