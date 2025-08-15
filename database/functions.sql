-- GHSM Admin - Database Functions and Stored Procedures
-- Advanced database functions for complex operations

-- Function to calculate student billing for a period
CREATE OR REPLACE FUNCTION calculate_student_billing(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_hourly_rate DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  lesson_count INTEGER,
  total_hours DECIMAL,
  total_amount DECIMAL,
  lesson_details JSONB
) AS $$
DECLARE
  v_rate DECIMAL;
BEGIN
  -- Get instructor's hourly rate if not provided
  IF p_hourly_rate IS NULL THEN
    SELECT COALESCE(AVG(i.hourly_rate), 50.00)
    INTO v_rate
    FROM lessons l
    JOIN instructors i ON l.instructor_id = i.id
    WHERE l.student_id = p_student_id
      AND l.date >= p_start_date
      AND l.date <= p_end_date
      AND l.status = 'completed';
  ELSE
    v_rate := p_hourly_rate;
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as lesson_count,
    (SUM(l.duration) / 60.0)::DECIMAL as total_hours,
    (SUM(l.duration) / 60.0 * v_rate)::DECIMAL as total_amount,
    jsonb_agg(
      jsonb_build_object(
        'lesson_id', l.id,
        'date', l.date,
        'duration', l.duration,
        'instructor', i.name,
        'cost', (l.duration / 60.0 * v_rate)::DECIMAL
      )
    ) as lesson_details
  FROM lessons l
  JOIN instructors i ON l.instructor_id = i.id
  WHERE l.student_id = p_student_id
    AND l.date >= p_start_date
    AND l.date <= p_end_date
    AND l.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Function to get instructor availability
CREATE OR REPLACE FUNCTION get_instructor_availability(
  p_instructor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  available_slots JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', generate_series::DATE,
      'booked_hours', COALESCE(booked.total_hours, 0),
      'available_hours', 8 - COALESCE(booked.total_hours, 0)
    )
  ) as available_slots
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) 
  LEFT JOIN (
    SELECT 
      l.date::DATE as lesson_date,
      SUM(l.duration / 60.0) as total_hours
    FROM lessons l
    WHERE l.instructor_id = p_instructor_id
      AND l.date >= p_start_date
      AND l.date <= p_end_date
      AND l.status IN ('scheduled', 'completed')
    GROUP BY l.date::DATE
  ) booked ON generate_series::DATE = booked.lesson_date;
END;
$$ LANGUAGE plpgsql;

-- Function to generate attendance report
CREATE OR REPLACE FUNCTION generate_attendance_report(
  p_student_id UUID DEFAULT NULL,
  p_instructor_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  student_name TEXT,
  instructor_name TEXT,
  total_lessons INTEGER,
  attended INTEGER,
  absent INTEGER,
  late INTEGER,
  excused INTEGER,
  attendance_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.name as student_name,
    i.name as instructor_name,
    COUNT(l.id)::INTEGER as total_lessons,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END)::INTEGER as attended,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END)::INTEGER as absent,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END)::INTEGER as late,
    COUNT(CASE WHEN a.status = 'excused' THEN 1 END)::INTEGER as excused,
    ROUND(
      (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) * 100.0 / 
       NULLIF(COUNT(l.id), 0)), 2
    ) as attendance_rate
  FROM lessons l
  JOIN students s ON l.student_id = s.id
  JOIN instructors i ON l.instructor_id = i.id
  LEFT JOIN attendance a ON l.id = a.lesson_id
  WHERE 
    (p_student_id IS NULL OR l.student_id = p_student_id)
    AND (p_instructor_id IS NULL OR l.instructor_id = p_instructor_id)
    AND (p_start_date IS NULL OR l.date >= p_start_date)
    AND (p_end_date IS NULL OR l.date <= p_end_date)
    AND l.status IN ('completed', 'no_show')
  GROUP BY s.id, s.name, i.id, i.name
  ORDER BY s.name, i.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_date_filter TEXT DEFAULT 'month' -- 'week', 'month', 'year'
)
RETURNS TABLE (
  total_students INTEGER,
  active_students INTEGER,
  total_instructors INTEGER,
  active_instructors INTEGER,
  lessons_this_period INTEGER,
  lessons_completed INTEGER,
  revenue_this_period DECIMAL,
  outstanding_balance DECIMAL
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Calculate date range based on filter
  v_end_date := CURRENT_DATE;
  
  CASE p_date_filter
    WHEN 'week' THEN
      v_start_date := CURRENT_DATE - INTERVAL '7 days';
    WHEN 'month' THEN
      v_start_date := DATE_TRUNC('month', CURRENT_DATE);
    WHEN 'year' THEN
      v_start_date := DATE_TRUNC('year', CURRENT_DATE);
    ELSE
      v_start_date := DATE_TRUNC('month', CURRENT_DATE);
  END CASE;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM students WHERE is_active = true) as total_students,
    (SELECT COUNT(DISTINCT l.student_id)::INTEGER 
     FROM lessons l 
     WHERE l.date >= v_start_date AND l.date <= v_end_date) as active_students,
    (SELECT COUNT(*)::INTEGER FROM instructors WHERE status = 'active') as total_instructors,
    (SELECT COUNT(DISTINCT l.instructor_id)::INTEGER 
     FROM lessons l 
     WHERE l.date >= v_start_date AND l.date <= v_end_date) as active_instructors,
    (SELECT COUNT(*)::INTEGER 
     FROM lessons l 
     WHERE l.date >= v_start_date AND l.date <= v_end_date) as lessons_this_period,
    (SELECT COUNT(*)::INTEGER 
     FROM lessons l 
     WHERE l.date >= v_start_date AND l.date <= v_end_date 
       AND l.status = 'completed') as lessons_completed,
    (SELECT COALESCE(SUM(p.amount), 0)
     FROM payments p 
     WHERE p.processed_at >= v_start_date AND p.processed_at <= v_end_date 
       AND p.status = 'completed') as revenue_this_period,
    (SELECT COALESCE(SUM(b.final_amount - COALESCE(paid.amount, 0)), 0)
     FROM billings b
     LEFT JOIN (
       SELECT billing_id, SUM(amount) as amount
       FROM payments 
       WHERE status = 'completed'
       GROUP BY billing_id
     ) paid ON b.id = paid.billing_id
     WHERE b.status IN ('pending', 'overdue')) as outstanding_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate recurring lessons
