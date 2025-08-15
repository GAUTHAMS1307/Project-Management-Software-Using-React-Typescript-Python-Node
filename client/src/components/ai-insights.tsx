import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function AIInsights() {
  const { toast } = useToast();

  const handleImplementRecommendation = (type: string) => {
    toast({
      title: "Recommendation Applied",
      description: `AI recommendation for ${type} has been implemented.`,
    });
  };

  const insights = [
    {
      type: "Critical Bottleneck",
      icon: "fas fa-exclamation-triangle",
      color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      borderColor: "border-red-200 dark:border-red-800",
      iconColor: "text-red-600 dark:text-red-400",
      titleColor: "text-red-800 dark:text-red-200",
      textColor: "text-red-700 dark:text-red-300",
      buttonColor: "text-red-600 dark:text-red-400",
      message: "Database migration is blocking 3 dependent tasks. Recommend immediate resource reallocation.",
      action: "resource-reallocation"
    },
    {
      type: "Workload Balance",
      icon: "fas fa-users",
      color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
      titleColor: "text-blue-800 dark:text-blue-200",
      textColor: "text-blue-700 dark:text-blue-300",
      buttonColor: "text-blue-600 dark:text-blue-400",
      message: "Sarah Johnson is overloaded. Suggest redistributing 2 tasks to Mike Chen and Emma Davis.",
      action: "workload-rebalancing"
    },
    {
      type: "Meeting Optimization",
      icon: "fas fa-calendar-alt",
      color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      borderColor: "border-green-200 dark:border-green-800",
      iconColor: "text-green-600 dark:text-green-400",
      titleColor: "text-green-800 dark:text-green-200",
      textColor: "text-green-700 dark:text-green-300",
      buttonColor: "text-green-600 dark:text-green-400",
      message: "Schedule dependency review meeting for Dev & QA teams tomorrow at 2 PM to resolve blockers.",
      action: "meeting-scheduling"
    }
  ];

  return (
    <Card className="card-hover animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-brain text-white"></i>
            </div>
            <span>AI Insights & Recommendations</span>
          </div>
          <Badge className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
            <i className="fas fa-robot mr-1"></i>
            Powered by AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((insight, index) => (
            <div 
              key={insight.type}
              className={`p-4 bg-gradient-to-br ${insight.color} rounded-xl border ${insight.borderColor} animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <i className={`${insight.icon} ${insight.iconColor}`}></i>
                <h3 className={`font-semibold ${insight.titleColor}`}>{insight.type}</h3>
              </div>
              <p className={`text-sm ${insight.textColor} mb-3`}>
                {insight.message}
              </p>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => handleImplementRecommendation(insight.action)}
                className={`${insight.buttonColor} hover:underline p-0 h-auto font-medium`}
              >
                {insight.type === "Critical Bottleneck" && "Apply Suggestion"}
                {insight.type === "Workload Balance" && "Rebalance Tasks"}
                {insight.type === "Meeting Optimization" && "Schedule Meeting"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
