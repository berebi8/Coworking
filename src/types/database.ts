// Enums
    export type UserStatus = 'active' | 'inactive' | 'deleted';
    export type LocationStatus = 'active' | 'inactive' | 'deleted';
    export type OfficeStatus = 'active' | 'inactive' | 'deleted';
    export type ClientStatus = 'active' | 'inactive';
    export type AddonServiceStatus = 'active' | 'inactive' | 'deleted';
    export type TerminationNoticeStatus = 'draft' | 'active' | 'cancelled'; // Removed 'completed'
    // AgreementStatus: 'signed' is considered the active state for filtering
    export type AgreementStatus = 'draft' | 'draft_approved' | 'signed' | 'cancelled';
    export type AgreementType = 'license' | 'addendum' | 'termination';
    export type ServiceAgreementType = 'hot_desk' | 'private_office';
    export type OfficeType = 'hot_desk' | 'office';
    export type OfficeViewType = 'sea_view' | 'city_view' | 'internal';
    export type AddonServiceType =
      | 'amenities'
      | 'parking_ev'
      | 'parking_reserved'
      | 'parking_unassigned'
      | 'parking_vip'
      | 'room'
      | 'storage'
      | 'support'
      | 'technology';
    export type NoticeRuleType = 'CLAUSE_4_4' | 'CURRENT_MONTH_PLUS_DAYS'; // New type

    // Base interfaces
    export interface AppUser {
      id: string;
      username: string;
      full_name: string;
      email: string | null;
      masked_email: string | null;
      role: 'Admin' | 'Finance Manager' | 'Coworking Manager' | 'Client';
      notes: string | null;
      status: UserStatus;
      last_login: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    }

    export interface Location {
      id: string;
      name: string;
      location_id: string;
      notes: string | null;
      status: LocationStatus;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      floors?: LocationFloor[];
    }

    export interface OfficeProperty {
      id: string;
      location_id: string;
      floor: number;
      office_id: string;
      office_type: OfficeType;
      default_ws: number;
      list_price: number;
      mr_credits: number;
      print_quota_bw: number;
      print_quota_color: number;
      view_type: OfficeViewType;
      additional_desk_price: number;
      max_ws: number;
      notes: string | null;
      status: OfficeStatus;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      location?: Location;
    }

    export interface AddonService {
      id: string;
      name: string;
      type: AddonServiceType;
      is_incidental: boolean;
      list_price: number;
      quantity: number | null;
      locations: string[];
      notes: string | null;
      status: AddonServiceStatus;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    }

    export interface Client {
      id: string;
      name: string;
      company_id: string;
      commercial_name: string;
      sap_number: string;
      primary_contact_name: string | null;
      primary_contact_email: string | null;
      primary_contact_phone: string | null;
      location: string | null;
      notes: string | null;
      status: ClientStatus;
      created_at: string;
      updated_at: string;
    }

    export interface TerminationNotice {
      id: string;
      doc_id: string;
      company_id: string;
      notice_date: string;
      recipient_id: string;
      expected_end_date: string;
      override_end_date: string | null;
      notes: string | null;
      status: TerminationNoticeStatus;
      created_at: string;
      updated_at: string;
      created_by: string;
      updated_by: string;
      // Nested data from joins
      recipient?: Pick<AppUser, 'id' | 'username'>; // Only include needed fields
      client?: Pick<Client, 'id' | 'company_id' | 'commercial_name'>; // Only include needed fields
    }

    export interface Agreement {
      id: string;
      doc_id: string;
      type: AgreementType;
      status: AgreementStatus;
      licensee_name: string;
      company_id: string;
      commercial_name: string;
      address: string;
      document_date: string;
      building: string;
      service_agreement_type: ServiceAgreementType;
      permitted_use: string;
      start_date: string;
      first_fixed_term_duration: number | null;
      first_fixed_term_end_date: string | null;
      notice_period_fixed: number;
      continuous_term_duration: string; // Should likely remain 'month-to-month' or similar
      continuous_term_start_date: string | null;
      // notice_period_continuous: number; // Deprecated
      // notice_period_continuous_current_month: boolean; // Deprecated
      continuous_notice_rule: NoticeRuleType; // New field
      continuous_notice_days: number | null; // New field
      conference_room_credits: number;
      print_credits_bw: number;
      print_credits_color: number;
      credit_notes: string | null;
      office_license_fees_total: number;
      monthly_payment_fixed_term: number;
      security_deposit_fixed: number;
      security_deposit_continuous: number;
      total_monthly_payment: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
      created_by: string | null;
      updated_by: string | null;
      payment_method: string | null;
      primary_member_name: string | null;
      primary_member_title: string | null;
      primary_member_phone: string | null;
      primary_member_email: string | null;
      invoice_name: string | null;
      invoice_email: string | null;
      invoice_phone: string | null;
      has_fixed_term: boolean;
      notice_period_fixed_current_month: boolean;
      conference_room_credits_override: number | null;
      print_credits_bw_override: number | null;
      print_credits_color_override: number | null;
      security_deposit_fixed_override: number | null;
      security_deposit_continuous_override: number | null;
      parking_fees_total: number;
      service_fees_total: number;
      office_spaces: any[];
      parking_spaces: any[];
      services: any[];
      // Fields from agreement_calculated_view
      client_name?: string;
      client_sap_number?: string;
      client_contact_name?: string;
      client_contact_email?: string;
      client_contact_phone?: string;
      client_location?: string;
      client_status?: ClientStatus;
      calculated_office_spaces?: any[];
      calculated_parking_spaces?: any[];
      calculated_services?: any[];
      calculated_office_fees?: number;
      calculated_parking_fees?: number;
      calculated_service_fees?: number;
      credits_summary?: {
        conference_room_credits: number;
        print_credits_bw: number;
        print_credits_color: number;
        has_overrides: boolean;
      };
      calculated_line_items?: any[];
    }

    // Form data interfaces
    export interface LocationFloor {
      id?: string;
      location_id?: string;
      floor_number: number;
      notes?: string | null;
      status?: LocationStatus;
    }

    export interface LocationFormData {
      name: string;
      location_id: string;
      notes: string;
      status: LocationStatus;
      floors: LocationFloor[];
    }

    export interface UserFormData {
      username: string;
      full_name: string;
      email: string;
      role: AppUser['role'];
      notes: string;
      status: UserStatus;
    }

    export interface OfficeFormData {
      location_id: string;
      floor: number;
      office_id: string;
      office_type: OfficeType;
      default_ws: number;
      list_price: number;
      mr_credits: number;
      print_quota_bw: number;
      print_quota_color: number;
      view_type: OfficeViewType;
      additional_desk_price: number;
      max_ws: number;
      notes: string;
      status: OfficeStatus;
    }

    export interface AddonServiceFormData {
      name: string;
      type?: AddonServiceType; // Make type optional in form data
      is_incidental: boolean;
      list_price: number;
      quantity: number | null;
      locations: string[];
      notes: string;
      status: AddonServiceStatus;
    }

    export interface ClientFormData {
      name: string;
      company_id: string;
      commercial_name: string;
      sap_number: string;
      primary_contact_name: string;
      primary_contact_email: string;
      primary_contact_phone: string;
      location: string;
      notes: string;
      status: ClientStatus;
    }

    export interface TerminationNoticeFormData {
      company_id: string;
      notice_date: string;
      recipient_id: string;
      expected_end_date: string;
      override_end_date?: string;
      notes: string;
      status: TerminationNoticeStatus;
    }

    export interface AgreementFormData {
      type: AgreementType;
      licensee_name: string;
      company_id: string;
      commercial_name: string;
      address: string;
      document_date: string;
      building: string;
      service_agreement_type: ServiceAgreementType;
      permitted_use: string;
      start_date: string;
      first_fixed_term_duration: number | null;
      first_fixed_term_end_date: string | null;
      notice_period_fixed: number;
      continuous_term_duration: string;
      continuous_term_start_date: string | null;
      // notice_period_continuous: number; // Deprecated
      // notice_period_continuous_current_month: boolean; // Deprecated
      continuous_notice_rule: NoticeRuleType; // New field
      continuous_notice_days: number | null; // New field
      conference_room_credits: number;
      print_credits_bw: number;
      print_credits_color: number;
      credit_notes: string;
      office_spaces: any[];
      parking_spaces: any[];
      services: any[];
      notes: string;
      has_fixed_term: boolean;
      notice_period_fixed_current_month: boolean;
      payment_method?: string;
      primary_member_name?: string;
      primary_member_title?: string;
      primary_member_phone?: string;
      primary_member_email?: string;
      invoice_name?: string;
      invoice_email?: string;
      invoice_phone?: string;
      conference_room_credits_override?: number | null;
      print_credits_bw_override?: number | null;
      print_credits_color_override?: number | null;
      security_deposit_fixed?: number;
      security_deposit_continuous?: number;
      security_deposit_fixed_override?: number | null;
      security_deposit_continuous_override?: number | null;
    }
