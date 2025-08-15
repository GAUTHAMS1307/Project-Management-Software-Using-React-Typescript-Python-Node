import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const extensionRequestFormSchema = z.object({
  taskId: z.string().min(1, "Task is required"),
  projectId: z.string().min(1, "Project is required"),
  additionalDays: z.number().min(1, "Additional days must be at least 1").max(30, "Cannot request more than 30 days"),
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
});

interface ExtensionRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedTaskId?: string;
  preSelectedProjectId?: string;
}

export function ExtensionRequestForm({ 
  open, 
  onOpenChange, 
  preSelectedTaskId, 
  preSelectedProjectId 
}: ExtensionRequestFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: open,
  });

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: open,
  });

  const form = useForm({
    resolver: zodResolver(extensionRequestFormSchema),
    defaultValues: {
      taskId: preSelectedTaskId || "",
      projectId: preSelectedProjectId || "",
      additionalDays: 1,
      reason: "",
    },
  });

  const createExtensionRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/extension-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Extension Request Submitted",
        description: "Your extension request has been submitted and is pending approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/extension-requests"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Request",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createExtensionRequestMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTasks = Array.isArray(tasks) ? tasks.filter((task: any) => 
    // Show tasks that could potentially need extensions
    task.status === "in_progress" || task.status === "todo" || task.status === "delayed" || task.status === "review"
  ) : [];

  // If no eligible tasks, show all tasks for demo purposes
  const displayTasks = userTasks.length > 0 ? userTasks : (Array.isArray(tasks) ? tasks.slice(0, 5) : []);

  const availableProjects = Array.isArray(projects) ? projects : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Task Extension</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={projectsLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-project">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProjects.map((project: any) => (
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
              name="taskId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={tasksLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-task">
                        <SelectValue placeholder="Select task to extend" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {displayTasks.length > 0 ? displayTasks.map((task: any) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title} - {task.status}
                        </SelectItem>
                      )) : (
                        <SelectItem value="" disabled>
                          No tasks available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Days Needed</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      placeholder="Number of days"
                      data-testid="input-additional-days"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
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
                  <FormLabel>Reason for Extension</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed explanation for why you need this extension..."
                      className="min-h-[100px]"
                      data-testid="textarea-reason"
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
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || createExtensionRequestMutation.isPending}
                data-testid="button-submit-request"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}