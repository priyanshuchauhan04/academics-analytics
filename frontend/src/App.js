import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  Users, 
  Award,
  Clock,
  BarChart3,
  PieChart,
  User,
  LogOut,
  Plus
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, [token]);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 pt-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold">AcademicPortal</span>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-8 leading-tight">
            Master Your <span className="text-purple-400">Academic</span> Journey with 
            <span className="text-purple-400"> Smart Analytics</span>
          </h1>
          <p className="text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            Comprehensive academic portal designed for students and teachers to track performance, 
            manage courses, and gain insights through powerful analytics and visualizations.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/signup/student')}
              className="bg-purple-600 hover:bg-purple-700 px-12 py-6 text-xl font-semibold min-w-[200px]"
            >
              <BookOpen className="h-6 w-6 mr-3" />
              Start Learning
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/signup/teacher')}
              className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-12 py-6 text-xl font-semibold min-w-[200px]"
            >
              <Users className="h-6 w-6 mr-3" />
              Teach Here
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">Student Dashboard</CardTitle>
              <CardDescription className="text-gray-300">
                Track enrollments, grades, attendance, and academic progress with visual analytics
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">Teacher Portal</CardTitle>
              <CardDescription className="text-gray-300">
                Manage courses, track student performance, and generate comprehensive reports
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">Smart Analytics</CardTitle>
              <CardDescription className="text-gray-300">
                Powered by advanced visualizations and insights to improve academic outcomes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Login Component
const LoginPage = () => {
  const [loginType, setLoginType] = useState("student");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegistering ? "/auth/register" : "/auth/login";
      const payload = isRegistering 
        ? { ...formData, role: loginType, name: formData.name || "User" }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload);
      
      if (response.data.access_token) {
        login(response.data.user, response.data.access_token);
        navigate(loginType === "student" ? "/student" : "/teacher");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert(error.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-6">
      <Card className="w-full max-w-md bg-gray-800/80 border-gray-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            {isRegistering ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {isRegistering ? "Join our academic community" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginType} onValueChange={setLoginType} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger value="student" className="text-white data-[state=active]:bg-purple-600">
                Student
              </TabsTrigger>
              <TabsTrigger value="teacher" className="text-white data-[state=active]:bg-purple-600">
                Teacher
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? "Processing..." : (isRegistering ? "Create Account" : "Sign In")}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Register"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Student Dashboard Component
const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/student`);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GraduationCap className="h-8 w-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">Student Portal</h1>
              <p className="text-gray-400">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback className="bg-purple-600">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={logout} className="border-gray-600">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Current GPA</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {dashboardData?.gpa || "0.00"}
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Credits Earned</p>
                  <p className="text-3xl font-bold text-green-400">
                    {dashboardData?.total_credits || 0}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Enrolled Courses</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {dashboardData?.courses?.length || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Attendance</p>
                  <p className="text-3xl font-bold text-yellow-400">85%</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-purple-400" />
                Current Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.courses?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.courses.map((course) => (
                    <div key={course.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{course.code}</h3>
                          <p className="text-gray-300">{course.title}</p>
                        </div>
                        <Badge variant="secondary">{course.credits} Credits</Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        {course.schedule?.days?.join(", ")} • {course.schedule?.time}
                      </div>
                      <Progress value={75} className="mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No courses enrolled yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
                Academic Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gray-700 rounded-lg">
                  <h3 className="text-2xl font-bold text-purple-400 mb-2">
                    {dashboardData?.gpa || "0.00"}
                  </h3>
                  <p className="text-gray-300">Cumulative GPA</p>
                  <Progress value={(dashboardData?.gpa || 0) * 25} className="mt-4" />
                </div>
                
                {dashboardData?.grades?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white">Recent Grades</h4>
                    {dashboardData.grades.slice(0, 3).map((grade, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                        <span className="text-gray-300">{grade.component}</span>
                        <Badge variant="outline">
                          {Math.round((grade.marks / grade.max_marks) * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Teacher Dashboard Component
const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/teacher`);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">Teacher Portal</h1>
              <p className="text-gray-400">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback className="bg-purple-600">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={logout} className="border-gray-600">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Total Courses</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {dashboardData?.total_courses || 0}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Total Students</p>
                  <p className="text-3xl font-bold text-green-400">
                    {dashboardData?.total_students || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Enrollments</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {dashboardData?.enrollments?.length || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Avg Performance</p>
                  <p className="text-3xl font-bold text-yellow-400">82%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses and Students Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-400" />
                  My Courses
                </div>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Course
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.courses?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.courses.map((course) => (
                    <div key={course.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{course.code}</h3>
                          <p className="text-gray-300">{course.title}</p>
                        </div>
                        <Badge variant="secondary">{course.credits} Credits</Badge>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {course.schedule?.days?.join(", ")} • {course.schedule?.time}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Enrolled: {dashboardData.enrollments?.filter(e => e.course_id === course.id).length || 0}
                        </span>
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No courses assigned yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
                Class Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-gray-700 rounded-lg">
                  <h3 className="text-2xl font-bold text-purple-400 mb-2">
                    {dashboardData?.total_students || 0}
                  </h3>
                  <p className="text-gray-300">Total Students</p>
                </div>
                
                {dashboardData?.courses?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white">Course Performance</h4>
                    {dashboardData.courses.map((course) => (
                      <div key={course.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                        <span className="text-gray-300">{course.code}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={Math.random() * 100} className="w-20" />
                          <Badge variant="outline">
                            {Math.round(Math.random() * 30 + 70)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "student" ? "/student" : "/teacher"} replace />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/student" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;