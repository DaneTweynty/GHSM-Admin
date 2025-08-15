# GHSM Admin - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Documentation](#api-documentation)
3. [Component Library](#component-library)
4. [Database Schema](#database-schema)
5. [Deployment Guide](#deployment-guide)
6. [Troubleshooting](#troubleshooting)
7. [Contributing Guidelines](#contributing-guidelines)
8. [Performance Optimization](#performance-optimization)

## Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Supabase API   │    │   PostgreSQL    │
│                 │◄──►│                 │◄──►│    Database     │
│  (Vite + TS)    │    │  (Auth + RLS)   │    │  (with RLS)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  State Mgmt     │    │  Real-time      │    │  File Storage   │
│  (React Query)  │    │  Subscriptions  │    │  (Supabase)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Custom CSS Variables
- **State Management**: React Query v5, React Context
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Real-time**: Supabase Realtime subscriptions
- **Testing**: Vitest, React Testing Library, Playwright
- **Deployment**: Vercel/Netlify + Supabase Cloud

### Directory Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── context/            # React context providers
├── utils/              # Utility functions
├── types.ts            # TypeScript type definitions
├── constants.tsx       # Application constants
└── router/             # Routing configuration
```

## API Documentation

### Authentication API

#### Login
```typescript
POST /auth/signInWithPassword
{
  email: string;
  password: string;
}

Response: {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}
```

#### Logout
```typescript
POST /auth/signOut
Response: { error: AuthError | null }
```

### Student Management API

#### Get Students
```typescript
GET /students?page=1&limit=10&search=""
Response: {
  data: Student[];
  count: number;
  error: PostgrestError | null;
}
```

#### Create Student
```typescript
POST /students
{
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address: Address;
  guardian_info?: GuardianInfo;
}

Response: {
  data: Student | null;
  error: PostgrestError | null;
}
```

#### Update Student
```typescript
PUT /students/{id}
{
  // Same as create, partial updates allowed
}

Response: {
  data: Student | null;
  error: PostgrestError | null;
}
```

#### Delete Student
```typescript
DELETE /students/{id}
Response: {
  data: null;
  error: PostgrestError | null;
}
```

### Billing API

#### Get Invoices
```typescript
GET /invoices?student_id={id}&status={status}
Response: {
  data: Invoice[];
  error: PostgrestError | null;
}
```

#### Create Invoice
```typescript
POST /invoices
{
  student_id: string;
  amount: number;
  due_date: string;
  description: string;
  items: InvoiceItem[];
}

Response: {
  data: Invoice | null;
  error: PostgrestError | null;
}
```

### Real-time Subscriptions

#### Subscribe to Table Changes
```typescript
const subscription = supabase
  .channel('table-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'students'
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

## Component Library

### Core Components

#### AddressInput
```typescript
interface AddressInputProps {
  value: Address;
  onChange: (address: Address) => void;
  required?: boolean;
  disabled?: boolean;
}

const AddressInput: React.FC<AddressInputProps>
```

**Usage:**
```tsx
<AddressInput
  value={address}
  onChange={setAddress}
  required
/>
```

#### StudentsList
```typescript
interface StudentsListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const StudentsList: React.FC<StudentsListProps>
```

**Usage:**
```tsx
<StudentsList
  students={students}
  onEdit={handleEdit}
  onDelete={handleDelete}
  loading={isLoading}
/>
```

#### ErrorBoundary
```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps>
```

**Usage:**
```tsx
<ErrorBoundary level="page" onError={logError}>
  <MyComponent />
</ErrorBoundary>
```

### Hooks

#### useRealtimeIntegration
```typescript
interface UseRealtimeIntegrationOptions {
  tables: string[];
  enabled?: boolean;
}

const useRealtimeIntegration: (options: UseRealtimeIntegrationOptions) => {
  isConnected: boolean;
  error: Error | null;
  lastHeartbeat: Date | null;
  reconnect: () => void;
}
```

**Usage:**
```tsx
const { isConnected, error, reconnect } = useRealtimeIntegration({
  tables: ['students', 'instructors'],
  enabled: true,
});
```

#### useThemeDetection
```typescript
const useThemeDetection: () => {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
```

### Utility Functions

#### Philippine Address Service
```typescript
// Get all regions
getRegions(): Region[]

// Get provinces by region
getProvincesByRegion(regionCode: string): Province[]

// Get cities by province
getCitiesByProvince(provinceCode: string): City[]

// Get barangays by city
getBarangaysByCity(cityCode: string): Barangay[]

// Validate address
validateAddress(address: Address): ValidationResult
```

## Database Schema

### Core Tables

#### students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address JSONB,
  guardian_info JSONB,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'dropped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### instructors
```sql
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  specialization TEXT[],
  hire_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### lessons
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
  lesson_type TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to view students" ON students
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage students" ON students
  FOR ALL USING (auth.role() = 'authenticated');
```

## Deployment Guide

### Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id

# Optional: Error Reporting
VITE_SENTRY_DSN=your_sentry_dsn
```

### Build and Deploy

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build
npm run build

# Deploy to Netlify
# Upload dist/ folder or connect GitHub repo
```

#### Self-hosted
```bash
# Build
npm run build

# Serve with any static server
npx serve dist
```

### Database Migration

```sql
-- Run migration scripts in order
-- 001_initial_schema.sql
-- 002_add_indexes.sql
-- 003_add_functions.sql
-- 004_enable_rls.sql
```

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Issues

**Problem**: Cannot connect to Supabase
**Solution**: 
- Check environment variables
- Verify Supabase URL and keys
- Check network connectivity
- Verify Supabase project status

```typescript
// Debug connection
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...');
```

#### 2. Real-time Not Working

**Problem**: Real-time updates not received
**Solution**:
- Check if real-time is enabled in Supabase
- Verify RLS policies allow subscriptions
- Check browser console for WebSocket errors
- Verify table name and schema

```typescript
// Debug real-time
const channel = supabase
  .channel('debug')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, 
    (payload) => console.log('Received:', payload))
  .subscribe((status) => console.log('Subscription status:', status));
```

#### 3. Authentication Issues

**Problem**: Login/logout not working
**Solution**:
- Check Auth settings in Supabase dashboard
- Verify redirect URLs
- Check email templates
- Verify user exists in auth.users

#### 4. Performance Issues

**Problem**: Slow loading times
**Solution**:
- Enable query caching
- Implement pagination
- Optimize database queries
- Use React.memo for expensive components
- Implement code splitting

### Debug Tools

#### React Query DevTools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to App component
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

#### Network Debugging
```typescript
// Log all Supabase requests
supabase.channel('db-changes')
  .on('*', { event: '*', schema: 'public' }, (payload) => {
    console.log('Database change:', payload);
  })
  .subscribe();
```

### Error Logging

#### Sentry Integration
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});

// Use with ErrorBoundary
<ErrorBoundary onError={(error, errorInfo) => {
  Sentry.captureException(error, { extra: errorInfo });
}}>
  <App />
</ErrorBoundary>
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load pages
const StudentsPage = React.lazy(() => import('./pages/StudentsPage'));
const BillingPage = React.lazy(() => import('./pages/BillingPage'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <StudentsPage />
</Suspense>
```

### Query Optimization
```typescript
// Use select to limit data
const { data: students } = useQuery({
  queryKey: ['students', 'list'],
  queryFn: () => supabase
    .from('students')
    .select('id, first_name, last_name, email')
    .limit(50),
});

// Use staleTime to reduce requests
const { data } = useQuery({
  queryKey: ['students', id],
  queryFn: () => getStudent(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Component Optimization
```typescript
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => expensiveTransformation(item));
}, [data]);
```

## Contributing Guidelines

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Use conventional commit messages
- Document public APIs

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit PR with description
5. Address review feedback
6. Merge after approval

### Development Workflow
```bash
# Setup
git clone <repo>
npm install
cp .env.example .env

# Development
npm run dev
npm run test:watch

# Before commit
npm run lint
npm run type-check
npm run test
npm run build
```
