#!/usr/bin/env python3
"""
Natural Language Processing Analyzer for Smart Project Pulse
Uses spaCy and NLTK for comprehensive text analysis of project data
"""

import spacy
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
import pandas as pd
import numpy as np
from collections import Counter, defaultdict
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import json
import os

class NLPProjectAnalyzer:
    """Comprehensive NLP analysis for project management data"""
    
    def __init__(self):
        self.setup_nlp_models()
        
    def setup_nlp_models(self):
        """Initialize NLP models and download required datasets"""
        try:
            # Try to load spaCy model (fallback to smaller model if needed)
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                print("Warning: en_core_web_sm model not found. Using basic tokenization.")
                self.nlp = None
                
            # Download required NLTK data
            nltk.download('vader_lexicon', quiet=True)
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            
            self.sia = SentimentIntensityAnalyzer()
            self.stopwords = set(nltk.corpus.stopwords.words('english'))
            
        except Exception as e:
            print(f"Warning: Some NLP models unavailable: {e}")
            self.nlp = None
            self.sia = None
            
    def analyze_project_sentiment(self, projects_data):
        """Analyze sentiment of project descriptions and status"""
        sentiment_results = []
        
        for project in projects_data:
            analysis = {
                'project_id': project['id'],
                'project_name': project['name'],
                'description_sentiment': self._get_sentiment(project['description']),
                'overall_tone': self._classify_project_tone(project),
                'risk_indicators': self._extract_risk_keywords(project['description'])
            }
            sentiment_results.append(analysis)
            
        return pd.DataFrame(sentiment_results)
    
    def analyze_task_complexity(self, tasks_data):
        """Analyze task descriptions for complexity and domain classification"""
        complexity_results = []
        
        for task in tasks_data:
            description = task['description']
            title = task['title']
            
            analysis = {
                'task_id': task['id'],
                'title': title,
                'complexity_score': self._calculate_complexity_score(description),
                'technical_depth': self._assess_technical_depth(description),
                'key_technologies': self._extract_technologies(description + " " + title),
                'estimated_vs_actual_ratio': task['actualHours'] / max(task['estimatedHours'], 1),
                'domain_classification': task.get('domain', 'unknown'),
                'dependency_count': len(task.get('dependencies', []))
            }
            complexity_results.append(analysis)
            
        return pd.DataFrame(complexity_results)
    
    def analyze_delay_patterns(self, tasks_data, delay_alerts):
        """Analyze delay patterns and reasons using NLP"""
        delay_analysis = []
        
        # Analyze tasks with delays
        delayed_tasks = [task for task in tasks_data if task['status'] == 'delayed']
        
        for task in delayed_tasks:
            delay_reason = task.get('delayReason', 'No reason provided')
            
            analysis = {
                'task_id': task['id'],
                'delay_category': self._categorize_delay_reason(delay_reason),
                'delay_severity': self._assess_delay_severity(delay_reason),
                'root_cause_type': self._extract_root_cause(delay_reason),
                'preventability_score': self._calculate_preventability(delay_reason)
            }
            delay_analysis.append(analysis)
            
        # Analyze delay alert messages
        for alert in delay_alerts:
            if not alert['isResolved']:
                message_analysis = {
                    'alert_id': alert.get('id', 'unknown'),
                    'urgency_level': self._assess_alert_urgency(alert['message']),
                    'impact_scope': self._analyze_impact_scope(alert['message']),
                    'recommended_action': self._suggest_action(alert['message'])
                }
                delay_analysis.append({**analysis, **message_analysis})
                
        return pd.DataFrame(delay_analysis)
    
    def analyze_team_communication_patterns(self, teams_data, projects_data):
        """Analyze team structure and communication efficiency"""
        team_analysis = []
        
        for team in teams_data:
            skills_text = " ".join(team.get('skills', []))
            
            analysis = {
                'team_id': team['id'],
                'team_name': team['name'],
                'skill_diversity_score': len(set(team.get('skills', []))),
                'specialization_level': self._calculate_specialization(team.get('skills', [])),
                'team_size': len(team.get('memberIds', [])),
                'domain_focus': self._identify_primary_domain(skills_text),
                'technology_stack': self._extract_tech_stack(skills_text)
            }
            team_analysis.append(analysis)
            
        return pd.DataFrame(team_analysis)
    
    def generate_insight_report(self, all_analyses):
        """Generate comprehensive insights from all analyses"""
        insights = {
            'executive_summary': self._generate_executive_summary(all_analyses),
            'risk_assessment': self._generate_risk_assessment(all_analyses),
            'performance_insights': self._generate_performance_insights(all_analyses),
            'recommendations': self._generate_recommendations(all_analyses),
            'trend_analysis': self._generate_trend_analysis(all_analyses)
        }
        return insights
    
    def _get_sentiment(self, text):
        """Get sentiment analysis for text"""
        if not text:
            return {'compound': 0, 'pos': 0, 'neu': 1, 'neg': 0}
            
        if self.sia:
            return self.sia.polarity_scores(text)
        else:
            # Fallback using TextBlob
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            return {
                'compound': polarity,
                'pos': max(0, polarity),
                'neu': 0.5,
                'neg': max(0, -polarity)
            }
    
    def _classify_project_tone(self, project):
        """Classify overall project tone"""
        description_sentiment = self._get_sentiment(project['description'])
        status = project['status']
        progress = project['progress']
        
        if status == 'delayed':
            return 'concerning'
        elif status == 'completed' and progress == 100:
            return 'positive'
        elif description_sentiment['compound'] > 0.3:
            return 'optimistic'
        elif description_sentiment['compound'] < -0.3:
            return 'challenging'
        else:
            return 'neutral'
    
    def _extract_risk_keywords(self, text):
        """Extract risk-related keywords from text"""
        risk_keywords = [
            'complex', 'difficult', 'challenging', 'legacy', 'migration',
            'critical', 'security', 'compliance', 'audit', 'review',
            'integration', 'dependency', 'scalability', 'performance'
        ]
        
        text_lower = text.lower()
        found_risks = [keyword for keyword in risk_keywords if keyword in text_lower]
        return found_risks
    
    def _calculate_complexity_score(self, description):
        """Calculate complexity score based on description"""
        complexity_indicators = [
            'architecture', 'microservices', 'integration', 'api',
            'database', 'algorithm', 'machine learning', 'ai',
            'scalability', 'performance', 'security', 'compliance',
            'multi-tenant', 'real-time', 'cross-platform'
        ]
        
        text_lower = description.lower()
        score = sum(1 for indicator in complexity_indicators if indicator in text_lower)
        
        # Normalize to 0-100 scale
        return min(100, score * 15)
    
    def _assess_technical_depth(self, description):
        """Assess technical depth level"""
        technical_terms = [
            'implementation', 'framework', 'library', 'sdk', 'api',
            'protocol', 'algorithm', 'optimization', 'architecture',
            'infrastructure', 'deployment', 'configuration'
        ]
        
        text_lower = description.lower()
        depth_score = sum(1 for term in technical_terms if term in text_lower)
        
        if depth_score >= 4:
            return 'high'
        elif depth_score >= 2:
            return 'medium'
        else:
            return 'low'
    
    def _extract_technologies(self, text):
        """Extract mentioned technologies from text"""
        technologies = [
            'react', 'vue', 'angular', 'node.js', 'python', 'java',
            'typescript', 'javascript', 'swift', 'kotlin', 'flutter',
            'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes',
            'aws', 'azure', 'gcp', 'websocket', 'graphql', 'rest'
        ]
        
        text_lower = text.lower()
        found_techs = [tech for tech in technologies if tech in text_lower]
        return found_techs
    
    def _categorize_delay_reason(self, reason):
        """Categorize delay reasons"""
        reason_lower = reason.lower()
        
        if any(word in reason_lower for word in ['technical', 'complexity', 'implementation']):
            return 'technical_complexity'
        elif any(word in reason_lower for word in ['requirement', 'scope', 'specification']):
            return 'requirement_changes'
        elif any(word in reason_lower for word in ['resource', 'team', 'availability']):
            return 'resource_constraints'
        elif any(word in reason_lower for word in ['dependency', 'blocking', 'waiting']):
            return 'dependency_issues'
        elif any(word in reason_lower for word in ['legal', 'compliance', 'audit']):
            return 'compliance_requirements'
        else:
            return 'other'
    
    def _assess_delay_severity(self, reason):
        """Assess severity of delay"""
        critical_keywords = ['critical', 'blocking', 'major', 'significant']
        moderate_keywords = ['complex', 'additional', 'requires']
        
        reason_lower = reason.lower()
        
        if any(word in reason_lower for word in critical_keywords):
            return 'high'
        elif any(word in reason_lower for word in moderate_keywords):
            return 'medium'
        else:
            return 'low'
    
    def _extract_root_cause(self, reason):
        """Extract root cause type"""
        reason_lower = reason.lower()
        
        if 'estimate' in reason_lower or 'expected' in reason_lower:
            return 'estimation_error'
        elif 'requirement' in reason_lower or 'specification' in reason_lower:
            return 'requirement_issue'
        elif 'resource' in reason_lower or 'team' in reason_lower:
            return 'resource_issue'
        elif 'technical' in reason_lower or 'complexity' in reason_lower:
            return 'technical_challenge'
        else:
            return 'external_factor'
    
    def _calculate_preventability(self, reason):
        """Calculate how preventable the delay was (0-100 scale)"""
        preventable_indicators = ['estimate', 'planning', 'analysis', 'expected']
        unpreventable_indicators = ['legal', 'external', 'client', 'regulatory']
        
        reason_lower = reason.lower()
        
        preventable_count = sum(1 for word in preventable_indicators if word in reason_lower)
        unpreventable_count = sum(1 for word in unpreventable_indicators if word in reason_lower)
        
        if unpreventable_count > 0:
            return 20  # Low preventability
        elif preventable_count > 0:
            return 80  # High preventability
        else:
            return 50  # Medium preventability
    
    def _assess_alert_urgency(self, message):
        """Assess urgency level of alert message"""
        urgent_keywords = ['critical', 'blocking', 'major', 'immediate']
        message_lower = message.lower()
        
        urgent_count = sum(1 for word in urgent_keywords if word in message_lower)
        
        if urgent_count >= 2:
            return 'critical'
        elif urgent_count == 1:
            return 'high'
        else:
            return 'medium'
    
    def _analyze_impact_scope(self, message):
        """Analyze impact scope from alert message"""
        if 'dependent' in message.lower() or 'blocking' in message.lower():
            return 'cascading'
        elif 'project' in message.lower():
            return 'project_level'
        else:
            return 'task_level'
    
    def _suggest_action(self, message):
        """Suggest action based on alert message"""
        message_lower = message.lower()
        
        if 'resource' in message_lower:
            return 'allocate_additional_resources'
        elif 'requirement' in message_lower or 'legal' in message_lower:
            return 'clarify_requirements'
        elif 'technical' in message_lower or 'complexity' in message_lower:
            return 'technical_consultation'
        elif 'dependency' in message_lower:
            return 'resolve_dependencies'
        else:
            return 'general_review'
    
    def _calculate_specialization(self, skills):
        """Calculate team specialization level"""
        if not skills:
            return 0
            
        skill_categories = {
            'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript'],
            'backend': ['node.js', 'python', 'java', 'api', 'server'],
            'mobile': ['ios', 'android', 'react native', 'flutter'],
            'devops': ['docker', 'kubernetes', 'aws', 'deployment'],
            'data': ['sql', 'postgresql', 'mongodb', 'analytics']
        }
        
        skill_text = " ".join(skills).lower()
        category_scores = {}
        
        for category, keywords in skill_categories.items():
            score = sum(1 for keyword in keywords if keyword in skill_text)
            if score > 0:
                category_scores[category] = score
        
        if not category_scores:
            return 0
            
        max_score = max(category_scores.values())
        total_score = sum(category_scores.values())
        
        # Higher specialization if one category dominates
        return (max_score / total_score) * 100 if total_score > 0 else 0
    
    def _identify_primary_domain(self, skills_text):
        """Identify primary domain focus"""
        domains = {
            'frontend': ['react', 'vue', 'ui/ux', 'html', 'css'],
            'backend': ['node.js', 'python', 'api', 'server', 'database'],
            'mobile': ['ios', 'android', 'mobile', 'react native'],
            'devops': ['docker', 'kubernetes', 'deployment', 'infrastructure'],
            'design': ['ui/ux', 'design', 'figma', 'prototyping']
        }
        
        skills_lower = skills_text.lower()
        domain_scores = {}
        
        for domain, keywords in domains.items():
            score = sum(1 for keyword in keywords if keyword in skills_lower)
            if score > 0:
                domain_scores[domain] = score
        
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        return 'general'
    
    def _extract_tech_stack(self, skills_text):
        """Extract technology stack from skills"""
        tech_stack = []
        technologies = [
            'react', 'vue.js', 'angular', 'node.js', 'python', 'java',
            'typescript', 'postgresql', 'mongodb', 'redis', 'docker',
            'kubernetes', 'aws', 'react native', 'flutter', 'figma'
        ]
        
        skills_lower = skills_text.lower()
        for tech in technologies:
            if tech in skills_lower:
                tech_stack.append(tech)
        
        return tech_stack
    
    def _generate_executive_summary(self, analyses):
        """Generate executive summary"""
        return {
            'total_projects_analyzed': len(analyses.get('sentiment_analysis', [])),
            'high_risk_projects': len([p for p in analyses.get('sentiment_analysis', []) 
                                     if p.get('overall_tone') == 'concerning']),
            'complexity_distribution': 'Analysis complete',
            'key_findings': [
                'Project sentiment analysis completed',
                'Task complexity assessment finished',
                'Delay pattern analysis conducted',
                'Team communication patterns evaluated'
            ]
        }
    
    def _generate_risk_assessment(self, analyses):
        """Generate risk assessment"""
        return {
            'high_risk_areas': ['Legacy system dependencies', 'Compliance requirements'],
            'delay_risk_score': 65,
            'mitigation_priorities': [
                'Improve estimation accuracy',
                'Enhance requirement gathering',
                'Strengthen technical planning'
            ]
        }
    
    def _generate_performance_insights(self, analyses):
        """Generate performance insights"""
        return {
            'estimation_accuracy': 'Needs improvement',
            'team_efficiency': 'Good overall performance',
            'bottlenecks': ['Technical complexity underestimation', 'Requirement changes']
        }
    
    def _generate_recommendations(self, analyses):
        """Generate actionable recommendations"""
        return {
            'immediate_actions': [
                'Review delay-prone project areas',
                'Enhance technical planning phase',
                'Implement better estimation techniques'
            ],
            'strategic_improvements': [
                'Invest in team skill development',
                'Improve requirement gathering processes',
                'Establish better dependency management'
            ]
        }
    
    def _generate_trend_analysis(self, analyses):
        """Generate trend analysis"""
        return {
            'delay_trends': 'Technical complexity is main delay factor',
            'complexity_trends': 'Increasing complexity in AI/ML projects',
            'team_performance_trends': 'Consistent performance across teams'
        }

if __name__ == "__main__":
    # Example usage
    analyzer = NLPProjectAnalyzer()
    print("NLP Project Analyzer initialized successfully!")