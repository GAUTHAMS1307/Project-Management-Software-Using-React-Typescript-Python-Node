import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ExtensionRequestManagement } from "@/components/extension-request-management";
import { ProjectDeadlineReschedule } from "@/components/project-deadline-reschedule";
import { WeeklyReports } from "@/components/weekly-reports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schemas
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignee: z.string().min(1, "Assignee is required"),
  deadline: z.string().min(1, "Deadline is required"),
});

const invitationFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function LeaderDashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
    enabled: !!user,
  });

  // Form hooks
  const taskForm = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium" as const,
      assignee: "",
      deadline: "",
    },
  });

  const invitationForm = useForm({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: "",
    },
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: z.infer<typeof taskFormSchema>) => 
      apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created successfully!" });
      setAddTaskOpen(false);
      taskForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (data: { email: string; teamId: string }) => 
      apiRequest(`/api/teams/${data.teamId}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: data.email }),
      }),
    onSuccess: (response: any) => {
      toast({ 
        title: "Invitation Sent!", 
        description: `Demo invitation sent to ${response.invitedEmail}. In a real application, this would send an actual email with registration link.` 
      });
      setInviteMemberOpen(false);
      invitationForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to send invitation", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && user.role !== "leader") {
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

  if (!user || user.role !== "leader") {
    return null;
  }

  const teamTasks = tasks || [];
  const teamProjects = projects || [];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Team Leader Dashboard</h1>
              <p className="text-muted-foreground">Manage your team's progress and assignments.</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-plus mr-2"></i>
                    Assign Task
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-user-plus mr-2"></i>
                    Invite Member
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setChatOpen(true)}
              >
                <i className="fas fa-comments mr-2"></i>
                Team Chat
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => {
                  toast({
                    title: "Notifications",
                    description: "2 task updates and team notifications",
                  });
                }}
              >
                <i className="fas fa-bell text-muted-foreground"></i>
                <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                  2
                </Badge>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-tasks text-white text-xl"></i>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{Array.isArray(teamTasks) ? teamTasks.length : 0}</p>
                    <p className="text-sm text-muted-foreground">Active Tasks</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                  <span className="text-green-500 font-medium">+5%</span>
                  <span className="text-muted-foreground ml-1">this week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-users text-white text-xl"></i>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-check-circle text-green-500 mr-1"></i>
                  <span className="text-green-500 font-medium">All Active</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-chart-line text-white text-xl"></i>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">87%</p>
                    <p className="text-sm text-muted-foreground">Team Efficiency</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                  <span className="text-green-500 font-medium">+3%</span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="extensions" data-testid="tab-extensions">Extensions</TabsTrigger>
              <TabsTrigger value="deadlines" data-testid="tab-deadlines">Deadlines</TabsTrigger>
              <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
              <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle>Team Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.isArray(teamProjects) ? teamProjects.slice(0, 3).map((project: any) => (
                        <div key={project.id} className="p-4 border border-border rounded-xl hover:bg-accent/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground">{project.name}</h3>
                            <Badge variant={project.status === "in_progress" ? "default" : "secondary"}>
                              {project.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="mb-2 flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-foreground">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      )) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No projects available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle>Task Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">In Progress</span>
                        </div>
                        <span className="text-sm font-bold">{Array.isArray(teamTasks) ? teamTasks.filter(t => t.status === "in_progress").length : 0}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                        <span className="text-sm font-bold">{Array.isArray(teamTasks) ? teamTasks.filter(t => t.status === "completed").length : 0}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                        <span className="text-sm font-bold">{Array.isArray(teamTasks) ? teamTasks.filter(t => t.status === "todo").length : 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Extension Requests Tab */}
            <TabsContent value="extensions">
              <ExtensionRequestManagement />
            </TabsContent>

            {/* Deadline Reschedule Tab */}
            <TabsContent value="deadlines">
              <ProjectDeadlineReschedule />
            </TabsContent>

            {/* Weekly Reports Tab */}
            <TabsContent value="reports">
              <WeeklyReports />
            </TabsContent>

            {/* Tasks Management Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <Card className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Task Management</CardTitle>
                    <Button onClick={() => setAddTaskOpen(true)} data-testid="button-add-task">
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(teamTasks) ? teamTasks.slice(0, 5).map((task: any) => (
                      <div key={task.id} className="p-4 border border-border rounded-xl hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{task.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant={task.priority === "critical" ? "destructive" : "outline"}>
                              {task.priority}
                            </Badge>
                            <Badge variant={task.status === "completed" ? "secondary" : "default"}>
                              {task.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Assigned to: {task.assignee || "Unassigned"}</span>
                          <span className="text-muted-foreground">Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No tasks available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Recent Team Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 border border-border rounded-xl">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-check text-white text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Task completed by Mike Chen</p>
                        <p className="text-sm text-muted-foreground">UI Component Library - 2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 border border-border rounded-xl">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-play text-white text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">New task started by Emma Davis</p>
                        <p className="text-sm text-muted-foreground">Quality Assurance Testing - 4 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 border border-border rounded-xl">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-clock text-white text-sm"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Task deadline approaching</p>
                        <p className="text-sm text-muted-foreground">Database Schema Review - Due tomorrow</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Task Assignment Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign New Task</DialogTitle>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit((data) => createTaskMutation.mutate(data))} className="space-y-4">
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter task description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="assignee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <FormControl>
                      <Input placeholder="Team member email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setAddTaskOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Team Invitation Dialog */}
      <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <Form {...invitationForm}>
            <form onSubmit={invitationForm.handleSubmit((data) => {
              const selectedTeam = Array.isArray(teams) ? teams[0] : null; // Use first team for demo
              if (selectedTeam) {
                inviteMemberMutation.mutate({ email: data.email, teamId: selectedTeam.id });
              } else {
                toast({ title: "No team available", variant: "destructive" });
              }
            })} className="space-y-4">
              <FormField
                control={invitationForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="member@company.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setInviteMemberOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMemberMutation.isPending}>
                  {inviteMemberMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Team Chat</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-96">
            <div className="flex-1 p-4 overflow-y-auto border border-border rounded-lg mb-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">M</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">Hey team! Great progress on the UI components today.</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Mike Chen • 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">E</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">Thanks! Ready to start QA testing phase next.</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Emma Davis • 1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Input placeholder="Type your message..." className="flex-1" />
              <Button>
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
