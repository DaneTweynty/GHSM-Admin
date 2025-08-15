// =============================================
// DATABASE TYPES FOR TEACHER MOBILE APP
// Generated types based on Supabase schema
// =============================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          role: 'admin' | 'instructor' | 'student';
          email: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'instructor' | 'student';
          email: string;
          full_name: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'admin' | 'instructor' | 'student';
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          name: string;
          nickname: string | null;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          age: number | null;
          gender: string | null;
          guardian_name: string | null;
          guardian_email: string | null;
          guardian_phone: string | null;
          guardian_facebook: string | null;
          address_country: string | null;
          address_province: string | null;
          address_city: string | null;
          address_barangay: string | null;
          address_line1: string | null;
          address_line2: string | null;
          instrument: string;
          level: string | null;
          assigned_instructor_id: string | null;
          facebook: string | null;
          credit_balance: number;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          nickname?: string | null;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          age?: number | null;
          gender?: string | null;
          guardian_name?: string | null;
          guardian_email?: string | null;
          guardian_phone?: string | null;
          guardian_facebook?: string | null;
          address_country?: string | null;
          address_province?: string | null;
          address_city?: string | null;
          address_barangay?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          instrument: string;
          level?: string | null;
          assigned_instructor_id?: string | null;
          facebook?: string | null;
          credit_balance?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          nickname?: string | null;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          age?: number | null;
          gender?: string | null;
          guardian_name?: string | null;
          guardian_email?: string | null;
          guardian_phone?: string | null;
          guardian_facebook?: string | null;
          address_country?: string | null;
          address_province?: string | null;
          address_city?: string | null;
          address_barangay?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          instrument?: string;
          level?: string | null;
          assigned_instructor_id?: string | null;
          facebook?: string | null;
          credit_balance?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_assigned_instructor_id_fkey";
            columns: ["assigned_instructor_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      instructors: {
        Row: {
          id: string;
          employee_id: string | null;
          specialties: string[] | null;
          hourly_rate: number | null;
          bio: string | null;
          qualifications: string[] | null;
          experience_years: number | null;
          availability: Record<string, unknown> | null;
          preferred_age_groups: string[] | null;
          languages: string[] | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          hire_date: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_id?: string | null;
          specialties?: string[] | null;
          hourly_rate?: number | null;
          bio?: string | null;
          qualifications?: string[] | null;
          experience_years?: number | null;
          availability?: Record<string, unknown> | null;
          preferred_age_groups?: string[] | null;
          languages?: string[] | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          hire_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          specialties?: string[] | null;
          hourly_rate?: number | null;
          bio?: string | null;
          qualifications?: string[] | null;
          experience_years?: number | null;
          availability?: Record<string, unknown> | null;
          preferred_age_groups?: string[] | null;
          languages?: string[] | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          hire_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instructors_id_fkey";
            columns: ["id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      lessons: {
        Row: {
          id: string;
          instructor_id: string;
          student_id: string;
          title: string;
          description: string | null;
          date: string;
          time: string;
          duration: number | null;
          end_time: string | null;
          room_id: number | null;
          location: string | null;
          lesson_type: string | null;
          rate: number | null;
          notes: string | null;
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
          recurring_pattern: Record<string, unknown> | null;
          parent_lesson_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          instructor_id: string;
          student_id: string;
          title: string;
          description?: string | null;
          date: string;
          time: string;
          duration?: number | null;
          room_id?: number | null;
          location?: string | null;
          lesson_type?: string | null;
          rate?: number | null;
          notes?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
          recurring_pattern?: Record<string, unknown> | null;
          parent_lesson_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          instructor_id?: string;
          student_id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          time?: string;
          duration?: number | null;
          room_id?: number | null;
          location?: string | null;
          lesson_type?: string | null;
          rate?: number | null;
          notes?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
          recurring_pattern?: Record<string, unknown> | null;
          parent_lesson_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "instructors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lessons_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lessons_parent_lesson_id_fkey";
            columns: ["parent_lesson_id"];
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          }
        ];
      };
      session_summaries: {
        Row: {
          id: string;
          lesson_id: string;
          instructor_id: string;
          summary_text: string;
          topics_covered: string[];
          homework_assigned: string | null;
          student_progress: string | null;
          next_lesson_focus: string | null;
          achievements: string | null;
          student_performance_rating: number | null;
          lesson_difficulty_rating: number | null;
          technique_focus: string[] | null;
          repertoire_covered: string[] | null;
          areas_for_improvement: string[] | null;
          strengths_demonstrated: string[] | null;
          practice_assignments: Record<string, unknown> | null;
          materials_used: string[] | null;
          recommended_practice_time: number | null;
          is_complete: boolean;
          requires_admin_review: boolean;
          admin_reviewed_at: string | null;
          admin_reviewed_by: string | null;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          instructor_id: string;
          summary_text: string;
          topics_covered: string[];
          homework_assigned?: string | null;
          student_progress?: string | null;
          next_lesson_focus?: string | null;
          achievements?: string | null;
          student_performance_rating?: number | null;
          lesson_difficulty_rating?: number | null;
          technique_focus?: string[] | null;
          repertoire_covered?: string[] | null;
          areas_for_improvement?: string[] | null;
          strengths_demonstrated?: string[] | null;
          practice_assignments?: Record<string, unknown> | null;
          materials_used?: string[] | null;
          recommended_practice_time?: number | null;
          is_complete?: boolean;
          requires_admin_review?: boolean;
          admin_reviewed_at?: string | null;
          admin_reviewed_by?: string | null;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          instructor_id?: string;
          summary_text?: string;
          topics_covered?: string[];
          homework_assigned?: string | null;
          student_progress?: string | null;
          next_lesson_focus?: string | null;
          achievements?: string | null;
          student_performance_rating?: number | null;
          lesson_difficulty_rating?: number | null;
          technique_focus?: string[] | null;
          repertoire_covered?: string[] | null;
          areas_for_improvement?: string[] | null;
          strengths_demonstrated?: string[] | null;
          practice_assignments?: Record<string, unknown> | null;
          materials_used?: string[] | null;
          recommended_practice_time?: number | null;
          is_complete?: boolean;
          requires_admin_review?: boolean;
          admin_reviewed_at?: string | null;
          admin_reviewed_by?: string | null;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_summaries_lesson_id_fkey";
            columns: ["lesson_id"];
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_summaries_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "instructors";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance_records: {
        Row: {
          id: string;
          lesson_id: string;
          student_id: string;
          instructor_id: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          arrival_time: string | null;
          departure_time: string | null;
          notes: string | null;
          makeup_required: boolean | null;
          makeup_lesson_id: string | null;
          marked_at: string;
          marked_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          student_id: string;
          instructor_id: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          arrival_time?: string | null;
          departure_time?: string | null;
          notes?: string | null;
          makeup_required?: boolean | null;
          makeup_lesson_id?: string | null;
          marked_at?: string;
          marked_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          student_id?: string;
          instructor_id?: string;
          status?: 'present' | 'absent' | 'late' | 'excused';
          arrival_time?: string | null;
          departure_time?: string | null;
          notes?: string | null;
          makeup_required?: boolean | null;
          makeup_lesson_id?: string | null;
          marked_at?: string;
          marked_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_lesson_id_fkey";
            columns: ["lesson_id"];
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "instructors";
            referencedColumns: ["id"];
          }
        ];
      };
      billings: {
        Row: {
          id: string;
          student_id: string;
          billing_period_start: string;
          billing_period_end: string;
          amount: number;
          currency: string | null;
          due_date: string;
          status: 'pending' | 'paid' | 'overdue' | 'cancelled';
          description: string | null;
          itemized_charges: Record<string, unknown> | null;
          discount_amount: number | null;
          discount_reason: string | null;
          adjustment_amount: number | null;
          adjustment_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          billing_period_start: string;
          billing_period_end: string;
          amount: number;
          currency?: string | null;
          due_date: string;
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
          description?: string | null;
          itemized_charges?: Record<string, unknown> | null;
          discount_amount?: number | null;
          discount_reason?: string | null;
          adjustment_amount?: number | null;
          adjustment_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          billing_period_start?: string;
          billing_period_end?: string;
          amount?: number;
          currency?: string | null;
          due_date?: string;
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
          description?: string | null;
          itemized_charges?: Record<string, unknown> | null;
          discount_amount?: number | null;
          discount_reason?: string | null;
          adjustment_amount?: number | null;
          adjustment_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billings_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          billing_id: string;
          student_id: string;
          amount: number;
          payment_method: string;
          payment_date: string;
          transaction_id: string | null;
          reference_number: string | null;
          status: 'pending' | 'completed' | 'failed' | 'refunded';
          notes: string | null;
          processed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          billing_id: string;
          student_id: string;
          amount: number;
          payment_method: string;
          payment_date: string;
          transaction_id?: string | null;
          reference_number?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          notes?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          billing_id?: string;
          student_id?: string;
          amount?: number;
          payment_method?: string;
          payment_date?: string;
          transaction_id?: string | null;
          reference_number?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          notes?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_billing_id_fkey";
            columns: ["billing_id"];
            referencedRelation: "billings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_conversations: {
        Row: {
          id: string;
          title: string | null;
          participant_ids: string[];
          last_message_at: string | null;
          last_message_preview: string | null;
          is_active: boolean;
          is_group: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          participant_ids: string[];
          last_message_at?: string | null;
          last_message_preview?: string | null;
          is_active?: boolean;
          is_group?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string | null;
          participant_ids?: string[];
          last_message_at?: string | null;
          last_message_preview?: string | null;
          is_active?: boolean;
          is_group?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversations_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          sender_type: 'admin' | 'instructor';
          content: string;
          type: 'text' | 'file' | 'image' | 'audio';
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          file_type: string | null;
          metadata: Record<string, unknown> | null;
          is_edited: boolean;
          edited_at: string | null;
          is_deleted: boolean;
          deleted_at: string | null;
          read_by: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          sender_type: 'admin' | 'instructor';
          content: string;
          type?: 'text' | 'file' | 'image' | 'audio';
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          metadata?: Record<string, unknown> | null;
          is_edited?: boolean;
          edited_at?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          read_by?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          sender_type?: 'admin' | 'instructor';
          content?: string;
          type?: 'text' | 'file' | 'image' | 'audio';
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          metadata?: Record<string, unknown> | null;
          is_edited?: boolean;
          edited_at?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
          read_by?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      teacher_dashboard_stats: {
        Row: {
          instructor_id: string | null;
          total_lessons: number | null;
          completed_lessons: number | null;
          upcoming_lessons: number | null;
          total_students: number | null;
          session_summaries_created: number | null;
          attendance_marked: number | null;
        };
        Relationships: [];
      };
      student_progress_summary: {
        Row: {
          student_id: string | null;
          student_name: string | null;
          instrument: string | null;
          assigned_instructor_id: string | null;
          total_lessons: number | null;
          completed_lessons: number | null;
          lessons_attended: number | null;
          avg_performance_rating: number | null;
          last_lesson_date: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_instructor_profile: {
        Args: {
          instructor_uuid: string;
        };
        Returns: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          employee_id: string | null;
          specialties: string[] | null;
          hourly_rate: number | null;
          bio: string | null;
          status: string;
          is_active: boolean;
        }[];
      };
      update_instructor_last_login: {
        Args: {
          instructor_uuid: string;
        };
        Returns: void;
      };
      get_instructor_lessons: {
        Args: {
          instructor_uuid: string;
          start_date?: string;
          end_date?: string;
        };
        Returns: {
          lesson_id: string;
          title: string;
          date: string;
          time: string;
          duration: number | null;
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
          student_id: string;
          student_name: string;
          student_instrument: string;
          location: string | null;
          notes: string | null;
          has_session_summary: boolean;
          has_attendance: boolean;
          attendance_status: 'present' | 'absent' | 'late' | 'excused' | null;
        }[];
      };
      get_todays_lessons: {
        Args: {
          instructor_uuid: string;
        };
        Returns: {
          lesson_id: string;
          title: string;
          time: string;
          duration: number | null;
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
          student_name: string;
          student_instrument: string;
          location: string | null;
          is_next_lesson: boolean;
        }[];
      };
      update_lesson_status: {
        Args: {
          lesson_uuid: string;
          new_status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
          instructor_uuid: string;
        };
        Returns: boolean;
      };
      get_instructor_students: {
        Args: {
          instructor_uuid: string;
        };
        Returns: {
          student_id: string;
          name: string;
          nickname: string | null;
          instrument: string;
          level: string | null;
          email: string | null;
          phone: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          total_lessons: number;
          completed_lessons: number;
          last_lesson_date: string | null;
          next_lesson_date: string | null;
          avg_performance: number | null;
          status: string;
        }[];
      };
      get_student_details: {
        Args: {
          student_uuid: string;
          instructor_uuid: string;
        };
        Returns: {
          student_id: string;
          name: string;
          nickname: string | null;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          age: number | null;
          instrument: string;
          level: string | null;
          guardian_name: string | null;
          guardian_email: string | null;
          guardian_phone: string | null;
          guardian_facebook: string | null;
          facebook: string | null;
          notes: string | null;
          credit_balance: number;
          total_lessons: number;
          completed_lessons: number;
          attendance_rate: number | null;
          avg_performance: number | null;
          last_lesson_date: string | null;
          next_lesson_date: string | null;
        }[];
      };
      create_session_summary: {
        Args: {
          lesson_uuid: string;
          instructor_uuid: string;
          summary_text: string;
          topics_covered: string[];
          homework_assigned?: string;
          student_progress?: string;
          next_lesson_focus?: string;
          achievements?: string;
          student_performance_rating?: number;
          lesson_difficulty_rating?: number;
          technique_focus?: string[];
          repertoire_covered?: string[];
          areas_for_improvement?: string[];
          strengths_demonstrated?: string[];
          practice_assignments?: Record<string, unknown>;
          materials_used?: string[];
          recommended_practice_time?: number;
        };
        Returns: string;
      };
      get_session_summary: {
        Args: {
          lesson_uuid: string;
          instructor_uuid: string;
        };
        Returns: {
          summary_id: string;
          lesson_id: string;
          summary_text: string;
          topics_covered: string[];
          homework_assigned: string | null;
          student_progress: string | null;
          next_lesson_focus: string | null;
          achievements: string | null;
          student_performance_rating: number | null;
          lesson_difficulty_rating: number | null;
          technique_focus: string[] | null;
          repertoire_covered: string[] | null;
          areas_for_improvement: string[] | null;
          strengths_demonstrated: string[] | null;
          practice_assignments: Record<string, unknown> | null;
          materials_used: string[] | null;
          recommended_practice_time: number | null;
          submitted_at: string;
          is_complete: boolean;
        }[];
      };
      mark_attendance: {
        Args: {
          lesson_uuid: string;
          student_uuid: string;
          instructor_uuid: string;
          attendance_status: 'present' | 'absent' | 'late' | 'excused';
          arrival_time?: string;
          departure_time?: string;
          notes?: string;
        };
        Returns: string;
      };
      get_student_attendance: {
        Args: {
          student_uuid: string;
          instructor_uuid: string;
          start_date?: string;
          end_date?: string;
        };
        Returns: {
          lesson_date: string;
          lesson_time: string;
          lesson_title: string;
          attendance_status: 'present' | 'absent' | 'late' | 'excused';
          arrival_time: string | null;
          departure_time: string | null;
          notes: string | null;
          marked_at: string;
        }[];
      };
      get_instructor_dashboard_stats: {
        Args: {
          instructor_uuid: string;
          date_range_start?: string;
          date_range_end?: string;
        };
        Returns: {
          total_students: number;
          total_lessons: number;
          completed_lessons: number;
          upcoming_lessons: number;
          session_summaries_pending: number;
          attendance_marked: number;
          average_performance: number | null;
          attendance_rate: number | null;
          this_week_lessons: number;
          next_week_lessons: number;
        }[];
      };
      get_instructor_conversations: {
        Args: {
          instructor_uuid: string;
        };
        Returns: {
          conversation_id: string;
          title: string | null;
          participant_ids: string[];
          last_message_at: string | null;
          last_message_preview: string | null;
          unread_count: number;
          is_group: boolean;
        }[];
      };
      get_teacher_system_settings: {
        Args: Record<PropertyKey, never>;
        Returns: {
          setting_key: string;
          setting_value: Record<string, unknown>;
        }[];
      };
      log_teacher_activity: {
        Args: {
          instructor_uuid: string;
          action_name: string;
          table_affected: string;
          record_id?: string;
          old_values?: Record<string, unknown>;
          new_values?: Record<string, unknown>;
        };
        Returns: void;
      };
      get_lesson_quick_summary: {
        Args: {
          lesson_uuid: string;
          instructor_uuid: string;
        };
        Returns: {
          lesson_id: string;
          title: string;
          date: string;
          time: string;
          student_name: string;
          has_summary: boolean;
          has_attendance: boolean;
          performance_rating: number | null;
        }[];
      };
    };
    Enums: {
      user_role: 'admin' | 'instructor' | 'student';
      lesson_status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
      attendance_status: 'present' | 'absent' | 'late' | 'excused';
      billing_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
      chat_message_type: 'text' | 'file' | 'image' | 'audio';
      chat_sender_type: 'admin' | 'instructor';
    };
    CompositeTypes: Record<string, never>;
  };
}

// =============================================
// TEACHER APP SPECIFIC TYPES
// =============================================

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Instructor = Database['public']['Tables']['instructors']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type SessionSummary = Database['public']['Tables']['session_summaries']['Row'];
export type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
export type ChatConversation = Database['public']['Tables']['chat_conversations']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

// Insert/Update types
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];
export type LessonInsert = Database['public']['Tables']['lessons']['Insert'];
export type LessonUpdate = Database['public']['Tables']['lessons']['Update'];
export type SessionSummaryInsert = Database['public']['Tables']['session_summaries']['Insert'];
export type AttendanceRecordInsert = Database['public']['Tables']['attendance_records']['Insert'];
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role'];
export type LessonStatus = Database['public']['Enums']['lesson_status'];
export type AttendanceStatus = Database['public']['Enums']['attendance_status'];
export type ChatMessageType = Database['public']['Enums']['chat_message_type'];
export type ChatSenderType = Database['public']['Enums']['chat_sender_type'];

// Function return types
export type InstructorProfile = Database['public']['Functions']['get_instructor_profile']['Returns'][0];
export type InstructorLesson = Database['public']['Functions']['get_instructor_lessons']['Returns'][0];
export type TodaysLesson = Database['public']['Functions']['get_todays_lessons']['Returns'][0];
export type InstructorStudent = Database['public']['Functions']['get_instructor_students']['Returns'][0];
export type StudentDetails = Database['public']['Functions']['get_student_details']['Returns'][0];
export type StudentAttendance = Database['public']['Functions']['get_student_attendance']['Returns'][0];
export type SessionSummaryData = Database['public']['Functions']['get_session_summary']['Returns'][0];
export type DashboardStats = Database['public']['Functions']['get_instructor_dashboard_stats']['Returns'][0];
export type InstructorConversation = Database['public']['Functions']['get_instructor_conversations']['Returns'][0];
export type LessonQuickSummary = Database['public']['Functions']['get_lesson_quick_summary']['Returns'][0];

// =============================================
// CUSTOM TYPES FOR TEACHER APP
// =============================================

export interface TeacherAuthResponse {
  user: UserProfile | null;
  profile: InstructorProfile | null;
  error: string | null;
}

export interface LessonWithDetails extends Lesson {
  student: Student;
  sessionSummary?: SessionSummary;
  attendanceRecord?: AttendanceRecord;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender: UserProfile;
}

export interface ConversationWithMessages extends ChatConversation {
  messages: ChatMessageWithSender[];
  unreadCount: number;
}

export interface PracticeAssignment {
  title: string;
  description: string;
  duration?: number; // minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  completed?: boolean;
}

export interface WeeklyAvailability {
  [key: string]: {
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
    breaks?: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface TeacherSettings {
  app_name: string;
  app_version: string;
  default_lesson_duration: number;
  max_students_per_instructor: number;
  attendance_grace_period: number;
  session_summary_required: boolean;
  chat_file_max_size: number;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextOffset?: number;
}

// =============================================
// FORM TYPES
// =============================================

export interface SessionSummaryForm {
  summaryText: string;
  topicsCovered: string[];
  homeworkAssigned?: string;
  studentProgress?: string;
  nextLessonFocus?: string;
  achievements?: string;
  studentPerformanceRating?: number;
  lessonDifficultyRating?: number;
  techniqueFocus: string[];
  repertoireCovered: string[];
  areasForImprovement: string[];
  strengthsDemonstrated: string[];
  practiceAssignments: PracticeAssignment[];
  materialsUsed: string[];
  recommendedPracticeTime?: number;
}

export interface AttendanceForm {
  status: AttendanceStatus;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
}

export interface ChatMessageForm {
  content: string;
  type: ChatMessageType;
  file?: File;
}

// =============================================
// NOTIFICATION TYPES
// =============================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface RealtimeEvent {
  type: 'lesson_update' | 'new_message' | 'attendance_marked' | 'session_summary_submitted';
  payload: Record<string, unknown>;
  timestamp: string;
}
