import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Calendar, User, MessageSquare, CheckCircle, XCircle } from "lucide-react";

interface ExtensionRequest {
  id: string;
  taskId: string;
  requesterId: string;
  projectId: string;
  additionalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  responseMessage?: string;
  requestedAt: Date;
  respondedAt?: Date;
  responderId?: string;
}

export function ExtensionRequestManagement() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [respondingTo, setRespondingTo] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

  // Fetch pending extension requests
  const { data: pendingRequests, isLoading } = useQuery({
    queryKey: ["/api/extension-requests/pending"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all extension requests for history
  const { data: allRequests } = useQuery({
    queryKey: ["/api/extension-requests"],
  });

  // Fetch users to get requester names
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch tasks to get task names
  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Fetch projects to get project names
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async ({ id, status, responseMessage }: { id: string; status: string; responseMessage: string }) => {
      const response = await apiRequest(`/api/extension-requests/${id}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ status, responseMessage }),
      });
      return response;
    },
    onSuccess: (data, variables) => {
      const action = variables.status === "approved" ? "approved" : "rejected";
      toast({
        title: `Extension Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description: `The extension request has been ${action}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/extension-requests"] });
      setRespondingTo(null);
      setResponseMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Respond",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleRespond = (status: "approve" | "reject") => {
    if (!selectedRequest || !responseMessage.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a response message.",
        variant: "destructive",
      });
      return;
    }

    respondToRequestMutation.mutate({
      id: selectedRequest.id,
      status: status === "approve" ? "approved" : "rejected",
      responseMessage: responseMessage.trim(),
    });
  };

  const getUserName = (userId: string) => {
    const user = Array.isArray(users) ? users.find((u: any) => u.id === userId) : null;
    return user ? user.name : "Unknown User";
  };

  const getTaskName = (taskId: string) => {
    const task = Array.isArray(tasks) ? tasks.find((t: any) => t.id === taskId) : null;
    return task ? task.title : "Unknown Task";
  };

  const getProjectName = (projectId: string) => {
    const project = Array.isArray(projects) ? projects.find((p: any) => p.id === projectId) : null;
    return project ? project.name : "Unknown Project";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "approved":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const pendingRequestsList = Array.isArray(pendingRequests) ? pendingRequests : [];
  const allRequestsList = Array.isArray(allRequests) ? allRequests : [];
  const recentRequests = allRequestsList.slice(0, 10); // Show last 10 requests

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Extension Request Management</h3>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="extension-request-management">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Extension Request Management</h3>
        <Badge variant="secondary" data-testid="pending-count">
          {pendingRequestsList.length} pending
        </Badge>
      </div>

      {pendingRequestsList.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No pending extension requests</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequestsList.map((request: ExtensionRequest) => (
            <Card key={request.id} className="border-l-4 border-l-yellow-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    Extension Request
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Requester: {getUserName(request.requesterId)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Project: {getProjectName(request.projectId)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>Task: {getTaskName(request.taskId)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{request.additionalDays} additional days</span>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-md">
                  <Label className="text-sm font-medium">Reason:</Label>
                  <p className="text-sm mt-1">{request.reason}</p>
                </div>

                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setResponseMessage("");
                          setRespondingTo({ id: request.id, action: "approve" });
                        }}
                        data-testid={`button-approve-${request.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve Extension Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          You are about to approve {request.additionalDays} additional days for the task "{getTaskName(request.taskId)}".
                        </p>
                        <div>
                          <Label htmlFor="response">Response Message</Label>
                          <Textarea
                            id="response"
                            placeholder="Provide feedback or instructions for the team member..."
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            className="mt-2"
                            data-testid="textarea-approve-response"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setRespondingTo(null)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleRespond("approve")}
                            disabled={respondToRequestMutation.isPending}
                            data-testid="button-confirm-approve"
                          >
                            {respondToRequestMutation.isPending ? "Approving..." : "Approve Request"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setResponseMessage("");
                          setRespondingTo({ id: request.id, action: "reject" });
                        }}
                        data-testid={`button-reject-${request.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Extension Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          You are about to reject the extension request for "{getTaskName(request.taskId)}".
                        </p>
                        <div>
                          <Label htmlFor="response">Response Message *</Label>
                          <Textarea
                            id="response"
                            placeholder="Please explain why the extension is being rejected..."
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            className="mt-2"
                            data-testid="textarea-reject-response"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setRespondingTo(null)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRespond("reject")}
                            disabled={respondToRequestMutation.isPending}
                            data-testid="button-confirm-reject"
                          >
                            {respondToRequestMutation.isPending ? "Rejecting..." : "Reject Request"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Requests History */}
      {recentRequests.length > 0 && (
        <div className="mt-8">
          <h4 className="text-base font-medium mb-4">Recent Requests</h4>
          <div className="space-y-2">
            {recentRequests.map((request: ExtensionRequest) => (
              <Card key={request.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{getUserName(request.requesterId)}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{getTaskName(request.taskId)}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{request.additionalDays} days</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}