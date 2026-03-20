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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      prescriptions: {
        Row: {
          id: string
          hospital_id: string | null
          patient_id: string | null
          doctor_id: string | null
          doctor_name: string
          doctor_specialization: string | null
          admission_id: string | null
          appointment_id: string | null
          diagnosis: string
          general_instructions: string | null
          feedback_after_days: number
          feedback_requested: boolean | null
          feedback_deadline_date: string | null
          status: string | null
          prescription_date: string
          valid_until: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          hospital_id?: string | null
          patient_id?: string | null
          doctor_id?: string | null
          doctor_name: string
          doctor_specialization?: string | null
          admission_id?: string | null
          appointment_id?: string | null
          diagnosis: string
          general_instructions?: string | null
          feedback_after_days?: number
          feedback_requested?: boolean | null
          feedback_deadline_date?: string | null
          status?: string | null
          prescription_date?: string
          valid_until?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          hospital_id?: string | null
          patient_id?: string | null
          doctor_id?: string | null
          doctor_name?: string
          doctor_specialization?: string | null
          admission_id?: string | null
          appointment_id?: string | null
          diagnosis?: string
          general_instructions?: string | null
          feedback_after_days?: number
          feedback_requested?: boolean | null
          feedback_deadline_date?: string | null
          status?: string | null
          prescription_date?: string
          valid_until?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      prescription_medicines: {
        Row: {
          id: string
          prescription_id: string | null
          patient_id: string | null
          medicine_name: string
          dosage: string
          medicine_form: string | null
          times_per_day: number
          schedule: Json
          duration_days: number | null
          start_date: string | null
          end_date: string | null
          special_instructions: string | null
          is_active: boolean | null
          stopped_reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          prescription_id?: string | null
          patient_id?: string | null
          medicine_name: string
          dosage: string
          medicine_form?: string | null
          times_per_day?: number
          schedule?: Json
          duration_days?: number | null
          start_date?: string | null
          end_date?: string | null
          special_instructions?: string | null
          is_active?: boolean | null
          stopped_reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          prescription_id?: string | null
          patient_id?: string | null
          medicine_name?: string
          dosage?: string
          medicine_form?: string | null
          times_per_day?: number
          schedule?: Json
          duration_days?: number | null
          start_date?: string | null
          end_date?: string | null
          special_instructions?: string | null
          is_active?: boolean | null
          stopped_reason?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rx_meds_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      prescription_feedback: {
        Row: {
          id: string
          prescription_id: string | null
          patient_id: string | null
          hospital_id: string | null
          doctor_id: string | null
          improvement_rating: number | null
          adherence_rating: string | null
          had_side_effects: boolean | null
          side_effects: string[] | null
          side_effect_severity: string | null
          medicine_feedback: Json | null
          patient_notes: string | null
          continue_recommended: boolean | null
          symptoms_resolved: boolean | null
          pain_level_before: number | null
          pain_level_after: number | null
          patient_age: number | null
          patient_gender: string | null
          patient_blood_group: string | null
          submitted_at: string | null
          is_read: boolean | null
          read_at: string | null
        }
        Insert: {
          id?: string
          prescription_id?: string | null
          patient_id?: string | null
          hospital_id?: string | null
          doctor_id?: string | null
          improvement_rating?: number | null
          adherence_rating?: string | null
          had_side_effects?: boolean | null
          side_effects?: string[] | null
          side_effect_severity?: string | null
          medicine_feedback?: Json | null
          patient_notes?: string | null
          continue_recommended?: boolean | null
          symptoms_resolved?: boolean | null
          pain_level_before?: number | null
          pain_level_after?: number | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_blood_group?: string | null
          submitted_at?: string | null
          is_read?: boolean | null
          read_at?: string | null
        }
        Update: {
          id?: string
          prescription_id?: string | null
          patient_id?: string | null
          hospital_id?: string | null
          doctor_id?: string | null
          improvement_rating?: number | null
          adherence_rating?: string | null
          had_side_effects?: boolean | null
          side_effects?: string[] | null
          side_effect_severity?: string | null
          medicine_feedback?: Json | null
          patient_notes?: string | null
          continue_recommended?: boolean | null
          symptoms_resolved?: boolean | null
          pain_level_before?: number | null
          pain_level_after?: number | null
          patient_age?: number | null
          patient_gender?: string | null
          patient_blood_group?: string | null
          submitted_at?: string | null
          is_read?: boolean | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rx_fb_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          notes: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      hospital_beds: {
        Row: {
          admitted_at: string | null
          bed_number: string
          bed_type: string | null
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string | null
          status: string | null
          updated_at: string | null
          ward_name: string
        }
        Insert: {
          admitted_at?: string | null
          bed_number: string
          bed_type?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string | null
          updated_at?: string | null
          ward_name: string
        }
        Update: {
          admitted_at?: string | null
          bed_number?: string
          bed_type?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string | null
          updated_at?: string | null
          ward_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_beds_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_beds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_bills: {
        Row: {
          balance: number | null
          bill_date: string | null
          bill_number: string | null
          claim_status: string | null
          discount: number | null
          hospital_id: string
          id: string
          insurance_claim: boolean | null
          insurer_name: string | null
          notes: string | null
          paid_amount: number | null
          patient_id: string | null
          payment_status: string | null
          services: Json | null
          subtotal: number | null
          total: number | null
        }
        Insert: {
          balance?: number | null
          bill_date?: string | null
          bill_number?: string | null
          claim_status?: string | null
          discount?: number | null
          hospital_id: string
          id?: string
          insurance_claim?: boolean | null
          insurer_name?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string | null
          payment_status?: string | null
          services?: Json | null
          subtotal?: number | null
          total?: number | null
        }
        Update: {
          balance?: number | null
          bill_date?: string | null
          bill_number?: string | null
          claim_status?: string | null
          discount?: number | null
          hospital_id?: string
          id?: string
          insurance_claim?: boolean | null
          insurer_name?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string | null
          payment_status?: string | null
          services?: Json | null
          subtotal?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_bills_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_bills_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_documents: {
        Row: {
          doc_name: string
          doc_type: string | null
          expiry_date: string | null
          file_url: string | null
          hospital_id: string
          id: string
          issue_date: string | null
          issued_by: string | null
          status: string | null
          uploaded_at: string | null
        }
        Insert: {
          doc_name: string
          doc_type?: string | null
          expiry_date?: string | null
          file_url?: string | null
          hospital_id: string
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          status?: string | null
          uploaded_at?: string | null
        }
        Update: {
          doc_name?: string
          doc_type?: string | null
          expiry_date?: string | null
          file_url?: string | null
          hospital_id?: string
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          status?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_documents_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_inventory: {
        Row: {
          category: string | null
          expiry_date: string | null
          hospital_id: string
          id: string
          item_name: string
          last_restocked: string | null
          min_threshold: number | null
          quantity: number | null
          supplier: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          expiry_date?: string | null
          hospital_id: string
          id?: string
          item_name: string
          last_restocked?: string | null
          min_threshold?: number | null
          quantity?: number | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          expiry_date?: string | null
          hospital_id?: string
          id?: string
          item_name?: string
          last_restocked?: string | null
          min_threshold?: number | null
          quantity?: number | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_inventory_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_patients: {
        Row: {
          admitted_at: string | null
          assigned_nurse: string | null
          assigned_nurse_id: string | null
          bed_number: string | null
          created_at: string | null
          diagnosis: string | null
          discharge_condition: string | null
          discharge_summary: string | null
          discharged_at: string | null
          follow_up_date: string | null
          follow_up_doctor: string | null
          hospital_id: string
          id: string
          notes: Json | null
          patient_id: string
          relationship_type: string | null
          treating_doctor: string | null
          treating_doctor_id: string | null
          updated_at: string | null
          ward: string | null
        }
        Insert: {
          admitted_at?: string | null
          assigned_nurse?: string | null
          assigned_nurse_id?: string | null
          bed_number?: string | null
          created_at?: string | null
          diagnosis?: string | null
          discharge_condition?: string | null
          discharge_summary?: string | null
          discharged_at?: string | null
          follow_up_date?: string | null
          follow_up_doctor?: string | null
          hospital_id: string
          id?: string
          notes?: Json | null
          patient_id: string
          relationship_type?: string | null
          treating_doctor?: string | null
          treating_doctor_id?: string | null
          updated_at?: string | null
          ward?: string | null
        }
        Update: {
          admitted_at?: string | null
          assigned_nurse?: string | null
          assigned_nurse_id?: string | null
          bed_number?: string | null
          created_at?: string | null
          diagnosis?: string | null
          discharge_condition?: string | null
          discharge_summary?: string | null
          discharged_at?: string | null
          follow_up_date?: string | null
          follow_up_doctor?: string | null
          hospital_id?: string
          id?: string
          notes?: Json | null
          patient_id?: string
          relationship_type?: string | null
          treating_doctor?: string | null
          treating_doctor_id?: string | null
          updated_at?: string | null
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_patients_assigned_nurse_id_fkey"
            columns: ["assigned_nurse_id"]
            isOneToOne: false
            referencedRelation: "hospital_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_patients_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_patients_treating_doctor_id_fkey"
            columns: ["treating_doctor_id"]
            isOneToOne: false
            referencedRelation: "hospital_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_staff: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          hospital_id: string
          id: string
          is_on_duty: boolean | null
          joined_date: string | null
          phone: string | null
          photo_url: string | null
          registration_no: string | null
          role: string
          shift: string | null
          specialization: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          hospital_id: string
          id?: string
          is_on_duty?: boolean | null
          joined_date?: string | null
          phone?: string | null
          photo_url?: string | null
          registration_no?: string | null
          role: string
          shift?: string | null
          specialization?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          hospital_id?: string
          id?: string
          is_on_duty?: boolean | null
          joined_date?: string | null
          phone?: string | null
          photo_url?: string | null
          registration_no?: string | null
          role?: string
          shift?: string | null
          specialization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_staff_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          admin_designation: string | null
          admin_email: string
          admin_name: string | null
          ambulances: number | null
          blood_bank: boolean | null
          city: string | null
          custom_specializations: string[] | null
          email: string
          email_verified: boolean | null
          emergency_24x7: boolean | null
          emergency_helpline: string | null
          facility_type: string | null
          general_ward_beds: number | null
          hospital_name: string
          icu_beds: number | null
          id: string
          latitude: number | null
          license_document_url: string | null
          license_id: string
          logo_url: string | null
          longitude: number | null
          maps_link: string | null
          operation_theatres: number | null
          pharmacy: boolean | null
          phone: string | null
          phone_verified: boolean | null
          pin_code: string | null
          private_rooms: number | null
          registered_at: string | null
          specializations: string[] | null
          state: string | null
          supabase_user_id: string
          support_staff: number | null
          total_beds: number | null
          total_doctors: number | null
          total_nurses: number | null
          two_fa_completed: boolean | null
          updated_at: string | null
          verification_status: string | null
          website: string | null
          year_established: number | null
        }
        Insert: {
          address?: string | null
          admin_designation?: string | null
          admin_email: string
          admin_name?: string | null
          ambulances?: number | null
          blood_bank?: boolean | null
          city?: string | null
          custom_specializations?: string[] | null
          email: string
          email_verified?: boolean | null
          emergency_24x7?: boolean | null
          emergency_helpline?: string | null
          facility_type?: string | null
          general_ward_beds?: number | null
          hospital_name: string
          icu_beds?: number | null
          id?: string
          latitude?: number | null
          license_document_url?: string | null
          license_id: string
          logo_url?: string | null
          longitude?: number | null
          maps_link?: string | null
          operation_theatres?: number | null
          pharmacy?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          pin_code?: string | null
          private_rooms?: number | null
          registered_at?: string | null
          specializations?: string[] | null
          state?: string | null
          supabase_user_id: string
          support_staff?: number | null
          total_beds?: number | null
          total_doctors?: number | null
          total_nurses?: number | null
          two_fa_completed?: boolean | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
          year_established?: number | null
        }
        Update: {
          address?: string | null
          admin_designation?: string | null
          admin_email?: string
          admin_name?: string | null
          ambulances?: number | null
          blood_bank?: boolean | null
          city?: string | null
          custom_specializations?: string[] | null
          email?: string
          email_verified?: boolean | null
          emergency_24x7?: boolean | null
          emergency_helpline?: string | null
          facility_type?: string | null
          general_ward_beds?: number | null
          hospital_name?: string
          icu_beds?: number | null
          id?: string
          latitude?: number | null
          license_document_url?: string | null
          license_id?: string
          logo_url?: string | null
          longitude?: number | null
          maps_link?: string | null
          operation_theatres?: number | null
          pharmacy?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          pin_code?: string | null
          private_rooms?: number | null
          registered_at?: string | null
          specializations?: string[] | null
          state?: string | null
          supabase_user_id?: string
          support_staff?: number | null
          total_beds?: number | null
          total_doctors?: number | null
          total_nurses?: number | null
          two_fa_completed?: boolean | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
          year_established?: number | null
        }
        Relationships: []
      }
      patient_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string | null
          appointment_type: string | null
          booked_by: string | null
          cancellation_reason: string | null
          created_at: string | null
          doctor_name: string
          hospital_id: string | null
          hospital_name: string | null
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          specialization: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time?: string | null
          appointment_type?: string | null
          booked_by?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          doctor_name: string
          hospital_id?: string | null
          hospital_name?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string | null
          appointment_type?: string | null
          booked_by?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          doctor_name?: string
          hospital_id?: string | null
          hospital_name?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_created_by_hospital: {
        Row: {
          created_by_staff: string | null
          hospital_id: string | null
          id: string
          invite_sent_at: string | null
          notes: string | null
          password_set: boolean | null
          password_set_at: string | null
          patient_id: string | null
        }
        Insert: {
          created_by_staff?: string | null
          hospital_id?: string | null
          id?: string
          invite_sent_at?: string | null
          notes?: string | null
          password_set?: boolean | null
          password_set_at?: string | null
          patient_id?: string | null
        }
        Update: {
          created_by_staff?: string | null
          hospital_id?: string | null
          id?: string
          invite_sent_at?: string | null
          notes?: string | null
          password_set?: boolean | null
          password_set_at?: string | null
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_created_by_hospital_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_created_by_hospital_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_medications: {
        Row: {
          created_at: string | null
          doctor_reg_no: string | null
          dosage: string | null
          duration_type: string | null
          end_date: string | null
          frequency: string | null
          generic_name: string | null
          id: string
          is_active: boolean | null
          medicine_name: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          start_date: string | null
          time_of_day: string[] | null
        }
        Insert: {
          created_at?: string | null
          doctor_reg_no?: string | null
          dosage?: string | null
          duration_type?: string | null
          end_date?: string | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          is_active?: boolean | null
          medicine_name: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          start_date?: string | null
          time_of_day?: string[] | null
        }
        Update: {
          created_at?: string | null
          doctor_reg_no?: string | null
          dosage?: string | null
          duration_type?: string | null
          end_date?: string | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          is_active?: boolean | null
          medicine_name?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          start_date?: string | null
          time_of_day?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_reports: {
        Row: {
          ai_summary: string | null
          doctor_name: string | null
          file_type: string | null
          file_url: string | null
          hospital_name: string | null
          id: string
          is_abnormal: boolean | null
          patient_id: string
          report_date: string | null
          report_name: string
          report_type: string
          uploaded_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          doctor_name?: string | null
          file_type?: string | null
          file_url?: string | null
          hospital_name?: string | null
          id?: string
          is_abnormal?: boolean | null
          patient_id: string
          report_date?: string | null
          report_name: string
          report_type: string
          uploaded_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          doctor_name?: string | null
          file_type?: string | null
          file_url?: string | null
          hospital_name?: string | null
          id?: string
          is_abnormal?: boolean | null
          patient_id?: string
          report_date?: string | null
          report_name?: string
          report_type?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_treatments: {
        Row: {
          activity_restrictions: string[] | null
          admission_allergies: string[] | null
          admission_id: string | null
          assigned_doctor: string | null
          assigned_doctor_id: string | null
          assigned_nurse: string | null
          assigned_nurse_id: string | null
          created_at: string | null
          current_disease: string | null
          dietary_restrictions: string[] | null
          disease_severity: string | null
          hospital_id: string | null
          id: string
          last_updated_at: string | null
          last_updated_by: string | null
          medications_to_avoid: string[] | null
          other_instructions: string | null
          patient_id: string | null
          prescribed_medicines: Json | null
          treatment_plan: string | null
        }
        Insert: {
          activity_restrictions?: string[] | null
          admission_allergies?: string[] | null
          admission_id?: string | null
          assigned_doctor?: string | null
          assigned_doctor_id?: string | null
          assigned_nurse?: string | null
          assigned_nurse_id?: string | null
          created_at?: string | null
          current_disease?: string | null
          dietary_restrictions?: string[] | null
          disease_severity?: string | null
          hospital_id?: string | null
          id?: string
          last_updated_at?: string | null
          last_updated_by?: string | null
          medications_to_avoid?: string[] | null
          other_instructions?: string | null
          patient_id?: string | null
          prescribed_medicines?: Json | null
          treatment_plan?: string | null
        }
        Update: {
          activity_restrictions?: string[] | null
          admission_allergies?: string[] | null
          admission_id?: string | null
          assigned_doctor?: string | null
          assigned_doctor_id?: string | null
          assigned_nurse?: string | null
          assigned_nurse_id?: string | null
          created_at?: string | null
          current_disease?: string | null
          dietary_restrictions?: string[] | null
          disease_severity?: string | null
          hospital_id?: string | null
          id?: string
          last_updated_at?: string | null
          last_updated_by?: string | null
          medications_to_avoid?: string[] | null
          other_instructions?: string | null
          patient_id?: string | null
          prescribed_medicines?: Json | null
          treatment_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "hospital_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "hospital_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_assigned_nurse_id_fkey"
            columns: ["assigned_nurse_id"]
            isOneToOne: false
            referencedRelation: "hospital_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vitals: {
        Row: {
          id: string
          notes: string | null
          patient_id: string
          reading_context: string | null
          reading_unit: string | null
          reading_value: string
          recorded_at: string | null
          vital_type: string
        }
        Insert: {
          id?: string
          notes?: string | null
          patient_id: string
          reading_context?: string | null
          reading_unit?: string | null
          reading_value: string
          recorded_at?: string | null
          vital_type: string
        }
        Update: {
          id?: string
          notes?: string | null
          patient_id?: string
          reading_context?: string | null
          reading_unit?: string | null
          reading_value?: string
          recorded_at?: string | null
          vital_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          aadhaar_number: string | null
          aadhaar_verified: boolean | null
          abha_card_no: string | null
          abha_id: string | null
          address: string | null
          age: number | null
          allergies: string[] | null
          ayushman_beneficiary_id: string | null
          ayushman_bharat_enrolled: boolean | null
          blood_group: string | null
          chronic_conditions: string[] | null
          city: string | null
          created_at: string | null
          current_medications: string[] | null
          date_of_birth: string | null
          disabilities: string[] | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          full_name: string
          gender: string | null
          has_insurance: boolean | null
          id: string
          insurance_card_url: string | null
          insurance_policy_no: string | null
          insurance_provider: string | null
          insurance_type: string | null
          insurance_validity_date: string | null
          organ_donor: boolean | null
          past_surgeries: string[] | null
          past_treatments: Json | null
          phone: string | null
          pin_code: string | null
          profile_photo_url: string | null
          state: string | null
          state_scheme_id: string | null
          state_scheme_name: string | null
          sum_insured: string | null
          supabase_user_id: string
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          aadhaar_verified?: boolean | null
          abha_card_no?: string | null
          abha_id?: string | null
          address?: string | null
          age?: number | null
          allergies?: string[] | null
          ayushman_beneficiary_id?: string | null
          ayushman_bharat_enrolled?: boolean | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          city?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          date_of_birth?: string | null
          disabilities?: string[] | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          full_name: string
          gender?: string | null
          has_insurance?: boolean | null
          id?: string
          insurance_card_url?: string | null
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          insurance_type?: string | null
          insurance_validity_date?: string | null
          organ_donor?: boolean | null
          past_surgeries?: string[] | null
          past_treatments?: Json | null
          phone?: string | null
          pin_code?: string | null
          profile_photo_url?: string | null
          state?: string | null
          state_scheme_id?: string | null
          state_scheme_name?: string | null
          sum_insured?: string | null
          supabase_user_id: string
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          aadhaar_verified?: boolean | null
          abha_card_no?: string | null
          abha_id?: string | null
          address?: string | null
          age?: number | null
          allergies?: string[] | null
          ayushman_beneficiary_id?: string | null
          ayushman_bharat_enrolled?: boolean | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          city?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          date_of_birth?: string | null
          disabilities?: string[] | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          full_name?: string
          gender?: string | null
          has_insurance?: boolean | null
          id?: string
          insurance_card_url?: string | null
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          insurance_type?: string | null
          insurance_validity_date?: string | null
          organ_donor?: boolean | null
          past_surgeries?: string[] | null
          past_treatments?: Json | null
          phone?: string | null
          pin_code?: string | null
          profile_photo_url?: string | null
          state?: string | null
          state_scheme_id?: string | null
          state_scheme_name?: string | null
          sum_insured?: string | null
          supabase_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_scan_logs: {
        Row: {
          action_taken: string | null
          hospital_id: string | null
          id: string
          patient_id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          scan_location: string | null
          scanned_at: string | null
          scanned_by: string | null
        }
        Insert: {
          action_taken?: string | null
          hospital_id?: string | null
          id?: string
          patient_id: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          scan_location?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
        }
        Update: {
          action_taken?: string | null
          hospital_id?: string | null
          id?: string
          patient_id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          scan_location?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scan_logs_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scan_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_notes: {
        Row: {
          created_at: string | null
          hospital_id: string | null
          id: string
          note: string
          patient_id: string
          staff_id: string | null
          staff_name: string
          staff_role: string | null
        }
        Insert: {
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          note: string
          patient_id: string
          staff_id?: string | null
          staff_name: string
          staff_role?: string | null
        }
        Update: {
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          note?: string
          patient_id?: string
          staff_id?: string | null
          staff_name?: string
          staff_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_notes_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_notes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "hospital_staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
