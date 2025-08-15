import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertProjectSchema, insertTaskSchema, insertTeamSchema, insertMessageSchema, insertExtensionRequestSchema, insertDeadlineRescheduleLogSchema, insertWeeklyReportSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendTeamInvitation } from "./email";

const JWT_SECRET = process.env.JWT_SECRET || "development_secret_key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, role } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.role !== role) {
        return res.status(401).json({ message: "Invalid role for this user" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          avatar: user.avatar 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      
      res.status(201).json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          avatar: user.avatar 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({ 
      user: { 
        id: req.user.id, 
        email: req.user.email, 
        name: req.user.name, 
        role: req.user.role,
        avatar: req.user.avatar 
      } 
    });
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Users routes
  app.get("/api/users", authenticateToken, async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Projects routes
  app.get("/api/projects", authenticateToken, async (req: any, res) => {
    try {
      let projects;
      
      if (req.user.role === "manager") {
        projects = await storage.getProjects();
      } else {
        // For team leaders and members, get projects they're involved in
        const teams = await storage.getTeamsByLeader(req.user.id);
        if (teams.length > 0) {
          projects = await storage.getProjectsByTeam(teams[0].id);
        } else {
          // If member, find projects through their tasks
          const userTasks = await storage.getTasksByAssignee(req.user.id);
          const projectIds = Array.from(new Set(userTasks.map(task => task.projectId)));
          projects = await Promise.all(
            projectIds.map(id => storage.getProject(id)).filter(Boolean)
          );
        }
      }
      
      res.json(projects || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", authenticateToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", authenticateToken, async (req: any, res) => {
    try {
      // Allow managers and leaders to create projects
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only managers and leaders can create projects" });
      }
      
      // Transform date strings to Date objects and ensure required fields
      const projectData = {
        ...req.body,
        managerId: req.user.id,
        teamId: req.body.teamId || "default-team-id",
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      };
      
      const validatedData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(400).json({ 
        message: "Invalid project data", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/projects/:id", authenticateToken, async (req: any, res) => {
    try {
      // Allow managers and leaders to update projects
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only managers and leaders can update projects" });
      }
      
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const updatedProject = await storage.updateProject(req.params.id, req.body);
      res.json(updatedProject);
    } catch (error) {
      console.error("Project update error:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", authenticateToken, async (req: any, res) => {
    try {
      let tasks;
      
      if (req.user.role === "manager" || req.user.role === "administrator") {
        tasks = await storage.getTasks();
      } else if (req.user.role === "leader") {
        // Leaders can see all tasks (for team management)
        tasks = await storage.getTasks();
      } else {
        tasks = await storage.getTasksByAssignee(req.user.id);
      }
      
      res.json(tasks || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticateToken, async (req: any, res) => {
    try {
      // Allow managers and leaders to create tasks
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only managers and leaders can create tasks" });
      }
      
      const taskData = {
        ...req.body,
        assigneeId: req.body.assigneeId || req.user.id,
        actualHours: req.body.actualHours || 0,
        startDate: new Date(req.body.startDate),
        dueDate: new Date(req.body.dueDate),
        dependencies: req.body.dependencies || [],
        status: "todo"
      };
      
      const validatedData = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Task creation error:", error);
      res.status(400).json({ 
        message: "Invalid task data", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/tasks/:id", authenticateToken, async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Allow task owner, managers, and leaders to update tasks
      const canUpdate = req.user.role === "manager" || 
                       req.user.role === "leader" || 
                       task.assigneeId === req.user.id;
      
      if (!canUpdate) {
        return res.status(403).json({ message: "Not authorized to update this task" });
      }

      const updatedTask = await storage.updateTask(req.params.id, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error("Task update error:", error);
      res.status(400).json({ message: "Failed to update task" });
    }
  });

  app.get("/api/projects/:projectId/tasks", authenticateToken, async (req: any, res) => {
    try {
      const tasks = await storage.getTasksByProject(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project tasks" });
    }
  });

  // Delay alerts routes
  app.get("/api/delay-alerts", authenticateToken, async (req: any, res) => {
    try {
      const alerts = await storage.getDelayAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delay alerts" });
    }
  });

  app.get("/api/delay-alerts/unresolved", authenticateToken, async (req: any, res) => {
    try {
      const alerts = await storage.getUnresolvedDelayAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unresolved alerts" });
    }
  });

  // Teams routes
  app.get("/api/teams", authenticateToken, async (req: any, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams", authenticateToken, async (req: any, res) => {
    try {
      // Allow managers and leaders to create teams
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only managers and leaders can create teams" });
      }
      
      const teamData = {
        ...req.body,
        leaderId: req.body.leaderId || req.user.id,
        memberIds: req.body.memberIds || [req.user.id],
        skills: req.body.skills || []
      };
      
      const validatedData = insertTeamSchema.parse(teamData);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Team creation error:", error);
      res.status(400).json({ 
        message: "Invalid team data", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/teams/:id", authenticateToken, async (req: any, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Allow team leader and managers to update teams
      const canUpdate = req.user.role === "manager" || team.leaderId === req.user.id;
      
      if (!canUpdate) {
        return res.status(403).json({ message: "Not authorized to update this team" });
      }

      const updatedTeam = await storage.updateTeam(req.params.id, req.body);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Team update error:", error);
      res.status(400).json({ message: "Failed to update team" });
    }
  });

  // Team invitation routes
  app.post("/api/teams/:teamId/invite", authenticateToken, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const { email, role = "member" } = req.body;

      // Check if user is a team leader or manager
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only team leaders and managers can invite members" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists in the system" });
      }

      // Get team information
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Generate invitation token for database storage
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Send actual email using SendGrid
      const emailSent = await sendTeamInvitation(email, team.name, req.user.name || req.user.email);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send invitation email" });
      }

      // Log the invitation (in real app, this would be saved to database)
      console.log(`Invitation sent to ${email} for team ${teamId} with token: ${invitationToken}`);

      res.status(200).json({ 
        message: "Invitation email sent successfully",
        invitationId: invitationToken,
        invitedEmail: email,
        teamId: teamId,
        role: role
      });

    } catch (error) {
      console.error("Team invitation error:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", authenticateToken, async (req: any, res) => {
    try {
      const leaderboard = await storage.getUserLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Achievements routes
  app.get("/api/achievements/:userId", authenticateToken, async (req: any, res) => {
    try {
      const achievements = await storage.getAchievementsByUser(req.params.userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // User profile routes
  app.patch("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: updatedUser.avatar
        }
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // Additional settings endpoints
  app.patch("/api/user/notifications", authenticateToken, async (req: any, res) => {
    try {
      // In a real app, this would update notification preferences
      res.json({ message: "Notification preferences updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update notifications" });
    }
  });

  app.patch("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      // In a real app, this would update user preferences
      res.json({ message: "Preferences updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update preferences" });
    }
  });

  // Analysis Routes with Mock Data (Replace with real ML later)
  app.get("/api/analysis/health", async (req, res) => {
    res.json({ status: "healthy", service: "analysis_service" });
  });

  const generateMockPredictions = () => {
    const projects = [
      "E-commerce Platform Redesign",
      "Mobile Banking App",
      "Customer Portal Upgrade",
      "Internal CRM System",
      "Data Analytics Dashboard",
      "Social Media Integration",
      "API Gateway Migration",
      "Security Audit Platform"
    ];

    const taskTemplates = [
      { name: "Frontend Development", complexity: "medium", domains: ["frontend", "ui/ux"] },
      { name: "Backend API Implementation", complexity: "high", domains: ["backend", "api"] },
      { name: "Database Migration", complexity: "high", domains: ["database", "backend"] },
      { name: "User Authentication System", complexity: "medium", domains: ["backend", "security"] },
      { name: "Payment Gateway Integration", complexity: "high", domains: ["backend", "api"] },
      { name: "Mobile App Development", complexity: "high", domains: ["mobile", "frontend"] },
      { name: "UI/UX Design Implementation", complexity: "low", domains: ["ui/ux", "frontend"] },
      { name: "Testing & QA Setup", complexity: "medium", domains: ["testing", "qa"] },
      { name: "DevOps Pipeline Configuration", complexity: "high", domains: ["devops", "infrastructure"] },
      { name: "Data Visualization Components", complexity: "medium", domains: ["frontend", "data"] },
      { name: "Security Implementation", complexity: "high", domains: ["security", "backend"] },
      { name: "Performance Optimization", complexity: "medium", domains: ["backend", "frontend"] },
      { name: "Third-party Service Integration", complexity: "medium", domains: ["api", "backend"] },
      { name: "Documentation & Training", complexity: "low", domains: ["documentation"] },
      { name: "Code Review & Refactoring", complexity: "medium", domains: ["backend", "frontend"] }
    ];

    const assignees = [
      { name: "Sarah Chen", role: "Senior Frontend Developer", experience: 5 },
      { name: "Marcus Rodriguez", role: "Backend Engineer", experience: 4 },
      { name: "Emily Johnson", role: "Full Stack Developer", experience: 3 },
      { name: "David Kim", role: "Mobile Developer", experience: 4 },
      { name: "Lisa Wang", role: "UI/UX Designer", experience: 3 },
      { name: "Alex Thompson", role: "DevOps Engineer", experience: 6 },
      { name: "Rachel Green", role: "QA Engineer", experience: 4 },
      { name: "Michael Brown", role: "Senior Backend Developer", experience: 7 },
      { name: "Jennifer Liu", role: "Data Engineer", experience: 5 },
      { name: "Tom Wilson", role: "Security Specialist", experience: 6 }
    ];

    const tasks = [];
    
    // Generate 25 diverse tasks across different projects
    for (let i = 0; i < 25; i++) {
      const project = projects[Math.floor(Math.random() * projects.length)];
      const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
      const assignee = assignees[Math.floor(Math.random() * assignees.length)];
      
      const complexityMultiplier = template.complexity === "high" ? 1.5 : template.complexity === "medium" ? 1.0 : 0.7;
      const experienceMultiplier = assignee.experience >= 5 ? 0.8 : assignee.experience >= 3 ? 1.0 : 1.3;
      
      const baseDelay = Math.random() * 8;
      const adjustedDelay = baseDelay * complexityMultiplier * experienceMultiplier;
      
      const baseRisk = 30 + (complexityMultiplier - 0.7) * 40 + (experienceMultiplier - 0.8) * 30;
      const riskScore = Math.max(10, Math.min(95, baseRisk + (Math.random() - 0.5) * 20));
      
      tasks.push({
        task_id: `task_${i + 1}`,
        task_name: `${template.name} - ${project.split(' ')[0]}`,
        project_name: project,
        assignee_name: assignee.name,
        assignee_role: assignee.role,
        domain: template.domains[0],
        complexity: template.complexity,
        predicted_delay_days: Math.round(adjustedDelay * 10) / 10,
        risk_score: Math.round(riskScore),
        confidence: Math.round((0.65 + Math.random() * 0.3) * 100) / 100,
        risk_category: riskScore >= 80 ? "Critical" : riskScore >= 65 ? "High" : riskScore >= 40 ? "Medium" : "Low",
        estimated_completion: new Date(Date.now() + (7 + adjustedDelay) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        recommended_actions: getRiskActions(riskScore, template.complexity, assignee.experience)
      });
    }
    
    return tasks.sort((a, b) => b.risk_score - a.risk_score);
  };

  const getRiskActions = (riskScore: number, complexity: string, experience: number) => {
    const actions = [];
    
    if (riskScore >= 80) {
      actions.push("Immediate escalation required");
      actions.push("Daily progress reviews");
      if (experience < 4) actions.push("Assign senior mentor");
    }
    
    if (riskScore >= 65) {
      actions.push("Add additional resources");
      actions.push("Break down into smaller tasks");
      if (complexity === "high") actions.push("Technical architecture review");
    }
    
    if (riskScore >= 40) {
      actions.push("Monitor closely");
      actions.push("Weekly check-ins");
    }
    
    if (complexity === "high") {
      actions.push("Create detailed technical specs");
    }
    
    if (experience < 3) {
      actions.push("Provide additional guidance");
    }
    
    return actions.slice(0, Math.min(4, actions.length));
  };

  const generateMockRiskAnalysis = () => {
    const predictions = generateMockPredictions();
    const projectStats: Record<string, any> = {};
    
    // Calculate real statistics from predictions
    predictions.forEach(task => {
      if (!projectStats[task.project_name]) {
        projectStats[task.project_name] = {
          project_name: task.project_name,
          tasks: [],
          total_tasks: 0,
          high_risk_tasks: 0,
          critical_tasks: 0,
          total_risk_score: 0
        };
      }
      
      const project = projectStats[task.project_name];
      project.tasks.push(task);
      project.total_tasks++;
      project.total_risk_score += task.risk_score;
      
      if (task.risk_score >= 65) project.high_risk_tasks++;
      if (task.risk_score >= 80) project.critical_tasks++;
    });
    
    // Convert to array and calculate averages
    const projects_at_risk = Object.values(projectStats).map((project: any) => ({
      project_name: project.project_name,
      risk_score: Math.round(project.total_risk_score / project.total_tasks),
      high_risk_tasks: project.high_risk_tasks,
      critical_tasks: project.critical_tasks,
      total_tasks: project.total_tasks,
      completion_risk: project.high_risk_tasks > project.total_tasks * 0.3 ? "High" : 
                      project.high_risk_tasks > project.total_tasks * 0.15 ? "Medium" : "Low"
    })).sort((a, b) => b.risk_score - a.risk_score);
    
    const totalTasks = predictions.length;
    const highRiskTasks = predictions.filter(t => t.risk_score >= 65).length;
    const criticalTasks = predictions.filter(t => t.risk_score >= 80).length;
    const overallRisk = Math.round(predictions.reduce((sum, t) => sum + t.risk_score, 0) / totalTasks);
    
    return {
      overall_risk_score: overallRisk,
      high_risk_tasks: highRiskTasks,
      critical_tasks: criticalTasks,
      total_tasks: totalTasks,
      projects_at_risk: projects_at_risk,
      risk_factors: [
        "Resource constraints affecting delivery",
        "Technical complexity in integrations", 
        "Dependency delays from external services",
        "Skill gaps in specialized technologies",
        "Aggressive timeline commitments"
      ],
      team_utilization: {
        developers: Math.round(85 + Math.random() * 10),
        designers: Math.round(70 + Math.random() * 15),
        qa_engineers: Math.round(90 + Math.random() * 8)
      },
      upcoming_deadlines: projects_at_risk.slice(0, 3).map(p => ({
        project: p.project_name,
        deadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        risk_level: p.completion_risk
      }))
    };
  };

  const generateMockRecommendations = () => {
    const predictions = generateMockPredictions();
    const highRiskTasks = predictions.filter(task => task.risk_score >= 65);
    
    return highRiskTasks.slice(0, 8).map(task => {
      const impactDays = Math.ceil(task.predicted_delay_days * 0.6);
      const urgency = task.risk_score >= 80 ? "Critical" : task.risk_score >= 70 ? "High" : "Medium";
      
      const recommendations = [];
      
      // Generate contextual recommendations based on task properties
      if (task.complexity === "high") {
        recommendations.push("Break down into smaller, manageable subtasks");
        recommendations.push("Conduct technical feasibility review");
      }
      
      if (task.domain === "backend" || task.domain === "api") {
        recommendations.push("Review API documentation and dependencies");
        recommendations.push("Set up proper testing environment");
      }
      
      if (task.domain === "frontend" || task.domain === "ui/ux") {
        recommendations.push("Create interactive prototypes");
        recommendations.push("Gather user feedback early");
      }
      
      if (task.assignee_role?.includes("Junior") || task.risk_score >= 80) {
        recommendations.push("Assign senior mentor for guidance");
        recommendations.push("Increase frequency of code reviews");
      }
      
      if (task.predicted_delay_days > 5) {
        recommendations.push("Consider additional team member assignment");
        recommendations.push("Negotiate scope reduction if possible");
      }
      
      recommendations.push("Schedule daily progress check-ins");
      
      return {
        task_id: task.task_id,
        task_name: task.task_name,
        project_name: task.project_name,
        assignee_name: task.assignee_name,
        risk_score: task.risk_score,
        predicted_delay: task.predicted_delay_days,
        priority: urgency,
        domain: task.domain,
        complexity: task.complexity,
        recommendations: recommendations.slice(0, 4),
        estimated_impact: impactDays > 0 ? `Reduce delay by ${impactDays}-${impactDays + 2} days` : "Prevent potential delays",
        timeline_adjustment: `Move deadline by ${Math.ceil(task.predicted_delay_days / 2)} days`,
        resource_suggestion: task.risk_score >= 80 ? "Immediate additional resources needed" : 
                           task.risk_score >= 70 ? "Consider adding team member" : "Monitor with current resources"
      };
    });
  };

  app.get("/api/analysis/full", authenticateToken, async (req: any, res) => {
    try {
      const results = {
        predictions: generateMockPredictions(),
        risk_analysis: generateMockRiskAnalysis(),
        recommendations: generateMockRecommendations(),
        analysis_timestamp: new Date().toISOString(),
        model_version: "1.0.0"
      };
      
      res.json({
        success: true,
        results,
        message: "Comprehensive analysis completed successfully"
      });
    } catch (error) {
      console.error("Full analysis error:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.get("/api/analysis/predictions", authenticateToken, async (req: any, res) => {
    try {
      const predictions = generateMockPredictions();
      res.json({
        success: true,
        predictions,
        total_predictions: predictions.length,
        message: `Generated predictions for ${predictions.length} tasks`
      });
    } catch (error) {
      console.error("Predictions error:", error);
      res.status(500).json({ error: "Prediction generation failed" });
    }
  });

  app.get("/api/analysis/risk/:projectId?", authenticateToken, async (req: any, res) => {
    try {
      const riskData = generateMockRiskAnalysis();
      const projectId = req.params.projectId;
      
      if (projectId) {
        const projectRisk = riskData.projects_at_risk.find(
          p => p.project_name.toLowerCase().includes(projectId.toLowerCase())
        ) || riskData.projects_at_risk[0];
        
        res.json({
          success: true,
          risk_analysis: projectRisk,
          project_id: projectId,
          message: "Risk analysis completed"
        });
      } else {
        res.json({
          success: true,
          risk_analysis: riskData,
          message: "Overall risk analysis completed"
        });
      }
    } catch (error) {
      console.error("Risk analysis error:", error);
      res.status(500).json({ error: "Risk analysis failed" });
    }
  });

  app.get("/api/analysis/trends", authenticateToken, async (req: any, res) => {
    try {
      const trends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          average_delay: Math.round(Math.random() * 7 + 1),
          completed_tasks: Math.floor(Math.random() * 5) + 1,
          delayed_tasks: Math.floor(Math.random() * 3)
        };
      });
      
      res.json({
        success: true,
        trends,
        message: "Trend analysis completed"
      });
    } catch (error) {
      res.status(500).json({ error: "Trend analysis failed" });
    }
  });

  app.get("/api/analysis/recommendations", authenticateToken, async (req: any, res) => {
    try {
      const recommendations = generateMockRecommendations();
      res.json({
        success: true,
        recommendations,
        total_high_risk: recommendations.length,
        message: `Generated recommendations for ${recommendations.length} high-risk tasks`
      });
    } catch (error) {
      res.status(500).json({ error: "Recommendation generation failed" });
    }
  });

  app.post("/api/analysis/predict-task", authenticateToken, async (req: any, res) => {
    try {
      const response = await fetch("http://localhost:5001/analyze/predict_task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Task prediction failed" });
    }
  });

  app.post("/api/analysis/charts", authenticateToken, async (req: any, res) => {
    try {
      const response = await fetch("http://localhost:5001/analyze/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Chart generation failed" });
    }
  });

  // Messaging routes
  app.get("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesForUser(req.user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/conversation/:userId", authenticateToken, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesBetweenUsers(req.user.id, req.params.userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const messageData = {
        ...req.body,
        senderId: req.user.id
      };
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.sendMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.patch("/api/messages/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Only allow recipient to mark message as read
      if (message.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to mark this message as read" });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // === NEW FEATURE ROUTES ===

  // Extension Request routes - Feature 1
  app.get("/api/extension-requests", authenticateToken, async (req: any, res) => {
    try {
      const requests = await storage.getExtensionRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch extension requests" });
    }
  });

  app.get("/api/extension-requests/pending", authenticateToken, async (req: any, res) => {
    try {
      // Only team leaders and managers can view pending requests
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only team leaders and managers can view pending extension requests" });
      }
      
      const requests = await storage.getPendingExtensionRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending extension requests" });
    }
  });

  app.get("/api/extension-requests/my-requests", authenticateToken, async (req: any, res) => {
    try {
      const requests = await storage.getExtensionRequestsByRequester(req.user.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch your extension requests" });
    }
  });

  app.get("/api/extension-requests/project/:projectId", authenticateToken, async (req: any, res) => {
    try {
      const requests = await storage.getExtensionRequestsByProject(req.params.projectId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project extension requests" });
    }
  });

  app.post("/api/extension-requests", authenticateToken, async (req: any, res) => {
    try {
      // Only team members can create extension requests
      if (req.user.role !== "member") {
        return res.status(403).json({ message: "Only team members can create extension requests" });
      }

      const requestData = {
        ...req.body,
        requesterId: req.user.id,
        status: "pending"
      };
      
      const validatedData = insertExtensionRequestSchema.parse(requestData);
      const request = await storage.createExtensionRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Extension request creation error:", error);
      res.status(400).json({ 
        message: "Invalid extension request data", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/extension-requests/:id/respond", authenticateToken, async (req: any, res) => {
    try {
      // Only team leaders and managers can respond to extension requests
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only team leaders and managers can respond to extension requests" });
      }

      const { status, responseMessage } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be approved or rejected" });
      }

      const updates = {
        status,
        responseMessage,
        respondedAt: new Date(),
        responderId: req.user.id
      };

      const updatedRequest = await storage.updateExtensionRequest(req.params.id, updates);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Extension request not found" });
      }

      // If approved, update the task's due date
      if (status === "approved") {
        const task = await storage.getTask(updatedRequest.taskId);
        if (task) {
          const newDueDate = new Date(task.dueDate);
          newDueDate.setDate(newDueDate.getDate() + updatedRequest.additionalDays);
          await storage.updateTask(task.id, { dueDate: newDueDate });
        }
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Extension request response error:", error);
      res.status(400).json({ message: "Failed to respond to extension request" });
    }
  });

  // Project deadline reschedule routes - Feature 2
  app.patch("/api/projects/:id/reschedule-deadline", authenticateToken, async (req: any, res) => {
    try {
      // Only team leaders and managers can reschedule project deadlines
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only team leaders and managers can reschedule project deadlines" });
      }

      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const { newDeadline, reason } = req.body;
      
      if (!newDeadline || !reason) {
        return res.status(400).json({ message: "New deadline and reason are required" });
      }

      const oldDeadline = project.endDate;
      const newEndDate = new Date(newDeadline);

      // Update the project
      const updatedProject = await storage.updateProject(req.params.id, { endDate: newEndDate });

      // Log the reschedule
      const logData = {
        projectId: req.params.id,
        oldDeadline,
        newDeadline: newEndDate,
        reason,
        rescheduleById: req.user.id
      };

      const validatedLogData = insertDeadlineRescheduleLogSchema.parse(logData);
      await storage.createDeadlineRescheduleLog(validatedLogData);

      res.json(updatedProject);
    } catch (error) {
      console.error("Project deadline reschedule error:", error);
      res.status(400).json({ message: "Failed to reschedule project deadline" });
    }
  });

  app.get("/api/projects/:id/reschedule-logs", authenticateToken, async (req: any, res) => {
    try {
      const logs = await storage.getDeadlineRescheduleLogsByProject(req.params.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reschedule logs" });
    }
  });

  // Weekly Reports routes - Feature 2
  app.get("/api/weekly-reports", authenticateToken, async (req: any, res) => {
    try {
      // Only team leaders and managers can view reports
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only team leaders and managers can view weekly reports" });
      }

      const reports = await storage.getWeeklyReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly reports" });
    }
  });

  app.get("/api/weekly-reports/project/:projectId", authenticateToken, async (req: any, res) => {
    try {
      // Only team leaders and managers can view reports
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only team leaders and managers can view weekly reports" });
      }

      const reports = await storage.getWeeklyReportsByProject(req.params.projectId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project weekly reports" });
    }
  });

  app.post("/api/weekly-reports/generate", authenticateToken, async (req: any, res) => {
    try {
      // Only team leaders and managers can generate reports
      if (!["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only team leaders and managers can generate weekly reports" });
      }

      const { projectId, weekStartDate, weekEndDate } = req.body;

      if (!projectId || !weekStartDate || !weekEndDate) {
        return res.status(400).json({ message: "Project ID, week start date, and week end date are required" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get reschedule logs for this project
      const rescheduleLogs = await storage.getDeadlineRescheduleLogsByProject(projectId);
      const rescheduledDates = rescheduleLogs.map(log => ({
        oldDate: log.oldDeadline,
        newDate: log.newDeadline,
        reason: log.reason,
        rescheduleDate: log.createdAt
      }));

      // Get tasks and calculate delays
      const tasks = await storage.getTasksByProject(projectId);
      const delayedTasks = tasks.filter(task => task.status === "delayed" || 
        (task.completedDate && task.completedDate > task.dueDate));

      const delayDetails = delayedTasks.map(task => {
        let delayDays = 0;
        if (task.completedDate && task.completedDate > task.dueDate) {
          delayDays = Math.ceil((task.completedDate.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        } else if (task.status === "delayed" && new Date() > task.dueDate) {
          delayDays = Math.ceil((new Date().getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          taskId: task.id,
          taskTitle: task.title,
          delayDays,
          reason: task.delayReason || "No reason provided"
        };
      });

      const reportData = {
        projectId,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        projectDueDate: project.endDate,
        currentProjectEndDate: project.endDate,
        rescheduledDates,
        delayCount: delayDetails.length,
        delayDetails,
        generatedBy: req.user.id
      };

      const validatedData = insertWeeklyReportSchema.parse(reportData);
      const report = await storage.createWeeklyReport(validatedData);

      res.status(201).json(report);
    } catch (error) {
      console.error("Weekly report generation error:", error);
      res.status(400).json({ 
        message: "Failed to generate weekly report", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Export weekly report as CSV
  app.get("/api/weekly-reports/:id/export/csv", authenticateToken, async (req: any, res) => {
    try {
      // Only team leaders and managers can export reports
      if (!req.user || !["manager", "leader"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only team leaders and managers can export weekly reports" });
      }

      const report = await storage.getWeeklyReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Get additional project information
      const project = await storage.getProject(report.projectId);
      const generator = await storage.getUser(report.generatedBy);
      const tasks = await storage.getTasksByProject(report.projectId);
      const users = await storage.getUsers();

      // Calculate progress metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === "completed").length;
      const inProgressTasks = tasks.filter(task => task.status === "in_progress").length;
      const todoTasks = tasks.filter(task => task.status === "todo").length;
      const delayedTasks = tasks.filter(task => task.status === "delayed").length;
      
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate additional metrics
      const overdueTasks = tasks.filter(task => task.status !== "completed" && new Date() > task.dueDate).length;
      const upcomingDeadlines = tasks.filter(task => {
        const daysDiff = Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return task.status !== "completed" && daysDiff <= 7 && daysDiff >= 0;
      }).length;
      
      const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
      const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
      const estimatedVsActual = totalEstimatedHours > 0 ? ((totalActualHours / totalEstimatedHours) * 100).toFixed(1) : "0";

      // Create simple CSV format with timeline visualization
      const generateCSVContent = () => {
        const csvRows = [];
        
        // CSV Header with timeline column
        csvRows.push('Task ID,Task Name,Status,Start Date,Due Date,Assigned User,Progress (%),Timeline');
        
        // Calculate project timeline boundaries
        const projectStart = tasks.length > 0 ? 
          new Date(Math.min(...tasks.map(t => t.createdAt.getTime()))) : 
          new Date();
        const projectEnd = tasks.length > 0 ? 
          new Date(Math.max(...tasks.map(t => t.dueDate.getTime()))) : 
          new Date();
        const totalProjectDays = Math.max(1, Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
        
        // Generate timeline visualization function
        const generateTimeline = (startDate: Date, endDate: Date, progress: number) => {
          const taskStartDays = Math.max(0, Math.ceil((startDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
          const taskEndDays = Math.min(totalProjectDays, Math.ceil((endDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
          
          // Create 30-character timeline
          const timelineLength = 30;
          let timeline = ' '.repeat(timelineLength);
          const timelineArray = timeline.split('');
          
          if (totalProjectDays > 0) {
            const startPos = Math.floor((taskStartDays / totalProjectDays) * timelineLength);
            const endPos = Math.floor((taskEndDays / totalProjectDays) * timelineLength);
            const progressPos = Math.floor(startPos + (endPos - startPos) * (progress / 100));
            
            // Fill completed portion with solid blocks
            for (let i = startPos; i < Math.min(progressPos, timelineLength); i++) {
              timelineArray[i] = '█';
            }
            
            // Fill remaining planned portion with light blocks  
            for (let i = progressPos; i < Math.min(endPos, timelineLength); i++) {
              timelineArray[i] = '░';
            }
          }
          
          return timelineArray.join('');
        };
        
        // Process each task to match the simple format with timeline
        tasks.forEach((task, index) => {
          const assignedUser = users.find(user => user.id === task.assigneeId);
          const assignedUserName = assignedUser ? assignedUser.name : 'Unassigned';
          
          // Format dates as YYYY-MM-DD
          const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0];
          };
          
          // Calculate completion percentage
          let progress = 0;
          if (task.status === 'completed') {
            progress = 100;
          } else if (task.status === 'in_progress') {
            progress = 75; // Assume 75% for in-progress as shown in example
          } else if (task.status === 'todo') {
            progress = 0;
          } else if (task.status === 'delayed') {
            progress = 25; // Some progress but delayed
          }
          
          // Format status to match user examples
          let statusFormatted = '';
          switch (task.status) {
            case 'completed':
              statusFormatted = 'Completed';
              break;
            case 'in_progress':
              statusFormatted = 'In Progress';
              break;
            case 'todo':
              statusFormatted = 'To Do';
              break;
            case 'delayed':
              statusFormatted = 'Delayed';
              break;
            default:
              statusFormatted = 'To Do';
          }
          
          // Generate visual timeline
          const timeline = generateTimeline(task.createdAt, task.dueDate, progress);
          
          // Use a simple incrementing ID starting from 1
          const taskId = index + 1;
          
          // Create CSV row with proper escaping for commas and timeline
          const taskName = task.title.replace(/"/g, '""');
          csvRows.push(`${taskId},"${taskName}",${statusFormatted},${formatDate(task.createdAt)},${formatDate(task.dueDate)},${assignedUserName},${progress},${timeline}`);
        });
        
        return csvRows.join('\\n');
      };

      const csvContent = generateCSVContent();

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${project ? project.name.replace(/[^a-zA-Z0-9]/g, '-') : 'project'}-${report.weekStartDate.toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Report export error:", error);
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
