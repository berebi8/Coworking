import React from 'react';
import type { AgreementFormData } from '../../../types/database';

interface TotalSummaryProps {
  formData: AgreementFormData;
}

export function TotalSummary({ formData }: TotalSummaryProps) {
  // Calculate office fees during fixed term
  const calculateOfficeFees = () => {
    return formData.office_spaces.reduce((total, space) => {
      const totalDiscount = (space.discount_percentage + (space.special_discount_percentage || 0)) / 100;
      return total + Math.round(space.list_price * (1 - totalDiscount));
    }, 0);
  };

  // Calculate parking fees
  const calculateParkingFees = () => {
    return formData.parking_spaces.reduce((total, space) => {
      const discountMultiplier = 1 - (space.discount_percentage / 100);
      return total + Math.round(space.list_price * discountMultiplier);
    }, 0);
  };

  // Calculate add-on services fees
  const calculateServiceFees = () => {
    return formData.services.reduce((total, service) => {
      const discountMultiplier = 1 - (service.discount_percentage / 100);
      return total + Math.round(service.list_price * discountMultiplier);
    }, 0);
  };

  // Calculate total monthly payment during fixed term
  const calculateTotalMonthlyPayment = () => {
    return calculateOfficeFees() + calculateParkingFees() + calculateServiceFees();
  };

  // Calculate continuous term office fees (list prices only)
  const calculateContinuousTermOfficeFees = () => {
    return formData.office_spaces.reduce((total, space) => {
      return total + space.list_price;
    }, 0);
  };

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IL').format(num);
  };

  return (
    <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-text-secondary">Total Summary</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm font-medium">A. Office License Fees during First Fixed Term (if applicable):</span>
          <span className="text-sm font-numeric">NIS {formatNumber(calculateOfficeFees())}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm font-medium">B. Parking Fee (if applicable):</span>
          <span className="text-sm font-numeric">NIS {formatNumber(calculateParkingFees())}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm font-medium">C. Add-on Services fees:</span>
          <span className="text-sm font-numeric">NIS {formatNumber(calculateServiceFees())}</span>
        </div>
        <div className="flex justify-between items-center py-3 bg-primary-light rounded-lg px-3">
          <span className="text-sm font-semibold text-primary-dark">A+B+C = Monthly Payment during First Fixed Term:</span>
          <span className="text-sm font-semibold font-numeric text-primary-dark">NIS {formatNumber(calculateTotalMonthlyPayment())}</span>
        </div>
        <div className="flex justify-between items-center py-3 bg-teal-light rounded-lg px-3 mt-4">
          <span className="text-sm font-semibold text-teal-dark">D. Office License Fees during Continuous Term ("List price"):</span>
          <span className="text-sm font-semibold font-numeric text-teal-dark">NIS {formatNumber(calculateContinuousTermOfficeFees())}</span>
        </div>
      </div>
    </div>
  );
}
