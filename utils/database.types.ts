export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_records: {
        Row: {
          id: string
          lesson_id: string
          student_id: string
          status: 'present' | 'absent' | 'late' | 'excused'
          marked_at: string
          marked_by: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          student_id: string
          status: 'present' | 'absent' | 'late' | 'excused'
          marked_at?: string
          marked_by: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          student_id?: string
          status?: 'present' | 'absent' | 'late' | 'excused'
          marked_at?: string
          marked_by?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      billings: {
        Row: {
          id: string
          student_id: string
          amount: number
          currency: string
          billing_period_start: string
          billing_period_end: string
          due_date: string
          status: 'pending' | 'paid' | 'overdue' | 'cancelled'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          amount: number
          currency?: string
          billing_period_start: string
          billing_period_end: string
          due_date: string
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          amount?: number
          currency?: string
          billing_period_start?: string
          billing_period_end?: string
          due_date?: string
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      instructors: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          specialties: string[]
          hourly_rate: number | null
          bio: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          specialties?: string[]
          hourly_rate?: number | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          specialties?: string[]
          hourly_rate?: number | null
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          id: string
          instructor_id: string
          student_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          lesson_type: string
          rate: number | null
          location: string | null
          notes: string | null
          recurring_pattern: Json | null
          parent_lesson_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          student_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          lesson_type: string
          rate?: number | null
          location?: string | null
          notes?: string | null
          recurring_pattern?: Json | null
          parent_lesson_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          student_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          lesson_type?: string
          rate?: number | null
          location?: string | null
          notes?: string | null
          recurring_pattern?: Json | null
          parent_lesson_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_parent_lesson_id_fkey"
            columns: ["parent_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          billing_id: string
          amount: number
          payment_method: string
          payment_date: string
          transaction_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          billing_id: string
          amount: number
          payment_method: string
          payment_date: string
          transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          billing_id?: string
          amount?: number
          payment_method?: string
          payment_date?: string
          transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          }
        ]
      }
      session_summaries: {
        Row: {
          id: string
          lesson_id: string
          instructor_id: string
          summary_text: string
          topics_covered: string[]
          homework_assigned: string | null
          student_progress: string | null
          next_lesson_focus: string | null
          submitted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          instructor_id: string
          summary_text: string
          topics_covered?: string[]
          homework_assigned?: string | null
          student_progress?: string | null
          next_lesson_focus?: string | null
          submitted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          instructor_id?: string
          summary_text?: string
          topics_covered?: string[]
          homework_assigned?: string | null
          student_progress?: string | null
          next_lesson_focus?: string | null
          submitted_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_summaries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          }
        ]
      }
      students: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          guardian_name: string | null
          guardian_email: string | null
          guardian_phone: string | null
          emergency_contact: string | null
          medical_notes: string | null
          enrollment_date: string
          status: 'active' | 'inactive' | 'graduated' | 'dropped'
          payment_plan: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          guardian_name?: string | null
          guardian_email?: string | null
          guardian_phone?: string | null
          emergency_contact?: string | null
          medical_notes?: string | null
          enrollment_date?: string
          status?: 'active' | 'inactive' | 'graduated' | 'dropped'
          payment_plan?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          guardian_name?: string | null
          guardian_email?: string | null
          guardian_phone?: string | null
          emergency_contact?: string | null
          medical_notes?: string | null
          enrollment_date?: string
          status?: 'active' | 'inactive' | 'graduated' | 'dropped'
          payment_plan?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          id: string
          title: string
          participants: string[]
          created_by: string
          created_at: string
          updated_at: string
          last_message_id?: string | null
          last_message_at?: string | null
          is_group: boolean
          status: 'active' | 'archived'
        }
        Insert: {
          id?: string
          title: string
          participants: string[]
          created_by: string
          created_at?: string
          updated_at?: string
          last_message_id?: string | null
          last_message_at?: string | null
          is_group?: boolean
          status?: 'active' | 'archived'
        }
        Update: {
          id?: string
          title?: string
          participants?: string[]
          created_by?: string
          created_at?: string
          updated_at?: string
          last_message_id?: string | null
          last_message_at?: string | null
          is_group?: boolean
          status?: 'active' | 'archived'
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          sender_type: 'instructor' | 'admin'
          content: string
          type: 'text' | 'image' | 'file' | 'audio'
          metadata?: Json | null
          reply_to_id?: string | null
          edited_at?: string | null
          deleted_at?: string | null
          created_at: string
          read_by: string[]
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          sender_type: 'instructor' | 'admin'
          content: string
          type?: 'text' | 'image' | 'file' | 'audio'
          metadata?: Json | null
          reply_to_id?: string | null
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
          read_by?: string[]
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          sender_type?: 'instructor' | 'admin'
          content?: string
          type?: 'text' | 'image' | 'file' | 'audio'
          metadata?: Json | null
          reply_to_id?: string | null
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
          read_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
