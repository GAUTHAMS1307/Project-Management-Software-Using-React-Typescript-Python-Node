"""
API integration module for connecting Python analysis with Node.js backend.
Provides endpoints and utilities to expose Python analysis results to the web application.
"""

import subprocess
import sys
import os
import json
from typing import Dict, Any, List, Optional
from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from analysis_runner import AnalysisRunner

class PythonAnalysisAPI:
    def __init__(self, port: int = 5001):
        """Initialize the Python analysis API server."""
        self.app = Flask(__name__)
        CORS(self.app)  # Enable CORS for communication with Node.js frontend
        self.port = port
        self.analysis_runner = AnalysisRunner()
        self.last_analysis_results = None
        self.setup_routes()
        
    def setup_routes(self):
        """Setup API routes for analysis functions."""
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            """Health check endpoint."""
            return jsonify({"status": "healthy", "service": "python_analysis"})
        
        @self.app.route('/analyze/full', methods=['GET', 'POST'])
        def run_full_analysis():
            """Run comprehensive analysis and return results."""
            try:
                print("Starting comprehensive analysis...")
                results = self.analysis_runner.run_comprehensive_analysis()
                self.last_analysis_results = results
                
                return jsonify({
                    "success": True,
                    "results": results,
                    "message": "Comprehensive analysis completed successfully"
                })
                
            except Exception as e:
                print(f"Analysis error: {e}")
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Analysis failed"
                }), 500
        
        @self.app.route('/analyze/predictions', methods=['GET', 'POST'])
        def get_predictions():
            """Generate delay predictions for all tasks."""
            try:
                # Load data if not already loaded
                if not self.analysis_runner.data:
                    self.analysis_runner.load_all_data()
                
                # Train models if not trained
                if not self.analysis_runner.predictor.is_trained:
                    self.analysis_runner.train_prediction_models()
                
                # Generate predictions
                predictions = self.analysis_runner.generate_predictions_for_all_tasks()
                
                return jsonify({
                    "success": True,
                    "predictions": predictions,
                    "total_predictions": len(predictions),
                    "message": f"Generated predictions for {len(predictions)} tasks"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Prediction generation failed"
                }), 500
        
        @self.app.route('/analyze/risk/<project_id>', methods=['GET'])
        def analyze_project_risk(project_id):
            """Analyze risk for a specific project."""
            try:
                if not self.analysis_runner.data:
                    self.analysis_runner.load_all_data()
                
                risk_analysis = self.analysis_runner.analyze_project_risks(project_id)
                
                return jsonify({
                    "success": True,
                    "risk_analysis": risk_analysis,
                    "project_id": project_id,
                    "message": "Risk analysis completed"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Risk analysis failed"
                }), 500
        
        @self.app.route('/analyze/risk', methods=['GET'])
        def analyze_all_projects_risk():
            """Analyze risk for all projects."""
            try:
                if not self.analysis_runner.data:
                    self.analysis_runner.load_all_data()
                
                risk_analysis = self.analysis_runner.analyze_project_risks()
                
                return jsonify({
                    "success": True,
                    "risk_analysis": risk_analysis,
                    "message": "Overall risk analysis completed"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Risk analysis failed"
                }), 500
        
        @self.app.route('/analyze/trends', methods=['GET'])
        def get_delay_trends():
            """Get delay trends analysis."""
            try:
                if not self.analysis_runner.data:
                    self.analysis_runner.load_all_data()
                
                trends = self.analysis_runner.get_delay_trends()
                
                return jsonify({
                    "success": True,
                    "trends": trends,
                    "message": "Trend analysis completed"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Trend analysis failed"
                }), 500
        
        @self.app.route('/analyze/recommendations', methods=['GET'])
        def get_recommendations():
            """Get high-risk task recommendations."""
            try:
                recommendations = self.analysis_runner.get_high_risk_recommendations()
                
                return jsonify({
                    "success": True,
                    "recommendations": recommendations,
                    "total_high_risk": len(recommendations),
                    "message": f"Generated recommendations for {len(recommendations)} high-risk tasks"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Recommendation generation failed"
                }), 500
        
        @self.app.route('/analyze/predict_task', methods=['POST'])
        def predict_single_task():
            """Predict delay for a single task."""
            try:
                task_data = request.get_json()
                
                if not task_data:
                    return jsonify({
                        "success": False,
                        "error": "No task data provided",
                        "message": "Task data is required"
                    }), 400
                
                # Ensure models are trained
                if not self.analysis_runner.predictor.is_trained:
                    if not self.analysis_runner.data:
                        self.analysis_runner.load_all_data()
                    self.analysis_runner.train_prediction_models()
                
                prediction = self.analysis_runner.predictor.predict_task_delay(task_data)
                
                return jsonify({
                    "success": True,
                    "prediction": prediction,
                    "message": "Task prediction completed"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Task prediction failed"
                }), 500
        
        @self.app.route('/analyze/charts', methods=['POST'])
        def generate_charts():
            """Generate visualization charts."""
            try:
                save_charts = request.get_json().get('save_charts', True) if request.get_json() else True
                
                if not self.analysis_runner.data:
                    self.analysis_runner.load_all_data()
                
                charts = self.analysis_runner.generate_visualizations(save_charts=save_charts)
                
                return jsonify({
                    "success": True,
                    "charts": charts,
                    "message": f"Generated {len(charts)} visualization charts"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Chart generation failed"
                }), 500
        
        @self.app.route('/data/summary', methods=['GET'])
        def get_data_summary():
            """Get summary of loaded data."""
            try:
                if not self.analysis_runner.data:
                    self.analysis_runner.load_all_data()
                
                summary = {}
                for key, df in self.analysis_runner.data.items():
                    summary[key] = {
                        "count": len(df),
                        "columns": df.columns.tolist() if hasattr(df, 'columns') else []
                    }
                
                return jsonify({
                    "success": True,
                    "data_summary": summary,
                    "message": "Data summary retrieved"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Failed to get data summary"
                }), 500
        
        @self.app.route('/models/train', methods=['POST'])
        def train_models():
            """Train prediction models."""
            try:
                if not self.analysis_runner.data:
                    self.analysis_runner.load_all_data()
                
                training_results = self.analysis_runner.train_prediction_models()
                
                return jsonify({
                    "success": True,
                    "training_results": training_results,
                    "message": "Model training completed"
                })
                
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": str(e),
                    "message": "Model training failed"
                }), 500
        
        @self.app.route('/results/latest', methods=['GET'])
        def get_latest_results():
            """Get the latest analysis results."""
            if self.last_analysis_results:
                return jsonify({
                    "success": True,
                    "results": self.last_analysis_results,
                    "message": "Latest results retrieved"
                })
            else:
                return jsonify({
                    "success": False,
                    "message": "No analysis results available. Run analysis first."
                }), 404
    
    def run_server(self, debug: bool = False):
        """Run the Flask API server."""
        print(f"Starting Python Analysis API server on port {self.port}...")
        self.app.run(host='0.0.0.0', port=self.port, debug=debug, threaded=True)
    
    def run_in_background(self):
        """Run the API server in a background thread."""
        server_thread = threading.Thread(target=self.run_server, daemon=True)
        server_thread.start()
        print(f"Python Analysis API running in background on port {self.port}")
        return server_thread

