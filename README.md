# Grey Harmonics School of Music - Admin System

This is a comprehensive React-based admin system for managing music school operations, featuring real-time chat, student management, scheduling, and billing.

## Features

- **Student Management**: Complete CRUD operations for student records with address validation
- **Teacher Management**: Instructor profiles, qualifications, and scheduling
- **Real-time Chat**: AI-powered chat system with conversation persistence
- **Scheduling**: Calendar views (day, week, month, annual) with lesson management
- **Billing**: Invoice generation, payment tracking, and financial reporting
- **Offline Support**: Automatic sync when connection is restored
- **Migration System**: Database schema versioning and rollback capabilities

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **State Management**: Zustand, React Query
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Security**: DOMPurify for XSS protection

## Prerequisites

- Node.js (v18 or higher)
- Supabase account and project

## Environment Setup

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd GHSM-Admin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see Environment Setup above)

4. **Run database migrations** (see Database Setup below)

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Database Setup

The application includes a comprehensive migration system for database schema management.

### Setting up Supabase Database

1. **Create Supabase project** at [supabase.com](https://supabase.com)

2. **Run initial setup SQL** in Supabase SQL Editor:
   ```sql
   -- Enable RLS
   ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';
   
   -- Create migration tracking table
   CREATE TABLE IF NOT EXISTS schema_migrations (
     id VARCHAR(255) PRIMARY KEY,
     applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     checksum VARCHAR(255) NOT NULL
   );
   
   -- Enable RLS on migrations table
   ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
   
   -- Create RPC function for executing migrations
   CREATE OR REPLACE FUNCTION execute_migration(migration_sql TEXT)
   RETURNS VOID
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     EXECUTE migration_sql;
   END;
   $$;
   ```

3. **Run application migrations:**
   ```javascript
   // In browser console or migration script
   import { migrationService } from './services/migrationService';
   
   // Check migration status
   const status = await migrationService.getMigrationStatus();
   console.log('Migration status:', status);
   
   // Apply migrations (implement your migration files)
   const migration = {
     id: '001_initial_schema',
     description: 'Initial database schema',
     up: `
       CREATE TABLE students (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         first_name VARCHAR(100) NOT NULL,
         last_name VARCHAR(100) NOT NULL,
         email VARCHAR(255) UNIQUE,
         phone VARCHAR(20),
         created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
         updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
       );
       
       -- Add more tables as needed
     `,
     down: 'DROP TABLE students;'
   };
   
   await migrationService.migrate(migration);
   ```

### Migration System

The application includes a robust migration system with the following features:

- **Version Control**: Track applied migrations with checksums
- **Rollback Support**: Safely rollback to previous schema versions
- **Validation**: Automatic validation of migration format and SQL
- **Error Handling**: Comprehensive error reporting and recovery
- **Offline Support**: Queue migrations when offline

#### Creating Migrations

```javascript
// Generate migration template
const template = migrationService.generateMigrationTemplate('add_billing_tables');

// Validate migration
const validation = migrationService.validateMigration(migration);
if (!validation.isValid) {
  console.error('Migration errors:', validation.errors);
}

// Apply migration
const result = await migrationService.migrate(migration);
if (result.success) {
  console.log('Migration applied successfully');
} else {
  console.error('Migration failed:', result.error);
}
```

#### Rolling Back Migrations

```javascript
// Rollback last migration
const rollbackResult = await migrationService.rollback(
  'migration_id_to_rollback_to',
  'DROP TABLE example;' // rollback SQL
);
```

## Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # ESLint linting
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run quality          # Run all quality checks
npm run quality:fix      # Fix all quality issues

# CSS
npm run css:build        # Build Tailwind CSS
npm run css:watch        # Watch and build CSS
```

## Architecture

### Directory Structure

```
src/
├── components/          # React components
├── pages/              # Page components
├── services/           # API and business logic
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── constants/          # Application constants
├── data/               # Static data files
└── router/             # Routing configuration

_test/                  # Test files
_debug/                 # Debug and development reports
```

### Key Services

- **supabaseService.ts**: Main data access layer
- **migrationService.ts**: Database migration management
- **offlineSync.ts**: Offline synchronization
- **errorHandling.ts**: Centralized error management
- **chatService.ts**: Real-time chat functionality

### State Management

- **App Context**: Global application state
- **Navigation Context**: Routing and navigation state
- **React Query**: Server state management and caching
- **Zustand**: Client-side state management

## Offline Support

The application includes comprehensive offline support:

- **Automatic Sync**: Queue operations when offline, sync when online
- **Conflict Resolution**: Handle data conflicts with configurable strategies
- **Background Sync**: Automatic background synchronization
- **Error Recovery**: Retry failed operations with exponential backoff

```javascript
import { useOfflineSync } from './utils/offlineSync';

const { queueOperation, sync, getStatus } = useOfflineSync();

// Queue operation for later sync
queueOperation('students', 'create', studentData);

// Manual sync
await sync();

// Check sync status
const status = getStatus();
```

## Error Handling

Centralized error handling with categorization and reporting:

```javascript
import { useErrorHandler } from './utils/errorHandling';

const { reportError, handleSupabaseError, withRetry } = useErrorHandler();

// Report custom error
reportError(new Error('Something went wrong'), {
  category: 'validation',
  context: { formData }
});

// Handle Supabase errors
handleSupabaseError(error, { operation: 'create_student' });

// Retry with exponential backoff
const result = await withRetry(async () => {
  return await supabaseService.createStudent(data);
});
```

## Testing

The application includes comprehensive testing utilities:

```bash
# Run tests in browser console (development)
window.runMigrationTests()

# Manual testing
npm run test:migration    # Test migration functionality
npm run test:offline      # Test offline sync
npm run test:integration  # Integration tests
```

## Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting provider** (Vercel, Netlify, etc.)

3. **Set environment variables** in your hosting provider's dashboard

4. **Run database migrations** in production:
   ```javascript
   // In production environment
   await migrationService.migrate(productionMigration);
   ```

## Security

- **Row Level Security (RLS)**: Implemented on all Supabase tables
- **XSS Protection**: DOMPurify sanitization
- **Environment Variables**: Secure API key management
- **Type Safety**: Full TypeScript coverage
- **Input Validation**: Comprehensive form validation

## Contributing

1. **Follow the code quality standards:**
   ```bash
   npm run quality          # Check all quality standards
   npm run quality:fix      # Fix quality issues
   ```

2. **Test your changes:**
   - Run migration tests
   - Test offline functionality
   - Verify error handling

3. **Update documentation** for new features

## Support

For issues and questions:

1. Check the error logs in the browser console
2. Review the `_debug/` directory for development reports
3. Check migration status: `migrationService.getMigrationStatus()`
4. Review error reports: `errorHandler.getErrorStats()`

## License

Private project - All rights reserved.