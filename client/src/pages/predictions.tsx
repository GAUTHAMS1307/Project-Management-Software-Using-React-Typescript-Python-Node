import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Brain, TrendingUp, AlertTriangle, Target, Clock, BarChart3 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Prediction {
  task_id: string;
  task_name: string;
  project_name: string;
  assignee_name: string;
  assignee_role: string;
  domain: string;
  complexity: string;
  predicted_delay_days: number;
  risk_score: number;
  confidence: number;
  risk_category: string;
  estimated_completion: string;
  recommended_actions: string[];
}

interface AnalysisResults {
  success: boolean;
  results: {
    predictions: Prediction[];
    risk_analysis: {
      overall_risk_score: number;
      high_risk_tasks: number;
      critical_tasks: number;
      total_tasks: number;
      projects_at_risk: Array<{
        project_name: string;
        risk_score: number;
        high_risk_tasks: number;
        total_tasks: number;
      }>;
    };
    recommendations: Recommendation[];
    analysis_timestamp: string;
    model_version: string;
  };
  message: string;
}

interface Recommendation {
  task_id: string;
  task_name: string;
  project_name: string;
  assignee_name: string;
  risk_score: number;
  predicted_delay: number;
  priority: string;
  domain: string;
  complexity: string;
  recommendations: string[];
  estimated_impact: string;
  timeline_adjustment: string;
  resource_suggestion: string;
}

