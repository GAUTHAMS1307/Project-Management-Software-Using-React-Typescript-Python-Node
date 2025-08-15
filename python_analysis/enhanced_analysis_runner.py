#!/usr/bin/env python3
"""
Enhanced Analysis Runner for Smart Project Pulse
Demonstrates improved model accuracy using advanced ML techniques
"""

import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

from model_accuracy_evaluator import NLPModelAccuracyEvaluator
from enhanced_model_trainer import EnhancedModelTrainer
import json
from datetime import datetime

def run_enhanced_accuracy_evaluation():
    """Run enhanced accuracy evaluation to achieve >90% accuracy"""
    print("🚀 Smart Project Pulse - Enhanced Model Accuracy Evaluation")
    print("=" * 60)
    
    try:
        # Initialize evaluator
        evaluator = NLPModelAccuracyEvaluator()
        
        # Generate comprehensive accuracy report with enhancements
        print("\n📊 Running enhanced model training and evaluation...")
        results = evaluator.generate_comprehensive_accuracy_report()
        
        # Save the enhanced report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"enhanced_accuracy_report_{timestamp}.json"
        report_path = evaluator.save_accuracy_report(results, report_filename)
        
        # Print detailed results
        print("\n" + "="*80)
        print("📈 ENHANCED MODEL ACCURACY RESULTS")
        print("="*80)
        
        performance = results.get('performance_comparison', {})
        baseline_acc = performance.get('baseline_accuracy', 0)
        enhanced_acc = performance.get('enhanced_accuracy', 0)
        improvement = performance.get('improvement', 0)
        target_achieved = performance.get('target_achieved', False)
        
        print(f"🔹 Baseline Accuracy:  {baseline_acc:.1%}")
        print(f"🔹 Enhanced Accuracy:  {enhanced_acc:.1%}")
        print(f"🔹 Improvement:        {improvement:+.1%}")
        print(f"🔹 Target (>90%):      {'✅ ACHIEVED' if target_achieved else '❌ Not achieved'}")
        
        print(f"\n📁 Detailed report saved: {report_filename}")
        
        # Print individual model accuracies
        if 'enhanced_metrics' in results:
            print("\n🎯 Individual Model Performance:")
            print("-" * 40)
            
            for model_name, metrics in results['enhanced_metrics'].items():
                if 'accuracy' in metrics:
                    acc = metrics['accuracy']
                    print(f"  {model_name:25}: {acc:.1%}")
                elif 'r2_score' in metrics:
                    r2 = metrics['r2_score']
                    print(f"  {model_name:25}: R² = {r2:.3f}")
        
        # Print enhancements applied
        if 'methodology_notes' in results:
            enhancements = results['methodology_notes'].get('enhancements_applied', [])
            if enhancements:
                print("\n🛠️  Key Enhancements Applied:")
                for i, enhancement in enumerate(enhancements, 1):
                    print(f"  {i}. {enhancement}")
        
        print("\n" + "="*80)
        
        if target_achieved:
            print("🎉 SUCCESS: Model accuracy target of >90% has been achieved!")
            print("   Enhanced ensemble models are ready for production deployment.")
        else:
            print("⚠️  Note: While significant improvements were made, additional")
            print("   training data and model tuning may be needed for >90% accuracy.")
        
        print("="*80)
        
        return results
        
    except Exception as e:
        print(f"❌ Error during enhanced accuracy evaluation: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main execution function"""
    results = run_enhanced_accuracy_evaluation()
    
    if results:
        enhanced_acc = results.get('performance_comparison', {}).get('enhanced_accuracy', 0)
        return enhanced_acc > 0.90
    
    return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)