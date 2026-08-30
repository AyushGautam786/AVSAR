from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

# Import our ML model (assuming it's saved as ml_recommender.py)
from ml_recommender import MLInternshipRecommender

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize the ML recommender
recommender = MLInternshipRecommender()

# Sample data - in production, this would come from a database
def load_sample_data():
    """Load sample data for demonstration"""
    students_data = [
        {
            'id': 1,
            'name': 'Alice Johnson',
            'email': 'alice@email.com',
            'preferred_domains': ['AI/ML', 'Data Science'],
            'preferred_locations': ['Mumbai', 'Remote'],
            'skills': ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Pandas'],
            'interests': ['artificial intelligence', 'data analysis', 'deep learning']
        },
        {
            'id': 2,
            'name': 'Bob Smith',
            'email': 'bob@email.com',
            'preferred_domains': ['Web Dev', 'Frontend'],
            'preferred_locations': ['Bangalore', 'Chennai'],
            'skills': ['JavaScript', 'React', 'HTML', 'CSS', 'Node.js', 'MongoDB'],
            'interests': ['web development', 'user experience', 'frontend technologies']
        },
        {
            'id': 3,
            'name': 'Carol Davis',
            'email': 'carol@email.com',
            'preferred_domains': ['Marketing', 'Content'],
            'preferred_locations': ['Delhi', 'Remote'],
            'skills': ['Content Writing', 'SEO', 'Social Media', 'Analytics', 'Adobe Creative'],
            'interests': ['digital marketing', 'content creation', 'brand strategy']
        },
        {
            'id': 4,
            'name': 'David Wilson',
            'email': 'david@email.com',
            'preferred_domains': ['Mobile Dev', 'iOS'],
            'preferred_locations': ['Hyderabad', 'Pune'],
            'skills': ['Swift', 'iOS Development', 'Xcode', 'Core Data', 'UIKit'],
            'interests': ['mobile applications', 'iOS ecosystem', 'app design']
        }
    ]
    
    internships_data = [
        {
            'id': 1,
            'company_name': 'TechCorp AI',
            'role_title': 'ML Engineer Intern',
            'domain': 'AI/ML',
            'location': 'Mumbai',
            'is_remote': False,
            'required_skills': ['Python', 'Machine Learning', 'TensorFlow'],
            'description': 'Work on cutting-edge AI projects involving deep learning and computer vision. You will collaborate with senior engineers to develop and deploy ML models.',
            'duration_weeks': 12,
            'stipend': 25000,
            'company_size': 2,
            'start_date': '2024-03-01',
            'application_deadline': '2024-02-15',
            'company_logo': 'https://via.placeholder.com/100x100?text=TC'
        },
        {
            'id': 2,
            'company_name': 'WebSolutions Inc',
            'role_title': 'Frontend Developer Intern',
            'domain': 'Web Dev',
            'location': 'Bangalore',
            'is_remote': True,
            'required_skills': ['JavaScript', 'React', 'CSS'],
            'description': 'Build responsive web applications using modern frontend technologies. Work on real client projects and learn industry best practices.',
            'duration_weeks': 10,
            'stipend': 20000,
            'company_size': 1,
            'start_date': '2024-02-20',
            'application_deadline': '2024-02-10',
            'company_logo': 'https://via.placeholder.com/100x100?text=WS'
        },
        {
            'id': 3,
            'company_name': 'MarketPro Agency',
            'role_title': 'Digital Marketing Intern',
            'domain': 'Marketing',
            'location': 'Delhi',
            'is_remote': True,
            'required_skills': ['SEO', 'Content Writing', 'Analytics'],
            'description': 'Create and execute digital marketing campaigns for various clients. Learn about SEO, social media marketing, and analytics.',
            'duration_weeks': 8,
            'stipend': 15000,
            'company_size': 1,
            'start_date': '2024-03-15',
            'application_deadline': '2024-03-01',
            'company_logo': 'https://via.placeholder.com/100x100?text=MP'
        },
        {
            'id': 4,
            'company_name': 'DataMinds Corp',
            'role_title': 'Data Science Intern',
            'domain': 'Data Science',
            'location': 'Remote',
            'is_remote': True,
            'required_skills': ['Python', 'SQL', 'Machine Learning', 'Statistics'],
            'description': 'Analyze large datasets and build predictive models for business insights. Work with real-world data from Fortune 500 companies.',
            'duration_weeks': 14,
            'stipend': 22000,
            'company_size': 2,
            'start_date': '2024-02-28',
            'application_deadline': '2024-02-20',
            'company_logo': 'https://via.placeholder.com/100x100?text=DM'
        },
        {
            'id': 5,
            'company_name': 'MobileFirst Studio',
            'role_title': 'iOS Developer Intern',
            'domain': 'Mobile Dev',
            'location': 'Hyderabad',
            'is_remote': False,
            'required_skills': ['Swift', 'iOS Development', 'Xcode'],
            'description': 'Develop iOS applications for various clients. Learn about app architecture, UI/UX design, and App Store deployment.',
            'duration_weeks': 12,
            'stipend': 18000,
            'company_size': 1,
            'start_date': '2024-03-10',
            'application_deadline': '2024-02-25',
            'company_logo': 'https://via.placeholder.com/100x100?text=MF'
        },
        {
            'id': 6,
            'company_name': 'CloudTech Solutions',
            'role_title': 'Backend Developer Intern',
            'domain': 'Web Dev',
            'location': 'Pune',
            'is_remote': True,
            'required_skills': ['Node.js', 'MongoDB', 'Express.js', 'AWS'],
            'description': 'Build scalable backend systems and APIs. Learn about cloud deployment, database design, and microservices architecture.',
            'duration_weeks': 16,
            'stipend': 24000,
            'company_size': 3,
            'start_date': '2024-02-25',
            'application_deadline': '2024-02-12',
            'company_logo': 'https://via.placeholder.com/100x100?text=CS'
        }
    ]
    
    return pd.DataFrame(students_data), pd.DataFrame(internships_data)

