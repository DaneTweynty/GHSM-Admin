-- =============================================
-- GHSM Complete Database Schema
-- Supports both Admin Panel and Teacher Mobile App
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE billing_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE chat_message_type AS ENUM ('text', 'file', 'image', 'audio');
CREATE TYPE chat_sender_type AS ENUM ('admin', 'instructor');

-- =============================================
-- USER PROFILES (linked to Supabase Auth)
-- =============================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'instructor',
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- STUDENTS
-- =============================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')),
    
    -- Guardian Information
    guardian_name VARCHAR(255),
    guardian_email VARCHAR(255),
    guardian_phone VARCHAR(20),
    guardian_facebook VARCHAR(255),
    
    -- Address Information
    address_country VARCHAR(100),
    address_province VARCHAR(100),
    address_city VARCHAR(100),
    address_barangay VARCHAR(100),
    address_line1 TEXT,
    address_line2 TEXT,
    
    -- Academic Information
    instrument VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    assigned_instructor_id UUID REFERENCES user_profiles(id),
    
    -- Social Media
    facebook VARCHAR(255),
    
    -- Financial Information
    credit_balance DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INSTRUCTORS (Enhanced - linked to user_profiles)
-- =============================================

CREATE TABLE instructors (
    id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE,
    specialties TEXT[], -- Array of instruments/specialties
    hourly_rate DECIMAL(10,2),
    bio TEXT,
    qualifications TEXT[],
    experience_years INTEGER,
    availability JSONB, -- Store weekly availability schedule
    preferred_age_groups TEXT[],
    languages TEXT[] DEFAULT ARRAY['English'],
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    hire_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- LESSONS (Corrected field names to match application)
-- =============================================

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES instructors(id),
    student_id UUID NOT NULL REFERENCES students(id),
    
    -- Scheduling (using application field names)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL, -- Application uses 'date' field
    time TIME NOT NULL, -- Application uses 'time' field  
    duration INTEGER DEFAULT 60, -- Duration in minutes
    end_time TIME GENERATED ALWAYS AS (time + (duration || ' minutes')::INTERVAL) STORED,
    
    -- Location and Setup
    room_id INTEGER,
    location VARCHAR(255),
    
    -- Lesson Details
    lesson_type VARCHAR(50) DEFAULT 'regular',
    rate DECIMAL(10,2),
    notes TEXT,
    
    -- Status and Tracking
    status lesson_status NOT NULL DEFAULT 'scheduled',
    
    -- Recurring Lessons
    recurring_pattern JSONB, -- For recurring lesson configuration
    parent_lesson_id UUID REFERENCES lessons(id), -- For recurring lesson series
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SESSION SUMMARIES (Enhanced for Teacher App)
-- =============================================

CREATE TABLE session_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES instructors(id),
    
    -- Summary Content
    summary_text TEXT NOT NULL,
    topics_covered TEXT[] NOT NULL DEFAULT '{}',
    homework_assigned TEXT,
    student_progress TEXT,
    next_lesson_focus TEXT,
    achievements TEXT, -- Student achievements in this lesson
    
    -- Ratings and Assessments
    student_performance_rating INTEGER CHECK (student_performance_rating BETWEEN 1 AND 5),
    lesson_difficulty_rating INTEGER CHECK (lesson_difficulty_rating BETWEEN 1 AND 5),
    
    -- Technical Details
    technique_focus TEXT[],
    repertoire_covered TEXT[],
    areas_for_improvement TEXT[],
    strengths_demonstrated TEXT[],
    
    -- Homework and Practice
    practice_assignments JSONB, -- Structured practice assignments
    materials_used TEXT[],
    recommended_practice_time INTEGER, -- Minutes per day
    
    -- Status and Workflow
    is_complete BOOLEAN NOT NULL DEFAULT false,
    requires_admin_review BOOLEAN NOT NULL DEFAULT false,
    admin_reviewed_at TIMESTAMPTZ,
    admin_reviewed_by UUID REFERENCES user_profiles(id),
    
    -- Timestamps
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ATTENDANCE RECORDS
-- =============================================

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    instructor_id UUID NOT NULL REFERENCES instructors(id),
    
    -- Attendance Details
    status attendance_status NOT NULL,
    arrival_time TIMESTAMPTZ,
    departure_time TIMESTAMPTZ,
    
    -- Additional Information
    notes TEXT,
    makeup_required BOOLEAN DEFAULT false,
    makeup_lesson_id UUID REFERENCES lessons(id),
    
    -- Tracking
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    marked_by UUID NOT NULL REFERENCES user_profiles(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Business Rule: Unique attendance per lesson-student
    UNIQUE(lesson_id, student_id)
);

-- =============================================
-- BILLING SYSTEM
-- =============================================

CREATE TABLE billings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    
    -- Billing Period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Financial Details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PHP',
    
    -- Due Date and Status
    due_date DATE NOT NULL,
    status billing_status NOT NULL DEFAULT 'pending',
    
    -- Description and Notes
    description TEXT,
    itemized_charges JSONB, -- Detailed breakdown of charges
    
    -- Discounts and Adjustments
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_reason TEXT,
    adjustment_amount DECIMAL(10,2) DEFAULT 0.00,
    adjustment_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PAYMENTS
-- =============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_id UUID NOT NULL REFERENCES billings(id),
    student_id UUID NOT NULL REFERENCES students(id), -- Denormalized for quick access
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    
    -- Transaction Information
    transaction_id VARCHAR(255),
    reference_number VARCHAR(255),
    
    -- Status and Processing
    status payment_status NOT NULL DEFAULT 'pending',
    
    -- Additional Information
    notes TEXT,
    processed_by UUID REFERENCES user_profiles(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- CHAT SYSTEM
-- =============================================

CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    
    -- Participants
    participant_ids UUID[] NOT NULL, -- Array of user_profile IDs
    
    -- Conversation Metadata
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_group BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    
    -- Sender Information
    sender_id UUID NOT NULL REFERENCES user_profiles(id),
    sender_type chat_sender_type NOT NULL,
    
    -- Message Content
    content TEXT NOT NULL,
    type chat_message_type NOT NULL DEFAULT 'text',
    
    -- File Attachments
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type VARCHAR(100),
    
    -- Message Metadata
    metadata JSONB, -- For additional message data
    
    -- Message Status
    is_edited BOOLEAN NOT NULL DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    
    -- Read Tracking
    read_by UUID[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- AUDIT LOG
-- =============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User and Action
    user_id UUID REFERENCES user_profiles(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SYSTEM SETTINGS
-- =============================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false, -- Can be accessed by non-admin users
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User Profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Students
CREATE INDEX idx_students_instructor ON students(assigned_instructor_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_instrument ON students(instrument);

-- Instructors
CREATE INDEX idx_instructors_status ON instructors(status);
CREATE INDEX idx_instructors_specialties ON instructors USING GIN(specialties);

-- Lessons
CREATE INDEX idx_lessons_instructor ON lessons(instructor_id);
CREATE INDEX idx_lessons_student ON lessons(student_id);
CREATE INDEX idx_lessons_date ON lessons(date);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_date_time ON lessons(date, time);

-- Session Summaries
CREATE INDEX idx_session_summaries_lesson ON session_summaries(lesson_id);
CREATE INDEX idx_session_summaries_instructor ON session_summaries(instructor_id);
CREATE INDEX idx_session_summaries_submitted ON session_summaries(submitted_at);

-- Attendance
CREATE INDEX idx_attendance_lesson ON attendance_records(lesson_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_instructor ON attendance_records(instructor_id);
CREATE INDEX idx_attendance_marked ON attendance_records(marked_at);

-- Billing and Payments
CREATE INDEX idx_billings_student ON billings(student_id);
CREATE INDEX idx_billings_status ON billings(status);
CREATE INDEX idx_billings_due_date ON billings(due_date);
CREATE INDEX idx_payments_billing ON payments(billing_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Chat
CREATE INDEX idx_chat_conversations_participants ON chat_conversations USING GIN(participant_ids);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Audit
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_summaries_updated_at BEFORE UPDATE ON session_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON billings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Students Policies
CREATE POLICY "Instructors can view their assigned students" ON students FOR SELECT USING (
    assigned_instructor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Instructors Policies
CREATE POLICY "Instructors can view their own data" ON instructors FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all instructors" ON instructors FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Lessons Policies
CREATE POLICY "Instructors can view their own lessons" ON lessons FOR SELECT USING (
    instructor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Instructors can update their own lessons" ON lessons FOR UPDATE USING (instructor_id = auth.uid());

-- Session Summaries Policies
CREATE POLICY "Instructors can manage their own session summaries" ON session_summaries FOR ALL USING (
    instructor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Attendance Policies
CREATE POLICY "Instructors can manage attendance for their lessons" ON attendance_records FOR ALL USING (
    instructor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Billing and Payment Policies (Admin only)
CREATE POLICY "Admins can manage billing" ON billings FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage payments" ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Chat Policies
CREATE POLICY "Users can view their conversations" ON chat_conversations FOR SELECT USING (
    auth.uid() = ANY(participant_ids)
);
CREATE POLICY "Users can view messages in their conversations" ON chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND auth.uid() = ANY(participant_ids))
);
CREATE POLICY "Users can send messages in their conversations" ON chat_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND auth.uid() = ANY(participant_ids))
);

-- Audit Logs (Admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- System Settings
CREATE POLICY "Users can view public settings" ON system_settings FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage all settings" ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- VIEWS FOR OPTIMIZED QUERIES
-- =============================================

-- Teacher Dashboard View
CREATE VIEW teacher_dashboard_stats AS
SELECT 
    i.id as instructor_id,
    COUNT(DISTINCT l.id) as total_lessons,
    COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as completed_lessons,
    COUNT(DISTINCT CASE WHEN l.status = 'scheduled' AND l.date >= CURRENT_DATE THEN l.id END) as upcoming_lessons,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT ss.id) as session_summaries_created,
    COUNT(DISTINCT ar.id) as attendance_marked
FROM instructors i
LEFT JOIN lessons l ON i.id = l.instructor_id
LEFT JOIN students s ON i.id = s.assigned_instructor_id
LEFT JOIN session_summaries ss ON i.id = ss.instructor_id
LEFT JOIN attendance_records ar ON i.id = ar.instructor_id
GROUP BY i.id;

-- Student Progress View
CREATE VIEW student_progress_summary AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.instrument,
    s.assigned_instructor_id,
    COUNT(l.id) as total_lessons,
    COUNT(CASE WHEN l.status = 'completed' THEN 1 END) as completed_lessons,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as lessons_attended,
    AVG(CASE WHEN ss.student_performance_rating IS NOT NULL THEN ss.student_performance_rating END) as avg_performance_rating,
    MAX(l.date) as last_lesson_date
FROM students s
LEFT JOIN lessons l ON s.id = l.student_id
LEFT JOIN attendance_records ar ON l.id = ar.lesson_id AND s.id = ar.student_id
LEFT JOIN session_summaries ss ON l.id = ss.lesson_id
GROUP BY s.id, s.name, s.instrument, s.assigned_instructor_id;

-- Lesson Schedule View
CREATE VIEW lesson_schedule_view AS
SELECT 
    l.id,
    l.title,
    l.date,
    l.time,
    l.duration,
    l.status,
    l.instructor_id,
    i.id as instructor_user_id,
    up_i.full_name as instructor_name,
    l.student_id,
    s.name as student_name,
    s.instrument,
    CASE WHEN ss.id IS NOT NULL THEN true ELSE false END as has_session_summary,
    CASE WHEN ar.id IS NOT NULL THEN true ELSE false END as has_attendance,
    ar.status as attendance_status
FROM lessons l
JOIN instructors i ON l.instructor_id = i.id
JOIN user_profiles up_i ON i.id = up_i.id
JOIN students s ON l.student_id = s.id
LEFT JOIN session_summaries ss ON l.id = ss.lesson_id
LEFT JOIN attendance_records ar ON l.id = ar.lesson_id;

-- Chat Conversation Summary View
CREATE VIEW chat_conversation_summary AS
SELECT 
    cc.id,
    cc.title,
    cc.participant_ids,
    cc.last_message_at,
    cc.last_message_preview,
    cc.is_group,
    COUNT(cm.id) as total_messages,
    COUNT(CASE WHEN cm.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as messages_last_24h
FROM chat_conversations cc
LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id AND cm.is_deleted = false
GROUP BY cc.id, cc.title, cc.participant_ids, cc.last_message_at, cc.last_message_preview, cc.is_group;

-- =============================================
-- INITIAL SYSTEM SETTINGS
-- =============================================

INSERT INTO system_settings (key, value, description, is_public) VALUES
('app_name', '"GHSM Admin"', 'Application name', true),
('app_version', '"1.0.0"', 'Application version', true),
('default_lesson_duration', '60', 'Default lesson duration in minutes', true),
('max_students_per_instructor', '50', 'Maximum students per instructor', false),
('attendance_grace_period', '15', 'Grace period for late attendance in minutes', false),
('session_summary_required', 'true', 'Whether session summary is required before attendance', false),
('chat_file_max_size', '10485760', 'Maximum file size for chat attachments in bytes (10MB)', true),
('backup_frequency', '"daily"', 'Database backup frequency', false);

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE user_profiles IS 'User profiles linked to Supabase Auth - supports admin and instructor roles';
COMMENT ON TABLE students IS 'Student information with guardian details and academic tracking';
COMMENT ON TABLE instructors IS 'Instructor profiles with specialties and availability';
COMMENT ON TABLE lessons IS 'Lesson scheduling with corrected field names to match application';
COMMENT ON TABLE session_summaries IS 'Detailed lesson summaries created by instructors';
COMMENT ON TABLE attendance_records IS 'Student attendance tracking with business rules';
COMMENT ON TABLE billings IS 'Student billing and invoicing system';
COMMENT ON TABLE payments IS 'Payment processing and tracking';
COMMENT ON TABLE chat_conversations IS 'Chat conversations between users';
COMMENT ON TABLE chat_messages IS 'Individual chat messages with file support';
COMMENT ON TABLE audit_logs IS 'System audit trail for compliance';
COMMENT ON TABLE system_settings IS 'Configurable system settings';

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'GHSM Complete Database Schema has been successfully created!';
    RAISE NOTICE 'Schema includes:';
    RAISE NOTICE '- User authentication and role management';
    RAISE NOTICE '- Complete student and instructor management';
    RAISE NOTICE '- Lesson scheduling with corrected field names';
    RAISE NOTICE '- Session summaries and attendance tracking';
    RAISE NOTICE '- Billing and payment processing';
    RAISE NOTICE '- Chat system for communication';
    RAISE NOTICE '- Audit logging and system settings';
    RAISE NOTICE '- Performance indexes and RLS policies';
    RAISE NOTICE '- Optimized views for both admin and teacher apps';
END $$;
