import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import type { Agreement } from '../../types/database';

interface FutureChangesProps {
  agreements: Agreement[];
  selectedDate: Date;
}

export function FutureChanges({ agreements, selectedDate }: FutureChangesProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-text-primary">Future Changes</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-amber-500" />
            <div>
              <div className="font-medium text-text-primary">
                Post-Commitment Term
              </div>
              <div className="text-sm text-text-secondary">
                Changes effective from Oct 1, 2025
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-start space-x-3 text-amber-800 bg-amber-50 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Price changes:</p>
              <ul className="mt-2 space-y-1">
                <li>• Office 61/26: ₪12,610 → ₪13,000 (list price)</li>
                <li>• All discounts will be removed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
