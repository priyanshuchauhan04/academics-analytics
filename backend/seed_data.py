#!/usr/bin/env python3
"""
Sample data seeder for Academic Analytics Portal
Adds realistic academic data for demo purposes
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import uuid
import random

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_sample_data():
    """Add comprehensive sample data for demo"""
    print("🌱 Seeding Academic Analytics Portal with sample data...")
    
    try:
        # Sample Users (Students and Teachers)
        sample_students = [
            {
                "id": str(uuid.uuid4()),
                "email": "alice.johnson@university.edu",
                "name": "Alice Johnson",
                "role": "student",
                "student_id": "STU2024001",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "email": "bob.smith@university.edu", 
                "name": "Bob Smith",
                "role": "student",
                "student_id": "STU2024002",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "email": "charlie.brown@university.edu",
                "name": "Charlie Brown", 
                "role": "student",
                "student_id": "STU2024003",
                "created_at": datetime.utcnow()
            }
        ]
        
        sample_teachers = [
            {
                "id": str(uuid.uuid4()),
                "email": "dr.wilson@university.edu",
                "name": "Dr. Sarah Wilson",
                "role": "teacher",
                "employee_id": "FAC001",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "email": "prof.garcia@university.edu",
                "name": "Prof. Michael Garcia",
                "role": "teacher", 
                "employee_id": "FAC002",
                "created_at": datetime.utcnow()
            }
        ]
        
        # Insert users if they don't exist
        for student in sample_students:
            existing = await db.users.find_one({"email": student["email"]})
            if not existing:
                await db.users.insert_one(student)
                print(f"✅ Added student: {student['name']}")
        
        for teacher in sample_teachers:
            existing = await db.users.find_one({"email": teacher["email"]})  
            if not existing:
                await db.users.insert_one(teacher)
                print(f"✅ Added teacher: {teacher['name']}")
        
        # Sample Courses
        sample_courses = [
            {
                "id": str(uuid.uuid4()),
                "code": "CS101",
                "title": "Introduction to Computer Science",
                "description": "Fundamental concepts of computer science and programming",
                "credits": 4,
                "teacher_id": sample_teachers[0]["id"],
                "schedule": {
                    "days": ["MON", "WED", "FRI"],
                    "time": "10:00-11:30",
                    "location": "Computer Lab A"
                },
                "semester": "Fall",
                "year": 2024,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "code": "MATH201",
                "title": "Calculus II",
                "description": "Integral calculus and applications",
                "credits": 3,
                "teacher_id": sample_teachers[1]["id"],
                "schedule": {
                    "days": ["TUE", "THU"],
                    "time": "14:00-15:30",
                    "location": "Math Building 205"
                },
                "semester": "Fall",
                "year": 2024,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "code": "ENG102",
                "title": "Academic Writing",
                "description": "Advanced writing skills for academic purposes",
                "credits": 3,
                "teacher_id": sample_teachers[0]["id"],
                "schedule": {
                    "days": ["MON", "WED"],
                    "time": "09:00-10:30",
                    "location": "Liberal Arts 110"
                },
                "semester": "Fall", 
                "year": 2024,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "code": "PHY201",
                "title": "Physics I",
                "description": "Mechanics and thermodynamics",
                "credits": 4,
                "teacher_id": sample_teachers[1]["id"],
                "schedule": {
                    "days": ["TUE", "THU", "FRI"],
                    "time": "11:00-12:30",
                    "location": "Physics Lab 1"
                },
                "semester": "Fall",
                "year": 2024,
                "created_at": datetime.utcnow()
            }
        ]
        
        # Insert courses
        for course in sample_courses:
            existing = await db.courses.find_one({"code": course["code"]})
            if not existing:
                await db.courses.insert_one(course)
                print(f"✅ Added course: {course['code']} - {course['title']}")
        
        # Sample Enrollments
        enrollments = []
        for student in sample_students:
            # Each student enrolls in 3-4 courses
            student_courses = random.sample(sample_courses, random.randint(3, 4))
            for course in student_courses:
                enrollment = {
                    "id": str(uuid.uuid4()),
                    "student_id": student["id"],
                    "course_id": course["id"],
                    "semester": "Fall",
                    "year": 2024,
                    "status": "enrolled",
                    "enrolled_at": datetime.utcnow()
                }
                enrollments.append(enrollment)
        
        # Insert enrollments
        for enrollment in enrollments:
            existing = await db.enrollments.find_one({
                "student_id": enrollment["student_id"],
                "course_id": enrollment["course_id"]
            })
            if not existing:
                await db.enrollments.insert_one(enrollment)
        
        print(f"✅ Added {len(enrollments)} enrollments")
        
        # Sample Grades
        grade_components = ["midterm", "final", "assignment", "lab", "quiz"]
        grades = []
        
        for enrollment in enrollments:
            # Generate 3-5 grades per enrollment
            num_grades = random.randint(3, 5)
            for i in range(num_grades):
                component = random.choice(grade_components)
                max_marks = random.choice([100, 50, 25, 10])
                marks = random.uniform(0.6 * max_marks, 0.95 * max_marks)  # 60-95% range
                
                grade = {
                    "id": str(uuid.uuid4()),
                    "student_id": enrollment["student_id"],
                    "course_id": enrollment["course_id"],  
                    "component": component,
                    "marks": round(marks, 2),
                    "max_marks": max_marks,
                    "weightage": random.choice([20, 25, 30, 15, 10]),
                    "graded_at": datetime.utcnow() - timedelta(days=random.randint(1, 60))
                }
                grades.append(grade)
        
        # Insert grades
        for grade in grades:
            await db.grades.insert_one(grade)
        
        print(f"✅ Added {len(grades)} grades")
        
        # Sample Assignments
        assignments = []
        for course in sample_courses:
            # 2-4 assignments per course
            num_assignments = random.randint(2, 4)
            for i in range(num_assignments):
                assignment = {
                    "id": str(uuid.uuid4()),
                    "course_id": course["id"],
                    "title": f"Assignment {i+1}: {random.choice(['Research Paper', 'Lab Report', 'Problem Set', 'Project'])}",
                    "description": f"Complete the assigned work for {course['code']}",
                    "due_date": datetime.utcnow() + timedelta(days=random.randint(7, 30)),
                    "max_marks": random.choice([100, 50, 25]),
                    "weightage": random.choice([15, 20, 25]),
                    "created_by": course["teacher_id"],
                    "created_at": datetime.utcnow()
                }
                assignments.append(assignment)
        
        # Insert assignments
        for assignment in assignments:
            await db.assignments.insert_one(assignment)
        
        print(f"✅ Added {len(assignments)} assignments")
        
        # Sample Attendance Records
        attendance_records = []
        for enrollment in enrollments:
            # Generate attendance for past 30 days
            for day in range(30):
                date = datetime.utcnow() - timedelta(days=day)
                if date.weekday() < 5:  # Weekdays only
                    status = random.choices(
                        ["present", "absent", "late"],
                        weights=[85, 10, 5]  # 85% present, 10% absent, 5% late
                    )[0]
                    
                    attendance = {
                        "id": str(uuid.uuid4()),
                        "student_id": enrollment["student_id"],
                        "course_id": enrollment["course_id"],
                        "date": date,
                        "status": status,
                        "recorded_at": date
                    }
                    attendance_records.append(attendance)
        
        # Insert attendance
        for record in attendance_records:
            await db.attendance.insert_one(record)
        
        print(f"✅ Added {len(attendance_records)} attendance records")
        
        print("\n🎉 Sample data seeding completed successfully!")
        print("📊 Database now contains realistic academic data for demo purposes")
        
        # Summary
        print(f"\n📈 Data Summary:")
        print(f"   👥 Students: {len(sample_students)}")
        print(f"   👨‍🏫 Teachers: {len(sample_teachers)}")
        print(f"   📚 Courses: {len(sample_courses)}")
        print(f"   📝 Enrollments: {len(enrollments)}")
        print(f"   🎯 Grades: {len(grades)}")
        print(f"   📋 Assignments: {len(assignments)}")
        print(f"   📅 Attendance Records: {len(attendance_records)}")
        
    except Exception as e:
        print(f"❌ Error seeding data: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_sample_data())