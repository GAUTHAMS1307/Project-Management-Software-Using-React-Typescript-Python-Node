import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="text-right">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: "fas fa-project-diagram",
      color: "from-blue-500 to-blue-600",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: "fas fa-check-circle",
      color: "from-green-500 to-green-600",
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "Pending Delays",
      value: stats.pendingDelays,
      icon: "fas fa-clock",
      color: "from-amber-500 to-amber-600",
      change: "Needs attention",
      changeType: "warning"
    },
    {
      title: "Critical Issues",
      value: stats.criticalIssues,
      icon: "fas fa-exclamation-circle",
      color: "from-red-500 to-red-600",
      change: "Immediate action",
      changeType: "danger"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <Card 
          key={item.title}
          className="card-hover animate-fade-in shadow-lg" 
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center`}>
                <i className={`${item.icon} text-white text-xl`}></i>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.title}</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              {item.changeType === "positive" && (
                <>
                  <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                  <span className="text-green-500 font-medium">{item.change}</span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </>
              )}
              {item.changeType === "warning" && (
                <>
                  <i className="fas fa-exclamation-triangle text-amber-500 mr-1"></i>
                  <span className="text-amber-500 font-medium">{item.change}</span>
                </>
              )}
              {item.changeType === "danger" && (
                <>
                  <i className="fas fa-arrow-down text-red-500 mr-1 animate-pulse"></i>
                  <span className="text-red-500 font-medium animate-pulse">{item.change}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
