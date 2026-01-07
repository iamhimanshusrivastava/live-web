// Database Type Definitions for Live-Web
// Fully typed Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          external_system_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          external_system_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          external_system_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          instructor_id: string;
          video_url: string;
          thumbnail_url: string | null;
          scheduled_start: string;
          scheduled_end: string;
          actual_start: string | null;
          actual_end: string | null;
          is_live: boolean;
          chat_enabled: boolean;
          max_viewers: number | null;
          recording_url: string | null;
          screen_url: string | null;
          face_url: string | null;
          stream_start_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          instructor_id: string;
          video_url: string;
          thumbnail_url?: string | null;
          scheduled_start: string;
          scheduled_end: string;
          actual_start?: string | null;
          actual_end?: string | null;
          is_live?: boolean;
          chat_enabled?: boolean;
          max_viewers?: number | null;
          recording_url?: string | null;
          screen_url?: string | null;
          face_url?: string | null;
          stream_start_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          instructor_id?: string;
          video_url?: string;
          thumbnail_url?: string | null;
          scheduled_start?: string;
          scheduled_end?: string;
          actual_start?: string | null;
          actual_end?: string | null;
          is_live?: boolean;
          chat_enabled?: boolean;
          max_viewers?: number | null;
          recording_url?: string | null;
          screen_url?: string | null;
          face_url?: string | null;
          stream_start_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: number;
          session_id: string;
          user_id: string;
          user_name: string;
          user_avatar: string | null;
          content: string;
          message_type: string;
          is_pinned: boolean;
          target_user_id: string | null;
          target_user_email: string | null;
          target_user_name: string | null;
          is_admin_message: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: string;
          user_id: string;
          user_name: string;
          user_avatar?: string | null;
          content: string;
          message_type?: string;
          is_pinned?: boolean;
          target_user_id?: string | null;
          target_user_email?: string | null;
          target_user_name?: string | null;
          is_admin_message?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: string;
          user_id?: string;
          user_name?: string;
          user_avatar?: string | null;
          content?: string;
          message_type?: string;
          is_pinned?: boolean;
          target_user_id?: string | null;
          target_user_email?: string | null;
          target_user_name?: string | null;
          is_admin_message?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      viewer_sessions: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          joined_at: string;
          left_at: string | null;
          duration_seconds: number | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          joined_at?: string;
          left_at?: string | null;
          duration_seconds?: number | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          joined_at?: string;
          left_at?: string | null;
          duration_seconds?: number | null;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          enrolled_at?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: number;
          message_id: number;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          message_id: number;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          message_id?: number;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      session_analytics: {
        Row: {
          session_id: string;
          total_viewers: number;
          peak_viewers: number;
          total_messages: number;
          avg_watch_duration_seconds: number;
          unique_chatters: number;
          chat_log: Json;
          computed_at: string;
        };
        Insert: {
          session_id: string;
          total_viewers?: number;
          peak_viewers?: number;
          total_messages?: number;
          avg_watch_duration_seconds?: number;
          unique_chatters?: number;
          chat_log?: Json;
          computed_at?: string;
        };
        Update: {
          session_id?: string;
          total_viewers?: number;
          peak_viewers?: number;
          total_messages?: number;
          avg_watch_duration_seconds?: number;
          unique_chatters?: number;
          chat_log?: Json;
          computed_at?: string;
        };
        Relationships: [];
      };
      active_sessions: {
        Row: {
          id: string;
          user_email: string;
          session_id: string;
          client_id: string;
          last_seen: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_email: string;
          session_id: string;
          client_id: string;
          last_seen?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_email?: string;
          session_id?: string;
          client_id?: string;
          last_seen?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_viewers: {
        Args: { p_session_id: string };
        Returns: number;
      };
      leave_session: {
        Args: { p_session_id: string; p_user_id: string };
        Returns: undefined;
      };
      compute_session_analytics: {
        Args: { p_session_id: string };
        Returns: undefined;
      };
      get_server_time: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// Helper Types (for convenience)
// ============================================================================

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type ViewerSession = Database['public']['Tables']['viewer_sessions']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type Reaction = Database['public']['Tables']['reactions']['Row'];
export type SessionAnalytics = Database['public']['Tables']['session_analytics']['Row'];
export type ActiveSession = Database['public']['Tables']['active_sessions']['Row'];
