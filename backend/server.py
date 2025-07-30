from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
import jwt
import hashlib
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Academic Analytics API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "academic_portal_secret_key_2024"
ALGORITHM = "HS256"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: Literal["student", "teacher"]
    student_id: Optional[str] = None
    employee_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["student", "teacher"]
    student_id: Optional[str] = None
    employee_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    title: str
    description: str
    credits: int
    teacher_id: str
    schedule: dict  # {"days": ["MON", "WED"], "time": "10:00-11:30", "location": "Room 101"}
    semester: str
    year: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CourseCreate(BaseModel):
    code: str
    title: str
    description: str
    credits: int
    teacher_id: str
    schedule: dict
    semester: str
    year: int

class Enrollment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    course_id: str
    semester: str
    year: int
    status: Literal["enrolled", "completed", "dropped"] = "enrolled"
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)

class Grade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    course_id: str
    component: str  # "midterm", "final", "assignment", "lab", "quiz"
    marks: float
    max_marks: float
    weightage: float  # percentage contribution to final grade
    graded_at: datetime = Field(default_factory=datetime.utcnow)

class Attendance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    course_id: str
    date: datetime
    status: Literal["present", "absent", "late"] = "present"
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class Assignment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    title: str
    description: str
    due_date: datetime
    max_marks: float
    weightage: float
    created_by: str  # teacher_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Authentication endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    
    user = User(**user_dict)
    user_doc = user.dict()
    user_doc["password"] = hashed_password
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# Course endpoints
@api_router.get("/courses", response_model=List[Course])
async def get_courses(current_user: User = Depends(get_current_user)):
    if current_user.role == "teacher":
        courses = await db.courses.find({"teacher_id": current_user.id}).to_list(1000)
    else:
        # For students, get enrolled courses
        enrollments = await db.enrollments.find({"student_id": current_user.id}).to_list(1000)
        course_ids = [enrollment["course_id"] for enrollment in enrollments]
        courses = await db.courses.find({"id": {"$in": course_ids}}).to_list(1000)
    
    return [Course(**course) for course in courses]

@api_router.post("/courses", response_model=Course)
async def create_course(course_data: CourseCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create courses")
    
    course = Course(**course_data.dict())
    await db.courses.insert_one(course.dict())
    return course

# Enrollment endpoints
@api_router.get("/enrollments", response_model=List[Enrollment])
async def get_enrollments(current_user: User = Depends(get_current_user)):
    if current_user.role == "student":
        enrollments = await db.enrollments.find({"student_id": current_user.id}).to_list(1000)
    else:
        # Teachers see enrollments for their courses
        courses = await db.courses.find({"teacher_id": current_user.id}).to_list(1000)
        course_ids = [course["id"] for course in courses]
        enrollments = await db.enrollments.find({"course_id": {"$in": course_ids}}).to_list(1000)
    
    return [Enrollment(**enrollment) for enrollment in enrollments]

@api_router.post("/enrollments", response_model=Enrollment)
async def create_enrollment(student_id: str, course_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can enroll students")
    
    # Check if already enrolled
    existing = await db.enrollments.find_one({"student_id": student_id, "course_id": course_id})
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled")
    
    enrollment = Enrollment(student_id=student_id, course_id=course_id, semester="Fall", year=2024)
    await db.enrollments.insert_one(enrollment.dict())
    return enrollment

# Grade endpoints
@api_router.get("/grades")
async def get_grades(current_user: User = Depends(get_current_user)):
    if current_user.role == "student":
        grades = await db.grades.find({"student_id": current_user.id}).to_list(1000)
    else:
        # Teachers see grades for their courses
        courses = await db.courses.find({"teacher_id": current_user.id}).to_list(1000)
        course_ids = [course["id"] for course in courses]
        grades = await db.grades.find({"course_id": {"$in": course_ids}}).to_list(1000)
    
    return [Grade(**grade) for grade in grades]

@api_router.post("/grades", response_model=Grade)
async def create_grade(grade_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can assign grades")
    
    grade = Grade(**grade_data)
    await db.grades.insert_one(grade.dict())
    return grade

# Dashboard data endpoints
@api_router.get("/dashboard/student")
async def get_student_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get enrollments
    enrollments = await db.enrollments.find({"student_id": current_user.id}).to_list(1000)
    course_ids = [enrollment["course_id"] for enrollment in enrollments]
    
    # Get courses
    courses = await db.courses.find({"id": {"$in": course_ids}}).to_list(1000)
    
    # Get grades
    grades = await db.grades.find({"student_id": current_user.id}).to_list(1000)
    
    # Calculate GPA
    total_credits = 0
    total_points = 0
    for course in courses:
        course_grades = [g for g in grades if g["course_id"] == course["id"]]
        if course_grades:
            course_avg = sum(g["marks"] / g["max_marks"] * 100 for g in course_grades) / len(course_grades)
            grade_points = max(0, (course_avg - 50) / 10)  # Simple GPA calculation
            total_points += grade_points * course["credits"]
            total_credits += course["credits"]
    
    gpa = total_points / total_credits if total_credits > 0 else 0
    
    return {
        "user": current_user,
        "courses": courses,
        "enrollments": enrollments,
        "grades": grades,
        "gpa": round(gpa, 2),
        "total_credits": total_credits
    }

@api_router.get("/dashboard/teacher")
async def get_teacher_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get teacher's courses
    courses = await db.courses.find({"teacher_id": current_user.id}).to_list(1000)
    course_ids = [course["id"] for course in courses]
    
    # Get enrollments for teacher's courses
    enrollments = await db.enrollments.find({"course_id": {"$in": course_ids}}).to_list(1000)
    
    # Get all students enrolled in teacher's courses
    student_ids = list(set([enrollment["student_id"] for enrollment in enrollments]))
    students = await db.users.find({"id": {"$in": student_ids}}).to_list(1000)
    
    # Get grades for teacher's courses
    grades = await db.grades.find({"course_id": {"$in": course_ids}}).to_list(1000)
    
    return {
        "user": current_user,
        "courses": courses,
        "enrollments": enrollments,
        "students": students,
        "grades": grades,
        "total_students": len(students),
        "total_courses": len(courses)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()