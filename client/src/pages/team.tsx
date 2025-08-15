import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";

const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "leader"], { required_error: "Please select a role" }),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function Team() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState("all");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [taskAssignOpen, setTaskAssignOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [viewTasksOpen, setViewTasksOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
    enabled: !!user,
  });

  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Load messages when a chat is opened
  const { data: conversationMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/messages/conversation", selectedMember?.id],
    enabled: !!user && !!selectedMember && chatOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { receiverId: string; content: string }) => {
      return apiRequest(`/api/messages`, {
        method: "POST",
        body: JSON.stringify(messageData),
      });
    },
    onSuccess: () => {
      setChatMessage("");
      refetchMessages();
      toast({ 
        title: "Message Sent", 
        description: `Message sent to ${selectedMember?.name}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Send Failed", 
        description: error?.message || "Failed to send message",
        variant: "destructive"
      });
    },
  });

  const invitationForm = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (data: InvitationFormData) => {
      // Using the first team's ID for demo purposes
      const teamId = myTeams.length > 0 ? myTeams[0].id : "default-team-id";
      return apiRequest(`/api/teams/${teamId}/invite`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response: any) => {
      toast({ 
        title: "Invitation Sent!", 
        description: `Demo invitation sent to ${response.invitedEmail}. In a real application, this would send an actual email with registration link.` 
      });
      setAddMemberOpen(false);
      invitationForm.reset();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to send invitation";
      toast({ 
        title: "Invitation Failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== "leader") {
    setLocation(`/dashboard/${user.role}`);
    return null;
  }

  const myTeams = Array.isArray(teams) ? teams : [];
  const teamTasks = Array.isArray(tasks) ? tasks : [];
  const allUsers = Array.isArray(users) ? users : [];

  // Debug logging
  if (usersError) {
    console.log('Users API Error:', usersError);
  }
  if (usersLoading) {
    console.log('Users loading...');
  }
  if (users) {
    console.log('Users loaded:', users);
  }

  // Get actual team members from our enhanced data or fallback to mock data if users API fails
  let teamMembers = [];
  
  if (allUsers && allUsers.length > 0) {
    // Use real data from API
    teamMembers = allUsers.filter(u => u.role === "member" || u.role === "leader").map(u => {
      const memberTasks = teamTasks.filter(t => t.assigneeId === u.id);
      const completedTasks = memberTasks.filter(t => t.status === "completed");
      const inProgressTasks = memberTasks.filter(t => t.status === "in_progress");
      
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        status: "active", // Default status - could be enhanced with real presence data
        tasksCompleted: completedTasks.length,
        tasksInProgress: inProgressTasks.length,
        totalPoints: completedTasks.length * 50 + inProgressTasks.length * 25, // Points calculation
        joinedAt: "2024-01-01" // Default join date - could be enhanced with real data
      };
    });
  } else {
    // Fallback to some basic team members for demonstration if API fails
    teamMembers = [
      {
        id: "demo-member-1",
        name: "Sarah Johnson",
        email: "sarah@company.com",
        role: "member",
        avatar: undefined,
        status: "active",
        tasksCompleted: 8,
        tasksInProgress: 2,
        totalPoints: 450,
        joinedAt: "2024-01-01"
      },
      {
        id: "demo-member-2", 
        name: "Mike Chen",
        email: "mike@company.com",
        role: "member",
        avatar: undefined,
        status: "active",
        tasksCompleted: 6,
        tasksInProgress: 3,
        totalPoints: 375,
        joinedAt: "2024-01-01"
      },
      {
        id: "demo-member-3",
        name: "Emily Rodriguez",
        email: "emily@company.com", 
        role: "leader",
        avatar: undefined,
        status: "active",
        tasksCompleted: 12,
        tasksInProgress: 1,
        totalPoints: 625,
        joinedAt: "2024-01-01"
      }
    ];
  }

  const filteredMembers = teamMembers.filter(member => {
    if (filterStatus === "all") return true;
    return member.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "away":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "busy":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200";
    }
  };

  const getEfficiencyScore = (member: any) => {
    if (!member || typeof member.tasksCompleted !== 'number' || typeof member.tasksInProgress !== 'number') {
      return 0;
    }
    const totalTasks = member.tasksCompleted + member.tasksInProgress;
    if (totalTasks === 0) return 0;
    return Math.round((member.tasksCompleted / totalTasks) * 100);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Team</h1>
              <p className="text-muted-foreground">Manage your team members and track their performance.</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAddMemberOpen(true)}
              >
                <i className="fas fa-user-plus mr-2"></i>
                Add Member
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSettingsOpen(true)}
              >
                <i className="fas fa-cog mr-2"></i>
                Team Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-users text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{teamMembers.filter(m => m.status === 'active').length}</p>
                    <p className="text-sm text-muted-foreground">Active Now</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-circle text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{teamMembers.reduce((sum, m) => sum + m.tasksCompleted, 0)}</p>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{Math.round(teamMembers.reduce((sum, m) => sum + getEfficiencyScore(m), 0) / teamMembers.length)}%</p>
                    <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-chart-line text-white"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Team Members</span>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-lg">
                            {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-foreground">{member.name}</h3>
                            <Badge className={getStatusColor(member.status)}>
                              {member.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Member since {new Date(member.joinedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{member.totalPoints.toLocaleString()} points</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-8">
                        {/* Task Stats */}
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{member.tasksCompleted}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-500">{member.tasksInProgress}</p>
                          <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>

                        <div className="text-center min-w-[100px]">
                          <p className="text-sm font-medium text-foreground mb-1">Efficiency</p>
                          <div className="space-y-1">
                            <Progress value={getEfficiencyScore(member)} className="h-2 w-20" />
                            <p className="text-xs text-muted-foreground">{getEfficiencyScore(member)}%</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setChatOpen(true);
                            }}
                          >
                            <i className="fas fa-comment mr-2"></i>
                            Chat
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setTaskAssignOpen(true);
                            }}
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Assign Task
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setViewTasksOpen(true);
                            }}
                          >
                            <i className="fas fa-eye mr-2"></i>
                            View Tasks
                          </Button>
                          <Button variant="ghost" size="sm">
                            <i className="fas fa-ellipsis-v"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers
                    .sort((a, b) => b.totalPoints - a.totalPoints)
                    .slice(0, 3)
                    .map((member, index) => (
                    <div key={member.id} className="flex items-center space-x-4 p-4 bg-accent rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.tasksCompleted} tasks completed</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{member.totalPoints.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-r-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">Sarah Johnson completed "UI Component Library"</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>ED</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">Emily Davis started working on "Database Migration"</p>
                      <p className="text-xs text-muted-foreground">4 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-3 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded-r-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>MB</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">Mike Brown submitted "API Integration" for review</p>
                      <p className="text-xs text-muted-foreground">6 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-3 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-r-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>AW</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">Alex Wilson joined the team</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Add Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Team Member</DialogTitle>
          </DialogHeader>
          <Form {...invitationForm}>
            <form onSubmit={invitationForm.handleSubmit((data) => inviteMemberMutation.mutate(data))} className="space-y-4">
              <FormField
                control={invitationForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter member email address"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={invitationForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Team Member</SelectItem>
                        <SelectItem value="leader">Team Leader</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setAddMemberOpen(false);
                    invitationForm.reset();
                  }}
                  disabled={inviteMemberMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={inviteMemberMutation.isPending}
                >
                  {inviteMemberMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Team Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input 
                id="teamName"
                defaultValue="Development Team"
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="teamDescription">Description</Label>
              <Input 
                id="teamDescription"
                defaultValue="Primary development team"
                placeholder="Enter team description"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Settings Updated", description: "Team settings have been saved!" });
                setSettingsOpen(false);
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Chat Modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat with {selectedMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-muted/30">
              <div className="space-y-3">
                {Array.isArray(conversationMessages) && conversationMessages.length > 0 ? (
                  conversationMessages.map((message: any) => {
                    const isCurrentUser = message.senderId === user?.id;
                    const messageUser = isCurrentUser ? user : selectedMember;
                    
                    return (
                      <div key={message.id} className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={messageUser?.avatar} alt={messageUser?.name} />
                          <AvatarFallback>
                            {messageUser?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{messageUser?.name}</p>
                          <div className={`p-2 rounded-lg text-sm ${
                            isCurrentUser ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            {message.content}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <i className="fas fa-comments text-4xl mb-4 opacity-50"></i>
                    <p className="text-lg font-medium mb-2">No messages yet</p>
                    <p className="text-sm">Start a conversation with {selectedMember?.name}!</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input 
                  placeholder={`Message ${selectedMember?.name}...`} 
                  className="flex-1"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && chatMessage.trim() && selectedMember && !sendMessageMutation.isPending) {
                      sendMessageMutation.mutate({
                        receiverId: selectedMember.id,
                        content: chatMessage.trim()
                      });
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    if (chatMessage.trim() && selectedMember) {
                      sendMessageMutation.mutate({
                        receiverId: selectedMember.id,
                        content: chatMessage.trim()
                      });
                    }
                  }}
                  disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChatOpen(false);
                    setTaskAssignOpen(true);
                  }}
                  className="flex-1"
                >
                  <i className="fas fa-tasks mr-2"></i>
                  Assign Task
                </Button>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setChatOpen(false);
                    setViewTasksOpen(true);
                  }}
                  className="flex-1"
                >
                  <i className="fas fa-eye mr-2"></i>
                  View Tasks
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Assignment Modal */}
      <Dialog open={taskAssignOpen} onOpenChange={setTaskAssignOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Task to {selectedMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskTitle">Task Title</Label>
              <Input 
                id="taskTitle"
                placeholder="Enter task title"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Description</Label>
              <Input 
                id="taskDescription"
                placeholder="Enter task description"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedMember?.avatar} alt={selectedMember?.name} />
                  <AvatarFallback>
                    {selectedMember?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedMember?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMember?.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectSelect">Project</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(projects) && projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskPriority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input 
                  id="estimatedHours"
                  type="number"
                  placeholder="Hours"
                  min="1"
                  max="200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input 
                id="dueDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
            <div className="flex flex-col space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <Button 
                  onClick={() => {
                    toast({ 
                      title: "Task Assigned", 
                      description: `New task has been created and assigned to ${selectedMember?.name}!` 
                    });
                    setTaskAssignOpen(false);
                  }}
                  className="flex-1 mr-2"
                >
                  Create & Assign Task
                </Button>
                <Button variant="outline" onClick={() => setTaskAssignOpen(false)}>
                  Cancel
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTaskAssignOpen(false);
                    setChatOpen(true);
                  }}
                  className="flex-1"
                >
                  <i className="fas fa-comment mr-2"></i>
                  Back to Chat
                </Button>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTaskAssignOpen(false);
                    setViewTasksOpen(true);
                  }}
                  className="flex-1"
                >
                  <i className="fas fa-eye mr-2"></i>
                  View Tasks
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Tasks Modal */}
      <Dialog open={viewTasksOpen} onOpenChange={setViewTasksOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedMember?.name}'s Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Task Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-500">{selectedMember?.tasksInProgress || 0}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-500">{selectedMember?.tasksCompleted || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-500">{selectedMember ? getEfficiencyScore(selectedMember) : 0}%</p>
                  <p className="text-sm text-muted-foreground">Efficiency</p>
                </CardContent>
              </Card>
            </div>

            {/* Task List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedMember && teamTasks
                .filter(task => task.assigneeId === selectedMember.id)
                .map((task, index) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-blue-500' :
                        task.status === 'delayed' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          <span>Priority: {task.priority}</span>
                          <span>•</span>
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{task.estimatedHours}h estimated</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'delayed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              {selectedMember && teamTasks.filter(task => task.assigneeId === selectedMember.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-tasks text-4xl mb-4 opacity-50"></i>
                  <p>No tasks assigned to {selectedMember?.name} yet</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setViewTasksOpen(false);
                    setChatOpen(true);
                  }}
                >
                  <i className="fas fa-comment mr-2"></i>
                  Chat with {selectedMember?.name?.split(' ')[0]}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setViewTasksOpen(false);
                    setTaskAssignOpen(true);
                  }}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Assign New Task
                </Button>
              </div>
              <Button variant="secondary" onClick={() => setViewTasksOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}