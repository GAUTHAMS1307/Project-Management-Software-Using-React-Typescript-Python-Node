import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: any;
  mode: "create" | "edit" | "view";
  teams: any[];
}

export function ProjectModal({ open, onClose, project, mode, teams }: ProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "planning",
    progress: project?.progress || 0,
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
    teamId: project?.teamId || "",
    domains: project?.domains || [],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project created successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Project creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create project.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Project update error:", error);
      toast({
        title: "Error", 
        description: error?.message || "Failed to update project.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.teamId && teams.length > 0) {
      // Auto-select first team if none selected
      setFormData(prev => ({ ...prev, teamId: teams[0].id }));
    }
    
    const submitData = {
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      progress: Number(formData.progress),
      teamId: formData.teamId || (teams.length > 0 ? teams[0].id : "default-team-id"),
      domains: formData.domains.length > 0 ? formData.domains : ["General"]
    };

    if (mode === "create") {
      createMutation.mutate(submitData);
    } else if (mode === "edit") {
      updateMutation.mutate(submitData);
    }
  };

  const handleDomainAdd = (domain: string) => {
    if (domain && !formData.domains.includes(domain)) {
      setFormData(prev => ({
        ...prev,
        domains: [...prev.domains, domain]
      }));
    }
  };

  const handleDomainRemove = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.filter(d => d !== domain)
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">In Progress</Badge>;
      case "delayed":
        return <Badge variant="destructive">Delayed</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Completed</Badge>;
      case "planning":
        return <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">Planning</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Create New Project"}
            {mode === "edit" && "Edit Project"}
            {mode === "view" && "Project Details"}
          </DialogTitle>
        </DialogHeader>

        {mode === "view" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Project Name</Label>
                <p className="text-lg font-semibold">{project.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(project.status)}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="mt-1 text-foreground">{project.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Progress</Label>
                <p className="text-lg font-semibold">{project.progress}%</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                <p className="text-foreground">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                <p className="text-foreground">{new Date(project.endDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Domains</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {project.domains?.map((domain: string) => (
                  <Badge key={domain} variant="secondary">{domain}</Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Team</Label>
              <p className="text-foreground">
                {teams.find(t => t.id === project.teamId)?.name || 'Unknown Team'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date*</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date*</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team*</Label>
              <Select 
                value={formData.teamId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Domains</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.domains.map((domain) => (
                  <Badge key={domain} variant="secondary" className="cursor-pointer" onClick={() => handleDomainRemove(domain)}>
                    {domain} <i className="fas fa-times ml-1"></i>
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add domain (e.g., Development, Design)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleDomainAdd((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Add domain"]') as HTMLInputElement;
                    if (input?.value) {
                      handleDomainAdd(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {mode === "create" ? "Create Project" : "Update Project"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}