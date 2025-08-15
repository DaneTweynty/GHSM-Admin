# GHSM Teacher Mobile App

A comprehensive teacher mobile application built as an extension to the GHSM Admin Panel. This application provides teachers with dedicated tools for lesson management, student tracking, attendance marking, session summaries, and real-time communication.

## 🚀 Features

### 📚 Core Functionality
- **Teacher Authentication** - Secure login with role-based access
- **Schedule Management** - View and manage lesson schedules
- **Student Management** - Access student information and progress tracking
- **Session Summaries** - Create detailed lesson summaries with practice assignments
- **Attendance Tracking** - Mark and track student attendance
- **Dashboard Analytics** - Performance metrics and insights
- **Real-time Chat** - Communication with admin and other teachers

### 🔧 Technical Features
- **TypeScript Support** - Full type safety and IntelliSense
- **Real-time Updates** - Supabase real-time subscriptions
- **Offline Capability** - Local data caching (coming soon)
- **File Uploads** - Support for images, audio, and documents
- **Form Validation** - Comprehensive input validation
- **Error Handling** - Robust error management and user feedback

## 📁 Project Structure

```
GHSM-Admin/
├── database/
│   ├── complete-schema.sql          # Complete database schema
│   └── teacher-app-functions.sql    # Teacher-specific functions
├── services/
│   ├── teacherService.ts           # Main teacher service layer
│   └── authService.ts              # Authentication service
├── hooks/
│   ├── useTeacherAuth.ts           # Authentication hook
│   ├── useTeacherSchedule.ts       # Schedule management hook
│   ├── useTeacherStudents.ts       # Student management hook
│   ├── useTeacherSessionSummaries.ts # Session summaries hook
│   ├── useTeacherAttendance.ts     # Attendance tracking hook
│   ├── useTeacherDashboard.ts      # Dashboard analytics hook
│   └── useTeacherChat.ts           # Chat functionality hook
├── types/
│   └── database.types.ts           # TypeScript type definitions
├── utils/
│   └── validationUtils.ts          # Form validation utilities
├── scripts/
│   └── setup-teacher-app.sh        # Automated setup script
└── docs/
    ├── TEACHER_APP_SETUP.md        # Setup documentation
    ├── API_DOCUMENTATION.md        # API reference
    └── TROUBLESHOOTING.md          # Troubleshooting guide
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Supabase project with proper configuration
- PostgreSQL database access

### Quick Setup
1. **Run the automated setup script:**
   ```bash
   chmod +x scripts/setup-teacher-app.sh
   ./scripts/setup-teacher-app.sh
   ```

2. **Configure environment variables:**
   ```bash
   # Update .env file with your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Setup database:**
   ```sql
   -- Execute in your Supabase SQL editor
   \i database/complete-schema.sql
   \i database/teacher-app-functions.sql
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Manual Setup
If you prefer manual setup, please refer to `docs/TEACHER_APP_SETUP.md` for detailed instructions.

## 📖 Usage Guide

### Authentication
```typescript
import { useTeacherAuth } from './hooks/useTeacherAuth';

function LoginComponent() {
  const { signIn, isLoading, error } = useTeacherAuth();
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      console.error('Login failed:', error);
    }
  };
}
```

### Schedule Management
```typescript
import { useTeacherSchedule } from './hooks/useTeacherSchedule';

function ScheduleComponent() {
  const { 
    lessons, 
    todaysLessons, 
    updateLessonStatus,
    isLoading 
  } = useTeacherSchedule();
  
  const markLessonComplete = async (lessonId: string) => {
    await updateLessonStatus(lessonId, 'completed');
  };
}
```

### Student Management
```typescript
import { useTeacherStudents } from './hooks/useTeacherStudents';

function StudentsComponent() {
  const { 
    students, 
    fetchStudentDetails,
    searchStudents 
  } = useTeacherStudents();
  
  const searchResults = searchStudents('piano');
}
```

### Session Summaries
```typescript
import { useTeacherSessionSummaries } from './hooks/useTeacherSessionSummaries';

