import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Teams() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    leaderId: "",
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    enabled: !!user,
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
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

  const filteredTeams = (teams || []).filter((team: any) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTeamProjects = (teamId: string) => {
    return (projects || []).filter((project: any) => project.teamId === teamId);
  };

  const getTeamStats = (teamId: string) => {
    const teamProjects = getTeamProjects(teamId);
    const totalTasks = teamProjects.reduce((acc: number, project: any) => acc + (project.tasks?.length || 0), 0);
    const completedTasks = teamProjects.reduce((acc: number, project: any) => 
      acc + (project.tasks?.filter((task: any) => task.status === 'completed').length || 0), 0);
    
    return {
      projects: teamProjects.length,
      tasks: totalTasks,
      completion: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  };

  const getUserInfo = (userId: string) => {
    return (leaderboard || []).find((item: any) => item.user.id === userId)?.user;
  };

  const createTeamMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/teams", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team created successfully!" });
      setTeamModalOpen(false);
      setTeamForm({ name: "", description: "", leaderId: "" });
    },
    onError: () => {
      toast({ title: "Failed to create team", variant: "destructive" });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/teams/${editTeam.id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team updated successfully!" });
      setTeamModalOpen(false);
      setEditTeam(null);
      setTeamForm({ name: "", description: "", leaderId: "" });
    },
    onError: () => {
      toast({ title: "Failed to update team", variant: "destructive" });
    },
  });

  const handleCreateTeam = () => {
    setEditTeam(null);
    setTeamForm({ name: "", description: "", leaderId: "" });
    setTeamModalOpen(true);
  };

  const handleEditTeam = (team: any) => {
    setEditTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description,
      leaderId: team.leaderId || "",
    });
    setTeamModalOpen(true);
  };

  const handleSubmitTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTeam) {
      updateTeamMutation.mutate(teamForm);
    } else {
      createTeamMutation.mutate(teamForm);
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
              <h1 className="text-2xl font-bold text-foreground">Teams</h1>
              <p className="text-muted-foreground">Manage team members and collaboration.</p>
            </div>
            
            {user.role === "manager" && (
              <Button 
                className="gradient-primary text-white"
                onClick={handleCreateTeam}
              >
                <i className="fas fa-plus mr-2"></i>
                Create Team
              </Button>
            )}
          </div>
        </header>

        {/* Search and Filters */}
        <div className="px-6 py-4 bg-card border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Team Overview</TabsTrigger>
              <TabsTrigger value="members">All Members</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {teamsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="w-48 h-6 bg-muted rounded"></div>
                        <div className="w-32 h-4 bg-muted rounded"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="w-full h-4 bg-muted rounded"></div>
                          <div className="w-3/4 h-4 bg-muted rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center py-16">
                  <i className="fas fa-users text-muted-foreground text-6xl mb-6"></i>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {searchTerm ? "No teams found" : "No teams yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm 
                      ? "Try adjusting your search criteria." 
                      : "Create your first team to get started."}
                  </p>
                  {user.role === "manager" && !searchTerm && (
                    <Button className="gradient-primary text-white">
                      <i className="fas fa-plus mr-2"></i>
                      Create First Team
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeams.map((team: any, index: number) => {
                    const teamStats = getTeamStats(team.id);
                    const leader = getUserInfo(team.leaderId);
                    
                    return (
                      <Card 
                        key={team.id} 
                        className="card-hover animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                              <i className="fas fa-users text-white text-xl"></i>
                            </div>
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              {team.memberIds.length} members
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        </CardHeader>
                        <CardContent>
                          {/* Team Leader */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-foreground mb-2">Team Leader</p>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={leader?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {leader?.name?.charAt(0) || 'L'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">{leader?.name || 'Unknown'}</span>
                            </div>
                          </div>

                          {/* Skills */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-foreground mb-2">Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {team.skills?.map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              )) || (
                                <Badge variant="secondary" className="text-xs">
                                  General
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Team Stats */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Projects</span>
                              <span className="font-medium text-foreground">{teamStats.projects}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Completion Rate</span>
                              <span className="font-medium text-foreground">{teamStats.completion}%</span>
                            </div>
                            <Progress value={teamStats.completion} className="h-2" />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Team Details",
                                  description: `Viewing details for ${team.name}`,
                                });
                              }}
                            >
                              <i className="fas fa-eye mr-2"></i>
                              View Details
                            </Button>
                            {(user.role === "manager" || team.leaderId === user.id) && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditTeam(team)}
                              >
                                <i className="fas fa-edit mr-2"></i>
                                Edit
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(leaderboard || []).map((item: any) => (
                  <Card key={item.user.id} className="text-center">
                    <CardContent className="pt-6">
                      <Avatar className="w-16 h-16 mx-auto mb-4">
                        <AvatarImage src={item.user.avatar} />
                        <AvatarFallback className="text-lg">
                          {item.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-foreground">{item.user.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{item.user.email}</p>
                      <Badge className="mb-3">
                        {item.user.role}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <i className="fas fa-trophy text-yellow-500"></i>
                          <span>{item.points} points</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                          <i className="fas fa-medal text-purple-500"></i>
                          <span>{item.achievements.length} achievements</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team: any) => {
                  const teamStats = getTeamStats(team.id);
                  const teamProjects = getTeamProjects(team.id);
                  
                  return (
                    <Card key={team.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{teamStats.projects}</div>
                              <div className="text-xs text-muted-foreground">Projects</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{teamStats.completion}%</div>
                              <div className="text-xs text-muted-foreground">Complete</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Overall Progress</span>
                              <span>{teamStats.completion}%</span>
                            </div>
                            <Progress value={teamStats.completion} className="h-2" />
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Recent Projects</h4>
                            {teamProjects.slice(0, 3).map((project: any) => (
                              <div key={project.id} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{project.name}</span>
                                <Badge 
                                  variant={project.status === 'delayed' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {project.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Team Creation/Edit Modal */}
      <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTeam ? "Edit Team" : "Create New Team"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTeam} className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="Enter team name"
                required
              />
            </div>
            <div>
              <Label htmlFor="teamDescription">Description</Label>
              <Textarea
                id="teamDescription"
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                placeholder="Enter team description"
                required
              />
            </div>
            <div>
              <Label htmlFor="teamLeader">Team Leader</Label>
              <Select 
                value={teamForm.leaderId} 
                onValueChange={(value) => setTeamForm({ ...teamForm, leaderId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team leader" />
                </SelectTrigger>
                <SelectContent>
                  {(leaderboard || []).filter((item: any) => item.user.role === "leader").map((item: any) => (
                    <SelectItem key={item.user.id} value={item.user.id}>
                      {item.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setTeamModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
              >
                {(createTeamMutation.isPending || updateTeamMutation.isPending) 
                  ? "Saving..." 
                  : editTeam ? "Update Team" : "Create Team"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}