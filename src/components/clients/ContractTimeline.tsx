import React from 'react';
import { FileText, Plus } from 'lucide-react';
import type { Agreement } from '../../types/database';

interface ContractTimelineProps {
  agreements: Agreement[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function ContractTimeline({ 
  agreements,
  selectedDate,
  onDateChange 
}: ContractTimelineProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-medium text-text-primary mb-4">
        Contract Timeline
      </h2>
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200" />

        {/* Timeline Events */}
        <div className="relative flex justify-between">
          {/* License Agreement */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="mt-2 text-sm font-medium">01/04/2025</div>
            <div className="text-sm text-text-secondary">License Agreement</div>
            <div className="text-xs px-2 py-0.5 bg-teal-light text-teal-dark rounded-full">
              Fixed Term (3% discount)
            </div>
          </div>

          {/* Post-Commitment Term */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="mt-2 text-sm font-medium">01/10/2025</div>
            <div className="text-sm text-text-secondary">Post-Commitment Term</div>
            <div className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              Continuous (list price)
            </div>
          </div>

          {/* Add Event Button */}
          <div className="flex flex-col items-center">
            <button className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
            <div className="mt-2 text-sm text-gray-400">Add Event</div>
          </div>
        </div>
      </div>
    </div>
  );
}
