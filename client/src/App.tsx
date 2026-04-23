import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import LoginPage from "./pages/LoginPage";
import ServerSelectPage from "./pages/ServerSelectPage";
import DashboardPage from "./pages/DashboardPage";
import GeneralSettingsPage from "./pages/GeneralSettingsPage";
import CommandsPage from "./pages/CommandsPage";
import MessagesPage from "./pages/MessagesPage";
import AutoModerationPage from "./pages/AutoModerationPage";
import SocialNotificationsPage from "./pages/SocialNotificationsPage";
import LogsPage from "./pages/LogsPage";
import OnboardingPage from "./pages/OnboardingPage";
import WelcomeGoodbyePage from "./pages/WelcomeGoodbyePage";
import BotControlPage from "./pages/BotControlPage";
import DevActivationPage from "./pages/DevActivationPage";
import DashboardLayout from "./components/DiscordDashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/servers" component={ServerSelectPage} />
      <Route path="/dashboard/:guildId">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <DashboardPage guildId={params.guildId} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/general">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <GeneralSettingsPage guildId={params.guildId} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/commands">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <CommandsPage guildId={params.guildId} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/messages">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <MessagesPage guildId={params.guildId} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/automod">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <AutoModerationPage guildId={params.guildId} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/notifications">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <SocialNotificationsPage guildId={params.guildId} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/logs">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <LogsPage guildId={params.guildId} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/welcome">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <WelcomeGoodbyePage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/control">
        {params => (
          <DashboardLayout guildId={params.guildId}>
            <BotControlPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/:guildId/dev-activation">
        {params => <DevActivationPage guildId={params.guildId} />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div translate="no">
      <ErrorBoundary>
        <LanguageProvider>
          <ThemeProvider defaultTheme="dark">
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
