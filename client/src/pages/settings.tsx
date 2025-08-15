import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    delayNotifications: true,
    weeklyReports: false,
    achievementUpdates: true,
  });

  const [preferences, setPreferences] = useState({
    theme: "system",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    language: "en",
  });

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    department: "",
    skills: [],
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

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/user/notifications", {
      method: "PATCH", 
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Notifications Updated", 
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notifications.",
        variant: "destructive",
      });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/user/preferences", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update preferences.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profile);
  };

  const handleSaveNotifications = () => {
    updateNotificationsMutation.mutate(notifications);
  };

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const handleChangePassword = () => {
    toast({
      title: "Password Change",
      description: "Password change functionality will be available soon.",
    });
  };

  const handleConnectIntegration = (service: string) => {
    toast({
      title: "Integration",
      description: `${service} integration will be available soon.`,
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Update your personal information and profile settings.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-lg">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Avatar Upload",
                              description: "Avatar change functionality will be available soon.",
                            });
                          }}
                        >
                          <i className="fas fa-camera mr-2"></i>
                          Change Avatar
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF. Max size 2MB.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={profile.email}
                          onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={profile.department}
                          onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="Engineering, Marketing, etc."
                        />
                      </div>
                    </div>

                    {/* Role Information */}
                    <div className="space-y-2">
                      <Label>Current Role</Label>
                      <div className="flex items-center space-x-2">
                        <Badge className="capitalize">{user.role}</Badge>
                        <p className="text-sm text-muted-foreground">
                          Contact your administrator to change your role.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                      >
                        <i className="fas fa-save mr-2"></i>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose how you want to be notified about project updates.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Email Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications for important updates.
                          </p>
                        </div>
                        <Switch
                          checked={notifications.emailAlerts}
                          onCheckedChange={(checked) =>
                            setNotifications(prev => ({ ...prev, emailAlerts: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Delay Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when tasks or projects are delayed.
                          </p>
                        </div>
                        <Switch
                          checked={notifications.delayNotifications}
                          onCheckedChange={(checked) =>
                            setNotifications(prev => ({ ...prev, delayNotifications: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Weekly Reports</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive weekly project summary reports.
                          </p>
                        </div>
                        <Switch
                          checked={notifications.weeklyReports}
                          onCheckedChange={(checked) =>
                            setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Achievement Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when you earn new achievements.
                          </p>
                        </div>
                        <Switch
                          checked={notifications.achievementUpdates}
                          onCheckedChange={(checked) =>
                            setNotifications(prev => ({ ...prev, achievementUpdates: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveNotifications}
                        disabled={updateNotificationsMutation.isPending}
                      >
                        <i className="fas fa-save mr-2"></i>
                        {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Preferences</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Customize your application experience.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select value={preferences.theme} onValueChange={(value) =>
                          setPreferences(prev => ({ ...prev, theme: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={preferences.timezone} onValueChange={(value) =>
                          setPreferences(prev => ({ ...prev, timezone: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="EST">Eastern Time</SelectItem>
                            <SelectItem value="PST">Pacific Time</SelectItem>
                            <SelectItem value="CST">Central Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Select value={preferences.dateFormat} onValueChange={(value) =>
                          setPreferences(prev => ({ ...prev, dateFormat: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select value={preferences.language} onValueChange={(value) =>
                          setPreferences(prev => ({ ...prev, language: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSavePreferences}
                        disabled={updatePreferencesMutation.isPending}
                      >
                        <i className="fas fa-save mr-2"></i>
                        {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage your password and security preferences.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="Enter your current password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Enter your new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your new password"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm text-foreground">Enable 2FA</p>
                          <p className="text-xs text-muted-foreground">
                            Add an extra layer of security to your account.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "2FA Setup",
                              description: "Two-factor authentication setup will be available soon.",
                            });
                          }}
                        >
                          <i className="fas fa-shield-alt mr-2"></i>
                          Setup 2FA
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleChangePassword}>
                        <i className="fas fa-key mr-2"></i>
                        Update Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Integrations</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Connect Smart Project Pulse with your favorite tools.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {[
                        { name: "Slack", icon: "fab fa-slack", description: "Get notifications in Slack channels", connected: false },
                        { name: "Microsoft Teams", icon: "fab fa-microsoft", description: "Sync with Teams meetings and chat", connected: true },
                        { name: "Google Calendar", icon: "fab fa-google", description: "Sync project deadlines with calendar", connected: false },
                        { name: "Jira", icon: "fab fa-atlassian", description: "Import and sync Jira issues", connected: false },
                        { name: "GitHub", icon: "fab fa-github", description: "Link commits to project tasks", connected: true },
                      ].map((integration) => (
                        <div key={integration.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <i className={`${integration.icon} text-lg text-muted-foreground`}></i>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{integration.name}</p>
                              <p className="text-sm text-muted-foreground">{integration.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {integration.connected && (
                              <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                Connected
                              </Badge>
                            )}
                            <Button 
                              variant={integration.connected ? "outline" : "default"} 
                              size="sm"
                              onClick={() => handleConnectIntegration(integration.name)}
                            >
                              {integration.connected ? "Disconnect" : "Connect"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}