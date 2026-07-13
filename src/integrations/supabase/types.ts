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
      advertisements: {
        Row: {
          created_at: string
          cta_link: string | null
          cta_text: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          is_published: boolean
          media_type: string
          media_url: string
          position: string
          priority: number
          start_date: string | null
          title: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          media_type?: string
          media_url: string
          position?: string
          priority?: number
          start_date?: string | null
          title: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          media_type?: string
          media_url?: string
          position?: string
          priority?: number
          start_date?: string | null
          title?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      author_applications: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          sample_links: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_links?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_links?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          email: string | null
          featured_wedding_ids: Json | null
          id: string
          login: string | null
          slug: string | null
          social_links: Json | null
          user_id: string | null
          wp_author_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          featured_wedding_ids?: Json | null
          id?: string
          login?: string | null
          slug?: string | null
          social_links?: Json | null
          user_id?: string | null
          wp_author_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          featured_wedding_ids?: Json | null
          id?: string
          login?: string | null
          slug?: string | null
          social_links?: Json | null
          user_id?: string | null
          wp_author_id?: number | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_slug: string | null
          slug: string
          wp_term_id: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_slug?: string | null
          slug: string
          wp_term_id?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_slug?: string | null
          slug?: string
          wp_term_id?: number | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          approved: boolean
          author_email: string | null
          author_name: string
          content: string
          created_at: string
          hidden: boolean
          id: string
          parent_wp_comment_id: number | null
          post_id: string
          user_id: string | null
          wp_comment_id: number | null
        }
        Insert: {
          approved?: boolean
          author_email?: string | null
          author_name: string
          content: string
          created_at?: string
          hidden?: boolean
          id?: string
          parent_wp_comment_id?: number | null
          post_id: string
          user_id?: string | null
          wp_comment_id?: number | null
        }
        Update: {
          approved?: boolean
          author_email?: string | null
          author_name?: string
          content?: string
          created_at?: string
          hidden?: boolean
          id?: string
          parent_wp_comment_id?: number | null
          post_id?: string
          user_id?: string | null
          wp_comment_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_media_assets: {
        Row: {
          created_at: string
          error: string | null
          hosted_url: string | null
          id: string
          source_url: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          hosted_url?: string | null
          id?: string
          source_url: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          hosted_url?: string | null
          id?: string
          source_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content_html: string | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          language: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number
          wp_post_id: number | null
        }
        Insert: {
          author_id?: string | null
          content_html?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          language?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number
          wp_post_id?: number | null
        }
        Update: {
          author_id?: string | null
          content_html?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          language?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
          wp_post_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          wp_term_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          wp_term_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          wp_term_id?: number | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          client_id: string
          created_at: string
          deposit_amount: number
          event_date: string
          id: string
          notes: string | null
          payment_status: string
          service_id: string | null
          status: string
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deposit_amount?: number
          event_date: string
          id?: string
          notes?: string | null
          payment_status?: string
          service_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deposit_amount?: number
          event_date?: string
          id?: string
          notes?: string | null
          payment_status?: string
          service_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "vendor_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      real_weddings: {
        Row: {
          country: string | null
          couple_names: string
          cover_image_url: string | null
          created_at: string
          featured: boolean
          gallery_urls: Json
          id: string
          location: string | null
          slug: string
          status: string
          story: string | null
          submitted_by: string | null
          updated_at: string
          vendor_ids: Json
          wedding_date: string | null
          wedding_type: string | null
        }
        Insert: {
          country?: string | null
          couple_names: string
          cover_image_url?: string | null
          created_at?: string
          featured?: boolean
          gallery_urls?: Json
          id?: string
          location?: string | null
          slug: string
          status?: string
          story?: string | null
          submitted_by?: string | null
          updated_at?: string
          vendor_ids?: Json
          wedding_date?: string | null
          wedding_type?: string | null
        }
        Update: {
          country?: string | null
          couple_names?: string
          cover_image_url?: string | null
          created_at?: string
          featured?: boolean
          gallery_urls?: Json
          id?: string
          location?: string | null
          slug?: string
          status?: string
          story?: string | null
          submitted_by?: string | null
          updated_at?: string
          vendor_ids?: Json
          wedding_date?: string | null
          wedding_type?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          payload: Json
          status: string
          submission_type: string
          submitter_email: string | null
          submitter_id: string | null
          submitter_name: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          payload: Json
          status?: string
          submission_type: string
          submitter_email?: string | null
          submitter_id?: string | null
          submitter_name?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          submission_type?: string
          submitter_email?: string | null
          submitter_id?: string | null
          submitter_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          client_id: string
          commission: number
          created_at: string
          id: string
          payment_method: string
          status: string
          vendor_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          client_id: string
          commission?: number
          created_at?: string
          id?: string
          payment_method?: string
          status?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          client_id?: string
          commission?: number
          created_at?: string
          id?: string
          payment_method?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      vendor_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_type: string
          url: string
          vendor_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          url: string
          vendor_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          url?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_media_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payment_details: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string | null
          created_at: string
          id: string
          payment_method: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          account_name?: string
          account_number?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payment_details_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_services: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          id: string
          name: string
          price: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          name: string
          price?: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          name?: string
          price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          business_name: string
          category: Database["public"]["Enums"]["vendor_category"]
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          starting_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name: string
          category: Database["public"]["Enums"]["vendor_category"]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          starting_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          category?: Database["public"]["Enums"]["vendor_category"]
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          starting_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          commission: number
          created_at: string
          id: string
          net_amount: number
          processed_at: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          commission?: number
          created_at?: string
          id?: string
          net_amount?: number
          processed_at?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          commission?: number
          created_at?: string
          id?: string
          net_amount?: number
          processed_at?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_author_id: { Args: never; Returns: string }
      get_vendor_booked_dates: {
        Args: { _vendor_id: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendor" | "client" | "author"
      vendor_category:
        | "venues"
        | "photographers"
        | "videographers"
        | "decorators"
        | "catering"
        | "makeup_artists"
        | "mc_entertainment"
        | "car_hire"
        | "sound_lighting"
        | "wedding_planners"
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
      app_role: ["admin", "vendor", "client", "author"],
      vendor_category: [
        "venues",
        "photographers",
        "videographers",
        "decorators",
        "catering",
        "makeup_artists",
        "mc_entertainment",
        "car_hire",
        "sound_lighting",
        "wedding_planners",
      ],
    },
  },
} as const
