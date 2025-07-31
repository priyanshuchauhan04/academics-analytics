import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as d3 from 'd3';

const TeacherDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('enrollment');
  const [uploadStatus, setUploadStatus] = useState('');
  
  // D3 refs
  const performanceChartRef = useRef(null);
  const enrollmentChartRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      renderPerformanceChart();
      renderEnrollmentChart();
    }
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/teacher/dashboard', { withCredentials: true });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPerformanceChart = () => {
    if (!performanceChartRef.current || !dashboardData?.grades) return;

    const svg = d3.select(performanceChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sample grade distribution data
    const data = [
      { grade: 'A', count: 25 },
      { grade: 'B', count: 40 },
      { grade: 'C', count: 20 },
      { grade: 'D', count: 10 },
      { grade: 'F', count: 5 }
    ];

    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.grade))
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data, d => d.count)]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append("g")
      .call(d3.axisLeft(y));

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.grade))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.count))
      .attr("height", d => height - y(d.count))
      .attr("fill", "#8b5cf6");
  };

  const renderEnrollmentChart = () => {
    if (!enrollmentChartRef.current || !dashboardData?.courses) return;

    const svg = d3.select(enrollmentChartRef.current);
    svg.selectAll("*").remove();

    const width = 250;
    const height = 200;

    const data = dashboardData.courses.map(course => ({
      course: course.code,
      enrolled: course.enrolled || Math.floor(Math.random() * 50) + 10
    }));

    const g = svg.append("g")
      .attr("transform", "translate(20,20)");

    const x = d3.scaleBand()
      .range([0, width - 40])
      .domain(data.map(d => d.course))
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height - 40, 0])
      .domain([0, d3.max(data, d => d.enrolled)]);

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("x", d => x(d.course))
      .attr("y", d => y(d.enrolled))
      .attr("width", x.bandwidth())
      .attr("height", d => height - 40 - y(d.enrolled))
      .attr("fill", "#10b981");

    g.append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g")
      .call(d3.axisLeft(y));
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      setUploadStatus('Uploading...');
      const endpoint = uploadType === 'enrollment' ? '/api/upload/enrollment' : '/api/upload/grades';
      const response = await axios.post(`http://localhost:5000${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      setUploadStatus(response.data.message || 'Upload successful!');
      fetchDashboardData(); // Refresh data
      setUploadFile(null);
    } catch (error) {
      setUploadStatus('Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleGradeEntry = async (studentId, courseCode, gradeData) => {
    try {
      await axios.post('http://localhost:5000/api/teacher/grades', {
        student_id: studentId,
        course_code: courseCode,
        ...gradeData
      }, { withCredentials: true });
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error entering grade:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading teacher dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {['overview', 'courses', 'grades', 'upload', 'students'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === tab
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Teaching Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Courses:</span>
                  <span className="font-semibold">{dashboardData?.courses?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Students:</span>
                  <span className="font-semibold">{dashboardData?.total_students || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Grade:</span>
                  <span className="font-semibold">B+</span>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
              <svg ref={performanceChartRef} width="300" height="200"></svg>
            </div>

            {/* Enrollment Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Course Enrollment</h3>
              <svg ref={enrollmentChartRef} width="250" height="200"></svg>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">My Courses</h3>
            </div>
            <div className="p-6">
              {dashboardData?.courses?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.courses.map((course, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{course.code}</h4>
                      <p className="text-gray-600">{course.name}</p>
                      <p className="text-sm text-gray-500">Enrolled: {course.enrolled || 0} students</p>
                      <div className="mt-2 flex space-x-2">
                        <button className="text-sm px-2 py-1 bg-blue-500 text-white rounded">Manage</button>
                        <button className="text-sm px-2 py-1 bg-green-500 text-white rounded">Grades</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No courses assigned.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Batch Data Upload</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Type
                  </label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="enrollment">Enrollment CSV</option>
                    <option value="grades">Grades JSON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File
                  </label>
                  <input
                    type="file"
                    accept={uploadType === 'enrollment' ? '.csv' : '.json'}
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                {uploadFile && (
                  <div>
                    <p className="text-sm text-gray-600">Selected: {uploadFile.name}</p>
                    <button
                      onClick={handleFileUpload}
                      className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Upload
                    </button>
                  </div>
                )}

                {uploadStatus && (
                  <div className={`p-3 rounded-md ${uploadStatus.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {uploadStatus}
                  </div>
                )}

                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <h4 className="font-semibold mb-2">File Format Requirements:</h4>
                  <div className="text-sm text-gray-600">
                    {uploadType === 'enrollment' ? (
                      <div>
                        <p>CSV format: student_id,course_code,semester,year</p>
                        <p>Example: S001,CS101,Fall,2024</p>
                      </div>
                    ) : (
                      <div>
                        <p>JSON format:</p>
                        <pre>{`[
  {
    "student_id": "S001",
    "course_code": "CS101", 
    "component": "Midterm",
    "grade": "A",
    "points": 90
  }
]`}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Student Directory</h3>
            </div>
            <div className="p-6">
              {dashboardData?.students?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.students.map((student, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">{student.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-2">View</button>
                            <button className="text-green-600 hover:text-green-900">Grades</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No students found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
