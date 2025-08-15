#!/usr/bin/env python3
"""
Enhanced Model Trainer for Smart Project Pulse
Implements advanced ML techniques to achieve >90% accuracy
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
    VotingClassifier, VotingRegressor
)
from sklearn.model_selection import (
    train_test_split, cross_val_score, GridSearchCV, 
    StratifiedKFold, KFold
)
from sklearn.preprocessing import (
    StandardScaler, LabelEncoder, MinMaxScaler, 
    PolynomialFeatures, RobustScaler
)
from sklearn.feature_selection import (
    SelectKBest, f_classif, f_regression, 
    RFE, SelectFromModel
)
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    mean_squared_error, mean_absolute_error, r2_score,
    classification_report, confusion_matrix
)
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import joblib
import warnings
warnings.filterwarnings('ignore')

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("XGBoost not available - using alternative models")

from config import MODEL_CONFIG, TRAINING_CONFIG, NLP_FEATURES
from datetime import datetime
import json

class EnhancedModelTrainer:
    """Advanced model trainer with ensemble methods and feature engineering"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_selectors = {}
        self.label_encoders = {}
        self.feature_names = []
        self.training_history = []
        
    def create_advanced_features(self, data):
        """Create advanced engineered features"""
        df = data.copy()
        
        # Text-based features
        for text_col in ['title', 'description']:
            if text_col in df.columns:
                df[f'{text_col}_length'] = df[text_col].fillna('').astype(str).str.len()
                df[f'{text_col}_word_count'] = df[text_col].fillna('').astype(str).str.split().str.len()
                
                # Keyword analysis
                for keyword_type, keywords in NLP_FEATURES.items():
                    if keyword_type == 'technical_keywords':
                        df[f'{text_col}_technical_count'] = df[text_col].fillna('').astype(str).str.lower().apply(
                            lambda x: sum(1 for kw in keywords if kw in x)
                        )
                    elif keyword_type == 'complexity_indicators':
                        df[f'{text_col}_complexity_indicators'] = df[text_col].fillna('').astype(str).str.lower().apply(
                            lambda x: sum(1 for kw in keywords if kw in x)
                        )
                    elif keyword_type == 'urgency_indicators':
                        df[f'{text_col}_urgency_indicators'] = df[text_col].fillna('').astype(str).str.lower().apply(
                            lambda x: sum(1 for kw in keywords if kw in x)
                        )
                    elif keyword_type == 'risk_indicators':
                        df[f'{text_col}_risk_indicators'] = df[text_col].fillna('').astype(str).str.lower().apply(
                            lambda x: sum(1 for kw in keywords if kw in x)
                        )
        
        # Numerical feature engineering
        if 'estimatedHours' in df.columns and 'actualHours' in df.columns:
            df['hours_ratio'] = df['actualHours'] / (df['estimatedHours'] + 0.1)  # Avoid division by zero
            df['hours_difference'] = df['actualHours'] - df['estimatedHours']
            df['estimation_accuracy'] = 1 - np.abs(df['hours_ratio'] - 1)
        
        # Priority encoding
        priority_mapping = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
        if 'priority' in df.columns:
            df['priority_numeric'] = df['priority'].map(priority_mapping).fillna(2)
        
        # Status encoding
        status_mapping = {
            'todo': 1, 'in_progress': 2, 'review': 3, 
            'completed': 4, 'delayed': 0, 'blocked': 0
        }
        if 'status' in df.columns:
            df['status_numeric'] = df['status'].map(status_mapping).fillna(1)
        
        # Advanced derived features
        df['complexity_score'] = (
            df.get('title_length', 0) * 0.1 +
            df.get('description_length', 0) * 0.05 +
            df.get('title_technical_count', 0) * 5 +
            df.get('description_technical_count', 0) * 3 +
            df.get('title_complexity_indicators', 0) * 8 +
            df.get('description_complexity_indicators', 0) * 6
        )
        
        df['urgency_score'] = (
            df.get('priority_numeric', 2) * 2 +
            df.get('title_urgency_indicators', 0) * 10 +
            df.get('description_urgency_indicators', 0) * 8
        )
        
        df['risk_score'] = (
            df.get('title_risk_indicators', 0) * 12 +
            df.get('description_risk_indicators', 0) * 10 +
            (df.get('hours_ratio', 1) - 1).abs() * 5
        )
        
        return df
    
    def prepare_training_data(self, tasks_data, projects_data=None):
        """Prepare comprehensive training data"""
        df = pd.DataFrame(tasks_data)
        
        # Enhanced feature engineering
        df = self.create_advanced_features(df)
        
        # Create target variables
        df['is_delayed'] = (df['status'] == 'delayed').astype(int)
        df['is_completed'] = (df['status'] == 'completed').astype(int)
        
        # Complexity classification
        df['complexity_class'] = pd.cut(
            df['complexity_score'], 
            bins=[0, 30, 70, float('inf')], 
            labels=['low', 'medium', 'high']
        )
        
        # Domain classification based on keywords
        def classify_domain(text):
            text = str(text).lower()
            frontend_keywords = ['ui', 'ux', 'frontend', 'react', 'vue', 'angular', 'css', 'html']
            backend_keywords = ['api', 'database', 'server', 'backend', 'microservice', 'sql']
            devops_keywords = ['deploy', 'ci/cd', 'docker', 'kubernetes', 'aws', 'cloud']
            
            frontend_count = sum(1 for kw in frontend_keywords if kw in text)
            backend_count = sum(1 for kw in backend_keywords if kw in text)
            devops_count = sum(1 for kw in devops_keywords if kw in text)
            
            if frontend_count >= backend_count and frontend_count >= devops_count:
                return 'frontend'
            elif backend_count >= devops_count:
                return 'backend'
            elif devops_count > 0:
                return 'devops'
            else:
                return 'general'
        
        df['domain'] = df['title'].fillna('') + ' ' + df['description'].fillna('')
        df['domain'] = df['domain'].apply(classify_domain)
        
        return df
    
    def build_ensemble_model(self, model_type='classifier'):
        """Build advanced ensemble models"""
        models = []
        
        if model_type == 'classifier':
            # Random Forest
            rf = RandomForestClassifier(**MODEL_CONFIG['random_forest'])
            models.append(('rf', rf))
            
            # Gradient Boosting
            gb = GradientBoostingClassifier(**MODEL_CONFIG['gradient_boosting'])
            models.append(('gb', gb))
            
            # XGBoost if available
            if XGB_AVAILABLE:
                xgb_model = xgb.XGBClassifier(**MODEL_CONFIG['xgboost'])
                models.append(('xgb', xgb_model))
            
            # Create ensemble
            ensemble = VotingClassifier(
                estimators=models,
                voting=MODEL_CONFIG['ensemble']['voting'],
                weights=MODEL_CONFIG['ensemble']['weights'][:len(models)],
                n_jobs=MODEL_CONFIG['ensemble']['n_jobs']
            )
            
        else:  # regressor
            # Random Forest
            rf = RandomForestRegressor(**MODEL_CONFIG['random_forest'])
            models.append(('rf', rf))
            
            # Gradient Boosting
            gb = GradientBoostingRegressor(**MODEL_CONFIG['gradient_boosting'])
            models.append(('gb', gb))
            
            # XGBoost if available
            if XGB_AVAILABLE:
                xgb_model = xgb.XGBRegressor(**MODEL_CONFIG['xgboost'])
                models.append(('xgb', xgb_model))
            
            # Create ensemble
            ensemble = VotingRegressor(
                estimators=models,
                weights=MODEL_CONFIG['ensemble']['weights'][:len(models)],
                n_jobs=MODEL_CONFIG['ensemble']['n_jobs']
            )
        
        return ensemble
    
    def train_model(self, X, y, model_name, task_type='classification'):
        """Train individual model with cross-validation"""
        print(f"Training {model_name} model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=TRAINING_CONFIG['test_size'],
            random_state=TRAINING_CONFIG['random_state'],
            stratify=y if task_type == 'classification' else None
        )
        
        # Feature scaling
        scaler = RobustScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Feature selection
        if task_type == 'classification':
            selector = SelectKBest(f_classif, k=min(15, X_train.shape[1]))
        else:
            selector = SelectKBest(f_regression, k=min(15, X_train.shape[1]))
        
        X_train_selected = selector.fit_transform(X_train_scaled, y_train)
        X_test_selected = selector.transform(X_test_scaled)
        
        # Build model
        model = self.build_ensemble_model(
            'classifier' if task_type == 'classification' else 'regressor'
        )
        
        # Train model
        model.fit(X_train_selected, y_train)
        
        # Predictions
        y_pred = model.predict(X_test_selected)
        
        # Calculate metrics
        if task_type == 'classification':
            accuracy = accuracy_score(y_test, y_pred)
            precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
            
            metrics = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                'classification_report': classification_report(y_test, y_pred)
            }
            
            # Cross-validation
            cv_scores = cross_val_score(
                model, X_train_selected, y_train, 
                cv=TRAINING_CONFIG['k_fold_cv'], scoring='accuracy'
            )
            metrics['cv_mean'] = cv_scores.mean()
            metrics['cv_std'] = cv_scores.std()
            
        else:
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            metrics = {
                'mse': mse,
                'rmse': np.sqrt(mse),
                'mae': mae,
                'r2_score': r2
            }
            
            # Cross-validation
            cv_scores = cross_val_score(
                model, X_train_selected, y_train, 
                cv=TRAINING_CONFIG['k_fold_cv'], scoring='r2'
            )
            metrics['cv_mean'] = cv_scores.mean()
            metrics['cv_std'] = cv_scores.std()
        
        # Store model and preprocessors
        self.models[model_name] = model
        self.scalers[model_name] = scaler
        self.feature_selectors[model_name] = selector
        
        return metrics
    
    def generate_synthetic_data(self, base_data, n_samples=100):
        """Generate synthetic training data using data augmentation"""
        synthetic_data = []
        
        for _ in range(n_samples):
            # Random selection and perturbation of existing data
            base_sample = base_data.sample(1).iloc[0].to_dict()
            
            # Add noise to numerical features
            for feature in ['estimatedHours', 'actualHours']:
                if feature in base_sample:
                    noise_factor = np.random.normal(1, 0.1)  # 10% noise
                    base_sample[feature] = max(1, base_sample[feature] * noise_factor)
            
            # Modify text slightly
            if 'description' in base_sample:
                descriptions = [
                    "Implement advanced functionality with modern frameworks",
                    "Design scalable architecture for enterprise solutions",
                    "Optimize performance and user experience",
                    "Develop comprehensive testing strategies",
                    "Create robust API endpoints with proper validation"
                ]
                base_sample['description'] = np.random.choice(descriptions)
            
            synthetic_data.append(base_sample)
        
        return pd.DataFrame(synthetic_data)
    
    def train_all_models(self, tasks_data, projects_data=None):
        """Train all models with enhanced techniques"""
        print("Preparing training data...")
        df = self.prepare_training_data(tasks_data, projects_data)
        
        # Data augmentation if dataset is small
        if len(df) < 50:
            print("Generating synthetic training data...")
            synthetic_df = self.generate_synthetic_data(df, n_samples=200)
            df = pd.concat([df, synthetic_df], ignore_index=True)
        
        print(f"Training with {len(df)} samples")
        
        # Prepare features - ensure all features are numeric
        exclude_columns = [
            'id', 'title', 'description', 'status', 'is_delayed', 
            'is_completed', 'complexity_class', 'domain'
        ]
        
        feature_columns = [col for col in df.columns if col not in exclude_columns]
        X = df[feature_columns].fillna(0)
        
        # Convert any remaining categorical columns to numeric
        for col in X.columns:
            if X[col].dtype == 'object':
                try:
                    # Try to convert to numeric
                    X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
                except:
                    # Use label encoding for categorical data
                    le = LabelEncoder()
                    X[col] = le.fit_transform(X[col].astype(str))
        
        self.feature_names = feature_columns
        
        results = {}
        
        # Train delay prediction model
        if 'is_delayed' in df.columns:
            y_delay = df['is_delayed']
            results['delay_prediction'] = self.train_model(
                X, y_delay, 'delay_prediction', 'classification'
            )
        
        # Train completion prediction model
        if 'is_completed' in df.columns:
            y_completion = df['is_completed']
            results['completion_prediction'] = self.train_model(
                X, y_completion, 'completion_prediction', 'classification'
            )
        
        # Train complexity classification model
        if 'complexity_class' in df.columns:
            y_complexity = df['complexity_class'].fillna('medium')
            le = LabelEncoder()
            y_complexity_encoded = le.fit_transform(y_complexity)
            self.label_encoders['complexity'] = le
            
            results['complexity_classification'] = self.train_model(
                X, y_complexity_encoded, 'complexity_classification', 'classification'
            )
        
        # Train domain classification model
        if 'domain' in df.columns:
            y_domain = df['domain']
            le = LabelEncoder()
            y_domain_encoded = le.fit_transform(y_domain)
            self.label_encoders['domain'] = le
            
            results['domain_classification'] = self.train_model(
                X, y_domain_encoded, 'domain_classification', 'classification'
            )
        
        # Train hours prediction model
        if 'actualHours' in df.columns and df['actualHours'].notna().sum() > 0:
            y_hours = df['actualHours'].fillna(df['estimatedHours'].fillna(0))
            results['hours_prediction'] = self.train_model(
                X, y_hours, 'hours_prediction', 'regression'
            )
        
        # Store training history
        self.training_history.append({
            'timestamp': datetime.now().isoformat(),
            'samples_used': len(df),
            'features_used': len(feature_columns),
            'models_trained': list(results.keys()),
            'results': results
        })
        
        return results
    
    def save_models(self, filepath='models/enhanced_models.joblib'):
        """Save all trained models"""
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'feature_selectors': self.feature_selectors,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'training_history': self.training_history
        }
        
        import os
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(model_data, filepath)
        print(f"Models saved to {filepath}")
    
    def load_models(self, filepath='models/enhanced_models.joblib'):
        """Load trained models"""
        try:
            model_data = joblib.load(filepath)
            self.models = model_data['models']
            self.scalers = model_data['scalers']
            self.feature_selectors = model_data['feature_selectors']
            self.label_encoders = model_data['label_encoders']
            self.feature_names = model_data['feature_names']
            self.training_history = model_data.get('training_history', [])
            print(f"Models loaded from {filepath}")
            return True
        except Exception as e:
            print(f"Failed to load models: {e}")
            return False
    
    def predict(self, data, model_name):
        """Make predictions using trained models"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
        
        # Prepare data
        df = self.create_advanced_features(pd.DataFrame([data] if isinstance(data, dict) else data))
        X = df[self.feature_names].fillna(0)
        
        # Apply preprocessing
        X_scaled = self.scalers[model_name].transform(X)
        X_selected = self.feature_selectors[model_name].transform(X_scaled)
        
        # Make prediction
        prediction = self.models[model_name].predict(X_selected)
        
        # Get probability if classification
        if hasattr(self.models[model_name], 'predict_proba'):
            probabilities = self.models[model_name].predict_proba(X_selected)
            return prediction, probabilities
        
        return prediction