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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          description: string
          field: string | null
          id: string
          new_value: string | null
          previous_value: string | null
          reference_id: string | null
          shipment_id: string | null
          timestamp: string
          type: string
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          description: string
          field?: string | null
          id?: string
          new_value?: string | null
          previous_value?: string | null
          reference_id?: string | null
          shipment_id?: string | null
          timestamp?: string
          type: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          description?: string
          field?: string | null
          id?: string
          new_value?: string | null
          previous_value?: string | null
          reference_id?: string | null
          shipment_id?: string | null
          timestamp?: string
          type?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      cost_line_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          equipment_type: string | null
          id: string
          quantity: number
          shipment_id: string
          unit_cost: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          equipment_type?: string | null
          id?: string
          quantity?: number
          shipment_id: string
          unit_cost?: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          equipment_type?: string | null
          id?: string
          quantity?: number
          shipment_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "cost_line_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          reference_id: string
          shipment_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          reference_id: string
          shipment_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          reference_id?: string
          shipment_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          id: string
          name: string
          ref_prefix: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          name: string
          ref_prefix?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          ref_prefix?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          client_address: string | null
          client_name: string
          created_at: string
          created_by: string | null
          equipment: Json
          exw_amount: number | null
          exw_qty: number | null
          id: string
          issued_at: string | null
          mode_of_transport: string
          ocean_freight_amount: number | null
          pod: string
          pol: string
          remarks: string | null
          shipment_id: string
          status: string
          valid_until: string | null
        }
        Insert: {
          client_address?: string | null
          client_name: string
          created_at?: string
          created_by?: string | null
          equipment?: Json
          exw_amount?: number | null
          exw_qty?: number | null
          id?: string
          issued_at?: string | null
          mode_of_transport?: string
          ocean_freight_amount?: number | null
          pod: string
          pol: string
          remarks?: string | null
          shipment_id: string
          status?: string
          valid_until?: string | null
        }
        Update: {
          client_address?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          equipment?: Json
          exw_amount?: number | null
          exw_qty?: number | null
          id?: string
          issued_at?: string | null
          mode_of_transport?: string
          ocean_freight_amount?: number | null
          pod?: string
          pol?: string
          remarks?: string | null
          shipment_id?: string
          status?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          amount: number | null
          description: string
          equipment_type: string | null
          id: string
          quantity: number
          quotation_id: string
          unit_cost: number
        }
        Insert: {
          amount?: number | null
          description: string
          equipment_type?: string | null
          id?: string
          quantity?: number
          quotation_id: string
          unit_cost?: number
        }
        Update: {
          amount?: number | null
          description?: string
          equipment_type?: string | null
          id?: string
          quantity?: number
          quotation_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_commission_rules: {
        Row: {
          config: Json
          created_at: string
          formula_type: string
          id: string
          salesperson: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          formula_type?: string
          id?: string
          salesperson: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          formula_type?: string
          id?: string
          salesperson?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shipments: {
        Row: {
          agent: string | null
          agent_invoice_amount: number | null
          agent_invoice_date: string | null
          agent_invoice_file_name: string | null
          agent_invoice_uploaded: boolean | null
          agent_paid: boolean | null
          agent_paid_date: string | null
          arrival_notice_sent: boolean | null
          bl_draft_approval: boolean | null
          bl_type: string | null
          client_name: string | null
          completed_at: string | null
          cost_per_unit: number | null
          created_at: string
          created_by: string | null
          currency: string
          do_issued: boolean | null
          do_release_date: string | null
          equipment: Json
          eta: string | null
          etd: string | null
          final_bl_issued: boolean | null
          gate_in_terminal: string | null
          id: string
          incoterm: string
          is_lost: boolean | null
          lost_at: string | null
          lost_reason: string | null
          mode_of_transport: string
          nss_booking_reference: string | null
          nss_invoice_number: string | null
          ops_owner: string | null
          payment_collected: boolean | null
          payment_collected_date: string | null
          payment_terms: string
          port_of_discharge: string
          port_of_loading: string
          pricing_owner: string | null
          profit_per_unit: number | null
          reference_id: string
          salesperson: string
          selling_price_per_unit: number | null
          stage: string
          terminal_cutoff: string | null
          total_cost: number | null
          total_invoice_amount: number | null
          total_profit: number | null
          total_selling_price: number | null
          updated_at: string
        }
        Insert: {
          agent?: string | null
          agent_invoice_amount?: number | null
          agent_invoice_date?: string | null
          agent_invoice_file_name?: string | null
          agent_invoice_uploaded?: boolean | null
          agent_paid?: boolean | null
          agent_paid_date?: string | null
          arrival_notice_sent?: boolean | null
          bl_draft_approval?: boolean | null
          bl_type?: string | null
          client_name?: string | null
          completed_at?: string | null
          cost_per_unit?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          do_issued?: boolean | null
          do_release_date?: string | null
          equipment?: Json
          eta?: string | null
          etd?: string | null
          final_bl_issued?: boolean | null
          gate_in_terminal?: string | null
          id?: string
          incoterm?: string
          is_lost?: boolean | null
          lost_at?: string | null
          lost_reason?: string | null
          mode_of_transport?: string
          nss_booking_reference?: string | null
          nss_invoice_number?: string | null
          ops_owner?: string | null
          payment_collected?: boolean | null
          payment_collected_date?: string | null
          payment_terms?: string
          port_of_discharge: string
          port_of_loading: string
          pricing_owner?: string | null
          profit_per_unit?: number | null
          reference_id: string
          salesperson: string
          selling_price_per_unit?: number | null
          stage?: string
          terminal_cutoff?: string | null
          total_cost?: number | null
          total_invoice_amount?: number | null
          total_profit?: number | null
          total_selling_price?: number | null
          updated_at?: string
        }
        Update: {
          agent?: string | null
          agent_invoice_amount?: number | null
          agent_invoice_date?: string | null
          agent_invoice_file_name?: string | null
          agent_invoice_uploaded?: boolean | null
          agent_paid?: boolean | null
          agent_paid_date?: string | null
          arrival_notice_sent?: boolean | null
          bl_draft_approval?: boolean | null
          bl_type?: string | null
          client_name?: string | null
          completed_at?: string | null
          cost_per_unit?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          do_issued?: boolean | null
          do_release_date?: string | null
          equipment?: Json
          eta?: string | null
          etd?: string | null
          final_bl_issued?: boolean | null
          gate_in_terminal?: string | null
          id?: string
          incoterm?: string
          is_lost?: boolean | null
          lost_at?: string | null
          lost_reason?: string | null
          mode_of_transport?: string
          nss_booking_reference?: string | null
          nss_invoice_number?: string | null
          ops_owner?: string | null
          payment_collected?: boolean | null
          payment_collected_date?: string | null
          payment_terms?: string
          port_of_discharge?: string
          port_of_loading?: string
          pricing_owner?: string | null
          profit_per_unit?: number | null
          reference_id?: string
          salesperson?: string
          selling_price_per_unit?: number | null
          stage?: string
          terminal_cutoff?: string | null
          total_cost?: number | null
          total_invoice_amount?: number | null
          total_profit?: number | null
          total_selling_price?: number | null
          updated_at?: string
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
      generate_reference_id: {
        Args: { p_salesperson: string }
        Returns: string
      }
      get_user_ref_prefix: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_sales_only: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "sales"
        | "pricing"
        | "ops"
        | "collections"
        | "finance"
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
      app_role: ["admin", "sales", "pricing", "ops", "collections", "finance"],
    },
  },
} as const
