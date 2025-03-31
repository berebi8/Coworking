import React from 'react';
import { Building2, Car, Package, Calendar, Edit2, Trash2, Plus } from 'lucide-react';
import type { Agreement } from '../../types/database';

interface CurrentProductsProps {
  agreements: Agreement[];
  selectedDate: Date;
}

export function CurrentProducts({ agreements, selectedDate }: CurrentProductsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get the current agreement based on the selected date
  const currentAgreement = agreements[0]; // TODO: Implement proper date filtering

  if (!currentAgreement) {
    return (
      <div className="text-center py-8 text-text-secondary">
        No active products found for the selected date.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="text-primary hover:text-primary-dark transition-colors">
            Compare to List Price
          </button>
          <div className="text-text-secondary">
            Effective Date: <span className="font-medium">April 1, 2025</span>
          </div>
          <div className="px-2 py-1 bg-teal-light text-teal-dark text-sm rounded-lg">
            Fixed Term until Sep 30, 2025
          </div>
        </div>
      </div>

      {/* Office Spaces */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between bg-indigo-50">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-text-primary">Office Spaces</h3>
          </div>
          <div className="text-sm font-medium">
            Total: {formatCurrency(12610)}
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Office</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">WS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">List Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                Office 61/26
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">4</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {formatCurrency(13000)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">3%</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                {formatCurrency(12610)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-light text-teal-dark">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-primary hover:text-primary-dark transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary-light rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Office</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary-light rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Parking</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary-light rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </button>
      </div>
    </div>
  );
}
