import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { StatsGrid } from "@/components/stats-grid";
import { DelayAlerts } from "@/components/delay-alerts";
import { TeamLeaderboard } from "@/components/team-leaderboard";
import { AIInsights } from "@/components/ai-insights";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Users, Shield, Settings, Database, ListTodo, Clock, CheckCircle, Eye } from "lucide-react";

export default function AdministratorDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => 
      apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && user.role !== "administrator") {
      setLocation(`/dashboard/${user.role}`);
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "administrator") {
    return null;
  }

  const myTasks = Array.isArray(tasks) ? tasks : [];
  const completedTasks = myTasks.filter(task => task.status === "completed");
  const inProgressTasks = myTasks.filter(task => task.status === "in_progress");
  const pendingTasks = myTasks.filter(task => task.status === "pending");
  const reviewTasks = myTasks.filter(task => task.status === "review");

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

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Administrator Dashboard</h1>
              <p className="text-muted-foreground">System administration and user management console.</p>
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
                    title: "System Notifications",
                    description: "2 security alerts and system updates",
                  });
                }}
              >
                <i className="fas fa-bell text-muted-foreground"></i>
                <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                  2
                </Badge>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  toast({
                    title: "System Status",
                    description: "All systems operational",
                    variant: "default",
                  });
                }}
              >
                <i className="fas fa-cog text-muted-foreground"></i>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">125</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">48</div>
                <p className="text-xs text-muted-foreground">Current active users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <p className="text-xs text-muted-foreground">Uptime this month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">2</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Administration Actions</CardTitle>
              <CardDescription>Common administrative tasks and system management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => toast({ title: "User Management", description: "Opening user management panel..." })}
                >
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => toast({ title: "System Settings", description: "Opening system configuration..." })}
                >
                  <Settings className="h-6 w-6" />
                  <span>System Config</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => toast({ title: "Security Center", description: "Opening security dashboard..." })}
                >
                  <Shield className="h-6 w-6" />
                  <span>Security Center</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => toast({ title: "Database Tools", description: "Opening database management..." })}
                >
                  <Database className="h-6 w-6" />
                  <span>Database Tools</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => toast({ title: "Backup Manager", description: "Opening backup configuration..." })}
                >
                  <i className="fas fa-download text-xl"></i>
                  <span>Backups</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => toast({ title: "Audit Logs", description: "Opening system audit logs..." })}
                >
                  <i className="fas fa-clipboard-list text-xl"></i>
                  <span>Audit Logs</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Tasks Section for Administrator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ListTodo className="h-5 w-5" />
                <span>My Tasks</span>
              </CardTitle>
              <CardDescription>Manage your assigned tasks and monitor progress</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Task Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <ListTodo className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">{myTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">{inProgressTasks.length}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{reviewTasks.length}</p>
                  <p className="text-sm text-muted-foreground">In Review</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>

              {/* Active Tasks */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Active Tasks</h4>
                {tasksLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : [...inProgressTasks, ...pendingTasks].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active tasks assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...inProgressTasks, ...pendingTasks].slice(0, 5).map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <h5 className="font-medium text-foreground truncate">{task.title}</h5>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="flex items-center text-xs text-muted-foreground">
                              <i className={`fas fa-circle ${getPriorityColor(task.priority)} mr-1`}></i>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: "in_progress" })}
                              disabled={updateTaskMutation.isPending}
                            >
                              Start
                            </Button>
                          )}
                          {task.status === "in_progress" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTaskMutation.mutate({ taskId: task.id, status: "review" })}
                              disabled={updateTaskMutation.isPending}
                            >
                              Submit for Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Regular dashboard components that are relevant for administrators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DelayAlerts />
            <AIInsights />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamLeaderboard />
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>Latest administrative actions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">User john.doe@company.com registered</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">System backup completed successfully</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Security scan detected 2 minor issues</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Database optimization completed</p>
                      <p className="text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}