import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

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

  // Allow all authenticated users to view progress

  const myTasks = Array.isArray(tasks) ? tasks : [];
  const myAchievements = Array.isArray(achievements) ? achievements : [];
  const completedTasks = myTasks.filter(task => task.status === "completed");
  const inProgressTasks = myTasks.filter(task => task.status === "in_progress");
  const totalPoints = myAchievements.reduce((sum, achievement) => sum + achievement.points, 0);

  const getTaskCompletionRate = () => {
    if (myTasks.length === 0) return 0;
    return Math.round((completedTasks.length / myTasks.length) * 100);
  };

  const getWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyCompletedTasks = completedTasks.filter(task => 
      task.completedAt && new Date(task.completedAt) >= oneWeekAgo
    );
    
    const weeklyAchievements = myAchievements.filter(achievement =>
      achievement.unlockedAt && new Date(achievement.unlockedAt) >= oneWeekAgo
    );

    return {
      tasksCompleted: weeklyCompletedTasks.length,
      achievementsUnlocked: weeklyAchievements.length,
      pointsEarned: weeklyAchievements.reduce((sum, a) => sum + a.points, 0)
    };
  };

  const getMonthlyStats = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const monthlyCompletedTasks = completedTasks.filter(task => 
      task.completedAt && new Date(task.completedAt) >= oneMonthAgo
    );
    
    const monthlyAchievements = myAchievements.filter(achievement =>
      achievement.unlockedAt && new Date(achievement.unlockedAt) >= oneMonthAgo
    );

    return {
      tasksCompleted: monthlyCompletedTasks.length,
      achievementsUnlocked: monthlyAchievements.length,
      pointsEarned: monthlyAchievements.reduce((sum, a) => sum + a.points, 0)
    };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "review":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200";
      case "delayed":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Progress Tracking</h1>
              <p className="text-muted-foreground">Monitor your performance and growth over time.</p>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Points Earned</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Overall Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Task Completion Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Overall Completion Rate</span>
                    <span className="text-2xl font-bold text-primary">{getTaskCompletionRate()}%</span>
                  </div>
                  <Progress value={getTaskCompletionRate()} className="h-4" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-500">{completedTasks.length}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-500">{inProgressTasks.length}</p>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-500">{myTasks.length}</p>
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievement Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{myAchievements.length}</p>
                    <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to Next Level</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div>
                      <p className="font-bold text-yellow-500">{weeklyStats.achievementsUnlocked}</p>
                      <p className="text-muted-foreground">This Week</p>
                    </div>
                    <div>
                      <p className="font-bold text-orange-500">{monthlyStats.achievementsUnlocked}</p>
                      <p className="text-muted-foreground">This Month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <i className="fas fa-tasks text-white"></i>
                      </div>
                      <div>
                        <p className="font-medium">Tasks Completed</p>
                        <p className="text-sm text-muted-foreground">Last 7 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{weeklyStats.tasksCompleted}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <i className="fas fa-medal text-white"></i>
                      </div>
                      <div>
                        <p className="font-medium">Achievements Unlocked</p>
                        <p className="text-sm text-muted-foreground">Last 7 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{weeklyStats.achievementsUnlocked}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <i className="fas fa-star text-white"></i>
                      </div>
                      <div>
                        <p className="font-medium">Points Earned</p>
                        <p className="text-sm text-muted-foreground">Last 7 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{weeklyStats.pointsEarned}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <i className="fas fa-tasks text-white"></i>
                      </div>
                      <div>
                        <p className="font-medium">Tasks Completed</p>
                        <p className="text-sm text-muted-foreground">Last 30 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{monthlyStats.tasksCompleted}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <i className="fas fa-medal text-white"></i>
                      </div>
                      <div>
                        <p className="font-medium">Achievements Unlocked</p>
                        <p className="text-sm text-muted-foreground">Last 30 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{monthlyStats.achievementsUnlocked}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                        <i className="fas fa-star text-white"></i>
                      </div>
                      <div>
                        <p className="font-medium">Points Earned</p>
                        <p className="text-sm text-muted-foreground">Last 30 days</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{monthlyStats.pointsEarned}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading || achievementsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recent Completed Tasks */}
                  {completedTasks.slice(0, 5).map((task: any) => (
                    <div key={task.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <i className="fas fa-check text-green-600 dark:text-green-400"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Completed {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        Completed
                      </Badge>
                    </div>
                  ))}
                  
                  {/* Recent Achievements */}
                  {myAchievements.slice(0, 3).map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                        <i className="fas fa-medal text-yellow-600 dark:text-yellow-400"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{achievement.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Earned {achievement.points} points • {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                        +{achievement.points} pts
                      </Badge>
                    </div>
                  ))}

                  {completedTasks.length === 0 && myAchievements.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <i className="fas fa-chart-line text-4xl mb-4"></i>
                      <p>No recent activity. Complete some tasks to see your progress!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}