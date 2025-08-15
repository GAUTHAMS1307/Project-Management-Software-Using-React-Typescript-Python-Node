import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginRequest, type UserRole } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "manager"
    }
  });

  // Redirect if already logged in
  if (user) {
    setLocation(`/dashboard/${user.role}`);
    return null;
  }

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
      setLocation(`/dashboard/${data.role}`);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials or role mismatch.",
        variant: "destructive",
      });
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    form.setValue("role", role);
    
    // Set demo credentials based on role
    switch (role) {
      case "administrator":
        form.setValue("email", "admin@company.com");
        break;
      case "manager":
        form.setValue("email", "manager@company.com");
        break;
      case "leader":
        form.setValue("email", "leader1@company.com");
        break;
      case "member":
        form.setValue("email", "mike@company.com");
        break;
    }
    form.setValue("password", "password123");
  };

  const roles = [
    {
      value: "administrator" as UserRole,
      icon: "fas fa-shield-alt",
      iconColor: "text-purple-500",
      title: "Administrator",
      description: "System administration & user management"
    },
    {
      value: "manager" as UserRole,
      icon: "fas fa-crown",
      iconColor: "text-amber-500",
      title: "Manager",
      description: "Full analytics & controls"
    },
    {
      value: "leader" as UserRole,
      icon: "fas fa-users",
      iconColor: "text-green-500",
      title: "Team Leader",
      description: "Team progress & task controls"
    },
    {
      value: "member" as UserRole,
      icon: "fas fa-user",
      iconColor: "text-blue-500",
      title: "Team Member",
      description: "Tasks, progress & achievements"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <div className="max-w-md w-full">
        <Card className="shadow-2xl animate-fade-in">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl mb-4 mx-auto">
              <i className="fas fa-project-diagram text-2xl text-blue-600 dark:text-blue-400"></i>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Smart Project Pulse</h1>
            <p className="text-muted-foreground">Next-generation project management</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground text-center">Select Your Role</h2>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => (
                  <Button
                    key={role.value}
                    type="button"
                    variant={selectedRole === role.value ? "default" : "outline"}
                    className={`p-4 h-auto justify-start transition-all duration-200 group ${
                      selectedRole === role.value 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary hover:bg-primary/5"
                    }`}
                    onClick={() => handleRoleSelect(role.value)}
                  >
                    <div className="flex items-center w-full">
                      <i className={`${role.icon} ${role.iconColor} text-xl mr-3 group-hover:animate-bounce-gentle`}></i>
                      <div className="text-left">
                        <div className="font-semibold text-foreground">{role.title}</div>
                        <div className="text-sm text-muted-foreground">{role.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@company.com"
                  {...form.register("email")}
                  className="mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...form.register("password")}
                  className="mt-1"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary text-white font-semibold py-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                disabled={isLoading || !selectedRole}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="ghost" className="text-primary hover:underline text-sm">
                Forgot password?
              </Button>
            </div>

            {/* Demo Info */}
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Demo credentials are pre-filled when you select a role
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
