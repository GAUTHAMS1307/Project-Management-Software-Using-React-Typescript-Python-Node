"""
Main analysis runner for the Smart Project Pulse delay prediction system.
Orchestrates data loading, model training, predictions, and visualization generation.
"""

import sys
import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional

# Add the python_analysis directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_loader import DataLoader
from delay_predictor import DelayPredictor
from data_visualizer import DataVisualizer

class AnalysisRunner:
    def __init__(self):
        """Initialize the analysis runner with all components."""
        print("Initializing Smart Project Pulse Analysis System...")
        self.data_loader = DataLoader()
        self.predictor = DelayPredictor()
        self.visualizer = DataVisualizer()
        self.data = {}
        self.predictions = []
        
    def load_all_data(self) -> bool:
        """Load all project data from database or mock sources."""
        print("Loading project data...")
        try:
            self.data = self.data_loader.get_comprehensive_dataset()
            
            # Print data summary
            for key, df in self.data.items():
                print(f"  - {key}: {len(df)} records loaded")
            
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def train_prediction_models(self) -> Dict[str, Any]:
        """Train machine learning models for delay prediction."""
        print("Training delay prediction models...")
        
        if not self.data:
            print("No data available for training")
            return {"error": "No data available"}
        
        try:
            training_results = self.predictor.train_models(self.data)
            
            if "error" not in training_results:
                print("Model training completed successfully!")
                print(f"  - Training samples: {training_results.get('training_samples', 0)}")
                print(f"  - Test samples: {training_results.get('test_samples', 0)}")
                print(f"  - Duration RMSE: {training_results.get('duration_rmse', 0):.2f}")
                
                # Display feature importance
                feature_importance = training_results.get('feature_importance', {})
                if feature_importance:
                    print("  - Top important features:")
                    sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
                    for feature, importance in sorted_features[:5]:
                        print(f"    {feature}: {importance:.3f}")
            
            return training_results
            
        except Exception as e:
            print(f"Error during model training: {e}")
            return {"error": str(e)}
    
    def generate_predictions_for_all_tasks(self) -> List[Dict[str, Any]]:
        """Generate delay predictions for all active tasks."""
        print("Generating predictions for all tasks...")
        
        if not self.predictor.is_trained:
            print("Models not trained yet. Training models first...")
            self.train_prediction_models()
        
        if not self.predictor.is_trained:
            print("Failed to train models. Cannot generate predictions.")
            return []
        
        tasks_df = self.data.get('tasks')
        if tasks_df is None or tasks_df.empty:
            print("No tasks data available for predictions")
            return []
        
        self.predictions = []
        
        for _, task in tasks_df.iterrows():
            try:
                # Prepare task data for prediction
                task_data = {
                    'estimated_hours': task.get('estimated_hours', 24),
                    'progress_ratio': task.get('progress_ratio', 0.5),
                    'dependency_count': task.get('dependency_count', 0),
                    'team_size': 3,  # Default team size
                    'priority_numeric': task.get('priority_numeric', 2),
                    'domain_complexity_score': 25,  # Default complexity
                    'assignee_experience_score': 50,  # Default experience
                    'project_complexity_score': 30   # Default project complexity
                }
                
                prediction = self.predictor.predict_task_delay(task_data)
                prediction['task_id'] = task.get('id', '')
                prediction['task_title'] = task.get('title', 'Unknown Task')
                prediction['current_status'] = task.get('status', 'unknown')
                prediction['priority'] = task.get('priority', 'medium')
                
                self.predictions.append(prediction)
                
            except Exception as e:
                print(f"Error predicting for task {task.get('id', 'unknown')}: {e}")
        
        print(f"Generated predictions for {len(self.predictions)} tasks")
        return self.predictions
    
    def analyze_project_risks(self, project_id: Optional[str] = None) -> Dict[str, Any]:
        """Perform comprehensive risk analysis."""
        print(f"Analyzing project risks{' for project ' + project_id if project_id else ' for all projects'}...")
        
        try:
            risk_analysis = self.predictor.analyze_project_risks(self.data, project_id)
            
            if "error" not in risk_analysis:
                print("Risk analysis completed:")
                print(f"  - Total tasks analyzed: {risk_analysis.get('total_tasks', 0)}")
                print(f"  - Tasks with delays: {risk_analysis.get('delayed_tasks', 0)}")
                print(f"  - High risk tasks: {risk_analysis.get('high_risk_tasks', 0)}")
                print(f"  - Average delay: {risk_analysis.get('average_delay_days', 0):.1f} days")
            
            return risk_analysis
            
        except Exception as e:
            print(f"Error during risk analysis: {e}")
            return {"error": str(e)}
    
    def get_delay_trends(self) -> Dict[str, Any]:
        """Analyze delay trends over time."""
        print("Analyzing delay trends...")
        
        try:
            trends = self.predictor.get_delay_trends(self.data)
            print("Delay trends analysis completed")
            return trends
            
        except Exception as e:
            print(f"Error analyzing delay trends: {e}")
            return {"error": str(e)}
    
    def generate_visualizations(self, save_charts: bool = True) -> Dict[str, str]:
        """Generate all visualization charts."""
        print("Generating visualization charts...")
        
        try:
            if save_charts:
                charts = self.visualizer.save_all_charts(self.data, self.predictions)
                print(f"Generated {len(charts)} charts:")
                for chart_name, path in charts.items():
                    print(f"  - {chart_name}: {path}")
                return charts
            else:
                # Display charts without saving
                self.visualizer.create_comprehensive_dashboard(self.data, self.predictions)
                return {"status": "Charts displayed"}
                
        except Exception as e:
            print(f"Error generating visualizations: {e}")
            return {"error": str(e)}
    
    def run_comprehensive_analysis(self, save_results: bool = True) -> Dict[str, Any]:
        """Run complete analysis pipeline."""
        print("=" * 60)
        print("SMART PROJECT PULSE - COMPREHENSIVE ANALYSIS")
        print("=" * 60)
        
        # Load data
        if not self.load_all_data():
            return {"error": "Failed to load data"}
        
        # Train models
        training_results = self.train_prediction_models()
        if "error" in training_results:
            return {"error": "Failed to train models", "details": training_results}
        
        # Generate predictions
        predictions = self.generate_predictions_for_all_tasks()
        
        # Risk analysis
        risk_analysis = self.analyze_project_risks()
        
        # Trend analysis
        trends = self.get_delay_trends()
        
        # Generate visualizations
        charts = self.generate_visualizations(save_charts=save_results)
        
        # Compile comprehensive results
        results = {
            "timestamp": datetime.now().isoformat(),
            "data_summary": {
                "users": len(self.data.get('users', [])),
                "projects": len(self.data.get('projects', [])),
                "tasks": len(self.data.get('tasks', [])),
                "teams": len(self.data.get('teams', [])),
                "delay_alerts": len(self.data.get('delay_alerts', []))
            },
            "training_results": training_results,
            "predictions": {
                "total_predictions": len(predictions),
                "high_risk_tasks": len([p for p in predictions if p.get('risk_score', 0) > 70]),
                "average_predicted_delay": sum(p.get('predicted_delay_days', 0) for p in predictions) / max(len(predictions), 1)
            },
            "risk_analysis": risk_analysis,
            "trends": trends,
            "charts_generated": charts
        }
        
        # Save results to file
        if save_results:
            try:
                os.makedirs("python_analysis/results", exist_ok=True)
                results_file = f"python_analysis/results/analysis_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                
                # Convert any numpy types to native Python types for JSON serialization
                def convert_for_json(obj):
                    if hasattr(obj, 'tolist'):
                        return obj.tolist()
                    elif hasattr(obj, 'item'):
                        return obj.item()
                    elif isinstance(obj, dict):
                        return {k: convert_for_json(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [convert_for_json(item) for item in obj]
                    else:
                        return obj
                
                json_results = convert_for_json(results)
                
                with open(results_file, 'w') as f:
                    json.dump(json_results, f, indent=2, default=str)
                
                print(f"Analysis results saved to: {results_file}")
                results["results_file"] = results_file
                
            except Exception as e:
                print(f"Error saving results: {e}")
        
        print("=" * 60)
        print("ANALYSIS COMPLETED SUCCESSFULLY")
        print("=" * 60)
        
        return results
    
    def get_high_risk_recommendations(self) -> List[Dict[str, Any]]:
        """Get specific recommendations for high-risk tasks."""
        if not self.predictions:
            print("No predictions available. Run analysis first.")
            return []
        
        high_risk_tasks = [
            pred for pred in self.predictions 
            if pred.get('risk_score', 0) > 60
        ]
        
        recommendations = []
        for task in high_risk_tasks:
            rec = {
                "task_id": task.get('task_id'),
                "task_title": task.get('task_title'),
                "risk_score": task.get('risk_score'),
                "predicted_delay": task.get('predicted_delay_days'),
                "current_status": task.get('current_status'),
                "priority": task.get('priority'),
                "recommendation": task.get('recommendation'),
                "actions": []
            }
            
            # Generate specific action items
            risk_score = task.get('risk_score', 0)
            if risk_score > 80:
                rec["actions"] = [
                    "Immediate manager intervention required",
                    "Consider reassigning critical resources",
                    "Review and potentially extend deadline",
                    "Implement daily check-ins"
                ]
            elif risk_score > 60:
                rec["actions"] = [
                    "Increase monitoring frequency",
                    "Review task dependencies",
                    "Consider additional resources",
                    "Implement risk mitigation plan"
                ]
            
            recommendations.append(rec)
        
        return recommendations

def main():
    """Main entry point for the analysis system."""
    runner = AnalysisRunner()
    
    # Run comprehensive analysis
    results = runner.run_comprehensive_analysis()
    
    # Display high-risk recommendations
    recommendations = runner.get_high_risk_recommendations()
    if recommendations:
        print("\nHIGH-RISK TASK RECOMMENDATIONS:")
        print("-" * 40)
        for rec in recommendations:
            print(f"Task: {rec['task_title']}")
            print(f"Risk Score: {rec['risk_score']:.1f}")
            print(f"Predicted Delay: {rec['predicted_delay']:.1f} days")
            print(f"Recommendation: {rec['recommendation']}")
            print()

if __name__ == "__main__":
    main()