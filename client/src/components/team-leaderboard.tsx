import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamLeaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return (
      <Card className="card-hover animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Team Leaderboard</span>
            <Skeleton className="w-16 h-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 rounded-xl animate-pulse">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-12 mb-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card className="card-hover animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle>Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-trophy text-muted-foreground text-4xl mb-4"></i>
            <p className="text-muted-foreground">No leaderboard data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full text-white font-bold text-sm">
            <i className="fas fa-crown"></i>
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full text-white font-bold text-sm">
            2
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full text-white font-bold text-sm">
            3
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full text-muted-foreground font-bold text-sm">
            {index + 1}
          </div>
        );
    }
  };

  const recentAchievements = [
    { type: "on_time_hero", label: "On-time Hero", icon: "fas fa-clock", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" },
    { type: "rescue_squad", label: "Rescue Squad", icon: "fas fa-life-ring", color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" },
    { type: "dependency_saver", label: "Dependency Saver", icon: "fas fa-link", color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200" },
  ];

  return (
    <Card className="card-hover animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Team Leaderboard</span>
          <Button variant="ghost" size="sm" className="text-primary hover:underline">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.slice(0, 3).map((entry: any, index: number) => (
            <div 
              key={entry.user.id}
              className="flex items-center space-x-4 p-3 rounded-xl hover:bg-accent/50 transition-colors"
            >
              {getRankIcon(index)}
              <Avatar className="w-10 h-10">
                <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                <AvatarFallback>
                  {entry.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{entry.user.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{entry.user.role}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{entry.points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Achievements */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-semibold text-foreground mb-3">Recent Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {recentAchievements.map((achievement) => (
              <Badge 
                key={achievement.type}
                className={`${achievement.color} animate-bounce-gentle`}
                style={{ animationDelay: `${recentAchievements.indexOf(achievement) * 0.1}s` }}
              >
                <i className={`${achievement.icon} mr-1`}></i>
                {achievement.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