export default function PredictionsPage() {
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResults | null>(null);
  const { toast } = useToast();

  // Query for predictions
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ["/api/analysis/predictions"],
    enabled: false
  });

  // Query for recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["/api/analysis/recommendations"],
    enabled: false
  });

  // Query for risk analysis
  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ["/api/analysis/risk"],
    enabled: false
  });

  // Mutation for full analysis
  const fullAnalysisMutation = useMutation({
    mutationFn: () => apiRequest("/api/analysis/full"),
    onSuccess: (data: AnalysisResults) => {
      if (data.success) {
        setActiveAnalysis(data);
        toast({
          title: "Analysis Complete",
          description: data.message || "Comprehensive delay analysis has been completed successfully."
        });
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["/api/analysis"] });
      }
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to run comprehensive analysis. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for predictions only
  const predictionsMutation = useMutation({
    mutationFn: () => apiRequest("/api/analysis/predictions"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/predictions"] });
      toast({
        title: "Predictions Generated",
        description: "Delay predictions have been generated for all tasks."
      });
    }
  });

  // Mutation for risk analysis
  const riskAnalysisMutation = useMutation({
    mutationFn: () => apiRequest("/api/analysis/risk"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/risk"] });
      toast({
        title: "Risk Analysis Complete",
        description: "Project risk analysis has been completed."
      });
    }
  });

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return "destructive";
    if (riskScore >= 60) return "secondary";
    if (riskScore >= 40) return "outline";
    return "default";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delay Predictions & Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered insights for project delay prediction and risk assessment
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => fullAnalysisMutation.mutate()}
            disabled={fullAnalysisMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Run Full Analysis</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generate Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 ml-auto" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => predictionsMutation.mutate()}
              disabled={predictionsMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {predictionsMutation.isPending ? "Generating..." : "Predict Task Delays"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Analysis</CardTitle>
            <AlertTriangle className="h-4 w-4 ml-auto" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => riskAnalysisMutation.mutate()}
              disabled={riskAnalysisMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {riskAnalysisMutation.isPending ? "Analyzing..." : "Analyze Project Risks"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            <BarChart3 className="h-4 w-4 ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Analysis Service Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {activeAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Latest Analysis Results</span>
            </CardTitle>
            <CardDescription>
              Analysis completed at {new Date(activeAnalysis.results.analysis_timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{activeAnalysis.results.risk_analysis.projects_at_risk.length}</div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{activeAnalysis.results.risk_analysis.total_tasks}</div>
                <div className="text-sm text-muted-foreground">Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{activeAnalysis.results.risk_analysis.high_risk_tasks}</div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(activeAnalysis.results.predictions.reduce((sum, p) => sum + p.predicted_delay_days, 0) / activeAnalysis.results.predictions.length).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Delay (days)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{activeAnalysis.results.risk_analysis.critical_tasks}</div>
                <div className="text-sm text-muted-foreground">Critical Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Task Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Delay Predictions</CardTitle>
              <CardDescription>
                AI-generated predictions for potential task delays
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <div className="text-center py-8">Loading predictions...</div>
              ) : activeAnalysis?.results?.predictions?.length > 0 ? (
                <div className="space-y-4">
                  {activeAnalysis.results.predictions.map((prediction: Prediction) => (
                    <div key={prediction.task_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{prediction.task_name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getRiskColor(prediction.risk_score)}>
                            {prediction.risk_category}
                          </Badge>
                          <Badge variant={getRiskColor(prediction.risk_score)}>
                            Risk: {prediction.risk_score}%
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Predicted Delay:</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{prediction.predicted_delay_days.toFixed(1)} days</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Project:</span>
                          <div>{prediction.project_name}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Assignee:</span>
                          <div>{prediction.assignee_name}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Domain:</span>
                          <div>{prediction.domain}</div>
                        </div>
                      </div>
                      <Progress value={prediction.risk_score} className="mb-2" />
                      <div className="text-sm">
                        <span className="font-medium">Actions:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {prediction.recommended_actions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No predictions available. Click "Run Full Analysis" to generate predictions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>High-Risk Task Recommendations</CardTitle>
              <CardDescription>
                Actionable recommendations for tasks with high delay risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="text-center py-8">Loading recommendations...</div>
              ) : activeAnalysis?.results?.recommendations?.length > 0 ? (
                <div className="space-y-4">
                  {activeAnalysis.results.recommendations.map((rec: Recommendation) => (
                    <Alert key={rec.task_id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{rec.task_name}</span>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{rec.priority}</Badge>
                          <Badge variant={getRiskColor(rec.risk_score)}>
                            {rec.risk_score}% Risk
                          </Badge>
                        </div>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm font-medium">Project:</span> {rec.project_name}
                          </div>
                          <div>
                            <span className="text-sm font-medium">Assignee:</span> {rec.assignee_name}
                          </div>
                          <div>
                            <span className="text-sm font-medium">Domain:</span> {rec.domain}
                          </div>
                          <div>
                            <span className="text-sm font-medium">Complexity:</span> {rec.complexity}
                          </div>
                        </div>
                        <div className="mb-3">
                          <p><span className="font-medium">Impact:</span> {rec.estimated_impact}</p>
                          <p><span className="font-medium">Resource Suggestion:</span> {rec.resource_suggestion}</p>
                        </div>
                        <div>
                          <span className="font-medium">Recommended Actions:</span>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {rec.recommendations.map((action, index) => (
                              <li key={index} className="text-sm">{action}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recommendations available. Run full analysis to generate recommendations.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Risk Analysis</CardTitle>
              <CardDescription>
                Comprehensive risk assessment across all projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {riskLoading ? (
                <div className="text-center py-8">Loading risk analysis...</div>
              ) : riskData?.risk_analysis ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{riskData.risk_analysis.total_tasks}</div>
                      <div className="text-sm text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{riskData.risk_analysis.delayed_tasks}</div>
                      <div className="text-sm text-muted-foreground">Delayed Tasks</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{riskData.risk_analysis.high_risk_tasks}</div>
                      <div className="text-sm text-muted-foreground">High Risk Tasks</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{riskData.risk_analysis.average_delay_days?.toFixed(1) || '0'}</div>
                      <div className="text-sm text-muted-foreground">Avg Delay (days)</div>
                    </div>
                  </div>

                  <Separator />

                  {riskData.risk_analysis.critical_tasks && riskData.risk_analysis.critical_tasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Critical Tasks Requiring Attention</h3>
                      <div className="space-y-3">
                        {riskData.risk_analysis.critical_tasks.map((task: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{task.title}</span>
                              <div className="flex items-center space-x-2">
                                <Badge variant={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                                <Badge variant={getRiskColor(task.risk_score)}>
                                  Risk: {task.risk_score?.toFixed(0) || 0}%
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Status: {task.status} | Delay: {task.delay_days?.toFixed(1) || 0} days
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No risk analysis available. Click "Analyze Project Risks" to generate analysis.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}