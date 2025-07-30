import requests
import sys
import json
from datetime import datetime

class AcademicPortalAPITester:
    def __init__(self, base_url="https://f42f8fb7-568c-4277-b735-3fe990c2e210.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.student_token = None
        self.teacher_token = None
        self.student_user = None
        self.teacher_user = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_student_registration(self):
        """Test student registration"""
        student_data = {
            "email": "student@test.com",
            "password": "test123",
            "name": "Test Student",
            "role": "student",
            "student_id": "STU001"
        }
        
        success, response = self.run_test(
            "Student Registration",
            "POST",
            "auth/register",
            200,
            data=student_data
        )
        
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            self.student_user = response['user']
            print(f"   Student token obtained: {self.student_token[:20]}...")
            return True
        return False

    def test_teacher_registration(self):
        """Test teacher registration"""
        teacher_data = {
            "email": "teacher@test.com",
            "password": "test123",
            "name": "Test Teacher",
            "role": "teacher",
            "employee_id": "EMP001"
        }
        
        success, response = self.run_test(
            "Teacher Registration",
            "POST",
            "auth/register",
            200,
            data=teacher_data
        )
        
        if success and 'access_token' in response:
            self.teacher_token = response['access_token']
            self.teacher_user = response['user']
            print(f"   Teacher token obtained: {self.teacher_token[:20]}...")
            return True
        return False

    def test_student_login(self):
        """Test student login"""
        login_data = {
            "email": "student@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            print(f"   Login successful for student: {response['user']['name']}")
            return True
        return False

    def test_teacher_login(self):
        """Test teacher login"""
        login_data = {
            "email": "teacher@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Teacher Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            print(f"   Login successful for teacher: {response['user']['name']}")
            return True
        return False

    def test_student_dashboard(self):
        """Test student dashboard endpoint"""
        if not self.student_token:
            print("❌ No student token available for dashboard test")
            return False
            
        success, response = self.run_test(
            "Student Dashboard",
            "GET",
            "dashboard/student",
            200,
            token=self.student_token
        )
        
        if success:
            print(f"   Dashboard data keys: {list(response.keys()) if response else 'No data'}")
            return True
        return False

    def test_teacher_dashboard(self):
        """Test teacher dashboard endpoint"""
        if not self.teacher_token:
            print("❌ No teacher token available for dashboard test")
            return False
            
        success, response = self.run_test(
            "Teacher Dashboard",
            "GET",
            "dashboard/teacher",
            200,
            token=self.teacher_token
        )
        
        if success:
            print(f"   Dashboard data keys: {list(response.keys()) if response else 'No data'}")
            return True
        return False

    def test_courses_endpoint(self):
        """Test courses endpoint for both roles"""
        # Test with student token
        if self.student_token:
            success, response = self.run_test(
                "Get Courses (Student)",
                "GET",
                "courses",
                200,
                token=self.student_token
            )
            if success:
                print(f"   Student courses count: {len(response) if isinstance(response, list) else 0}")
        
        # Test with teacher token
        if self.teacher_token:
            success, response = self.run_test(
                "Get Courses (Teacher)",
                "GET",
                "courses",
                200,
                token=self.teacher_token
            )
            if success:
                print(f"   Teacher courses count: {len(response) if isinstance(response, list) else 0}")
                return True
        return False

    def test_create_course(self):
        """Test course creation (teacher only)"""
        if not self.teacher_token:
            print("❌ No teacher token available for course creation test")
            return False
            
        course_data = {
            "code": "CS101",
            "title": "Introduction to Computer Science",
            "description": "Basic computer science concepts",
            "credits": 3,
            "teacher_id": self.teacher_user['id'] if self.teacher_user else "test-teacher-id",
            "schedule": {
                "days": ["MON", "WED", "FRI"],
                "time": "10:00-11:30",
                "location": "Room 101"
            },
            "semester": "Fall",
            "year": 2024
        }
        
        success, response = self.run_test(
            "Create Course",
            "POST",
            "courses",
            200,
            data=course_data,
            token=self.teacher_token
        )
        
        if success:
            print(f"   Course created: {response.get('code', 'Unknown')} - {response.get('title', 'Unknown')}")
            return True
        return False

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print("\n🔒 Testing Unauthorized Access...")
        
        # Test dashboard without token
        success, _ = self.run_test(
            "Dashboard Without Token",
            "GET",
            "dashboard/student",
            401  # Should return 401 Unauthorized
        )
        
        # Test courses without token
        success2, _ = self.run_test(
            "Courses Without Token",
            "GET",
            "courses",
            401  # Should return 401 Unauthorized
        )
        
        return success and success2

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🛡️ Testing Role-Based Access Control...")
        
        # Test student trying to access teacher dashboard
        if self.student_token:
            success, _ = self.run_test(
                "Student Accessing Teacher Dashboard",
                "GET",
                "dashboard/teacher",
                403,  # Should return 403 Forbidden
                token=self.student_token
            )
            
        # Test teacher trying to access student dashboard
        if self.teacher_token:
            success2, _ = self.run_test(
                "Teacher Accessing Student Dashboard",
                "GET",
                "dashboard/student",
                403,  # Should return 403 Forbidden
                token=self.teacher_token
            )
            
            return success and success2
        return False

def main():
    print("🚀 Starting Academic Portal API Tests")
    print("=" * 50)
    
    tester = AcademicPortalAPITester()
    
    # Test sequence
    tests = [
        ("Student Registration", tester.test_student_registration),
        ("Teacher Registration", tester.test_teacher_registration),
        ("Student Login", tester.test_student_login),
        ("Teacher Login", tester.test_teacher_login),
        ("Student Dashboard", tester.test_student_dashboard),
        ("Teacher Dashboard", tester.test_teacher_dashboard),
        ("Courses Endpoint", tester.test_courses_endpoint),
        ("Create Course", tester.test_create_course),
        ("Unauthorized Access", tester.test_unauthorized_access),
        ("Role-Based Access", tester.test_role_based_access),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Total Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if failed_tests:
        print(f"\n❌ Failed Tests: {', '.join(failed_tests)}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())