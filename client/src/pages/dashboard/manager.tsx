import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { StatsGrid } from "@/components/stats-grid";
import { ProjectProgress } from "@/components/project-progress";
import { DelayAlerts } from "@/components/delay-alerts";
import { DelayHeatmap } from "@/components/delay-heatmap";
import { TeamLeaderboard } from "@/components/team-leaderboard";
import { AIInsights } from "@/components/ai-insights";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ManagerDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== "manager") {
    setLocation(`/dashboard/${user.role}`);
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
              <p className="text-muted-foreground">Welcome back! Here's what's happening with your projects.</p>
            </div>
            
            {/* Notification Bell */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  toast({
                    title: "Notifications",
                    description: "3 new delay alerts and project updates",
                  });
                }}
              >
                <i className="fas fa-bell text-muted-foreground"></i>
                <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                  3
                </Badge>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  toast({
                    title: "Search",
                    description: "Global search functionality coming soon",
                  });
                }}
              >
                <i className="fas fa-search text-muted-foreground"></i>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Stats Grid */}
          <StatsGrid />

          {/* Projects and Alerts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <ProjectProgress />
            <DelayAlerts />
          </div>

          {/* Heatmap and Leaderboard Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DelayHeatmap />
            <TeamLeaderboard />
          </div>

          {/* AI Insights */}
          <AIInsights />
        </main>
      </div>
    </div>
  );
}
