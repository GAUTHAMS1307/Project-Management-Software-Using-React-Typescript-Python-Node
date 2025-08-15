import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dependencies() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
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

  // Generate dependency data
  const tasksWithDependencies = tasks?.filter((task: any) => 
    task.dependencies && task.dependencies.length > 0
  ) || [];

  const dependencyChains = tasksWithDependencies.map((task: any) => {
    const project = projects?.find((p: any) => p.id === task.projectId);
    const dependentTasks = task.dependencies.map((depId: string) => 
      tasks?.find((t: any) => t.id === depId)
    ).filter(Boolean);

    return {
      ...task,
      project,
      dependentTasks,
      isBlocked: dependentTasks.some((dep: any) => dep?.status !== 'completed'),
      criticalPath: dependentTasks.length > 2,
    };
  });

  const filteredDependencies = dependencyChains.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.project?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "blocked" && item.isBlocked) ||
                         (statusFilter === "critical" && item.criticalPath) ||
                         (statusFilter === "resolved" && !item.isBlocked);
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (task: any) => {
    if (task.isBlocked) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          <i className="fas fa-lock mr-1"></i>
          Blocked
        </Badge>
      );
    }
    
    switch (task.status) {
      case "completed":
        return (
          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <i className="fas fa-check mr-1"></i>
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            <i className="fas fa-play mr-1"></i>
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <i className="fas fa-clock mr-1"></i>
            Pending
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const blockedCount = dependencyChains.filter(d => d.isBlocked).length;
  const criticalCount = dependencyChains.filter(d => d.criticalPath).length;
  const resolvedCount = dependencyChains.filter(d => !d.isBlocked).length;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dependencies</h1>
              <p className="text-muted-foreground">Track task dependencies and critical paths.</p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="px-6 py-4 bg-card border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-lock text-red-600 dark:text-red-400"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{blockedCount}</div>
                  <div className="text-xs text-muted-foreground">Blocked Tasks</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-orange-600 dark:text-orange-400"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{criticalCount}</div>
                  <div className="text-xs text-muted-foreground">Critical Path</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-project-diagram text-blue-600 dark:text-blue-400"></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{dependencyChains.length}</div>
                  <div className="text-xs text-muted-foreground">Total Dependencies</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-card border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search tasks or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dependencies</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="critical">Critical Path</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">Dependency List</TabsTrigger>
              <TabsTrigger value="chains">Dependency Chains</TabsTrigger>
              <TabsTrigger value="matrix">Dependency Matrix</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              {tasksLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="w-48 h-6 bg-muted rounded"></div>
                            <div className="w-32 h-4 bg-muted rounded"></div>
                          </div>
                          <div className="w-20 h-6 bg-muted rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredDependencies.length === 0 ? (
                <div className="text-center py-16">
                  <i className="fas fa-project-diagram text-muted-foreground text-6xl mb-6"></i>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {searchTerm || statusFilter !== "all" ? "No dependencies found" : "No dependencies tracked"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria." 
                      : "Task dependencies will appear here when created."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDependencies.map((item: any, index: number) => (
                    <Card 
                      key={item.id} 
                      className={`card-hover animate-fade-in ${item.isBlocked ? 'border-red-200 dark:border-red-800' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                              {getStatusBadge(item)}
                              {getPriorityBadge(item.priority)}
                              {item.criticalPath && (
                                <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                  <i className="fas fa-route mr-1"></i>
                                  Critical Path
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm font-medium text-foreground">Project</p>
                                <p className="text-sm text-muted-foreground">{item.project?.name || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">Due Date</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(item.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">Dependencies</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.dependentTasks.length} task{item.dependentTasks.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dependent Tasks */}
                        {item.dependentTasks.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm font-medium text-foreground mb-2">Waiting for:</p>
                            <div className="space-y-2">
                              {item.dependentTasks.map((depTask: any) => (
                                <div key={depTask.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                  <span className="text-sm text-foreground">{depTask.title}</span>
                                  <Badge 
                                    variant={depTask.status === 'completed' ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {depTask.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-eye mr-2"></i>
                            View Details
                          </Button>
                          {(user.role === "manager" || user.role === "leader") && (
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <i className="fas fa-edit mr-2"></i>
                                Edit Dependencies
                              </Button>
                              {item.isBlocked && (
                                <Button variant="outline" size="sm" className="text-orange-600 border-orange-600 hover:bg-orange-50">
                                  <i className="fas fa-unlock mr-2"></i>
                                  Resolve Block
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chains" className="space-y-6">
              <div className="space-y-6">
                {projects?.map((project: any) => {
                  const projectDependencies = filteredDependencies.filter(d => d.project?.id === project.id);
                  if (projectDependencies.length === 0) return null;

                  return (
                    <Card key={project.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{project.name}</span>
                          <Badge variant="secondary">{projectDependencies.length} dependencies</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {projectDependencies.map((dep: any) => (
                            <div key={dep.id} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-foreground">{dep.title}</span>
                                  {dep.isBlocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Depends on: {dep.dependentTasks.map((t: any) => t.title).join(', ')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {dep.dependentTasks.filter((t: any) => t.status === 'completed').length} / {dep.dependentTasks.length}
                                </div>
                                <div className="text-xs text-muted-foreground">completed</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="matrix" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dependency Matrix</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visual representation of task dependencies across projects.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      <div className="grid grid-cols-12 gap-2 text-xs">
                        <div className="col-span-4 font-medium text-foreground">Task</div>
                        <div className="col-span-2 font-medium text-center text-foreground">Status</div>
                        <div className="col-span-2 font-medium text-center text-foreground">Dependencies</div>
                        <div className="col-span-2 font-medium text-center text-foreground">Blocked By</div>
                        <div className="col-span-2 font-medium text-center text-foreground">Risk Level</div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        {filteredDependencies.slice(0, 10).map((item: any) => (
                          <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/30 rounded text-xs">
                            <div className="col-span-4 text-foreground truncate">{item.title}</div>
                            <div className="col-span-2 text-center">
                              <Badge variant={item.isBlocked ? 'destructive' : 'secondary'} className="text-xs">
                                {item.isBlocked ? 'Blocked' : item.status}
                              </Badge>
                            </div>
                            <div className="col-span-2 text-center text-muted-foreground">
                              {item.dependentTasks.length}
                            </div>
                            <div className="col-span-2 text-center text-muted-foreground">
                              {item.dependentTasks.filter((t: any) => t.status !== 'completed').length}
                            </div>
                            <div className="col-span-2 text-center">
                              <Badge 
                                variant={item.criticalPath ? 'destructive' : item.isBlocked ? 'secondary' : 'default'}
                                className="text-xs"
                              >
                                {item.criticalPath ? 'High' : item.isBlocked ? 'Medium' : 'Low'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}