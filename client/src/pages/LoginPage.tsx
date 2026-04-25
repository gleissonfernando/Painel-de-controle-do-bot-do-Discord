import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bot, Shield, Zap, Bell, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Se o usuário já estiver logado, manda direto para o novo dashboard unificado
    if (!loading && isAuthenticated) {
      navigate("/unified");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || isProcessing) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <Shield size={20} className="text-primary" />,
      title: t("login.features.autoMod"),
      desc: t("login.features.autoModDesc"),
    },
    {
      icon: <Bell size={20} className="text-primary" />,
      title: t("login.features.socialNotif"),
      desc: t("login.features.socialNotifDesc"),
    },
    {
      icon: <Zap size={20} className="text-primary" />,
      title: t("login.features.commands"),
      desc: t("login.features.commandsDesc"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
            <Bot size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
            Magnatas<span className="text-primary">GG</span>
          </h1>
          <p className="text-muted-foreground text-center max-w-sm text-sm leading-relaxed">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-xl p-8 shadow-2xl shadow-black/50">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {t("login.welcome")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("login.signIn")}
            </p>

            <a
              href={getLoginUrl()}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-[#5865F2]/20 hover:shadow-[#5865F2]/30 hover:-translate-y-0.5"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 71 55"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"
                  fill="white"
                />
              </svg>
              {t("login.loginButton")}
            </a>

            <p className="text-xs text-muted-foreground text-center mt-4">
              {t("common.selectServer")}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl">
          {features.map(f => (
            <div
              key={f.title}
              className="bg-card/50 border border-border rounded-lg p-4 text-center"
            >
              <div className="flex justify-center mb-2">{f.icon}</div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {f.title}
              </p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-muted-foreground relative z-10 flex items-center justify-center gap-4">
        <span>
          BotPanel &copy; {new Date().getFullYear()} — {t("login.footer")}
        </span>
        <div className="flex gap-2">
          <Button
            variant={language === "pt" ? "default" : "ghost"}
            size="sm"
            onClick={() => setLanguage("pt")}
            className="h-7 px-2 text-xs"
          >
            🇧🇷 PT
          </Button>
          <Button
            variant={language === "en" ? "default" : "ghost"}
            size="sm"
            onClick={() => setLanguage("en")}
            className="h-7 px-2 text-xs"
          >
            🇺🇸 EN
          </Button>
        </div>
      </footer>
    </div>
  );
}
