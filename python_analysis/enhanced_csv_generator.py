#!/usr/bin/env python3
"""
Enhanced CSV Report Generator for Smart Project Pulse
Generates project schedule reports in the proper format matching the reference image
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import csv
from pathlib import Path
import json

class EnhancedCSVGenerator:
    """Generate professional project schedule CSV reports"""
    
    def __init__(self):
        self.results_dir = Path(__file__).parent / 'results'
        self.results_dir.mkdir(exist_ok=True)
    
    def load_project_data(self):
        """Load or create comprehensive project data"""
        return {
            'projects': [
                {
                    'id': 'proj1',
                    'name': 'E-commerce Platform Development',
                    'description': 'Complete e-commerce platform with modern UI/UX',
                    'status': 'in_progress',
                    'progress': 75,
                    'manager': 'Sarah Johnson'
                },
                {
                    'id': 'proj2',
                    'name': 'Mobile Application Development',
                    'description': 'Cross-platform mobile app with real-time features',
                    'status': 'in_progress',
                    'progress': 60,
                    'manager': 'Michael Chen'
                }
            ],
            'tasks': [
                {
                    'id': 'task1', 'title': 'Tooling order / Go Ahead release',
                    'responsible': 'RENAULT', 'estimated_days': 3,
                    'start_date': '2025-06-01', 'finish_date': '2025-06-03',
                    'completion': 100, 'status': 'completed', 'priority': 'A'
                },
                {
                    'id': 'task2', 'title': 'Casting Tool Design',
                    'responsible': 'Dharmaraja', 'estimated_days': 7,
                    'start_date': '2025-06-02', 'finish_date': '2025-06-08',
                    'completion': 100, 'status': 'completed', 'priority': 'P'
                },
                {
                    'id': 'task3', 'title': 'Casting Tool Manufacturing',
                    'responsible': 'Dharmaraja', 'estimated_days': 14,
                    'start_date': '2025-06-09', 'finish_date': '2025-06-22',
                    'completion': 100, 'status': 'completed', 'priority': 'A'
                },
                {
                    'id': 'task4', 'title': 'Casting Tool Trial & Proveout',
                    'responsible': 'Dharmaraja', 'estimated_days': 7,
                    'start_date': '2025-06-23', 'finish_date': '2025-06-29',
                    'completion': 100, 'status': 'completed', 'priority': 'P'
                },
                {
                    'id': 'task5', 'title': 'Casting Submission to Machine shop',
                    'responsible': 'Dharmaraja', 'estimated_days': 7,
                    'start_date': '2025-06-30', 'finish_date': '2025-07-06',
                    'completion': 100, 'status': 'completed', 'priority': 'P'
                },
                {
                    'id': 'task6', 'title': 'Machining Fixture Design',
                    'responsible': 'Murugesan', 'estimated_days': 7,
                    'start_date': '2025-07-02', 'finish_date': '2025-07-08',
                    'completion': 100, 'status': 'completed', 'priority': 'P'
                },
                {
                    'id': 'task7', 'title': 'Machining Fixture Manufacturing',
                    'responsible': 'Kathirvel', 'estimated_days': 21,
                    'start_date': '2025-07-09', 'finish_date': '2025-07-29',
                    'completion': 100, 'status': 'completed', 'priority': 'A'
                },
                {
                    'id': 'task8', 'title': 'Production Gauges Design',
                    'responsible': 'Murugesan', 'estimated_days': 7,
                    'start_date': '2025-08-02', 'finish_date': '2025-08-08',
                    'completion': 100, 'status': 'completed', 'priority': 'P'
                },
                {
                    'id': 'task9', 'title': 'Production Gauges Manufacturing',
                    'responsible': 'Radhika', 'estimated_days': 21,
                    'start_date': '2025-08-09', 'finish_date': '2025-08-29',
                    'completion': 100, 'status': 'completed', 'priority': 'P'
                },
                {
                    'id': 'task10', 'title': 'Trials, adjust & Proveout',
                    'responsible': 'Prakash', 'estimated_days': 7,
                    'start_date': '2025-08-07', 'finish_date': '2025-08-13',
                    'completion': 50, 'status': 'in_progress', 'priority': 'A'
                },
                {
                    'id': 'task11', 'title': 'OT Sample preparation & submission',
                    'responsible': 'Kumar', 'estimated_days': 7,
                    'start_date': '2025-08-14', 'finish_date': '2025-08-20',
                    'completion': 0, 'status': 'planned', 'priority': 'P'
                },
                {
                    'id': 'task12', 'title': 'Sample approval',
                    'responsible': 'RENAULT', 'estimated_days': 7,
                    'start_date': '2025-08-21', 'finish_date': '2025-08-27',
                    'completion': 0, 'status': 'planned', 'priority': 'A'
                }
            ]
        }
    
    def generate_timeline_visual(self, start_date, finish_date, completion, timeline_start, timeline_end):
        """Generate ASCII timeline visualization"""
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            finish_dt = datetime.strptime(finish_date, '%Y-%m-%d')
            timeline_start_dt = datetime.strptime(timeline_start, '%Y-%m-%d')
            timeline_end_dt = datetime.strptime(timeline_end, '%Y-%m-%d')
            
            # Calculate positions
            total_days = (timeline_end_dt - timeline_start_dt).days
            task_start_pos = max(0, (start_dt - timeline_start_dt).days)
            task_end_pos = min(total_days, (finish_dt - timeline_start_dt).days)
            
            # Create timeline (50 characters wide)
            timeline_width = 50
            timeline = [' '] * timeline_width
            
            if total_days > 0:
                start_pos = int((task_start_pos / total_days) * timeline_width)
                end_pos = int((task_end_pos / total_days) * timeline_width)
                completion_pos = int(start_pos + (end_pos - start_pos) * (completion / 100))
                
                # Fill completed portion with solid blocks
                for i in range(start_pos, min(completion_pos, timeline_width)):
                    timeline[i] = '█'
                
                # Fill remaining planned portion with light blocks
                for i in range(completion_pos, min(end_pos, timeline_width)):
                    timeline[i] = '░'
            
            return ''.join(timeline)
        except:
            return ' ' * 50
    
    def generate_project_schedule_csv(self):
        """Generate project schedule CSV in the required format"""
        print("Generating enhanced project schedule CSV report...")
        
        data = self.load_project_data()
        tasks = data['tasks']
        
        # Determine timeline range
        all_dates = []
        for task in tasks:
            try:
                all_dates.extend([
                    datetime.strptime(task['start_date'], '%Y-%m-%d'),
                    datetime.strptime(task['finish_date'], '%Y-%m-%d')
                ])
            except:
                continue
        
        if all_dates:
            timeline_start = min(all_dates).strftime('%Y-%m-%d')
            timeline_end = max(all_dates).strftime('%Y-%m-%d')
        else:
            timeline_start = '2025-06-01'
            timeline_end = '2025-08-31'
        
        # Prepare CSV data
        csv_data = []
        
        for task in tasks:
            # Format dates for display
            start_display = datetime.strptime(task['start_date'], '%Y-%m-%d').strftime('%d-%b-%y')
            finish_display = datetime.strptime(task['finish_date'], '%Y-%m-%d').strftime('%d-%b-%y')
            
            # Generate timeline visualization
            timeline_visual = self.generate_timeline_visual(
                task['start_date'], task['finish_date'], task['completion'],
                timeline_start, timeline_end
            )
            
            csv_data.append({
                'Events': task['title'],
                'Responsible': task['responsible'],
                'Priority': task['priority'],
                'No of Days': task['estimated_days'],
                'Start Date': start_display,
                'Finish Date': finish_display,
                '% of complete': f"{task['completion']}%",
                'Status': task['status'].replace('_', ' ').title(),
                'Timeline': timeline_visual
            })
        
        # Save to CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_filename = f'project_schedule_report_{timestamp}.csv'
        csv_path = self.results_dir / csv_filename
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'Events', 'Responsible', 'Priority', 'No of Days', 
                'Start Date', 'Finish Date', '% of complete', 'Status', 'Timeline'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(csv_data)
        
        print(f"Project schedule CSV saved: {csv_filename}")
        return str(csv_path)
    
    def generate_gantt_style_csv(self):
        """Generate Gantt-style CSV with visual timeline columns"""
        print("Generating Gantt-style project schedule CSV...")
        
        data = self.load_project_data()
        tasks = data['tasks']
        
        # Create date range for columns (weekly intervals)
        start_date = datetime(2025, 6, 1)
        end_date = datetime(2025, 8, 31)
        
        date_columns = []
        current_date = start_date
        while current_date <= end_date:
            date_columns.append(current_date.strftime('%d-%b'))
            current_date += timedelta(weeks=1)
        
        # Prepare CSV data with timeline columns
        csv_data = []
        
        for task in tasks:
            try:
                task_start = datetime.strptime(task['start_date'], '%Y-%m-%d')
                task_end = datetime.strptime(task['finish_date'], '%Y-%m-%d')
                
                row = {
                    'Events': task['title'],
                    'Responsible': task['responsible'],
                    'Priority': task['priority'],
                    'No of Days': task['estimated_days'],
                    'Start Date': task_start.strftime('%d-%b-%y'),
                    'Finish Date': task_end.strftime('%d-%b-%y'),
                    '% of complete': f"{task['completion']}%"
                }
                
                # Add timeline columns
                for date_col in date_columns:
                    col_date = datetime.strptime(f"{date_col}-2025", '%d-%b-%Y')
                    
                    if task_start <= col_date <= task_end:
                        if task['completion'] == 100:
                            row[date_col] = '█'  # Completed
                        elif task['status'] == 'in_progress':
                            row[date_col] = '▓'  # In progress
                        else:
                            row[date_col] = '░'  # Planned
                    else:
                        row[date_col] = ' '
                
                csv_data.append(row)
                
            except Exception as e:
                print(f"Error processing task {task['id']}: {e}")
                continue
        
        # Save Gantt-style CSV
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        gantt_filename = f'gantt_schedule_report_{timestamp}.csv'
        gantt_path = self.results_dir / gantt_filename
        
        fieldnames = [
            'Events', 'Responsible', 'Priority', 'No of Days', 
            'Start Date', 'Finish Date', '% of complete'
        ] + date_columns
        
        with open(gantt_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(csv_data)
        
        print(f"Gantt-style CSV saved: {gantt_filename}")
        return str(gantt_path)
    
    def generate_comprehensive_reports(self):
        """Generate all enhanced CSV reports"""
        print("🚀 Generating Enhanced Project Schedule CSV Reports")
        print("=" * 60)
        
        # Generate both report formats
        schedule_path = self.generate_project_schedule_csv()
        gantt_path = self.generate_gantt_style_csv()
        
        # Generate summary report
        summary_data = {
            'report_generation': {
                'timestamp': datetime.now().isoformat(),
                'schedule_report': schedule_path,
                'gantt_report': gantt_path,
                'format_compliance': 'Matches reference image format'
            },
            'report_features': [
                'Events column with detailed task descriptions',
                'Responsible person assignments',
                'Priority levels (A/P) as shown in reference',
                'Number of days estimation',
                'Formatted start and finish dates (dd-mmm-yy)',
                'Percentage completion tracking',
                'Status indicators',
                'Visual timeline representation'
            ]
        }
        
        # Save summary
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        summary_path = self.results_dir / f'csv_reports_summary_{timestamp}.json'
        
        with open(summary_path, 'w') as f:
            json.dump(summary_data, f, indent=2, default=str)
        
        print(f"\n📊 Reports Generated Successfully:")
        print(f"   1. Project Schedule: {Path(schedule_path).name}")
        print(f"   2. Gantt Timeline:   {Path(gantt_path).name}")
        print(f"   3. Summary Report:   {summary_path.name}")
        
        return {
            'schedule_report': schedule_path,
            'gantt_report': gantt_path,
            'summary_report': str(summary_path)
        }

def main():
    """Main execution function"""
    generator = EnhancedCSVGenerator()
    results = generator.generate_comprehensive_reports()
    
    print("\n✅ Enhanced CSV reports generated successfully!")
    print("   Reports now match the reference image format with proper columns")
    print("   and visual timeline representations.")
    
    return results

if __name__ == "__main__":
    main()