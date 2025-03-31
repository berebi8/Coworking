import React from 'react';
import { Edit, Download, Upload } from 'lucide-react';
import { ExportMenu } from '../common/ExportMenu';
import { exportOffices } from '../../lib/export';
import type { OfficeProperty } from '../../types/database';

interface OfficesTableProps {
  offices: OfficeProperty[];
  onEdit: (office: OfficeProperty) => void;
  selectedOffices: string[];
  onSelectionChange: (selected: string[]) => void;
  onImport: () => void;
}

export function OfficesTable({ offices, onEdit, selectedOffices, onSelectionChange, onImport }: OfficesTableProps) {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(offices.map(office => office.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (officeId: string) => {
    if (selectedOffices.includes(officeId)) {
      onSelectionChange(selectedOffices.filter(id => id !== officeId));
    } else {
      onSelectionChange([...selectedOffices, officeId]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-text-primary">Offices</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={onImport}
            className="flex items-center space-x-2 text-sm text-primary hover:text-primary-dark transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <ExportMenu onExport={(format) => exportOffices(offices, format)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-6 py-3">
                <input
                  type="checkbox"
                  checked={selectedOffices.length === offices.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Floor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Office ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Default WS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                List Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                MR Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Print B&W
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Print Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                View
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Add. Desk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Max WS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {offices.map((office, index) => (
              <tr key={office.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOffices.includes(office.id)}
                    onChange={() => handleSelectOne(office.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-numeric">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded border ${office.status === 'active' ? 'bg-teal border-teal' : 'border-gray-300'}`}>
                      {office.status === 'active' && (
                        <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary">{office.location?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{office.floor}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary font-mono">{office.office_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{office.default_ws}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{formatCurrency(office.list_price)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{office.mr_credits}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{office.print_quota_bw}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{office.print_quota_color}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    office.view_type === 'sea_view' ? 'bg-primary-light text-primary-dark' :
                    office.view_type === 'city_view' ? 'bg-teal-light text-teal-dark' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {office.view_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{formatCurrency(office.additional_desk_price)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{office.max_ws}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary line-clamp-2">{office.notes}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(office)}
                    className="text-primary hover:text-primary-dark transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
