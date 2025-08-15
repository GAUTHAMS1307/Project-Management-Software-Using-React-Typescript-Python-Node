import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function DelayAlerts() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["/api/delay-alerts/unresolved"],
  });

  if (isLoading) {
    return (
      <Card className="card-hover animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Delay Alerts</span>
            <Skeleton className="w-6 h-6 rounded-full" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border animate-pulse">
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card className="card-hover animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Delay Alerts</span>
            <i className="fas fa-check-circle text-green-500"></i>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
            <p className="text-muted-foreground">No active delay alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "critical":
        return {
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          iconColor: "bg-red-500",
          textColor: "text-red-800 dark:text-red-200",
          descColor: "text-red-600 dark:text-red-300",
          timeColor: "text-red-500 dark:text-red-400",
          icon: "fas fa-phone",
          iconAnimation: "animate-glow"
        };
      case "major":
        return {
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-200 dark:border-amber-800",
          iconColor: "bg-amber-500",
          textColor: "text-amber-800 dark:text-amber-200",
          descColor: "text-amber-600 dark:text-amber-300",
          timeColor: "text-amber-500 dark:text-amber-400",
          icon: "fas fa-sms",
          iconAnimation: ""
        };
      default:
        return {
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          iconColor: "bg-blue-500",
          textColor: "text-blue-800 dark:text-blue-200",
          descColor: "text-blue-600 dark:text-blue-300",
          timeColor: "text-blue-500 dark:text-blue-400",
          icon: "fas fa-envelope",
          iconAnimation: ""
        };
    }
  };

  return (
    <Card className="card-hover animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Delay Alerts</span>
          <i className="fas fa-exclamation-triangle text-amber-500 animate-pulse"></i>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.slice(0, 3).map((alert: any) => {
            const style = getAlertStyle(alert.type);
            const timeAgo = new Date(alert.createdAt).toLocaleString();
            
            return (
              <div 
                key={alert.id}
                className={`p-4 ${style.bgColor} border ${style.borderColor} rounded-xl`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${style.iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`${style.icon} text-white text-sm ${style.iconAnimation}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${style.textColor}`}>
                        {alert.title}
                      </h3>
                      <Badge 
                        variant={alert.type === "critical" ? "destructive" : "secondary"}
                        className="text-xs capitalize"
                      >
                        {alert.type}
                      </Badge>
                    </div>
                    <p className={`text-sm ${style.descColor}`}>
                      {alert.message}
                    </p>
                    <p className={`text-xs ${style.timeColor} mt-1`}>
                      {timeAgo}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button 
          variant="ghost" 
          className="w-full mt-4 text-primary hover:bg-primary/10"
        >
          View All Alerts
        </Button>
      </CardContent>
    </Card>
  );
}
