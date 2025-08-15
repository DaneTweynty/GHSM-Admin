# Database Setup Instructions

## Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: zkddbolfivqhhkvdmacr
3. Go to SQL Editor

## Step 2: Execute Schema Files
Execute these files in order by copying their contents into the SQL Editor:

### File 1: Execute `database/complete-schema.sql`
This creates all the tables, enums, and basic structure.

### File 2: Execute `database/teacher-app-functions.sql`  
This creates the database functions needed for the teacher app.

## Step 3: Verify Tables Created
After execution, check the Table Editor to confirm these tables exist:
- user_profiles
- students  
- instructors
- lessons
- billings
- payments
- attendance_records
- session_summaries
- chat_conversations
- chat_messages

## Step 4: Test the Application
Once tables are created, restart your dev server:
```bash
npm run dev
```

The 500/400 errors should be resolved once the database schema is applied.
