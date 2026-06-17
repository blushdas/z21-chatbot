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
      access_block_events: {
        Row: {
          blocked_at: string
          country: string | null
          endpoint: string
          id: string
          ip: string | null
          rule_id: string | null
          user_id: string | null
        }
        Insert: {
          blocked_at?: string
          country?: string | null
          endpoint: string
          id?: string
          ip?: string | null
          rule_id?: string | null
          user_id?: string | null
        }
        Update: {
          blocked_at?: string
          country?: string | null
          endpoint?: string
          id?: string
          ip?: string | null
          rule_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_block_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "access_control_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      access_control_rules: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          kind: string
          mode: string
          notes: string | null
          severity: string
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          kind: string
          mode: string
          notes?: string | null
          severity?: string
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          mode?: string
          notes?: string | null
          severity?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          assigned_to: string | null
          created_at: string
          delivery_channels: Json
          email_required: boolean
          email_sent_at: string | null
          id: string
          message: string
          metadata: Json
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_id: string | null
          source_table: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_to?: string | null
          created_at?: string
          delivery_channels?: Json
          email_required?: boolean
          email_sent_at?: string | null
          id?: string
          message: string
          metadata?: Json
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_id?: string | null
          source_table?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_to?: string | null
          created_at?: string
          delivery_channels?: Json
          email_required?: boolean
          email_sent_at?: string | null
          id?: string
          message?: string
          metadata?: Json
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_id?: string | null
          source_table?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      advisor_memory: {
        Row: {
          ongoing_situations: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ongoing_situations?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ongoing_situations?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      align_reports: {
        Row: {
          generated_at: string
          report_json: Json
          session_id: string
        }
        Insert: {
          generated_at?: string
          report_json: Json
          session_id: string
        }
        Update: {
          generated_at?: string
          report_json?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "align_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "align_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      align_respondents: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_seen_at: string | null
          name: string | null
          revoked: boolean
          sections: string[]
          session_id: string
          token: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_seen_at?: string | null
          name?: string | null
          revoked?: boolean
          sections?: string[]
          session_id: string
          token: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_seen_at?: string | null
          name?: string | null
          revoked?: boolean
          sections?: string[]
          session_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "align_respondents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "align_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      align_responses: {
        Row: {
          answer_value: Json
          function_name: string | null
          id: string
          question_key: string
          respondent_id: string | null
          section: string
          session_id: string
          updated_at: string
        }
        Insert: {
          answer_value: Json
          function_name?: string | null
          id?: string
          question_key: string
          respondent_id?: string | null
          section: string
          session_id: string
          updated_at?: string
        }
        Update: {
          answer_value?: Json
          function_name?: string | null
          id?: string
          question_key?: string
          respondent_id?: string | null
          section?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "align_responses_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "align_respondents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "align_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "align_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      align_sessions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          org_profile: Json
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          org_profile?: Json
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          org_profile?: Json
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      align_use_cases: {
        Row: {
          generated_at: string
          id: string
          payload: Json
          scores: Json
          session_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          payload: Json
          scores?: Json
          session_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          payload?: Json
          scores?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "align_use_cases_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "align_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          canvas_id: string | null
          category: string
          chat_id: string | null
          client: Json
          completion_tokens: number | null
          created_at: string
          duration_ms: number | null
          event_name: string
          file_id: string | null
          folder_id: string | null
          id: string
          ip_hash: string | null
          message_id: string | null
          mode: string | null
          model: string | null
          occurred_at: string
          processing_power: string | null
          prompt_tokens: number | null
          properties: Json
          response_mode: string | null
          session_id: string | null
          source: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          canvas_id?: string | null
          category: string
          chat_id?: string | null
          client?: Json
          completion_tokens?: number | null
          created_at?: string
          duration_ms?: number | null
          event_name: string
          file_id?: string | null
          folder_id?: string | null
          id?: string
          ip_hash?: string | null
          message_id?: string | null
          mode?: string | null
          model?: string | null
          occurred_at?: string
          processing_power?: string | null
          prompt_tokens?: number | null
          properties?: Json
          response_mode?: string | null
          session_id?: string | null
          source?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          canvas_id?: string | null
          category?: string
          chat_id?: string | null
          client?: Json
          completion_tokens?: number | null
          created_at?: string
          duration_ms?: number | null
          event_name?: string
          file_id?: string | null
          folder_id?: string | null
          id?: string
          ip_hash?: string | null
          message_id?: string | null
          mode?: string | null
          model?: string | null
          occurred_at?: string
          processing_power?: string | null
          prompt_tokens?: number | null
          properties?: Json
          response_mode?: string | null
          session_id?: string | null
          source?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      authorized_domain_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          changes: Json | null
          created_at: string
          domain: string
          domain_id: string | null
          id: string
          organization: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          domain: string
          domain_id?: string | null
          id?: string
          organization?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          domain?: string
          domain_id?: string | null
          id?: string
          organization?: string | null
        }
        Relationships: []
      }
      authorized_email_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          is_active: boolean | null
          organization: string
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          organization: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          organization?: string
        }
        Relationships: []
      }
      authorized_emails: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          is_active: boolean | null
          organization: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          organization?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          organization?: string | null
        }
        Relationships: []
      }
      benchmark_aggregates: {
        Row: {
          completed_at: string
          concurrency_level: number
          created_at: string | null
          duration_seconds: number
          endpoint: string
          environment: string
          failure_count: number
          id: string
          max_ms: number
          mean_ms: number
          min_ms: number
          p50_ms: number
          p95_ms: number
          p99_ms: number
          pass_p95_target: boolean
          run_id: string
          started_at: string
          success_count: number
          success_rate: number
          target_p95_ms: number
          test_name: string
          throughput_rps: number | null
          total_requests: number
        }
        Insert: {
          completed_at: string
          concurrency_level: number
          created_at?: string | null
          duration_seconds: number
          endpoint: string
          environment: string
          failure_count: number
          id?: string
          max_ms: number
          mean_ms: number
          min_ms: number
          p50_ms: number
          p95_ms: number
          p99_ms: number
          pass_p95_target: boolean
          run_id: string
          started_at: string
          success_count: number
          success_rate: number
          target_p95_ms?: number
          test_name: string
          throughput_rps?: number | null
          total_requests: number
        }
        Update: {
          completed_at?: string
          concurrency_level?: number
          created_at?: string | null
          duration_seconds?: number
          endpoint?: string
          environment?: string
          failure_count?: number
          id?: string
          max_ms?: number
          mean_ms?: number
          min_ms?: number
          p50_ms?: number
          p95_ms?: number
          p99_ms?: number
          pass_p95_target?: boolean
          run_id?: string
          started_at?: string
          success_count?: number
          success_rate?: number
          target_p95_ms?: number
          test_name?: string
          throughput_rps?: number | null
          total_requests?: number
        }
        Relationships: []
      }
      benchmark_results: {
        Row: {
          concurrency_level: number
          created_at: string | null
          endpoint: string
          environment: string
          id: string
          latency_ms: number
          request_payload: Json | null
          response_metadata: Json | null
          run_id: string
          status_code: number
          success: boolean
          test_name: string
          timestamp: string
        }
        Insert: {
          concurrency_level?: number
          created_at?: string | null
          endpoint: string
          environment?: string
          id?: string
          latency_ms: number
          request_payload?: Json | null
          response_metadata?: Json | null
          run_id: string
          status_code: number
          success?: boolean
          test_name: string
          timestamp?: string
        }
        Update: {
          concurrency_level?: number
          created_at?: string | null
          endpoint?: string
          environment?: string
          id?: string
          latency_ms?: number
          request_payload?: Json | null
          response_metadata?: Json | null
          run_id?: string
          status_code?: number
          success?: boolean
          test_name?: string
          timestamp?: string
        }
        Relationships: []
      }
      beta_waitlist: {
        Row: {
          admin_notes: string | null
          contacted_at: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          organization: string | null
          reason: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          organization?: string | null
          reason: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          organization?: string | null
          reason?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_waitlist_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_waitlist_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_email_domains: {
        Row: {
          created_at: string
          created_by: string | null
          domain: string
          id: string
          is_active: boolean
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain: string
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blocked_emails: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      canvas_ai_edits: {
        Row: {
          after_json: Json | null
          applied: boolean
          before_json: Json | null
          canvas_id: string
          created_at: string
          id: string
          instruction: string
          mode: string
          user_id: string
        }
        Insert: {
          after_json?: Json | null
          applied?: boolean
          before_json?: Json | null
          canvas_id: string
          created_at?: string
          id?: string
          instruction: string
          mode: string
          user_id: string
        }
        Update: {
          after_json?: Json | null
          applied?: boolean
          before_json?: Json | null
          canvas_id?: string
          created_at?: string
          id?: string
          instruction?: string
          mode?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_ai_edits_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvases"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_versions: {
        Row: {
          canvas_id: string
          content_json: Json
          content_plaintext: string
          created_at: string
          id: string
          owner_id: string
          source: string
          title: string
        }
        Insert: {
          canvas_id: string
          content_json: Json
          content_plaintext?: string
          created_at?: string
          id?: string
          owner_id: string
          source?: string
          title?: string
        }
        Update: {
          canvas_id?: string
          content_json?: Json
          content_plaintext?: string
          created_at?: string
          id?: string
          owner_id?: string
          source?: string
          title?: string
        }
        Relationships: []
      }
      canvases: {
        Row: {
          chat_id: string | null
          content_json: Json
          content_plaintext: string
          created_at: string
          created_from_message_id: string | null
          id: string
          last_opened_at: string
          owner_id: string
          pinned_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          chat_id?: string | null
          content_json?: Json
          content_plaintext?: string
          created_at?: string
          created_from_message_id?: string | null
          id?: string
          last_opened_at?: string
          owner_id: string
          pinned_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          chat_id?: string | null
          content_json?: Json
          content_plaintext?: string
          created_at?: string
          created_from_message_id?: string | null
          id?: string
          last_opened_at?: string
          owner_id?: string
          pinned_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvases_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_attachments: {
        Row: {
          chat_id: string
          created_at: string
          file_name: string
          file_type: string | null
          id: string
          mime_type: string | null
          page_count: number | null
          parsed_text: string
          size: number | null
          storage_path: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          file_name: string
          file_type?: string | null
          id?: string
          mime_type?: string | null
          page_count?: number | null
          parsed_text: string
          size?: number | null
          storage_path?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          file_name?: string
          file_type?: string | null
          id?: string
          mime_type?: string | null
          page_count?: number | null
          parsed_text?: string
          size?: number | null
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_favorites: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_favorites_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_file_access_logs: {
        Row: {
          action: string
          chat_id: string | null
          created_at: string
          file_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          chat_id?: string | null
          created_at?: string
          file_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          chat_id?: string | null
          created_at?: string
          file_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_file_access_logs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "chat_files"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_file_extractions: {
        Row: {
          content_plaintext: string
          created_at: string
          error_message: string | null
          extraction_method: string | null
          file_id: string
          id: string
          page_count: number | null
          status: string
          structure_json: Json
          token_estimate: number | null
          word_count: number | null
        }
        Insert: {
          content_plaintext?: string
          created_at?: string
          error_message?: string | null
          extraction_method?: string | null
          file_id: string
          id?: string
          page_count?: number | null
          status?: string
          structure_json?: Json
          token_estimate?: number | null
          word_count?: number | null
        }
        Update: {
          content_plaintext?: string
          created_at?: string
          error_message?: string | null
          extraction_method?: string | null
          file_id?: string
          id?: string
          page_count?: number | null
          status?: string
          structure_json?: Json
          token_estimate?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_file_extractions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "chat_files"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_files: {
        Row: {
          chat_id: string
          created_at: string
          deleted_at: string | null
          error_message: string | null
          file_size: number
          file_type: string
          id: string
          mime_type: string
          original_filename: string
          owner_id: string
          processing_status: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          deleted_at?: string | null
          error_message?: string | null
          file_size: number
          file_type: string
          id?: string
          mime_type: string
          original_filename: string
          owner_id: string
          processing_status?: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          deleted_at?: string | null
          error_message?: string | null
          file_size?: number
          file_type?: string
          id?: string
          mime_type?: string
          original_filename?: string
          owner_id?: string
          processing_status?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_files_chat_id_fk"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_load_failures: {
        Row: {
          chat_id: string
          context: Json | null
          created_at: string | null
          error_message: string | null
          failure_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          chat_id: string
          context?: Json | null
          created_at?: string | null
          error_message?: string | null
          failure_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          chat_id?: string
          context?: Json | null
          created_at?: string | null
          error_message?: string | null
          failure_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_safety_flags: {
        Row: {
          admin_notes: string | null
          category: string
          chat_id: string
          created_at: string
          id: string
          response_content: string
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          user_id: string
          user_message: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          chat_id: string
          created_at?: string
          id?: string
          response_content: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: string
          status?: string
          user_id: string
          user_message: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          chat_id?: string
          created_at?: string
          id?: string
          response_content?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_safety_flags_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          chat_category: string | null
          created_at: string | null
          deleted_at: string | null
          folder_id: string | null
          id: string
          is_typing_title: boolean | null
          messages: Json
          mode: string
          mode_change_events: Json | null
          pinned: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          is_typing_title?: boolean | null
          messages?: Json
          mode?: string
          mode_change_events?: Json | null
          pinned?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          is_typing_title?: boolean | null
          messages?: Json
          mode?: string
          mode_change_events?: Json | null
          pinned?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      commentary_logs: {
        Row: {
          action: string
          chat_id: string | null
          commentary_content: string | null
          created_at: string
          display_mode: string
          generation_time_ms: number | null
          id: string
          message_id: string
          model_used: string | null
          user_id: string
          voice_id: string
        }
        Insert: {
          action: string
          chat_id?: string | null
          commentary_content?: string | null
          created_at?: string
          display_mode: string
          generation_time_ms?: number | null
          id?: string
          message_id: string
          model_used?: string | null
          user_id: string
          voice_id?: string
        }
        Update: {
          action?: string
          chat_id?: string | null
          commentary_content?: string | null
          created_at?: string
          display_mode?: string
          generation_time_ms?: number | null
          id?: string
          message_id?: string
          model_used?: string | null
          user_id?: string
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commentary_logs_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      construct_assets: {
        Row: {
          construct_version_id: string
          created_at: string
          id: string
          kind: string
          title: string | null
          url: string
        }
        Insert: {
          construct_version_id: string
          created_at?: string
          id?: string
          kind: string
          title?: string | null
          url: string
        }
        Update: {
          construct_version_id?: string
          created_at?: string
          id?: string
          kind?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "construct_assets_construct_version_id_fkey"
            columns: ["construct_version_id"]
            isOneToOne: false
            referencedRelation: "construct_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      construct_audit_logs: {
        Row: {
          action: string
          construct_id: string | null
          created_at: string
          id: string
          meta: Json | null
          user_id: string
        }
        Insert: {
          action: string
          construct_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          construct_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "construct_audit_logs_construct_id_fkey"
            columns: ["construct_id"]
            isOneToOne: false
            referencedRelation: "constructs"
            referencedColumns: ["id"]
          },
        ]
      }
      construct_versions: {
        Row: {
          construct_id: string
          created_at: string
          created_by_id: string
          diagram_json: Json | null
          id: string
          notes_md: string | null
          version: number
        }
        Insert: {
          construct_id: string
          created_at?: string
          created_by_id: string
          diagram_json?: Json | null
          id?: string
          notes_md?: string | null
          version: number
        }
        Update: {
          construct_id?: string
          created_at?: string
          created_by_id?: string
          diagram_json?: Json | null
          id?: string
          notes_md?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "construct_versions_construct_id_fkey"
            columns: ["construct_id"]
            isOneToOne: false
            referencedRelation: "constructs"
            referencedColumns: ["id"]
          },
        ]
      }
      constructs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          latest_version: number | null
          oe_keys: string[] | null
          slug: string
          state: Database["public"]["Enums"]["publish_state"] | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          latest_version?: number | null
          oe_keys?: string[] | null
          slug: string
          state?: Database["public"]["Enums"]["publish_state"] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          latest_version?: number | null
          oe_keys?: string[] | null
          slug?: string
          state?: Database["public"]["Enums"]["publish_state"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_brands: {
        Row: {
          accent_hsl: string
          background_hsl: string | null
          created_at: string
          created_by: string | null
          favicon_url: string | null
          foreground_hsl: string | null
          id: string
          logo_dark_url: string | null
          logo_url: string | null
          name: string
          primary_hsl: string
          product_name: string
          slug: string
          updated_at: string
        }
        Insert: {
          accent_hsl: string
          background_hsl?: string | null
          created_at?: string
          created_by?: string | null
          favicon_url?: string | null
          foreground_hsl?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          name: string
          primary_hsl: string
          product_name: string
          slug: string
          updated_at?: string
        }
        Update: {
          accent_hsl?: string
          background_hsl?: string | null
          created_at?: string
          created_by?: string | null
          favicon_url?: string | null
          foreground_hsl?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          name?: string
          primary_hsl?: string
          product_name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      dual_response_logs: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          message_query: string
          model_a: string | null
          model_b: string | null
          response_a: string
          response_b: string
          user_choice: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          message_query: string
          model_a?: string | null
          model_b?: string | null
          response_a: string
          response_b: string
          user_choice: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          message_query?: string
          model_a?: string | null
          model_b?: string | null
          response_a?: string
          response_b?: string
          user_choice?: string
          user_id?: string
        }
        Relationships: []
      }
      edge_function_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string | null
          function_name: string
          http_status: number | null
          id: string
          request_payload: Json | null
          streaming: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type?: string | null
          function_name: string
          http_status?: number | null
          id?: string
          request_payload?: Json | null
          streaming?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string | null
          function_name?: string
          http_status?: number | null
          id?: string
          request_payload?: Json | null
          streaming?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          message_index: number
          title: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          message_index: number
          title?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          message_index?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_logs: {
        Row: {
          chat_id: string | null
          comment: string | null
          created_at: string | null
          edited_message: string | null
          id: string
          length_preference: string | null
          message_id: string
          original_message: string | null
          rating: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          comment?: string | null
          created_at?: string | null
          edited_message?: string | null
          id?: string
          length_preference?: string | null
          message_id: string
          original_message?: string | null
          rating?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          comment?: string | null
          created_at?: string | null
          edited_message?: string | null
          id?: string
          length_preference?: string | null
          message_id?: string
          original_message?: string | null
          rating?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_logs_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_activity_events: {
        Row: {
          action: string
          created_at: string
          folder_id: string
          id: string
          metadata: Json
          target_id: string | null
          target_label: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          folder_id: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          folder_id?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      folder_instructions: {
        Row: {
          content: string
          created_at: string | null
          folder_id: string
          id: string
          is_locked: boolean
          last_edited_at: string | null
          last_edited_by: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string | null
          folder_id: string
          id?: string
          is_locked?: boolean
          last_edited_at?: string | null
          last_edited_by?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          folder_id?: string
          id?: string
          is_locked?: boolean
          last_edited_at?: string | null
          last_edited_by?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_instructions_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          folder_id: string
          id: string
          max_uses: number | null
          revoked: boolean
          role: string
          token: string
          uses: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          folder_id: string
          id?: string
          max_uses?: number | null
          revoked?: boolean
          role?: string
          token?: string
          uses?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          folder_id?: string
          id?: string
          max_uses?: number | null
          revoked?: boolean
          role?: string
          token?: string
          uses?: number
        }
        Relationships: []
      }
      folder_knowledge: {
        Row: {
          chat_id: string | null
          content: string
          created_at: string | null
          folder_id: string
          id: string
          status: string
          tags: string[]
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          content: string
          created_at?: string | null
          folder_id: string
          id?: string
          status?: string
          tags?: string[]
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string | null
          content?: string
          created_at?: string | null
          folder_id?: string
          id?: string
          status?: string
          tags?: string[]
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_knowledge_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_knowledge_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_members: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          invited_by: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          invited_by: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          invited_by?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_members_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_memory: {
        Row: {
          category: string
          content: string
          created_at: string | null
          folder_id: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          folder_id: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          folder_id?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_memory_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_quick_links: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          folder_id: string
          icon: string | null
          id: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          folder_id: string
          icon?: string | null
          id?: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          folder_id?: string
          icon?: string | null
          id?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_quick_links_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_sources: {
        Row: {
          bucket_path: string | null
          content: string | null
          created_at: string | null
          file_size: number | null
          folder_id: string
          id: string
          last_indexed_at: string | null
          mime_type: string | null
          parsed_text: string | null
          processing_error: string | null
          status: string
          summary: string | null
          tags: string[]
          title: string
          type: string
          updated_at: string | null
          url: string | null
          user_id: string
          vector_count: number
          visibility: string
        }
        Insert: {
          bucket_path?: string | null
          content?: string | null
          created_at?: string | null
          file_size?: number | null
          folder_id: string
          id?: string
          last_indexed_at?: string | null
          mime_type?: string | null
          parsed_text?: string | null
          processing_error?: string | null
          status?: string
          summary?: string | null
          tags?: string[]
          title: string
          type?: string
          updated_at?: string | null
          url?: string | null
          user_id: string
          vector_count?: number
          visibility?: string
        }
        Update: {
          bucket_path?: string | null
          content?: string | null
          created_at?: string | null
          file_size?: number | null
          folder_id?: string
          id?: string
          last_indexed_at?: string | null
          mime_type?: string | null
          parsed_text?: string | null
          processing_error?: string | null
          status?: string
          summary?: string | null
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
          vector_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_sources_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_tags: {
        Row: {
          created_at: string
          folder_id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folder_tags_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folder_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "project_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string | null
          default_blueprint: string | null
          default_kb_sources: string[] | null
          default_model: string | null
          default_processing: string | null
          description: string | null
          id: string
          is_pinned: boolean
          status: string
          tags: string[]
          title: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_blueprint?: string | null
          default_kb_sources?: string[] | null
          default_model?: string | null
          default_processing?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean
          status?: string
          tags?: string[]
          title: string
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_blueprint?: string | null
          default_kb_sources?: string[] | null
          default_model?: string | null
          default_processing?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      general_feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          subject: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          subject?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_sources: {
        Row: {
          box_file_id: string | null
          bullet_points: string[] | null
          category: string | null
          created_at: string
          created_by: string | null
          document_type: string
          domain: string | null
          file_date: string | null
          id: string
          original_title: string
          pinecone_ids: string[] | null
          pinecone_title: string | null
          source_url: string | null
          status: string
          subdomain: string | null
          summary: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          box_file_id?: string | null
          bullet_points?: string[] | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          document_type: string
          domain?: string | null
          file_date?: string | null
          id?: string
          original_title: string
          pinecone_ids?: string[] | null
          pinecone_title?: string | null
          source_url?: string | null
          status?: string
          subdomain?: string | null
          summary?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          box_file_id?: string | null
          bullet_points?: string[] | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          document_type?: string
          domain?: string | null
          file_date?: string | null
          id?: string
          original_title?: string
          pinecone_ids?: string[] | null
          pinecone_title?: string | null
          source_url?: string | null
          status?: string
          subdomain?: string | null
          summary?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      phone_verification_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          advisor_memory_opt_in: boolean
          avatar_url: string | null
          beta_access_granted: boolean | null
          commentary_preference: string | null
          created_at: string | null
          custom_instructions: string | null
          email: string
          id: string
          last_sign_in_at: string | null
          monitoring_disclosure_acknowledged_at: string | null
          name: string
          onboarding_completed: boolean | null
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          privacy_terms_agreed: boolean | null
          privacy_terms_agreed_at: string | null
          prompt_coaching_enabled: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          signup_notification_sent: boolean | null
          suspended: boolean | null
          theme_preference: string
          updated_at: string | null
        }
        Insert: {
          advisor_memory_opt_in?: boolean
          avatar_url?: string | null
          beta_access_granted?: boolean | null
          commentary_preference?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          email: string
          id: string
          last_sign_in_at?: string | null
          monitoring_disclosure_acknowledged_at?: string | null
          name: string
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          privacy_terms_agreed?: boolean | null
          privacy_terms_agreed_at?: string | null
          prompt_coaching_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          signup_notification_sent?: boolean | null
          suspended?: boolean | null
          theme_preference?: string
          updated_at?: string | null
        }
        Update: {
          advisor_memory_opt_in?: boolean
          avatar_url?: string | null
          beta_access_granted?: boolean | null
          commentary_preference?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          email?: string
          id?: string
          last_sign_in_at?: string | null
          monitoring_disclosure_acknowledged_at?: string | null
          name?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          privacy_terms_agreed?: boolean | null
          privacy_terms_agreed_at?: string | null
          prompt_coaching_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          signup_notification_sent?: boolean | null
          suspended?: boolean | null
          theme_preference?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompt_improvement_logs: {
        Row: {
          chat_id: string | null
          created_at: string
          edited_prompt: string | null
          id: string
          improved_prompt: string | null
          original_prompt: string
          user_choice: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          edited_prompt?: string | null
          id?: string
          improved_prompt?: string | null
          original_prompt: string
          user_choice: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          edited_prompt?: string | null
          id?: string
          improved_prompt?: string | null
          original_prompt?: string
          user_choice?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_improvement_logs_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          expires_at: string
          id: string
          identifier_hash: string
          request_count: number
          updated_at: string | null
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          expires_at: string
          id?: string
          identifier_hash: string
          request_count?: number
          updated_at?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          expires_at?: string
          id?: string
          identifier_hash?: string
          request_count?: number
          updated_at?: string | null
          window_start?: string
        }
        Relationships: []
      }
      retention_audit_log: {
        Row: {
          deleted_count: number
          executed_at: string
          executed_by: string | null
          id: string
          retention_days: number
        }
        Insert: {
          deleted_count?: number
          executed_at?: string
          executed_by?: string | null
          id?: string
          retention_days: number
        }
        Update: {
          deleted_count?: number
          executed_at?: string
          executed_by?: string | null
          id?: string
          retention_days?: number
        }
        Relationships: []
      }
      route_execution_logs: {
        Row: {
          chat_id: string | null
          classification: string | null
          classification_confidence: number | null
          completion_tokens: number | null
          created_at: string | null
          fallback_reason: string | null
          fallback_used: boolean | null
          id: string
          message_id: string | null
          model_used: string | null
          prompt_tokens: number | null
          route_executed: string
          route_requested: string
          skip_rag: boolean | null
          stages: Json
          total_duration_ms: number
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          classification?: string | null
          classification_confidence?: number | null
          completion_tokens?: number | null
          created_at?: string | null
          fallback_reason?: string | null
          fallback_used?: boolean | null
          id?: string
          message_id?: string | null
          model_used?: string | null
          prompt_tokens?: number | null
          route_executed: string
          route_requested: string
          skip_rag?: boolean | null
          stages?: Json
          total_duration_ms?: number
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          classification?: string | null
          classification_confidence?: number | null
          completion_tokens?: number | null
          created_at?: string | null
          fallback_reason?: string | null
          fallback_used?: boolean | null
          id?: string
          message_id?: string | null
          model_used?: string | null
          prompt_tokens?: number | null
          route_executed?: string
          route_requested?: string
          skip_rag?: boolean | null
          stages?: Json
          total_duration_ms?: number
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          actor_user_id: string | null
          chat_session_id: string | null
          country: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["security_audit_event_type"]
          id: string
          ip: unknown
          metadata: Json
          organization_id: string | null
          severity: string
          target_resource: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          actor_user_id?: string | null
          chat_session_id?: string | null
          country?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["security_audit_event_type"]
          id?: string
          ip?: unknown
          metadata?: Json
          organization_id?: string | null
          severity?: string
          target_resource?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_user_id?: string | null
          chat_session_id?: string | null
          country?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["security_audit_event_type"]
          id?: string
          ip?: unknown
          metadata?: Json
          organization_id?: string | null
          severity?: string
          target_resource?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      semantic_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          hit_count: number | null
          id: string
          mode: string | null
          model: string | null
          query_embedding: string | null
          query_hash: string
          query_text: string
          response: string
          response_mode: string | null
          sources: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          mode?: string | null
          model?: string | null
          query_embedding?: string | null
          query_hash: string
          query_text: string
          response: string
          response_mode?: string | null
          sources?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          hit_count?: number | null
          id?: string
          mode?: string | null
          model?: string | null
          query_embedding?: string | null
          query_hash?: string
          query_text?: string
          response?: string
          response_mode?: string | null
          sources?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      service_health: {
        Row: {
          checked_at: string
          error_message: string | null
          http_status: number | null
          id: string
          latency_ms: number | null
          service: string
          status: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          service: string
          status: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          latency_ms?: number | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      signup_logs: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          city: string | null
          color_depth: number | null
          connection_type: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: unknown
          language: string | null
          languages: string[] | null
          os_name: string | null
          os_version: string | null
          platform: string | null
          raw_metadata: Json | null
          referrer_url: string | null
          region: string | null
          screen_height: number | null
          screen_width: number | null
          signup_url: string | null
          timezone: string | null
          timezone_offset: number | null
          touch_points: number | null
          user_agent: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          city?: string | null
          color_depth?: number | null
          connection_type?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown
          language?: string | null
          languages?: string[] | null
          os_name?: string | null
          os_version?: string | null
          platform?: string | null
          raw_metadata?: Json | null
          referrer_url?: string | null
          region?: string | null
          screen_height?: number | null
          screen_width?: number | null
          signup_url?: string | null
          timezone?: string | null
          timezone_offset?: number | null
          touch_points?: number | null
          user_agent?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          city?: string | null
          color_depth?: number | null
          connection_type?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown
          language?: string | null
          languages?: string[] | null
          os_name?: string | null
          os_version?: string | null
          platform?: string | null
          raw_metadata?: Json | null
          referrer_url?: string | null
          region?: string | null
          screen_height?: number | null
          screen_width?: number | null
          signup_url?: string | null
          timezone?: string | null
          timezone_offset?: number | null
          touch_points?: number | null
          user_agent?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      two_factor_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      two_factor_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          enabled: boolean | null
          id: string
          last_verified_at: string | null
          method: string
          totp_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_verified_at?: string | null
          method: string
          totp_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_verified_at?: string | null
          method?: string
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_chat_categories: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          label: string
          sort_order: number
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          message_content: string
          message_id: string
          message_mode: string | null
          message_timestamp: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          message_id: string
          message_mode?: string | null
          message_timestamp: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          message_id?: string
          message_mode?: string | null
          message_timestamp?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_tours: {
        Row: {
          completed_at: string | null
          current_step: number
          disabled_at: string | null
          id: string
          skipped_at: string | null
          status: string
          tour_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number
          disabled_at?: string | null
          id?: string
          skipped_at?: string | null
          status?: string
          tour_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number
          disabled_at?: string | null
          id?: string
          skipped_at?: string | null
          status?: string
          tour_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_suggestion_cache: {
        Row: {
          chat_count: number
          created_at: string
          id: string
          last_updated: string
          mode: string
          suggestions: Json
          user_id: string
        }
        Insert: {
          chat_count?: number
          created_at?: string
          id?: string
          last_updated?: string
          mode: string
          suggestions?: Json
          user_id: string
        }
        Update: {
          chat_count?: number
          created_at?: string
          id?: string
          last_updated?: string
          mode?: string
          suggestions?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_folder_invite: { Args: { _token: string }; Returns: Json }
      align_admin_get_session: { Args: { _session_id: string }; Returns: Json }
      align_admin_list_sessions: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: Json
      }
      align_create_respondent: {
        Args: {
          _email: string
          _name: string
          _sections: string[]
          _session_token: string
        }
        Returns: {
          id: string
          token: string
        }[]
      }
      align_create_session: {
        Args: { _org_profile?: Json }
        Returns: {
          id: string
          token: string
        }[]
      }
      align_get_public_report: { Args: { _token: string }; Returns: Json }
      align_get_respondent: { Args: { _resp_token: string }; Returns: Json }
      align_get_session: { Args: { _token: string }; Returns: Json }
      align_list_respondents: {
        Args: { _session_token: string }
        Returns: Json
      }
      align_revoke_respondent: {
        Args: { _respondent_id: string; _session_token: string }
        Returns: boolean
      }
      align_save_report: {
        Args: { _report: Json; _token: string }
        Returns: boolean
      }
      align_set_email: {
        Args: { _email: string; _token: string }
        Returns: boolean
      }
      align_update_profile: {
        Args: { _org_profile: Json; _token: string }
        Returns: boolean
      }
      align_upsert_respondent_response: {
        Args: {
          _answer_value: Json
          _function_name?: string
          _question_key: string
          _resp_token: string
          _section: string
        }
        Returns: boolean
      }
      align_upsert_response: {
        Args: {
          _answer_value: Json
          _function_name?: string
          _question_key: string
          _section: string
          _token: string
        }
        Returns: boolean
      }
      calculate_benchmark_percentiles: {
        Args: { p_run_id: string }
        Returns: {
          failure_count: number
          max_ms: number
          mean_ms: number
          min_ms: number
          p50_ms: number
          p95_ms: number
          p99_ms: number
          success_count: number
          total_requests: number
        }[]
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: number }
      cleanup_expired_cache: { Args: never; Returns: number }
      cleanup_expired_rate_limits: { Args: never; Returns: number }
      cleanup_old_empty_chats: {
        Args: { user_id_param?: string }
        Returns: {
          deleted_count: number
        }[]
      }
      cleanup_old_service_health: { Args: never; Returns: number }
      current_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      delete_expired_chats: {
        Args: { p_retention_days: number }
        Returns: number
      }
      find_similar_cached:
        | {
            Args: {
              p_mode: string
              p_response_mode: string
              query_embedding: string
              similarity_threshold?: number
            }
            Returns: {
              id: string
              response: string
              similarity: number
              sources: Json
            }[]
          }
        | {
            Args: {
              p_mode: string
              p_response_mode: string
              p_user_id?: string
              query_embedding: string
              similarity_threshold?: number
            }
            Returns: {
              hit_count: number
              id: string
              response: string
              similarity: number
              sources: Json
            }[]
          }
      force_logout_user_sessions: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_current_user_role: { Args: never; Returns: string }
      get_platform_setting: { Args: { setting_key: string }; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier_hash: string
          p_max_requests: number
          p_window_ms: number
        }
        Returns: {
          allowed: boolean
          current_count: number
          remaining: number
          reset_at: string
        }[]
      }
      lookup_invite_preview: { Args: { _token: string }; Returns: Json }
      match_document_chunks: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      primary_user_org: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "user" | "admin" | "superadmin"
      publish_state: "draft" | "published" | "archived"
      security_audit_event_type:
        | "login_success"
        | "login_failed"
        | "mfa_setup"
        | "mfa_disabled"
        | "role_changed"
        | "user_created"
        | "user_suspended"
        | "user_deleted"
        | "kb_source_added"
        | "kb_source_removed"
        | "kb_permission_changed"
        | "chat_flagged"
        | "chat_flag_reviewed"
        | "security_setting_changed"
        | "export_performed"
        | "password_reset"
        | "domain_added"
        | "domain_removed"
        | "access_rule_changed"
        | "prompt_injection_attempt"
        | "dlp_detected"
        | "file_upload_rejected"
        | "file_upload_blocked"
        | "access_blocked"
        | "edge_function_error"
        | "notification_actioned"
        | "advisor_escalation_suggested"
        | "option_generated"
        | "recommendation_made"
        | "risk_surfaced"
        | "assumption_named"
      user_role: "user" | "admin" | "superadmin"
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
      app_role: ["user", "admin", "superadmin"],
      publish_state: ["draft", "published", "archived"],
      security_audit_event_type: [
        "login_success",
        "login_failed",
        "mfa_setup",
        "mfa_disabled",
        "role_changed",
        "user_created",
        "user_suspended",
        "user_deleted",
        "kb_source_added",
        "kb_source_removed",
        "kb_permission_changed",
        "chat_flagged",
        "chat_flag_reviewed",
        "security_setting_changed",
        "export_performed",
        "password_reset",
        "domain_added",
        "domain_removed",
        "access_rule_changed",
        "prompt_injection_attempt",
        "dlp_detected",
        "file_upload_rejected",
        "file_upload_blocked",
        "access_blocked",
        "edge_function_error",
        "notification_actioned",
        "advisor_escalation_suggested",
        "option_generated",
        "recommendation_made",
        "risk_surfaced",
        "assumption_named",
      ],
      user_role: ["user", "admin", "superadmin"],
    },
  },
} as const
