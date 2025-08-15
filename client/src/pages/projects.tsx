import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectModal } from "@/components/project-modal";

export default function Projects() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
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

  const filteredProjects = projects?.filter((project: any) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <i className="fas fa-play mr-1"></i>
            In Progress
          </Badge>
        );
      case "delayed":
        return (
          <Badge variant="destructive" className="animate-pulse">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Delayed
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            <i className="fas fa-check-circle mr-1"></i>
            Completed
          </Badge>
        );
      case "planning":
        return (
          <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
            <i className="fas fa-lightbulb mr-1"></i>
            Planning
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
            <i className="fas fa-question mr-1"></i>
            Unknown
          </Badge>
        );
    }
  };

  const getProjectIcon = (name: string) => {
    if (name.toLowerCase().includes("design") || name.toLowerCase().includes("redesign")) {
      return { icon: "fas fa-palette", gradient: "from-purple-500 to-pink-500" };
    }
    if (name.toLowerCase().includes("mobile") || name.toLowerCase().includes("app")) {
      return { icon: "fas fa-mobile-alt", gradient: "from-blue-500 to-cyan-500" };
    }
    if (name.toLowerCase().includes("data") || name.toLowerCase().includes("migration")) {
      return { icon: "fas fa-database", gradient: "from-green-500 to-teal-500" };
    }
    return { icon: "fas fa-project-diagram", gradient: "from-indigo-500 to-purple-500" };
  };

  const getTeamInfo = (teamId: string) => {
    const team = teams?.find((t: any) => t.id === teamId);
    return team || { name: "Unknown Team", memberIds: [] };
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Projects</h1>
              <p className="text-muted-foreground">Manage and track all your projects.</p>
            </div>
            
            {user.role === "manager" && (
              <Button 
                className="gradient-primary text-white"
                onClick={() => {
                  setSelectedProject(null);
                  setModalMode("create");
                  setModalOpen(true);
                }}
              >
                <i className="fas fa-plus mr-2"></i>
                New Project
              </Button>
            )}
          </div>
        </header>

        {/* Filters */}
        <div className="px-6 py-4 bg-card border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search projects..."
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-20 h-6 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-2 w-full mb-4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <i className="fas fa-project-diagram text-muted-foreground text-6xl mb-6"></i>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm || statusFilter !== "all" ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria." 
                  : "Get started by creating your first project."}
              </p>
              {user.role === "manager" && !searchTerm && statusFilter === "all" && (
                <Button 
                  className="gradient-primary text-white"
                  onClick={() => {
                    setSelectedProject(null);
                    setModalMode("create");
                    setModalOpen(true);
                  }}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: any, index: number) => {
                const projectIcon = getProjectIcon(project.name);
                const teamInfo = getTeamInfo(project.teamId);
                
                return (
                  <Card 
                    key={project.id} 
                    className="card-hover animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${projectIcon.gradient} rounded-xl flex items-center justify-center`}>
                          <i className={`${projectIcon.icon} text-white text-xl`}></i>
                        </div>
                        {getStatusBadge(project.status)}
                      </div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      {/* Project Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Team</span>
                          <span className="font-medium text-foreground">{teamInfo.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Members</span>
                          <span className="font-medium text-foreground">{teamInfo.memberIds.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Due Date</span>
                          <span className="font-medium text-foreground">
                            {new Date(project.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Domains */}
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">Domains</p>
                        <div className="flex flex-wrap gap-1">
                          {project.domains?.map((domain: string) => (
                            <Badge key={domain} variant="secondary" className="text-xs">
                              {domain}
                            </Badge>
                          )) || (
                            <Badge variant="secondary" className="text-xs">
                              Development
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setModalMode("view");
                            setModalOpen(true);
                          }}
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View Details
                        </Button>
                        {(user.role === "manager" || user.role === "leader") && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setModalMode("edit");
                              setModalOpen(true);
                            }}
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
        </main>
      </div>
      
      {/* Project Modal */}
      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        project={selectedProject}
        mode={modalMode}
        teams={teams || []}
      />
    </div>
  );
}
