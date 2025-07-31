# Academic Analytics Portal

A comprehensive student and teacher analytics platform built with FastAPI backend and React frontend, providing real-time academic performance tracking, attendance monitoring, and grade management.

## 🎯 Project Overview

The Academic Analytics Portal is a full-stack web application designed to streamline academic management for educational institutions. It offers separate dashboards for students and teachers, enabling efficient tracking of courses, grades, attendance, and overall academic performance.

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with modern UI components
- **Database**: MongoDB (NoSQL)
- **Authentication**: JWT tokens with role-based access
- **Styling**: Tailwind CSS with Radix UI components

### Project Structure

```
academics-analytics/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── seed_data.py          # Database seeding script
│   └── .env                  # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main React application
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/           # Utility functions
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # Tailwind CSS configuration
├── tests/
│   ├── __init__.py
│   └── backend_test.py     # Comprehensive API testing suite
└── README.md               # Project documentation
```

## 🚀 MVP Setup and Deployment Guide

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB instance
- Git

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Create `.env` file with:
   ```
   MONGO_URL=mongodb://localhost:27017/
   DB_NAME=academic_portal
   ```

4. **Seed initial data**:
   ```bash
   python seed_data.py
   ```

5. **Start the backend server**:
   ```bash
   python server.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**:
   ```bash
   npm start
   # or
   yarn start
   ```

### Deployment

#### Backend Deployment (Render/Heroku)
1. Set environment variables
2. Configure MongoDB Atlas
3. Deploy with Docker containerization

#### Frontend Deployment (Vercel/Netlify)
1. Build production assets
2. Configure API endpoints
3. Set up CDN for static assets

### Docker Support
```bash
# Build and run with Docker
docker-compose up --build
```

## 🧪 Testing

### Automated Testing
The project includes comprehensive API testing with the `backend_test.py` script:

```bash
python backend_test.py
```

### Test Coverage
- User registration and authentication
- Course creation and enrollment
- Grade management
- Dashboard data retrieval
- Error handling and edge cases

## 📈 Performance & Scalability

### Backend Optimization
- **Async/Await**: Non-blocking I/O operations
- **Database Indexing**: Optimized MongoDB queries
- **Caching Strategy**: Redis-ready for future implementation
- **Rate Limiting**: API rate limiting to prevent abuse

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Automatic image compression
- **Bundle Optimization**: Webpack tree-shaking
- **Caching**: Service worker for offline functionality

## 🔐 Security Features

- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **Rate Limiting**: API abuse prevention
- **HTTPS Enforcement**: SSL/TLS encryption ready

## 🎯 Usage Examples

### Student Workflow
1. Register as a student with email and password
2. Login to access student dashboard
3. Enroll in available courses
4. View grades and attendance records
5. Track academic progress

### Teacher Workflow
1. Register as a teacher with email and password
2. Login to access teacher dashboard
3. Create new courses
4. Enroll students in courses
5. Assign grades and mark attendance
6. Monitor class performance

## 🔧 Development Guidelines

### Code Style
- **Python**: Follow PEP 8 standards with Black formatting
- **JavaScript**: ESLint configuration for consistent code style
- **Commit Messages**: Use conventional commit format

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches

### Environment Variables

#### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017/
DB_NAME=academic_portal
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
```

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- **Desktop**: Full-featured interface
- **Tablet**: Optimized touch interface
- **Mobile**: Streamlined mobile experience

## 🚀 Deployment

### Production Deployment

#### Backend Deployment (Render/Heroku)
1. Set environment variables
2. Configure MongoDB Atlas
3. Deploy with Docker containerization

#### Frontend Deployment (Vercel/Netlify)
1. Build production assets
2. Configure API endpoints
3. Set up CDN for static assets

### Docker Support
```bash
# Build and run with Docker
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support & Contact

For technical support or questions:
- Create an issue in the GitHub repository
- Check the troubleshooting guide
- Review the API documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Changelog

### Version 1.0.0
- Initial release with core functionality
- Student and teacher dashboards
- Course management system
- Grade and attendance tracking
- Comprehensive testing suite

---

*Built with ❤️ for the academic community*
