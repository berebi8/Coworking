import type { AgreementFormData } from '../types/database';

interface ValidationResult {
  isValid: boolean;
  errors: {
    [key: string]: string;
  };
}

export function validateAgreementForm(data: AgreementFormData): ValidationResult {
  const errors: { [key: string]: string } = {};

  // Basic Information
  if (!data.licensor_name) errors.licensor_name = 'Licensor name is required';
  if (!data.licensee_name) errors.licensee_name = 'Licensee name is required';
  if (!data.company_id) errors.company_id = 'Company ID is required';
  if (!data.commercial_name) errors.commercial_name = 'Commercial name is required';
  if (!data.address) errors.address = 'Address is required';
  if (!data.document_date) errors.document_date = 'Document date is required';
  if (!data.building) errors.building = 'Building is required';

  // License Terms
  if (!data.start_date) {
    errors.start_date = 'Start date is required';
  } else {
    const startDate = new Date(data.start_date);
    if (startDate < new Date()) {
      errors.start_date = 'Start date cannot be in the past';
    }
  }

  if (data.first_fixed_term_duration !== null) {
    if (data.first_fixed_term_duration <= 0) {
      errors.first_fixed_term_duration = 'Fixed term duration must be greater than 0';
    }
  }

  if (data.notice_period_fixed <= 0) {
    errors.notice_period_fixed = 'Notice period must be greater than 0';
  }

  if (data.notice_period_continuous <= 0) {
    errors.notice_period_continuous = 'Notice period must be greater than 0';
  }

  // Office Spaces
  if (data.office_spaces.length === 0) {
    errors.office_spaces = 'At least one office space is required';
  } else {
    data.office_spaces.forEach((space, index) => {
      if (!space.office_id) {
        errors[`office_spaces.${index}.office_id`] = 'Office selection is required';
      }
      if (space.workstations <= 0) {
        errors[`office_spaces.${index}.workstations`] = 'Workstations must be greater than 0';
      }
      if (space.list_price < 0) {
        errors[`office_spaces.${index}.list_price`] = 'List price cannot be negative';
      }
      if (space.discount_percentage < 0 || space.discount_percentage > 100) {
        errors[`office_spaces.${index}.discount_percentage`] = 'Discount must be between 0 and 100';
      }
    });
  }

  // Parking Spaces
  data.parking_spaces.forEach((space, index) => {
    if (!space.parking_type) {
      errors[`parking_spaces.${index}.parking_type`] = 'Parking type is required';
    }
    if (space.list_price < 0) {
      errors[`parking_spaces.${index}.list_price`] = 'List price cannot be negative';
    }
    if (space.discount_percentage < 0 || space.discount_percentage > 100) {
      errors[`parking_spaces.${index}.discount_percentage`] = 'Discount must be between 0 and 100';
    }
  });

  // Services
  data.services.forEach((service, index) => {
    if (!service.service_id) {
      errors[`services.${index}.service_id`] = 'Service selection is required';
    }
    if (service.list_price < 0) {
      errors[`services.${index}.list_price`] = 'List price cannot be negative';
    }
    if (service.discount_percentage < 0 || service.discount_percentage > 100) {
      errors[`services.${index}.discount_percentage`] = 'Discount must be between 0 and 100';
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
