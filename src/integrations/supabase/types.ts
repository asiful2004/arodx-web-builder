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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          business_address: string | null
          business_category: string
          business_name: string
          business_phone: string
          created_at: string
          description: string | null
          domain_name: string | null
          domain_type: string
          email: string | null
          id: string
          logo_url: string | null
          order_id: string | null
          social_links: Json | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          business_address?: string | null
          business_category: string
          business_name: string
          business_phone: string
          created_at?: string
          description?: string | null
          domain_name?: string | null
          domain_type?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          order_id?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          business_address?: string | null
          business_category?: string
          business_name?: string
          business_phone?: string
          created_at?: string
          description?: string | null
          domain_name?: string | null
          domain_type?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          order_id?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_ai_settings: {
        Row: {
          api_key: string
          auto_reply_delay: number
          created_at: string
          enabled: boolean
          id: string
          model_name: string
          provider: string
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string
          auto_reply_delay?: number
          created_at?: string
          enabled?: boolean
          id?: string
          model_name?: string
          provider?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string
          auto_reply_delay?: number
          created_at?: string
          enabled?: boolean
          id?: string
          model_name?: string
          provider?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_type: string
          sender_id: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_type?: string
          sender_id?: string | null
          sender_type?: string
          session_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_type?: string
          sender_id?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          guest_email: string | null
          guest_name: string | null
          id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      device_login_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          device_info: Json
          expires_at: string
          id: string
          status: string
          token: string
          user_email: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          device_info?: Json
          expires_at?: string
          id?: string
          status?: string
          token?: string
          user_email: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          device_info?: Json
          expires_at?: string
          id?: string
          status?: string
          token?: string
          user_email?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: string
          created_at: string
          id: string
          invoice_number: string
          order_id: string
          payment_method: string | null
          period_end: string
          period_start: string
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: string
          created_at?: string
          id?: string
          invoice_number: string
          order_id: string
          payment_method?: string | null
          period_end: string
          period_start: string
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: string
          created_at?: string
          id?: string
          invoice_number?: string
          order_id?: string
          payment_method?: string | null
          period_end?: string
          period_start?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: string
          billing_period: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          is_active: boolean
          package_name: string
          payment_method: string
          refund_reason: string | null
          refund_requested_at: string | null
          refund_resolved_at: string | null
          refund_status: string | null
          renewal_date: string | null
          status: string
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          amount: string
          billing_period?: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          is_active?: boolean
          package_name: string
          payment_method: string
          refund_reason?: string | null
          refund_requested_at?: string | null
          refund_resolved_at?: string | null
          refund_status?: string | null
          renewal_date?: string | null
          status?: string
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          amount?: string
          billing_period?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          is_active?: boolean
          package_name?: string
          payment_method?: string
          refund_reason?: string | null
          refund_requested_at?: string | null
          refund_resolved_at?: string | null
          refund_status?: string | null
          renewal_date?: string | null
          status?: string
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          attendance_type: Database["public"]["Enums"]["attendance_type"]
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          id: string
          note: string | null
          total_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_type?: Database["public"]["Enums"]["attendance_type"]
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_type?: Database["public"]["Enums"]["attendance_type"]
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          attachments: Json | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["staff_task_priority"]
          status: Database["public"]["Enums"]["staff_task_status"]
          target_role: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["staff_task_priority"]
          status?: Database["public"]["Enums"]["staff_task_status"]
          target_role: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["staff_task_priority"]
          status?: Database["public"]["Enums"]["staff_task_status"]
          target_role?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_admin_reply: boolean
          message: string
          reply_to_id: string | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin_reply?: boolean
          message: string
          reply_to_id?: string | null
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin_reply?: boolean
          message?: string
          reply_to_id?: string | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "ticket_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at: string | null
          created_at: string
          description: string
          id: string
          order_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          description: string
          id?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string
          device_name: string
          id: string
          is_active: boolean
          last_active: string
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint: string
          device_name?: string
          id?: string
          is_active?: boolean
          last_active?: string
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string
          id?: string
          is_active?: boolean
          last_active?: string
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_emails: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "client"
        | "staff"
        | "hr"
        | "graphics_designer"
        | "web_developer"
        | "project_manager"
        | "digital_marketer"
      attendance_type: "present" | "leave" | "half_day" | "late"
      leave_status: "pending" | "approved" | "rejected"
      leave_type: "sick" | "casual" | "annual" | "emergency" | "other"
      staff_task_priority: "low" | "medium" | "high" | "urgent"
      staff_task_status:
        | "pending"
        | "in_progress"
        | "review"
        | "completed"
        | "cancelled"
      ticket_category:
        | "billing"
        | "technical"
        | "domain"
        | "general"
        | "feature_request"
        | "bug_report"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "waiting" | "resolved" | "closed"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "client",
        "staff",
        "hr",
        "graphics_designer",
        "web_developer",
        "project_manager",
        "digital_marketer",
      ],
      attendance_type: ["present", "leave", "half_day", "late"],
      leave_status: ["pending", "approved", "rejected"],
      leave_type: ["sick", "casual", "annual", "emergency", "other"],
      staff_task_priority: ["low", "medium", "high", "urgent"],
      staff_task_status: [
        "pending",
        "in_progress",
        "review",
        "completed",
        "cancelled",
      ],
      ticket_category: [
        "billing",
        "technical",
        "domain",
        "general",
        "feature_request",
        "bug_report",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "waiting", "resolved", "closed"],
    },
  },
} as const
