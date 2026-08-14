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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_employees: {
        Row: {
          avatar: string
          category: string
          created_at: string
          description: string
          id: string
          level: Database["public"]["Enums"]["ai_level"]
          monthly_price: number
          name: string
          role: string
          skills: string[]
        }
        Insert: {
          avatar?: string
          category: string
          created_at?: string
          description?: string
          id?: string
          level?: Database["public"]["Enums"]["ai_level"]
          monthly_price?: number
          name: string
          role: string
          skills?: string[]
        }
        Update: {
          avatar?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          level?: Database["public"]["Enums"]["ai_level"]
          monthly_price?: number
          name?: string
          role?: string
          skills?: string[]
        }
        Relationships: []
      }
      applications: {
        Row: {
          company_id: string
          cover_note: string
          created_at: string
          developer_id: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          cover_note?: string
          created_at?: string
          developer_id: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          cover_note?: string
          created_at?: string
          developer_id?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string
          id: string
          industry: string
          is_demo: boolean
          location: string
          logo_url: string | null
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          industry?: string
          is_demo?: boolean
          location?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          industry?: string
          is_demo?: boolean
          location?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          cv_path: string | null
          cv_url: string | null
          experience_years: number
          full_name: string
          github_url: string | null
          headline: string
          id: string
          is_demo: boolean
          linkedin_url: string | null
          skills: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          cv_path?: string | null
          cv_url?: string | null
          experience_years?: number
          full_name: string
          github_url?: string | null
          headline?: string
          id?: string
          is_demo?: boolean
          linkedin_url?: string | null
          skills?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          cv_path?: string | null
          cv_url?: string | null
          experience_years?: number
          full_name?: string
          github_url?: string | null
          headline?: string
          id?: string
          is_demo?: boolean
          linkedin_url?: string | null
          skills?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hired_ai_employees: {
        Row: {
          ai_employee_id: string
          company_id: string
          current_task: string
          hired_at: string
          id: string
          status: string
        }
        Insert: {
          ai_employee_id: string
          company_id: string
          current_task?: string
          hired_at?: string
          id?: string
          status?: string
        }
        Update: {
          ai_employee_id?: string
          company_id?: string
          current_task?: string
          hired_at?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hired_ai_employees_ai_employee_id_fkey"
            columns: ["ai_employee_id"]
            isOneToOne: false
            referencedRelation: "ai_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hired_ai_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_id: string
          created_at: string
          description: string
          employment_type: string
          id: string
          skills: string[]
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          employment_type?: string
          id?: string
          skills?: string[]
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          employment_type?: string
          id?: string
          skills?: string[]
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          id: string
          joined_at: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          company_id: string
          created_at: string
          ended_at: string | null
          host_id: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          ended_at?: string | null
          host_id?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          ended_at?: string | null
          host_id?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presence: {
        Row: {
          company_id: string | null
          last_seen_at: string
          status: Database["public"]["Enums"]["presence_status"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          last_seen_at?: string
          status?: Database["public"]["Enums"]["presence_status"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          last_seen_at?: string
          status?: Database["public"]["Enums"]["presence_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          company_id: string
          developer_id: string
          id: string
          joined_at: string
          role_title: string
        }
        Insert: {
          company_id: string
          developer_id: string
          id?: string
          joined_at?: string
          role_title?: string
        }
        Update: {
          company_id?: string
          developer_id?: string
          id?: string
          joined_at?: string
          role_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_company: { Args: { _company_id: string }; Returns: boolean }
      owns_developer_profile: { Args: { _dev_id: string }; Returns: boolean }
    }
    Enums: {
      ai_level: "Beginner" | "Intermediate" | "Advanced" | "Expert"
      app_role: "director" | "developer"
      application_status: "pending" | "accepted" | "rejected"
      meeting_status: "live" | "ended"
      presence_status: "online" | "working" | "meeting" | "away" | "offline"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      ai_level: ["Beginner", "Intermediate", "Advanced", "Expert"],
      app_role: ["director", "developer"],
      application_status: ["pending", "accepted", "rejected"],
      meeting_status: ["live", "ended"],
      presence_status: ["online", "working", "meeting", "away", "offline"],
    },
  },
} as const
