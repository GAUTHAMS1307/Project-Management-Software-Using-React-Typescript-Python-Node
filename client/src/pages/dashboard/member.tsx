import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ExtensionRequestForm } from "@/components/extension-request-form";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function MemberDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [extensionRequestOpen, setExtensionRequestOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/achievements", user?.id],
    enabled: !!user,
  });

  // Fetch user's extension requests
  const { data: extensionRequests } = useQuery({
    queryKey: ["/api/extension-requests/my-requests"],
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

  if (user.role !== "member") {
    setLocation(`/dashboard/${user.role}`);
    return null;
  }

  const myTasks = Array.isArray(tasks) ? tasks : [];
  const myAchievements = Array.isArray(achievements) ? achievements : [];
  const completedTasks = myTasks.filter(task => task.status === "completed");
  const inProgressTasks = myTasks.filter(task => task.status === "in_progress");
  const totalPoints = myAchievements.reduce((sum, achievement) => sum + achievement.points, 0);

  const getTaskStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

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
      default:
        return "fas fa-medal";
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
              <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
              <p className="text-muted-foreground">Track your tasks, progress, and achievements.</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/my-tasks">
                <Button variant="outline" size="sm">
                  <i className="fas fa-tasks mr-2"></i>
                  View All Tasks
                </Button>
              </Link>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{totalPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="card-hover animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-tasks text-white text-xl"></i>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{myTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check-circle text-white text-xl"></i>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{completedTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-play text-white text-xl"></i>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{inProgressTasks.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-medal text-white text-xl"></i>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{myAchievements.length}</p>
                    <p className="text-sm text-muted-foreground">Achievements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Extension Requests Section */}
          <div className="mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Request Extensions</span>
                  </CardTitle>
                  <Button
                    onClick={() => setExtensionRequestOpen(true)}
                    size="sm"
                    data-testid="button-request-extension"
                  >
                    Request Extension
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {Array.isArray(extensionRequests) && extensionRequests.length > 0 ? (
                  <div className="space-y-3">
                    {extensionRequests.slice(0, 3).map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{request.additionalDays} days requested</p>
                          <p className="text-xs text-muted-foreground truncate">{request.reason}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {request.status === "pending" && (
                            <Badge variant="default" className="flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>Pending</span>
                            </Badge>
                          )}
                          {request.status === "approved" && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Approved</span>
                            </Badge>
                          )}
                          {request.status === "rejected" && (
                            <Badge variant="destructive" className="flex items-center space-x-1">
                              <XCircle className="h-3 w-3" />
                              <span>Rejected</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {extensionRequests.length > 3 && (
                      <p className="text-center text-sm text-muted-foreground">
                        and {extensionRequests.length - 3} more...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No extension requests yet</p>
                    <p className="text-sm text-muted-foreground">Request an extension when you need more time</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* My Tasks */}
            <Card className="lg:col-span-2 card-hover animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Tasks</span>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-filter mr-2"></i>
                    Filter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-xl animate-pulse">
                        <div className="flex items-center justify-between mb-3">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-full mb-2" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : myTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-tasks text-muted-foreground text-4xl mb-4"></i>
                    <p className="text-muted-foreground">No tasks assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTasks.slice(0, 5).map((task: any) => (
                      <div key={task.id} className="p-4 border border-border rounded-xl hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <i className={`fas fa-circle text-xs ${getPriorityColor(task.priority)}`}></i>
                            <h3 className="font-semibold text-foreground">{task.title}</h3>
                          </div>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span className="text-muted-foreground capitalize">{task.domain}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="card-hover animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle>My Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                {achievementsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-xl animate-pulse">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-8" />
                      </div>
                    ))}
                  </div>
                ) : myAchievements.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-medal text-muted-foreground text-4xl mb-4"></i>
                    <p className="text-muted-foreground">No achievements yet</p>
                    <p className="text-xs text-muted-foreground mt-2">Complete tasks to earn achievements!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myAchievements.map((achievement: any) => (
                      <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-primary/10 to-purple/10 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center">
                          <i className={`${getAchievementIcon(achievement.type)} text-white`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{achievement.title}</p>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                        <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          +{achievement.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Chart */}
          <Card className="card-hover animate-slide-up">
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                  const completed = Math.floor(Math.random() * 5);
                  const total = Math.floor(Math.random() * 3) + completed;
                  const percentage = total > 0 ? (completed / total) * 100 : 0;
                  
                  return (
                    <div key={day} className="text-center">
                      <div className="text-xs text-muted-foreground mb-2">{day}</div>
                      <div className="h-24 bg-muted rounded-lg flex flex-col justify-end p-2">
                        <div 
                          className="bg-gradient-to-t from-primary to-primary/70 rounded transition-all duration-500"
                          style={{ height: `${percentage}%`, minHeight: percentage > 0 ? "8px" : "0" }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {completed}/{total}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Extension Request Form Dialog */}
      <ExtensionRequestForm
        open={extensionRequestOpen}
        onOpenChange={setExtensionRequestOpen}
        preSelectedTaskId={selectedTaskId}
      />
    </div>
  );
}
