#!/usr/bin/env node

/**
 * Data extraction script to get project data from the storage system
 * and make it available for Python analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add server path
const serverPath = path.join(__dirname, '..', 'server');
process.chdir(path.join(__dirname, '..'));

// Import storage - skip for now and use sample data
// const { MemStorage } = require('./server/storage.ts');

async function extractData() {
    try {
        console.log('Initializing storage...');
        const storage = new MemStorage();
        
        const data = {
            projects: [],
            tasks: [],
            teams: [],
            users: [],
            delayAlerts: []
        };
        
        // Extract projects
        for (const [id, project] of storage.projects) {
            data.projects.push({
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                progress: project.progress,
                startDate: project.startDate?.toISOString(),
                endDate: project.endDate?.toISOString(),
                teamId: project.teamId,
                managerId: project.managerId,
                domains: project.domains
            });
        }
        
        // Extract tasks
        for (const [id, task] of storage.tasks) {
            data.tasks.push({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assigneeId: task.assigneeId,
                projectId: task.projectId,
                domain: task.domain,
                estimatedHours: task.estimatedHours,
                actualHours: task.actualHours,
                startDate: task.startDate?.toISOString(),
                dueDate: task.dueDate?.toISOString(),
                completedDate: task.completedDate?.toISOString(),
                dependencies: task.dependencies,
                delayReason: task.delayReason
            });
        }
        
        // Extract teams
        for (const [id, team] of storage.teams) {
            data.teams.push({
                id: team.id,
                name: team.name,
                description: team.description,
                leaderId: team.leaderId,
                memberIds: team.memberIds,
                skills: team.skills
            });
        }
        
        // Extract users
        for (const [id, user] of storage.users) {
            data.users.push({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            });
        }
        
        // Extract delay alerts
        for (const [id, alert] of storage.delayAlerts) {
            data.delayAlerts.push({
                id: alert.id,
                type: alert.type,
                title: alert.title,
                message: alert.message,
                taskId: alert.taskId,
                projectId: alert.projectId,
                isResolved: alert.isResolved,
                notificationSent: alert.notificationSent
            });
        }
        
        // Save to JSON file
        const outputPath = path.join(__dirname, 'extracted_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        
        console.log('Data extraction completed!');
        console.log(`Projects: ${data.projects.length}`);
        console.log(`Tasks: ${data.tasks.length}`);
        console.log(`Teams: ${data.teams.length}`);
        console.log(`Users: ${data.users.length}`);
        console.log(`Delay Alerts: ${data.delayAlerts.length}`);
        console.log(`Data saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Error extracting data:', error.message);
        process.exit(1);
    }
}

extractData();