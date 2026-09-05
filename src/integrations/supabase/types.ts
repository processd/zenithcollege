export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          access_code: string
          address: string | null
          admin_notes: string | null
          application_number: string
          created_at: string
          date_of_birth: string | null
          email: string
          exam_number: string | null
          exam_type: string | null
          exam_year: string | null
          full_name: string
          gender: string | null
          id: string
          message: string | null
          phone: string
          programme: string
          state_of_origin: string | null
          status: string
          updated_at: string
        }
        Insert: {
          access_code: string
          address?: string | null
          admin_notes?: string | null
          application_number: string
          created_at?: string
          date_of_birth?: string | null
          email: string
          exam_number?: string | null
          exam_type?: string | null
          exam_year?: string | null
          full_name: string
          gender?: string | null
          id?: string
          message?: string | null
          phone: string
          programme: string
          state_of_origin?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_code?: string
          address?: string | null
          admin_notes?: string | null
          application_number?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string
          exam_number?: string | null
          exam_type?: string | null
          exam_year?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          message?: string | null
          phone?: string
          programme?: string
          state_of_origin?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          class_date: string
          course_id: string
          created_at: string
          id: string
          recorded_by: string | null
          remark: string | null
          semester: string
          session: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_date: string
          course_id: string
          created_at?: string
          id?: string
          recorded_by?: string | null
          remark?: string | null
          semester: string
          session: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_date?: string
          course_id?: string
          created_at?: string
          id?: string
          recorded_by?: string | null
          remark?: string | null
          semester?: string
          session?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lecturer_user_id: string
          session: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lecturer_user_id: string
          session?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lecturer_user_id?: string
          session?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_registrations: {
        Row: {
          course_id: string
          created_at: string
          id: string
          level: string | null
          semester: string
          session: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          level?: string | null
          semester: string
          session: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          level?: string | null
          semester?: string
          session?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_registrations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          credit_units: number | null
          description: string | null
          id: string
          is_active: boolean
          level: string | null
          programme_id: string | null
          semester: string | null
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credit_units?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          programme_id?: string | null
          semester?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credit_units?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          programme_id?: string | null
          semester?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          hod_user_id: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          hod_user_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          hod_user_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_invoices: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string | null
          id: string
          semester: string | null
          session: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          semester?: string | null
          session: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          semester?: string | null
          session?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          method: string
          paid_at: string | null
          receipt_number: string | null
          recorded_by: string | null
          reference: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string
          paid_at?: string | null
          receipt_number?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string
          paid_at?: string | null
          receipt_number?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fee_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "internal_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          audience: Database["public"]["Enums"]["app_role"][]
          body: string
          created_at: string
          id: string
          recipient_user_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["app_role"][]
          body: string
          created_at?: string
          id?: string
          recipient_user_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["app_role"][]
          body?: string
          created_at?: string
          id?: string
          recipient_user_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          author_id: string | null
          body: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          code: string
          created_at: string
          department_id: string | null
          description: string | null
          duration_years: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          duration_years?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          duration_years?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      result_audit: {
        Row: {
          action: string
          actor_id: string | null
          course_id: string | null
          created_at: string
          id: string
          notes: string | null
          result_id: string | null
          score: number | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          result_id?: string | null
          score?: number | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          result_id?: string | null
          score?: number | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      results: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          course_id: string
          created_at: string
          credit_unit: number
          entered_by: string | null
          grade: string | null
          grade_point: number | null
          id: string
          is_published: boolean
          quality_point: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number
          semester: string
          session: string
          status: string
          student_id: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          course_id: string
          created_at?: string
          credit_unit?: number
          entered_by?: string | null
          grade?: string | null
          grade_point?: number | null
          id?: string
          is_published?: boolean
          quality_point?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score: number
          semester: string
          session: string
          status?: string
          student_id: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          course_id?: string
          created_at?: string
          credit_unit?: number
          entered_by?: string | null
          grade?: string | null
          grade_point?: number | null
          id?: string
          is_published?: boolean
          quality_point?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number
          semester?: string
          session?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          created_at: string
          department_id: string | null
          designation: string | null
          employment_date: string | null
          id: string
          is_active: boolean
          qualification: string | null
          staff_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          designation?: string | null
          employment_date?: string | null
          id?: string
          is_active?: boolean
          qualification?: string | null
          staff_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          designation?: string | null
          employment_date?: string | null
          id?: string
          is_active?: boolean
          qualification?: string | null
          staff_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          application_id: string | null
          created_at: string
          email: string | null
          entry_year: number | null
          full_name: string
          id: string
          level: string | null
          matric_number: string | null
          phone: string | null
          programme_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          email?: string | null
          entry_year?: number | null
          full_name: string
          id?: string
          level?: string | null
          matric_number?: string | null
          phone?: string | null
          programme_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          email?: string | null
          entry_year?: number | null
          full_name?: string
          id?: string
          level?: string | null
          matric_number?: string | null
          phone?: string | null
          programme_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          day_of_week: string
          department_id: string | null
          end_time: string
          id: string
          kind: string
          lecturer_user_id: string | null
          level: string | null
          programme_id: string | null
          semester: string
          session: string
          start_time: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          day_of_week: string
          department_id?: string | null
          end_time: string
          id?: string
          kind?: string
          lecturer_user_id?: string | null
          level?: string | null
          programme_id?: string | null
          semester: string
          session: string
          start_time: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          day_of_week?: string
          department_id?: string | null
          end_time?: string
          id?: string
          kind?: string
          lecturer_user_id?: string | null
          level?: string | null
          programme_id?: string | null
          semester?: string
          session?: string
          start_time?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_audit: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          target_user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      zc_grade: { Args: { score: number }; Returns: string }
      zc_grade_point: { Args: { score: number }; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "super_admin"
        | "provost"
        | "deputy_provost"
        | "registrar"
        | "admissions_officer"
        | "hod"
        | "lecturer"
        | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "staff",
        "super_admin",
        "provost",
        "deputy_provost",
        "registrar",
        "admissions_officer",
        "hod",
        "lecturer",
        "student",
      ],
    },
  },
} as const
