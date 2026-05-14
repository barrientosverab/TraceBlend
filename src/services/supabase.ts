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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      billing_history: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          period_end: string | null
          period_start: string | null
          receipt_url: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          organization_id: string
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          period_end?: string | null
          period_start?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          period_end?: string | null
          period_start?: string | null
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean
          is_main: boolean
          name: string
          organization_id: string
          phone: string | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_main?: boolean
          name: string
          organization_id: string
          phone?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_main?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_sessions: {
        Row: {
          branch_id: string
          closed_at: string | null
          closing_card: number
          closing_cash: number
          closing_qr: number
          created_at: string
          id: string
          note: string | null
          opening: number
          profile_id: string
          status: Database["public"]["Enums"]["session_status"]
          system_card: number
          system_cash: number
          system_qr: number
        }
        Insert: {
          branch_id: string
          closed_at?: string | null
          closing_card?: number
          closing_cash?: number
          closing_qr?: number
          created_at?: string
          id?: string
          note?: string | null
          opening?: number
          profile_id: string
          status?: Database["public"]["Enums"]["session_status"]
          system_card?: number
          system_cash?: number
          system_qr?: number
        }
        Update: {
          branch_id?: string
          closed_at?: string | null
          closing_card?: number
          closing_cash?: number
          closing_qr?: number
          created_at?: string
          id?: string
          note?: string | null
          opening?: number
          profile_id?: string
          status?: Database["public"]["Enums"]["session_status"]
          system_card?: number
          system_cash?: number
          system_qr?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_org_links: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_org_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_org_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          country_code: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          nit: string | null
          phone: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          nit?: string | null
          phone?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          nit?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string
          category_id: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          organization_id: string
          profile_id: string
          receipt_url: string | null
        }
        Insert: {
          amount?: number
          branch_id: string
          category_id: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          organization_id: string
          profile_id: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string
          category_id?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          organization_id?: string
          profile_id?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          next_billing_at: string | null
          nit: string
          phone: string | null
          setup_completed: boolean
          status: Database["public"]["Enums"]["org_status"]
          subscription_plan_id: string
          trial_ends_at: string | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          next_billing_at?: string | null
          nit: string
          phone?: string | null
          setup_completed?: boolean
          status?: Database["public"]["Enums"]["org_status"]
          subscription_plan_id: string
          trial_ends_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          next_billing_at?: string | null
          nit?: string
          phone?: string | null
          setup_completed?: boolean
          status?: Database["public"]["Enums"]["org_status"]
          subscription_plan_id?: string
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_used: number
          supply_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_used?: number
          supply_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_used?: number
          supply_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mv_product_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          sale_price: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          sale_price?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          sale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          sale_id: string
          subtotal?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mv_product_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method_type"]
          sale_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          sale_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method_type"]
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          branch_id: string
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          organization_id: string
          profile_id: string
          sale_status: Database["public"]["Enums"]["status_sale"]
          total: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          profile_id: string
          sale_status?: Database["public"]["Enums"]["status_sale"]
          total?: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          profile_id?: string
          sale_status?: Database["public"]["Enums"]["status_sale"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          max_branches: number | null
          max_users: number | null
          name: string
          price_monthly: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_branches?: number | null
          max_users?: number | null
          name: string
          price_monthly?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_branches?: number | null
          max_users?: number | null
          name?: string
          price_monthly?: number
        }
        Relationships: []
      }
      supplies: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          unit: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          unit?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_purchases: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          organization_id: string
          profile_id: string
          purchase_date: string
          quantity: number
          supplier_name: string | null
          supply_id: string
          total: number | null
          unit_cost: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          organization_id: string
          profile_id: string
          purchase_date?: string
          quantity?: number
          supplier_name?: string | null
          supply_id: string
          total?: number | null
          unit_cost?: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          profile_id?: string
          purchase_date?: string
          quantity?: number
          supplier_name?: string | null
          supply_id?: string
          total?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supply_purchases_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_purchases_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_purchases_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_stock: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          min_quantity: number
          quantity: number
          supply_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          min_quantity?: number
          quantity?: number
          supply_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          min_quantity?: number
          quantity?: number
          supply_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_stock_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_product_costs: {
        Row: {
          id: string | null
          margin: number | null
          margin_pct: number | null
          name: string | null
          organization_id: string | null
          sale_price: number | null
          unit_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_break_even: {
        Row: {
          margen_promedio: number | null
          meta_diaria_monto: number | null
          organization_id: string | null
          periodo: string | null
          punto_equilibrio_monto: number | null
          punto_equilibrio_unidades: number | null
          total_gastos_fijos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_estado_resultados: {
        Row: {
          costo_ventas: number | null
          organization_id: string | null
          periodo: string | null
          total_gastos: number | null
          total_ventas: number | null
          utilidad_bruta: number | null
          utilidad_neta: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      close_register_session: {
        Args: {
          p_closing_card: number
          p_closing_cash: number
          p_closing_qr: number
          p_note?: string
          p_profile_id: string
          p_session_id: string
        }
        Returns: Json
      }
      comprobar_organizacion: { Args: { org_id: string }; Returns: boolean }
      register_purchase: {
        Args: {
          p_branch_id: string
          p_profile_id: string
          p_purchase_date: string
          p_quantity: number
          p_supplier_name: string
          p_supply_id: string
          p_unit_cost: number
        }
        Returns: string
      }
      register_sale:
        | {
            Args: {
              p_branch_id: string
              p_customer_id: string
              p_items: Json
              p_notes: string
              p_payments: Json
              p_profile_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_branch_id: string
              p_customer_id: string
              p_items: Json
              p_notes: string
              p_payments: Json
              p_profile_id: string
              p_sale_status?: Database["public"]["Enums"]["status_sale"]
            }
            Returns: string
          }
      setup_organization: {
        Args: {
          branch_name: string
          org_address: string
          org_name: string
          org_nit: string
          plan_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      org_status: "trial" | "active" | "past_due" | "canceled"
      payment_method_type: "transfer" | "cash" | "card" | "qr"
      session_status: "open" | "closed"
      status_sale: "pendiente" | "completado"
      user_role: "admin" | "cashier" | "viewer"
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
      org_status: ["trial", "active", "past_due", "canceled"],
      payment_method_type: ["transfer", "cash", "card", "qr"],
      session_status: ["open", "closed"],
      status_sale: ["pendiente", "completado"],
      user_role: ["admin", "cashier", "viewer"],
    },
  },
} as const
