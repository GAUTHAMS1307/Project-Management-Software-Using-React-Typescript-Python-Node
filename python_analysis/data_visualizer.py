"""
Data visualization module for creating insightful charts and plots.
Generates various visualizations for project delay analysis and predictions.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any
import warnings

warnings.filterwarnings('ignore')

class DataVisualizer:
    def __init__(self):
        """Initialize the data visualizer with styling settings."""
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        self.figure_size = (12, 8)
        self.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
        
    def create_delay_distribution_chart(self, data: Dict[str, pd.DataFrame], save_path: str = None) -> str:
        """Create a chart showing delay distribution across tasks."""
        tasks_df = data['tasks']
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Task Delay Distribution Analysis', fontsize=16, fontweight='bold')
        
        # Delay by Priority
        axes[0, 0].pie(
            tasks_df['priority'].value_counts().values,
            labels=tasks_df['priority'].value_counts().index,
            autopct='%1.1f%%',
            colors=self.colors[:len(tasks_df['priority'].unique())]
        )
        axes[0, 0].set_title('Tasks by Priority')
        
        # Delay Days Distribution
        delay_data = tasks_df[tasks_df['delay_days'] > 0]['delay_days']
        if not delay_data.empty:
            axes[0, 1].hist(delay_data, bins=15, alpha=0.7, color=self.colors[1])
            axes[0, 1].set_title('Distribution of Delay Days')
            axes[0, 1].set_xlabel('Delay Days')
            axes[0, 1].set_ylabel('Frequency')
        
        # Status Distribution
        status_counts = tasks_df['status'].value_counts()
        axes[1, 0].bar(status_counts.index, status_counts.values, color=self.colors[:len(status_counts)])
        axes[1, 0].set_title('Tasks by Status')
        axes[1, 0].set_xlabel('Status')
        axes[1, 0].set_ylabel('Count')
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # Delay by Domain
        domain_delays = tasks_df.groupby('domain')['delay_days'].mean()
        axes[1, 1].bar(domain_delays.index, domain_delays.values, color=self.colors[:len(domain_delays)])
        axes[1, 1].set_title('Average Delay by Domain')
        axes[1, 1].set_xlabel('Domain')
        axes[1, 1].set_ylabel('Average Delay Days')
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            return save_path
        else:
            plt.show()
            return "Chart displayed"
    
    def create_project_timeline_chart(self, data: Dict[str, pd.DataFrame], save_path: str = None) -> str:
        """Create a Gantt-style timeline chart for projects."""
        projects_df = data['projects']
        
        fig, ax = plt.subplots(figsize=(14, 8))
        
        # Prepare data for timeline
        projects_df['start_date'] = pd.to_datetime(projects_df['start_date'])
        projects_df['end_date'] = pd.to_datetime(projects_df['end_date'])
        projects_df['duration'] = (projects_df['end_date'] - projects_df['start_date']).dt.days
        
        # Create timeline bars
        y_positions = range(len(projects_df))
        
        for i, (_, project) in enumerate(projects_df.iterrows()):
            # Determine color based on status
            color = {
                'planning': '#FFE66D',
                'in_progress': '#4ECDC4', 
                'delayed': '#FF6B6B',
                'completed': '#95E1D3'
            }.get(project['status'], '#CCCCCC')
            
            ax.barh(
                i, 
                project['duration'], 
                left=project['start_date'].toordinal(),
                color=color,
                alpha=0.8,
                height=0.6
            )
            
            # Add progress indicator
            progress_width = project['duration'] * (project['progress'] / 100)
            ax.barh(
                i,
                progress_width,
                left=project['start_date'].toordinal(),
                color='darkgreen',
                alpha=0.6,
                height=0.3
            )
        
        # Formatting
        ax.set_yticks(y_positions)
        ax.set_yticklabels([name[:25] + '...' if len(name) > 25 else name for name in projects_df['name']])
        ax.set_xlabel('Timeline')
        ax.set_title('Project Timeline and Progress', fontsize=16, fontweight='bold')
        
        # Format x-axis dates
        import matplotlib.dates as mdates
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
        
        # Add legend
        legend_elements = [
            plt.Rectangle((0,0),1,1, color='#FFE66D', alpha=0.8, label='Planning'),
            plt.Rectangle((0,0),1,1, color='#4ECDC4', alpha=0.8, label='In Progress'),
            plt.Rectangle((0,0),1,1, color='#FF6B6B', alpha=0.8, label='Delayed'),
            plt.Rectangle((0,0),1,1, color='#95E1D3', alpha=0.8, label='Completed'),
            plt.Rectangle((0,0),1,1, color='darkgreen', alpha=0.6, label='Progress')
        ]
        ax.legend(handles=legend_elements, loc='upper right')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            return save_path
        else:
            plt.show()
            return "Chart displayed"
    
    def create_team_performance_chart(self, data: Dict[str, pd.DataFrame], save_path: str = None) -> str:
        """Create charts showing team and individual performance metrics."""
        tasks_df = data['tasks']
        users_df = data['users']
        
        # Merge task and user data
        merged_df = tasks_df.merge(users_df[['id', 'name', 'role']], 
                                 left_on='assignee_id', right_on='id', 
                                 how='left', suffixes=('', '_user'))
        
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle('Team Performance Analysis', fontsize=16, fontweight='bold')
        
        # Task completion by user
        user_task_counts = merged_df.groupby('name').agg({
            'id': 'count',
            'delay_days': 'mean',
            'progress_ratio': 'mean'
        }).round(2)
        
        # Tasks completed per user
        axes[0, 0].bar(user_task_counts.index, user_task_counts['id'], color=self.colors[0])
        axes[0, 0].set_title('Tasks Assigned by User')
        axes[0, 0].set_xlabel('User')
        axes[0, 0].set_ylabel('Number of Tasks')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Average delay by user
        axes[0, 1].bar(user_task_counts.index, user_task_counts['delay_days'], color=self.colors[1])
        axes[0, 1].set_title('Average Delay Days by User')
        axes[0, 1].set_xlabel('User')
        axes[0, 1].set_ylabel('Average Delay Days')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # Performance by role
        role_performance = merged_df.groupby('role').agg({
            'delay_days': 'mean',
            'estimated_hours': 'mean',
            'actual_hours': 'mean'
        }).round(2)
        
        x_pos = np.arange(len(role_performance.index))
        width = 0.25
        
        axes[1, 0].bar(x_pos - width, role_performance['delay_days'], width, 
                      label='Avg Delay Days', color=self.colors[2])
        axes[1, 0].bar(x_pos, role_performance['estimated_hours']/8, width, 
                      label='Avg Est. Days', color=self.colors[3])
        axes[1, 0].bar(x_pos + width, role_performance['actual_hours']/8, width, 
                      label='Avg Actual Days', color=self.colors[4])
        
        axes[1, 0].set_xlabel('Role')
        axes[1, 0].set_ylabel('Days')
        axes[1, 0].set_title('Performance Metrics by Role')
        axes[1, 0].set_xticks(x_pos)
        axes[1, 0].set_xticklabels(role_performance.index)
        axes[1, 0].legend()
        
        # Task status distribution
        status_data = merged_df['status'].value_counts()
        axes[1, 1].pie(status_data.values, labels=status_data.index, autopct='%1.1f%%', 
                      colors=self.colors[:len(status_data)])
        axes[1, 1].set_title('Overall Task Status Distribution')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            return save_path
        else:
            plt.show()
            return "Chart displayed"
    
    def create_prediction_analysis_chart(self, predictions_data: List[Dict], save_path: str = None) -> str:
        """Create charts showing prediction analysis results."""
        if not predictions_data:
            print("No prediction data available")
            return "No data"
        
        pred_df = pd.DataFrame(predictions_data)
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Delay Prediction Analysis', fontsize=16, fontweight='bold')
        
        # Risk score distribution
        if 'risk_score' in pred_df.columns:
            axes[0, 0].hist(pred_df['risk_score'], bins=20, alpha=0.7, color=self.colors[0])
            axes[0, 0].set_title('Risk Score Distribution')
            axes[0, 0].set_xlabel('Risk Score')
            axes[0, 0].set_ylabel('Frequency')
            axes[0, 0].axvline(pred_df['risk_score'].mean(), color='red', linestyle='--', 
                              label=f'Mean: {pred_df["risk_score"].mean():.1f}')
            axes[0, 0].legend()
        
        # Predicted delay distribution
        if 'predicted_delay_days' in pred_df.columns:
            axes[0, 1].hist(pred_df['predicted_delay_days'], bins=15, alpha=0.7, color=self.colors[1])
            axes[0, 1].set_title('Predicted Delay Days Distribution')
            axes[0, 1].set_xlabel('Predicted Delay Days')
            axes[0, 1].set_ylabel('Frequency')
        
        # Category predictions
        if 'predicted_category' in pred_df.columns:
            category_counts = pred_df['predicted_category'].value_counts()
            axes[1, 0].bar(category_counts.index, category_counts.values, color=self.colors[:len(category_counts)])
            axes[1, 0].set_title('Predicted Delay Categories')
            axes[1, 0].set_xlabel('Category')
            axes[1, 0].set_ylabel('Count')
            axes[1, 0].tick_params(axis='x', rotation=45)
        
        # Risk vs Predicted Delay scatter plot
        if 'risk_score' in pred_df.columns and 'predicted_delay_days' in pred_df.columns:
            axes[1, 1].scatter(pred_df['risk_score'], pred_df['predicted_delay_days'], 
                             alpha=0.6, color=self.colors[3])
            axes[1, 1].set_xlabel('Risk Score')
            axes[1, 1].set_ylabel('Predicted Delay Days')
            axes[1, 1].set_title('Risk Score vs Predicted Delay')
            
            # Add trend line
            z = np.polyfit(pred_df['risk_score'], pred_df['predicted_delay_days'], 1)
            p = np.poly1d(z)
            axes[1, 1].plot(pred_df['risk_score'], p(pred_df['risk_score']), "r--", alpha=0.8)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            return save_path
        else:
            plt.show()
            return "Chart displayed"
    
    def create_comprehensive_dashboard(self, data: Dict[str, pd.DataFrame], 
                                     predictions_data: List[Dict] = None, 
                                     save_path: str = None) -> str:
        """Create a comprehensive dashboard with multiple visualizations."""
        fig = plt.figure(figsize=(20, 24))
        
        # Main title
        fig.suptitle('Smart Project Pulse - Comprehensive Analysis Dashboard', 
                    fontsize=24, fontweight='bold', y=0.98)
        
        # Create subplots with different sizes
        gs = fig.add_gridspec(6, 4, height_ratios=[1, 1, 1, 1, 1, 1], hspace=0.3, wspace=0.3)
        
        tasks_df = data['tasks']
        projects_df = data['projects']
        users_df = data['users']
        
        # 1. Project Status Overview
        ax1 = fig.add_subplot(gs[0, :2])
        project_status = projects_df['status'].value_counts()
        ax1.pie(project_status.values, labels=project_status.index, autopct='%1.1f%%',
               colors=self.colors[:len(project_status)])
        ax1.set_title('Project Status Distribution', fontsize=14, fontweight='bold')
        
        # 2. Task Priority Breakdown
        ax2 = fig.add_subplot(gs[0, 2:])
        priority_counts = tasks_df['priority'].value_counts()
        bars = ax2.bar(priority_counts.index, priority_counts.values, color=self.colors[:len(priority_counts)])
        ax2.set_title('Task Priority Breakdown', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Number of Tasks')
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                    f'{int(height)}', ha='center', va='bottom')
        
        # 3. Delay Analysis
        ax3 = fig.add_subplot(gs[1, :2])
        delay_data = tasks_df[tasks_df['delay_days'] > 0]['delay_days']
        if not delay_data.empty:
            ax3.hist(delay_data, bins=15, alpha=0.7, color=self.colors[2])
            ax3.axvline(delay_data.mean(), color='red', linestyle='--', 
                       label=f'Mean: {delay_data.mean():.1f} days')
            ax3.set_xlabel('Delay Days')
            ax3.set_ylabel('Frequency')
            ax3.set_title('Delay Distribution Analysis', fontsize=14, fontweight='bold')
            ax3.legend()
        
        # 4. Domain Performance
        ax4 = fig.add_subplot(gs[1, 2:])
        domain_performance = tasks_df.groupby('domain').agg({
            'delay_days': 'mean',
            'progress_ratio': 'mean'
        }).round(2)
        
        x_pos = np.arange(len(domain_performance.index))
        width = 0.35
        
        ax4.bar(x_pos - width/2, domain_performance['delay_days'], width, 
               label='Avg Delay Days', color=self.colors[0])
        ax4_twin = ax4.twinx()
        ax4_twin.bar(x_pos + width/2, domain_performance['progress_ratio'] * 10, width, 
                    label='Progress Ratio (×10)', color=self.colors[1], alpha=0.7)
        
        ax4.set_xlabel('Domain')
        ax4.set_ylabel('Average Delay Days', color=self.colors[0])
        ax4_twin.set_ylabel('Progress Ratio (×10)', color=self.colors[1])
        ax4.set_title('Performance by Domain', fontsize=14, fontweight='bold')
        ax4.set_xticks(x_pos)
        ax4.set_xticklabels(domain_performance.index, rotation=45)
        
        # 5. Team Performance
        ax5 = fig.add_subplot(gs[2, :])
        merged_df = tasks_df.merge(users_df[['id', 'name', 'role']], 
                                 left_on='assignee_id', right_on='id', 
                                 how='left', suffixes=('', '_user'))
        
        user_performance = merged_df.groupby('name').agg({
            'id': 'count',
            'delay_days': 'mean',
            'estimated_hours': 'sum',
            'actual_hours': 'sum'
        }).round(2)
        
        # Sort by task count
        user_performance = user_performance.sort_values('id', ascending=False)
        
        x_pos = np.arange(len(user_performance.index))
        width = 0.2
        
        ax5.bar(x_pos - width*1.5, user_performance['id'], width, 
               label='Tasks Assigned', color=self.colors[0])
        ax5.bar(x_pos - width/2, user_performance['delay_days'], width, 
               label='Avg Delay Days', color=self.colors[1])
        ax5.bar(x_pos + width/2, user_performance['estimated_hours']/8, width, 
               label='Est. Days', color=self.colors[2])
        ax5.bar(x_pos + width*1.5, user_performance['actual_hours']/8, width, 
               label='Actual Days', color=self.colors[3])
        
        ax5.set_xlabel('Team Members')
        ax5.set_ylabel('Metrics')
        ax5.set_title('Individual Performance Metrics', fontsize=14, fontweight='bold')
        ax5.set_xticks(x_pos)
        ax5.set_xticklabels([name[:10] + '...' if len(name) > 10 else name 
                           for name in user_performance.index], rotation=45)
        ax5.legend()
        
        # 6. Timeline view (simplified)
        ax6 = fig.add_subplot(gs[3, :])
        
        # Sort projects by start date
        timeline_projects = projects_df.sort_values('start_date').head(10)  # Show top 10 projects
        
        y_positions = range(len(timeline_projects))
        
        for i, (_, project) in enumerate(timeline_projects.iterrows()):
            color = {
                'planning': '#FFE66D',
                'in_progress': '#4ECDC4', 
                'delayed': '#FF6B6B',
                'completed': '#95E1D3'
            }.get(project['status'], '#CCCCCC')
            
            start_ord = project['start_date'].toordinal() if pd.notna(project['start_date']) else datetime.now().toordinal()
            end_ord = project['end_date'].toordinal() if pd.notna(project['end_date']) else datetime.now().toordinal()
            duration = end_ord - start_ord
            
            ax6.barh(i, duration, left=start_ord, color=color, alpha=0.8, height=0.6)
            
            # Add project name
            project_name = project['name'][:20] + '...' if len(project['name']) > 20 else project['name']
            ax6.text(start_ord - 10, i, project_name, va='center', ha='right', fontsize=8)
        
        ax6.set_yticks(y_positions)
        ax6.set_yticklabels(['' for _ in y_positions])
        ax6.set_xlabel('Timeline')
        ax6.set_title('Project Timeline Overview', fontsize=14, fontweight='bold')
        
        # 7. Key Metrics Summary
        ax7 = fig.add_subplot(gs[4, :2])
        ax7.axis('off')
        
        # Calculate key metrics
        total_projects = len(projects_df)
        total_tasks = len(tasks_df)
        delayed_tasks = len(tasks_df[tasks_df['delay_days'] > 0])
        avg_delay = tasks_df['delay_days'].mean()
        completion_rate = len(tasks_df[tasks_df['status'] == 'completed']) / total_tasks * 100
        
        metrics_text = f"""
        KEY METRICS SUMMARY
        
        Total Projects: {total_projects}
        Total Tasks: {total_tasks}
        Tasks with Delays: {delayed_tasks}
        Average Delay: {avg_delay:.1f} days
        Completion Rate: {completion_rate:.1f}%
        
        High Priority Tasks: {len(tasks_df[tasks_df['priority'] == 'critical'])}
        In Progress: {len(tasks_df[tasks_df['status'] == 'in_progress'])}
        """
        
        ax7.text(0.05, 0.95, metrics_text, transform=ax7.transAxes, fontsize=12,
                verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))
        
        # 8. Predictions Summary (if available)
        ax8 = fig.add_subplot(gs[4, 2:])
        ax8.axis('off')
        
        if predictions_data:
            pred_df = pd.DataFrame(predictions_data)
            high_risk_count = len(pred_df[pred_df['risk_score'] > 70]) if 'risk_score' in pred_df.columns else 0
            avg_predicted_delay = pred_df['predicted_delay_days'].mean() if 'predicted_delay_days' in pred_df.columns else 0
            
            pred_text = f"""
            PREDICTION SUMMARY
            
            Predictions Made: {len(predictions_data)}
            High Risk Tasks: {high_risk_count}
            Avg Predicted Delay: {avg_predicted_delay:.1f} days
            
            Recommendations:
            • Monitor high-risk tasks closely
            • Review resource allocation
            • Consider timeline adjustments
            """
        else:
            pred_text = """
            PREDICTION SUMMARY
            
            No predictions available
            Run prediction analysis to
            get insights on:
            
            • Risk assessment
            • Delay forecasting
            • Resource optimization
            """
        
        ax8.text(0.05, 0.95, pred_text, transform=ax8.transAxes, fontsize=12,
                verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle='round', facecolor='lightgreen', alpha=0.8))
        
        # 9. Alerts and Issues
        ax9 = fig.add_subplot(gs[5, :])
        
        if 'delay_alerts' in data and not data['delay_alerts'].empty:
            alerts_df = data['delay_alerts']
            alert_summary = alerts_df.groupby(['type', 'is_resolved']).size().unstack(fill_value=0)
            
            alert_summary.plot(kind='bar', ax=ax9, color=['#FF6B6B', '#4ECDC4'])
            ax9.set_title('Delay Alerts Summary', fontsize=14, fontweight='bold')
            ax9.set_xlabel('Alert Type')
            ax9.set_ylabel('Count')
            ax9.legend(['Unresolved', 'Resolved'])
            ax9.tick_params(axis='x', rotation=45)
        else:
            ax9.text(0.5, 0.5, 'No delay alerts data available', 
                    transform=ax9.transAxes, ha='center', va='center', fontsize=12)
            ax9.set_title('Delay Alerts Summary', fontsize=14, fontweight='bold')
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            return save_path
        else:
            plt.show()
            return "Dashboard displayed"
    
    def save_all_charts(self, data: Dict[str, pd.DataFrame], 
                       predictions_data: List[Dict] = None, 
                       output_dir: str = "python_analysis/charts/") -> Dict[str, str]:
        """Generate and save all available charts."""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        saved_charts = {}
        
        # Generate all charts
        try:
            saved_charts['delay_distribution'] = self.create_delay_distribution_chart(
                data, f"{output_dir}delay_distribution.png"
            )
        except Exception as e:
            print(f"Error creating delay distribution chart: {e}")
        
        try:
            saved_charts['project_timeline'] = self.create_project_timeline_chart(
                data, f"{output_dir}project_timeline.png"
            )
        except Exception as e:
            print(f"Error creating project timeline chart: {e}")
        
        try:
            saved_charts['team_performance'] = self.create_team_performance_chart(
                data, f"{output_dir}team_performance.png"
            )
        except Exception as e:
            print(f"Error creating team performance chart: {e}")
        
        if predictions_data:
            try:
                saved_charts['prediction_analysis'] = self.create_prediction_analysis_chart(
                    predictions_data, f"{output_dir}prediction_analysis.png"
                )
            except Exception as e:
                print(f"Error creating prediction analysis chart: {e}")
        
        try:
            saved_charts['comprehensive_dashboard'] = self.create_comprehensive_dashboard(
                data, predictions_data, f"{output_dir}comprehensive_dashboard.png"
            )
        except Exception as e:
            print(f"Error creating comprehensive dashboard: {e}")
        
        return saved_charts