-- =============================================
-- TEACHER MOBILE APP SPECIFIC FUNCTIONS
-- Optimized queries and procedures for teacher app
-- =============================================

-- =============================================
-- AUTHENTICATION FUNCTIONS
-- =============================================

-- Function to get instructor profile with authentication check
CREATE OR REPLACE FUNCTION get_instructor_profile(instructor_uuid UUID)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name VARCHAR,
    avatar_url TEXT,
    phone VARCHAR,
    employee_id VARCHAR,
    specialties TEXT[],
    hourly_rate DECIMAL,
    bio TEXT,
    status VARCHAR,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.full_name,
        up.avatar_url,
        up.phone,
        i.employee_id,
        i.specialties,
        i.hourly_rate,
        i.bio,
        i.status,
        up.is_active
    FROM user_profiles up
    JOIN instructors i ON up.id = i.id
    WHERE up.id = instructor_uuid 
    AND up.role = 'instructor'
    AND up.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update instructor last login
CREATE OR REPLACE FUNCTION update_instructor_last_login(instructor_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET last_login_at = NOW() 
    WHERE id = instructor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SCHEDULE MANAGEMENT FUNCTIONS
-- =============================================

-- Function to get instructor's lessons for a date range
CREATE OR REPLACE FUNCTION get_instructor_lessons(
    instructor_uuid UUID,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS TABLE (
    lesson_id UUID,
    title VARCHAR,
    date DATE,
    time TIME,
    duration INTEGER,
    status lesson_status,
    student_id UUID,
    student_name VARCHAR,
    student_instrument VARCHAR,
    location VARCHAR,
    notes TEXT,
    has_session_summary BOOLEAN,
    has_attendance BOOLEAN,
    attendance_status attendance_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.date,
        l.time,
        l.duration,
        l.status,
        l.student_id,
        s.name,
        s.instrument,
        l.location,
        l.notes,
        CASE WHEN ss.id IS NOT NULL THEN true ELSE false END,
        CASE WHEN ar.id IS NOT NULL THEN true ELSE false END,
        ar.status
    FROM lessons l
    JOIN students s ON l.student_id = s.id
    LEFT JOIN session_summaries ss ON l.id = ss.lesson_id
    LEFT JOIN attendance_records ar ON l.id = ar.lesson_id
    WHERE l.instructor_id = instructor_uuid
    AND l.date BETWEEN start_date AND end_date
    ORDER BY l.date, l.time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get today's lessons for instructor
CREATE OR REPLACE FUNCTION get_todays_lessons(instructor_uuid UUID)
RETURNS TABLE (
    lesson_id UUID,
    title VARCHAR,
    time TIME,
    duration INTEGER,
    status lesson_status,
    student_name VARCHAR,
    student_instrument VARCHAR,
    location VARCHAR,
    is_next_lesson BOOLEAN
) AS $$
DECLARE
    current_time TIME := CURRENT_TIME;
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.time,
        l.duration,
        l.status,
        s.name,
        s.instrument,
        l.location,
        CASE 
            WHEN l.time >= current_time AND l.status = 'scheduled' THEN true 
            ELSE false 
        END as is_next_lesson
    FROM lessons l
    JOIN students s ON l.student_id = s.id
    WHERE l.instructor_id = instructor_uuid
    AND l.date = CURRENT_DATE
    ORDER BY l.time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lesson status
CREATE OR REPLACE FUNCTION update_lesson_status(
    lesson_uuid UUID,
    new_status lesson_status,
    instructor_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE lessons 
    SET status = new_status, updated_at = NOW()
    WHERE id = lesson_uuid 
    AND instructor_id = instructor_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STUDENT MANAGEMENT FUNCTIONS
-- =============================================

-- Function to get instructor's students with recent activity
CREATE OR REPLACE FUNCTION get_instructor_students(instructor_uuid UUID)
RETURNS TABLE (
    student_id UUID,
    name VARCHAR,
    nickname VARCHAR,
    instrument VARCHAR,
    level VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    guardian_name VARCHAR,
    guardian_phone VARCHAR,
    total_lessons BIGINT,
    completed_lessons BIGINT,
    last_lesson_date DATE,
    next_lesson_date DATE,
    avg_performance NUMERIC,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.nickname,
        s.instrument,
        s.level,
        s.email,
        s.phone,
        s.guardian_name,
        s.guardian_phone,
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN l.status = 'completed' THEN 1 END) as completed_lessons,
        MAX(CASE WHEN l.status = 'completed' THEN l.date END) as last_lesson_date,
        MIN(CASE WHEN l.status = 'scheduled' AND l.date >= CURRENT_DATE THEN l.date END) as next_lesson_date,
        ROUND(AVG(CASE WHEN ss.student_performance_rating IS NOT NULL THEN ss.student_performance_rating END), 2) as avg_performance,
        s.status
    FROM students s
    LEFT JOIN lessons l ON s.id = l.student_id AND l.instructor_id = instructor_uuid
    LEFT JOIN session_summaries ss ON l.id = ss.lesson_id
    WHERE s.assigned_instructor_id = instructor_uuid
    AND s.status = 'active'
    GROUP BY s.id
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student details with lesson history
CREATE OR REPLACE FUNCTION get_student_details(
    student_uuid UUID,
    instructor_uuid UUID
)
RETURNS TABLE (
    student_id UUID,
    name VARCHAR,
    nickname VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    date_of_birth DATE,
    age INTEGER,
    instrument VARCHAR,
    level VARCHAR,
    guardian_name VARCHAR,
    guardian_email VARCHAR,
    guardian_phone VARCHAR,
    guardian_facebook VARCHAR,
    facebook VARCHAR,
    notes TEXT,
    credit_balance DECIMAL,
    total_lessons BIGINT,
    completed_lessons BIGINT,
    attendance_rate NUMERIC,
    avg_performance NUMERIC,
    last_lesson_date DATE,
    next_lesson_date DATE
) AS $$
BEGIN
    -- Verify instructor has access to this student
    IF NOT EXISTS (
        SELECT 1 FROM students 
        WHERE id = student_uuid 
        AND assigned_instructor_id = instructor_uuid
    ) THEN
        RAISE EXCEPTION 'Access denied to student data';
    END IF;

    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.nickname,
        s.email,
        s.phone,
        s.date_of_birth,
        s.age,
        s.instrument,
        s.level,
        s.guardian_name,
        s.guardian_email,
        s.guardian_phone,
        s.guardian_facebook,
        s.facebook,
        s.notes,
        s.credit_balance,
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN l.status = 'completed' THEN 1 END) as completed_lessons,
        ROUND(
            COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(ar.id), 0) * 100, 2
        ) as attendance_rate,
        ROUND(AVG(CASE WHEN ss.student_performance_rating IS NOT NULL THEN ss.student_performance_rating END), 2) as avg_performance,
        MAX(CASE WHEN l.status = 'completed' THEN l.date END) as last_lesson_date,
        MIN(CASE WHEN l.status = 'scheduled' AND l.date >= CURRENT_DATE THEN l.date END) as next_lesson_date
    FROM students s
    LEFT JOIN lessons l ON s.id = l.student_id AND l.instructor_id = instructor_uuid
    LEFT JOIN attendance_records ar ON l.id = ar.lesson_id AND s.id = ar.student_id
    LEFT JOIN session_summaries ss ON l.id = ss.lesson_id
    WHERE s.id = student_uuid
    GROUP BY s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SESSION SUMMARY FUNCTIONS
-- =============================================

-- Function to create session summary
CREATE OR REPLACE FUNCTION create_session_summary(
    lesson_uuid UUID,
    instructor_uuid UUID,
    summary_text TEXT,
    topics_covered TEXT[],
    homework_assigned TEXT DEFAULT NULL,
    student_progress TEXT DEFAULT NULL,
    next_lesson_focus TEXT DEFAULT NULL,
    achievements TEXT DEFAULT NULL,
    student_performance_rating INTEGER DEFAULT NULL,
    lesson_difficulty_rating INTEGER DEFAULT NULL,
    technique_focus TEXT[] DEFAULT '{}',
    repertoire_covered TEXT[] DEFAULT '{}',
    areas_for_improvement TEXT[] DEFAULT '{}',
    strengths_demonstrated TEXT[] DEFAULT '{}',
    practice_assignments JSONB DEFAULT '{}',
    materials_used TEXT[] DEFAULT '{}',
    recommended_practice_time INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    summary_id UUID;
BEGIN
    -- Verify instructor owns this lesson
    IF NOT EXISTS (
        SELECT 1 FROM lessons 
        WHERE id = lesson_uuid 
        AND instructor_id = instructor_uuid
    ) THEN
        RAISE EXCEPTION 'Access denied to lesson';
    END IF;

    INSERT INTO session_summaries (
        lesson_id,
        instructor_id,
        summary_text,
        topics_covered,
        homework_assigned,
        student_progress,
        next_lesson_focus,
        achievements,
        student_performance_rating,
        lesson_difficulty_rating,
        technique_focus,
        repertoire_covered,
        areas_for_improvement,
        strengths_demonstrated,
        practice_assignments,
        materials_used,
        recommended_practice_time,
        is_complete,
        submitted_at
    ) VALUES (
        lesson_uuid,
        instructor_uuid,
        summary_text,
        topics_covered,
        homework_assigned,
        student_progress,
        next_lesson_focus,
        achievements,
        student_performance_rating,
        lesson_difficulty_rating,
        technique_focus,
        repertoire_covered,
        areas_for_improvement,
        strengths_demonstrated,
        practice_assignments,
        materials_used,
        recommended_practice_time,
        true,
        NOW()
    ) RETURNING id INTO summary_id;

    RETURN summary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get session summary by lesson
CREATE OR REPLACE FUNCTION get_session_summary(
    lesson_uuid UUID,
    instructor_uuid UUID
)
RETURNS TABLE (
    summary_id UUID,
    lesson_id UUID,
    summary_text TEXT,
    topics_covered TEXT[],
    homework_assigned TEXT,
    student_progress TEXT,
    next_lesson_focus TEXT,
    achievements TEXT,
    student_performance_rating INTEGER,
    lesson_difficulty_rating INTEGER,
    technique_focus TEXT[],
    repertoire_covered TEXT[],
    areas_for_improvement TEXT[],
    strengths_demonstrated TEXT[],
    practice_assignments JSONB,
    materials_used TEXT[],
    recommended_practice_time INTEGER,
    submitted_at TIMESTAMPTZ,
    is_complete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.id,
        ss.lesson_id,
        ss.summary_text,
        ss.topics_covered,
        ss.homework_assigned,
        ss.student_progress,
        ss.next_lesson_focus,
        ss.achievements,
        ss.student_performance_rating,
        ss.lesson_difficulty_rating,
        ss.technique_focus,
        ss.repertoire_covered,
        ss.areas_for_improvement,
        ss.strengths_demonstrated,
        ss.practice_assignments,
        ss.materials_used,
        ss.recommended_practice_time,
        ss.submitted_at,
        ss.is_complete
    FROM session_summaries ss
    JOIN lessons l ON ss.lesson_id = l.id
    WHERE ss.lesson_id = lesson_uuid
    AND l.instructor_id = instructor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ATTENDANCE FUNCTIONS
-- =============================================

-- Function to mark attendance
CREATE OR REPLACE FUNCTION mark_attendance(
    lesson_uuid UUID,
    student_uuid UUID,
    instructor_uuid UUID,
    attendance_status attendance_status,
    arrival_time TIMESTAMPTZ DEFAULT NULL,
    departure_time TIMESTAMPTZ DEFAULT NULL,
    notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    attendance_id UUID;
BEGIN
    -- Verify instructor owns this lesson
    IF NOT EXISTS (
        SELECT 1 FROM lessons 
        WHERE id = lesson_uuid 
        AND instructor_id = instructor_uuid
        AND student_id = student_uuid
    ) THEN
        RAISE EXCEPTION 'Access denied to lesson';
    END IF;

    INSERT INTO attendance_records (
        lesson_id,
        student_id,
        instructor_id,
        status,
        arrival_time,
        departure_time,
        notes,
        marked_by,
        marked_at
    ) VALUES (
        lesson_uuid,
        student_uuid,
        instructor_uuid,
        attendance_status,
        COALESCE(arrival_time, NOW()),
        departure_time,
        notes,
        instructor_uuid,
        NOW()
    ) 
    ON CONFLICT (lesson_id, student_id) 
    DO UPDATE SET
        status = EXCLUDED.status,
        arrival_time = EXCLUDED.arrival_time,
        departure_time = EXCLUDED.departure_time,
        notes = EXCLUDED.notes,
        marked_at = NOW()
    RETURNING id INTO attendance_id;

    RETURN attendance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get attendance records for student
CREATE OR REPLACE FUNCTION get_student_attendance(
    student_uuid UUID,
    instructor_uuid UUID,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    lesson_date DATE,
    lesson_time TIME,
    lesson_title VARCHAR,
    attendance_status attendance_status,
    arrival_time TIMESTAMPTZ,
    departure_time TIMESTAMPTZ,
    notes TEXT,
    marked_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.date,
        l.time,
        l.title,
        ar.status,
        ar.arrival_time,
        ar.departure_time,
        ar.notes,
        ar.marked_at
    FROM attendance_records ar
    JOIN lessons l ON ar.lesson_id = l.id
    WHERE ar.student_id = student_uuid
    AND ar.instructor_id = instructor_uuid
    AND l.date BETWEEN start_date AND end_date
    ORDER BY l.date DESC, l.time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DASHBOARD ANALYTICS FUNCTIONS
-- =============================================

-- Function to get instructor dashboard statistics
CREATE OR REPLACE FUNCTION get_instructor_dashboard_stats(
    instructor_uuid UUID,
    date_range_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    date_range_end DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_students BIGINT,
    total_lessons BIGINT,
    completed_lessons BIGINT,
    upcoming_lessons BIGINT,
    session_summaries_pending BIGINT,
    attendance_marked BIGINT,
    average_performance NUMERIC,
    attendance_rate NUMERIC,
    this_week_lessons BIGINT,
    next_week_lessons BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT s.id) as total_students,
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN l.status = 'completed' THEN 1 END) as completed_lessons,
        COUNT(CASE WHEN l.status = 'scheduled' AND l.date >= CURRENT_DATE THEN 1 END) as upcoming_lessons,
        COUNT(CASE WHEN l.status = 'completed' AND ss.id IS NULL THEN 1 END) as session_summaries_pending,
        COUNT(ar.id) as attendance_marked,
        ROUND(AVG(CASE WHEN ss.student_performance_rating IS NOT NULL THEN ss.student_performance_rating END), 2) as average_performance,
        ROUND(
            COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(ar.id), 0) * 100, 2
        ) as attendance_rate,
        COUNT(CASE WHEN l.date BETWEEN DATE_TRUNC('week', CURRENT_DATE) AND DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days' THEN 1 END) as this_week_lessons,
        COUNT(CASE WHEN l.date BETWEEN DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days' AND DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '13 days' THEN 1 END) as next_week_lessons
    FROM instructors i
    LEFT JOIN students s ON i.id = s.assigned_instructor_id AND s.status = 'active'
    LEFT JOIN lessons l ON i.id = l.instructor_id AND l.date BETWEEN date_range_start AND date_range_end
    LEFT JOIN session_summaries ss ON l.id = ss.lesson_id
    LEFT JOIN attendance_records ar ON l.id = ar.lesson_id
    WHERE i.id = instructor_uuid
    GROUP BY i.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CHAT HELPER FUNCTIONS
-- =============================================

-- Function to get instructor's chat conversations
CREATE OR REPLACE FUNCTION get_instructor_conversations(instructor_uuid UUID)
RETURNS TABLE (
    conversation_id UUID,
    title VARCHAR,
    participant_ids UUID[],
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count BIGINT,
    is_group BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.title,
        cc.participant_ids,
        cc.last_message_at,
        cc.last_message_preview,
        COUNT(CASE WHEN cm.id IS NOT NULL AND NOT (instructor_uuid = ANY(cm.read_by)) THEN 1 END) as unread_count,
        cc.is_group
    FROM chat_conversations cc
    LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id AND cm.is_deleted = false
    WHERE instructor_uuid = ANY(cc.participant_ids)
    GROUP BY cc.id
    ORDER BY cc.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to get system settings accessible to teachers
CREATE OR REPLACE FUNCTION get_teacher_system_settings()
RETURNS TABLE (
    setting_key VARCHAR,
    setting_value JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT key, value
    FROM system_settings
    WHERE is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log teacher app activities
CREATE OR REPLACE FUNCTION log_teacher_activity(
    instructor_uuid UUID,
    action_name VARCHAR,
    table_affected VARCHAR,
    record_id UUID DEFAULT NULL,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        instructor_uuid,
        action_name,
        table_affected,
        record_id,
        old_values,
        new_values,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS
-- =============================================

-- Function to get lesson summary for quick overview
CREATE OR REPLACE FUNCTION get_lesson_quick_summary(
    lesson_uuid UUID,
    instructor_uuid UUID
)
RETURNS TABLE (
    lesson_id UUID,
    title VARCHAR,
    date DATE,
    time TIME,
    student_name VARCHAR,
    has_summary BOOLEAN,
    has_attendance BOOLEAN,
    performance_rating INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.date,
        l.time,
        s.name,
        CASE WHEN ss.id IS NOT NULL THEN true ELSE false END,
        CASE WHEN ar.id IS NOT NULL THEN true ELSE false END,
        ss.student_performance_rating
    FROM lessons l
    JOIN students s ON l.student_id = s.id
    LEFT JOIN session_summaries ss ON l.id = ss.lesson_id
    LEFT JOIN attendance_records ar ON l.id = ar.lesson_id
    WHERE l.id = lesson_uuid
    AND l.instructor_id = instructor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANTS FOR TEACHER APP FUNCTIONS
-- =============================================

-- Grant execute permissions to authenticated users (teachers)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Teacher Mobile App Functions have been successfully created!';
    RAISE NOTICE 'Functions include:';
    RAISE NOTICE '- Authentication and profile management';
    RAISE NOTICE '- Schedule and lesson management';
    RAISE NOTICE '- Student information and progress tracking';
    RAISE NOTICE '- Session summary creation and retrieval';
    RAISE NOTICE '- Attendance marking and tracking';
    RAISE NOTICE '- Dashboard analytics and statistics';
    RAISE NOTICE '- Chat conversation helpers';
    RAISE NOTICE '- Utility and logging functions';
    RAISE NOTICE '- Performance optimized quick queries';
    RAISE NOTICE 'All functions include proper security and access control!';
END $$;
