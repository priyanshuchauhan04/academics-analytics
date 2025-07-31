from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime, timedelta
import json
import csv
import io
from functools import wraps
import os
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit
import pandas as pd

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/academic_portal')

CORS(app, supports_credentials=True)
mongo = PyMongo(app)

# Collections
db = mongo.db

# Utility functions
def json_serial(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Simulated OAuth routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    login_type = data.get('login_type', 'local')  # local, github, google
    
    user = db.users.find_one({'email': email})
    
    if user and check_password_hash(user['password'], password):
        session['user_id'] = str(user['_id'])
        session['role'] = user['role']
        session['name'] = user['name']
        
        # Log authentication
        db.audit_logs.insert_one({
            'action': 'login',
            'user_id': str(user['_id']),
            'login_type': login_type,
            'timestamp': datetime.utcnow()
        })
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    if 'user_id' in session:
        db.audit_logs.insert_one({
            'action': 'logout',
            'user_id': session['user_id'],
            'timestamp': datetime.utcnow()
        })
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/me')
@login_required
def get_current_user():
    user = db.users.find_one({'_id': ObjectId(session['user_id'])})
    if user:
        return jsonify({
            'id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'role': user['role']
        })
    return jsonify({'error': 'User not found'}), 404

# Batch upload endpoints
@app.route('/api/upload/enrollments', methods=['POST'])
@login_required
def upload_enrollments():
    if session.get('role') != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.csv'):
        try:
            # Process CSV
            stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
            csv_data = csv.DictReader(stream)
            
            enrollments = []
            for row in csv_data:
                enrollment = {
                    'student_id': row.get('student_id'),
                    'course_code': row.get('course_code'),
                    'semester': row.get('semester'),
                    'year': int(row.get('year', datetime.now().year)),
                    'enrollment_date': datetime.utcnow(),
                    'uploaded_by': session['user_id'],
                    'upload_timestamp': datetime.utcnow()
                }
                enrollments.append(enrollment)
            
            if enrollments:
                db.enrollments.insert_many(enrollments)
                
                # Log upload
                db.audit_logs.insert_one({
                    'action': 'enrollment_upload',
                    'user_id': session['user_id'],
                    'filename': file.filename,
                    'record_count': len(enrollments),
                    'timestamp': datetime.utcnow()
                })
                
                return jsonify({
                    'message': f'Successfully uploaded {len(enrollments)} enrollments',
                    'count': len(enrollments)
                })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file format'}), 400

@app.route('/api/upload/grades', methods=['POST'])
@login_required
def upload_grades():
    if session.get('role') != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.json'):
        try:
            grades_data = json.load(file)
            
            if isinstance(grades_data, list):
                for grade in grades_data:
                    grade['uploaded_by'] = session['user_id']
                    grade['upload_timestamp'] = datetime.utcnow()
                
                db.grades.insert_many(grades_data)
                
                # Log upload
                db.audit_logs.insert_one({
                    'action': 'grades_upload',
                    'user_id': session['user_id'],
                    'filename': file.filename,
                    'record_count': len(grades_data),
                    'timestamp': datetime.utcnow()
                })
                
                return jsonify({
                    'message': f'Successfully uploaded {len(grades_data)} grades',
                    'count': len(grades_data)
                })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file format'}), 400

# Student dashboard endpoints
@app.route('/api/student/dashboard')
@login_required
def student_dashboard():
    if session.get('role') != 'student':
        return jsonify({'error': 'Unauthorized'}), 403
    
    student_id = session['user_id']
    
    # Current enrollments
    enrollments = list(db.enrollments.find({'student_id': student_id}))
    
    # Grades
    grades = list(db.grades.find({'student_id': student_id}))
    
    # Attendance
    attendance = list(db.attendance.find({'student_id': student_id}))
    
    # Calculate GPA
    total_points = 0
    total_credits = 0
    for grade in grades:
        if grade.get('grade'):
            grade_points = grade_to_points(grade['grade'])
            credits = grade.get('credits', 3)
            total_points += grade_points * credits
            total_credits += credits
    
    cgpa = total_points / total_credits if total_credits > 0 else 0
    
    return jsonify({
        'enrollments': enrollments,
        'grades': grades,
        'attendance': attendance,
        'cgpa': round(cgpa, 2),
        'total_credits': total_credits
    })

@app.route('/api/student/transcript')
@login_required
def generate_transcript():
    if session.get('role') != 'student':
        return jsonify({'error': 'Unauthorized'}), 403
    
    student_id = session['user_id']
    user = db.users.find_one({'_id': ObjectId(student_id)})
    
    # Create PDF transcript
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 750, "Academic Transcript")
    c.setFont("Helvetica", 12)
    c.drawString(100, 730, f"Student: {user['name']}")
    c.drawString(100, 710, f"Student ID: {user.get('student_id', 'N/A')}")
    c.drawString(100, 690, f"Generated: {datetime.now().strftime('%Y-%m-%d')}")
    
    # Grades table
    y_position = 650
    grades = list(db.grades.find({'student_id': student_id}))
    
    for grade in grades:
        c.drawString(100, y_position, f"{grade.get('course_code', '')} - {grade.get('course_name', '')}")
        c.drawString(400, y_position, f"Grade: {grade.get('grade', '')}")
        y_position -= 20
        
        if y_position < 100:
            c.showPage()
            y_position = 750
    
    c.save()
    buffer.seek(0)
    
    return send_file(buffer, as_attachment=True, download_name='transcript.pdf', mimetype='application/pdf')

