import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as d3 from 'd3';

const StudentDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // D3 refs
  const gpaChartRef = useRef(null);
  const attendanceChartRef = useRef(null);
  const progressChartRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      renderGPAChart();
      renderAttendanceChart();
      renderProgressChart();
    }
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/student/dashboard', { withCredentials: true });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGPAChart = () => {
    if (!gpaChartRef.current || !dashboardData?.grades) return;

    const svg = d3.select(gpaChartRef.current);
    svg.selectAll("*").remove();

    // Set dimensions for better visibility
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = 350 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = [
      { semester: '2023', gpa: 3.2 },
      { semester: '2024', gpa: 3.5 },
      { semester: '2025', gpa: 3.7 },
      { semester: '2026', gpa: dashboardData.cgpa || 3.8 }
    ];

    // High contrast colors
    const colors = {
      bars: '#3b82f6',
      text: '#1f2937',
      grid: '#e5e7eb'
    };

    // Set up scales with better range
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.semester))
      .padding(0.3);

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, 4]);

    // Add grid lines for better readability
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
        .ticks(5)
      )
      .style("stroke", colors.grid)
      .style("stroke-opacity", 0.3);

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", colors.text);

    // Add Y axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", colors.text);

    // Add Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", colors.text)
      .text("GPA");

    // Add bars with clear styling
    const bars = g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.semester))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", colors.bars)
      .attr("rx", 4);

    // Animate bars
    bars.transition()
      .duration(800)
      .delay((d, i) => i * 150)
      .attr("y", d => y(d.gpa))
      .attr("height", d => height - y(d.gpa));

    // Add value labels on top of bars
    g.selectAll(".value-label")
      .data(data)
      .enter().append("text")
      .attr("class", "value-label")
      .attr("x", d => x(d.semester) + x.bandwidth() / 2)
      .attr("y", d => y(d.gpa) - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", colors.text)
      .text(d => d.gpa.toFixed(1));
  };

  const renderAttendanceChart = () => {
    if (!attendanceChartRef.current || !dashboardData?.attendance) return;

    const svg = d3.select(attendanceChartRef.current);
    svg.selectAll("*").remove();

    // Get container dimensions for perfect fit
    const container = attendanceChartRef.current.parentElement;
    const containerWidth = container.clientWidth || 300;
    const containerHeight = container.clientHeight || 300;
    
    // Set dimensions for perfect fit
    const width = Math.min(containerWidth, 280);
    const height = Math.min(containerHeight, 280);
    const radius = Math.min(width, height) / 2 - 20;

    // Set SVG dimensions to match container
    svg.attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const data = [
      { label: 'Present', value: 85, color: '#10b981', gradient: ['#10b981', '#059669'] },
      { label: 'Absent', value: 10, color: '#ef4444', gradient: ['#ef4444', '#dc2626'] },
      { label: 'Late', value: 5, color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] }
    ];

    const colors = {
      present: '#10b981',
      absent: '#ef4444',
      late: '#f59e0b'
    };

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    // Create more attractive arcs with rounded corners
    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius * 0.85)
      .cornerRadius(4);

    const hoverArc = d3.arc()
      .innerRadius(radius * 0.38)
      .outerRadius(radius * 0.87)
      .cornerRadius(4);

    const arcs = g.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

    // Create gradient definitions
    const defs = svg.append("defs");
    
    data.forEach((d, i) => {
      const gradient = defs.append("linearGradient")
        .attr("id", `gradient-${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d.gradient[0]);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d.gradient[1]);
    });

    // Add attractive pie slices with gradients and shadows
    const slices = arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => `url(#gradient-${i})`)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))")
      .style("opacity", 0)
      .style("cursor", "pointer")
      .transition()
      .duration(1000)
      .delay((d, i) => i * 200)
      .style("opacity", 1)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    // Add hover effects
    arcs.on("mouseover", function(event, d) {
        d3.select(this).select("path")
          .transition()
          .duration(200)
          .attr("d", hoverArc)
          .style("filter", "drop-shadow(0px 4px 8px rgba(0,0,0,0.2))");
      })
      .on("mouseout", function(event, d) {
        d3.select(this).select("path")
          .transition()
          .duration(200)
          .attr("d", arc)
          .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))");
      });

    // Add animated percentage labels inside slices
    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.3)")
      .style("opacity", 0)
      .text(d => `${d.data.value}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200 + 500)
      .style("opacity", 1);

    // Add simple legend with icons
    data.forEach((d, i) => {
      const legendItem = g.append("g")
        .attr("class", "legend-item")
        .attr("transform", `translate(${-radius * 0.2}, ${radius * 0.7 + i * 20})`)
        .style("opacity", 0);

      legendItem.append("circle")
        .attr("r", 6)
        .attr("fill", d.color)
        .style("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.1))");

      legendItem.append("text")
        .attr("x", 12)
        .attr("y", 0)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text(`${d.label} (${d.value}%)`);

      // Animate the legend items
      legendItem.transition()
        .duration(800)
        .delay(800 + i * 100)
        .style("opacity", 1);
    });

    // Add center title
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -8)
      .style("font-size", "16px")
      .style("font-weight", "700")
      .style("fill", "#1f2937")
      .style("opacity", 0)
      .text("Attendance")
      .transition()
      .duration(1000)
      .style("opacity", 1);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 8)
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("fill", "#6b7280")
      .style("opacity", 0)
      .text("Overview")
      .transition()
      .duration(1000)
      .delay(300)
      .style("opacity", 1);
  };

  const renderProgressChart = () => {
    if (!progressChartRef.current) return;

    const svg = d3.select(progressChartRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 250;
    const margin = { top: 40, right: 30, bottom: 40, left: 100 };

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const progress = [
      { category: 'Core Credits', earned: 45, required: 60, color: '#3b82f6' },
      { category: 'Elective Credits', earned: 20, required: 30, color: '#8b5cf6' },
      { category: 'Open Credits', earned: 15, required: 30, color: '#06b6d4' },
      { category: 'Total Credits', earned: 80, required: 120, color: '#10b981' }
    ];

    const widthInner = width - margin.left - margin.right;
    const heightInner = height - margin.top - margin.bottom;

    // Add gradient definitions
    const defs = svg.append("defs");
    
    progress.forEach((d, i) => {
      const gradient = defs.append("linearGradient")
        .attr("id", `progress-gradient-${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d.color)
        .attr("stop-opacity", 0.9);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d.color)
        .attr("stop-opacity", 0.6);
    });

    // Create scales
    const y = d3.scaleBand()
      .range([0, heightInner])
      .domain(progress.map(d => d.category))
      .padding(0.3);

    const x = d3.scaleLinear()
      .range([0, widthInner])
      .domain([0, 100]);

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisBottom(x)
        .tickSize(heightInner)
        .tickFormat("")
      )
      .style("stroke", "#e5e7eb")
      .style("stroke-opacity", 0.7);

    // Add axes
    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    g.append("g")
      .attr("transform", `translate(0,${heightInner})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}%`))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6b7280");

    // Create progress bars with animations
    const bars = g.selectAll(".progress-bar")
      .data(progress)
      .enter().append("g")
      .attr("class", "progress-bar");

    // Background bar
    bars.append("rect")
      .attr("x", 0)
      .attr("y", d => y(d.category))
      .attr("width", widthInner)
      .attr("height", y.bandwidth())
      .attr("fill", "#f3f4f6")
      .attr("rx", 10)
      .attr("ry", 10);

    // Progress bar
    bars.append("rect")
      .attr("x", 0)
      .attr("y", d => y(d.category))
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("fill", (d, i) => `url(#progress-gradient-${i})`)
      .attr("rx", 10)
      .attr("ry", 10)
      .transition()
      .duration(1500)
      .delay((d, i) => i * 300)
      .attr("width", d => (d.earned / d.required) * widthInner);

    // Percentage labels
    bars.append("text")
      .attr("x", d => (d.earned / d.required) * widthInner + 5)
      .attr("y", d => y(d.category) + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#1f2937")
      .text(d => `${Math.round((d.earned / d.required) * 100)}%`);

    // Credit labels
    bars.append("text")
      .attr("x", -10)
      .attr("y", d => y(d.category) + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .style("font-size", "11px")
      .style("fill", "#6b7280")
      .text(d => `${d.earned}/${d.required}`);

    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#1f2937")
      .text("Degree Progress Overview");

    // Add summary text
    const totalEarned = progress.reduce((sum, d) => sum + d.earned, 0);
    const totalRequired = progress.reduce((sum, d) => sum + d.required, 0);
    const overallProgress = Math.round((totalEarned / totalRequired) * 100);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#6b7280")
      .text(`Overall Progress: ${overallProgress}% (${totalEarned}/${totalRequired} credits)`);
  };

  const generateTranscript = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/student/transcript', {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transcript.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating transcript:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading student dashboard...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
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
            {['overview', 'courses', 'grades', 'attendance', 'progress'].map((tab) => (
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
              <h3 className="text-lg font-semibold mb-4">Academic Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current CGPA:</span>
                  <span className="font-semibold">{dashboardData?.cgpa || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Credits:</span>
                  <span className="font-semibold">{dashboardData?.total_credits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Enrolled Courses:</span>
                  <span className="font-semibold">{dashboardData?.enrollments?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* GPA Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">GPA Trend</h3>
              <svg ref={gpaChartRef} width="300" height="200"></svg>
            </div>

            {/* Attendance Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
              <svg ref={attendanceChartRef} width="200" height="200"></svg>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Current Courses</h3>
            </div>
            <div className="p-6">
              {dashboardData?.enrollments?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.enrollments.map((course, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{course.course_code}</h4>
                      <p className="text-gray-600">{course.course_name || 'Course Name'}</p>
                      <p className="text-sm text-gray-500">Semester: {course.semester} {course.year}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No courses enrolled.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Grade Report</h3>
              <button
                onClick={generateTranscript}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Download Transcript
              </button>
            </div>
            <div className="p-6">
              {dashboardData?.grades?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.grades.map((grade, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">{grade.course_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{grade.component}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{grade.grade}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{grade.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No grades available.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Attendance Record</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Attendance Overview</h4>
                  <svg ref={attendanceChartRef} width="200" height="200"></svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Course-wise Attendance</h4>
                  {dashboardData?.attendance?.length > 0 ? (
                    <div className="space-y-2">
                      {dashboardData.attendance.map((att, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                          <span>{att.course_code}</span>
                          <span className={`px-2 py-1 rounded text-sm ${
                            att.percentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {att.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No attendance records.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Degree Progress</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Credit Requirements</h4>
                  <svg ref={progressChartRef} width="250" height="150"></svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Curriculum Map</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Core Courses</span>
                        <span className="text-sm text-gray-600">45/60 credits</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Electives</span>
                        <span className="text-sm text-gray-600">20/30 credits</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '67%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Open Electives</span>
                        <span className="text-sm text-gray-600">15/30 credits</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '50%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
