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
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_email: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      campaign_images: {
        Row: {
          campaign_id: string
          caption: string | null
          created_at: string | null
          id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          campaign_id: string
          caption?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          url: string
        }
        Update: {
          campaign_id?: string
          caption?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_images_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_updates: {
        Row: {
          campaign_id: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          title: string | null
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          title?: string | null
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          allow_anonymous: boolean | null
          allow_messages: boolean | null
          allow_recurring: boolean | null
          banner_phash: string | null
          banner_url: string | null
          category: string | null
          created_at: string | null
          current_amount_cents: number | null
          description: string | null
          donor_count: number | null
          end_date: string | null
          flagged: boolean | null
          flagged_duplicate: boolean | null
          flagged_reason: string | null
          goal_amount_cents: number
          id: string
          published_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          short_description: string | null
          show_top_donors: boolean
          slug: string
          status: string | null
          template: string | null
          thank_you_message: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_anonymous?: boolean | null
          allow_messages?: boolean | null
          allow_recurring?: boolean | null
          banner_phash?: string | null
          banner_url?: string | null
          category?: string | null
          created_at?: string | null
          current_amount_cents?: number | null
          description?: string | null
          donor_count?: number | null
          end_date?: string | null
          flagged?: boolean | null
          flagged_duplicate?: boolean | null
          flagged_reason?: string | null
          goal_amount_cents: number
          id?: string
          published_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          short_description?: string | null
          show_top_donors?: boolean
          slug: string
          status?: string | null
          template?: string | null
          thank_you_message?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_anonymous?: boolean | null
          allow_messages?: boolean | null
          allow_recurring?: boolean | null
          banner_phash?: string | null
          banner_url?: string | null
          category?: string | null
          created_at?: string | null
          current_amount_cents?: number | null
          description?: string | null
          donor_count?: number | null
          end_date?: string | null
          flagged?: boolean | null
          flagged_duplicate?: boolean | null
          flagged_reason?: string | null
          goal_amount_cents?: number
          id?: string
          published_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          short_description?: string | null
          show_top_donors?: boolean
          slug?: string
          status?: string | null
          template?: string | null
          thank_you_message?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "creator_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount_cents: number
          application_fee_cents: number
          campaign_id: string
          created_at: string | null
          creator_read_at: string | null
          disputed_at: string | null
          donor_covered_fees: boolean | null
          donor_email: string | null
          donor_message: string | null
          donor_name: string | null
          failure_reason: string | null
          id: string
          is_anonymous: boolean | null
          net_to_creator_cents: number | null
          payment_method: string | null
          receipt_sent_at: string | null
          refunded_at: string | null
          shown_in_top: boolean
          status: string | null
          stripe_charge_id: string | null
          stripe_fee_cents: number | null
          stripe_payment_intent_id: string
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          application_fee_cents: number
          campaign_id: string
          created_at?: string | null
          creator_read_at?: string | null
          disputed_at?: string | null
          donor_covered_fees?: boolean | null
          donor_email?: string | null
          donor_message?: string | null
          donor_name?: string | null
          failure_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          net_to_creator_cents?: number | null
          payment_method?: string | null
          receipt_sent_at?: string | null
          refunded_at?: string | null
          shown_in_top?: boolean
          status?: string | null
          stripe_charge_id?: string | null
          stripe_fee_cents?: number | null
          stripe_payment_intent_id: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          application_fee_cents?: number
          campaign_id?: string
          created_at?: string | null
          creator_read_at?: string | null
          disputed_at?: string | null
          donor_covered_fees?: boolean | null
          donor_email?: string | null
          donor_message?: string | null
          donor_name?: string | null
          failure_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          net_to_creator_cents?: number | null
          payment_method?: string | null
          receipt_sent_at?: string | null
          refunded_at?: string | null
          shown_in_top?: boolean
          status?: string | null
          stripe_charge_id?: string | null
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_access_tokens: {
        Row: {
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          ip: string | null
          token: string
          user_agent: string | null
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          ip?: string | null
          token?: string
          user_agent?: string | null
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          ip?: string | null
          token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      email_log: {
        Row: {
          campaign_id: string | null
          created_at: string
          error: string | null
          from_email: string
          id: string
          metadata: Json | null
          resend_id: string | null
          status: string
          subject: string
          template: string
          to_email: string
          to_name: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          from_email: string
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          status: string
          subject: string
          template: string
          to_email: string
          to_name?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          from_email?: string
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          status?: string
          subject?: string
          template?: string
          to_email?: string
          to_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "creator_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          campaign_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_reminder_log: {
        Row: {
          id: string
          sent_at: string
          stage: string
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          stage: string
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          stage?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_reminder_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "creator_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_reminder_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          campaign_id: string | null
          created_at: string
          donation_id: string | null
          href: string | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          campaign_id?: string | null
          created_at?: string
          donation_id?: string | null
          href?: string | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          campaign_id?: string | null
          created_at?: string
          donation_id?: string | null
          href?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "creator_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          campaign_count: number | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          funnel_first_donation_at: string | null
          funnel_first_draft_at: string | null
          funnel_first_published_at: string | null
          funnel_stripe_completed_at: string | null
          funnel_stripe_started_at: string | null
          id: string
          is_suspended: boolean | null
          organization_cnpj: string | null
          organization_logo_url: string | null
          organization_name: string | null
          phone: string | null
          phone_verified: boolean | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_details_submitted: boolean | null
          stripe_payouts_enabled: boolean | null
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          total_raised_cents: number | null
          trust_score: number | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          campaign_count?: number | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          funnel_first_donation_at?: string | null
          funnel_first_draft_at?: string | null
          funnel_first_published_at?: string | null
          funnel_stripe_completed_at?: string | null
          funnel_stripe_started_at?: string | null
          id: string
          is_suspended?: boolean | null
          organization_cnpj?: string | null
          organization_logo_url?: string | null
          organization_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_details_submitted?: boolean | null
          stripe_payouts_enabled?: boolean | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          total_raised_cents?: number | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          campaign_count?: number | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          funnel_first_donation_at?: string | null
          funnel_first_draft_at?: string | null
          funnel_first_published_at?: string | null
          funnel_stripe_completed_at?: string | null
          funnel_stripe_started_at?: string | null
          id?: string
          is_suspended?: boolean | null
          organization_cnpj?: string | null
          organization_logo_url?: string | null
          organization_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_details_submitted?: boolean | null
          stripe_payouts_enabled?: boolean | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          total_raised_cents?: number | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          created_at: string
          id: number
          key: string
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          campaign_id: string
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reporter_email: string | null
          reporter_ip: string | null
          reporter_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reporter_email?: string | null
          reporter_ip?: string | null
          reporter_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reporter_email?: string | null
          reporter_ip?: string | null
          reporter_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "creator_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number
          campaign_id: string
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          donor_email: string
          donor_message: string | null
          donor_name: string
          id: string
          interval: string
          is_anonymous: boolean
          status: string
          stripe_account_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          campaign_id: string
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          donor_email: string
          donor_message?: string | null
          donor_name: string
          id?: string
          interval?: string
          is_anonymous?: boolean
          status?: string
          stripe_account_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          campaign_id?: string
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          donor_email?: string
          donor_message?: string | null
          donor_name?: string
          id?: string
          interval?: string
          is_anonymous?: boolean
          status?: string
          stripe_account_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_signals: {
        Row: {
          created_at: string
          delta: number
          id: string
          metadata: Json | null
          reason: string
          signal: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          metadata?: Json | null
          reason: string
          signal: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json | null
          reason?: string
          signal?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "creator_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      update_email_log: {
        Row: {
          campaign_id: string
          donor_email: string
          id: number
          sent_on: string
        }
        Insert: {
          campaign_id: string
          donor_email: string
          id?: number
          sent_on?: string
        }
        Update: {
          campaign_id?: string
          donor_email?: string
          id?: number
          sent_on?: string
        }
        Relationships: []
      }
    }
    Views: {
      creator_mrr_daily: {
        Row: {
          active_count: number | null
          creator_id: string | null
          day: string | null
          mrr_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_public_profile: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          full_name: string | null
          id: string | null
          organization_logo_url: string | null
          organization_name: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          organization_logo_url?: string | null
          organization_name?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          organization_logo_url?: string | null
          organization_name?: string | null
        }
        Relationships: []
      }
      donations_public: {
        Row: {
          amount_cents: number | null
          campaign_id: string | null
          created_at: string | null
          display_name: string | null
          donor_message: string | null
          id: string | null
          net_to_creator_cents: number | null
          payment_method: string | null
        }
        Insert: {
          amount_cents?: number | null
          campaign_id?: string | null
          created_at?: string | null
          display_name?: never
          donor_message?: never
          id?: string | null
          net_to_creator_cents?: number | null
          payment_method?: string | null
        }
        Update: {
          amount_cents?: number | null
          campaign_id?: string | null
          created_at?: string | null
          display_name?: never
          donor_message?: never
          id?: string | null
          net_to_creator_cents?: number | null
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      purge_rate_limit_events: { Args: never; Returns: undefined }
      recalculate_trust_score: {
        Args: { target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

