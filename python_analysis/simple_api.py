#!/usr/bin/env python3
"""
Simplified Python Analysis API for Smart Project Pulse
"""

import json
import random
from datetime import datetime, timedelta
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Mock data for analysis
def generate_mock_predictions():
    """Generate mock prediction data."""
    tasks = [
        {"id": "task1", "name": "Homepage Redesign", "project": "E-commerce Redesign"},
        {"id": "task2", "name": "Product Catalog API", "project": "E-commerce Redesign"},
        {"id": "task3", "name": "Payment Integration", "project": "E-commerce Redesign"},
        {"id": "task4", "name": "User Authentication", "project": "Mobile App"},
        {"id": "task5", "name": "Push Notifications", "project": "Mobile App"}
    ]
    
    predictions = []
    for task in tasks:
        predictions.append({
            "task_id": task["id"],
            "task_name": task["name"],
            "project_name": task["project"],
            "predicted_delay_days": round(random.uniform(0, 10), 1),
            "risk_score": round(random.uniform(20, 95), 1),
            "confidence": round(random.uniform(0.7, 0.95), 2),
            "risk_category": random.choice(["Low", "Medium", "High", "Critical"]),
            "recommended_actions": [
                "Monitor closely",
                "Add additional resources",
                "Review scope"
            ][:random.randint(1, 3)]
        })
    
    return predictions

def generate_mock_risk_analysis():
    """Generate mock risk analysis data."""
    return {
        "overall_risk_score": round(random.uniform(60, 85), 1),
        "high_risk_tasks": random.randint(2, 5),
        "total_tasks": 15,
        "projects_at_risk": [
            {
                "project_name": "E-commerce Redesign",
                "risk_score": round(random.uniform(70, 90), 1),
                "high_risk_tasks": 3,
                "total_tasks": 8
            },
            {
                "project_name": "Mobile App",
                "risk_score": round(random.uniform(50, 75), 1),
                "high_risk_tasks": 2,
                "total_tasks": 7
            }
        ],
        "risk_factors": [
            "Resource constraints",
            "Technical complexity",
            "Dependency delays"
        ]
    }

def generate_mock_trends():
    """Generate mock trend analysis data."""
    trends = []
    base_date = datetime.now() - timedelta(days=30)
    
    for i in range(30):
        date = base_date + timedelta(days=i)
        trends.append({
            "date": date.strftime("%Y-%m-%d"),
            "average_delay": round(random.uniform(1, 8), 1),
            "completed_tasks": random.randint(1, 5),
            "delayed_tasks": random.randint(0, 3)
        })
    
    return trends

def generate_mock_recommendations():
    """Generate mock recommendations."""
    return [
        {
            "task_id": "task1",
            "task_name": "Homepage Redesign",
            "risk_score": 85.2,
            "priority": "High",
            "recommendations": [
                "Add senior developer to team",
                "Review technical requirements",
                "Schedule daily check-ins"
            ],
            "estimated_impact": "Reduce delay by 3-5 days"
        },
        {
            "task_id": "task3", 
            "task_name": "Payment Integration",
            "risk_score": 78.5,
            "priority": "Critical",
            "recommendations": [
                "Engage payment gateway support",
                "Create technical spike",
                "Consider alternative solutions"
            ],
            "estimated_impact": "Prevent 7-10 day delay"
        }
    ]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "python_analysis"})

@app.route('/analyze/full', methods=['GET'])
def run_full_analysis():
    """Run comprehensive analysis."""
    try:
        return jsonify({
            "success": True,
            "results": {
                "predictions": generate_mock_predictions(),
                "risk_analysis": generate_mock_risk_analysis(),
                "trends": generate_mock_trends(),
                "recommendations": generate_mock_recommendations(),
                "analysis_timestamp": datetime.now().isoformat(),
                "model_version": "1.0.0"
            },
            "message": "Comprehensive analysis completed successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Analysis failed"
        }), 500

@app.route('/analyze/predictions', methods=['GET'])
def get_predictions():
    """Get delay predictions."""
    try:
        return jsonify({
            "success": True,
            "predictions": generate_mock_predictions(),
            "total_predictions": 5,
            "message": "Generated predictions for 5 tasks"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Prediction generation failed"
        }), 500

@app.route('/analyze/risk', methods=['GET'])
@app.route('/analyze/risk/<project_id>', methods=['GET'])
def analyze_risk(project_id=None):
    """Analyze project risks."""
    try:
        risk_data = generate_mock_risk_analysis()
        if project_id:
            # Filter for specific project
            project_risk = next(
                (p for p in risk_data["projects_at_risk"] if project_id in p["project_name"].lower()),
                risk_data["projects_at_risk"][0]
            )
            return jsonify({
                "success": True,
                "risk_analysis": project_risk,
                "project_id": project_id,
                "message": "Risk analysis completed"
            })
        else:
            return jsonify({
                "success": True,
                "risk_analysis": risk_data,
                "message": "Overall risk analysis completed"
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Risk analysis failed"
        }), 500

@app.route('/analyze/trends', methods=['GET'])
def get_trends():
    """Get delay trends."""
    try:
        return jsonify({
            "success": True,
            "trends": generate_mock_trends(),
            "message": "Trend analysis completed"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Trend analysis failed"
        }), 500

@app.route('/analyze/recommendations', methods=['GET'])
def get_recommendations():
    """Get recommendations."""
    try:
        recommendations = generate_mock_recommendations()
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

if __name__ == '__main__':
    print("Starting Python Analysis API server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)