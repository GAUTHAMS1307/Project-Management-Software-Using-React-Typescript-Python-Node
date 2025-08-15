"""
Configuration module for Python data analysis components.
Contains environment variables and database configuration.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost:5432/smartprojectpulse')
DATABASE_HOST = os.getenv('PGHOST', 'localhost')
DATABASE_PORT = os.getenv('PGPORT', '5432')
DATABASE_NAME = os.getenv('PGDATABASE', 'smartprojectpulse')
DATABASE_USER = os.getenv('PGUSER', 'postgres')
DATABASE_PASSWORD = os.getenv('PGPASSWORD', '')

# Enhanced Analysis configuration
PREDICTION_FEATURES = [
    # Original features
    'estimated_hours',
    'progress_ratio',
    'dependency_count',
    'team_size',
    'priority_numeric',
    'domain_complexity_score',
    'assignee_experience_score',
    'project_complexity_score',
    
    # Advanced engineered features
    'task_complexity_score',
    'description_length',
    'title_length',
    'keyword_density',
    'technical_keywords_count',
    'sentiment_score',
    'sentiment_magnitude',
    'urgency_score',
    'risk_score',
    'historical_performance_score',
    'team_collaboration_score',
    'resource_availability_score',
    'time_pressure_score',
    'dependency_complexity',
    'communication_frequency',
    'change_frequency',
    'estimation_confidence',
    'skill_match_score',
    'workload_balance_score',
    'project_momentum',
    'external_dependency_risk',
    'technology_stack_familiarity',
    'deadline_proximity',
    'scope_creep_indicator',
    'quality_gate_requirements'
]

# NLP Enhancement features
NLP_FEATURES = {
    'technical_keywords': [
        'api', 'database', 'frontend', 'backend', 'integration', 'testing',
        'deployment', 'security', 'performance', 'scalability', 'architecture',
        'framework', 'library', 'algorithm', 'optimization', 'refactoring',
        'migration', 'authentication', 'authorization', 'encryption', 'caching'
    ],
    'complexity_indicators': [
        'complex', 'complicated', 'difficult', 'challenging', 'intricate',
        'sophisticated', 'advanced', 'comprehensive', 'extensive', 'detailed'
    ],
    'urgency_indicators': [
        'urgent', 'critical', 'asap', 'immediately', 'rush', 'priority',
        'deadline', 'time-sensitive', 'blocking', 'blocker', 'emergency'
    ],
    'risk_indicators': [
        'uncertain', 'unclear', 'ambiguous', 'experimental', 'prototype',
        'research', 'investigation', 'unknown', 'risky', 'dependency'
    ]
}

DELAY_THRESHOLDS = {
    'minor': 1,      # 1 day delay
    'major': 3,      # 3 days delay
    'critical': 7    # 7 days delay
}

# Enhanced Model configuration
MODEL_CONFIG = {
    'random_forest': {
        'n_estimators': 500,
        'max_depth': 20,
        'min_samples_split': 2,
        'min_samples_leaf': 1,
        'max_features': 'sqrt',
        'bootstrap': True,
        'random_state': 42,
        'n_jobs': -1
    },
    'gradient_boosting': {
        'n_estimators': 300,
        'learning_rate': 0.1,
        'max_depth': 8,
        'min_samples_split': 2,
        'min_samples_leaf': 1,
        'subsample': 0.8,
        'random_state': 42
    },
    'xgboost': {
        'n_estimators': 400,
        'learning_rate': 0.1,
        'max_depth': 8,
        'min_child_weight': 1,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'random_state': 42
    },
    'ensemble': {
        'voting': 'soft',
        'weights': [3, 2, 3],  # rf, gb, xgb
        'n_jobs': -1
    }
}

# Enhanced Training configuration
TRAINING_CONFIG = {
    'test_size': 0.25,
    'validation_size': 0.15,
    'random_state': 42,
    'stratify': True,
    'k_fold_cv': 5,
    'hyperparameter_tuning': True,
    'early_stopping_rounds': 50,
    'feature_selection': True,
    'data_augmentation': True
}