CREATE OR REPLACE FUNCTION generate_recurring_lessons(
  p_template_lesson_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_template lessons%ROWTYPE;
  v_current_date DATE;
  v_lesson_count INTEGER := 0;
  v_recurring_pattern JSONB;
  v_interval_days INTEGER;
BEGIN
  -- Get template lesson
  SELECT * INTO v_template FROM lessons WHERE id = p_template_lesson_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template lesson not found';
  END IF;

  IF NOT v_template.is_recurring THEN
    RAISE EXCEPTION 'Template lesson is not marked as recurring';
  END IF;

  v_recurring_pattern := v_template.recurring_pattern;
  v_interval_days := COALESCE((v_recurring_pattern->>'interval_days')::INTEGER, 7);
  
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    -- Check if lesson already exists for this date
    IF NOT EXISTS (
      SELECT 1 FROM lessons 
      WHERE student_id = v_template.student_id 
        AND instructor_id = v_template.instructor_id
        AND date::DATE = v_current_date
    ) THEN
      -- Create new lesson
      INSERT INTO lessons (
        student_id, instructor_id, title, description, date, duration,
        status, location, notes, cost, is_recurring, recurring_pattern,
        color, metadata
      ) VALUES (
        v_template.student_id,
        v_template.instructor_id,
        v_template.title,
        v_template.description,
        v_current_date + (v_template.date::TIME),
        v_template.duration,
        'scheduled',
        v_template.location,
        v_template.notes,
        v_template.cost,
        false, -- Generated lessons are not recurring
        '{}',
        v_template.color,
        jsonb_build_object('generated_from', p_template_lesson_id)
      );
      
      v_lesson_count := v_lesson_count + 1;
    END IF;
    
    v_current_date := v_current_date + v_interval_days;
  END LOOP;

  RETURN v_lesson_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data(
  p_retention_days INTEGER DEFAULT 365
)
RETURNS TABLE (
  deleted_lessons INTEGER,
  deleted_attendance INTEGER,
  deleted_payments INTEGER
) AS $$
DECLARE
  v_cutoff_date DATE;
  v_deleted_lessons INTEGER;
  v_deleted_attendance INTEGER;
  v_deleted_payments INTEGER;
BEGIN
  v_cutoff_date := CURRENT_DATE - p_retention_days;
  
  -- Delete old attendance records for deleted lessons
  DELETE FROM attendance 
  WHERE lesson_id IN (
    SELECT id FROM lessons 
    WHERE date < v_cutoff_date AND status IN ('cancelled', 'no_show')
  );
  GET DIAGNOSTICS v_deleted_attendance = ROW_COUNT;
  
  -- Delete old cancelled/no-show lessons
  DELETE FROM lessons 
  WHERE date < v_cutoff_date AND status IN ('cancelled', 'no_show');
  GET DIAGNOSTICS v_deleted_lessons = ROW_COUNT;
  
  -- Delete old failed payment records
  DELETE FROM payments 
  WHERE created_at < v_cutoff_date AND status = 'failed';
  GET DIAGNOSTICS v_deleted_payments = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_lessons, v_deleted_attendance, v_deleted_payments;
END;
$$ LANGUAGE plpgsql;

-- Function to validate lesson scheduling conflicts
CREATE OR REPLACE FUNCTION check_lesson_conflicts(
  p_instructor_id UUID,
  p_date TIMESTAMPTZ,
  p_duration INTEGER,
  p_exclude_lesson_id UUID DEFAULT NULL
)
RETURNS TABLE (
  has_conflict BOOLEAN,
  conflicting_lessons JSONB
) AS $$
DECLARE
  v_end_time TIMESTAMPTZ;
  v_conflicts JSONB;
BEGIN
  v_end_time := p_date + (p_duration || ' minutes')::INTERVAL;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'lesson_id', l.id,
      'student_name', s.name,
      'start_time', l.date,
      'end_time', l.date + (l.duration || ' minutes')::INTERVAL,
      'title', l.title
    )
  ) INTO v_conflicts
  FROM lessons l
  JOIN students s ON l.student_id = s.id
  WHERE l.instructor_id = p_instructor_id
    AND l.status IN ('scheduled', 'completed')
    AND (p_exclude_lesson_id IS NULL OR l.id != p_exclude_lesson_id)
    AND (
      (l.date <= p_date AND l.date + (l.duration || ' minutes')::INTERVAL > p_date)
      OR
      (l.date < v_end_time AND l.date + (l.duration || ' minutes')::INTERVAL >= v_end_time)
      OR
      (l.date >= p_date AND l.date + (l.duration || ' minutes')::INTERVAL <= v_end_time)
    );

  RETURN QUERY SELECT 
    CASE WHEN v_conflicts IS NOT NULL THEN true ELSE false END as has_conflict,
    COALESCE(v_conflicts, '[]'::jsonb) as conflicting_lessons;
