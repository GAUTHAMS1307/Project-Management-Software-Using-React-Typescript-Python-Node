import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";

// Pages
import Login from "@/pages/login";
import AdministratorDashboard from "@/pages/dashboard/administrator";
import ManagerDashboard from "@/pages/dashboard/manager";
import LeaderDashboard from "@/pages/dashboard/leader";
import MemberDashboard from "@/pages/dashboard/member";
import Projects from "@/pages/projects";
import Leaderboard from "@/pages/leaderboard";
import Analytics from "@/pages/analytics";
import Teams from "@/pages/teams";
import Dependencies from "@/pages/dependencies";
import Settings from "@/pages/settings";
import Tasks from "@/pages/tasks";
import MyTasks from "@/pages/my-tasks";
import Progress from "@/pages/progress";
import Achievements from "@/pages/achievements";
import Team from "@/pages/team";
import Predictions from "@/pages/predictions";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard/administrator" component={AdministratorDashboard} />
      <Route path="/dashboard/manager" component={ManagerDashboard} />
      <Route path="/dashboard/leader" component={LeaderDashboard} />
      <Route path="/dashboard/member" component={MemberDashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={Projects} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/teams" component={Teams} />
      <Route path="/dependencies" component={Dependencies} />
      <Route path="/settings" component={Settings} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/my-tasks" component={MyTasks} />
      <Route path="/progress" component={Progress} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/team" component={Team} />
      <Route path="/predictions" component={Predictions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
