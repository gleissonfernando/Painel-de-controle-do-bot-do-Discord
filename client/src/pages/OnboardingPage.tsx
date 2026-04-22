import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Bot, ArrowRight, Check, Zap } from "lucide-react";

const getBotInviteUrl = () => {
  const clientId =
    import.meta.env.VITE_DISCORD_CLIENT_ID || "YOUR_BOT_CLIENT_ID";
  const redirectUri = encodeURIComponent(
    `${window.location.origin}/api/discord/callback`
  );
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=0&response_type=code&redirect_uri=${redirectUri}&scope=bot%20applications.commands`;
};

const BOT_INVITE_URL = getBotInviteUrl();

export default function OnboardingPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

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
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot size={20} className="text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground">BotPanel</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {t("servers.loggedInAs")}{" "}
            <span className="font-semibold text-foreground">
              {user?.name || "User"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Bot size={40} className="text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {t("onboarding.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              {t("onboarding.subtitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.subtitleDesc")}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-12">
            <div className="flex gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-primary font-semibold">1</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {t("onboarding.step1")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.step1Desc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-primary font-semibold">2</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {t("onboarding.step2")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.step2Desc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-primary font-semibold">3</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {t("onboarding.step3")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.step3Desc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 border border-primary/20">
                  <Check size={20} className="text-green-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {t("onboarding.step4")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.step4Desc")}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-base">
                <Bot size={20} />
                {t("onboarding.addBotButton")}
                <ArrowRight size={20} />
              </Button>
            </a>
            <Button
              variant="outline"
              className="flex-1 h-12 border-border hover:bg-card text-foreground font-semibold gap-2 text-base"
              onClick={() => navigate("/servers")}
            >
              <Zap size={20} />
              {t("onboarding.dashboardButton")}
            </Button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h4 className="font-semibold text-blue-400 mb-2">
              {t("onboarding.tip")}
            </h4>
            <p className="text-sm text-blue-300/90">
              {t("onboarding.tipDesc")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
