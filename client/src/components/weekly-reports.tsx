import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Download, FileText, TrendingUp, TrendingDown, AlertTriangle, BarChart } from "lucide-react";

const reportGenerationSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  weekStartDate: z.string().min(1, "Start date is required"),
  weekEndDate: z.string().min(1, "End date is required"),
});

interface WeeklyReport {
  id: string;
  projectId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  projectDueDate: Date;
  currentProjectEndDate: Date;
  rescheduledDates: Array<{
    oldDate: Date;
    newDate: Date;
    reason: string;
    rescheduleDate: Date;
  }>;
  delayCount: number;
  delayDetails: Array<{
    taskId: string;
    taskTitle: string;
    delayDays: number;
    reason: string;
  }>;
  generatedAt: Date;
  generatedBy: string;
}

export function WeeklyReports() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  // Fetch weekly reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/weekly-reports"],
  });

  // Fetch projects for report generation
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch users to get generator names
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const form = useForm({
    resolver: zodResolver(reportGenerationSchema),
    defaultValues: {
      projectId: "",
      weekStartDate: "",
      weekEndDate: "",
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/weekly-reports/generate", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "Weekly report has been successfully generated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-reports"] });
      form.reset();
      setIsGenerateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Report",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const exportReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      // Use the same token source as the global query client
      const token = (window as any).__auth_token || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(`/api/weekly-reports/${reportId}/export/csv`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to export report: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-report-${reportId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Report Exported",
        description: "Report has been downloaded as CSV file.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error?.message || "Failed to export report.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    await generateReportMutation.mutateAsync(data);
  };

  const handleExportCSV = (reportId: string) => {
    exportReportMutation.mutate(reportId);
  };

  const getUserName = (userId: string) => {
    const user = Array.isArray(users) ? users.find((u: any) => u.id === userId) : null;
    return user ? user.name : "Unknown User";
  };

  const getProjectName = (projectId: string) => {
    const project = Array.isArray(projects) ? projects.find((p: any) => p.id === projectId) : null;
    return project ? project.name : "Unknown Project";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const reportsList = Array.isArray(reports) ? reports : [];
  const projectsList = Array.isArray(projects) ? projects : [];

  return (
    <div className="space-y-6" data-testid="weekly-reports">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Weekly Reports</h3>
          <p className="text-sm text-muted-foreground">
            Generate and view weekly project progress reports
          </p>
        </div>

        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-report">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Weekly Report</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-report-project">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectsList.map((project: any) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weekStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Week Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-week-start"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weekEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Week End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-week-end"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGenerateDialogOpen(false)}
                    data-testid="button-cancel-generate"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={generateReportMutation.isPending}
                    data-testid="button-confirm-generate"
                  >
                    {generateReportMutation.isPending ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reportsList.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No reports generated yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Generate Report" to create your first weekly report</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reportsList.map((report: WeeklyReport) => (
            <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    {getProjectName(report.projectId)}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {formatDate(report.weekStartDate)} - {formatDate(report.weekEndDate)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generated by {getUserName(report.generatedBy)} on {formatDate(report.generatedAt)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-2xl font-bold">{report.delayCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Delays</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-2xl font-bold">{report.rescheduledDates.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Reschedules</p>
                  </div>
                </div>

                {/* Project Timeline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{formatDate(report.projectDueDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current End Date:</span>
                    <span>{formatDate(report.currentProjectEndDate)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedReport(report)}
                        data-testid={`button-view-${report.id}`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Weekly Report - {getProjectName(report.projectId)}</DialogTitle>
                      </DialogHeader>
                      {selectedReport && (
                        <div className="space-y-6">
                          {/* Report Header */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-md">
                            <div>
                              <p className="text-sm font-medium">Report Period</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(selectedReport.weekStartDate)} - {formatDate(selectedReport.weekEndDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Project Due Date</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(selectedReport.projectDueDate)}
                              </p>
                            </div>
                          </div>

                          {/* Reschedule History */}
                          {selectedReport.rescheduledDates.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">Deadline Reschedules</h4>
                              <div className="space-y-2">
                                {selectedReport.rescheduledDates.map((reschedule, index) => (
                                  <Card key={index} className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        {new Date(reschedule.newDate) > new Date(reschedule.oldDate) ? (
                                          <TrendingDown className="h-4 w-4 text-red-500" />
                                        ) : (
                                          <TrendingUp className="h-4 w-4 text-green-500" />
                                        )}
                                        <span className="text-sm">
                                          {formatDate(reschedule.oldDate)} → {formatDate(reschedule.newDate)}
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {formatDate(reschedule.rescheduleDate)}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{reschedule.reason}</p>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Delay Details */}
                          {selectedReport.delayDetails.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">Task Delays</h4>
                              <div className="space-y-2">
                                {selectedReport.delayDetails.map((delay, index) => (
                                  <Card key={index} className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium">{delay.taskTitle}</p>
                                        <p className="text-xs text-muted-foreground">Task ID: {delay.taskId}</p>
                                      </div>
                                      <Badge variant="destructive" className="text-xs">
                                        {delay.delayDays} days
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{delay.reason}</p>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedReport.delayDetails.length === 0 && selectedReport.rescheduledDates.length === 0 && (
                            <div className="text-center p-8">
                              <BarChart className="h-12 w-12 text-green-500 mx-auto mb-2" />
                              <p className="text-green-600 font-medium">Great Progress!</p>
                              <p className="text-sm text-muted-foreground">No delays or reschedules during this period</p>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV(report.id)}
                    disabled={exportReportMutation.isPending}
                    data-testid={`button-export-${report.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}