import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MyTasks() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => 
      apiRequest(`/api/tasks/${taskId}/status`, {
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

  const getProgressPercentage = () => {
    if (myTasks.length === 0) return 0;
    return Math.round((completedTasks.length / myTasks.length) * 100);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
              <p className="text-muted-foreground">View and manage all your assigned tasks and responsibilities.</p>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{getProgressPercentage()}%</p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{myTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-tasks text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{inProgressTasks.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clock text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{completedTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{reviewTasks.length}</p>
                    <p className="text-sm text-muted-foreground">In Review</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-eye text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Task Completion</span>
                  <span>{completedTasks.length} of {myTasks.length} tasks</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-500">{pendingTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-500">{inProgressTasks.length}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-500">{reviewTasks.length}</p>
                    <p className="text-xs text-muted-foreground">In Review</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-500">{completedTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks by Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-clock text-orange-500"></i>
                  <span>Active Tasks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : [...inProgressTasks, ...pendingTasks].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-tasks text-4xl mb-4"></i>
                    <p>No active tasks. Great job!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...inProgressTasks, ...pendingTasks].map((task: any) => (
                      <div key={task.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{task.title}</h4>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <i className={`fas fa-circle ${getPriorityColor(task.priority)} mr-1`}></i>
                              {task.priority} priority
                            </span>
                            {task.dueDate && (
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            )}
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-check-circle text-green-500"></i>
                  <span>Completed Tasks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : [...completedTasks, ...reviewTasks].length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-check-circle text-4xl mb-4"></i>
                    <p>No completed tasks yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...reviewTasks, ...completedTasks].slice(0, 10).map((task: any) => (
                      <div key={task.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{task.title}</h4>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <i className={`fas fa-circle ${getPriorityColor(task.priority)} mr-1`}></i>
                              {task.priority} priority
                            </span>
                            {task.completedAt && (
                              <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}