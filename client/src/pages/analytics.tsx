import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function Analytics() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
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

  // Generate analytics data
  const projectStatusData = projects ? [
    { name: 'In Progress', value: projects.filter((p: any) => p.status === 'in_progress').length, color: '#22c55e' },
    { name: 'Delayed', value: projects.filter((p: any) => p.status === 'delayed').length, color: '#ef4444' },
    { name: 'Completed', value: projects.filter((p: any) => p.status === 'completed').length, color: '#3b82f6' },
    { name: 'Planning', value: projects.filter((p: any) => p.status === 'planning').length, color: '#8b5cf6' },
  ] : [];

  const taskPriorityData = tasks ? [
    { name: 'Critical', value: tasks.filter((t: any) => t.priority === 'critical').length },
    { name: 'High', value: tasks.filter((t: any) => t.priority === 'high').length },
    { name: 'Medium', value: tasks.filter((t: any) => t.priority === 'medium').length },
    { name: 'Low', value: tasks.filter((t: any) => t.priority === 'low').length },
  ] : [];

  const monthlyProgressData = [
    { month: 'Jan', completed: 12, started: 8 },
    { month: 'Feb', completed: 19, started: 15 },
    { month: 'Mar', completed: 7, started: 12 },
    { month: 'Apr', completed: 15, started: 9 },
    { month: 'May', completed: 22, started: 18 },
    { month: 'Jun', completed: 18, started: 14 },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground">Project performance and insights.</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <i className="fas fa-project-diagram text-muted-foreground"></i>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projects?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Active projects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <i className="fas fa-chart-line text-muted-foreground"></i>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.onTimeCompletion || 0}%</div>
                    <p className="text-xs text-muted-foreground">On-time completion</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                    <i className="fas fa-exclamation-triangle text-muted-foreground"></i>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats?.criticalIssues || 0}</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <i className="fas fa-users text-muted-foreground"></i>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.teamMembers || 0}</div>
                    <p className="text-xs text-muted-foreground">Active members</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Task Priority Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={taskPriorityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects?.map((project: any) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <Badge variant={project.status === 'delayed' ? 'destructive' : 'default'}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Due: {new Date(project.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
                      <Line type="monotone" dataKey="started" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Delay Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Frontend Development</span>
                        <Badge variant="destructive">3 delays</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Backend Integration</span>
                        <Badge variant="secondary">1 delay</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Testing & QA</span>
                        <Badge variant="secondary">2 delays</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Productivity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tasks Completed This Week</span>
                        <span className="font-bold">24</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Task Duration</span>
                        <span className="font-bold">2.3 days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Quality Score</span>
                        <span className="font-bold">96%</span>
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