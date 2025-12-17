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
          amount: number
          id: string
          method: string | null
          organization_id: string | null
          payment_date: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          id?: string
          method?: string | null
          organization_id?: string | null
          payment_date?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          id?: string
          method?: string | null
          organization_id?: string | null
          payment_date?: string | null
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
      cash_closures: {
        Row: {
          cash_withdrawals: number | null
          closed_at: string | null
          declared_card: number | null
          declared_cash: number | null
          declared_qr: number | null
          difference: number | null
          id: string
          notes: string | null
          organization_id: string
          system_card: number | null
          system_cash: number | null
          system_qr: number | null
          user_id: string
        }
        Insert: {
          cash_withdrawals?: number | null
          closed_at?: string | null
          declared_card?: number | null
          declared_cash?: number | null
          declared_qr?: number | null
          difference?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          system_card?: number | null
          system_cash?: number | null
          system_qr?: number | null
          user_id: string
        }
        Update: {
          cash_withdrawals?: number | null
          closed_at?: string | null
          declared_card?: number | null
          declared_cash?: number | null
          declared_qr?: number | null
          difference?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          system_card?: number | null
          system_cash?: number | null
          system_qr?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_closures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_openings: {
        Row: {
          id: string
          initial_cash: number | null
          notes: string | null
          opened_at: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          id?: string
          initial_cash?: number | null
          notes?: string | null
          opened_at?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          id?: string
          initial_cash?: number | null
          notes?: string | null
          opened_at?: string | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_openings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          business_name: string
          client_type: string | null
          contact_name: string | null
          created_at: string | null
          discount_rate: number | null
          email: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          organization_id: string
          phone: string | null
          tax_id: string | null
        }
        Insert: {
          business_name: string
          client_type?: string | null
          contact_name?: string | null
          created_at?: string | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          tax_id?: string | null
        }
        Update: {
          business_name?: string
          client_type?: string | null
          contact_name?: string | null
          created_at?: string | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          tax_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_ledger: {
        Row: {
          amount_paid: number
          created_at: string | null
          description: string
          expense_id: string | null
          id: string
          organization_id: string
          payment_date: string
          payment_method: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          description: string
          expense_id?: string | null
          id?: string
          organization_id: string
          payment_date?: string
          payment_method?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          description?: string
          expense_id?: string | null
          id?: string
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_ledger_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "fixed_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          altitude_masl: number | null
          certifications: string[] | null
          country_code: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string
          producer_name: string | null
          region: string | null
          sub_region: string | null
          supplier_id: string | null
        }
        Insert: {
          altitude_masl?: number | null
          certifications?: string[] | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          producer_name?: string | null
          region?: string | null
          sub_region?: string | null
          supplier_id?: string | null
        }
        Update: {
          altitude_masl?: number | null
          certifications?: string[] | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          producer_name?: string | null
          region?: string | null
          sub_region?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      finished_inventory: {
        Row: {
          current_stock: number | null
          id: string
          last_updated: string | null
          organization_id: string
          product_id: string | null
        }
        Insert: {
          current_stock?: number | null
          id?: string
          last_updated?: string | null
          organization_id: string
          product_id?: string | null
        }
        Update: {
          current_stock?: number | null
          id?: string
          last_updated?: string | null
          organization_id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finished_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finished_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string | null
          frequency: Database["public"]["Enums"]["frequency_type"]
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      green_coffee_warehouse: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          milling_process_id: string | null
          name_ref: string | null
          organization_id: string
          quantity_kg: number
          screen_size: Database["public"]["Enums"]["screen_size_enum"]
          unit_cost_local: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          milling_process_id?: string | null
          name_ref?: string | null
          organization_id: string
          quantity_kg: number
          screen_size: Database["public"]["Enums"]["screen_size_enum"]
          unit_cost_local?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          milling_process_id?: string | null
          name_ref?: string | null
          organization_id?: string
          quantity_kg?: number
          screen_size?: Database["public"]["Enums"]["screen_size_enum"]
          unit_cost_local?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "green_coffee_warehouse_milling_process_id_fkey"
            columns: ["milling_process_id"]
            isOneToOne: false
            referencedRelation: "milling_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "green_coffee_warehouse_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_reports: {
        Row: {
          analysis_date: string | null
          base: number | null
          batch_id: string | null
          created_at: string | null
          cupping_score: number | null
          defects: number | null
          density: number | null
          green_quantity: number
          humidity_percentage: number | null
          id: string
          mesh_14: number | null
          mesh_16: number | null
          mesh_18: number | null
          organization_id: string
          sample_total_grams: number
          sensory_notes: string | null
          yield_factor: number | null
        }
        Insert: {
          analysis_date?: string | null
          base?: number | null
          batch_id?: string | null
          created_at?: string | null
          cupping_score?: number | null
          defects?: number | null
          density?: number | null
          green_quantity: number
          humidity_percentage?: number | null
          id?: string
          mesh_14?: number | null
          mesh_16?: number | null
          mesh_18?: number | null
          organization_id: string
          sample_total_grams: number
          sensory_notes?: string | null
          yield_factor?: number | null
        }
        Update: {
          analysis_date?: string | null
          base?: number | null
          batch_id?: string | null
          created_at?: string | null
          cupping_score?: number | null
          defects?: number | null
          density?: number | null
          green_quantity?: number
          humidity_percentage?: number | null
          id?: string
          mesh_14?: number | null
          mesh_16?: number | null
          mesh_18?: number | null
          organization_id?: string
          sample_total_grams?: number
          sensory_notes?: string | null
          yield_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_reports_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "raw_inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          brand: string | null
          bridge_ip: string | null
          capacity_kg: number | null
          connection_type: string | null
          created_at: string | null
          driver_config: Json | null
          id: string
          is_active: boolean | null
          model: string | null
          name: string
          organization_id: string
          sensor_config: Json | null
        }
        Insert: {
          brand?: string | null
          bridge_ip?: string | null
          capacity_kg?: number | null
          connection_type?: string | null
          created_at?: string | null
          driver_config?: Json | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          name: string
          organization_id: string
          sensor_config?: Json | null
        }
        Update: {
          brand?: string | null
          bridge_ip?: string | null
          capacity_kg?: number | null
          connection_type?: string | null
          created_at?: string | null
          driver_config?: Json | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          name?: string
          organization_id?: string
          sensor_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      milling_inputs: {
        Row: {
          id: string
          milling_process_id: string | null
          organization_id: string
          raw_inventory_id: string | null
          weight_used_kg: number
        }
        Insert: {
          id?: string
          milling_process_id?: string | null
          organization_id: string
          raw_inventory_id?: string | null
          weight_used_kg: number
        }
        Update: {
          id?: string
          milling_process_id?: string | null
          organization_id?: string
          raw_inventory_id?: string | null
          weight_used_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "milling_inputs_milling_process_id_fkey"
            columns: ["milling_process_id"]
            isOneToOne: false
            referencedRelation: "milling_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milling_inputs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milling_inputs_raw_inventory_id_fkey"
            columns: ["raw_inventory_id"]
            isOneToOne: false
            referencedRelation: "raw_inventory_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      milling_processes: {
        Row: {
          created_by: string | null
          id: string
          observations: string | null
          organization_id: string
          process_date: string | null
          service_cost: number | null
          service_provider: string | null
        }
        Insert: {
          created_by?: string | null
          id?: string
          observations?: string | null
          organization_id: string
          process_date?: string | null
          service_cost?: number | null
          service_provider?: string | null
        }
        Update: {
          created_by?: string | null
          id?: string
          observations?: string | null
          organization_id?: string
          process_date?: string | null
          service_cost?: number | null
          service_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milling_processes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milling_processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string | null
          currency_symbol: string | null
          id: string
          logo_url: string | null
          name: string
          next_payment_date: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          plan_type: string | null
          setup_completed: boolean | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          tax_id: string | null
          trial_ends_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          currency_symbol?: string | null
          id?: string
          logo_url?: string | null
          name: string
          next_payment_date?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          plan_type?: string | null
          setup_completed?: boolean | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          tax_id?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          currency_symbol?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          next_payment_date?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          plan_type?: string | null
          setup_completed?: boolean | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          tax_id?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      packaging_logs: {
        Row: {
          created_at: string | null
          id: string
          operator_id: string | null
          organization_id: string
          packaging_date: string | null
          product_id: string | null
          roast_batch_id: string | null
          units_created: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          operator_id?: string | null
          organization_id: string
          packaging_date?: string | null
          product_id?: string | null
          roast_batch_id?: string | null
          units_created: number
        }
        Update: {
          created_at?: string | null
          id?: string
          operator_id?: string | null
          organization_id?: string
          packaging_date?: string | null
          product_id?: string | null
          roast_batch_id?: string | null
          units_created?: number
        }
        Relationships: [
          {
            foreignKeyName: "packaging_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_logs_roast_batch_id_fkey"
            columns: ["roast_batch_id"]
            isOneToOne: false
            referencedRelation: "roast_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      product_promotions: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          end_date: string
          id: string
          is_active: boolean | null
          is_courtesy: boolean | null
          name: string
          organization_id: string
          product_id: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          end_date: string
          id?: string
          is_active?: boolean | null
          is_courtesy?: boolean | null
          name: string
          organization_id: string
          product_id?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_courtesy?: boolean | null
          name?: string
          organization_id?: string
          product_id?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_promotions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipes: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          product_id: string | null
          quantity: number
          supply_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          product_id?: string | null
          quantity: number
          supply_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          product_id?: string | null
          quantity?: number
          supply_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "supplies_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          currency_sale: string | null
          id: string
          is_active: boolean | null
          is_roasted: boolean | null
          name: string
          organization_id: string
          package_weight_grams: number | null
          sale_price: number | null
          sku: string | null
          source_green_inventory_id: string | null
        }
        Insert: {
          category?: string | null
          currency_sale?: string | null
          id?: string
          is_active?: boolean | null
          is_roasted?: boolean | null
          name: string
          organization_id: string
          package_weight_grams?: number | null
          sale_price?: number | null
          sku?: string | null
          source_green_inventory_id?: string | null
        }
        Update: {
          category?: string | null
          currency_sale?: string | null
          id?: string
          is_active?: boolean | null
          is_roasted?: boolean | null
          name?: string
          organization_id?: string
          package_weight_grams?: number | null
          sale_price?: number | null
          sku?: string | null
          source_green_inventory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_source_green_inventory_id_fkey"
            columns: ["source_green_inventory_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_warehouse"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          role?: string | null
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
      raw_inventory_batches: {
        Row: {
          code_ref: string | null
          created_at: string | null
          currency_original: string | null
          current_quantity: number
          current_state: Database["public"]["Enums"]["coffee_state_enum"]
          farm_id: string | null
          humidity_percentage: number | null
          id: string
          initial_quantity: number
          observations: string | null
          organization_id: string
          process: string | null
          purchase_date: string | null
          total_cost_local: number | null
          unit_of_measure: string | null
          variety: string | null
        }
        Insert: {
          code_ref?: string | null
          created_at?: string | null
          currency_original?: string | null
          current_quantity: number
          current_state: Database["public"]["Enums"]["coffee_state_enum"]
          farm_id?: string | null
          humidity_percentage?: number | null
          id?: string
          initial_quantity: number
          observations?: string | null
          organization_id: string
          process?: string | null
          purchase_date?: string | null
          total_cost_local?: number | null
          unit_of_measure?: string | null
          variety?: string | null
        }
        Update: {
          code_ref?: string | null
          created_at?: string | null
          currency_original?: string | null
          current_quantity?: number
          current_state?: Database["public"]["Enums"]["coffee_state_enum"]
          farm_id?: string | null
          humidity_percentage?: number | null
          id?: string
          initial_quantity?: number
          observations?: string | null
          organization_id?: string
          process?: string | null
          purchase_date?: string | null
          total_cost_local?: number | null
          unit_of_measure?: string | null
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_inventory_batches_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_inventory_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      roast_batch_inputs: {
        Row: {
          green_inventory_id: string | null
          id: string
          organization_id: string
          quantity_used_kg: number
          roast_batch_id: string | null
        }
        Insert: {
          green_inventory_id?: string | null
          id?: string
          organization_id: string
          quantity_used_kg: number
          roast_batch_id?: string | null
        }
        Update: {
          green_inventory_id?: string | null
          id?: string
          organization_id?: string
          quantity_used_kg?: number
          roast_batch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roast_batch_inputs_green_inventory_id_fkey"
            columns: ["green_inventory_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_warehouse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roast_batch_inputs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roast_batch_inputs_roast_batch_id_fkey"
            columns: ["roast_batch_id"]
            isOneToOne: false
            referencedRelation: "roast_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      roast_batches: {
        Row: {
          ambient_temp: number | null
          created_at: string | null
          drop_temp: number | null
          green_weight_input: number | null
          id: string
          initial_bean_humidity: number | null
          initial_bean_temp: number | null
          machine_id: string | null
          operator_name: string | null
          organization_id: string
          relative_humidity: number | null
          roast_date: string | null
          roast_log_data: Json | null
          roasted_weight_output: number | null
          total_time_seconds: number | null
        }
        Insert: {
          ambient_temp?: number | null
          created_at?: string | null
          drop_temp?: number | null
          green_weight_input?: number | null
          id?: string
          initial_bean_humidity?: number | null
          initial_bean_temp?: number | null
          machine_id?: string | null
          operator_name?: string | null
          organization_id: string
          relative_humidity?: number | null
          roast_date?: string | null
          roast_log_data?: Json | null
          roasted_weight_output?: number | null
          total_time_seconds?: number | null
        }
        Update: {
          ambient_temp?: number | null
          created_at?: string | null
          drop_temp?: number | null
          green_weight_input?: number | null
          id?: string
          initial_bean_humidity?: number | null
          initial_bean_temp?: number | null
          machine_id?: string | null
          operator_name?: string | null
          organization_id?: string
          relative_humidity?: number | null
          roast_date?: string | null
          roast_log_data?: Json | null
          roasted_weight_output?: number | null
          total_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roast_batches_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roast_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          discount_amount: number | null
          discount_reason: string | null
          green_inventory_id: string | null
          id: string
          is_courtesy: boolean | null
          organization_id: string
          product_id: string | null
          quantity: number
          sales_order_id: string | null
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          discount_amount?: number | null
          discount_reason?: string | null
          green_inventory_id?: string | null
          id?: string
          is_courtesy?: boolean | null
          organization_id: string
          product_id?: string | null
          quantity: number
          sales_order_id?: string | null
          subtotal?: number | null
          unit_price: number
        }
        Update: {
          discount_amount?: number | null
          discount_reason?: string | null
          green_inventory_id?: string | null
          id?: string
          is_courtesy?: boolean | null
          organization_id?: string
          product_id?: string | null
          quantity?: number
          sales_order_id?: string | null
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_green_inventory_id_fkey"
            columns: ["green_inventory_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_warehouse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          client_id: string | null
          currency_code: string | null
          id: string
          invoice_number: string | null
          order_date: string | null
          order_type: string | null
          organization_id: string
          payment_method: string | null
          seller_id: string | null
          status: string | null
          total_amount: number
        }
        Insert: {
          client_id?: string | null
          currency_code?: string | null
          id?: string
          invoice_number?: string | null
          order_date?: string | null
          order_type?: string | null
          organization_id: string
          payment_method?: string | null
          seller_id?: string | null
          status?: string | null
          total_amount?: number
        }
        Update: {
          client_id?: string | null
          currency_code?: string | null
          id?: string
          invoice_number?: string | null
          order_date?: string | null
          order_type?: string | null
          organization_id?: string
          payment_method?: string | null
          seller_id?: string | null
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string
          tax_id: string | null
          type: Database["public"]["Enums"]["supplier_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          tax_id?: string | null
          type: Database["public"]["Enums"]["supplier_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          tax_id?: string | null
          type?: Database["public"]["Enums"]["supplier_type"]
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplies_inventory: {
        Row: {
          current_stock: number | null
          id: string
          low_stock_threshold: number | null
          name: string
          organization_id: string
          unit_cost: number | null
          unit_measure: string
          updated_at: string | null
        }
        Insert: {
          current_stock?: number | null
          id?: string
          low_stock_threshold?: number | null
          name: string
          organization_id: string
          unit_cost?: number | null
          unit_measure: string
          updated_at?: string | null
        }
        Update: {
          current_stock?: number | null
          id?: string
          low_stock_threshold?: number | null
          name?: string
          organization_id?: string
          unit_cost?: number | null
          unit_measure?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplies_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      recent_activity_view: {
        Row: {
          activity_date: string | null
          activity_type: string | null
          description: string | null
          id: string | null
          organization_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_cash_status: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: Json
      }
      get_my_org_id: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role_enum"]
      }
      get_pending_cash_summary: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: Json
      }
      is_super_admin: { Args: never; Returns: boolean }
      registrar_tostaduria: { Args: { nombre_empresa: string }; Returns: Json }
      registrar_venta_transaccion: {
        Args: {
          p_client_id: string
          p_items: Json
          p_order_type: string
          p_org_id: string
          p_payment_method: string
          p_seller_id: string
          p_status?: string
          p_total: number
        }
        Returns: Json
      }
    }
    Enums: {
      app_role_enum:
        | "administrador"
        | "laboratorio"
        | "operador"
        | "tostador"
        | "vendedor"
        | "viewer"
      coffee_state_enum:
        | "cereza"
        | "pergamino_humedo"
        | "pergamino_seco"
        | "oro_verde"
        | "inferior"
      expense_category:
        | "alquiler"
        | "nomina"
        | "servicios"
        | "insumos_cafeteria"
        | "mantenimiento"
        | "marketing"
        | "impuestos"
        | "otros"
      frequency_type: "mensual" | "anual" | "quincenal" | "unico"
      recipe_condition: "always" | "takeaway" | "dine_in"
      screen_size_enum:
        | "malla_18"
        | "malla_16"
        | "malla_14"
        | "caracol"
        | "base_pasilla"
        | "cascarilla"
        | "sin_clasificar"
      subscription_plan: "free_trial" | "barista" | "tostador" | "enterprise"
      subscription_status: "active" | "past_due" | "canceled" | "trialing"
      supplier_type: "productor" | "cooperativa" | "importador"
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
      app_role_enum: [
        "administrador",
        "laboratorio",
        "operador",
        "tostador",
        "vendedor",
        "viewer",
      ],
      coffee_state_enum: [
        "cereza",
        "pergamino_humedo",
        "pergamino_seco",
        "oro_verde",
        "inferior",
      ],
      expense_category: [
        "alquiler",
        "nomina",
        "servicios",
        "insumos_cafeteria",
        "mantenimiento",
        "marketing",
        "impuestos",
        "otros",
      ],
      frequency_type: ["mensual", "anual", "quincenal", "unico"],
      recipe_condition: ["always", "takeaway", "dine_in"],
      screen_size_enum: [
        "malla_18",
        "malla_16",
        "malla_14",
        "caracol",
        "base_pasilla",
        "cascarilla",
        "sin_clasificar",
      ],
      subscription_plan: ["free_trial", "barista", "tostador", "enterprise"],
      subscription_status: ["active", "past_due", "canceled", "trialing"],
      supplier_type: ["productor", "cooperativa", "importador"],
    },
  },
} as const
