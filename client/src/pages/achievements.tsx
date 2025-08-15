import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Achievements() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/achievements", user?.id],
    enabled: !!user,
  });

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

  // Allow all authenticated users to view achievements

  const myAchievements = Array.isArray(achievements) ? achievements : [];
  const totalPoints = myAchievements.reduce((sum, achievement) => sum + achievement.points, 0);
  
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "on_time_hero":
        return "fas fa-clock";
      case "rescue_squad":
        return "fas fa-life-ring";
      case "dependency_saver":
        return "fas fa-link";
      case "team_player":
        return "fas fa-users";
      case "milestone_master":
        return "fas fa-flag-checkered";
      case "speed_demon":
        return "fas fa-rocket";
      case "perfectionist":
        return "fas fa-star";
      case "mentor":
        return "fas fa-graduation-cap";
      default:
        return "fas fa-medal";
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case "on_time_hero":
        return "from-blue-500 to-blue-600";
      case "rescue_squad":
        return "from-red-500 to-red-600";
      case "dependency_saver":
        return "from-purple-500 to-purple-600";
      case "team_player":
        return "from-green-500 to-green-600";
      case "milestone_master":
        return "from-yellow-500 to-yellow-600";
      case "speed_demon":
        return "from-orange-500 to-orange-600";
      case "perfectionist":
        return "from-pink-500 to-pink-600";
      case "mentor":
        return "from-indigo-500 to-indigo-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "epic":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200";
      case "rare":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      default:
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
    }
  };

  // Mock available achievements for demonstration
  const allAchievements = [
    {
      id: "on_time_hero",
      title: "On-Time Hero",
      description: "Complete 10 tasks before their due date",
      type: "on_time_hero",
      points: 100,
      rarity: "common",
      progress: 7,
      maxProgress: 10,
      unlocked: false
    },
    {
      id: "speed_demon",
      title: "Speed Demon",
      description: "Complete 5 tasks in a single day",
      type: "speed_demon",
      points: 150,
      rarity: "rare",
      progress: 3,
      maxProgress: 5,
      unlocked: false
    },
    {
      id: "perfectionist",
      title: "Perfectionist",
      description: "Complete 20 tasks without any revisions",
      type: "perfectionist",
      points: 200,
      rarity: "epic",
      progress: 12,
      maxProgress: 20,
      unlocked: false
    },
    {
      id: "mentor",
      title: "Mentor",
      description: "Help 5 team members complete their tasks",
      type: "mentor",
      points: 300,
      rarity: "legendary",
      progress: 2,
      maxProgress: 5,
      unlocked: false
    },
    ...myAchievements.map(a => ({ ...a, unlocked: true, progress: a.maxProgress || 1, maxProgress: a.maxProgress || 1 }))
  ];

  const unlockedAchievements = allAchievements.filter(a => a.unlocked);
  const lockedAchievements = allAchievements.filter(a => !a.unlocked);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
              <p className="text-muted-foreground">Track your accomplishments and unlock rewards.</p>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Achievement Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{unlockedAchievements.length}</p>
                    <p className="text-sm text-muted-foreground">Unlocked</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-trophy text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{lockedAchievements.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clock text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{Math.round((unlockedAchievements.length / allAchievements.length) * 100)}%</p>
                    <p className="text-sm text-muted-foreground">Completion</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-chart-pie text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">5</p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-calendar-week text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Achievement Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Completion</span>
                  <span>{unlockedAchievements.length} of {allAchievements.length} achievements</span>
                </div>
                <Progress value={(unlockedAchievements.length / allAchievements.length) * 100} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-trophy text-yellow-500"></i>
                  <span>Unlocked Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievementsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unlockedAchievements.map((achievement) => (
                      <div key={achievement.id} className="relative border rounded-lg p-6 hover:bg-accent transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getAchievementColor(achievement.type)} rounded-xl flex items-center justify-center`}>
                            <i className={`${getAchievementIcon(achievement.type)} text-white text-xl`}></i>
                          </div>
                          <Badge className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-foreground mb-2">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">+{achievement.points} pts</span>
                          {achievement.unlockedAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          <i className="fas fa-check-circle text-green-500"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Locked Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-lock text-gray-500"></i>
                <span>Available Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lockedAchievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-trophy text-4xl mb-4"></i>
                  <p>Congratulations! You've unlocked all available achievements!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lockedAchievements.map((achievement) => (
                    <div key={achievement.id} className="relative border rounded-lg p-6 hover:bg-accent transition-colors opacity-75">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                          <i className={`${getAchievementIcon(achievement.type)} text-white text-xl opacity-50`}></i>
                        </div>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-foreground mb-2">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-muted-foreground">+{achievement.points} pts</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(((achievement.maxProgress - achievement.progress) / achievement.maxProgress) * 100)}% remaining
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <i className="fas fa-lock text-gray-500"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}