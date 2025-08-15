import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const managerNavItems = [
  { href: "/dashboard/manager", icon: "fas fa-tachometer-alt", label: "Dashboard" },
  { href: "/projects", icon: "fas fa-project-diagram", label: "Projects" },
  { href: "/analytics", icon: "fas fa-chart-line", label: "Analytics" },
  { href: "/predictions", icon: "fas fa-brain", label: "AI Predictions" },
  { href: "/teams", icon: "fas fa-users", label: "Teams" },
  { href: "/dependencies", icon: "fas fa-sitemap", label: "Dependencies" },
  { href: "/leaderboard", icon: "fas fa-trophy", label: "Leaderboard" },
  { href: "/settings", icon: "fas fa-cog", label: "Settings" },
];

const leaderNavItems = [
  { href: "/dashboard/leader", icon: "fas fa-tachometer-alt", label: "Dashboard" },
  { href: "/projects", icon: "fas fa-project-diagram", label: "Projects" },
  { href: "/tasks", icon: "fas fa-tasks", label: "Tasks" },
  { href: "/predictions", icon: "fas fa-brain", label: "AI Predictions" },
  { href: "/team", icon: "fas fa-users", label: "My Team" },
  { href: "/leaderboard", icon: "fas fa-trophy", label: "Leaderboard" },
];

const memberNavItems = [
  { href: "/dashboard/member", icon: "fas fa-tachometer-alt", label: "Dashboard" },
  { href: "/my-tasks", icon: "fas fa-tasks", label: "My Tasks" },
  { href: "/progress", icon: "fas fa-chart-bar", label: "Progress" },
  { href: "/achievements", icon: "fas fa-medal", label: "Achievements" },
  { href: "/leaderboard", icon: "fas fa-trophy", label: "Leaderboard" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  if (!user) return null;

  const navItems = user.role === "manager" ? managerNavItems :
                  user.role === "leader" ? leaderNavItems : memberNavItems;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <i className="fas fa-project-diagram text-white"></i>
          </div>
          <div>
            <h1 className="font-bold text-foreground">Project Pulse</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role} Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || 
                           (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}>
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground text-sm">{user.name}</p>
              <Badge variant="secondary" className="text-xs capitalize">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            className="w-full justify-start"
          >
            <i className={`${theme === "dark" ? "fas fa-sun" : "fas fa-moon"} mr-2`}></i>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