function SessionSummaryComponent() {
  const { createSessionSummary, isCreating } = useTeacherSessionSummaries();
  
  const submitSummary = async (lessonId: string, formData: SessionSummaryForm) => {
    const { success, error } = await createSessionSummary(lessonId, formData);
    if (success) {
      console.log('Summary created successfully');
    }
  };
}
```

### Attendance Tracking
```typescript
import { useTeacherAttendance } from './hooks/useTeacherAttendance';

function AttendanceComponent() {
  const { markAttendance, isMarking } = useTeacherAttendance();
  
  const markPresent = async (lessonId: string, studentId: string) => {
    const { success } = await markAttendance({
      lessonId,
      studentId,
      attendanceData: {
        status: 'present',
        arrivalTime: new Date().toTimeString().slice(0, 5)
      }
    });
  };
}
```

## 🔐 Security & Permissions

### Row Level Security (RLS)
The application implements comprehensive RLS policies:
- Teachers can only access their own students and lessons
- Session summaries are restricted to lesson instructors
- Chat messages are scoped to conversation participants
- Admin data is protected from teacher access

### Authentication Flow
1. Teacher logs in with email/password
2. System verifies instructor role and active status
3. Profile data is loaded and cached
4. Session token manages API access
5. Real-time subscriptions are established

## 📊 Database Schema

### Key Tables
- **user_profiles** - User authentication and basic info
- **instructors** - Teacher-specific data and settings
- **students** - Student information and assignments
- **lessons** - Lesson scheduling and management
- **session_summaries** - Detailed lesson summaries
- **attendance_records** - Attendance tracking
- **chat_conversations** - Communication channels
- **chat_messages** - Individual messages

### Custom Functions
- `get_instructor_profile()` - Teacher profile retrieval
- `get_instructor_lessons()` - Lesson queries
- `create_session_summary()` - Summary creation
- `mark_attendance()` - Attendance marking
- `get_instructor_dashboard_stats()` - Analytics

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Checking
```bash
npm run type-check
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker Deployment
```bash
docker build -t ghsm-teacher-app .
docker run -p 3000:3000 ghsm-teacher-app
```

## 📚 API Reference

For detailed API documentation, see `docs/API_DOCUMENTATION.md`.

### Key Services
- **TeacherService** - Main service layer for all teacher operations
- **AuthService** - Authentication and session management
- **ValidationUtils** - Form validation and data sanitization

### Hook Reference
- **useTeacherAuth** - Authentication state and actions
- **useTeacherSchedule** - Lesson and schedule management
- **useTeacherStudents** - Student data and operations
- **useTeacherSessionSummaries** - Session summary creation
- **useTeacherAttendance** - Attendance tracking
- **useTeacherDashboard** - Analytics and statistics
- **useTeacherChat** - Real-time communication

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```
   Error: Teacher profile not found
   Solution: Ensure user has instructor role in database
   ```

2. **Database Connection**
   ```
   Error: Connection refused
   Solution: Verify Supabase credentials in .env
   ```

3. **Permission Denied**
   ```
   Error: RLS policy violation
   Solution: Check user permissions and RLS policies
   ```

For detailed troubleshooting, see `docs/TROUBLESHOOTING.md`.

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit with descriptive messages
5. Push and create a pull request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
- Write unit tests for new features
- Document API changes
- Follow semantic versioning

### Pull Request Guidelines
- Include detailed description of changes
- Add tests for new functionality
- Update documentation as needed
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License. See `LICENSE` file for details.

## 📞 Support

### Getting Help
- **Documentation**: Check `docs/` directory
- **Issues**: Open a GitHub issue
- **Email**: support@ghsm-admin.com
- **Discord**: Join our community server

### Feature Requests
Submit feature requests through GitHub issues with the `enhancement` label.

## 🗺️ Roadmap

### Version 1.1
- [ ] Offline mode support
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Bulk operations
- [ ] Export functionality

### Version 1.2
- [ ] Mobile responsive design
- [ ] PWA capabilities
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] Calendar integration

### Version 2.0
- [ ] Native mobile apps
- [ ] Advanced AI features
- [ ] Integration marketplace
- [ ] White-label options
- [ ] Enterprise features

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **React** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tooling
- **Contributors** - All the amazing developers who made this possible

---

**Built with ❤️ for music education**

For questions or support, please reach out to our development team.