END;
$$ LANGUAGE plpgsql;

-- Function to get student progress report
CREATE OR REPLACE FUNCTION get_student_progress(
  p_student_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_lessons INTEGER,
  completed_lessons INTEGER,
  avg_progress_rating DECIMAL,
  avg_engagement_level DECIMAL,
  recent_achievements TEXT[],
  areas_for_improvement TEXT[],
  progress_trend TEXT
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_prev_period_rating DECIMAL;
  v_current_period_rating DECIMAL;
BEGIN
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);
  v_start_date := COALESCE(p_start_date, v_end_date - INTERVAL '3 months');
  
  -- Get current period average
  SELECT AVG(progress_rating) INTO v_current_period_rating
  FROM session_summaries ss
  JOIN lessons l ON ss.lesson_id = l.id
  WHERE ss.student_id = p_student_id
    AND l.date >= v_start_date
    AND l.date <= v_end_date;
  
  -- Get previous period average for trend
  SELECT AVG(progress_rating) INTO v_prev_period_rating
  FROM session_summaries ss
  JOIN lessons l ON ss.lesson_id = l.id
  WHERE ss.student_id = p_student_id
    AND l.date >= v_start_date - (v_end_date - v_start_date)
    AND l.date < v_start_date;

  RETURN QUERY
  SELECT 
    COUNT(l.id)::INTEGER as total_lessons,
    COUNT(CASE WHEN l.status = 'completed' THEN 1 END)::INTEGER as completed_lessons,
    ROUND(AVG(ss.progress_rating), 2) as avg_progress_rating,
    ROUND(AVG(ss.engagement_level), 2) as avg_engagement_level,
    array_agg(DISTINCT achievement) FILTER (WHERE achievement IS NOT NULL) as recent_achievements,
    array_agg(DISTINCT improvement) FILTER (WHERE improvement IS NOT NULL) as areas_for_improvement,
    CASE 
      WHEN v_current_period_rating > v_prev_period_rating THEN 'improving'
      WHEN v_current_period_rating < v_prev_period_rating THEN 'declining'
      ELSE 'stable'
    END as progress_trend
  FROM lessons l
  LEFT JOIN session_summaries ss ON l.id = ss.lesson_id
  LEFT JOIN LATERAL unnest(ss.achievements) as achievement ON true
  LEFT JOIN LATERAL unnest(ss.areas_for_improvement) as improvement ON true
  WHERE l.student_id = p_student_id
    AND l.date >= v_start_date
    AND l.date <= v_end_date;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for the new functions
CREATE INDEX IF NOT EXISTS idx_lessons_date_status_instructor ON lessons(date, status, instructor_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_student_lesson ON session_summaries(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_payments_processed_status ON payments(processed_at, status);

-- Grant execute permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
