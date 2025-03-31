import React from 'react';
import { FileText, ChevronRight, ChevronDown } from 'lucide-react';
import type { Agreement } from '../../types/database';

interface DocumentHistoryProps {
  agreements: Agreement[];
}

export function DocumentHistory({ agreements }: DocumentHistoryProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-text-primary">Documents & History</h2>
      
      {/* Past Documents (Collapsed) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <ChevronRight className="h-5 w-5 text-text-secondary" />
            <span className="font-medium text-text-primary">Past Documents</span>
          </div>
          <span className="text-sm text-text-secondary">3 documents</span>
        </button>
      </div>

      {/* Current Documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-text-primary">Current Documents</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-5 w-5 text-teal" />
              <div>
                <div className="font-medium text-text-primary">License Agreement</div>
                <div className="text-sm text-text-secondary">Fixed Term (3% discount)</div>
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              Effective from Apr 1, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Future Documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-text-primary">Future Documents</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-5 w-5 text-amber-500" />
              <div>
                <div className="font-medium text-text-primary">Post-Commitment Term</div>
                <div className="text-sm text-text-secondary">Continuous (list price)</div>
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              Effective from Oct 1, 2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