class NodeJSIntegration:
    """Integration utilities for Node.js backend communication."""
    
    @staticmethod
    def create_analysis_route_handler():
        """Create route handler code for Node.js integration."""
        route_code = '''
// Python Analysis Integration Routes
// Add these routes to your Node.js server/routes.ts file

// Delay prediction and analysis routes
app.get("/api/analysis/health", async (req, res) => {
  try {
    const response = await fetch("http://localhost:5001/health");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Python analysis service unavailable" });
  }
});

app.post("/api/analysis/full", authenticateToken, async (req: any, res) => {
  try {
    const response = await fetch("http://localhost:5001/analyze/full", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.post("/api/analysis/predictions", authenticateToken, async (req: any, res) => {
  try {
    const response = await fetch("http://localhost:5001/analyze/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Prediction generation failed" });
  }
});

app.get("/api/analysis/risk/:projectId?", authenticateToken, async (req: any, res) => {
  try {
    const projectId = req.params.projectId;
    const url = projectId 
      ? `http://localhost:5001/analyze/risk/${projectId}`
      : "http://localhost:5001/analyze/risk";
    
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Risk analysis failed" });
  }
});

app.get("/api/analysis/trends", authenticateToken, async (req: any, res) => {
  try {
    const response = await fetch("http://localhost:5001/analyze/trends");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Trend analysis failed" });
  }
});

app.get("/api/analysis/recommendations", authenticateToken, async (req: any, res) => {
  try {
    const response = await fetch("http://localhost:5001/analyze/recommendations");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Recommendation generation failed" });
  }
});

app.post("/api/analysis/predict-task", authenticateToken, async (req: any, res) => {
  try {
    const response = await fetch("http://localhost:5001/analyze/predict_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Task prediction failed" });
  }
});

app.post("/api/analysis/charts", authenticateToken, async (req: any, res) => {
  try {
    const response = await fetch("http://localhost:5001/analyze/charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Chart generation failed" });
  }
});
'''
        return route_code
    
    @staticmethod
    def run_python_analysis_script(script_path: str, args: List[str] = None) -> Dict[str, Any]:
        """Run a Python analysis script and return results."""
        try:
            cmd = [sys.executable, script_path]
            if args:
                cmd.extend(args)
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Script execution timed out",
                "timeout": True
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

def main():
    """Main entry point to run the Python Analysis API server."""
    api = PythonAnalysisAPI()
    
    # Optional: Run initial analysis
    print("Running initial data load and model training...")
    try:
        api.analysis_runner.load_all_data()
        api.analysis_runner.train_prediction_models()
        print("Initial setup completed successfully!")
    except Exception as e:
        print(f"Initial setup failed: {e}")
        print("API will still start, but models will be trained on first request.")
    
    # Start the server
    api.run_server(debug=False)

if __name__ == "__main__":
    main()