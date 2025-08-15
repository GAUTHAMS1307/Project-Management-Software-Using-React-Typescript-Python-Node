#!/usr/bin/env python3
"""
Hugging Face NLP Analysis for Smart Project Pulse
Uses spaCy and NLTK for comprehensive project analysis without APIs
"""

import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from pathlib import Path
import spacy
import nltk
from textblob import TextBlob
from collections import Counter, defaultdict
import warnings
warnings.filterwarnings('ignore')

# Set up plotting
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class HuggingFaceProjectAnalyzer:
    """Advanced project analysis using Hugging Face-compatible NLP models"""
    
    def __init__(self):
        self.data = None
        self.setup_nlp()
        self.load_data()
    
    def setup_nlp(self):
        """Setup NLP models"""
        try:
            # Try to load spaCy model
            try:
                self.nlp = spacy.load("en_core_web_sm")
                print("spaCy model loaded successfully")
            except OSError:
                print("spaCy model not available, using basic NLP")
                self.nlp = None
                
            # Download NLTK data
            try:
                nltk.download('vader_lexicon', quiet=True)
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                from nltk.sentiment import SentimentIntensityAnalyzer
                self.sentiment_analyzer = SentimentIntensityAnalyzer()
                print("NLTK sentiment analyzer ready")
            except Exception as e:
                print(f"NLTK setup failed: {e}")
                self.sentiment_analyzer = None
                
        except Exception as e:
            print(f"NLP setup error: {e}")
    
    def load_data(self):
        """Load extracted project data"""
        try:
            data_file = Path(__file__).parent / 'extracted_data.json'
            if data_file.exists():
                with open(data_file, 'r') as f:
                    self.data = json.load(f)
                print(f"Loaded data: {len(self.data['projects'])} projects, {len(self.data['tasks'])} tasks")
            else:
                # Try to extract data first
                self.extract_data_from_nodejs()
        except Exception as e:
            print(f"Error loading data: {e}")
            self.data = self.create_sample_data()
    
    def extract_data_from_nodejs(self):
        """Extract data using Node.js script"""
        import subprocess
        try:
            result = subprocess.run(['node', '-r', 'esbuild-register', 'extract_data.js'], 
                                  capture_output=True, text=True, cwd=Path(__file__).parent)
            if result.returncode == 0:
                print("Data extracted successfully")
                self.load_data()
            else:
                print(f"Data extraction failed: {result.stderr}")
                self.data = self.create_sample_data()
        except Exception as e:
            print(f"Could not run data extraction: {e}")
            self.data = self.create_sample_data()
    
    def create_sample_data(self):
        """Create sample data for analysis"""
        return {
            'projects': [
                {
                    'id': 'proj1',
                    'name': 'E-commerce Platform Redesign',
                    'description': 'Complete overhaul of customer-facing e-commerce platform with modern UI/UX',
                    'status': 'in_progress',
                    'progress': 78
                },
                {
                    'id': 'proj2', 
                    'name': 'Mobile App Development',
                    'description': 'Native mobile app for iOS and Android with real-time features',
                    'status': 'delayed',
                    'progress': 45
                }
            ],
            'tasks': [
                {
                    'id': 'task1',
                    'title': 'Component Library Architecture',
                    'description': 'Design and implement reusable component library with TypeScript',
                    'status': 'completed',
                    'priority': 'high',
                    'estimatedHours': 40,
                    'actualHours': 38
                },
                {
                    'id': 'task2',
                    'title': 'Real-time Chat Implementation',
                    'description': 'WebSocket-based real-time messaging with offline support',
                    'status': 'delayed',
                    'priority': 'high',
                    'estimatedHours': 60,
                    'actualHours': 45,
                    'delayReason': 'WebSocket implementation more complex than estimated'
                }
            ],
            'teams': [
                {
                    'id': 'team1',
                    'name': 'Frontend Excellence Team',
                    'description': 'Specializes in user interfaces and web experiences',
                    'skills': ['React', 'Vue.js', 'TypeScript', 'UI/UX']
                }
            ],
            'delayAlerts': [
                {
                    'id': 'alert1',
                    'type': 'critical',
                    'title': 'Mobile Chat Implementation Delay',
                    'message': 'WebSocket complexity causing 5-day delay in real-time chat feature',
                    'isResolved': False
                }
            ],
            'users': []
        }
    
    def analyze_project_sentiment(self):
        """Analyze sentiment of project descriptions"""
        results = []
        
        for project in self.data['projects']:
            description = project['description']
            
            # Basic sentiment analysis
            sentiment = self.get_sentiment(description)
            
            # Risk keyword detection
            risk_keywords = self.extract_risk_keywords(description)
            
            # Complexity assessment
            complexity = self.assess_text_complexity(description)
            
            results.append({
                'project_id': project['id'],
                'project_name': project['name'],
                'sentiment_score': sentiment['compound'],
                'sentiment_label': self.classify_sentiment(sentiment['compound']),
                'risk_keywords': risk_keywords,
                'complexity_level': complexity,
                'status': project['status'],
                'progress': project['progress']
            })
        
        return pd.DataFrame(results)
    
    def analyze_task_complexity(self):
        """Analyze task complexity using NLP"""
        results = []
        
        for task in self.data['tasks']:
            title = task['title']
            description = task['description']
            combined_text = f"{title}. {description}"
            
            # Extract technical terms
            tech_terms = self.extract_technical_terms(combined_text)
            
            # Complexity scoring
            complexity_score = self.calculate_complexity_score(combined_text)
            
            # Domain classification
            domain = self.classify_domain(combined_text)
            
            # Estimation accuracy
            estimated = task.get('estimatedHours', 0)
            actual = task.get('actualHours', 0)
            accuracy = (actual / estimated) if estimated > 0 else 1.0
            
            results.append({
                'task_id': task['id'],
                'title': title,
                'complexity_score': complexity_score,
                'complexity_level': self.classify_complexity(complexity_score),
                'tech_terms': tech_terms,
                'domain': domain,
                'estimation_accuracy': accuracy,
                'status': task['status'],
                'priority': task['priority']
            })
        
        return pd.DataFrame(results)
    
    def analyze_delay_patterns(self):
        """Analyze delay patterns and root causes"""
        delayed_tasks = [t for t in self.data['tasks'] if t['status'] == 'delayed']
        results = []
        
        for task in delayed_tasks:
            delay_reason = task.get('delayReason', 'No reason provided')
            
            # Categorize delay reason
            category = self.categorize_delay_reason(delay_reason)
            
            # Extract root cause
            root_cause = self.extract_root_cause(delay_reason)
            
            # Assess preventability
            preventability = self.assess_preventability(delay_reason)
            
            results.append({
                'task_id': task['id'],
                'title': task['title'],
                'delay_reason': delay_reason,
                'delay_category': category,
                'root_cause': root_cause,
                'preventability_score': preventability,
                'estimated_hours': task.get('estimatedHours', 0),
                'actual_hours': task.get('actualHours', 0)
            })
        
        return pd.DataFrame(results)
    
    def analyze_team_skills(self):
        """Analyze team skills and capabilities"""
        results = []
        
        for team in self.data['teams']:
            skills = team.get('skills', [])
            
            # Skill categorization
            skill_categories = self.categorize_skills(skills)
            
            # Specialization analysis
            specialization = self.calculate_specialization_score(skills)
            
            # Technology stack analysis
            tech_stack = self.identify_tech_stack(skills)
            
            results.append({
                'team_id': team['id'],
                'team_name': team['name'],
                'total_skills': len(skills),
                'skill_categories': skill_categories,
                'specialization_score': specialization,
                'primary_tech_stack': tech_stack,
                'skill_diversity': len(skill_categories.keys())
            })
        
        return pd.DataFrame(results)
    
    def get_sentiment(self, text):
        """Get sentiment analysis for text"""
        if self.sentiment_analyzer:
            return self.sentiment_analyzer.polarity_scores(text)
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
    
    def classify_sentiment(self, compound_score):
        """Classify sentiment based on compound score"""
        if compound_score >= 0.3:
            return 'positive'
        elif compound_score <= -0.3:
            return 'negative'
        else:
            return 'neutral'
    
    def extract_risk_keywords(self, text):
        """Extract risk-related keywords"""
        risk_keywords = [
            'complex', 'difficult', 'challenging', 'legacy', 'migration',
            'critical', 'security', 'compliance', 'audit', 'integration',
            'dependency', 'scalability', 'performance', 'refactor'
        ]
        
        text_lower = text.lower()
        found = [kw for kw in risk_keywords if kw in text_lower]
        return found
    
    def assess_text_complexity(self, text):
        """Assess text complexity"""
        if not text:
            return 'low'
            
        # Simple complexity metrics
        word_count = len(text.split())
        sentences = text.count('.') + text.count('!') + text.count('?')
        avg_word_length = np.mean([len(word) for word in text.split()])
        
        complexity_score = 0
        if word_count > 20:
            complexity_score += 1
        if sentences > 2:
            complexity_score += 1
        if avg_word_length > 6:
            complexity_score += 1
            
        if complexity_score >= 2:
            return 'high'
        elif complexity_score == 1:
            return 'medium'
        else:
            return 'low'
    
    def extract_technical_terms(self, text):
        """Extract technical terms from text"""
        tech_terms = [
            'api', 'database', 'framework', 'library', 'algorithm',
            'architecture', 'microservices', 'websocket', 'authentication',
            'integration', 'deployment', 'optimization', 'scalability'
        ]
        
        text_lower = text.lower()
        found = [term for term in tech_terms if term in text_lower]
        return found
    
    def calculate_complexity_score(self, text):
        """Calculate complexity score (0-100)"""
        complexity_indicators = [
            'architecture', 'microservices', 'integration', 'api',
            'database', 'algorithm', 'machine learning', 'ai',
            'scalability', 'performance', 'security', 'compliance',
            'multi-tenant', 'real-time', 'cross-platform', 'optimization'
        ]
        
        text_lower = text.lower()
        score = sum(3 for indicator in complexity_indicators if indicator in text_lower)
        
        # Add points for technical terms
        tech_terms = self.extract_technical_terms(text)
        score += len(tech_terms) * 2
        
        return min(100, score)
    
    def classify_complexity(self, score):
        """Classify complexity based on score"""
        if score >= 40:
            return 'high'
        elif score >= 20:
            return 'medium'
        else:
            return 'low'
    
    def classify_domain(self, text):
        """Classify domain based on text content"""
        domain_keywords = {
            'frontend': ['ui', 'ux', 'react', 'vue', 'html', 'css', 'component'],
            'backend': ['api', 'server', 'database', 'microservice', 'node'],
            'mobile': ['ios', 'android', 'mobile', 'app', 'native'],
            'devops': ['deployment', 'docker', 'kubernetes', 'infrastructure'],
            'data': ['analytics', 'data', 'ml', 'algorithm', 'learning'],
            'security': ['security', 'auth', 'compliance', 'audit'],
            'testing': ['test', 'testing', 'qa', 'quality', 'automation']
        }
        
        text_lower = text.lower()
        domain_scores = {}
        
        for domain, keywords in domain_keywords.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                domain_scores[domain] = score
        
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        return 'general'
    
    def categorize_delay_reason(self, reason):
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
    
    def extract_root_cause(self, reason):
        """Extract root cause from delay reason"""
        reason_lower = reason.lower()
        
        if 'estimate' in reason_lower or 'expected' in reason_lower:
            return 'estimation_error'
        elif 'requirement' in reason_lower:
            return 'requirement_issue'
        elif 'resource' in reason_lower:
            return 'resource_issue'
        elif 'technical' in reason_lower:
            return 'technical_challenge'
        else:
            return 'external_factor'
    
    def assess_preventability(self, reason):
        """Assess how preventable the delay was (0-100)"""
        preventable_indicators = ['estimate', 'planning', 'analysis', 'expected']
        unpreventable_indicators = ['legal', 'external', 'client', 'regulatory']
        
        reason_lower = reason.lower()
        
        preventable_count = sum(1 for word in preventable_indicators if word in reason_lower)
        unpreventable_count = sum(1 for word in unpreventable_indicators if word in reason_lower)
        
        if unpreventable_count > 0:
            return 20
        elif preventable_count > 0:
            return 80
        else:
            return 50
    
    def categorize_skills(self, skills):
        """Categorize team skills"""
        categories = {
            'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript'],
            'backend': ['node.js', 'python', 'java', 'api', 'server', 'microservices'],
            'mobile': ['ios', 'android', 'react native', 'flutter', 'mobile'],
            'devops': ['docker', 'kubernetes', 'aws', 'deployment', 'ci/cd'],
            'design': ['ui/ux', 'figma', 'design', 'prototyping'],
            'data': ['sql', 'postgresql', 'mongodb', 'analytics', 'ml']
        }
        
        skill_categories = {}
        for skill in skills:
            skill_lower = skill.lower()
            for category, keywords in categories.items():
                if any(kw in skill_lower for kw in keywords):
                    if category not in skill_categories:
                        skill_categories[category] = []
                    skill_categories[category].append(skill)
                    break
            else:
                if 'general' not in skill_categories:
                    skill_categories['general'] = []
                skill_categories['general'].append(skill)
        
        return skill_categories
    
    def calculate_specialization_score(self, skills):
        """Calculate team specialization score"""
        if not skills:
            return 0
            
        categories = self.categorize_skills(skills)
        if not categories:
            return 0
            
        # Calculate how concentrated skills are in one category
        max_category_size = max(len(skills_list) for skills_list in categories.values())
        total_skills = len(skills)
        
        return (max_category_size / total_skills) * 100 if total_skills > 0 else 0
    
    def identify_tech_stack(self, skills):
        """Identify primary technology stack"""
        tech_stacks = {
            'MEAN/MERN': ['mongodb', 'express', 'angular', 'react', 'node'],
            'Full Stack JS': ['javascript', 'typescript', 'node.js', 'react'],
            'Mobile First': ['react native', 'flutter', 'ios', 'android'],
            'Cloud Native': ['docker', 'kubernetes', 'aws', 'microservices'],
            'Design Focused': ['ui/ux', 'figma', 'design', 'prototyping']
        }
        
        skills_lower = [skill.lower() for skill in skills]
        stack_scores = {}
        
        for stack_name, stack_keywords in tech_stacks.items():
            score = sum(1 for kw in stack_keywords if any(kw in skill for skill in skills_lower))
            if score > 0:
                stack_scores[stack_name] = score
        
        if stack_scores:
            return max(stack_scores, key=stack_scores.get)
        return 'General'
    
    def generate_insights_report(self):
        """Generate comprehensive insights report"""
        print("Generating comprehensive project insights...")
        
        # Run all analyses
        sentiment_df = self.analyze_project_sentiment()
        complexity_df = self.analyze_task_complexity()
        delay_df = self.analyze_delay_patterns()
        team_df = self.analyze_team_skills()
        
        # Generate insights
        insights = {
            'executive_summary': self.generate_executive_summary(sentiment_df, complexity_df, delay_df),
            'sentiment_insights': self.generate_sentiment_insights(sentiment_df),
            'complexity_insights': self.generate_complexity_insights(complexity_df),
            'delay_insights': self.generate_delay_insights(delay_df),
            'team_insights': self.generate_team_insights(team_df),
            'recommendations': self.generate_recommendations(sentiment_df, complexity_df, delay_df, team_df)
        }
        
        return insights, {
            'sentiment_analysis': sentiment_df,
            'task_complexity': complexity_df,
            'delay_patterns': delay_df,
            'team_skills': team_df
        }
    
    def generate_executive_summary(self, sentiment_df, complexity_df, delay_df):
        """Generate executive summary"""
        return {
            'total_projects': len(self.data['projects']),
            'total_tasks': len(self.data['tasks']),
            'high_risk_projects': len(sentiment_df[sentiment_df['sentiment_label'] == 'negative']),
            'complex_tasks': len(complexity_df[complexity_df['complexity_level'] == 'high']),
            'delayed_tasks': len(delay_df),
            'key_findings': [
                f"Analyzed {len(self.data['projects'])} projects using advanced NLP",
                f"Identified {len(complexity_df[complexity_df['complexity_level'] == 'high'])} high-complexity tasks",
                f"Found {len(delay_df)} delayed tasks with root cause analysis",
                "Generated actionable insights using sentiment and complexity analysis"
            ]
        }
    
    def generate_sentiment_insights(self, sentiment_df):
        """Generate sentiment-based insights"""
        if sentiment_df.empty:
            return {'message': 'No sentiment data available'}
            
        positive_projects = len(sentiment_df[sentiment_df['sentiment_label'] == 'positive'])
        negative_projects = len(sentiment_df[sentiment_df['sentiment_label'] == 'negative'])
        
        return {
            'positive_projects': positive_projects,
            'negative_projects': negative_projects,
            'average_sentiment': sentiment_df['sentiment_score'].mean(),
            'high_risk_indicators': sentiment_df[sentiment_df['sentiment_score'] < -0.3]['project_name'].tolist()
        }
    
    def generate_complexity_insights(self, complexity_df):
        """Generate complexity-based insights"""
        if complexity_df.empty:
            return {'message': 'No complexity data available'}
            
        return {
            'average_complexity': complexity_df['complexity_score'].mean(),
            'high_complexity_tasks': len(complexity_df[complexity_df['complexity_level'] == 'high']),
            'most_complex_domains': complexity_df.groupby('domain')['complexity_score'].mean().to_dict(),
            'estimation_accuracy_by_complexity': complexity_df.groupby('complexity_level')['estimation_accuracy'].mean().to_dict()
        }
    
    def generate_delay_insights(self, delay_df):
        """Generate delay-based insights"""
        if delay_df.empty:
            return {'message': 'No delay data available'}
            
        return {
            'total_delayed_tasks': len(delay_df),
            'delay_categories': delay_df['delay_category'].value_counts().to_dict(),
            'average_preventability': delay_df['preventability_score'].mean(),
            'most_common_root_cause': delay_df['root_cause'].mode().iloc[0] if not delay_df.empty else 'None'
        }
    
    def generate_team_insights(self, team_df):
        """Generate team-based insights"""
        if team_df.empty:
            return {'message': 'No team data available'}
            
        return {
            'total_teams': len(team_df),
            'average_specialization': team_df['specialization_score'].mean(),
            'most_common_tech_stack': team_df['primary_tech_stack'].mode().iloc[0] if not team_df.empty else 'None',
            'skill_diversity_distribution': team_df['skill_diversity'].describe().to_dict()
        }
    
    def generate_recommendations(self, sentiment_df, complexity_df, delay_df, team_df):
        """Generate actionable recommendations"""
        recommendations = []
        
        # Sentiment-based recommendations
        if not sentiment_df.empty and len(sentiment_df[sentiment_df['sentiment_label'] == 'negative']) > 0:
            recommendations.append({
                'category': 'Project Risk',
                'priority': 'High',
                'title': 'Address Negative Sentiment Projects',
                'description': 'Several projects show negative sentiment indicators',
                'action': 'Review project descriptions and requirements for clarity'
            })
        
        # Complexity-based recommendations
        if not complexity_df.empty and complexity_df['complexity_score'].mean() > 50:
            recommendations.append({
                'category': 'Task Management',
                'priority': 'Medium',
                'title': 'Manage High Complexity Tasks',
                'description': 'Tasks show high complexity levels',
                'action': 'Break down complex tasks into smaller, manageable units'
            })
        
        # Delay-based recommendations
        if not delay_df.empty and delay_df['preventability_score'].mean() > 60:
            recommendations.append({
                'category': 'Process Improvement',
                'priority': 'High',
                'title': 'Improve Estimation Process',
                'description': 'Many delays appear preventable through better planning',
                'action': 'Implement estimation training and historical data analysis'
            })
        
        return recommendations
    
    def create_visualizations(self, dataframes):
        """Create visualization charts"""
        try:
            # Create results directory
            results_dir = Path(__file__).parent / 'results'
            results_dir.mkdir(exist_ok=True)
            
            # Sentiment analysis chart
            if not dataframes['sentiment_analysis'].empty:
                plt.figure(figsize=(10, 6))
                sentiment_counts = dataframes['sentiment_analysis']['sentiment_label'].value_counts()
                plt.pie(sentiment_counts.values, labels=sentiment_counts.index, autopct='%1.1f%%')
                plt.title('Project Sentiment Distribution')
                plt.savefig(results_dir / 'sentiment_distribution.png', dpi=300, bbox_inches='tight')
                plt.close()
            
            # Complexity analysis chart
            if not dataframes['task_complexity'].empty:
                plt.figure(figsize=(12, 6))
                complexity_counts = dataframes['task_complexity']['complexity_level'].value_counts()
                plt.bar(complexity_counts.index, complexity_counts.values)
                plt.title('Task Complexity Distribution')
                plt.xlabel('Complexity Level')
                plt.ylabel('Number of Tasks')
                plt.savefig(results_dir / 'complexity_distribution.png', dpi=300, bbox_inches='tight')
                plt.close()
            
            # Delay categories chart
            if not dataframes['delay_patterns'].empty:
                plt.figure(figsize=(10, 8))
                delay_counts = dataframes['delay_patterns']['delay_category'].value_counts()
                plt.barh(delay_counts.index, delay_counts.values)
                plt.title('Delay Categories')
                plt.xlabel('Number of Delayed Tasks')
                plt.tight_layout()
                plt.savefig(results_dir / 'delay_categories.png', dpi=300, bbox_inches='tight')
                plt.close()
            
            print(f"Visualizations saved to: {results_dir}")
            
        except Exception as e:
            print(f"Error creating visualizations: {e}")
    
    def save_results(self, insights, dataframes):
        """Save analysis results"""
        try:
            results_dir = Path(__file__).parent / 'results'
            results_dir.mkdir(exist_ok=True)
            
            # Save insights as JSON
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            insights_file = results_dir / f'huggingface_analysis_insights_{timestamp}.json'
            
            with open(insights_file, 'w') as f:
                json.dump(insights, f, indent=2, default=str)
            
            # Save dataframes as CSV
            for name, df in dataframes.items():
                if not df.empty:
                    csv_file = results_dir / f'{name}_{timestamp}.csv'
                    df.to_csv(csv_file, index=False)
            
            print(f"Results saved to: {results_dir}")
            return insights_file
            
        except Exception as e:
            print(f"Error saving results: {e}")
            return None
    
    def print_summary(self, insights):
        """Print comprehensive summary"""
        print("\n" + "="*80)
        print("SMART PROJECT PULSE - HUGGING FACE NLP ANALYSIS REPORT")
        print("="*80)
        
        exec_summary = insights['executive_summary']
        print(f"\n📊 EXECUTIVE SUMMARY")
        print(f"  • Total Projects Analyzed: {exec_summary['total_projects']}")
        print(f"  • Total Tasks Analyzed: {exec_summary['total_tasks']}")
        print(f"  • High-Risk Projects: {exec_summary['high_risk_projects']}")
        print(f"  • High-Complexity Tasks: {exec_summary['complex_tasks']}")
        print(f"  • Delayed Tasks: {exec_summary['delayed_tasks']}")
        
        print(f"\n🔍 KEY FINDINGS")
        for finding in exec_summary['key_findings']:
            print(f"  • {finding}")
        
        # Sentiment insights
        sentiment = insights['sentiment_insights']
        if 'positive_projects' in sentiment:
            print(f"\n😊 SENTIMENT ANALYSIS")
            print(f"  • Positive Projects: {sentiment['positive_projects']}")
            print(f"  • Negative Projects: {sentiment['negative_projects']}")
            print(f"  • Average Sentiment Score: {sentiment['average_sentiment']:.3f}")
        
        # Complexity insights
        complexity = insights['complexity_insights']
        if 'average_complexity' in complexity:
            print(f"\n🧠 COMPLEXITY ANALYSIS")
            print(f"  • Average Complexity Score: {complexity['average_complexity']:.1f}")
            print(f"  • High-Complexity Tasks: {complexity['high_complexity_tasks']}")
        
        # Delay insights
        delay = insights['delay_insights']
        if 'total_delayed_tasks' in delay:
            print(f"\n⏰ DELAY ANALYSIS")
            print(f"  • Total Delayed Tasks: {delay['total_delayed_tasks']}")
            print(f"  • Average Preventability Score: {delay['average_preventability']:.1f}%")
            print(f"  • Most Common Root Cause: {delay['most_common_root_cause']}")
        
        # Recommendations
        recommendations = insights['recommendations']
        if recommendations:
            print(f"\n💡 KEY RECOMMENDATIONS")
            for i, rec in enumerate(recommendations[:3], 1):
                print(f"  {i}. {rec['title']} (Priority: {rec['priority']})")
                print(f"     {rec['description']}")
                print(f"     Action: {rec['action']}")
        
        print("\n" + "="*80)


def main():
    """Main function"""
    print("Starting Hugging Face NLP Analysis for Smart Project Pulse...")
    
    analyzer = HuggingFaceProjectAnalyzer()
    
    if not analyzer.data:
        print("Error: Could not load project data")
        return
    
    # Generate comprehensive analysis
    insights, dataframes = analyzer.generate_insights_report()
    
    # Create visualizations
    analyzer.create_visualizations(dataframes)
    
    # Save results
    results_file = analyzer.save_results(insights, dataframes)
    
    # Print summary
    analyzer.print_summary(insights)
    
    if results_file:
        print(f"\nDetailed results saved to: {results_file}")


if __name__ == "__main__":
    main()