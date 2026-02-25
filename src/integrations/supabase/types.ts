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
      addons: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          price: number
          product_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          price?: number
          product_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          display_name: string
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          company_id: string | null
          created_at: string
          display_name: string
          id: string
          is_primary: boolean
          password_hash: string
          username: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_primary?: boolean
          password_hash: string
          username: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_primary?: boolean
          password_hash?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          company_id: string | null
          created_at: string
          icon: string
          id: string
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          icon?: string
          id?: string
          name: string
          sort_order?: number
          type?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address: string
          address_number: string | null
          company_id: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          neighborhood_fee: number
          neighborhood_id: string | null
          neighborhood_name: string | null
          reference: string | null
        }
        Insert: {
          address: string
          address_number?: string | null
          company_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood_fee?: number
          neighborhood_id?: string | null
          neighborhood_name?: string | null
          reference?: string | null
        }
        Update: {
          address?: string
          address_number?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood_fee?: number
          neighborhood_id?: string | null
          neighborhood_name?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_impressao: {
        Row: {
          company_id: string | null
          criado_por: string | null
          criado_por_nome: string | null
          dados_impressao: string
          data_criacao: string
          data_impressao: string | null
          id: string
          order_id: string | null
          status: string
          tipo: string
        }
        Insert: {
          company_id?: string | null
          criado_por?: string | null
          criado_por_nome?: string | null
          dados_impressao: string
          data_criacao?: string
          data_impressao?: string | null
          id?: string
          order_id?: string | null
          status?: string
          tipo?: string
        }
        Update: {
          company_id?: string | null
          criado_por?: string | null
          criado_por_nome?: string | null
          dados_impressao?: string
          data_criacao?: string
          data_impressao?: string | null
          id?: string
          order_id?: string | null
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fila_impressao_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_impressao_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_impressao_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          company_id: string | null
          created_at: string
          fee: number
          id: string
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          fee?: number
          id?: string
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          fee?: number
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          address_number: string | null
          change_for: number | null
          company_id: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_fee: number
          id: string
          items: Json
          neighborhood: Json | null
          number: number
          observation: string | null
          payment_method: string | null
          reference: string | null
          status: string
          subtotal: number
          table_number: number | null
          table_reference: string | null
          total: number
          type: string
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          change_for?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_fee?: number
          id?: string
          items?: Json
          neighborhood?: Json | null
          number: number
          observation?: string | null
          payment_method?: string | null
          reference?: string | null
          status?: string
          subtotal?: number
          table_number?: number | null
          table_reference?: string | null
          total?: number
          type: string
        }
        Update: {
          address?: string | null
          address_number?: string | null
          change_for?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_fee?: number
          id?: string
          items?: Json
          neighborhood?: Json | null
          number?: number
          observation?: string | null
          payment_method?: string | null
          reference?: string | null
          status?: string
          subtotal?: number
          table_number?: number | null
          table_reference?: string | null
          total?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pizza_borders: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          price: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          price?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pizza_borders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pizza_sizes: {
        Row: {
          company_id: string | null
          created_at: string
          default_price: number
          id: string
          max_flavors: number
          name: string
          sort_order: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          default_price?: number
          id?: string
          max_flavors?: number
          name: string
          sort_order?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          default_price?: number
          id?: string
          max_flavors?: number
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "pizza_sizes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          product_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          product_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pizza_prices: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          pizza_size_id: string
          price: number
          product_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          pizza_size_id: string
          price?: number
          product_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          pizza_size_id?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_pizza_prices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_pizza_prices_pizza_size_id_fkey"
            columns: ["pizza_size_id"]
            isOneToOne: false
            referencedRelation: "pizza_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_pizza_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          category_id: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          category_id?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          id: string
          number: number
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          number: number
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_admin: {
        Args: { p_display_name: string; p_password: string; p_username: string }
        Returns: Json
      }
      admin_create_company_user: {
        Args: {
          p_company_id: string
          p_display_name: string
          p_is_primary?: boolean
          p_password: string
          p_username: string
        }
        Returns: Json
      }
      admin_delete_admin: { Args: { p_id: string }; Returns: Json }
      admin_delete_company: { Args: { p_id: string }; Returns: Json }
      admin_delete_company_user: { Args: { p_user_id: string }; Returns: Json }
      admin_list_admins: { Args: never; Returns: Json }
      admin_list_companies: { Args: never; Returns: Json }
      admin_list_company_users: {
        Args: { p_company_id: string }
        Returns: Json
      }
      admin_update_company: {
        Args: {
          p_active: boolean
          p_id: string
          p_logo_url?: string
          p_name: string
          p_slug: string
        }
        Returns: Json
      }
      authenticate_admin: {
        Args: { p_password: string; p_username: string }
        Returns: Json
      }
      authenticate_any: {
        Args: { p_password: string; p_username: string }
        Returns: Json
      }
      authenticate_user: {
        Args: { p_password: string; p_username: string }
        Returns: Json
      }
      create_company_with_user: {
        Args: { p_logo_url?: string; p_name: string; p_slug: string }
        Returns: Json
      }
      get_clickeats_daily_password: { Args: never; Returns: string }
      refresh_clickeats_passwords: { Args: never; Returns: undefined }
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
