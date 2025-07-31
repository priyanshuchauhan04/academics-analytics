#!/usr/bin/env python3
"""
Simple data seeder for Academic Analytics Portal
Adds mock users with correct password hashing
"""

import os
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime
from dotenv import load_dotenv

# Load environment
load_dotenv()

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['academic_portal']

# Clear existing users
db.users.delete_many({})

# Create mock users with hashed passwords
mock_users = [
    {
        "email": "student@example.com",
        "password": generate_password_hash("password123"),
        "name": "John Student",
        "role": "student",
        "student_id": "STU2024001",
        "created_at": datetime.utcnow()
    },
    {
        "email": "teacher@example.com", 
        "password": generate_password_hash("password123"),
        "name": "Jane Teacher",
        "role": "teacher",
        "teacher_id": "TCH2024001",
        "created_at": datetime.utcnow()
    },
    {
        "email": "admin@example.com",
        "password": generate_password_hash("password123"),
        "name": "Admin User",
        "role": "admin",
        "admin_id": "ADM2024001",
        "created_at": datetime.utcnow()
    }
]

# Insert users
result = db.users.insert_many(mock_users)
print(f"Seeded {len(mock_users)} users:")
for user in mock_users:
    print(f"   {user['email']} ({user['role']}) - password: password123")

client.close()
