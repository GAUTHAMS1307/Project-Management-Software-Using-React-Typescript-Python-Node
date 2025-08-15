#!/usr/bin/env python3
"""
Enhanced Local Project Analyzer using NLP and Machine Learning
Works directly with local storage data without API calls
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import json

# Add server directory to path to import storage
sys.path.append(str(Path(__file__).parent.parent / 'server'))

try:
    from nlp_analyzer import NLPProjectAnalyzer
except ImportError:
    print("Warning: NLP analyzer not available, using basic analysis")
    NLPProjectAnalyzer = None


class EnhancedLocalAnalyzer:
    """Comprehensive local project analysis with NLP capabilities"""
    
    def __init__(self):
        self.storage = None
        self.nlp_analyzer = None
        self.setup_analyzers()
        self.load_data()
    
    def setup_analyzers(self):
        """Setup storage connection and NLP analyzer"""
        try:
            from storage import MemStorage
            self.storage = MemStorage()
            print("Local storage connection established")
            
            if NLPProjectAnalyzer:
                self.nlp_analyzer = NLPProjectAnalyzer()
                print("NLP analyzer initialized")
            else:
                print("Using basic analysis without NLP")
                
        except Exception as e:
            print(f"Error setting up analyzers: {e}")
    
    def load_data(self):
        """Load all data from local storage"""
        if not self.storage:
            print("No storage available")
            return
            
        try:
            # Load projects data
            self.projects = []
            for project in self.storage.projects.values():
                project_dict = {
                    'id': project.id,
                    'name': project.name,
                    'description': project.description,
                    'status': project.status,
                    'progress': project.progress,
                    'startDate': project.startDate,
                    'endDate': project.endDate,
                    'teamId': project.teamId,
                    'managerId': project.managerId,
                    'domains': project.domains
                }
                self.projects.append(project_dict)
            
            # Load tasks data
            self.tasks = []
            for task in self.storage.tasks.values():
                task_dict = {
                    'id': task.id,
                    'title': task.title,
                    'description': task.description,
                    'status': task.status,
                    'priority': task.priority,
                    'assigneeId': task.assigneeId,
                    'projectId': task.projectId,
                    'domain': task.domain,
                    'estimatedHours': task.estimatedHours,
                    'actualHours': task.actualHours,
                    'startDate': task.startDate,
                    'dueDate': task.dueDate,
                    'completedDate': task.completedDate,
                    'dependencies': task.dependencies,
                    'delayReason': getattr(task, 'delayReason', None)
                }
                self.tasks.append(task_dict)
            
            # Load teams data
            self.teams = []
            for team in self.storage.teams.values():
                team_dict = {
                    'id': team.id,
                    'name': team.name,
                    'description': team.description,
                    'leaderId': team.leaderId,
                    'memberIds': team.memberIds,
                    'skills': team.skills
                }
                self.teams.append(team_dict)
            
            # Load delay alerts data
            self.delay_alerts = []
            for alert in self.storage.delayAlerts.values():
                alert_dict = {
                    'id': alert.id,
                    'type': alert.type,
                    'title': alert.title,
                    'message': alert.message,
                    'taskId': alert.taskId,
                    'projectId': alert.projectId,
                    'isResolved': alert.isResolved,
                    'notificationSent': alert.notificationSent
                }
                self.delay_alerts.append(alert_dict)
            
            # Load users data
            self.users = []
            for user in self.storage.users.values():
                user_dict = {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'avatar': user.avatar
                }
                self.users.append(user_dict)
            
            print(f"Loaded data: {len(self.projects)} projects, {len(self.tasks)} tasks, {len(self.teams)} teams")
            
        except Exception as e:
            print(f"Error loading data: {e}")
    
    def run_comprehensive_analysis(self):
        """Run comprehensive analysis including NLP"""
        print("Starting comprehensive project analysis...")
        
        results = {
            'basic_metrics': self.calculate_basic_metrics(),
            'performance_analysis': self.analyze_performance(),
            'delay_analysis': self.analyze_delays(),
            'team_analysis': self.analyze_teams(),
            'risk_assessment': self.assess_risks(),
            'recommendations': self.generate_recommendations()
        }
        
        # Add NLP analysis if available
        if self.nlp_analyzer:
            try:
                results['nlp_analysis'] = {
                    'sentiment_analysis': self.nlp_analyzer.analyze_project_sentiment(self.projects),
                    'task_complexity': self.nlp_analyzer.analyze_task_complexity(self.tasks),
                    'delay_patterns': self.nlp_analyzer.analyze_delay_patterns(self.tasks, self.delay_alerts),
                    'team_communication': self.nlp_analyzer.analyze_team_communication_patterns(self.teams, self.projects)
                }
                
                # Generate insights from NLP analysis
                all_analyses = {
                    'sentiment_analysis': results['nlp_analysis']['sentiment_analysis'],
                    'task_complexity': results['nlp_analysis']['task_complexity'],
                    'delay_patterns': results['nlp_analysis']['delay_patterns'],
                    'team_communication': results['nlp_analysis']['team_communication']
                }
                
                results['nlp_insights'] = self.nlp_analyzer.generate_insight_report(all_analyses)
                print("NLP analysis completed")
                
            except Exception as e:
                print(f"Error in NLP analysis: {e}")
                results['nlp_analysis'] = None
        
        return results
    
    def calculate_basic_metrics(self):
        """Calculate basic project metrics"""
        total_projects = len(self.projects)
        completed_projects = len([p for p in self.projects if p['status'] == 'completed'])
        delayed_projects = len([p for p in self.projects if p['status'] == 'delayed'])
        in_progress_projects = len([p for p in self.projects if p['status'] == 'in_progress'])
        
        total_tasks = len(self.tasks)
        completed_tasks = len([t for t in self.tasks if t['status'] == 'completed'])
        delayed_tasks = len([t for t in self.tasks if t['status'] == 'delayed'])
        
        # Calculate average progress
        avg_progress = np.mean([p['progress'] for p in self.projects]) if self.projects else 0
        
        return {
            'total_projects': total_projects,
            'completed_projects': completed_projects,
            'delayed_projects': delayed_projects,
            'in_progress_projects': in_progress_projects,
            'project_completion_rate': completed_projects / total_projects * 100 if total_projects > 0 else 0,
            'project_delay_rate': delayed_projects / total_projects * 100 if total_projects > 0 else 0,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'delayed_tasks': delayed_tasks,
            'task_completion_rate': completed_tasks / total_tasks * 100 if total_tasks > 0 else 0,
            'task_delay_rate': delayed_tasks / total_tasks * 100 if total_tasks > 0 else 0,
            'average_project_progress': avg_progress
        }
    
    def analyze_performance(self):
        """Analyze team and project performance"""
        performance_metrics = {}
        
        # Project performance by status
        project_status_dist = {}
        for project in self.projects:
            status = project['status']
            project_status_dist[status] = project_status_dist.get(status, 0) + 1
        
        # Task performance by priority
        task_priority_dist = {}
        for task in self.tasks:
            priority = task['priority']
            task_priority_dist[priority] = task_priority_dist.get(priority, 0) + 1
        
        # Estimation accuracy
        estimation_data = []
        for task in self.tasks:
            if task['estimatedHours'] and task['actualHours']:
                ratio = task['actualHours'] / task['estimatedHours']
                estimation_data.append(ratio)
        
        avg_estimation_accuracy = np.mean(estimation_data) if estimation_data else 1.0
        
        # Domain distribution
        domain_dist = {}
        for task in self.tasks:
            domain = task.get('domain', 'unknown')
            domain_dist[domain] = domain_dist.get(domain, 0) + 1
        
        return {
            'project_status_distribution': project_status_dist,
            'task_priority_distribution': task_priority_dist,
            'average_estimation_accuracy': avg_estimation_accuracy,
            'estimation_variance': np.std(estimation_data) if estimation_data else 0,
            'domain_distribution': domain_dist,
            'total_estimated_hours': sum(t['estimatedHours'] for t in self.tasks if t['estimatedHours']),
            'total_actual_hours': sum(t['actualHours'] for t in self.tasks if t['actualHours'])
        }
    
    def analyze_delays(self):
        """Analyze delay patterns and causes"""
        delayed_tasks = [t for t in self.tasks if t['status'] == 'delayed']
        delay_reasons = {}
        
        for task in delayed_tasks:
            reason = task.get('delayReason', 'No reason provided')
            delay_reasons[reason] = delay_reasons.get(reason, 0) + 1
        
        # Delay alerts analysis
        alert_types = {}
        unresolved_alerts = 0
        for alert in self.delay_alerts:
            alert_types[alert['type']] = alert_types.get(alert['type'], 0) + 1
            if not alert['isResolved']:
                unresolved_alerts += 1
        
        # Calculate delay impact
        projects_with_delays = set(t['projectId'] for t in delayed_tasks)
        delay_impact_score = len(projects_with_delays) / len(self.projects) * 100 if self.projects else 0
        
        return {
            'delayed_task_count': len(delayed_tasks),
            'delay_reasons': delay_reasons,
            'alert_type_distribution': alert_types,
            'unresolved_alerts': unresolved_alerts,
            'projects_affected_by_delays': len(projects_with_delays),
            'delay_impact_score': delay_impact_score,
            'most_common_delay_reason': max(delay_reasons, key=delay_reasons.get) if delay_reasons else 'None'
        }
    
    def analyze_teams(self):
        """Analyze team structure and performance"""
        team_analysis = {}
        
        for team in self.teams:
            team_id = team['id']
            team_tasks = [t for t in self.tasks if t.get('teamId') == team_id or 
                         any(member in [u['id'] for u in self.users if u['id'] in team['memberIds']] 
                             for member in [t.get('assigneeId')])]
            
            completed_tasks = [t for t in team_tasks if t['status'] == 'completed']
            delayed_tasks = [t for t in team_tasks if t['status'] == 'delayed']
            
            team_analysis[team_id] = {
                'name': team['name'],
                'size': len(team['memberIds']),
                'skills_count': len(team['skills']),
                'total_tasks': len(team_tasks),
                'completed_tasks': len(completed_tasks),
                'delayed_tasks': len(delayed_tasks),
                'completion_rate': len(completed_tasks) / len(team_tasks) * 100 if team_tasks else 0,
                'delay_rate': len(delayed_tasks) / len(team_tasks) * 100 if team_tasks else 0,
                'primary_skills': team['skills'][:5] if team['skills'] else []
            }
        
        return team_analysis
    
    def assess_risks(self):
        """Assess project risks"""
        risk_factors = {}
        
        # High complexity projects
        high_complexity_projects = []
        for project in self.projects:
            complexity_score = 0
            project_tasks = [t for t in self.tasks if t['projectId'] == project['id']]
            
            # Factor 1: Number of domains
            complexity_score += len(project['domains']) * 10
            
            # Factor 2: Task complexity
            for task in project_tasks:
                if 'complex' in task['description'].lower():
                    complexity_score += 20
                if 'integration' in task['description'].lower():
                    complexity_score += 15
                if 'architecture' in task['description'].lower():
                    complexity_score += 25
            
            # Factor 3: Dependencies
            for task in project_tasks:
                complexity_score += len(task.get('dependencies', [])) * 5
            
            if complexity_score > 100:
                high_complexity_projects.append({
                    'project': project['name'],
                    'score': complexity_score,
                    'status': project['status']
                })
        
        # At-risk projects
        at_risk_projects = []
        for project in self.projects:
            risk_score = 0
            
            # Current delay status
            if project['status'] == 'delayed':
                risk_score += 50
            
            # Progress vs. time elapsed
            if project['endDate'] and project['startDate']:
                total_days = (project['endDate'] - project['startDate']).days
                elapsed_days = (datetime.now() - project['startDate']).days
                expected_progress = (elapsed_days / total_days) * 100 if total_days > 0 else 0
                
                if project['progress'] < expected_progress - 20:
                    risk_score += 30
            
            # Task delays
            project_tasks = [t for t in self.tasks if t['projectId'] == project['id']]
            delayed_task_ratio = len([t for t in project_tasks if t['status'] == 'delayed']) / len(project_tasks) if project_tasks else 0
            risk_score += delayed_task_ratio * 40
            
            if risk_score > 50:
                at_risk_projects.append({
                    'project': project['name'],
                    'risk_score': risk_score,
                    'status': project['status'],
                    'progress': project['progress']
                })
        
        return {
            'high_complexity_projects': high_complexity_projects,
            'at_risk_projects': at_risk_projects,
            'total_risk_projects': len(at_risk_projects),
            'complexity_risk_projects': len(high_complexity_projects)
        }
    
    def generate_recommendations(self):
        """Generate actionable recommendations"""
        recommendations = []
        
        # Based on delay analysis
        delayed_tasks = [t for t in self.tasks if t['status'] == 'delayed']
        if len(delayed_tasks) > len(self.tasks) * 0.2:  # More than 20% delayed
            recommendations.append({
                'priority': 'high',
                'category': 'project_management',
                'title': 'Address High Task Delay Rate',
                'description': f'{len(delayed_tasks)} tasks are currently delayed. Review project timelines and resource allocation.',
                'action_items': [
                    'Conduct delay root cause analysis',
                    'Review and adjust project timelines',
                    'Consider additional resource allocation'
                ]
            })
        
        # Based on estimation accuracy
        estimation_data = []
        for task in self.tasks:
            if task['estimatedHours'] and task['actualHours']:
                ratio = task['actualHours'] / task['estimatedHours']
                estimation_data.append(ratio)
        
        if estimation_data:
            avg_ratio = np.mean(estimation_data)
            if avg_ratio > 1.3:  # 30% over-estimation
                recommendations.append({
                    'priority': 'medium',
                    'category': 'estimation',
                    'title': 'Improve Task Estimation Accuracy',
                    'description': f'Tasks are taking {avg_ratio:.1f}x longer than estimated on average.',
                    'action_items': [
                        'Implement estimation training',
                        'Use historical data for better estimates',
                        'Break down complex tasks into smaller units'
                    ]
                })
        
        # Based on team workload
        team_workloads = {}
        for task in self.tasks:
            assignee = task.get('assigneeId')
            if assignee:
                if assignee not in team_workloads:
                    team_workloads[assignee] = {'total': 0, 'in_progress': 0}
                team_workloads[assignee]['total'] += 1
                if task['status'] == 'in_progress':
                    team_workloads[assignee]['in_progress'] += 1
        
        overloaded_members = []
        for member_id, workload in team_workloads.items():
            if workload['in_progress'] > 5:  # More than 5 active tasks
                member = next((u for u in self.users if u['id'] == member_id), None)
                if member:
                    overloaded_members.append(member['name'])
        
        if overloaded_members:
            recommendations.append({
                'priority': 'medium',
                'category': 'resource_management',
                'title': 'Balance Team Workload',
                'description': f'{len(overloaded_members)} team members appear overloaded.',
                'action_items': [
                    'Redistribute tasks among team members',
                    'Consider hiring additional resources',
                    'Implement workload monitoring'
                ]
            })
        
        return recommendations
    
    def save_analysis_report(self, results, filename=None):
        """Save comprehensive analysis report"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"comprehensive_analysis_report_{timestamp}.json"
        
        # Convert pandas DataFrames to dictionaries for JSON serialization
        serializable_results = {}
        for key, value in results.items():
            if isinstance(value, pd.DataFrame):
                serializable_results[key] = value.to_dict('records')
            elif isinstance(value, dict):
                serializable_results[key] = {}
                for subkey, subvalue in value.items():
                    if isinstance(subvalue, pd.DataFrame):
                        serializable_results[key][subkey] = subvalue.to_dict('records')
                    else:
                        serializable_results[key][subkey] = subvalue
            else:
                serializable_results[key] = value
        
        report_path = Path(__file__).parent / 'results' / filename
        report_path.parent.mkdir(exist_ok=True)
        
        try:
            with open(report_path, 'w') as f:
                json.dump(serializable_results, f, indent=2, default=str)
            
            print(f"Analysis report saved to: {report_path}")
            return str(report_path)
            
        except Exception as e:
            print(f"Error saving report: {e}")
            return None
    
    def generate_summary_report(self, results):
        """Generate human-readable summary report"""
        summary = []
        summary.append("=== SMART PROJECT PULSE - COMPREHENSIVE ANALYSIS REPORT ===")
        summary.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        summary.append("")
        
        # Basic metrics
        basic = results.get('basic_metrics', {})
        summary.append("📊 PROJECT OVERVIEW")
        summary.append(f"  • Total Projects: {basic.get('total_projects', 0)}")
        summary.append(f"  • Completed: {basic.get('completed_projects', 0)} ({basic.get('project_completion_rate', 0):.1f}%)")
        summary.append(f"  • Delayed: {basic.get('delayed_projects', 0)} ({basic.get('project_delay_rate', 0):.1f}%)")
        summary.append(f"  • Average Progress: {basic.get('average_project_progress', 0):.1f}%")
        summary.append("")
        
        summary.append("📋 TASK METRICS")
        summary.append(f"  • Total Tasks: {basic.get('total_tasks', 0)}")
        summary.append(f"  • Completed: {basic.get('completed_tasks', 0)} ({basic.get('task_completion_rate', 0):.1f}%)")
        summary.append(f"  • Delayed: {basic.get('delayed_tasks', 0)} ({basic.get('task_delay_rate', 0):.1f}%)")
        summary.append("")
        
        # Performance analysis
        performance = results.get('performance_analysis', {})
        summary.append("⚡ PERFORMANCE INSIGHTS")
        summary.append(f"  • Estimation Accuracy: {performance.get('average_estimation_accuracy', 1.0):.2f}x")
        summary.append(f"  • Total Estimated Hours: {performance.get('total_estimated_hours', 0)}")
        summary.append(f"  • Total Actual Hours: {performance.get('total_actual_hours', 0)}")
        summary.append("")
        
        # Risk assessment
        risks = results.get('risk_assessment', {})
        summary.append("⚠️ RISK ASSESSMENT")
        summary.append(f"  • High-Risk Projects: {risks.get('total_risk_projects', 0)}")
        summary.append(f"  • High-Complexity Projects: {risks.get('complexity_risk_projects', 0)}")
        summary.append("")
        
        # Recommendations
        recommendations = results.get('recommendations', [])
        if recommendations:
            summary.append("💡 KEY RECOMMENDATIONS")
            for i, rec in enumerate(recommendations[:3], 1):
                summary.append(f"  {i}. {rec.get('title', 'No title')}")
                summary.append(f"     Priority: {rec.get('priority', 'unknown').upper()}")
                summary.append(f"     {rec.get('description', 'No description')}")
            summary.append("")
        
        # NLP insights if available
        if 'nlp_insights' in results:
            nlp_insights = results['nlp_insights']
            summary.append("🧠 NLP ANALYSIS INSIGHTS")
            executive_summary = nlp_insights.get('executive_summary', {})
            summary.append(f"  • Projects Analyzed: {executive_summary.get('total_projects_analyzed', 0)}")
            summary.append(f"  • High-Risk Projects: {executive_summary.get('high_risk_projects', 0)}")
            
            key_findings = executive_summary.get('key_findings', [])
            for finding in key_findings[:3]:
                summary.append(f"  • {finding}")
            summary.append("")
        
        return "\n".join(summary)


def main():
    """Main function to run comprehensive analysis"""
    print("Starting Enhanced Local Project Analysis...")
    
    analyzer = EnhancedLocalAnalyzer()
    
    if not analyzer.storage:
        print("Error: Could not initialize storage. Exiting.")
        return
    
    # Run comprehensive analysis
    results = analyzer.run_comprehensive_analysis()
    
    # Save detailed report
    report_file = analyzer.save_analysis_report(results)
    
    # Generate and display summary
    summary = analyzer.generate_summary_report(results)
    print("\n" + "="*80)
    print(summary)
    print("="*80)
    
    if report_file:
        print(f"\nDetailed analysis saved to: {report_file}")
    
    return results


if __name__ == "__main__":
    main()