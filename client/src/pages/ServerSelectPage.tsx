import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const getBotInviteUrl = () => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || "YOUR_BOT_CLIENT_ID";
  const redirectUri = encodeURIComponent(`${window.location.origin}/api/discord/callback`);
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&response_type=code&redirect_uri=${redirectUri}&scope=bot%20applications.commands`;
};

const BOT_INVITE_URL = getBotInviteUrl();

export default function ServerSelectPage() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const { data: guilds, isLoading: guildsLoading } = trpc.guilds.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name || "User"} />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {getInitials(user?.name || "User")}
              </AvatarFallback>
            </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{t("servers.loggedInAs")}</p>
            <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
          </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>

        {/* Servers List */}
        <div className="flex-1 overflow-y-auto">
          {guildsLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (guilds ?? []).length > 0 ? (
            <div className="p-2 space-y-1">
              {(guilds ?? []).map((guild: { id: string; name: string; icon: string | null }) => (
                <button
                  key={guild.id}
                  onClick={() => navigate(`/dashboard/${guild.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                >
                  <Avatar className="w-10 h-10 rounded-lg flex-shrink-0">
                    {guild.icon && (
                      <AvatarImage
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                        alt={guild.name}
                      />
                    )}
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {getInitials(guild.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {guild.name}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-3">{t("servers.noServers")}</p>
              <a href={BOT_INVITE_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="w-full gap-2">
                  <Plus size={14} />
                  {t("servers.addServer")}
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Add Server Button */}
        <div className="p-2 border-t border-border">
          <a href={BOT_INVITE_URL} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center gap-2 text-primary hover:bg-primary/10"
            >
              <Plus size={16} />
              {t("servers.addAServer")}
            </Button>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {(guilds ?? []).length > 0 ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("servers.selectServer")}</h1>
            <p className="text-muted-foreground text-sm mb-8">
              {t("servers.selectServerDesc")}
            </p>
              <div className="p-6 rounded-lg bg-card border border-border">
                <p className="text-muted-foreground text-sm">👈 Click on a server to get started</p>
              </div>
            </div>
          ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("servers.noServersYet")}</h1>
            <p className="text-muted-foreground text-sm mb-6">
              {t("servers.noServersDesc")}
            </p>
            <a href={BOT_INVITE_URL} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2">
                <Plus size={16} />
                {t("servers.addBotToServer")}
              </Button>
            </a>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
