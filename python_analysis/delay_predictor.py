"""
Delay prediction and analysis module using machine learning algorithms.
Provides functionality to predict task delays and analyze project risk factors.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, classification_report, confusion_matrix
from datetime import datetime, timedelta
import joblib
import warnings
from typing import Dict, List, Tuple, Optional, Any
from data_loader import DataLoader
from config import PREDICTION_FEATURES, DELAY_THRESHOLDS, MODEL_CONFIG, TRAINING_CONFIG

warnings.filterwarnings('ignore')

class DelayPredictor:
    def __init__(self):
        """Initialize the delay predictor with data loader and models."""
        self.data_loader = DataLoader()
        self.delay_classifier = RandomForestClassifier(**MODEL_CONFIG)
        self.duration_predictor = RandomForestRegressor(**MODEL_CONFIG)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = []
        self.is_trained = False
        
    def prepare_features(self, data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Prepare features for machine learning models."""
        tasks_df = data['tasks'].copy()
        users_df = data['users'].copy()
        projects_df = data['projects'].copy()
        teams_df = data['teams'].copy()
        
        # Merge task data with related information
        features_df = tasks_df.merge(users_df[['id', 'role_numeric']], 
                                   left_on='assignee_id', right_on='id', 
                                   how='left', suffixes=('', '_assignee'))
        
        features_df = features_df.merge(projects_df[['id', 'status_numeric', 'duration_days', 'domain_count']], 
                                      left_on='project_id', right_on='id', 
                                      how='left', suffixes=('', '_project'))
        
        features_df = features_df.merge(teams_df[['id', 'team_size', 'skill_count']], 
                                      left_on='project_id', right_on='id', 
                                      how='left', suffixes=('', '_team'))
        
        # Create feature engineering columns
        features_df['assignee_experience_score'] = features_df['role_numeric'] * 25
        features_df['project_complexity_score'] = (
            features_df['duration_days'].fillna(30) * 0.1 + 
            features_df['domain_count'].fillna(1) * 10
        )
        domain_complexity_mapping = {
            'frontend': 20, 'backend': 30, 'mobile': 35, 'testing': 15,
            'ui/ux': 25, 'api': 30, 'database': 40, 'devops': 45
        }
        features_df['domain_complexity_score'] = features_df['domain'].map(domain_complexity_mapping).fillna(25)
        
        # Fill missing values
        numeric_columns = ['estimated_hours', 'progress_ratio', 'dependency_count', 
                          'team_size', 'priority_numeric', 'domain_complexity_score',
                          'assignee_experience_score', 'project_complexity_score']
        
        for col in numeric_columns:
            if col in features_df.columns:
                features_df[col] = features_df[col].fillna(features_df[col].median())
            else:
                # Create missing columns with default values
                if col == 'team_size':
                    features_df[col] = 3
                elif col == 'dependency_count':
                    features_df[col] = 0
                elif col == 'progress_ratio':
                    features_df[col] = 0.5
                else:
                    features_df[col] = features_df.get(col, pd.Series([25] * len(features_df))).fillna(25)
        
        return features_df
    
    def create_delay_labels(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Create delay classification labels."""
        # Create delay categories
        features_df['delay_category'] = pd.cut(
            features_df['delay_days'].fillna(0),
            bins=[-np.inf, DELAY_THRESHOLDS['minor'], DELAY_THRESHOLDS['major'], 
                  DELAY_THRESHOLDS['critical'], np.inf],
            labels=['no_delay', 'minor_delay', 'major_delay', 'critical_delay']
        )
        
        # Binary delay indicator
        features_df['is_delayed'] = (features_df['delay_days'].fillna(0) > 0).astype(int)
        
        # Risk score (0-100)
        features_df['risk_score'] = np.clip(
            features_df['delay_days'].fillna(0) * 10 + 
            features_df['priority_numeric'] * 15 +
            (100 - features_df['progress_ratio'] * 50), 
            0, 100
        )
        
        return features_df
    
    def train_models(self, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Train delay prediction models."""
        print("Preparing features for model training...")
        features_df = self.prepare_features(data)
        features_df = self.create_delay_labels(features_df)
        
        # Select feature columns
        available_features = [col for col in PREDICTION_FEATURES if col in features_df.columns]
        self.feature_columns = available_features
        
        if not self.feature_columns:
            print("Warning: No valid features found for training")
            return {"error": "No valid features available"}
        
        X = features_df[self.feature_columns].fillna(0)
        
        # Prepare targets
        y_delay_days = features_df['delay_days'].fillna(0)
        y_delay_category = features_df['delay_category'].fillna('no_delay')
        
        if len(X) < 10:
            print("Warning: Insufficient data for training")
            return {"error": "Insufficient training data"}
        
        # Split data
        X_train, X_test, y_delay_train, y_delay_test, y_cat_train, y_cat_test = train_test_split(
            X, y_delay_days, y_delay_category, 
            test_size=TRAINING_CONFIG['test_size'], 
            random_state=TRAINING_CONFIG['random_state']
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train duration predictor
        print("Training delay duration predictor...")
        self.duration_predictor.fit(X_train_scaled, y_delay_train)
        
        # Train delay classifier
        print("Training delay classification model...")
        self.delay_classifier.fit(X_train_scaled, y_cat_train)
        
        # Evaluate models
        duration_pred = self.duration_predictor.predict(X_test_scaled)
        category_pred = self.delay_classifier.predict(X_test_scaled)
        
        # Calculate metrics
        duration_rmse = np.sqrt(mean_squared_error(y_delay_test, duration_pred))
        
        self.is_trained = True
        
        # Feature importance
        feature_importance = dict(zip(
            self.feature_columns, 
            self.duration_predictor.feature_importances_
        ))
        
        print("Model training completed successfully!")
        
        return {
            "duration_rmse": duration_rmse,
            "feature_importance": feature_importance,
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "features_used": self.feature_columns
        }
    
    def predict_task_delay(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict delay for a specific task."""
        if not self.is_trained:
            return {"error": "Model not trained yet"}
        
        # Convert task data to feature vector
        features = []
        for feature in self.feature_columns:
            if feature in task_data:
                features.append(task_data[feature])
            else:
                # Default values for missing features
                default_values = {
                    'estimated_hours': 24,
                    'progress_ratio': 0.5,
                    'dependency_count': 0,
                    'team_size': 3,
                    'priority_numeric': 2,
                    'domain_complexity_score': 25,
                    'assignee_experience_score': 50,
                    'project_complexity_score': 30
                }
                features.append(default_values.get(feature, 0))
        
        # Scale features and predict
        features_scaled = self.scaler.transform([features])
        
        predicted_delay_days = self.duration_predictor.predict(features_scaled)[0]
        predicted_category = self.delay_classifier.predict(features_scaled)[0]
        prediction_probabilities = self.delay_classifier.predict_proba(features_scaled)[0]
        
        # Calculate risk level
        risk_score = min(max(predicted_delay_days * 15, 0), 100)
        
        return {
            "predicted_delay_days": max(0, predicted_delay_days),
            "predicted_category": predicted_category,
            "risk_score": risk_score,
            "category_probabilities": dict(zip(
                self.delay_classifier.classes_, 
                prediction_probabilities
            )),
            "recommendation": self._get_recommendation(risk_score, predicted_delay_days)
        }
    
    def analyze_project_risks(self, data: Dict[str, pd.DataFrame], project_id: str = None) -> Dict[str, Any]:
        """Analyze delay risks for projects."""
        tasks_df = data['tasks'].copy()
        
        if project_id:
            tasks_df = tasks_df[tasks_df['project_id'] == project_id]
        
        if tasks_df.empty:
            return {"error": "No tasks found for analysis"}
        
        features_df = self.prepare_features(data)
        features_df = self.create_delay_labels(features_df)
        
        if project_id:
            features_df = features_df[features_df['project_id'] == project_id]
        
        # Aggregate risk analysis
        risk_analysis = {
            "total_tasks": len(features_df),
            "delayed_tasks": len(features_df[features_df['is_delayed'] == 1]),
            "average_delay_days": features_df['delay_days'].mean(),
            "high_risk_tasks": len(features_df[features_df['risk_score'] > 70]),
            "delay_by_priority": features_df.groupby('priority')['delay_days'].mean().to_dict(),
            "delay_by_domain": features_df.groupby('domain')['delay_days'].mean().to_dict(),
            "tasks_by_status": features_df['status'].value_counts().to_dict()
        }
        
        # Identify critical tasks
        critical_tasks = features_df[
            (features_df['risk_score'] > 60) | 
            (features_df['delay_days'] > DELAY_THRESHOLDS['major'])
        ][['id', 'title', 'priority', 'status', 'delay_days', 'risk_score']].to_dict('records')
        
        risk_analysis["critical_tasks"] = critical_tasks
        
        return risk_analysis
    
    def get_delay_trends(self, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Analyze delay trends over time."""
        tasks_df = data['tasks'].copy()
        delay_alerts_df = data['delay_alerts'].copy()
        
        # Weekly delay trend
        tasks_df['week'] = tasks_df['created_at'].dt.isocalendar().week
        weekly_delays = tasks_df.groupby('week').agg({
            'delay_days': ['mean', 'count'],
            'is_delayed': 'sum'
        }).round(2)
        
        # Alert trends
        delay_alerts_df['week'] = delay_alerts_df['created_at'].dt.isocalendar().week
        alert_trends = delay_alerts_df.groupby(['week', 'type']).size().unstack(fill_value=0)
        
        return {
            "weekly_delay_stats": weekly_delays.to_dict(),
            "alert_trends": alert_trends.to_dict(),
            "delay_distribution": tasks_df['delay_category'].value_counts().to_dict(),
            "average_delay_by_month": tasks_df.groupby(tasks_df['created_at'].dt.month)['delay_days'].mean().to_dict()
        }
    
    def _get_recommendation(self, risk_score: float, delay_days: float) -> str:
        """Generate recommendations based on prediction."""
        if risk_score > 80:
            return "Critical: Immediate intervention required. Consider reassigning resources or extending deadline."
        elif risk_score > 60:
            return "High Risk: Close monitoring needed. Review task dependencies and resource allocation."
        elif risk_score > 40:
            return "Medium Risk: Regular check-ins recommended. Consider preventive measures."
        elif delay_days > 0:
            return "Low Risk: Minor delays expected. Standard monitoring sufficient."
        else:
            return "On Track: Task progressing normally. Continue current approach."
    
    def save_models(self, filepath_prefix: str = "python_analysis/models/delay_model"):
        """Save trained models to disk."""
        if not self.is_trained:
            print("Models not trained yet")
            return
        
        try:
            joblib.dump(self.duration_predictor, f"{filepath_prefix}_duration.pkl")
            joblib.dump(self.delay_classifier, f"{filepath_prefix}_classifier.pkl")
            joblib.dump(self.scaler, f"{filepath_prefix}_scaler.pkl")
            print(f"Models saved to {filepath_prefix}_*.pkl")
        except Exception as e:
            print(f"Error saving models: {e}")
    
    def load_models(self, filepath_prefix: str = "python_analysis/models/delay_model"):
        """Load trained models from disk."""
        try:
            self.duration_predictor = joblib.load(f"{filepath_prefix}_duration.pkl")
            self.delay_classifier = joblib.load(f"{filepath_prefix}_classifier.pkl")
            self.scaler = joblib.load(f"{filepath_prefix}_scaler.pkl")
            self.is_trained = True
            print(f"Models loaded from {filepath_prefix}_*.pkl")
        except Exception as e:
            print(f"Error loading models: {e}")
            self.is_trained = False