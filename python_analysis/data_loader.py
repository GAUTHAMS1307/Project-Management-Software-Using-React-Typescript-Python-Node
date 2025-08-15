"""
Data loading module for fetching and processing data from the project management system.
Handles connection to the database and data transformation for analysis.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from typing import Dict, List, Tuple, Optional
import json
from config import DATABASE_URL, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD

class DataLoader:
    def __init__(self):
        """Initialize database connection."""
        self.engine = None
        self.connect_to_database()
    
    def connect_to_database(self):
        """Establish database connection."""
        try:
            # Try using DATABASE_URL first
            if DATABASE_URL and DATABASE_URL != 'postgresql://localhost:5432/smartprojectpulse':
                self.engine = create_engine(DATABASE_URL)
            else:
                # Fall back to individual parameters
                connection_string = f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
                self.engine = create_engine(connection_string)
            
            # Test connection
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("Database connection established successfully")
            
        except Exception as e:
            print(f"Database connection failed: {e}")
            print("Using mock data for analysis")
            self.engine = None
    
    def load_users_data(self) -> pd.DataFrame:
        """Load and process users data."""
        if self.engine is None:
            return self._generate_mock_users()
        
        try:
            query = """
            SELECT 
                id,
                email,
                name,
                role,
                created_at
            FROM users
            """
            df = pd.read_sql(query, self.engine)
            return self._process_users_data(df)
        except Exception as e:
            print(f"Error loading users data: {e}")
            return self._generate_mock_users()
    
    def load_projects_data(self) -> pd.DataFrame:
        """Load and process projects data."""
        if self.engine is None:
            return self._generate_mock_projects()
        
        try:
            query = """
            SELECT 
                id,
                name,
                description,
                status,
                progress,
                start_date,
                end_date,
                team_id,
                manager_id,
                domains,
                created_at
            FROM projects
            """
            df = pd.read_sql(query, self.engine)
            return self._process_projects_data(df)
        except Exception as e:
            print(f"Error loading projects data: {e}")
            return self._generate_mock_projects()
    
    def load_tasks_data(self) -> pd.DataFrame:
        """Load and process tasks data."""
        if self.engine is None:
            return self._generate_mock_tasks()
        
        try:
            query = """
            SELECT 
                id,
                title,
                description,
                status,
                priority,
                assignee_id,
                project_id,
                domain,
                estimated_hours,
                actual_hours,
                start_date,
                due_date,
                completed_date,
                dependencies,
                delay_reason,
                created_at
            FROM tasks
            """
            df = pd.read_sql(query, self.engine)
            return self._process_tasks_data(df)
        except Exception as e:
            print(f"Error loading tasks data: {e}")
            return self._generate_mock_tasks()
    
    def load_teams_data(self) -> pd.DataFrame:
        """Load and process teams data."""
        if self.engine is None:
            return self._generate_mock_teams()
        
        try:
            query = """
            SELECT 
                id,
                name,
                description,
                leader_id,
                member_ids,
                skills,
                created_at
            FROM teams
            """
            df = pd.read_sql(query, self.engine)
            return self._process_teams_data(df)
        except Exception as e:
            print(f"Error loading teams data: {e}")
            return self._generate_mock_teams()
    
    def load_delay_alerts_data(self) -> pd.DataFrame:
        """Load and process delay alerts data."""
        if self.engine is None:
            return self._generate_mock_delay_alerts()
        
        try:
            query = """
            SELECT 
                id,
                type,
                title,
                message,
                task_id,
                project_id,
                is_resolved,
                notification_sent,
                created_at
            FROM delay_alerts
            """
            df = pd.read_sql(query, self.engine)
            return self._process_delay_alerts_data(df)
        except Exception as e:
            print(f"Error loading delay alerts data: {e}")
            return self._generate_mock_delay_alerts()
    
    def _process_users_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process users data for analysis."""
        df['created_at'] = pd.to_datetime(df['created_at'])
        role_mapping = {
            'administrator': 4,
            'manager': 3,
            'leader': 2,
            'member': 1
        }
        df['role_numeric'] = df['role'].map(role_mapping)
        return df
    
    def _process_projects_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process projects data for analysis."""
        df['start_date'] = pd.to_datetime(df['start_date'])
        df['end_date'] = pd.to_datetime(df['end_date'])
        df['created_at'] = pd.to_datetime(df['created_at'])
        
        # Calculate project duration and complexity
        df['duration_days'] = (df['end_date'] - df['start_date']).dt.days
        df['days_elapsed'] = (datetime.now() - df['start_date']).dt.days
        df['days_remaining'] = (df['end_date'] - datetime.now()).dt.days
        
        # Parse domains if it's a JSON string
        if 'domains' in df.columns:
            df['domain_count'] = df['domains'].apply(lambda x: len(json.loads(x)) if isinstance(x, str) else len(x) if x else 0)
        
        # Status numeric mapping
        status_mapping = {
            'planning': 1,
            'in_progress': 2,
            'delayed': 3,
            'completed': 4
        }
        df['status_numeric'] = df['status'].map(status_mapping)
        
        return df
    
    def _process_tasks_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process tasks data for analysis."""
        df['start_date'] = pd.to_datetime(df['start_date'])
        df['due_date'] = pd.to_datetime(df['due_date'])
        df['completed_date'] = pd.to_datetime(df['completed_date'])
        df['created_at'] = pd.to_datetime(df['created_at'])
        
        # Calculate time-based features
        df['planned_duration'] = (df['due_date'] - df['start_date']).dt.days
        df['days_to_deadline'] = (df['due_date'] - datetime.now()).dt.days
        df['is_overdue'] = df['days_to_deadline'] < 0
        
        # Calculate actual duration for completed tasks
        df['actual_duration'] = np.where(
            df['completed_date'].notna(),
            (df['completed_date'] - df['start_date']).dt.days,
            np.nan
        )
        
        # Calculate delay days
        df['delay_days'] = np.where(
            df['completed_date'].notna(),
            np.maximum(0, (df['completed_date'] - df['due_date']).dt.days),
            np.maximum(0, (datetime.now() - df['due_date']).dt.days)
        )
        
        # Priority and status numeric mapping
        priority_mapping = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        }
        df['priority_numeric'] = df['priority'].map(priority_mapping)
        
        status_mapping = {
            'todo': 1,
            'in_progress': 2,
            'review': 3,
            'completed': 4,
            'delayed': 5
        }
        df['status_numeric'] = df['status'].map(status_mapping)
        
        # Parse dependencies
        if 'dependencies' in df.columns:
            df['dependency_count'] = df['dependencies'].apply(
                lambda x: len(json.loads(x)) if isinstance(x, str) else len(x) if x else 0
            )
        
        # Progress ratio
        df['progress_ratio'] = df.apply(lambda row: 
            min(row.get('actual_hours', 0) / max(row.get('estimated_hours', 1), 1), 2.0), axis=1
        )
        
        return df
    
    def _process_teams_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process teams data for analysis."""
        df['created_at'] = pd.to_datetime(df['created_at'])
        
        # Parse member_ids and skills if they're JSON strings
        if 'member_ids' in df.columns:
            df['team_size'] = df['member_ids'].apply(
                lambda x: len(json.loads(x)) if isinstance(x, str) else len(x) if x else 0
            )
        
        if 'skills' in df.columns:
            df['skill_count'] = df['skills'].apply(
                lambda x: len(json.loads(x)) if isinstance(x, str) else len(x) if x else 0
            )
        
        return df
    
    def _process_delay_alerts_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process delay alerts data for analysis."""
        df['created_at'] = pd.to_datetime(df['created_at'])
        
        # Type numeric mapping
        type_mapping = {
            'minor': 1,
            'major': 2,
            'critical': 3
        }
        df['type_numeric'] = df['type'].map(type_mapping)
        
        return df
    
    def _generate_mock_users(self) -> pd.DataFrame:
        """Generate mock users data for testing when database is unavailable."""
        mock_users = [
            {'id': 'usr1', 'email': 'admin@company.com', 'name': 'System Administrator', 'role': 'administrator', 'created_at': datetime.now() - timedelta(days=365)},
            {'id': 'usr2', 'email': 'manager@company.com', 'name': 'Alex Manager', 'role': 'manager', 'created_at': datetime.now() - timedelta(days=300)},
            {'id': 'usr3', 'email': 'leader1@company.com', 'name': 'Sarah Johnson', 'role': 'leader', 'created_at': datetime.now() - timedelta(days=250)},
            {'id': 'usr4', 'email': 'mike@company.com', 'name': 'Mike Chen', 'role': 'member', 'created_at': datetime.now() - timedelta(days=200)},
            {'id': 'usr5', 'email': 'emma@company.com', 'name': 'Emma Davis', 'role': 'member', 'created_at': datetime.now() - timedelta(days=150)},
        ]
        df = pd.DataFrame(mock_users)
        return self._process_users_data(df)
    
    def _generate_mock_projects(self) -> pd.DataFrame:
        """Generate mock projects data for testing."""
        mock_projects = [
            {
                'id': 'proj1', 'name': 'E-commerce Redesign', 'description': 'Complete redesign of e-commerce platform',
                'status': 'in_progress', 'progress': 65, 'start_date': datetime.now() - timedelta(days=90),
                'end_date': datetime.now() + timedelta(days=30), 'team_id': 'team1', 'manager_id': 'usr2',
                'domains': '["frontend", "backend", "ui/ux"]', 'created_at': datetime.now() - timedelta(days=100)
            },
            {
                'id': 'proj2', 'name': 'Mobile App Development', 'description': 'New mobile application',
                'status': 'delayed', 'progress': 40, 'start_date': datetime.now() - timedelta(days=120),
                'end_date': datetime.now() + timedelta(days=60), 'team_id': 'team1', 'manager_id': 'usr2',
                'domains': '["mobile", "api", "testing"]', 'created_at': datetime.now() - timedelta(days=130)
            },
            {
                'id': 'proj3', 'name': 'Data Analytics Dashboard', 'description': 'Business intelligence dashboard',
                'status': 'completed', 'progress': 100, 'start_date': datetime.now() - timedelta(days=200),
                'end_date': datetime.now() - timedelta(days=30), 'team_id': 'team1', 'manager_id': 'usr2',
                'domains': '["analytics", "visualization", "data"]', 'created_at': datetime.now() - timedelta(days=210)
            }
        ]
        df = pd.DataFrame(mock_projects)
        return self._process_projects_data(df)
    
    def _generate_mock_tasks(self) -> pd.DataFrame:
        """Generate mock tasks data for testing."""
        mock_tasks = []
        task_titles = [
            'User Authentication System', 'Payment Gateway Integration', 'Product Search Feature',
            'Shopping Cart Implementation', 'Order Management System', 'User Profile Dashboard',
            'Mobile UI Components', 'API Documentation', 'Database Optimization',
            'Security Audit', 'Performance Testing', 'User Testing Sessions'
        ]
        
        statuses = ['todo', 'in_progress', 'review', 'completed', 'delayed']
        priorities = ['low', 'medium', 'high', 'critical']
        domains = ['frontend', 'backend', 'mobile', 'testing', 'ui/ux', 'api']
        
        for i, title in enumerate(task_titles):
            mock_tasks.append({
                'id': f'task{i+1}',
                'title': title,
                'description': f'Description for {title}',
                'status': np.random.choice(statuses),
                'priority': np.random.choice(priorities),
                'assignee_id': f'usr{np.random.randint(3, 6)}',
                'project_id': f'proj{np.random.randint(1, 4)}',
                'domain': np.random.choice(domains),
                'estimated_hours': np.random.randint(8, 80),
                'actual_hours': np.random.randint(5, 100) if np.random.random() > 0.3 else None,
                'start_date': datetime.now() - timedelta(days=np.random.randint(5, 90)),
                'due_date': datetime.now() + timedelta(days=np.random.randint(-10, 30)),
                'completed_date': datetime.now() - timedelta(days=np.random.randint(1, 10)) if np.random.random() > 0.6 else None,
                'dependencies': '[]',
                'delay_reason': 'Technical complexity' if np.random.random() > 0.8 else None,
                'created_at': datetime.now() - timedelta(days=np.random.randint(10, 100))
            })
        
        df = pd.DataFrame(mock_tasks)
        return self._process_tasks_data(df)
    
    def _generate_mock_teams(self) -> pd.DataFrame:
        """Generate mock teams data for testing."""
        mock_teams = [
            {
                'id': 'team1', 'name': 'Development Team Alpha', 'description': 'Primary development team',
                'leader_id': 'usr3', 'member_ids': '["usr4", "usr5"]', 
                'skills': '["React", "Node.js", "TypeScript", "UI/UX", "Testing"]',
                'created_at': datetime.now() - timedelta(days=200)
            }
        ]
        df = pd.DataFrame(mock_teams)
        return self._process_teams_data(df)
    
    def _generate_mock_delay_alerts(self) -> pd.DataFrame:
        """Generate mock delay alerts data for testing."""
        mock_alerts = []
        alert_types = ['minor', 'major', 'critical']
        
        for i in range(15):
            mock_alerts.append({
                'id': f'alert{i+1}',
                'type': np.random.choice(alert_types),
                'title': f'Delay Alert {i+1}',
                'message': f'Task is delayed due to various reasons',
                'task_id': f'task{np.random.randint(1, 13)}',
                'project_id': f'proj{np.random.randint(1, 4)}',
                'is_resolved': np.random.choice([True, False]),
                'notification_sent': True,
                'created_at': datetime.now() - timedelta(days=np.random.randint(1, 30))
            })
        
        df = pd.DataFrame(mock_alerts)
        return self._process_delay_alerts_data(df)
    
    def get_comprehensive_dataset(self) -> Dict[str, pd.DataFrame]:
        """Load all data and return as a dictionary of DataFrames."""
        return {
            'users': self.load_users_data(),
            'projects': self.load_projects_data(),
            'tasks': self.load_tasks_data(),
            'teams': self.load_teams_data(),
            'delay_alerts': self.load_delay_alerts_data()
        }