import React, { useState, useEffect, useCallback } from 'react';
import type { AgreementFormData } from '../../../types/database';

interface SecurityDepositsProps {
  formData: AgreementFormData;
  setFormData: (data: AgreementFormData) => void;
}

export function SecurityDeposits({ formData, setFormData }: SecurityDepositsProps) {
  // Local state for input values to prevent constant refreshing
  const [localOverrides, setLocalOverrides] = useState({
    fixed: formData.security_deposit_fixed_override,
    continuous: formData.security_deposit_continuous_override
  });

  // Update local state when form data changes from outside
  useEffect(() => {
    setLocalOverrides({
      fixed: formData.security_deposit_fixed_override,
      continuous: formData.security_deposit_continuous_override
    });
  }, [formData.security_deposit_fixed_override, formData.security_deposit_continuous_override]);

  // Calculate office fees during fixed term
  const calculateOfficeFees = useCallback(() => {
    return formData.office_spaces.reduce((total, space) => {
      const totalDiscount = (space.discount_percentage + (space.special_discount_percentage || 0)) / 100;
      return total + Math.round(space.list_price * (1 - totalDiscount));
    }, 0);
  }, [formData.office_spaces]);

  // Calculate continuous term office fees (list prices only)
  const calculateContinuousTermOfficeFees = useCallback(() => {
    return formData.office_spaces.reduce((total, space) => {
      return total + space.list_price;
    }, 0);
  }, [formData.office_spaces]);

  // Calculate security deposit (200% + 18% VAT)
  const calculateSecurityDeposit = useCallback((officeFees: number) => {
    const baseDeposit = officeFees * 2; // 200%
    const vat = baseDeposit * 0.18; // 18% VAT
    return Math.round(baseDeposit + vat);
  }, []);

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IL').format(num);
  };

  // Handle committing the override values to the form
  const commitFixedOverrideValue = useCallback((value: number | null) => {
    const calculatedValue = calculateSecurityDeposit(calculateOfficeFees());
    
    setFormData({
      ...formData,
      security_deposit_fixed_override: value,
      security_deposit_fixed: value !== null ? value : calculatedValue
    });
  }, [formData, setFormData, calculateSecurityDeposit, calculateOfficeFees]);

  const commitContinuousOverrideValue = useCallback((value: number | null) => {
    const calculatedValue = calculateSecurityDeposit(calculateContinuousTermOfficeFees());
    
    setFormData({
      ...formData,
      security_deposit_continuous_override: value,
      security_deposit_continuous: value !== null ? value : calculatedValue
    });
  }, [formData, setFormData, calculateSecurityDeposit, calculateContinuousTermOfficeFees]);

  const fixedDepositValue = calculateSecurityDeposit(calculateOfficeFees());
  const continuousDepositValue = calculateSecurityDeposit(calculateContinuousTermOfficeFees());

  return (
    <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-text-secondary">Security Deposits</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Fixed Term Security Deposit */}
        {formData.has_fixed_term && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Security Deposit - Fixed Term
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-text-secondary">
                {formatNumber(fixedDepositValue)}
              </div>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={localOverrides.fixed === null ? '' : localOverrides.fixed}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    // Update local state only, not form data yet
                    const newValue = e.target.value === '' ? null : parseInt(e.target.value);
                    setLocalOverrides(prev => ({ ...prev, fixed: newValue }));
                  }}
                  onBlur={() => {
                    // Only update form data when focus is lost
                    commitFixedOverrideValue(localOverrides.fixed);
                  }}
                  className="w-full px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Override"
                  min="0"
                />
                {formData.security_deposit_fixed_override !== null && (
                  <div className="absolute -top-2 right-2 px-2 bg-primary text-white text-xs rounded">
                    Override
                  </div>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Calculated as: 200% of Office License Fees + 18% VAT
            </p>
          </div>
        )}

        {/* Continuous Term Security Deposit */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Security Deposit - Continuous Term
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-text-secondary">
              {formatNumber(continuousDepositValue)}
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                value={localOverrides.continuous === null ? '' : localOverrides.continuous}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  // Update local state only, not form data yet
                  const newValue = e.target.value === '' ? null : parseInt(e.target.value);
                  setLocalOverrides(prev => ({ ...prev, continuous: newValue }));
                }}
                onBlur={() => {
                  // Only update form data when focus is lost
                  commitContinuousOverrideValue(localOverrides.continuous);
                }}
                className="w-full px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Override"
                min="0"
              />
              {formData.security_deposit_continuous_override !== null && (
                <div className="absolute -top-2 right-2 px-2 bg-primary text-white text-xs rounded">
                  Override
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Calculated as: 200% of List Price + 18% VAT
          </p>
        </div>
      </div>
    </div>
  );
}
