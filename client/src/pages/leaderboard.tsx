import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Leaderboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full text-white font-bold text-lg animate-bounce-gentle">
            <i className="fas fa-crown"></i>
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full text-white font-bold text-lg">
            <i className="fas fa-medal"></i>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full text-white font-bold text-lg">
            <i className="fas fa-award"></i>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full text-muted-foreground font-bold">
            {index + 1}
          </div>
        );
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "on_time_hero":
        return { icon: "fas fa-clock", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" };
      case "rescue_squad":
        return { icon: "fas fa-life-ring", color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" };
      case "dependency_saver":
        return { icon: "fas fa-link", color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200" };
      case "team_player":
        return { icon: "fas fa-users", color: "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200" };
      case "milestone_master":
        return { icon: "fas fa-flag-checkered", color: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200" };
      default:
        return { icon: "fas fa-medal", color: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200" };
    }
  };

  const achievementTypes = [
    { type: "on_time_hero", title: "On-time Hero", description: "Complete tasks on schedule" },
    { type: "rescue_squad", title: "Rescue Squad", description: "Help teammates with delayed tasks" },
    { type: "dependency_saver", title: "Dependency Saver", description: "Prevent project blockers" },
    { type: "team_player", title: "Team Player", description: "Excellent collaboration" },
    { type: "milestone_master", title: "Milestone Master", description: "Complete major milestones" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Team Leaderboard</h1>
              <p className="text-muted-foreground">Track team performance and achievements.</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-trophy text-amber-500"></i>
                <span className="text-sm text-muted-foreground">
                  Updated {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="all-time">All Time</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPeriod} className="space-y-6">
              {/* Top 3 Podium */}
              {leaderboardLoading ? (
                <Card className="animate-pulse">
                  <CardContent className="p-8">
                    <div className="flex items-end justify-center space-x-8">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="text-center">
                          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                          <Skeleton className="h-4 w-20 mb-2 mx-auto" />
                          <Skeleton className="h-6 w-12 mx-auto" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : Array.isArray(leaderboard) && leaderboard.length >= 3 ? (
                <Card className="gradient-bg text-white shadow-2xl">
                  <CardContent className="p-8">
                    <div className="flex items-end justify-center space-x-8">
                      {/* Second Place */}
                      <div className="text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
                        <div className="relative">
                          <Avatar className="w-16 h-16 mx-auto mb-4 border-4 border-white/20">
                            <AvatarImage src={leaderboard[1]?.user?.avatar} alt={leaderboard[1]?.user?.name} />
                            <AvatarFallback>
                              {leaderboard[1]?.user?.name ? leaderboard[1].user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">2</span>
                          </div>
                        </div>
                        <p className="font-semibold mb-1">{leaderboard[1]?.user?.name || 'User'}</p>
                        <p className="text-2xl font-bold">{leaderboard[1]?.points?.toLocaleString() || '0'}</p>
                        <p className="text-sm opacity-80">points</p>
                      </div>

                      {/* First Place */}
                      <div className="text-center animate-slide-up">
                        <div className="relative">
                          <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-yellow-300">
                            <AvatarImage src={leaderboard[0]?.user?.avatar} alt={leaderboard[0]?.user?.name} />
                            <AvatarFallback>
                              {leaderboard[0]?.user?.name ? leaderboard[0].user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center animate-bounce-gentle">
                            <i className="fas fa-crown text-sm"></i>
                          </div>
                        </div>
                        <p className="font-semibold mb-1 text-lg">{leaderboard[0]?.user?.name || 'User'}</p>
                        <p className="text-3xl font-bold">{leaderboard[0]?.points?.toLocaleString() || '0'}</p>
                        <p className="text-sm opacity-80">points</p>
                      </div>

                      {/* Third Place */}
                      <div className="text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
                        <div className="relative">
                          <Avatar className="w-16 h-16 mx-auto mb-4 border-4 border-white/20">
                            <AvatarImage src={leaderboard[2]?.user?.avatar} alt={leaderboard[2]?.user?.name} />
                            <AvatarFallback>
                              {leaderboard[2]?.user?.name ? leaderboard[2].user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">3</span>
                          </div>
                        </div>
                        <p className="font-semibold mb-1">{leaderboard[2]?.user?.name || 'User'}</p>
                        <p className="text-2xl font-bold">{leaderboard[2]?.points?.toLocaleString() || '0'}</p>
                        <p className="text-sm opacity-80">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Full Leaderboard */}
                <Card className="lg:col-span-2 card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Full Rankings</span>
                      <Badge className="bg-primary/10 text-primary">
                        {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leaderboardLoading ? (
                      <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-4 p-4 rounded-xl animate-pulse">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="text-right">
                              <Skeleton className="h-4 w-16 mb-1" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                      <div className="space-y-2">
                        {leaderboard.map((entry: any, index: number) => (
                          <div 
                            key={entry.user.id}
                            className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 animate-fade-in ${
                              entry.user.id === user?.id 
                                ? "bg-primary/10 border border-primary/20" 
                                : "hover:bg-accent/50"
                            }`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            {getRankIcon(index)}
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                              <AvatarFallback>
                                {entry.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-foreground">{entry.user.name}</p>
                                {entry.user.id === user?.id && (
                                  <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground capitalize">
                                {entry.user.role}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-foreground">
                                {entry.points.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.achievements.length} achievements
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <i className="fas fa-trophy text-muted-foreground text-4xl mb-4"></i>
                        <p className="text-muted-foreground">No leaderboard data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Achievement Guide */}
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle>Achievement Guide</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Earn points and climb the leaderboard by unlocking achievements:
                    </p>
                    <div className="space-y-3">
                      {achievementTypes.map((achievement, index) => {
                        const { icon, color } = getAchievementIcon(achievement.type);
                        return (
                          <div 
                            key={achievement.type}
                            className="flex items-start space-x-3 p-3 rounded-lg bg-accent/30 animate-fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                              <i className={`${icon} text-sm`}></i>
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {achievement.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-purple/10 rounded-lg">
                      <div className="text-center">
                        <i className="fas fa-lightbulb text-primary text-2xl mb-2"></i>
                        <p className="text-sm font-medium text-foreground mb-1">Pro Tip</p>
                        <p className="text-xs text-muted-foreground">
                          Complete tasks on time and help teammates to maximize your points!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
