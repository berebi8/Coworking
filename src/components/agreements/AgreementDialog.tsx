import React, { useState, useEffect } from 'react';
    import { X } from 'lucide-react';
    import { BasicInformation } from './form-sections/BasicInformation';
    import { LicenseTerms } from './form-sections/LicenseTerms';
    import { OfficeDetails } from './form-sections/OfficeDetails';
    import { ParkingDetails } from './form-sections/ParkingDetails';
    import { AdditionalServices } from './form-sections/AdditionalServices';
    import { TotalSummary } from './form-sections/TotalSummary';
    import { CreditAllotments } from './form-sections/CreditAllotments';
    import { SecurityDeposits } from './form-sections/SecurityDeposits';
    import { DeleteConfirmation } from './form-sections/DeleteConfirmation';
    import type { Agreement, AgreementFormData, Location, OfficeProperty, AddonService, NoticeRuleType } from '../../types/database'; // Added NoticeRuleType

    interface AgreementDialogProps {
      isOpen: boolean;
      onClose: () => void;
      onSave: (data: AgreementFormData) => void;
      onDelete?: (agreement: Agreement) => void;
      agreement?: Agreement;
      locations: Location[];
      availableOffices: OfficeProperty[];
      availableServices: AddonService[];
    }

    const initialFormData: AgreementFormData = {
      type: 'license',
      licensee_name: '',
      company_id: '',
      commercial_name: '',
      address: '',
      document_date: new Date().toISOString().split('T')[0],
      building: '',
      service_agreement_type: 'private_office',
      permitted_use: 'Office',
      start_date: new Date().toISOString().split('T')[0],
      first_fixed_term_duration: null,
      first_fixed_term_end_date: null,
      notice_period_fixed: 180, // Keep fixed term logic for now
      notice_period_fixed_current_month: false, // Keep fixed term logic for now
      continuous_term_duration: 'month-to-month',
      continuous_term_start_date: null,
      continuous_notice_rule: 'CLAUSE_4_4', // Default to clause 4.4
      continuous_notice_days: null, // Default days to null
      conference_room_credits: 0,
      print_credits_bw: 0,
      print_credits_color: 0,
      credit_notes: '',
      office_spaces: [{
        office_id: '',
        workstations: 1,
        list_price: 0,
        discount_percentage: 0,
        special_discount_percentage: 0
      }],
      parking_spaces: [],
      services: [],
      notes: '',
      has_fixed_term: true,
      payment_method: 'standing_order',
      security_deposit_fixed: 0,
      security_deposit_continuous: 0,
      security_deposit_fixed_override: null,
      security_deposit_continuous_override: null,
      primary_member_name: '',
      primary_member_title: '',
      primary_member_phone: '',
      primary_member_email: '',
      invoice_name: '',
      invoice_email: '',
      invoice_phone: ''
    };

    export function AgreementDialog({
      isOpen,
      onClose,
      onSave,
      onDelete,
      agreement,
      locations,
      availableOffices,
      availableServices
    }: AgreementDialogProps) {
      const [formData, setFormData] = useState<AgreementFormData>(initialFormData);
      const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        if (agreement) {
          // Map existing agreement data to the new form structure
          setFormData({
            type: agreement.type,
            licensee_name: agreement.licensee_name,
            company_id: agreement.company_id,
            commercial_name: agreement.commercial_name,
            address: agreement.address,
            document_date: agreement.document_date,
            building: agreement.building,
            service_agreement_type: agreement.service_agreement_type,
            permitted_use: agreement.permitted_use,
            start_date: agreement.start_date,
            first_fixed_term_duration: agreement.first_fixed_term_duration,
            first_fixed_term_end_date: agreement.first_fixed_term_end_date,
            notice_period_fixed: agreement.notice_period_fixed,
            notice_period_fixed_current_month: agreement.notice_period_fixed_current_month,
            continuous_term_duration: agreement.continuous_term_duration,
            continuous_term_start_date: agreement.continuous_term_start_date,
            continuous_notice_rule: agreement.continuous_notice_rule || 'CLAUSE_4_4', // Use new field, default if null
            continuous_notice_days: agreement.continuous_notice_days, // Use new field
            conference_room_credits: agreement.conference_room_credits,
            print_credits_bw: agreement.print_credits_bw,
            print_credits_color: agreement.print_credits_color,
            credit_notes: agreement.credit_notes || '',
            office_spaces: agreement.office_spaces?.map(space => ({
              office_id: space.office_id,
              workstations: space.workstations,
              list_price: space.list_price,
              discount_percentage: space.discount_percentage,
              special_discount_percentage: space.special_discount_percentage || 0
            })) || [initialFormData.office_spaces[0]],
            parking_spaces: agreement.parking_spaces?.map(space => ({
              parking_type: space.parking_type,
              list_price: space.list_price,
              quantity: space.quantity || 1, // Use quantity from data or default to 1
              discount_percentage: space.discount_percentage
            })) || [],
            services: agreement.services?.map(service => ({
              service_id: service.service_id,
              type: service.type,
              list_price: service.list_price,
              quantity: service.quantity || 1, // Use quantity from data or default to 1
              discount_percentage: service.discount_percentage
            })) || [],
            notes: agreement.notes || '',
            has_fixed_term: agreement.has_fixed_term,
            payment_method: agreement.payment_method || 'standing_order',
            primary_member_name: agreement.primary_member_name || '',
            primary_member_title: agreement.primary_member_title || '',
            primary_member_phone: agreement.primary_member_phone || '',
            primary_member_email: agreement.primary_member_email || '',
            invoice_name: agreement.invoice_name || '',
            invoice_email: agreement.invoice_email || '',
            invoice_phone: agreement.invoice_phone || '',
            conference_room_credits_override: agreement.conference_room_credits_override,
            print_credits_bw_override: agreement.print_credits_bw_override,
            print_credits_color_override: agreement.print_credits_color_override,
            security_deposit_fixed: agreement.security_deposit_fixed,
            security_deposit_continuous: agreement.security_deposit_continuous,
            security_deposit_fixed_override: agreement.security_deposit_fixed_override,
            security_deposit_continuous_override: agreement.security_deposit_continuous_override,
          });
        } else {
          setFormData(initialFormData);
        }
      }, [agreement]);

      // This useEffect remains largely the same, calculating continuous start date
      useEffect(() => {
        if (formData.has_fixed_term && formData.first_fixed_term_end_date) {
          const endDate = new Date(formData.first_fixed_term_end_date);
          const nextDay = new Date(endDate);
          nextDay.setDate(nextDay.getDate() + 1);

          setFormData(prev => ({
            ...prev,
            continuous_term_start_date: nextDay.toISOString().split('T')[0]
          }));
        } else if (!formData.has_fixed_term && formData.start_date) {
           // If only continuous term, start date is the continuous start date
          setFormData(prev => ({
            ...prev,
            continuous_term_start_date: prev.start_date
          }));
        }
      }, [formData.has_fixed_term, formData.first_fixed_term_end_date, formData.start_date]);


      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
          if (formData.office_spaces.length === 0 || !formData.office_spaces[0]?.office_id) {
            throw new Error('At least one office space with a selected office is required');
          }

          if (!formData.licensee_name || !formData.company_id || !formData.commercial_name) {
            throw new Error('Client information (Licensee Name, Company ID, Commercial Name) is required');
          }

          if (formData.continuous_notice_rule === 'CURRENT_MONTH_PLUS_DAYS' && (formData.continuous_notice_days === null || formData.continuous_notice_days < 0)) {
            throw new Error('Continuous notice days must be provided and non-negative when "Current month +" rule is selected.');
          }

          // Prepare data for saving, ensuring deprecated fields are not sent
          const dataToSave: AgreementFormData = { ...formData };
          // delete (dataToSave as any).notice_period_continuous; // Remove deprecated fields if they somehow exist
          // delete (dataToSave as any).notice_period_continuous_current_month;

          await onSave(dataToSave);
          onClose();
        } catch (error: any) {
          console.error("Save error:", error);
          setError(error.message || 'An error occurred while saving the agreement.');
        }
      };

      if (!isOpen) return null;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-text-primary">
                {agreement ? 'Edit Agreement' : 'Add New Agreement'}
              </h2>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Use a div instead of form here, handle submit via button onClick */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {error && (
                  <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
                    <p className="font-medium">Error:</p>
                    <p>{error}</p>
                  </div>
                )}

                <BasicInformation
                  formData={formData}
                  setFormData={setFormData}
                  availableLocations={locations}
                  docId={agreement?.doc_id} // Pass docId if editing
                />

                <LicenseTerms
                  formData={formData}
                  setFormData={setFormData}
                />

                <OfficeDetails
                  formData={formData}
                  setFormData={setFormData}
                  availableOffices={availableOffices}
                />

                <ParkingDetails
                  formData={formData}
                  setFormData={setFormData}
                />

                <AdditionalServices
                  formData={formData}
                  setFormData={setFormData}
                  availableServices={availableServices}
                />

                <TotalSummary formData={formData} />

                <CreditAllotments
                  formData={formData}
                  setFormData={setFormData}
                  availableOffices={availableOffices}
                />

                <SecurityDeposits
                  formData={formData}
                  setFormData={setFormData}
                />

                {agreement && onDelete && (
                  <DeleteConfirmation
                    showDeleteConfirm={showDeleteConfirm}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    onDelete={() => onDelete(agreement)}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button" // Changed from submit to button
                onClick={handleSubmit} // Trigger submit logic here
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      );
    }
