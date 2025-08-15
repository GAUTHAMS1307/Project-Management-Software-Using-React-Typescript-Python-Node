import { 
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type Team,
  type InsertTeam,
  type Message,
  type InsertMessage,
  type DelayAlert,
  type InsertDelayAlert,
  type Achievement,
  type InsertAchievement,
  type Stats,
  type ExtensionRequest,
  type InsertExtensionRequest,
  type DeadlineRescheduleLog,
  type InsertDeadlineRescheduleLog,
  type WeeklyReport,
  type InsertWeeklyReport
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Project methods
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByManager(managerId: string): Promise<Project[]>;
  getProjectsByTeam(teamId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  
  // Task methods
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTasksByAssignee(assigneeId: string): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  
  // Team methods
  getTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  getTeamsByLeader(leaderId: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;
  
  // Message methods
  getMessages(): Promise<Message[]>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getMessagesForUser(userId: string): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<Message | undefined>;
  
  // Delay Alert methods
  getDelayAlerts(): Promise<DelayAlert[]>;
  getDelayAlert(id: string): Promise<DelayAlert | undefined>;
  getUnresolvedDelayAlerts(): Promise<DelayAlert[]>;
  createDelayAlert(alert: InsertDelayAlert): Promise<DelayAlert>;
  updateDelayAlert(id: string, updates: Partial<DelayAlert>): Promise<DelayAlert | undefined>;
  
  // Achievement methods
  getAchievements(): Promise<Achievement[]>;
  getAchievementsByUser(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Statistics methods
  getStats(): Promise<Stats>;
  getUserLeaderboard(): Promise<Array<{ user: User; points: number; achievements: Achievement[] }>>;
  
  // Extension Request methods - Feature 1
  getExtensionRequests(): Promise<ExtensionRequest[]>;
  getExtensionRequest(id: string): Promise<ExtensionRequest | undefined>;
  getExtensionRequestsByTask(taskId: string): Promise<ExtensionRequest[]>;
  getExtensionRequestsByRequester(requesterId: string): Promise<ExtensionRequest[]>;
  getExtensionRequestsByProject(projectId: string): Promise<ExtensionRequest[]>;
  getPendingExtensionRequests(): Promise<ExtensionRequest[]>;
  createExtensionRequest(request: InsertExtensionRequest): Promise<ExtensionRequest>;
  updateExtensionRequest(id: string, updates: Partial<ExtensionRequest>): Promise<ExtensionRequest | undefined>;
  
  // Deadline Reschedule Log methods - Feature 2
  getDeadlineRescheduleLogs(): Promise<DeadlineRescheduleLog[]>;
  getDeadlineRescheduleLog(id: string): Promise<DeadlineRescheduleLog | undefined>;
  getDeadlineRescheduleLogsByProject(projectId: string): Promise<DeadlineRescheduleLog[]>;
  createDeadlineRescheduleLog(log: InsertDeadlineRescheduleLog): Promise<DeadlineRescheduleLog>;
  
  // Weekly Report methods - Feature 2
  getWeeklyReports(): Promise<WeeklyReport[]>;
  getWeeklyReport(id: string): Promise<WeeklyReport | undefined>;
  getWeeklyReportsByProject(projectId: string): Promise<WeeklyReport[]>;
  createWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private tasks: Map<string, Task> = new Map();
  private teams: Map<string, Team> = new Map();
  private messages: Map<string, Message> = new Map();
  private delayAlerts: Map<string, DelayAlert> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private extensionRequests: Map<string, ExtensionRequest> = new Map();
  private deadlineRescheduleLogs: Map<string, DeadlineRescheduleLog> = new Map();
  private weeklyReports: Map<string, WeeklyReport> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create comprehensive demo users with hashed passwords
    const hashedPassword = bcrypt.hashSync("password123", 10);
    
    const administrator = this.createUserSync({
      email: "admin@company.com",
      password: hashedPassword,
      name: "System Administrator",
      role: "administrator",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });
    
    // Managers
    const manager1 = this.createUserSync({
      email: "manager@company.com",
      password: hashedPassword,
      name: "Alex Rodriguez",
      role: "manager",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    const manager2 = this.createUserSync({
      email: "manager2@company.com",
      password: hashedPassword,
      name: "Jennifer Kim",
      role: "manager",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    // Team Leaders
    const leader1 = this.createUserSync({
      email: "leader1@company.com", 
      password: hashedPassword,
      name: "Sarah Johnson",
      role: "leader",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    const leader2 = this.createUserSync({
      email: "leader2@company.com", 
      password: hashedPassword,
      name: "David Thompson",
      role: "leader",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    const leader3 = this.createUserSync({
      email: "leader3@company.com", 
      password: hashedPassword,
      name: "Lisa Wang",
      role: "leader",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    // Team Members - Frontend Specialists
    const member1 = this.createUserSync({
      email: "mike@company.com",
      password: hashedPassword, 
      name: "Mike Chen",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    const member2 = this.createUserSync({
      email: "emma@company.com",
      password: hashedPassword,
      name: "Emma Davis", 
      role: "member",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    // Backend Specialists
    const member3 = this.createUserSync({
      email: "james@company.com",
      password: hashedPassword,
      name: "James Wilson",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    const member4 = this.createUserSync({
      email: "sofia@company.com",
      password: hashedPassword,
      name: "Sofia Martinez",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    // Mobile Specialists
    const member5 = this.createUserSync({
      email: "ryan@company.com",
      password: hashedPassword,
      name: "Ryan O'Connor",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    const member6 = this.createUserSync({
      email: "anna@company.com",
      password: hashedPassword,
      name: "Anna Petrov",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    // DevOps & Database Specialists
    const member7 = this.createUserSync({
      email: "carlos@company.com",
      password: hashedPassword,
      name: "Carlos Silva",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    const member8 = this.createUserSync({
      email: "priya@company.com",
      password: hashedPassword,
      name: "Priya Sharma",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    // UI/UX Specialists
    const member9 = this.createUserSync({
      email: "noah@company.com",
      password: hashedPassword,
      name: "Noah Kim",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    const member10 = this.createUserSync({
      email: "zoe@company.com",
      password: hashedPassword,
      name: "Zoe Anderson",
      role: "member",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
    });

    // Create diverse teams with specialized skills
    const frontendTeam = this.createTeamSync({
      name: "Frontend Excellence Team",
      description: "Specializes in user interfaces and web experiences",
      leaderId: leader1.id,
      memberIds: [member1.id, member2.id, member9.id],
      skills: ["React", "Vue.js", "TypeScript", "UI/UX", "Testing", "Responsive Design", "WebGL"]
    });

    const backendTeam = this.createTeamSync({
      name: "Backend Infrastructure Team",
      description: "Server-side development and API management",
      leaderId: leader2.id,
      memberIds: [member3.id, member4.id, member7.id],
      skills: ["Node.js", "Python", "PostgreSQL", "MongoDB", "Redis", "Microservices", "API Design"]
    });

    const mobileTeam = this.createTeamSync({
      name: "Mobile Innovation Team",
      description: "Native and cross-platform mobile applications",
      leaderId: leader3.id,
      memberIds: [member5.id, member6.id, member8.id],
      skills: ["React Native", "Flutter", "iOS", "Android", "Mobile UI", "Performance Optimization"]
    });

    const designTeam = this.createTeamSync({
      name: "Design & UX Team",
      description: "User experience and visual design specialists",
      leaderId: leader1.id,
      memberIds: [member9.id, member10.id],
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research", "Interaction Design", "Design Systems"]
    });

    // Create diverse projects with realistic timelines and complexity
    const project1 = this.createProjectSync({
      name: "E-commerce Platform Redesign",
      description: "Complete overhaul of the customer-facing e-commerce platform with modern UI/UX",
      status: "in_progress",
      progress: 78,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-03-30"),
      teamId: frontendTeam.id,
      managerId: manager1.id,
      domains: ["frontend", "ui/ux", "testing", "api"]
    });

    const project2 = this.createProjectSync({
      name: "Mobile App Development", 
      description: "Native mobile app for iOS and Android with real-time features",
      status: "delayed",
      progress: 45,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-05-15"),
      teamId: mobileTeam.id,
      managerId: manager1.id,
      domains: ["mobile", "backend", "testing", "devops"]
    });

    const project3 = this.createProjectSync({
      name: "Legacy Data Migration",
      description: "Migration of 10+ years of legacy data to new microservices architecture",
      status: "delayed", 
      progress: 23,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-02-28"),
      teamId: backendTeam.id,
      managerId: manager2.id,
      domains: ["database", "backend", "devops"]
    });

    const project4 = this.createProjectSync({
      name: "Microservices Architecture",
      description: "Breaking down monolith into scalable microservices",
      status: "in_progress",
      progress: 67,
      startDate: new Date("2024-02-15"),
      endDate: new Date("2024-06-30"),
      teamId: backendTeam.id,
      managerId: manager2.id,
      domains: ["backend", "devops", "api", "database"]
    });

    const project5 = this.createProjectSync({
      name: "Design System Implementation",
      description: "Company-wide design system and component library",
      status: "completed",
      progress: 100,
      startDate: new Date("2023-11-01"),
      endDate: new Date("2024-01-15"),
      teamId: designTeam.id,
      managerId: manager1.id,
      domains: ["ui/ux", "frontend", "testing"]
    });

    const project6 = this.createProjectSync({
      name: "AI-Powered Analytics Dashboard",
      description: "Advanced analytics dashboard with machine learning insights",
      status: "planning",
      progress: 15,
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-07-31"),
      teamId: frontendTeam.id,
      managerId: manager2.id,
      domains: ["frontend", "backend", "api", "ui/ux"]
    });

    const project7 = this.createProjectSync({
      name: "Performance Optimization",
      description: "System-wide performance improvements and caching implementation",
      status: "in_progress",
      progress: 34,
      startDate: new Date("2024-02-20"),
      endDate: new Date("2024-04-15"),
      teamId: backendTeam.id,
      managerId: manager1.id,
      domains: ["backend", "devops", "database"]
    });

    const project8 = this.createProjectSync({
      name: "Security Audit & Compliance",
      description: "Comprehensive security review and GDPR compliance implementation",
      status: "delayed",
      progress: 56,
      startDate: new Date("2024-01-20"),
      endDate: new Date("2024-03-20"),
      teamId: backendTeam.id,
      managerId: manager2.id,
      domains: ["backend", "devops", "testing"]
    });

    // Additional comprehensive projects for fuller portfolio
    const project9 = this.createProjectSync({
      name: "Cross-Platform Mobile SDK",
      description: "Unified SDK for third-party developers to integrate with our platform",
      status: "in_progress",
      progress: 82,
      startDate: new Date("2023-12-01"),
      endDate: new Date("2024-03-15"),
      teamId: mobileTeam.id,
      managerId: manager1.id,
      domains: ["mobile", "api", "documentation", "testing"]
    });

    const project10 = this.createProjectSync({
      name: "Real-time Collaboration Platform",
      description: "Multi-user collaborative workspace with real-time synchronization",
      status: "in_progress",
      progress: 91,
      startDate: new Date("2024-01-10"),
      endDate: new Date("2024-02-29"),
      teamId: frontendTeam.id,
      managerId: manager2.id,
      domains: ["frontend", "backend", "websockets", "ui/ux"]
    });

    const project11 = this.createProjectSync({
      name: "Enterprise Integration Suite",
      description: "B2B integration platform for enterprise clients with SAP, Salesforce connectivity",
      status: "planning",
      progress: 8,
      startDate: new Date("2024-03-15"),
      endDate: new Date("2024-08-30"),
      teamId: backendTeam.id,
      managerId: manager1.id,
      domains: ["backend", "api", "database", "integration"]
    });

    const project12 = this.createProjectSync({
      name: "Customer Support Portal",
      description: "Self-service customer portal with AI-powered chat support and ticketing",
      status: "completed",
      progress: 100,
      startDate: new Date("2023-10-15"),
      endDate: new Date("2024-01-31"),
      teamId: frontendTeam.id,
      managerId: manager2.id,
      domains: ["frontend", "ui/ux", "api", "ai"]
    });

    const project13 = this.createProjectSync({
      name: "Data Analytics Engine",
      description: "Big data processing engine with real-time analytics and machine learning pipelines",
      status: "delayed",
      progress: 38,
      startDate: new Date("2024-01-05"),
      endDate: new Date("2024-04-30"),
      teamId: backendTeam.id,
      managerId: manager1.id,
      domains: ["backend", "database", "ml", "devops"]
    });

    const project14 = this.createProjectSync({
      name: "Multi-tenant SaaS Architecture",
      description: "Scalable multi-tenant architecture supporting thousands of organizations",
      status: "in_progress",
      progress: 73,
      startDate: new Date("2023-11-20"),
      endDate: new Date("2024-03-10"),
      teamId: backendTeam.id,
      managerId: manager2.id,
      domains: ["backend", "database", "devops", "security"]
    });

    const project15 = this.createProjectSync({
      name: "Accessibility Compliance Upgrade",
      description: "WCAG 2.1 AA compliance across all user-facing applications",
      status: "in_progress",
      progress: 65,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-04-15"),
      teamId: designTeam.id,
      managerId: manager1.id,
      domains: ["ui/ux", "frontend", "testing", "compliance"]
    });

    const project16 = this.createProjectSync({
      name: "Global Content Delivery Network",
      description: "Multi-region CDN implementation for improved global performance",
      status: "planning",
      progress: 12,
      startDate: new Date("2024-04-01"),
      endDate: new Date("2024-07-15"),
      teamId: backendTeam.id,
      managerId: manager2.id,
      domains: ["devops", "infrastructure", "performance", "networking"]
    });

    const project17 = this.createProjectSync({
      name: "Advanced Payment Gateway",
      description: "Multi-currency payment processing with fraud detection and crypto support",
      status: "delayed",
      progress: 29,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-03-31"),
      teamId: backendTeam.id,
      managerId: manager1.id,
      domains: ["backend", "security", "api", "compliance"]
    });

    const project18 = this.createProjectSync({
      name: "Voice User Interface Platform",
      description: "Voice-controlled interface integration with Alexa, Google Assistant, and custom solutions",
      status: "planning",
      progress: 5,
      startDate: new Date("2024-05-01"),
      endDate: new Date("2024-09-30"),
      teamId: mobileTeam.id,
      managerId: manager2.id,
      domains: ["mobile", "ai", "voice", "integration"]
    });

    // Create comprehensive tasks with realistic patterns for ML analysis
    
    // PROJECT 1: E-commerce Platform Redesign Tasks
    const task1 = this.createTaskSync({
      title: "Component Library Architecture",
      description: "Design and implement reusable component library with TypeScript",
      status: "completed",
      priority: "high",
      assigneeId: member1.id,
      projectId: project1.id,
      domain: "frontend",
      estimatedHours: 40,
      actualHours: 38,
      startDate: new Date("2024-01-20"),
      dueDate: new Date("2024-02-05"),
      completedDate: new Date("2024-02-03"),
      dependencies: []
    });

    const task2 = this.createTaskSync({
      title: "User Dashboard Redesign",
      description: "Complete redesign of main customer dashboard with improved UX",
      status: "completed",
      priority: "high",
      assigneeId: member2.id,
      projectId: project1.id,
      domain: "ui/ux",
      estimatedHours: 35,
      actualHours: 32,
      startDate: new Date("2024-01-25"),
      dueDate: new Date("2024-02-15"),
      completedDate: new Date("2024-02-12"),
      dependencies: [task1.id]
    });

    const task3 = this.createTaskSync({
      title: "Shopping Cart API Integration",
      description: "Integrate new payment gateway and cart functionality",
      status: "in_progress",
      priority: "critical",
      assigneeId: member3.id,
      projectId: project1.id,
      domain: "api",
      estimatedHours: 50,
      actualHours: 35,
      startDate: new Date("2024-02-10"),
      dueDate: new Date("2024-03-05"),
      dependencies: [task1.id]
    });

    const task4 = this.createTaskSync({
      title: "Mobile Responsive Testing",
      description: "Comprehensive testing across all mobile devices and browsers",
      status: "todo",
      priority: "medium",
      assigneeId: member9.id,
      projectId: project1.id,
      domain: "testing",
      estimatedHours: 25,
      actualHours: 0,
      startDate: new Date("2024-03-01"),
      dueDate: new Date("2024-03-15"),
      dependencies: [task2.id, task3.id]
    });

    // PROJECT 2: Mobile App Development Tasks
    const task5 = this.createTaskSync({
      title: "React Native Setup & Architecture",
      description: "Initial project setup and navigation architecture",
      status: "completed",
      priority: "critical",
      assigneeId: member5.id,
      projectId: project2.id,
      domain: "mobile",
      estimatedHours: 30,
      actualHours: 28,
      startDate: new Date("2024-02-05"),
      dueDate: new Date("2024-02-20"),
      completedDate: new Date("2024-02-18"),
      dependencies: []
    });

    const task6 = this.createTaskSync({
      title: "Real-time Chat Implementation",
      description: "WebSocket-based real-time messaging with offline support",
      status: "delayed",
      priority: "high",
      assigneeId: member6.id,
      projectId: project2.id,
      domain: "mobile",
      estimatedHours: 60,
      actualHours: 45,
      startDate: new Date("2024-02-20"),
      dueDate: new Date("2024-03-20"),
      dependencies: [task5.id],
      delayReason: "WebSocket implementation more complex than estimated, requires additional offline sync logic"
    });

    const task7 = this.createTaskSync({
      title: "Push Notification System",
      description: "Cross-platform push notifications with FCM and APNs",
      status: "in_progress",
      priority: "medium",
      assigneeId: member8.id,
      projectId: project2.id,
      domain: "backend",
      estimatedHours: 35,
      actualHours: 20,
      startDate: new Date("2024-03-01"),
      dueDate: new Date("2024-03-25"),
      dependencies: [task5.id]
    });

    // PROJECT 3: Legacy Data Migration Tasks
    const task8 = this.createTaskSync({
      title: "Data Schema Analysis",
      description: "Analyze existing legacy database schemas and relationships",
      status: "completed",
      priority: "critical",
      assigneeId: member4.id,
      projectId: project3.id,
      domain: "database",
      estimatedHours: 45,
      actualHours: 52,
      startDate: new Date("2024-01-05"),
      dueDate: new Date("2024-01-25"),
      completedDate: new Date("2024-01-28"),
      dependencies: []
    });

    const task9 = this.createTaskSync({
      title: "Migration Scripts Development",
      description: "Create automated migration scripts with data validation",
      status: "delayed",
      priority: "critical",
      assigneeId: member3.id,
      projectId: project3.id,
      domain: "backend",
      estimatedHours: 80,
      actualHours: 65,
      startDate: new Date("2024-01-25"),
      dueDate: new Date("2024-02-20"),
      dependencies: [task8.id],
      delayReason: "Data inconsistencies in legacy system require additional validation and cleanup logic"
    });

    const task10 = this.createTaskSync({
      title: "Performance Testing & Optimization",
      description: "Load testing migration process and performance optimization",
      status: "todo",
      priority: "high",
      assigneeId: member7.id,
      projectId: project3.id,
      domain: "devops",
      estimatedHours: 40,
      actualHours: 0,
      startDate: new Date("2024-02-25"),
      dueDate: new Date("2024-03-15"),
      dependencies: [task9.id]
    });

    // PROJECT 4: Microservices Architecture Tasks
    const task11 = this.createTaskSync({
      title: "Service Decomposition Strategy",
      description: "Define microservice boundaries and domain separation",
      status: "completed",
      priority: "critical",
      assigneeId: leader2.id,
      projectId: project4.id,
      domain: "backend",
      estimatedHours: 25,
      actualHours: 30,
      startDate: new Date("2024-02-15"),
      dueDate: new Date("2024-03-01"),
      completedDate: new Date("2024-03-03"),
      dependencies: []
    });

    const task12 = this.createTaskSync({
      title: "API Gateway Implementation",
      description: "Implement centralized API gateway with authentication and routing",
      status: "in_progress",
      priority: "high",
      assigneeId: member3.id,
      projectId: project4.id,
      domain: "api",
      estimatedHours: 55,
      actualHours: 32,
      startDate: new Date("2024-03-05"),
      dueDate: new Date("2024-04-10"),
      dependencies: [task11.id]
    });

    const task13 = this.createTaskSync({
      title: "Container Orchestration Setup",
      description: "Docker containerization and Kubernetes deployment configuration",
      status: "todo",
      priority: "medium",
      assigneeId: member7.id,
      projectId: project4.id,
      domain: "devops",
      estimatedHours: 70,
      actualHours: 0,
      startDate: new Date("2024-04-01"),
      dueDate: new Date("2024-05-15"),
      dependencies: [task12.id]
    });

    // PROJECT 5: Design System Implementation Tasks (Completed Project)
    const task14 = this.createTaskSync({
      title: "Design Token System",
      description: "Create comprehensive design token system for colors, typography, spacing",
      status: "completed",
      priority: "high",
      assigneeId: member9.id,
      projectId: project5.id,
      domain: "ui/ux",
      estimatedHours: 30,
      actualHours: 28,
      startDate: new Date("2023-11-05"),
      dueDate: new Date("2023-11-25"),
      completedDate: new Date("2023-11-23"),
      dependencies: []
    });

    const task15 = this.createTaskSync({
      title: "Component Library Development",
      description: "Build comprehensive React component library with Storybook",
      status: "completed",
      priority: "high",
      assigneeId: member1.id,
      projectId: project5.id,
      domain: "frontend",
      estimatedHours: 60,
      actualHours: 58,
      startDate: new Date("2023-11-25"),
      dueDate: new Date("2023-12-30"),
      completedDate: new Date("2023-12-28"),
      dependencies: [task14.id]
    });

    // PROJECT 6: AI-Powered Analytics Dashboard Tasks
    const task16 = this.createTaskSync({
      title: "Data Pipeline Architecture",
      description: "Design real-time data processing pipeline for analytics",
      status: "in_progress",
      priority: "high",
      assigneeId: member4.id,
      projectId: project6.id,
      domain: "backend",
      estimatedHours: 45,
      actualHours: 12,
      startDate: new Date("2024-03-05"),
      dueDate: new Date("2024-04-01"),
      dependencies: []
    });

    const task17 = this.createTaskSync({
      title: "Machine Learning Model Integration",
      description: "Integrate predictive models into analytics dashboard",
      status: "todo",
      priority: "medium",
      assigneeId: member8.id,
      projectId: project6.id,
      domain: "api",
      estimatedHours: 80,
      actualHours: 0,
      startDate: new Date("2024-04-15"),
      dueDate: new Date("2024-06-30"),
      dependencies: [task16.id]
    });

    // PROJECT 7: Performance Optimization Tasks
    const task18 = this.createTaskSync({
      title: "Database Query Optimization",
      description: "Optimize slow queries and implement proper indexing",
      status: "in_progress",
      priority: "high",
      assigneeId: member4.id,
      projectId: project7.id,
      domain: "database",
      estimatedHours: 35,
      actualHours: 28,
      startDate: new Date("2024-02-25"),
      dueDate: new Date("2024-03-20"),
      dependencies: []
    });

    const task19 = this.createTaskSync({
      title: "Redis Caching Implementation",
      description: "Implement distributed caching with Redis for improved performance",
      status: "todo",
      priority: "medium",
      assigneeId: member7.id,
      projectId: project7.id,
      domain: "devops",
      estimatedHours: 40,
      actualHours: 0,
      startDate: new Date("2024-03-15"),
      dueDate: new Date("2024-04-05"),
      dependencies: [task18.id]
    });

    // PROJECT 8: Security Audit & Compliance Tasks
    const task20 = this.createTaskSync({
      title: "Security Vulnerability Assessment",
      description: "Comprehensive security audit and penetration testing",
      status: "completed",
      priority: "critical",
      assigneeId: member3.id,
      projectId: project8.id,
      domain: "backend",
      estimatedHours: 50,
      actualHours: 55,
      startDate: new Date("2024-01-25"),
      dueDate: new Date("2024-02-20"),
      completedDate: new Date("2024-02-22"),
      dependencies: []
    });

    const task21 = this.createTaskSync({
      title: "GDPR Compliance Implementation",
      description: "Implement data protection measures and user consent management",
      status: "delayed",
      priority: "critical",
      assigneeId: member4.id,
      projectId: project8.id,
      domain: "backend",
      estimatedHours: 65,
      actualHours: 45,
      startDate: new Date("2024-02-20"),
      dueDate: new Date("2024-03-15"),
      dependencies: [task20.id],
      delayReason: "Legal requirements more complex than anticipated, requiring additional consultation and documentation"
    });

    const task22 = this.createTaskSync({
      title: "Security Testing Automation",
      description: "Set up automated security testing in CI/CD pipeline",
      status: "todo",
      priority: "medium",
      assigneeId: member7.id,
      projectId: project8.id,
      domain: "testing",
      estimatedHours: 30,
      actualHours: 0,
      startDate: new Date("2024-03-10"),
      dueDate: new Date("2024-03-25"),
      dependencies: [task21.id]
    });

    // PROJECT 9: Cross-Platform Mobile SDK Tasks
    const task23 = this.createTaskSync({
      title: "SDK Core Architecture Design",
      description: "Design unified SDK architecture supporting iOS, Android, and React Native",
      status: "completed",
      priority: "critical",
      assigneeId: member5.id,
      projectId: project9.id,
      domain: "mobile",
      estimatedHours: 45,
      actualHours: 42,
      startDate: new Date("2023-12-05"),
      dueDate: new Date("2023-12-20"),
      completedDate: new Date("2023-12-18"),
      dependencies: []
    });

    const task24 = this.createTaskSync({
      title: "iOS SDK Implementation",
      description: "Native iOS SDK with Swift implementation and CocoaPods distribution",
      status: "completed",
      priority: "high",
      assigneeId: member6.id,
      projectId: project9.id,
      domain: "mobile",
      estimatedHours: 60,
      actualHours: 58,
      startDate: new Date("2023-12-20"),
      dueDate: new Date("2024-02-15"),
      completedDate: new Date("2024-02-12"),
      dependencies: [task23.id]
    });

    const task25 = this.createTaskSync({
      title: "Android SDK Implementation",
      description: "Native Android SDK with Kotlin and Gradle distribution setup",
      status: "in_progress",
      priority: "high",
      assigneeId: member8.id,
      projectId: project9.id,
      domain: "mobile",
      estimatedHours: 60,
      actualHours: 48,
      startDate: new Date("2023-12-25"),
      dueDate: new Date("2024-03-10"),
      dependencies: [task23.id]
    });

    const task26 = this.createTaskSync({
      title: "SDK Documentation Portal",
      description: "Interactive documentation with code examples and integration guides",
      status: "todo",
      priority: "medium",
      assigneeId: member10.id,
      projectId: project9.id,
      domain: "documentation",
      estimatedHours: 35,
      actualHours: 0,
      startDate: new Date("2024-02-20"),
      dueDate: new Date("2024-03-12"),
      dependencies: [task24.id, task25.id]
    });

    // PROJECT 10: Real-time Collaboration Platform Tasks
    const task27 = this.createTaskSync({
      title: "WebSocket Infrastructure Setup",
      description: "Multi-room WebSocket server with horizontal scaling support",
      status: "completed",
      priority: "critical",
      assigneeId: member3.id,
      projectId: project10.id,
      domain: "backend",
      estimatedHours: 40,
      actualHours: 36,
      startDate: new Date("2024-01-12"),
      dueDate: new Date("2024-01-30"),
      completedDate: new Date("2024-01-28"),
      dependencies: []
    });

    const task28 = this.createTaskSync({
      title: "Collaborative Editor Interface",
      description: "Real-time collaborative text editor with conflict resolution",
      status: "completed",
      priority: "critical",
      assigneeId: member1.id,
      projectId: project10.id,
      domain: "frontend",
      estimatedHours: 55,
      actualHours: 52,
      startDate: new Date("2024-01-20"),
      dueDate: new Date("2024-02-20"),
      completedDate: new Date("2024-02-18"),
      dependencies: [task27.id]
    });

    const task29 = this.createTaskSync({
      title: "User Presence System",
      description: "Real-time user presence indicators and activity tracking",
      status: "in_progress",
      priority: "high",
      assigneeId: member2.id,
      projectId: project10.id,
      domain: "frontend",
      estimatedHours: 25,
      actualHours: 20,
      startDate: new Date("2024-02-15"),
      dueDate: new Date("2024-02-28"),
      dependencies: [task27.id]
    });

    // PROJECT 11: Enterprise Integration Suite Tasks
    const task30 = this.createTaskSync({
      title: "API Gateway Architecture",
      description: "Design scalable API gateway for enterprise integrations",
      status: "todo",
      priority: "critical",
      assigneeId: member3.id,
      projectId: project11.id,
      domain: "backend",
      estimatedHours: 50,
      actualHours: 0,
      startDate: new Date("2024-03-20"),
      dueDate: new Date("2024-04-15"),
      dependencies: []
    });

    const task31 = this.createTaskSync({
      title: "SAP Integration Module",
      description: "B2B integration with SAP ERP systems using RFC and IDoc protocols",
      status: "todo",
      priority: "high",
      assigneeId: member4.id,
      projectId: project11.id,
      domain: "integration",
      estimatedHours: 80,
      actualHours: 0,
      startDate: new Date("2024-04-15"),
      dueDate: new Date("2024-06-30"),
      dependencies: [task30.id]
    });

    // PROJECT 12: Customer Support Portal Tasks (Completed Project)
    const task32 = this.createTaskSync({
      title: "Support Ticket System",
      description: "Complete ticketing system with priority classification and routing",
      status: "completed",
      priority: "critical",
      assigneeId: member1.id,
      projectId: project12.id,
      domain: "frontend",
      estimatedHours: 65,
      actualHours: 62,
      startDate: new Date("2023-10-20"),
      dueDate: new Date("2023-12-15"),
      completedDate: new Date("2023-12-12"),
      dependencies: []
    });

    const task33 = this.createTaskSync({
      title: "AI Chatbot Integration",
      description: "Natural language processing chatbot for first-line customer support",
      status: "completed",
      priority: "high",
      assigneeId: member4.id,
      projectId: project12.id,
      domain: "ai",
      estimatedHours: 45,
      actualHours: 48,
      startDate: new Date("2023-11-01"),
      dueDate: new Date("2024-01-10"),
      completedDate: new Date("2024-01-08"),
      dependencies: [task32.id]
    });

    // PROJECT 13: Data Analytics Engine Tasks (Delayed Project)
    const task34 = this.createTaskSync({
      title: "Data Pipeline Architecture",
      description: "Design streaming data pipeline with Apache Kafka and Apache Spark",
      status: "completed",
      priority: "critical",
      assigneeId: member7.id,
      projectId: project13.id,
      domain: "backend",
      estimatedHours: 50,
      actualHours: 55,
      startDate: new Date("2024-01-08"),
      dueDate: new Date("2024-02-05"),
      completedDate: new Date("2024-02-08"),
      dependencies: []
    });

    const task35 = this.createTaskSync({
      title: "Machine Learning Model Training",
      description: "Develop and train ML models for predictive analytics and anomaly detection",
      status: "delayed",
      priority: "high",
      assigneeId: member8.id,
      projectId: project13.id,
      domain: "ml",
      estimatedHours: 90,
      actualHours: 65,
      startDate: new Date("2024-02-08"),
      dueDate: new Date("2024-03-25"),
      dependencies: [task34.id],
      delayReason: "Training datasets larger than expected, requires additional computational resources and optimization"
    });

    const task36 = this.createTaskSync({
      title: "Real-time Analytics Dashboard",
      description: "Interactive dashboard for real-time data visualization and insights",
      status: "todo",
      priority: "medium",
      assigneeId: member9.id,
      projectId: project13.id,
      domain: "frontend",
      estimatedHours: 40,
      actualHours: 0,
      startDate: new Date("2024-03-25"),
      dueDate: new Date("2024-04-20"),
      dependencies: [task35.id]
    });

    // PROJECT 14: Multi-tenant SaaS Architecture Tasks
    const task37 = this.createTaskSync({
      title: "Database Sharding Strategy",
      description: "Implement horizontal database sharding for multi-tenant scalability",
      status: "completed",
      priority: "critical",
      assigneeId: member7.id,
      projectId: project14.id,
      domain: "database",
      estimatedHours: 60,
      actualHours: 58,
      startDate: new Date("2023-11-25"),
      dueDate: new Date("2024-01-15"),
      completedDate: new Date("2024-01-12"),
      dependencies: []
    });

    const task38 = this.createTaskSync({
      title: "Tenant Isolation Security",
      description: "Implement robust security measures ensuring complete tenant data isolation",
      status: "completed",
      priority: "critical",
      assigneeId: member3.id,
      projectId: project14.id,
      domain: "security",
      estimatedHours: 45,
      actualHours: 42,
      startDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-20"),
      completedDate: new Date("2024-02-18"),
      dependencies: [task37.id]
    });

    const task39 = this.createTaskSync({
      title: "Load Balancing & Auto-scaling",
      description: "Kubernetes-based auto-scaling with intelligent load distribution",
      status: "in_progress",
      priority: "high",
      assigneeId: member7.id,
      projectId: project14.id,
      domain: "devops",
      estimatedHours: 35,
      actualHours: 25,
      startDate: new Date("2024-02-20"),
      dueDate: new Date("2024-03-08"),
      dependencies: [task38.id]
    });

    // PROJECT 15: Accessibility Compliance Upgrade Tasks
    const task40 = this.createTaskSync({
      title: "WCAG 2.1 Audit & Assessment",
      description: "Comprehensive accessibility audit across all user interfaces",
      status: "completed",
      priority: "high",
      assigneeId: member10.id,
      projectId: project15.id,
      domain: "ui/ux",
      estimatedHours: 30,
      actualHours: 28,
      startDate: new Date("2024-02-05"),
      dueDate: new Date("2024-02-25"),
      completedDate: new Date("2024-02-22"),
      dependencies: []
    });

    const task41 = this.createTaskSync({
      title: "Screen Reader Compatibility",
      description: "Implement ARIA labels and semantic HTML for screen reader support",
      status: "in_progress",
      priority: "high",
      assigneeId: member9.id,
      projectId: project15.id,
      domain: "frontend",
      estimatedHours: 50,
      actualHours: 35,
      startDate: new Date("2024-02-25"),
      dueDate: new Date("2024-04-10"),
      dependencies: [task40.id]
    });

    const task42 = this.createTaskSync({
      title: "Keyboard Navigation Enhancement",
      description: "Ensure all interactive elements are keyboard accessible with proper focus management",
      status: "todo",
      priority: "medium",
      assigneeId: member2.id,
      projectId: project15.id,
      domain: "frontend",
      estimatedHours: 25,
      actualHours: 0,
      startDate: new Date("2024-03-15"),
      dueDate: new Date("2024-04-05"),
      dependencies: [task40.id]
    });

    // PROJECT 16: Global Content Delivery Network Tasks  
    const task43 = this.createTaskSync({
      title: "CDN Architecture Planning",
      description: "Design multi-region CDN strategy with edge caching optimization",
      status: "todo",
      priority: "critical",
      assigneeId: member7.id,
      projectId: project16.id,
      domain: "devops",
      estimatedHours: 40,
      actualHours: 0,
      startDate: new Date("2024-04-05"),
      dueDate: new Date("2024-04-30"),
      dependencies: []
    });

    // PROJECT 17: Advanced Payment Gateway Tasks (Delayed Project)
    const task44 = this.createTaskSync({
      title: "Payment Processing Core API",
      description: "Multi-currency payment processing with fraud detection algorithms",
      status: "delayed",
      priority: "critical",
      assigneeId: member3.id,
      projectId: project17.id,
      domain: "backend",
      estimatedHours: 70,
      actualHours: 45,
      startDate: new Date("2024-01-20"),
      dueDate: new Date("2024-03-15"),
      dependencies: [],
      delayReason: "PCI compliance requirements more complex than expected, additional security audits needed"
    });

    const task45 = this.createTaskSync({
      title: "Cryptocurrency Integration",
      description: "Bitcoin, Ethereum, and stablecoin payment processing integration",
      status: "todo",
      priority: "medium",
      assigneeId: member4.id,
      projectId: project17.id,
      domain: "backend",
      estimatedHours: 55,
      actualHours: 0,
      startDate: new Date("2024-03-15"),
      dueDate: new Date("2024-03-28"),
      dependencies: [task44.id]
    });

    // PROJECT 18: Voice User Interface Platform Tasks
    const task46 = this.createTaskSync({
      title: "Voice Recognition Engine Setup",
      description: "Configure speech-to-text engines for multiple languages and accents",
      status: "todo",
      priority: "high",
      assigneeId: member5.id,
      projectId: project18.id,
      domain: "ai",
      estimatedHours: 60,
      actualHours: 0,
      startDate: new Date("2024-05-05"),
      dueDate: new Date("2024-06-15"),
      dependencies: []
    });

    // Create comprehensive delay alerts based on delayed tasks
    this.createDelayAlertSync({
      type: "critical",
      title: "Migration Scripts Development Delay",
      message: "Data inconsistencies in legacy system causing critical delays - blocking 2 dependent tasks",
      taskId: task9.id,
      projectId: project3.id,
      isResolved: false,
      notificationSent: true
    });

    this.createDelayAlertSync({
      type: "major", 
      title: "Mobile Chat Implementation Delay",
      message: "WebSocket complexity causing 5-day delay in real-time chat feature",
      taskId: task6.id,
      projectId: project2.id,
      isResolved: false,
      notificationSent: true
    });

    this.createDelayAlertSync({
      type: "critical",
      title: "GDPR Compliance Implementation Delay",
      message: "Legal requirements more complex than anticipated - security project at risk",
      taskId: task21.id,
      projectId: project8.id,
      isResolved: false,
      notificationSent: true
    });

    this.createDelayAlertSync({
      type: "minor",
      title: "Data Schema Analysis Overrun",
      message: "Analysis completed but took 7 hours longer than estimated",
      taskId: task8.id,
      projectId: project3.id,
      isResolved: true,
      notificationSent: true
    });

    // Additional delay alerts for comprehensive tracking
    this.createDelayAlertSync({
      type: "critical",
      title: "Payment Gateway PCI Compliance Delay",
      message: "PCI DSS certification requirements causing significant delay in payment processing implementation",
      taskId: task44.id,
      projectId: project17.id,
      isResolved: false,
      notificationSent: true
    });

    this.createDelayAlertSync({
      type: "major",
      title: "Machine Learning Model Training Delay", 
      message: "ML training datasets larger than expected, requiring additional compute resources and optimization",
      taskId: task35.id,
      projectId: project13.id,
      isResolved: false,
      notificationSent: true
    });

    this.createDelayAlertSync({
      type: "minor",
      title: "Documentation Portal Setup Delay",
      message: "SDK documentation dependencies resolved, minor delay due to template customization",
      taskId: task26.id,
      projectId: project9.id,
      isResolved: true,
      notificationSent: true
    });

    // Create achievements based on task performance and roles
    this.createAchievementSync({
      userId: administrator.id,
      type: "system_manager",
      title: "System Architecture Master",
      description: "Successfully designed and implemented system-wide improvements",
      points: 200
    });

    this.createAchievementSync({
      userId: manager1.id,
      type: "project_master",
      title: "Project Delivery Champion",
      description: "Successfully delivered Design System project on time and under budget",
      points: 300
    });

    this.createAchievementSync({
      userId: manager2.id,
      type: "milestone_master",
      title: "Milestone Master",
      description: "Reached critical milestones in microservices architecture project",
      points: 250
    });

    this.createAchievementSync({
      userId: leader1.id,
      type: "on_time_hero",
      title: "On-time Hero",
      description: "Consistently delivered tasks ahead of schedule",
      points: 100
    });

    this.createAchievementSync({
      userId: leader2.id,
      type: "team_player",
      title: "Strategic Planning Expert",
      description: "Excellent strategic planning for microservices decomposition",
      points: 120
    });

    this.createAchievementSync({
      userId: member1.id,
      type: "perfectionist",
      title: "Code Quality Champion",
      description: "Delivered component library with exceptional code quality",
      points: 150
    });

    this.createAchievementSync({
      userId: member2.id,
      type: "on_time_hero",
      title: "UX Excellence",
      description: "Completed dashboard redesign ahead of schedule with outstanding user feedback",
      points: 130
    });

    this.createAchievementSync({
      userId: member3.id,
      type: "rescue_squad", 
      title: "Security Guardian",
      description: "Successfully completed critical security audit preventing potential vulnerabilities",
      points: 180
    });

    this.createAchievementSync({
      userId: member5.id,
      type: "on_time_hero",
      title: "Mobile Architecture Pro",
      description: "Flawless React Native setup completed 2 days early",
      points: 110
    });

    this.createAchievementSync({
      userId: member9.id,
      type: "dependency_saver",
      title: "Design Token Pioneer",
      description: "Created foundational design token system enabling all subsequent UI work",
      points: 140
    });

    // Create some initial messages between team members and leaders
    this.sendMessageSync({
      senderId: member1.id,
      receiverId: leader1.id,
      content: "Hi! How can I help with the project tasks?",
      isRead: false
    });

    this.sendMessageSync({
      senderId: leader1.id, 
      receiverId: member1.id,
      content: "Looking great! Let me know if you need any support on the current tasks.",
      isRead: false
    });

    this.sendMessageSync({
      senderId: member2.id,
      receiverId: leader1.id,
      content: "I've finished the dashboard design. Ready for the next task!",
      isRead: false
    });

    this.sendMessageSync({
      senderId: leader2.id,
      receiverId: member3.id,
      content: "Great progress on the security audit! How's the timeline looking?",
      isRead: false
    });

    this.sendMessageSync({
      senderId: member3.id,
      receiverId: leader2.id,
      content: "Security audit is on track. Should complete by end of week.",
      isRead: false
    });

    // Add more team communication messages
    this.sendMessageSync({
      senderId: member5.id,
      receiverId: leader3.id,
      content: "React Native setup completed! What's the next priority task?",
      isRead: false
    });

    this.sendMessageSync({
      senderId: leader3.id,
      receiverId: member5.id,
      content: "Great work! Please start on the chat implementation next.",
      isRead: false
    });

    this.sendMessageSync({
      senderId: member6.id,
      receiverId: member5.id,
      content: "Need help with the WebSocket integration? I have some experience with offline sync.",
      isRead: false
    });

    this.sendMessageSync({
      senderId: manager1.id,
      receiverId: leader1.id,
      content: "The e-commerce project is looking great! Are we on track for the March deadline?",
      isRead: false
    });

    this.sendMessageSync({
      senderId: leader1.id,
      receiverId: manager1.id,
      content: "Yes, we're actually ahead of schedule. The team has been very efficient.",
      isRead: false
    });

    this.sendMessageSync({
      senderId: member4.id,
      receiverId: leader2.id,
      content: "Found some critical data inconsistencies in the legacy migration. Need to schedule a team meeting.",
      isRead: false
    });

    this.sendMessageSync({
      senderId: member7.id,
      receiverId: member4.id,
      content: "I can help with the migration performance testing once the scripts are ready.",
      isRead: false
    });

    this.sendMessageSync({
      senderId: member9.id,
      receiverId: member10.id,
      content: "The design token system is working beautifully! Ready to start on the next component set?",
      isRead: false
    });

    this.sendMessageSync({
      senderId: member10.id,
      receiverId: member9.id,
      content: "Absolutely! I've prepared the wireframes for the new dashboard components.",
      isRead: false
    });

    // Create Extension Requests
    this.createExtensionRequestSync({
      taskId: task6.id,
      requesterId: member6.id,
      projectId: project2.id,
      additionalDays: 7,
      reason: "WebSocket implementation requires additional offline synchronization logic that wasn't accounted for in original estimate. Need 7 extra days to ensure data consistency.",
      status: "pending"
    });

    this.createExtensionRequestSync({
      taskId: task9.id,
      requesterId: member3.id,
      projectId: project3.id,
      additionalDays: 8,
      reason: "Legacy data contains more inconsistencies than expected. Additional validation and cleanup scripts required to ensure data integrity during migration.",
      status: "approved",
      responseMessage: "Approved. Data integrity is critical for this migration.",
      respondedAt: new Date("2024-02-18"),
      responderId: manager2.id
    });

    this.createExtensionRequestSync({
      taskId: task21.id,
      requesterId: member4.id,
      projectId: project8.id,
      additionalDays: 10,
      reason: "GDPR compliance requirements are more complex than initially scoped. Legal team requires additional documentation and consent management flows.",
      status: "pending"
    });

    this.createExtensionRequestSync({
      taskId: task12.id,
      requesterId: member3.id,
      projectId: project4.id,
      additionalDays: 5,
      reason: "API Gateway integration with existing authentication system requires additional security testing and configuration.",
      status: "rejected",
      responseMessage: "Timeline must be maintained. Please explore the alternative lightweight gateway solution we discussed.",
      respondedAt: new Date("2024-03-12"),
      responderId: manager2.id
    });

    this.createExtensionRequestSync({
      taskId: task16.id,
      requesterId: member4.id,
      projectId: project6.id,
      additionalDays: 7,
      reason: "Real-time data pipeline architecture needs optimization for high-volume analytics data. Current approach may not scale.",
      status: "pending"
    });

    // Create Deadline Reschedule Logs
    this.createDeadlineRescheduleLogSync({
      projectId: project3.id,
      oldDeadline: new Date("2024-02-20"),
      newDeadline: new Date("2024-02-28"),
      reason: "Legacy data inconsistencies requiring additional validation scripts",
      rescheduleById: manager2.id
    });

    this.createDeadlineRescheduleLogSync({
      projectId: project2.id,
      oldDeadline: new Date("2024-03-20"),
      newDeadline: new Date("2024-03-27"),
      reason: "WebSocket offline synchronization complexity underestimated",
      rescheduleById: leader3.id
    });

    this.createDeadlineRescheduleLogSync({
      projectId: project8.id,
      oldDeadline: new Date("2024-03-15"),
      newDeadline: new Date("2024-03-25"),
      reason: "Additional GDPR compliance requirements from legal review",
      rescheduleById: manager2.id
    });

    this.createDeadlineRescheduleLogSync({
      projectId: project1.id,
      oldDeadline: new Date("2024-03-15"),
      newDeadline: new Date("2024-03-12"),
      reason: "Testing phase moved up due to early completion of dependent tasks",
      rescheduleById: leader1.id
    });

    // Create Weekly Reports
    this.createWeeklyReportSync({
      projectId: project1.id,
      weekStartDate: new Date("2024-03-04"),
      weekEndDate: new Date("2024-03-10"),
      projectDueDate: new Date("2024-03-30"),
      currentProjectEndDate: new Date("2024-03-28"),
      rescheduledDates: [],
      delayCount: 0,
      delayDetails: [],
      generatedBy: leader1.id
    });

    this.createWeeklyReportSync({
      projectId: project2.id,
      weekStartDate: new Date("2024-03-04"),
      weekEndDate: new Date("2024-03-10"),
      projectDueDate: new Date("2024-05-15"),
      currentProjectEndDate: new Date("2024-05-22"),
      rescheduledDates: [{
        oldDate: new Date("2024-03-20"),
        newDate: new Date("2024-03-27"),
        reason: "WebSocket complexity",
        rescheduleDate: new Date("2024-03-01")
      }],
      delayCount: 1,
      delayDetails: [{
        taskId: task6.id,
        taskTitle: "Real-time Chat Implementation",
        delayDays: 7,
        reason: "WebSocket offline sync complexity"
      }],
      generatedBy: leader3.id
    });

    this.createWeeklyReportSync({
      projectId: project3.id,
      weekStartDate: new Date("2024-02-26"),
      weekEndDate: new Date("2024-03-03"),
      projectDueDate: new Date("2024-02-28"),
      currentProjectEndDate: new Date("2024-03-08"),
      rescheduledDates: [{
        oldDate: new Date("2024-02-20"),
        newDate: new Date("2024-02-28"),
        reason: "Legacy data inconsistencies",
        rescheduleDate: new Date("2024-02-18")
      }],
      delayCount: 1,
      delayDetails: [{
        taskId: task9.id,
        taskTitle: "Migration Scripts Development",
        delayDays: 8,
        reason: "Legacy data inconsistencies requiring additional validation"
      }],
      generatedBy: leader2.id
    });

    this.createWeeklyReportSync({
      projectId: project4.id,
      weekStartDate: new Date("2024-03-04"),
      weekEndDate: new Date("2024-03-10"),
      projectDueDate: new Date("2024-06-30"),
      currentProjectEndDate: new Date("2024-06-30"),
      rescheduledDates: [],
      delayCount: 0,
      delayDetails: [],
      generatedBy: leader2.id
    });

    this.createWeeklyReportSync({
      projectId: project6.id,
      weekStartDate: new Date("2024-03-04"),
      weekEndDate: new Date("2024-03-10"),
      projectDueDate: new Date("2024-07-31"),
      currentProjectEndDate: new Date("2024-07-31"),
      rescheduledDates: [],
      delayCount: 0,
      delayDetails: [],
      generatedBy: leader1.id
    });

    this.createWeeklyReportSync({
      projectId: project7.id,
      weekStartDate: new Date("2024-03-04"),
      weekEndDate: new Date("2024-03-10"),
      projectDueDate: new Date("2024-04-15"),
      currentProjectEndDate: new Date("2024-04-15"),
      rescheduledDates: [],
      delayCount: 0,
      delayDetails: [],
      generatedBy: leader2.id
    });

    this.createWeeklyReportSync({
      projectId: project8.id,
      weekStartDate: new Date("2024-03-04"),
      weekEndDate: new Date("2024-03-10"),
      projectDueDate: new Date("2024-03-20"),
      currentProjectEndDate: new Date("2024-03-30"),
      rescheduledDates: [{
        oldDate: new Date("2024-03-15"),
        newDate: new Date("2024-03-25"),
        reason: "GDPR compliance complexity",
        rescheduleDate: new Date("2024-03-01")
      }],
      delayCount: 1,
      delayDetails: [{
        taskId: task21.id,
        taskTitle: "GDPR Compliance Implementation",
        delayDays: 10,
        reason: "Legal requirements more complex than anticipated"
      }],
      generatedBy: leader2.id
    });
  }

  private createUserSync(user: InsertUser): User {
    const id = randomUUID();
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  private createTeamSync(team: InsertTeam): Team {
    const id = randomUUID();
    const newTeam: Team = { ...team, id, createdAt: new Date() };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  private createProjectSync(project: InsertProject): Project {
    const id = randomUUID();
    const newProject: Project = { ...project, id, createdAt: new Date() };
    this.projects.set(id, newProject);
    return newProject;
  }

  private createTaskSync(task: InsertTask): Task {
    const id = randomUUID();
    const newTask: Task = { ...task, id, createdAt: new Date() };
    this.tasks.set(id, newTask);
    return newTask;
  }

  private createDelayAlertSync(alert: InsertDelayAlert): DelayAlert {
    const id = randomUUID();
    const newAlert: DelayAlert = { ...alert, id, createdAt: new Date() };
    this.delayAlerts.set(id, newAlert);
    return newAlert;
  }

  private createAchievementSync(achievement: InsertAchievement): Achievement {
    const id = randomUUID();
    const newAchievement: Achievement = { ...achievement, id, earnedAt: new Date() };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

  private sendMessageSync(message: InsertMessage): Message {
    const id = randomUUID();
    const newMessage: Message = { ...message, id, timestamp: new Date() };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  private createExtensionRequestSync(request: InsertExtensionRequest): ExtensionRequest {
    const id = randomUUID();
    const newRequest: ExtensionRequest = { ...request, id, requestedAt: new Date() };
    this.extensionRequests.set(id, newRequest);
    return newRequest;
  }

  private createDeadlineRescheduleLogSync(log: InsertDeadlineRescheduleLog): DeadlineRescheduleLog {
    const id = randomUUID();
    const newLog: DeadlineRescheduleLog = { ...log, id, createdAt: new Date() };
    this.deadlineRescheduleLogs.set(id, newLog);
    return newLog;
  }

  private createWeeklyReportSync(report: InsertWeeklyReport): WeeklyReport {
    const id = randomUUID();
    const newReport: WeeklyReport = { ...report, id, generatedAt: new Date() };
    this.weeklyReports.set(id, newReport);
    return newReport;
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByManager(managerId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.managerId === managerId);
  }

  async getProjectsByTeam(teamId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.teamId === teamId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { ...insertProject, id, createdAt: new Date() };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.projectId === projectId);
  }

  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.assigneeId === assigneeId);
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { ...insertTask, id, createdAt: new Date() };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Team methods
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByLeader(leaderId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(t => t.leaderId === leaderId);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = { ...insertTeam, id, createdAt: new Date() };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  // Message methods
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getMessagesForUser(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.senderId === userId || msg.receiverId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async sendMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(messageId: string): Promise<Message | undefined> {
    const message = this.messages.get(messageId);
    if (!message) return undefined;
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(messageId, updatedMessage);
    return updatedMessage;
  }

  // Delay Alert methods
  async getDelayAlerts(): Promise<DelayAlert[]> {
    return Array.from(this.delayAlerts.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDelayAlert(id: string): Promise<DelayAlert | undefined> {
    return this.delayAlerts.get(id);
  }

  async getUnresolvedDelayAlerts(): Promise<DelayAlert[]> {
    return Array.from(this.delayAlerts.values()).filter(alert => !alert.isResolved);
  }

  async createDelayAlert(insertAlert: InsertDelayAlert): Promise<DelayAlert> {
    const id = randomUUID();
    const alert: DelayAlert = { ...insertAlert, id, createdAt: new Date() };
    this.delayAlerts.set(id, alert);
    return alert;
  }

  async updateDelayAlert(id: string, updates: Partial<DelayAlert>): Promise<DelayAlert | undefined> {
    const alert = this.delayAlerts.get(id);
    if (!alert) return undefined;
    const updatedAlert = { ...alert, ...updates };
    this.delayAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async getAchievementsByUser(userId: string): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(a => a.userId === userId);
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const achievement: Achievement = { ...insertAchievement, id, earnedAt: new Date() };
    this.achievements.set(id, achievement);
    return achievement;
  }

  // Statistics methods
  async getStats(): Promise<Stats> {
    const projects = Array.from(this.projects.values());
    const tasks = Array.from(this.tasks.values());
    const alerts = Array.from(this.delayAlerts.values());
    const users = Array.from(this.users.values());

    return {
      activeProjects: projects.filter(p => p.status === "in_progress").length,
      completedTasks: tasks.filter(t => t.status === "completed").length,
      pendingDelays: alerts.filter(a => !a.isResolved && a.type !== "critical").length,
      criticalIssues: alerts.filter(a => !a.isResolved && a.type === "critical").length,
      teamMembers: users.filter(u => u.role !== "manager").length,
      onTimeCompletion: Math.round((tasks.filter(t => t.status === "completed" && t.completedDate && t.completedDate <= t.dueDate).length / Math.max(tasks.filter(t => t.status === "completed").length, 1)) * 100)
    };
  }

  async getUserLeaderboard(): Promise<Array<{ user: User; points: number; achievements: Achievement[] }>> {
    const users = Array.from(this.users.values());
    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const achievements = await this.getAchievementsByUser(user.id);
        const points = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
        return { user, points, achievements };
      })
    );

    return leaderboard.sort((a, b) => b.points - a.points);
  }

  // Extension Request methods - Feature 1
  async getExtensionRequests(): Promise<ExtensionRequest[]> {
    return Array.from(this.extensionRequests.values()).sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async getExtensionRequest(id: string): Promise<ExtensionRequest | undefined> {
    return this.extensionRequests.get(id);
  }

  async getExtensionRequestsByTask(taskId: string): Promise<ExtensionRequest[]> {
    return Array.from(this.extensionRequests.values()).filter(req => req.taskId === taskId);
  }

  async getExtensionRequestsByRequester(requesterId: string): Promise<ExtensionRequest[]> {
    return Array.from(this.extensionRequests.values()).filter(req => req.requesterId === requesterId);
  }

  async getExtensionRequestsByProject(projectId: string): Promise<ExtensionRequest[]> {
    return Array.from(this.extensionRequests.values()).filter(req => req.projectId === projectId);
  }

  async getPendingExtensionRequests(): Promise<ExtensionRequest[]> {
    return Array.from(this.extensionRequests.values()).filter(req => req.status === "pending");
  }

  async createExtensionRequest(insertRequest: InsertExtensionRequest): Promise<ExtensionRequest> {
    const id = randomUUID();
    const request: ExtensionRequest = { ...insertRequest, id, requestedAt: new Date() };
    this.extensionRequests.set(id, request);
    return request;
  }

  async updateExtensionRequest(id: string, updates: Partial<ExtensionRequest>): Promise<ExtensionRequest | undefined> {
    const request = this.extensionRequests.get(id);
    if (!request) return undefined;
    const updatedRequest = { ...request, ...updates };
    this.extensionRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Deadline Reschedule Log methods - Feature 2
  async getDeadlineRescheduleLogs(): Promise<DeadlineRescheduleLog[]> {
    return Array.from(this.deadlineRescheduleLogs.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDeadlineRescheduleLog(id: string): Promise<DeadlineRescheduleLog | undefined> {
    return this.deadlineRescheduleLogs.get(id);
  }

  async getDeadlineRescheduleLogsByProject(projectId: string): Promise<DeadlineRescheduleLog[]> {
    return Array.from(this.deadlineRescheduleLogs.values()).filter(log => log.projectId === projectId);
  }

  async createDeadlineRescheduleLog(insertLog: InsertDeadlineRescheduleLog): Promise<DeadlineRescheduleLog> {
    const id = randomUUID();
    const log: DeadlineRescheduleLog = { ...insertLog, id, createdAt: new Date() };
    this.deadlineRescheduleLogs.set(id, log);
    return log;
  }

  // Weekly Report methods - Feature 2
  async getWeeklyReports(): Promise<WeeklyReport[]> {
    return Array.from(this.weeklyReports.values()).sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  async getWeeklyReport(id: string): Promise<WeeklyReport | undefined> {
    return this.weeklyReports.get(id);
  }

  async getWeeklyReportsByProject(projectId: string): Promise<WeeklyReport[]> {
    return Array.from(this.weeklyReports.values()).filter(report => report.projectId === projectId);
  }

  async createWeeklyReport(insertReport: InsertWeeklyReport): Promise<WeeklyReport> {
    const id = randomUUID();
    const report: WeeklyReport = { ...insertReport, id, generatedAt: new Date() };
    this.weeklyReports.set(id, report);
    return report;
  }
}

export const storage = new MemStorage();
