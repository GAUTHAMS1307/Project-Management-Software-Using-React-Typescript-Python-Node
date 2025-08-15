#!/usr/bin/env python3
"""
Enhanced CSV Report Generator for Smart Project Pulse
Integrates with Hugging Face NLP Analysis for comprehensive reporting
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
from pathlib import Path
import csv
from huggingface_analyzer import HuggingFaceProjectAnalyzer


class EnhancedCSVReportGenerator:
    """Generate structured, professional CSV reports with NLP insights"""
    
    def __init__(self):
        self.nlp_analyzer = HuggingFaceProjectAnalyzer()
        self.insights = None
        self.dataframes = None
        self.results_dir = Path(__file__).parent / 'results'
        self.results_dir.mkdir(exist_ok=True)
        
    def generate_comprehensive_reports(self):
        """Generate all comprehensive CSV reports"""
        print("Generating comprehensive CSV reports with NLP analysis...")
        
        # Run NLP analysis first
        self.insights, self.dataframes = self.nlp_analyzer.generate_insights_report()
        
        # Generate individual reports
        reports = {}
        reports['project_summary'] = self.generate_project_summary_report()
        reports['task_analysis'] = self.generate_task_analysis_report()
        reports['team_performance'] = self.generate_team_performance_report()
        reports['delay_analysis'] = self.generate_delay_analysis_report()
        reports['risk_assessment'] = self.generate_risk_assessment_report()
        reports['executive_dashboard'] = self.generate_executive_dashboard()
        
        # Save all reports
        self.save_all_reports(reports)
        
        return reports
    
    def generate_project_summary_report(self):
        """Generate comprehensive project summary CSV"""
        projects_data = []
        
        for project in self.nlp_analyzer.data['projects']:
            # Get project tasks
            project_tasks = [t for t in self.nlp_analyzer.data['tasks'] 
                           if t.get('projectId') == project['id']]
            
            # Calculate metrics
            total_estimated_hours = sum(t.get('estimatedHours', 0) for t in project_tasks)
            total_actual_hours = sum(t.get('actualHours', 0) for t in project_tasks if t.get('actualHours'))
            completed_tasks = len([t for t in project_tasks if t.get('status') == 'completed'])
            delayed_tasks = len([t for t in project_tasks if t.get('status') == 'delayed'])
            
            # Get NLP insights for this project
            sentiment_data = None
            if not self.dataframes['sentiment_analysis'].empty:
                sentiment_row = self.dataframes['sentiment_analysis'][
                    self.dataframes['sentiment_analysis']['project_id'] == project['id']
                ]
                if not sentiment_row.empty:
                    sentiment_data = sentiment_row.iloc[0]
            
            project_row = {
                'Project_ID': project['id'],
                'Project_Name': project['name'],
                'Description': project['description'],
                'Status': project['status'],
                'Progress_Percentage': project.get('progress', 0),
                'Total_Tasks': len(project_tasks),
                'Completed_Tasks': completed_tasks,
                'Delayed_Tasks': delayed_tasks,
                'Task_Completion_Rate': (completed_tasks / len(project_tasks) * 100) if project_tasks else 0,
                'Delay_Rate': (delayed_tasks / len(project_tasks) * 100) if project_tasks else 0,
                'Total_Estimated_Hours': total_estimated_hours,
                'Total_Actual_Hours': total_actual_hours,
                'Estimation_Accuracy': (total_actual_hours / total_estimated_hours) if total_estimated_hours > 0 else 1.0,
                'Budget_Variance_Percentage': ((total_actual_hours - total_estimated_hours) / total_estimated_hours * 100) if total_estimated_hours > 0 else 0,
                'Domains': ', '.join(project.get('domains', [])),
                'Domain_Count': len(project.get('domains', [])),
                'Team_ID': project.get('teamId', ''),
                'Manager_ID': project.get('managerId', ''),
                'Risk_Level': self.assess_project_risk_level(project, project_tasks),
                'Sentiment_Score': sentiment_data['sentiment_score'] if sentiment_data is not None else 0,
                'Sentiment_Label': sentiment_data['sentiment_label'] if sentiment_data is not None else 'neutral',
                'Risk_Keywords_Count': len(sentiment_data['risk_keywords']) if sentiment_data is not None else 0,
                'Complexity_Level': sentiment_data['complexity_level'] if sentiment_data is not None else 'medium',
                'Start_Date': project.get('startDate', ''),
                'End_Date': project.get('endDate', ''),
                'Days_Duration': self.calculate_project_duration(project),
                'Days_Remaining': self.calculate_days_remaining(project),
                'Overall_Health_Score': self.calculate_health_score(project, project_tasks, sentiment_data),
                'Generated_Timestamp': datetime.now().isoformat()
            }
            
            projects_data.append(project_row)
        
        return pd.DataFrame(projects_data)
    
    def generate_task_analysis_report(self):
        """Generate detailed task analysis CSV"""
        tasks_data = []
        
        for task in self.nlp_analyzer.data['tasks']:
            # Get NLP complexity analysis
            complexity_data = None
            if not self.dataframes['task_complexity'].empty:
                complexity_row = self.dataframes['task_complexity'][
                    self.dataframes['task_complexity']['task_id'] == task['id']
                ]
                if not complexity_row.empty:
                    complexity_data = complexity_row.iloc[0]
            
            # Get delay analysis if applicable
            delay_data = None
            if not self.dataframes['delay_patterns'].empty:
                delay_row = self.dataframes['delay_patterns'][
                    self.dataframes['delay_patterns']['task_id'] == task['id']
                ]
                if not delay_row.empty:
                    delay_data = delay_row.iloc[0]
            
            task_row = {
                'Task_ID': task['id'],
                'Task_Title': task['title'],
                'Description': task['description'],
                'Status': task['status'],
                'Priority': task['priority'],
                'Domain': task.get('domain', ''),
                'Project_ID': task.get('projectId', ''),
                'Assignee_ID': task.get('assigneeId', ''),
                'Estimated_Hours': task.get('estimatedHours', 0),
                'Actual_Hours': task.get('actualHours', 0),
                'Hours_Variance': (task.get('actualHours', 0) - task.get('estimatedHours', 0)),
                'Estimation_Accuracy_Ratio': (task.get('actualHours', 0) / task.get('estimatedHours', 1)) if task.get('estimatedHours') else 1.0,
                'Estimation_Category': self.categorize_estimation_accuracy(task),
                'Dependency_Count': len(task.get('dependencies', [])),
                'Has_Dependencies': len(task.get('dependencies', [])) > 0,
                'Start_Date': task.get('startDate', ''),
                'Due_Date': task.get('dueDate', ''),
                'Completed_Date': task.get('completedDate', ''),
                'Days_To_Complete': self.calculate_completion_days(task),
                'Is_Overdue': self.is_task_overdue(task),
                'Delay_Reason': task.get('delayReason', ''),
                'Complexity_Score': complexity_data['complexity_score'] if complexity_data is not None else 0,
                'Complexity_Level': complexity_data['complexity_level'] if complexity_data is not None else 'low',
                'Technical_Terms_Count': len(complexity_data['tech_terms']) if complexity_data is not None else 0,
                'Technical_Terms': ', '.join(complexity_data['tech_terms']) if complexity_data is not None else '',
                'Domain_Classification': complexity_data['domain'] if complexity_data is not None else task.get('domain', ''),
                'Delay_Category': delay_data['delay_category'] if delay_data is not None else '',
                'Root_Cause': delay_data['root_cause'] if delay_data is not None else '',
                'Preventability_Score': delay_data['preventability_score'] if delay_data is not None else 0,
                'Task_Health_Score': self.calculate_task_health_score(task, complexity_data, delay_data),
                'Priority_Numeric': self.convert_priority_to_numeric(task.get('priority', 'medium')),
                'Status_Numeric': self.convert_status_to_numeric(task.get('status', 'todo')),
                'Generated_Timestamp': datetime.now().isoformat()
            }
            
            tasks_data.append(task_row)
        
        return pd.DataFrame(tasks_data)
    
    def generate_team_performance_report(self):
        """Generate team performance analysis CSV"""
        teams_data = []
        
        for team in self.nlp_analyzer.data['teams']:
            # Get team tasks (simplified - assuming team assignment exists)
            team_tasks = [t for t in self.nlp_analyzer.data['tasks'] 
                         if any(member_id in [u.get('id') for u in self.nlp_analyzer.data['users'] 
                               if u.get('id') in team.get('memberIds', [])] 
                               for member_id in [t.get('assigneeId')])]
            
            # Get NLP team analysis
            team_nlp_data = None
            if not self.dataframes['team_skills'].empty:
                team_row = self.dataframes['team_skills'][
                    self.dataframes['team_skills']['team_id'] == team['id']
                ]
                if not team_row.empty:
                    team_nlp_data = team_row.iloc[0]
            
            # Calculate performance metrics
            completed_tasks = len([t for t in team_tasks if t.get('status') == 'completed'])
            delayed_tasks = len([t for t in team_tasks if t.get('status') == 'delayed'])
            total_estimated = sum(t.get('estimatedHours', 0) for t in team_tasks)
            total_actual = sum(t.get('actualHours', 0) for t in team_tasks if t.get('actualHours'))
            
            team_row = {
                'Team_ID': team['id'],
                'Team_Name': team['name'],
                'Team_Description': team['description'],
                'Team_Size': len(team.get('memberIds', [])),
                'Leader_ID': team.get('leaderId', ''),
                'Skills_Count': len(team.get('skills', [])),
                'Primary_Skills': ', '.join(team.get('skills', [])[:5]),
                'All_Skills': ', '.join(team.get('skills', [])),
                'Total_Tasks_Assigned': len(team_tasks),
                'Completed_Tasks': completed_tasks,
                'Delayed_Tasks': delayed_tasks,
                'Tasks_In_Progress': len([t for t in team_tasks if t.get('status') == 'in_progress']),
                'Completion_Rate': (completed_tasks / len(team_tasks) * 100) if team_tasks else 0,
                'Delay_Rate': (delayed_tasks / len(team_tasks) * 100) if team_tasks else 0,
                'Total_Estimated_Hours': total_estimated,
                'Total_Actual_Hours': total_actual,
                'Team_Estimation_Accuracy': (total_actual / total_estimated) if total_estimated > 0 else 1.0,
                'Productivity_Score': self.calculate_team_productivity(team_tasks),
                'Specialization_Score': team_nlp_data['specialization_score'] if team_nlp_data is not None else 0,
                'Primary_Tech_Stack': team_nlp_data['primary_tech_stack'] if team_nlp_data is not None else 'General',
                'Skill_Diversity': team_nlp_data['skill_diversity'] if team_nlp_data is not None else 0,
                'Domain_Focus': self.identify_team_domain_focus(team, team_tasks),
                'Performance_Rating': self.calculate_team_performance_rating(team, team_tasks),
                'Workload_Balance_Score': self.calculate_workload_balance(team, team_tasks),
                'Risk_Factors': self.identify_team_risk_factors(team, team_tasks),
                'Generated_Timestamp': datetime.now().isoformat()
            }
            
            teams_data.append(team_row)
        
        return pd.DataFrame(teams_data)
    
    def generate_delay_analysis_report(self):
        """Generate comprehensive delay analysis CSV"""
        delay_data = []
        
        # Analyze delayed tasks
        delayed_tasks = [t for t in self.nlp_analyzer.data['tasks'] if t.get('status') == 'delayed']
        
        for task in delayed_tasks:
            # Get NLP delay analysis
            delay_nlp_data = None
            if not self.dataframes['delay_patterns'].empty:
                delay_row = self.dataframes['delay_patterns'][
                    self.dataframes['delay_patterns']['task_id'] == task['id']
                ]
                if not delay_row.empty:
                    delay_nlp_data = delay_row.iloc[0]
            
            # Calculate delay impact
            project_id = task.get('projectId', '')
            project_tasks = [t for t in self.nlp_analyzer.data['tasks'] if t.get('projectId') == project_id]
            
            delay_row = {
                'Task_ID': task['id'],
                'Task_Title': task['title'],
                'Project_ID': project_id,
                'Assignee_ID': task.get('assigneeId', ''),
                'Priority': task.get('priority', ''),
                'Domain': task.get('domain', ''),
                'Estimated_Hours': task.get('estimatedHours', 0),
                'Actual_Hours': task.get('actualHours', 0),
                'Hours_Overrun': (task.get('actualHours', 0) - task.get('estimatedHours', 0)),
                'Overrun_Percentage': ((task.get('actualHours', 0) - task.get('estimatedHours', 0)) / task.get('estimatedHours', 1) * 100),
                'Due_Date': task.get('dueDate', ''),
                'Days_Overdue': self.calculate_days_overdue(task),
                'Delay_Reason': task.get('delayReason', 'No reason provided'),
                'Delay_Category': delay_nlp_data['delay_category'] if delay_nlp_data is not None else 'other',
                'Root_Cause_Type': delay_nlp_data['root_cause'] if delay_nlp_data is not None else 'external_factor',
                'Preventability_Score': delay_nlp_data['preventability_score'] if delay_nlp_data is not None else 50,
                'Preventability_Category': self.categorize_preventability(delay_nlp_data['preventability_score'] if delay_nlp_data is not None else 50),
                'Impact_on_Project': self.calculate_delay_impact_on_project(task, project_tasks),
                'Dependency_Count': len(task.get('dependencies', [])),
                'Blocks_Other_Tasks': self.check_if_blocks_others(task, self.nlp_analyzer.data['tasks']),
                'Cost_Impact_Hours': task.get('actualHours', 0) - task.get('estimatedHours', 0),
                'Severity_Level': self.assess_delay_severity(task, delay_nlp_data),
                'Recommended_Action': self.suggest_delay_action(delay_nlp_data),
                'Lessons_Learned': self.extract_lessons_learned(task, delay_nlp_data),
                'Generated_Timestamp': datetime.now().isoformat()
            }
            
            delay_data.append(delay_row)
        
        # Add delay alerts
        for alert in self.nlp_analyzer.data['delayAlerts']:
            if not alert.get('isResolved', True):
                alert_row = {
                    'Alert_ID': alert['id'],
                    'Alert_Type': alert['type'],
                    'Alert_Title': alert['title'],
                    'Alert_Message': alert['message'],
                    'Task_ID': alert.get('taskId', ''),
                    'Project_ID': alert.get('projectId', ''),
                    'Is_Resolved': alert.get('isResolved', False),
                    'Notification_Sent': alert.get('notificationSent', False),
                    'Alert_Urgency': self.assess_alert_urgency(alert),
                    'Impact_Scope': self.assess_alert_impact_scope(alert),
                    'Generated_Timestamp': datetime.now().isoformat()
                }
                delay_data.append(alert_row)
        
        return pd.DataFrame(delay_data)
    
    def generate_risk_assessment_report(self):
        """Generate risk assessment CSV"""
        risk_data = []
        
        # Project-level risks
        for project in self.nlp_analyzer.data['projects']:
            project_tasks = [t for t in self.nlp_analyzer.data['tasks'] 
                           if t.get('projectId') == project['id']]
            
            # Get sentiment analysis
            sentiment_data = None
            if not self.dataframes['sentiment_analysis'].empty:
                sentiment_row = self.dataframes['sentiment_analysis'][
                    self.dataframes['sentiment_analysis']['project_id'] == project['id']
                ]
                if not sentiment_row.empty:
                    sentiment_data = sentiment_row.iloc[0]
            
            risk_score = self.calculate_comprehensive_risk_score(project, project_tasks, sentiment_data)
            
            risk_row = {
                'Entity_Type': 'Project',
                'Entity_ID': project['id'],
                'Entity_Name': project['name'],
                'Overall_Risk_Score': risk_score,
                'Risk_Level': self.categorize_risk_level(risk_score),
                'Schedule_Risk': self.assess_schedule_risk(project, project_tasks),
                'Budget_Risk': self.assess_budget_risk(project, project_tasks),
                'Quality_Risk': self.assess_quality_risk(project, project_tasks),
                'Resource_Risk': self.assess_resource_risk(project, project_tasks),
                'Technical_Risk': self.assess_technical_risk(project, project_tasks),
                'Complexity_Risk': sentiment_data['complexity_level'] if sentiment_data is not None else 'medium',
                'Sentiment_Risk': sentiment_data['sentiment_label'] if sentiment_data is not None else 'neutral',
                'Risk_Keywords_Count': len(sentiment_data['risk_keywords']) if sentiment_data is not None else 0,
                'Primary_Risk_Factors': self.identify_primary_risk_factors(project, project_tasks, sentiment_data),
                'Mitigation_Priority': self.assess_mitigation_priority(risk_score),
                'Recommended_Actions': self.suggest_risk_mitigation_actions(project, project_tasks, risk_score),
                'Monitoring_Frequency': self.suggest_monitoring_frequency(risk_score),
                'Impact_Assessment': self.assess_potential_impact(project, project_tasks, risk_score),
                'Generated_Timestamp': datetime.now().isoformat()
            }
            
            risk_data.append(risk_row)
        
        return pd.DataFrame(risk_data)
    
    def generate_executive_dashboard(self):
        """Generate executive summary dashboard data CSV"""
        summary_data = []
        
        # Overall metrics
        total_projects = len(self.nlp_analyzer.data['projects'])
        total_tasks = len(self.nlp_analyzer.data['tasks'])
        completed_projects = len([p for p in self.nlp_analyzer.data['projects'] if p.get('status') == 'completed'])
        delayed_projects = len([p for p in self.nlp_analyzer.data['projects'] if p.get('status') == 'delayed'])
        completed_tasks = len([t for t in self.nlp_analyzer.data['tasks'] if t.get('status') == 'completed'])
        delayed_tasks = len([t for t in self.nlp_analyzer.data['tasks'] if t.get('status') == 'delayed'])
        
        # Calculate totals
        total_estimated_hours = sum(t.get('estimatedHours', 0) for t in self.nlp_analyzer.data['tasks'])
        total_actual_hours = sum(t.get('actualHours', 0) for t in self.nlp_analyzer.data['tasks'] if t.get('actualHours'))
        
        # NLP insights
        exec_summary = self.insights['executive_summary']
        
        dashboard_row = {
            'Report_Type': 'Executive_Dashboard',
            'Total_Projects': total_projects,
            'Completed_Projects': completed_projects,
            'Delayed_Projects': delayed_projects,
            'In_Progress_Projects': len([p for p in self.nlp_analyzer.data['projects'] if p.get('status') == 'in_progress']),
            'Project_Completion_Rate': (completed_projects / total_projects * 100) if total_projects > 0 else 0,
            'Project_Delay_Rate': (delayed_projects / total_projects * 100) if total_projects > 0 else 0,
            'Total_Tasks': total_tasks,
            'Completed_Tasks': completed_tasks,
            'Delayed_Tasks': delayed_tasks,
            'Task_Completion_Rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            'Task_Delay_Rate': (delayed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            'Total_Estimated_Hours': total_estimated_hours,
            'Total_Actual_Hours': total_actual_hours,
            'Overall_Estimation_Accuracy': (total_actual_hours / total_estimated_hours) if total_estimated_hours > 0 else 1.0,
            'Budget_Variance_Percentage': ((total_actual_hours - total_estimated_hours) / total_estimated_hours * 100) if total_estimated_hours > 0 else 0,
            'High_Risk_Projects': exec_summary.get('high_risk_projects', 0),
            'High_Complexity_Tasks': exec_summary.get('complex_tasks', 0),
            'Average_Project_Health': self.calculate_average_project_health(),
            'Team_Performance_Score': self.calculate_overall_team_performance(),
            'Risk_Management_Score': self.calculate_risk_management_score(),
            'Process_Maturity_Score': self.calculate_process_maturity_score(),
            'Key_Success_Factors': self.identify_key_success_factors(),
            'Critical_Issues': self.identify_critical_issues(),
            'Strategic_Recommendations': ', '.join([r.get('title', '') for r in self.insights.get('recommendations', [])[:3]]),
            'Report_Generated_Date': datetime.now().strftime('%Y-%m-%d'),
            'Report_Generated_Time': datetime.now().strftime('%H:%M:%S'),
            'Generated_Timestamp': datetime.now().isoformat()
        }
        
        summary_data.append(dashboard_row)
        
        return pd.DataFrame(summary_data)
    
    def save_all_reports(self, reports):
        """Save all generated reports to CSV files"""
        results_dir = Path(__file__).parent / 'results'
        results_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        saved_files = []
        for report_name, df in reports.items():
            if not df.empty:
                filename = f"{report_name}_{timestamp}.csv"
                filepath = results_dir / filename
                
                # Save with proper formatting
                df.to_csv(filepath, index=False, encoding='utf-8')
                saved_files.append(str(filepath))
                print(f"Saved {report_name}: {len(df)} rows to {filepath}")
        
        return saved_files
    
    # Helper methods for calculations
    
    def assess_project_risk_level(self, project, tasks):
        """Assess overall project risk level"""
        risk_score = 0
        
        if project.get('status') == 'delayed':
            risk_score += 30
        elif project.get('progress', 0) < 50 and project.get('status') != 'completed':
            risk_score += 20
            
        delayed_task_ratio = len([t for t in tasks if t.get('status') == 'delayed']) / len(tasks) if tasks else 0
        risk_score += delayed_task_ratio * 40
        
        if risk_score >= 60:
            return 'high'
        elif risk_score >= 30:
            return 'medium'
        else:
            return 'low'
    
    def calculate_project_duration(self, project):
        """Calculate project duration in days"""
        start = project.get('startDate')
        end = project.get('endDate')
        if start and end:
            try:
                start_date = datetime.fromisoformat(start.replace('Z', '+00:00')) if isinstance(start, str) else start
                end_date = datetime.fromisoformat(end.replace('Z', '+00:00')) if isinstance(end, str) else end
                return (end_date - start_date).days
            except:
                return 0
        return 0
    
    def calculate_days_remaining(self, project):
        """Calculate days remaining for project"""
        end = project.get('endDate')
        if end:
            try:
                end_date = datetime.fromisoformat(end.replace('Z', '+00:00')) if isinstance(end, str) else end
                return (end_date - datetime.now()).days
            except:
                return 0
        return 0
    
    def calculate_health_score(self, project, tasks, sentiment_data):
        """Calculate overall project health score (0-100)"""
        score = 50  # Base score
        
        # Progress factor
        progress = project.get('progress', 0)
        score += (progress - 50) * 0.5
        
        # Task completion factor
        if tasks:
            completed_ratio = len([t for t in tasks if t.get('status') == 'completed']) / len(tasks)
            score += (completed_ratio - 0.5) * 30
        
        # Sentiment factor
        if sentiment_data is not None:
            sentiment_score = sentiment_data.get('sentiment_score', 0)
            score += sentiment_score * 20
        
        # Delay penalty
        if project.get('status') == 'delayed':
            score -= 25
        
        return max(0, min(100, score))
    
    def categorize_estimation_accuracy(self, task):
        """Categorize estimation accuracy"""
        estimated = task.get('estimatedHours', 0)
        actual = task.get('actualHours', 0)
        
        if estimated == 0 or actual == 0:
            return 'unknown'
        
        ratio = actual / estimated
        
        if 0.8 <= ratio <= 1.2:
            return 'accurate'
        elif ratio < 0.8:
            return 'overestimated'
        else:
            return 'underestimated'
    
    def calculate_completion_days(self, task):
        """Calculate days to complete task"""
        start = task.get('startDate')
        completed = task.get('completedDate')
        
        if start and completed:
            try:
                start_date = datetime.fromisoformat(start.replace('Z', '+00:00')) if isinstance(start, str) else start
                completed_date = datetime.fromisoformat(completed.replace('Z', '+00:00')) if isinstance(completed, str) else completed
                return (completed_date - start_date).days
            except:
                return 0
        return 0
    
    def is_task_overdue(self, task):
        """Check if task is overdue"""
        due = task.get('dueDate')
        if due and task.get('status') != 'completed':
            try:
                due_date = datetime.fromisoformat(due.replace('Z', '+00:00')) if isinstance(due, str) else due
                return datetime.now() > due_date
            except:
                return False
        return False
    
    def calculate_task_health_score(self, task, complexity_data, delay_data):
        """Calculate task health score"""
        score = 50
        
        # Status bonus/penalty
        status = task.get('status', 'todo')
        status_scores = {'completed': 30, 'in_progress': 10, 'todo': 0, 'delayed': -30}
        score += status_scores.get(status, 0)
        
        # Estimation accuracy
        estimated = task.get('estimatedHours', 0)
        actual = task.get('actualHours', 0)
        if estimated > 0 and actual > 0:
            ratio = actual / estimated
            if 0.8 <= ratio <= 1.2:
                score += 20
            elif ratio > 1.5:
                score -= 15
        
        # Complexity penalty
        if complexity_data is not None and complexity_data.get('complexity_level') == 'high':
            score -= 10
        
        # Delay penalty
        if delay_data is not None:
            preventability = delay_data.get('preventability_score', 50)
            if preventability > 70:  # Highly preventable
                score -= 20
        
        return max(0, min(100, score))
    
    def convert_priority_to_numeric(self, priority):
        """Convert priority to numeric value"""
        mapping = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        return mapping.get(priority.lower(), 2)
    
    def convert_status_to_numeric(self, status):
        """Convert status to numeric value"""
        mapping = {'todo': 1, 'in_progress': 2, 'review': 3, 'completed': 4, 'delayed': 5}
        return mapping.get(status.lower(), 1)
    
    def calculate_team_productivity(self, tasks):
        """Calculate team productivity score"""
        if not tasks:
            return 0
        
        completed_tasks = len([t for t in tasks if t.get('status') == 'completed'])
        total_actual_hours = sum(t.get('actualHours', 0) for t in tasks if t.get('actualHours'))
        
        if total_actual_hours == 0:
            return 0
        
        # Tasks completed per hour
        productivity = completed_tasks / total_actual_hours * 100
        return min(100, productivity)
    
    def identify_team_domain_focus(self, team, tasks):
        """Identify team's primary domain focus"""
        if not tasks:
            return 'unknown'
        
        domains = [t.get('domain', '') for t in tasks if t.get('domain')]
        if domains:
            from collections import Counter
            return Counter(domains).most_common(1)[0][0]
        return 'general'
    
    def calculate_team_performance_rating(self, team, tasks):
        """Calculate team performance rating"""
        if not tasks:
            return 'unknown'
        
        completed_ratio = len([t for t in tasks if t.get('status') == 'completed']) / len(tasks)
        delayed_ratio = len([t for t in tasks if t.get('status') == 'delayed']) / len(tasks)
        
        score = completed_ratio * 100 - delayed_ratio * 50
        
        if score >= 80:
            return 'excellent'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'average'
        else:
            return 'needs_improvement'
    
    def calculate_workload_balance(self, team, tasks):
        """Calculate workload balance score"""
        member_ids = team.get('memberIds', [])
        if not member_ids or not tasks:
            return 50
        
        # Simple workload distribution check
        task_counts = {}
        for task in tasks:
            assignee = task.get('assigneeId', '')
            if assignee in member_ids:
                task_counts[assignee] = task_counts.get(assignee, 0) + 1
        
        if not task_counts:
            return 50
        
        values = list(task_counts.values())
        if len(set(values)) == 1:  # Perfect balance
            return 100
        
        # Calculate variance
        avg_tasks = sum(values) / len(values)
        variance = sum((v - avg_tasks) ** 2 for v in values) / len(values)
        
        # Convert to balance score (lower variance = higher balance)
        balance_score = max(0, 100 - (variance * 10))
        return balance_score
    
    def identify_team_risk_factors(self, team, tasks):
        """Identify team risk factors"""
        risks = []
        
        if len(team.get('memberIds', [])) < 3:
            risks.append('small_team_size')
        
        delayed_ratio = len([t for t in tasks if t.get('status') == 'delayed']) / len(tasks) if tasks else 0
        if delayed_ratio > 0.3:
            risks.append('high_delay_rate')
        
        if len(team.get('skills', [])) < 3:
            risks.append('limited_skill_set')
        
        return ', '.join(risks) if risks else 'none_identified'
    
    def calculate_days_overdue(self, task):
        """Calculate days overdue for task"""
        due = task.get('dueDate')
        if due:
            try:
                due_date = datetime.fromisoformat(due.replace('Z', '+00:00')) if isinstance(due, str) else due
                days_over = (datetime.now() - due_date).days
                return max(0, days_over)
            except:
                return 0
        return 0
    
    def categorize_preventability(self, score):
        """Categorize preventability score"""
        if score >= 70:
            return 'highly_preventable'
        elif score >= 40:
            return 'moderately_preventable'
        else:
            return 'difficult_to_prevent'
    
    def calculate_delay_impact_on_project(self, task, project_tasks):
        """Calculate impact of delay on overall project"""
        if not project_tasks:
            return 'unknown'
        
        # Check if task blocks others
        task_id = task['id']
        blocking_count = 0
        for other_task in project_tasks:
            if task_id in other_task.get('dependencies', []):
                blocking_count += 1
        
        if blocking_count > 2:
            return 'high'
        elif blocking_count > 0:
            return 'medium'
        else:
            return 'low'
    
    def check_if_blocks_others(self, task, all_tasks):
        """Check if task blocks other tasks"""
        task_id = task['id']
        for other_task in all_tasks:
            if task_id in other_task.get('dependencies', []):
                return True
        return False
    
    def assess_delay_severity(self, task, delay_data):
        """Assess delay severity"""
        if delay_data is None:
            return 'medium'
        
        category = delay_data.get('delay_category', '')
        if category in ['technical_complexity', 'dependency_issues']:
            return 'high'
        elif category in ['requirement_changes', 'resource_constraints']:
            return 'medium'
        else:
            return 'low'
    
    def suggest_delay_action(self, delay_data):
        """Suggest action for delay"""
        if delay_data is None:
            return 'review_and_reassess'
        
        category = delay_data.get('delay_category', '')
        actions = {
            'technical_complexity': 'allocate_senior_resources',
            'requirement_changes': 'clarify_requirements',
            'resource_constraints': 'reallocate_resources',
            'dependency_issues': 'resolve_blockers',
            'compliance_requirements': 'engage_compliance_team'
        }
        
        return actions.get(category, 'general_review')
    
    def extract_lessons_learned(self, task, delay_data):
        """Extract lessons learned from delay"""
        if delay_data is None:
            return 'improve_estimation_process'
        
        preventability = delay_data.get('preventability_score', 50)
        if preventability > 70:
            return 'better_planning_needed'
        elif preventability < 30:
            return 'external_factors_consideration'
        else:
            return 'process_improvement_opportunity'
    
    def assess_alert_urgency(self, alert):
        """Assess alert urgency"""
        alert_type = alert.get('type', 'minor')
        if alert_type == 'critical':
            return 'immediate'
        elif alert_type == 'major':
            return 'high'
        else:
            return 'medium'
    
    def assess_alert_impact_scope(self, alert):
        """Assess alert impact scope"""
        message = alert.get('message', '').lower()
        if 'project' in message or 'blocking' in message:
            return 'project_wide'
        elif 'task' in message:
            return 'task_level'
        else:
            return 'limited'
    
    # Additional helper methods for comprehensive risk assessment
    
    def calculate_comprehensive_risk_score(self, project, tasks, sentiment_data):
        """Calculate comprehensive risk score"""
        score = 0
        
        # Schedule risk
        if project.get('status') == 'delayed':
            score += 25
        
        # Resource risk
        delayed_task_ratio = len([t for t in tasks if t.get('status') == 'delayed']) / len(tasks) if tasks else 0
        score += delayed_task_ratio * 30
        
        # Complexity risk
        if sentiment_data is not None:
            complexity_level = sentiment_data.get('complexity_level', 'medium')
            if complexity_level == 'high':
                score += 20
            elif complexity_level == 'medium':
                score += 10
        
        # Sentiment risk
        if sentiment_data is not None:
            sentiment_score = sentiment_data.get('sentiment_score', 0)
            if sentiment_score < -0.3:
                score += 15
        
        return min(100, score)
    
    def categorize_risk_level(self, risk_score):
        """Categorize risk level based on score"""
        if risk_score >= 70:
            return 'critical'
        elif risk_score >= 50:
            return 'high'
        elif risk_score >= 30:
            return 'medium'
        else:
            return 'low'
    
    def assess_schedule_risk(self, project, tasks):
        """Assess schedule risk"""
        if project.get('status') == 'delayed':
            return 'high'
        
        delayed_tasks = len([t for t in tasks if t.get('status') == 'delayed'])
        if delayed_tasks > len(tasks) * 0.3:
            return 'high'
        elif delayed_tasks > len(tasks) * 0.1:
            return 'medium'
        else:
            return 'low'
    
    def assess_budget_risk(self, project, tasks):
        """Assess budget risk"""
        total_estimated = sum(t.get('estimatedHours', 0) for t in tasks)
        total_actual = sum(t.get('actualHours', 0) for t in tasks if t.get('actualHours'))
        
        if total_estimated == 0:
            return 'medium'
        
        variance = (total_actual - total_estimated) / total_estimated
        
        if variance > 0.3:
            return 'high'
        elif variance > 0.1:
            return 'medium'
        else:
            return 'low'
    
    def assess_quality_risk(self, project, tasks):
        """Assess quality risk"""
        # Simple quality risk assessment based on rush indicators
        high_priority_tasks = len([t for t in tasks if t.get('priority') == 'critical'])
        if high_priority_tasks > len(tasks) * 0.5:
            return 'high'
        elif high_priority_tasks > len(tasks) * 0.2:
            return 'medium'
        else:
            return 'low'
    
    def assess_resource_risk(self, project, tasks):
        """Assess resource risk"""
        # Check for overloaded assignees
        assignee_counts = {}
        for task in tasks:
            assignee = task.get('assigneeId', '')
            if assignee:
                assignee_counts[assignee] = assignee_counts.get(assignee, 0) + 1
        
        if assignee_counts:
            max_tasks = max(assignee_counts.values())
            if max_tasks > 5:
                return 'high'
            elif max_tasks > 3:
                return 'medium'
            else:
                return 'low'
        
        return 'medium'
    
    def assess_technical_risk(self, project, tasks):
        """Assess technical risk"""
        # Based on complexity of tasks
        complex_tasks = 0
        for task in tasks:
            description = task.get('description', '').lower()
            if any(word in description for word in ['integration', 'architecture', 'complex', 'migration']):
                complex_tasks += 1
        
        complexity_ratio = complex_tasks / len(tasks) if tasks else 0
        
        if complexity_ratio > 0.3:
            return 'high'
        elif complexity_ratio > 0.1:
            return 'medium'
        else:
            return 'low'
    
    def identify_primary_risk_factors(self, project, tasks, sentiment_data):
        """Identify primary risk factors"""
        factors = []
        
        if project.get('status') == 'delayed':
            factors.append('project_delays')
        
        delayed_ratio = len([t for t in tasks if t.get('status') == 'delayed']) / len(tasks) if tasks else 0
        if delayed_ratio > 0.2:
            factors.append('task_delays')
        
        if sentiment_data is not None:
            if sentiment_data.get('sentiment_score', 0) < -0.3:
                factors.append('negative_sentiment')
            if sentiment_data.get('complexity_level') == 'high':
                factors.append('high_complexity')
        
        return ', '.join(factors) if factors else 'none_identified'
    
    def assess_mitigation_priority(self, risk_score):
        """Assess mitigation priority"""
        if risk_score >= 70:
            return 'immediate'
        elif risk_score >= 50:
            return 'high'
        elif risk_score >= 30:
            return 'medium'
        else:
            return 'low'
    
    def suggest_risk_mitigation_actions(self, project, tasks, risk_score):
        """Suggest risk mitigation actions"""
        actions = []
        
        if risk_score >= 70:
            actions.append('immediate_review_required')
            actions.append('escalate_to_management')
        elif risk_score >= 50:
            actions.append('additional_resources_needed')
            actions.append('timeline_adjustment')
        elif risk_score >= 30:
            actions.append('increased_monitoring')
            actions.append('process_improvement')
        
        return ', '.join(actions) if actions else 'continue_monitoring'
    
    def suggest_monitoring_frequency(self, risk_score):
        """Suggest monitoring frequency based on risk"""
        if risk_score >= 70:
            return 'daily'
        elif risk_score >= 50:
            return 'weekly'
        elif risk_score >= 30:
            return 'bi_weekly'
        else:
            return 'monthly'
    
    def assess_potential_impact(self, project, tasks, risk_score):
        """Assess potential impact of risks"""
        if risk_score >= 70:
            return 'project_failure'
        elif risk_score >= 50:
            return 'significant_delays'
        elif risk_score >= 30:
            return 'minor_delays'
        else:
            return 'minimal_impact'
    
    # Executive dashboard calculations
    
    def calculate_average_project_health(self):
        """Calculate average project health score"""
        health_scores = []
        
        for project in self.nlp_analyzer.data['projects']:
            project_tasks = [t for t in self.nlp_analyzer.data['tasks'] if t.get('projectId') == project['id']]
            health_score = self.calculate_health_score(project, project_tasks, None)
            health_scores.append(health_score)
        
        return np.mean(health_scores) if health_scores else 50
    
    def calculate_overall_team_performance(self):
        """Calculate overall team performance score"""
        team_scores = []
        
        for team in self.nlp_analyzer.data['teams']:
            team_tasks = [t for t in self.nlp_analyzer.data['tasks'] 
                         if any(member_id in [u.get('id') for u in self.nlp_analyzer.data['users'] 
                               if u.get('id') in team.get('memberIds', [])] 
                               for member_id in [t.get('assigneeId')])]
            
            if team_tasks:
                completed_ratio = len([t for t in team_tasks if t.get('status') == 'completed']) / len(team_tasks)
                delayed_ratio = len([t for t in team_tasks if t.get('status') == 'delayed']) / len(team_tasks)
                score = completed_ratio * 100 - delayed_ratio * 50
                team_scores.append(max(0, score))
        
        return np.mean(team_scores) if team_scores else 50
    
    def calculate_risk_management_score(self):
        """Calculate risk management effectiveness score"""
        high_risk_projects = 0
        total_projects = len(self.nlp_analyzer.data['projects'])
        
        for project in self.nlp_analyzer.data['projects']:
            project_tasks = [t for t in self.nlp_analyzer.data['tasks'] if t.get('projectId') == project['id']]
            risk_level = self.assess_project_risk_level(project, project_tasks)
            if risk_level == 'high':
                high_risk_projects += 1
        
        if total_projects == 0:
            return 50
        
        risk_ratio = high_risk_projects / total_projects
        return max(0, 100 - (risk_ratio * 100))
    
    def calculate_process_maturity_score(self):
        """Calculate process maturity score"""
        # Simple process maturity based on estimation accuracy
        accurate_estimations = 0
        total_estimations = 0
        
        for task in self.nlp_analyzer.data['tasks']:
            estimated = task.get('estimatedHours', 0)
            actual = task.get('actualHours', 0)
            
            if estimated > 0 and actual > 0:
                ratio = actual / estimated
                if 0.8 <= ratio <= 1.2:
                    accurate_estimations += 1
                total_estimations += 1
        
        if total_estimations == 0:
            return 50
        
        return (accurate_estimations / total_estimations) * 100
    
    def identify_key_success_factors(self):
        """Identify key success factors"""
        factors = []
        
        # High completion rate
        total_tasks = len(self.nlp_analyzer.data['tasks'])
        completed_tasks = len([t for t in self.nlp_analyzer.data['tasks'] if t.get('status') == 'completed'])
        if completed_tasks / total_tasks > 0.7:
            factors.append('high_completion_rate')
        
        # Good estimation accuracy
        process_maturity = self.calculate_process_maturity_score()
        if process_maturity > 70:
            factors.append('accurate_estimations')
        
        # Low delay rate
        delayed_tasks = len([t for t in self.nlp_analyzer.data['tasks'] if t.get('status') == 'delayed'])
        if delayed_tasks / total_tasks < 0.2:
            factors.append('low_delay_rate')
        
        return ', '.join(factors) if factors else 'consistent_execution'
    
    def identify_critical_issues(self):
        """Identify critical issues"""
        issues = []
        
        # High delay rate
        total_tasks = len(self.nlp_analyzer.data['tasks'])
        delayed_tasks = len([t for t in self.nlp_analyzer.data['tasks'] if t.get('status') == 'delayed'])
        if delayed_tasks / total_tasks > 0.3:
            issues.append('high_delay_rate')
        
        # Poor estimation accuracy
        process_maturity = self.calculate_process_maturity_score()
        if process_maturity < 40:
            issues.append('poor_estimation_accuracy')
        
        # Multiple high-risk projects
        high_risk_count = 0
        for project in self.nlp_analyzer.data['projects']:
            project_tasks = [t for t in self.nlp_analyzer.data['tasks'] if t.get('projectId') == project['id']]
            if self.assess_project_risk_level(project, project_tasks) == 'high':
                high_risk_count += 1
        
        if high_risk_count > len(self.nlp_analyzer.data['projects']) * 0.3:
            issues.append('multiple_high_risk_projects')
        
        return ', '.join(issues) if issues else 'none_identified'


def main():
    """Main function to generate all CSV reports"""
    print("Starting Enhanced CSV Report Generation with Hugging Face NLP Analysis...")
    
    generator = EnhancedCSVReportGenerator()
    reports = generator.generate_comprehensive_reports()
    
    print("\n" + "="*80)
    print("CSV REPORT GENERATION COMPLETE")
    print("="*80)
    
    for report_name, df in reports.items():
        if not df.empty:
            print(f"✓ {report_name.replace('_', ' ').title()}: {len(df)} rows, {len(df.columns)} columns")
        else:
            print(f"⚠ {report_name.replace('_', ' ').title()}: No data available")
    
    print("\nAll reports saved to: python_analysis/results/")
    print("Files are properly formatted for Excel analysis and business reporting.")
    
    return reports


if __name__ == "__main__":
    main()