import React from 'react';
import { Building2, Plus, Printer } from 'lucide-react';

interface ClientHeaderProps {
  onNewDraft: () => void;
}

export function ClientHeader({ onNewDraft }: ClientHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                Azrieli Global
              </h1>
              <div className="flex items-center space-x-2 text-text-secondary">
                <span className="text-sm">512340498</span>
                <span className="text-sm">•</span>
                <span className="text-sm">Merav Shlomovitch Barak</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onNewDraft}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Draft</span>
            </button>
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-gray-100">
              <Printer className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Email
            </label>
            <div className="mt-1 text-sm">
              MeravSB@azrieli.com
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Phone
            </label>
            <div className="mt-1 text-sm">
              054-5600464
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
