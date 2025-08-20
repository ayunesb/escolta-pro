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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          booking_id: string
          check_in_ts: string | null
          check_out_ts: string | null
          gps_trail: Json | null
          guard_id: string
          id: string
          in_progress_ts: string | null
          on_site_ts: string | null
          status: string
        }
        Insert: {
          booking_id: string
          check_in_ts?: string | null
          check_out_ts?: string | null
          gps_trail?: Json | null
          guard_id: string
          id?: string
          in_progress_ts?: string | null
          on_site_ts?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          check_in_ts?: string | null
          check_out_ts?: string | null
          gps_trail?: Json | null
          guard_id?: string
          id?: string
          in_progress_ts?: string | null
          on_site_ts?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          actor_id: string | null
          diff: Json | null
          entity: string | null
          entity_id: string | null
          id: number
          ts: string | null
        }
        Insert: {
          action?: string | null
          actor_id?: string | null
          diff?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: number
          ts?: string | null
        }
        Update: {
          action?: string | null
          actor_id?: string | null
          diff?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: number
          ts?: string | null
        }
        Relationships: []
      }
      booking_items: {
        Row: {
          booking_id: string
          id: string
          item_type: string
          min_hours: number
          qty: number
          rate_hour: number
        }
        Insert: {
          booking_id: string
          id?: string
          item_type: string
          min_hours: number
          qty?: number
          rate_hour: number
        }
        Update: {
          booking_id?: string
          id?: string
          item_type?: string
          min_hours?: number
          qty?: number
          rate_hour?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          armed_required: boolean | null
          assigned_company_id: string | null
          assigned_user_id: string | null
          city: string | null
          client_id: string
          created_at: string | null
          currency: string | null
          dest_lat: number | null
          dest_lng: number | null
          dress_code: string | null
          end_ts: string | null
          id: string
          min_hours: number | null
          notes: string | null
          origin_lat: number | null
          origin_lng: number | null
          pickup_address: string | null
          protectees: number | null
          protectors: number | null
          quote_amount: number | null
          service_fee_mxn_cents: number | null
          start_ts: string | null
          status: string
          subtotal_mxn_cents: number | null
          surge_mult: number | null
          tier: string
          total_mxn_cents: number | null
          updated_at: string | null
          vehicle_required: boolean | null
          vehicle_type: string | null
          vehicles: number | null
        }
        Insert: {
          armed_required?: boolean | null
          assigned_company_id?: string | null
          assigned_user_id?: string | null
          city?: string | null
          client_id: string
          created_at?: string | null
          currency?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          dress_code?: string | null
          end_ts?: string | null
          id?: string
          min_hours?: number | null
          notes?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          pickup_address?: string | null
          protectees?: number | null
          protectors?: number | null
          quote_amount?: number | null
          service_fee_mxn_cents?: number | null
          start_ts?: string | null
          status?: string
          subtotal_mxn_cents?: number | null
          surge_mult?: number | null
          tier?: string
          total_mxn_cents?: number | null
          updated_at?: string | null
          vehicle_required?: boolean | null
          vehicle_type?: string | null
          vehicles?: number | null
        }
        Update: {
          armed_required?: boolean | null
          assigned_company_id?: string | null
          assigned_user_id?: string | null
          city?: string | null
          client_id?: string
          created_at?: string | null
          currency?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          dress_code?: string | null
          end_ts?: string | null
          id?: string
          min_hours?: number | null
          notes?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          pickup_address?: string | null
          protectees?: number | null
          protectors?: number | null
          quote_amount?: number | null
          service_fee_mxn_cents?: number | null
          start_ts?: string | null
          status?: string
          subtotal_mxn_cents?: number | null
          surge_mult?: number | null
          tier?: string
          total_mxn_cents?: number | null
          updated_at?: string | null
          vehicle_required?: boolean | null
          vehicle_type?: string | null
          vehicles?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_company_id_fkey"
            columns: ["assigned_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cities: string[] | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          status: string | null
          stripe_account_id: string | null
          tax_id: string | null
        }
        Insert: {
          cities?: string[] | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          status?: string | null
          stripe_account_id?: string | null
          tax_id?: string | null
        }
        Update: {
          cities?: string[] | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          status?: string | null
          stripe_account_id?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          doc_type: string
          file_path: string
          id: string
          issued_on: string | null
          org_id: string | null
          owner_id: string
          owner_type: string
          status: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          doc_type: string
          file_path: string
          id?: string
          issued_on?: string | null
          org_id?: string | null
          owner_id: string
          owner_type: string
          status?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          doc_type?: string
          file_path?: string
          id?: string
          issued_on?: string | null
          org_id?: string | null
          owner_id?: string
          owner_type?: string
          status?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      guard_documents: {
        Row: {
          created_at: string | null
          doc_type: string | null
          expires_at: string | null
          guard_id: string | null
          id: string
          url: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          doc_type?: string | null
          expires_at?: string | null
          guard_id?: string | null
          id?: string
          url?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          doc_type?: string | null
          expires_at?: string | null
          guard_id?: string | null
          id?: string
          url?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guard_documents_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
        ]
      }
      guards: {
        Row: {
          active: boolean | null
          armed_hourly_surcharge_mxn_cents: number | null
          availability_status: string | null
          city: string | null
          company_id: string | null
          dress_codes: string[] | null
          home_lat: number | null
          home_lng: number | null
          hourly_rate: number | null
          hourly_rate_mxn_cents: number | null
          id: string
          org_id: string | null
          photo_url: string | null
          rating: number | null
          skills: Json
          status: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          armed_hourly_surcharge_mxn_cents?: number | null
          availability_status?: string | null
          city?: string | null
          company_id?: string | null
          dress_codes?: string[] | null
          home_lat?: number | null
          home_lng?: number | null
          hourly_rate?: number | null
          hourly_rate_mxn_cents?: number | null
          id: string
          org_id?: string | null
          photo_url?: string | null
          rating?: number | null
          skills?: Json
          status?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          armed_hourly_surcharge_mxn_cents?: number | null
          availability_status?: string | null
          city?: string | null
          company_id?: string | null
          dress_codes?: string[] | null
          home_lat?: number | null
          home_lng?: number | null
          hourly_rate?: number | null
          hourly_rate_mxn_cents?: number | null
          id?: string
          org_id?: string | null
          photo_url?: string | null
          rating?: number | null
          skills?: Json
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guards_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guards_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          booking_id: string
          created_at: string | null
          created_by: string
          id: string
          media: Json | null
          narrative: string | null
          severity: number | null
          type: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          created_by: string
          id?: string
          media?: Json | null
          narrative?: string | null
          severity?: number | null
          type?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          media?: Json | null
          narrative?: string | null
          severity?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          files: Json | null
          guard_id: string
          id: string
          issuer: string | null
          number: string | null
          status: string | null
          type: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          files?: Json | null
          guard_id: string
          id?: string
          issuer?: string | null
          number?: string | null
          status?: string | null
          type: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          files?: Json | null
          guard_id?: string
          id?: string
          issuer?: string | null
          number?: string | null
          status?: string | null
          type?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          media_url: string | null
          sender_id: string
          text: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          media_url?: string | null
          sender_id: string
          text?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          profile_id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_captured: number | null
          amount_preauth: number | null
          booking_id: string
          charge_id: string | null
          created_at: string | null
          id: string
          preauth_id: string | null
          provider: string
          status: string
        }
        Insert: {
          amount_captured?: number | null
          amount_preauth?: number | null
          booking_id: string
          charge_id?: string | null
          created_at?: string | null
          id?: string
          preauth_id?: string | null
          provider: string
          status: string
        }
        Update: {
          amount_captured?: number | null
          amount_preauth?: number | null
          booking_id?: string
          charge_id?: string | null
          created_at?: string | null
          id?: string
          preauth_id?: string | null
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          company_id: string | null
          guard_id: string
          id: string
          period_end: string | null
          period_start: string | null
          status: string
        }
        Insert: {
          amount: number
          company_id?: string | null
          guard_id: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
        }
        Update: {
          amount?: number
          company_id?: string | null
          guard_id?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          armed_multiplier: number
          base_rate_guard: number
          city: string
          id: string
          min_hours: number
          tier: string
          vehicle_rate_armored: number
          vehicle_rate_suv: number
        }
        Insert: {
          armed_multiplier?: number
          base_rate_guard: number
          city: string
          id?: string
          min_hours?: number
          tier: string
          vehicle_rate_armored: number
          vehicle_rate_suv: number
        }
        Update: {
          armed_multiplier?: number
          base_rate_guard?: number
          city?: string
          id?: string
          min_hours?: number
          tier?: string
          vehicle_rate_armored?: number
          vehicle_rate_suv?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          kyc_status: string | null
          last_name: string | null
          phone_e164: string | null
          photo_url: string | null
          role: string
          stripe_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          kyc_status?: string | null
          last_name?: string | null
          phone_e164?: string | null
          photo_url?: string | null
          role: string
          stripe_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          kyc_status?: string | null
          last_name?: string | null
          phone_e164?: string | null
          photo_url?: string | null
          role?: string
          stripe_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          booking_id: string
          created_at: string
          payload: Json
        }
        Insert: {
          booking_id: string
          created_at?: string
          payload: Json
        }
        Update: {
          booking_id?: string
          created_at?: string
          payload?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          active: boolean | null
          armored: boolean | null
          armored_hourly_surcharge_mxn_cents: number | null
          company_id: string | null
          docs: Json | null
          guard_id: string | null
          id: string
          org_id: string | null
          owned_by: string
          plates: string | null
          type: string | null
          vehicle_hourly_rate_mxn_cents: number | null
        }
        Insert: {
          active?: boolean | null
          armored?: boolean | null
          armored_hourly_surcharge_mxn_cents?: number | null
          company_id?: string | null
          docs?: Json | null
          guard_id?: string | null
          id?: string
          org_id?: string | null
          owned_by: string
          plates?: string | null
          type?: string | null
          vehicle_hourly_rate_mxn_cents?: number | null
        }
        Update: {
          active?: boolean | null
          armored?: boolean | null
          armored_hourly_surcharge_mxn_cents?: number | null
          company_id?: string | null
          docs?: Json | null
          guard_id?: string | null
          id?: string
          org_id?: string | null
          owned_by?: string
          plates?: string | null
          type?: string | null
          vehicle_hourly_rate_mxn_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_document_signed_url: {
        Args: { document_path: string; expires_in?: unknown }
        Returns: string
      }
      get_public_guard_by_id: {
        Args: { _id: string }
        Returns: {
          armed_hourly_surcharge_mxn_cents: number
          city: string
          dress_codes: string[]
          hourly_rate_mxn_cents: number
          id: string
          photo_url: string
          rating: number
        }[]
      }
      get_public_guards: {
        Args: Record<PropertyKey, never>
        Returns: {
          armed_hourly_surcharge_mxn_cents: number
          city: string
          dress_codes: string[]
          hourly_rate_mxn_cents: number
          id: string
          photo_url: string
          rating: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_guard_assigned_to_booking: {
        Args: { _booking_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "freelancer" | "company_admin"
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
      app_role: ["client", "freelancer", "company_admin"],
    },
  },
} as const
