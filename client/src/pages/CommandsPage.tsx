import { trpc } from "@/lib/trpc";
import { Terminal, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CommandsPageProps {
  guildId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Moderation: "bg-red-500/10 text-red-400 border-red-500/20",
  Music: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Fun: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function CommandsPage({ guildId }: CommandsPageProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: commands, isLoading } = trpc.commands.list.useQuery({
    guildId,
  });
  const utils = trpc.useUtils();

  const toggleMutation = trpc.commands.toggle.useMutation({
    onMutate: async ({ commandName, enabled }) => {
      await utils.commands.list.cancel({ guildId });
      const prev = utils.commands.list.getData({ guildId });
      utils.commands.list.setData({ guildId }, old =>
        old?.map(c => (c.commandName === commandName ? { ...c, enabled } : c))
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) utils.commands.list.setData({ guildId }, ctx.prev);
      toast.error(`Failed to toggle command: ${err.message}`);
    },
    onSuccess: () => {
      toast.success("Command updated!");
    },
  });

  const categories = [
    "All",
    ...Array.from(new Set((commands ?? []).map(c => c.category))),
  ];

  const filtered = (commands ?? []).filter(c => {
    const matchSearch =
      c.commandName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "All" || c.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const enabledCount = (commands ?? []).filter(c => c.enabled).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Terminal size={22} className="text-primary" />
          Commands
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enable or disable bot commands for this server
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {commands?.length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Total Commands</p>
        </div>
        <div className="bg-card border border-green-500/20 rounded-xl p-4 text-center bg-green-500/5">
          <p className="text-2xl font-bold text-green-400">{enabledCount}</p>
          <p className="text-xs text-muted-foreground">Enabled</p>
        </div>
        <div className="bg-card border border-red-500/20 rounded-xl p-4 text-center bg-red-500/5">
          <p className="text-2xl font-bold text-red-400">
            {(commands?.length ?? 0) - enabledCount}
          </p>
          <p className="text-xs text-muted-foreground">Disabled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selectedCategory === cat
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Commands List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 bg-muted rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-6 w-12 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Terminal
              size={32}
              className="text-muted-foreground mx-auto mb-2"
            />
            <p className="text-muted-foreground text-sm">No commands found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(cmd => (
              <div
                key={cmd.commandName}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Terminal size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <code className="text-sm font-mono font-semibold text-foreground">
                      !{cmd.commandName}
                    </code>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[cmd.category] ?? "bg-muted text-muted-foreground border-border"}`}
                    >
                      {cmd.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {cmd.description}
                  </p>
                </div>
                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      guildId,
                      commandName: cmd.commandName,
                      enabled: !cmd.enabled,
                    })
                  }
                  disabled={toggleMutation.isPending}
                  className="flex-shrink-0 transition-opacity hover:opacity-80"
                  title={cmd.enabled ? "Disable command" : "Enable command"}
                >
                  {cmd.enabled ? (
                    <ToggleRight size={28} className="text-primary" />
                  ) : (
                    <ToggleLeft size={28} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