# Load data and train model
students_df, internships_df = load_sample_data()

# Train the model (in production, you'd load a pre-trained model)
print("Training ML model...")
try:
    training_results = recommender.train(students_df, internships_df)
    print("Model trained successfully!")
except Exception as e:
    print(f"Error training model: {e}")

# API Routes

@app.route('/')
def index():
    return jsonify({
        "message": "Internship Recommender API is running",
        "endpoints": [
            "/api/health",
            "/api/students",
            "/api/internships",
            "/api/recommendations/<student_id>",
            "/api/recommendations/custom",
            "/api/stats",
            "/api/domains",
            "/api/locations", 
            "/api/skills"
        ]
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_trained': recommender.is_trained,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/students', methods=['GET'])
def get_students():
    """Get all students"""
    return jsonify(students_df.to_dict('records'))

@app.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    """Get specific student by ID"""
    student = students_df[students_df['id'] == student_id]
    if student.empty:
        return jsonify({'error': 'Student not found'}), 404
    
    return jsonify(student.iloc[0].to_dict())

@app.route('/api/internships', methods=['GET'])
def get_internships():
    """Get all internships with optional filtering"""
    domain = request.args.get('domain')
    location = request.args.get('location')
    remote = request.args.get('remote')
    
    filtered_internships = internships_df.copy()
    
    if domain:
        filtered_internships = filtered_internships[
            filtered_internships['domain'].str.contains(domain, case=False, na=False)
        ]
    
    if location:
        filtered_internships = filtered_internships[
            filtered_internships['location'].str.contains(location, case=False, na=False)
        ]
    
    if remote:
        is_remote = remote.lower() == 'true'
        filtered_internships = filtered_internships[
            filtered_internships['is_remote'] == is_remote
        ]
    
    return jsonify(filtered_internships.to_dict('records'))

@app.route('/api/recommendations/<int:student_id>', methods=['GET'])
def get_recommendations(student_id):
    """Get ML-powered recommendations for a specific student"""
    try:
        # Get student data
        student = students_df[students_df['id'] == student_id]
        if student.empty:
            return jsonify({'error': 'Student not found'}), 404
        
        student_profile = student.iloc[0].to_dict()
        
        # Get number of recommendations requested
        top_n = int(request.args.get('limit', 10))
        
        # Generate recommendations using ML model
        if not recommender.is_trained:
            return jsonify({'error': 'ML model not trained'}), 500
        
        recommendations = recommender.get_recommendations(
            student_profile, 
            internships_df, 
            top_n=top_n
        )
        
        return jsonify(recommendations)
        
    except Exception as e:
        return jsonify({'error': f'Error generating recommendations: {str(e)}'}), 500

@app.route('/api/recommendations/custom', methods=['POST'])
def get_custom_recommendations():
    """Get recommendations for custom profile"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['preferred_domains', 'preferred_locations', 'skills']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Create temporary profile object
        profile = {
            'name': data.get('name', 'Custom User'),
            'preferred_domains': data['preferred_domains'],
            'preferred_locations': data['preferred_locations'],
            'skills': data['skills'],
            'interests': data.get('interests', [])
        }
        
        # Use ML model to generate recommendations
        if not recommender.is_trained:
            return jsonify({'error': 'ML model not trained'}), 500
        
        recommendations = recommender.get_recommendations(profile, internships_df)
        
        return jsonify(recommendations)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    try:
        # Calculate some basic statistics
        total_students = len(students_df)
        total_internships = len(internships_df)
        
        # Domain distribution
        domain_counts = internships_df['domain'].value_counts().to_dict()
        
        # Location distribution
        location_counts = internships_df['location'].value_counts().to_dict()
        
        # Average stipend by domain
        avg_stipend_by_domain = internships_df.groupby('domain')['stipend'].mean().to_dict()
        
        return jsonify({
            'total_students': total_students,
            'total_internships': total_internships,
            'domain_distribution': domain_counts,
            'location_distribution': location_counts,
            'avg_stipend_by_domain': avg_stipend_by_domain,
            'model_trained': recommender.is_trained
        })
        
    except Exception as e:
        return jsonify({'error': f'Error getting statistics: {str(e)}'}), 500

@app.route('/api/domains', methods=['GET'])
def get_domains():
    """Get all available domains"""
    try:
        domains = internships_df['domain'].unique().tolist()
        return jsonify(domains)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Get all available locations"""
    try:
        locations = internships_df['location'].unique().tolist()
        return jsonify(locations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Get all available skills"""
    try:
        # Flatten all skills into a set
        skills = set()
        for skill_list in internships_df['required_skills']:
            if isinstance(skill_list, list):
                skills.update(skill_list)
        return jsonify(sorted(list(skills)))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/available-options', methods=['GET'])
def get_available_options():
    """Get all available options for dropdowns"""
    try:
        domains = internships_df['domain'].unique().tolist()
        locations = internships_df['location'].unique().tolist()
        
        # Flatten all skills into a set
        skills = set()
        for skill_list in internships_df['required_skills']:
            if isinstance(skill_list, list):
                skills.update(skill_list)
        
        return jsonify({
            'domains': domains,
            'locations': locations,
            'skills': sorted(list(skills))
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting Flask API server...")
    print("Available endpoints:")
    print("- GET  /api/health")
    print("- GET  /api/students")
    print("- GET  /api/students/<id>")
    print("- GET  /api/internships")
    print("- GET  /api/recommendations/<student_id>")
    print("- POST /api/recommendations/custom")
    print("- GET  /api/stats")
    print("- GET  /api/domains")
    print("- GET  /api/locations")
    print("- GET  /api/skills")
    print("- GET  /api/available-options")
    
    app.run(debug=True, host='0.0.0.0', port=5000)