# Teacher dashboard endpoints
@app.route('/api/teacher/dashboard')
@login_required
def teacher_dashboard():
    if session.get('role') != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    teacher_id = session['user_id']
    
    # Courses taught
    courses = list(db.courses.find({'teacher_id': teacher_id}))
    
    # Students in courses
    course_codes = [course['code'] for course in courses]
    enrollments = list(db.enrollments.find({'course_code': {'$in': course_codes}}))
    
    # Analytics
    grades = list(db.grades.find({'course_code': {'$in': course_codes}}))
    attendance = list(db.attendance.find({'course_code': {'$in': course_codes}}))
    
    return jsonify({
        'courses': courses,
        'enrollments': enrollments,
        'grades': grades,
        'attendance': attendance
    })

@app.route('/api/teacher/courses', methods=['GET', 'POST'])
@login_required
def manage_courses():
    if session.get('role') != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    teacher_id = session['user_id']
    
    if request.method == 'POST':
        data = request.json
        course = {
            'code': data.get('code'),
            'title': data.get('title'),
            'description': data.get('description'),
            'teacher_id': teacher_id,
            'schedule': data.get('schedule'),
            'semester': data.get('semester'),
            'year': data.get('year'),
            'created_at': datetime.utcnow()
        }
        
        result = db.courses.insert_one(course)
        return jsonify({'message': 'Course created', 'id': str(result.inserted_id)})
    
    courses = list(db.courses.find({'teacher_id': teacher_id}))
    return jsonify(courses)

# Utility functions
def grade_to_points(grade):
    grade_map = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'F': 0.0
    }
    return grade_map.get(grade.upper(), 0.0)

# Initialize database with sample data
@app.route('/api/init-db', methods=['POST'])
def init_db():
    # Clear existing data
    db.users.delete_many({})
    db.courses.delete_many({})
    db.enrollments.delete_many({})
    db.grades.delete_many({})
    db.attendance.delete_many({})
    db.audit_logs.delete_many({})
    
    # Create sample users
    users = [
        {
            'email': 'student@demo.edu',
            'password': generate_password_hash('password123'),
            'name': 'Demo Student',
            'role': 'student',
            'student_id': 'STU001'
        },
        {
            'email': 'teacher@demo.edu',
            'password': generate_password_hash('password123'),
            'name': 'Demo Teacher',
            'role': 'teacher',
            'employee_id': 'EMP001'
        }
    ]
    
    db.users.insert_many(users)
    
    return jsonify({'message': 'Database initialized with sample data'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
