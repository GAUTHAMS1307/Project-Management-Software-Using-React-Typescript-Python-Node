import { z } from "zod";

// User roles
export const UserRole = z.enum(["administrator", "manager", "leader", "member"]);
export type UserRole = z.infer<typeof UserRole>;

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
  role: UserRole,
  avatar: z.string().optional(),
  createdAt: z.date(),
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Project schema
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(["planning", "in_progress", "delayed", "completed"]),
  progress: z.number().min(0).max(100),
  startDate: z.date(),
  endDate: z.date(),
  teamId: z.string(),
  managerId: z.string(),
  domains: z.array(z.string()),
  createdAt: z.date(),
});

export const insertProjectSchema = projectSchema.omit({ id: true, createdAt: true });
export type Project = z.infer<typeof projectSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["todo", "in_progress", "review", "completed", "delayed"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assigneeId: z.string(),
  projectId: z.string(),
  domain: z.string(),
  estimatedHours: z.number(),
  actualHours: z.number().optional(),
  startDate: z.date(),
  dueDate: z.date(),
  completedDate: z.date().optional(),
  dependencies: z.array(z.string()),
  delayReason: z.string().optional(),
  createdAt: z.date(),
});

export const insertTaskSchema = taskSchema.omit({ id: true, createdAt: true });
export type Task = z.infer<typeof taskSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Team schema
export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  leaderId: z.string(),
  memberIds: z.array(z.string()),
  skills: z.array(z.string()),
  createdAt: z.date(),
});

export const insertTeamSchema = teamSchema.omit({ id: true, createdAt: true });
export type Team = z.infer<typeof teamSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

// Message schema for team chat
export const messageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string(),
  timestamp: z.date(),
  isRead: z.boolean().default(false),
});

export const insertMessageSchema = messageSchema.omit({ id: true, timestamp: true });
export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Delay Alert schema
export const delayAlertSchema = z.object({
  id: z.string(),
  type: z.enum(["minor", "major", "critical"]),
  title: z.string(),
  message: z.string(),
  taskId: z.string(),
  projectId: z.string(),
  isResolved: z.boolean(),
  notificationSent: z.boolean(),
  createdAt: z.date(),
});

export const insertDelayAlertSchema = delayAlertSchema.omit({ id: true, createdAt: true });
export type DelayAlert = z.infer<typeof delayAlertSchema>;
export type InsertDelayAlert = z.infer<typeof insertDelayAlertSchema>;

// Achievement/Badge schema
export const achievementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["on_time_hero", "rescue_squad", "dependency_saver", "team_player", "milestone_master", "system_manager", "project_master", "perfectionist"]),
  title: z.string(),
  description: z.string(),
  points: z.number(),
  earnedAt: z.date(),
});

export const insertAchievementSchema = achievementSchema.omit({ id: true, earnedAt: true });
export type Achievement = z.infer<typeof achievementSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: UserRole,
});

export type LoginRequest = z.infer<typeof loginSchema>;

// Statistics schema
export const statsSchema = z.object({
  activeProjects: z.number(),
  completedTasks: z.number(),
  pendingDelays: z.number(),
  criticalIssues: z.number(),
  teamMembers: z.number(),
  onTimeCompletion: z.number(),
});

export type Stats = z.infer<typeof statsSchema>;

// Extension Request schema - Feature 1
export const extensionRequestSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  requesterId: z.string(), // Team member who requests extension
  projectId: z.string(),
  additionalDays: z.number().min(1, "Additional days must be at least 1"),
  reason: z.string().min(1, "Reason is required"),
  status: z.enum(["pending", "approved", "rejected"]),
  responseMessage: z.string().optional(), // Team leader's response
  requestedAt: z.date(),
  respondedAt: z.date().optional(),
  responderId: z.string().optional(), // Team leader who responded
});

export const insertExtensionRequestSchema = extensionRequestSchema.omit({ id: true, requestedAt: true });
export type ExtensionRequest = z.infer<typeof extensionRequestSchema>;
export type InsertExtensionRequest = z.infer<typeof insertExtensionRequestSchema>;

// Deadline Reschedule Log schema - Feature 2
export const deadlineRescheduleLogSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  oldDeadline: z.date(),
  newDeadline: z.date(),
  reason: z.string(),
  rescheduleById: z.string(), // Team leader who made the change
  createdAt: z.date(),
});

export const insertDeadlineRescheduleLogSchema = deadlineRescheduleLogSchema.omit({ id: true, createdAt: true });
export type DeadlineRescheduleLog = z.infer<typeof deadlineRescheduleLogSchema>;
export type InsertDeadlineRescheduleLog = z.infer<typeof insertDeadlineRescheduleLogSchema>;

// Weekly Report schema - Feature 2
export const weeklyReportSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  weekStartDate: z.date(),
  weekEndDate: z.date(),
  projectDueDate: z.date(),
  currentProjectEndDate: z.date(),
  rescheduledDates: z.array(z.object({
    oldDate: z.date(),
    newDate: z.date(),
    reason: z.string(),
    rescheduleDate: z.date()
  })),
  delayCount: z.number(),
  delayDetails: z.array(z.object({
    taskId: z.string(),
    taskTitle: z.string(),
    delayDays: z.number(),
    reason: z.string()
  })),
  generatedAt: z.date(),
  generatedBy: z.string(), // Team leader who generated the report
});

export const insertWeeklyReportSchema = weeklyReportSchema.omit({ id: true, generatedAt: true });
export type WeeklyReport = z.infer<typeof weeklyReportSchema>;
export type InsertWeeklyReport = z.infer<typeof insertWeeklyReportSchema>;
