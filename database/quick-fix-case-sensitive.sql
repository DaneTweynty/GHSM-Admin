-- =============================================
-- QUICK FIX FOR CONSOLE ERRORS
-- Creates lowercase aliases for existing uppercase tables
-- =============================================

-- Create lowercase views/aliases for uppercase tables
CREATE OR REPLACE VIEW students AS SELECT * FROM "Students";
CREATE OR REPLACE VIEW instructors AS SELECT * FROM "Instructors";  
CREATE OR REPLACE VIEW lessons AS SELECT * FROM "Lessons";

-- Grant permissions
GRANT ALL ON students TO anon, authenticated;
GRANT ALL ON instructors TO anon, authenticated;
GRANT ALL ON lessons TO anon, authenticated;

-- Enable RLS on the views
ALTER VIEW students ENABLE ROW LEVEL SECURITY;
ALTER VIEW instructors ENABLE ROW LEVEL SECURITY;
ALTER VIEW lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the views
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all operations on instructors" ON instructors FOR ALL USING (true);
CREATE POLICY "Allow all operations on lessons" ON lessons FOR ALL USING (true);
