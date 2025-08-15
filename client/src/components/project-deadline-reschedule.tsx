import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, User, FileText } from "lucide-react";

const rescheduleFormSchema = z.object({
  newDeadline: z.string().min(1, "New deadline is required"),
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
});

interface ProjectDeadlineRescheduleProps {
  projectId: string;
  projectName: string;
  currentDeadline: Date;
}

export function ProjectDeadlineReschedule({ projectId, projectName, currentDeadline }: ProjectDeadlineRescheduleProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch reschedule logs for this project
  const { data: rescheduleLogs, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/reschedule-logs`],
    enabled: !!projectId,
  });

  // Fetch users to get reschedule author names
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const form = useForm({
    resolver: zodResolver(rescheduleFormSchema),
    defaultValues: {
      newDeadline: "",
      reason: "",
    },
  });

  const rescheduleDeadlineMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/projects/${projectId}/reschedule-deadline`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Deadline Rescheduled",
        description: "The project deadline has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/reschedule-logs`] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Reschedule",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    await rescheduleDeadlineMutation.mutateAsync(data);
  };

  const getUserName = (userId: string) => {
    const user = Array.isArray(users) ? users.find((u: any) => u.id === userId) : null;
    return user ? user.name : "Unknown User";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const logs = Array.isArray(rescheduleLogs) ? rescheduleLogs : [];

  return (
    <div className="space-y-6" data-testid="project-deadline-reschedule">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Project Deadline Management</h3>
          <p className="text-sm text-muted-foreground">
            Current deadline: {formatDate(currentDeadline)}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-reschedule-deadline">
              <Calendar className="h-4 w-4 mr-2" />
              Reschedule Deadline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Project Deadline</DialogTitle>
            </DialogHeader>
            
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{projectName}</p>
              <p className="text-sm text-muted-foreground">
                Current deadline: {formatDate(currentDeadline)}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          data-testid="input-new-deadline"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Rescheduling</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please explain why the deadline needs to be changed..."
                          className="min-h-[100px]"
                          data-testid="textarea-reschedule-reason"
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
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-reschedule"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={rescheduleDeadlineMutation.isPending}
                    data-testid="button-confirm-reschedule"
                  >
                    {rescheduleDeadlineMutation.isPending ? "Rescheduling..." : "Reschedule"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reschedule History */}
      <div>
        <h4 className="text-base font-medium mb-4">Reschedule History</h4>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No deadline changes recorded</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log: any, index: number) => {
              const isExtension = new Date(log.newDeadline) > new Date(log.oldDeadline);
              
              return (
                <Card key={log.id} className={`border-l-4 ${isExtension ? 'border-l-orange-400' : 'border-l-green-400'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatDate(log.oldDeadline)} → {formatDate(log.newDeadline)}
                            </span>
                          </div>
                          <Badge variant={isExtension ? "destructive" : "secondary"}>
                            {isExtension ? "Extended" : "Moved Earlier"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>By {getUserName(log.rescheduleById)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                        </div>

                        <div className="bg-muted p-2 rounded-md text-sm">
                          <span className="font-medium">Reason: </span>
                          {log.reason}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}