import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function DelayHeatmap() {
  // Mock heatmap data - in real app this would come from API
  const heatmapData = [
    { domain: "Design", days: [0, 0, 1, 0, 0, 0] },
    { domain: "Dev", days: [3, 2, 3, 2, 1, 0] },
    { domain: "Test", days: [0, 1, 2, 0, 0, 0] },
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getIntensityColor = (value: number) => {
    if (value === 0) return "bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700";
    if (value === 1) return "bg-yellow-300 dark:bg-yellow-700 hover:bg-yellow-400 dark:hover:bg-yellow-600";
    if (value === 2) return "bg-orange-300 dark:bg-orange-700 hover:bg-orange-400 dark:hover:bg-orange-600";
    return "bg-red-400 dark:bg-red-700 hover:bg-red-500 dark:hover:bg-red-600 animate-pulse";
  };

  const getDelayText = (value: number) => {
    if (value === 0) return "No delays";
    if (value === 1) return "Minor delay";
    if (value === 2) return "Major delay";
    return "Critical delay";
  };

  return (
    <Card className="card-hover animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Domain Delay Heatmap</span>
          <Button variant="ghost" size="sm" className="text-primary hover:underline">
            Analyze
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Header row */}
          <div></div>
          {weekDays.map(day => (
            <div key={day} className="text-xs text-center text-muted-foreground py-2">
              {day}
            </div>
          ))}
          
          {/* Data rows */}
          {heatmapData.map(({ domain, days }) => (
            <div key={domain} className="contents">
              <div className="text-xs text-muted-foreground py-2 pr-2 flex items-center">
                {domain}
              </div>
              {days.map((value, dayIndex) => (
                <Tooltip key={dayIndex}>
                  <TooltipTrigger>
                    <div 
                      className={`w-8 h-8 rounded cursor-pointer transition-colors ${getIntensityColor(value)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{domain} - {weekDays[dayIndex]}</p>
                    <p>{getDelayText(value)}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Less delays</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-green-200 dark:bg-green-800 rounded"></div>
            <div className="w-3 h-3 bg-yellow-300 dark:bg-yellow-700 rounded"></div>
            <div className="w-3 h-3 bg-orange-300 dark:bg-orange-700 rounded"></div>
            <div className="w-3 h-3 bg-red-400 dark:bg-red-700 rounded"></div>
          </div>
          <span>More delays</span>
        </div>
      </CardContent>
    </Card>
  );
}
