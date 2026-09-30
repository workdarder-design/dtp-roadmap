export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "viewer";

export type AnnouncementStatus = "Draft" | "Published" | "Archived";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_modules: {
        Row: {
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      program_sprints: {
        Row: {
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      roadmap_items: {
        Row: {
          id: string;
          module: string;
          feature: string;
          priority: string;
          sprint: string;
          eta_staging: string | null;
          eta_production: string | null;
          business_status: string;
          dev_status: string;
          delivery_status: string;
          remarks: string;
          framework: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          module: string;
          feature: string;
          priority: string;
          sprint: string;
          eta_staging?: string | null;
          eta_production?: string | null;
          business_status?: string;
          dev_status?: string;
          delivery_status?: string;
          remarks?: string;
          framework?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module?: string;
          feature?: string;
          priority?: string;
          sprint?: string;
          eta_staging?: string | null;
          eta_production?: string | null;
          business_status?: string;
          dev_status?: string;
          delivery_status?: string;
          remarks?: string;
          framework?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consultations: {
        Row: {
          id: string;
          client_name: string;
          slug: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          slug: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_name?: string;
          slug?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      announcement_statuses: {
        Row: {
          sprint_key: string;
          status: AnnouncementStatus;
          updated_at: string;
        };
        Insert: {
          sprint_key: string;
          status: AnnouncementStatus;
          updated_at?: string;
        };
        Update: {
          sprint_key?: string;
          status?: AnnouncementStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: number;
          share_token: string;
          status_done_color: string | null;
          status_done_color_dark: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          share_token: string;
          status_done_color?: string | null;
          status_done_color_dark?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          share_token?: string;
          status_done_color?: string | null;
          status_done_color_dark?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      reset_roadmap_to_seed: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      admin_delete_user: {
        Args: { target_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
