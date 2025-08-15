-- GHSM Admin - Production Database Setup
-- This file creates all necessary tables, constraints, and security policies
-- Execute this script in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student', 'guardian');
CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE billing_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused', 'late');

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  phone TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  instrument TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Beginner',
  guardian_name TEXT,
  guardian_email TEXT,
  guardian_phone TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  specialty TEXT NOT NULL,
  instruments TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  color TEXT NOT NULL DEFAULT '#3B82F6',
  bio TEXT,
  qualifications TEXT[],
  availability JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- minutes
  status lesson_status NOT NULL DEFAULT 'scheduled',
  location TEXT,
  notes TEXT,
  homework TEXT,
  materials TEXT[],
  cost DECIMAL(10,2),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_pattern JSONB DEFAULT '{}',
  color TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'present',
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  notes TEXT,
  instructor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id, student_id)
);

-- Create session_summaries table
CREATE TABLE IF NOT EXISTS session_summaries (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  achievements TEXT[],
  areas_for_improvement TEXT[],
  homework_assigned TEXT,
  next_session_goals TEXT,
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  engagement_level INTEGER CHECK (engagement_level >= 1 AND engagement_level <= 5),
  progress_rating INTEGER CHECK (progress_rating >= 1 AND progress_rating <= 5),
  materials_used TEXT[],
  techniques_covered TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Create billings table
CREATE TABLE IF NOT EXISTS billings (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  status billing_status NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  notes TEXT,
  line_items JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT UNIQUE,
  status payment_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  processor_response JSONB DEFAULT '{}',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create data migrations tracking table
CREATE TABLE IF NOT EXISTS data_migrations (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  version TEXT NOT NULL,
  checksum TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  rollback_sql TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_student_id_number ON students(student_id_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_instrument ON students(instrument);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

CREATE INDEX IF NOT EXISTS idx_instructors_name ON instructors(name);
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_status ON instructors(status);
CREATE INDEX IF NOT EXISTS idx_instructors_specialty ON instructors(specialty);

CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_instructor_id ON lessons(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_date_status ON lessons(date, status);

CREATE INDEX IF NOT EXISTS idx_attendance_lesson_id ON attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

CREATE INDEX IF NOT EXISTS idx_session_summaries_lesson_id ON session_summaries(lesson_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_instructor_id ON session_summaries(instructor_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_student_id ON session_summaries(student_id);

CREATE INDEX IF NOT EXISTS idx_billings_student_id ON billings(student_id);
CREATE INDEX IF NOT EXISTS idx_billings_status ON billings(status);
CREATE INDEX IF NOT EXISTS idx_billings_due_date ON billings(due_date);
CREATE INDEX IF NOT EXISTS idx_billings_period ON billings(billing_period_start, billing_period_end);

CREATE INDEX IF NOT EXISTS idx_payments_billing_id ON payments(billing_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_summaries_updated_at BEFORE UPDATE ON session_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON billings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_migrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic admin-only access)
-- In production, you may want more granular policies

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can do everything on profiles" ON profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Students policies
CREATE POLICY "Students viewable by authenticated users" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage students" ON students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Instructors policies
CREATE POLICY "Instructors viewable by authenticated users" ON instructors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Instructors can update own data" ON instructors FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage instructors" ON instructors FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Lessons policies
CREATE POLICY "Lessons viewable by authenticated users" ON lessons FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Instructors can manage own lessons" ON lessons FOR ALL USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all lessons" ON lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Attendance policies
CREATE POLICY "Attendance viewable by authenticated users" ON attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Instructors can manage attendance for own lessons" ON attendance FOR ALL USING (
  lesson_id IN (
    SELECT id FROM lessons WHERE instructor_id IN (
      SELECT id FROM instructors WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Admins can manage all attendance" ON attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Session summaries policies
CREATE POLICY "Session summaries viewable by authenticated users" ON session_summaries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Instructors can manage own session summaries" ON session_summaries FOR ALL USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all session summaries" ON session_summaries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Billings policies
CREATE POLICY "Billings viewable by authenticated users" ON billings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage billings" ON billings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Payments policies
CREATE POLICY "Payments viewable by authenticated users" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage payments" ON payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Data migrations policies (admin only)
CREATE POLICY "Only admins can access migrations" ON data_migrations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create helpful views
CREATE OR REPLACE VIEW lesson_details AS
SELECT 
  l.*,
  s.name as student_name,
  s.instrument,
  i.name as instructor_name,
  i.color as instructor_color,
  COALESCE(a.status, 'absent') as attendance_status
FROM lessons l
LEFT JOIN students s ON l.student_id = s.id
LEFT JOIN instructors i ON l.instructor_id = i.id
LEFT JOIN attendance a ON l.id = a.lesson_id;

CREATE OR REPLACE VIEW billing_summary AS
SELECT 
  b.*,
  s.name as student_name,
  s.student_id_number,
  COALESCE(SUM(p.amount), 0) as paid_amount,
  b.final_amount - COALESCE(SUM(p.amount), 0) as balance_due
FROM billings b
LEFT JOIN students s ON b.student_id = s.id
LEFT JOIN payments p ON b.id = p.billing_id AND p.status = 'completed'
GROUP BY b.id, s.name, s.student_id_number;

-- Create notification triggers for real-time updates
CREATE OR REPLACE FUNCTION notify_data_change()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'id', COALESCE(NEW.id, OLD.id)
  )::text;
  
  PERFORM pg_notify('data_changes', payload);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply notification triggers to key tables
CREATE TRIGGER notify_students_change AFTER INSERT OR UPDATE OR DELETE ON students FOR EACH ROW EXECUTE FUNCTION notify_data_change();
CREATE TRIGGER notify_instructors_change AFTER INSERT OR UPDATE OR DELETE ON instructors FOR EACH ROW EXECUTE FUNCTION notify_data_change();
CREATE TRIGGER notify_lessons_change AFTER INSERT OR UPDATE OR DELETE ON lessons FOR EACH ROW EXECUTE FUNCTION notify_data_change();
CREATE TRIGGER notify_attendance_change AFTER INSERT OR UPDATE OR DELETE ON attendance FOR EACH ROW EXECUTE FUNCTION notify_data_change();
CREATE TRIGGER notify_session_summaries_change AFTER INSERT OR UPDATE OR DELETE ON session_summaries FOR EACH ROW EXECUTE FUNCTION notify_data_change();
CREATE TRIGGER notify_billings_change AFTER INSERT OR UPDATE OR DELETE ON billings FOR EACH ROW EXECUTE FUNCTION notify_data_change();
CREATE TRIGGER notify_payments_change AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION notify_data_change();

-- Initial data setup
-- Create admin user profile (replace with actual admin user ID)
-- INSERT INTO profiles (id, email, name, role) VALUES 
-- ('your-admin-user-id', 'admin@example.com', 'Admin User', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

COMMENT ON DATABASE postgres IS 'GHSM Admin - Guitar/Music School Management System';
COMMENT ON TABLE students IS 'Student records and information';
COMMENT ON TABLE instructors IS 'Instructor profiles and details';
COMMENT ON TABLE lessons IS 'Scheduled lessons and appointments';
COMMENT ON TABLE attendance IS 'Lesson attendance tracking';
COMMENT ON TABLE session_summaries IS 'Post-lesson summaries and notes';
COMMENT ON TABLE billings IS 'Student billing and invoicing';
COMMENT ON TABLE payments IS 'Payment records and transactions';
COMMENT ON TABLE data_migrations IS 'Database migration tracking';
