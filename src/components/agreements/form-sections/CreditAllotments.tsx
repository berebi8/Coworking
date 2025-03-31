import React, { useEffect, useCallback } from 'react';
import type { AgreementFormData, OfficeProperty } from '../../../types/database';

interface CreditAllotmentsProps {
  formData: AgreementFormData;
  setFormData: (data: AgreementFormData) => void;
  availableOffices: OfficeProperty[];
}

export function CreditAllotments({ formData, setFormData, availableOffices }: CreditAllotmentsProps) {
  // Calculate total credits from selected offices - memoize this function
  const calculateTotalCredits = useCallback(() => {
    return formData.office_spaces.reduce((totals, space) => {
      // Get the office details from the selected office
      const office = availableOffices.find(o => o.id === space.office_id);
      if (office) {
        totals.mr_credits += (office.mr_credits || 0);
        totals.print_bw += (office.print_quota_bw || 0);
        totals.print_color += (office.print_quota_color || 0);
      }
      return totals;
    }, { mr_credits: 0, print_bw: 0, print_color: 0 });
  }, [formData.office_spaces, availableOffices]);

  // Update credits when offices change
  useEffect(() => {
    if (formData.office_spaces.length === 0 || availableOffices.length === 0) {
      return; // Skip calculation if no data
    }
    
    const totals = calculateTotalCredits();

    // Create a copy of the form data to make updates
    const updatedFormData = { ...formData };
    let hasChanges = false;
    
    // Initialize override fields if they don't exist yet
    if (updatedFormData.conference_room_credits_override === undefined) {
      updatedFormData.conference_room_credits_override = null;
    }
    
    if (updatedFormData.print_credits_bw_override === undefined) {
      updatedFormData.print_credits_bw_override = null;
    }
    
    if (updatedFormData.print_credits_color_override === undefined) {
      updatedFormData.print_credits_color_override = null;
    }
    
    // Only update if there are no manual overrides
    if (updatedFormData.conference_room_credits_override === null) {
      updatedFormData.conference_room_credits = totals.mr_credits;
      hasChanges = true;
    }
    
    if (updatedFormData.print_credits_bw_override === null) {
      updatedFormData.print_credits_bw = totals.print_bw;
      hasChanges = true;
    }
    
    if (updatedFormData.print_credits_color_override === null) {
      updatedFormData.print_credits_color = totals.print_color;
      hasChanges = true;
    }
    
    // Only update form data if changes were made
    if (hasChanges) {
      setFormData(updatedFormData);
    }
  }, [formData, setFormData, availableOffices, calculateTotalCredits]);

  // Simple function to handle changes to an input field
  const handleInputChange = (field: string, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    const overrideField = `${field}_override`;
    
    const updatedData = { ...formData };
    
    // Set the override field
    updatedData[overrideField] = numValue;
    
    // If an override is set, use that value, otherwise use calculated
    const calculatedTotals = calculateTotalCredits();
    if (field === 'conference_room_credits') {
      updatedData[field] = numValue !== null ? numValue : calculatedTotals.mr_credits;
    } else if (field === 'print_credits_bw') {
      updatedData[field] = numValue !== null ? numValue : calculatedTotals.print_bw;
    } else if (field === 'print_credits_color') {
      updatedData[field] = numValue !== null ? numValue : calculatedTotals.print_color;
    }
    
    setFormData(updatedData);
  };

  const totals = calculateTotalCredits();

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-text-secondary">Included Credit Allotments</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Conference Room Credits */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Conference Room Credits
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-text-secondary">
              {totals.mr_credits}
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                value={formData.conference_room_credits_override === null || formData.conference_room_credits_override === undefined ? '' : formData.conference_room_credits_override}
                onChange={(e) => handleInputChange('conference_room_credits', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Override"
                min="0"
              />
              {formData.conference_room_credits_override !== null && formData.conference_room_credits_override !== undefined && (
                <div className="absolute -top-2 right-2 px-2 bg-primary text-white text-xs rounded">
                  Override
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Credits - B&W */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Print Credits - B&W
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-text-secondary">
              {totals.print_bw}
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                value={formData.print_credits_bw_override === null || formData.print_credits_bw_override === undefined ? '' : formData.print_credits_bw_override}
                onChange={(e) => handleInputChange('print_credits_bw', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Override"
                min="0"
              />
              {formData.print_credits_bw_override !== null && formData.print_credits_bw_override !== undefined && (
                <div className="absolute -top-2 right-2 px-2 bg-primary text-white text-xs rounded">
                  Override
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Credits - Color */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Print Credits - Color
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-text-secondary">
              {totals.print_color}
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                value={formData.print_credits_color_override === null || formData.print_credits_color_override === undefined ? '' : formData.print_credits_color_override}
                onChange={(e) => handleInputChange('print_credits_color', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Override"
                min="0"
              />
              {formData.print_credits_color_override !== null && formData.print_credits_color_override !== undefined && (
                <div className="absolute -top-2 right-2 px-2 bg-primary text-white text-xs rounded">
                  Override
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Notes
          </label>
          <input
            type="text"
            value={formData.credit_notes || ''}
            onChange={(e) => setFormData({ ...formData, credit_notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
