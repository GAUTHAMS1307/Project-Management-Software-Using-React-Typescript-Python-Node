import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectProgress() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 card-hover animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Progress</span>
            <Skeleton className="w-16 h-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-xl animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
                <div className="mb-2 flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="w-full h-2 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card className="lg:col-span-2 card-hover animate-slide-up">
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-project-diagram text-muted-foreground text-4xl mb-4"></i>
            <p className="text-muted-foreground">No projects found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <i className="fas fa-check-circle mr-1"></i>
            On Track
          </Badge>
        );
      case "delayed":
        return (
          <Badge variant="destructive" className="animate-pulse">
            <i className="fas fa-times-circle mr-1"></i>
            Delayed
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            <i className="fas fa-flag-checkered mr-1"></i>
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            At Risk
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

  return (
    <Card className="lg:col-span-2 card-hover animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Progress</span>
          <Button variant="ghost" size="sm" className="text-primary hover:underline">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.slice(0, 3).map((project: any) => {
            const projectIcon = getProjectIcon(project.name);
            
            return (
              <div 
                key={project.id}
                className="p-4 border border-border rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${projectIcon.gradient} rounded-lg flex items-center justify-center`}>
                      <i className={`${projectIcon.icon} text-white`}></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.domains?.join(", ") || "Development Team"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(project.status)}
                  </div>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
