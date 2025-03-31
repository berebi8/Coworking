import React from 'react';
import { Edit } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { Agreement, AgreementStatus } from '../../types/database';

interface AgreementsTableProps {
  agreements: Agreement[];
  onEdit: (agreement: Agreement) => void;
  onStatusChange: (agreement: Agreement, newStatus: AgreementStatus) => void;
}

export function AgreementsTable({ agreements, onEdit, onStatusChange }: AgreementsTableProps) {
  const getStatusColor = (status: AgreementStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft_approved':
        return 'bg-orange-100 text-orange-800';
      case 'signed':
        return 'bg-teal-100 text-teal-800';
      case 'cancelled':
        return 'bg-coral-light text-coral-dark';
    }
  };

  const getStatusLabel = (status: AgreementStatus) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'draft_approved':
        return 'Draft (Approved)';
      case 'signed':
        return 'Signed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                DOC ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Client Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agreements.map((agreement) => (
              <tr 
                key={agreement.id} 
                className={`hover:bg-gray-50 ${
                  agreement.status === 'draft' ? 'bg-yellow-50' :
                  agreement.status === 'draft_approved' ? 'bg-orange-50' :
                  agreement.status === 'signed' ? 'bg-teal-50' :
                  'bg-coral-50'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onEdit(agreement)}
                    className="text-primary hover:text-primary-dark transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary font-mono">
                    {agreement.doc_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary">
                    {agreement.commercial_name}
                  </div>
                  {agreement.client_contact_name && (
                    <div className="text-sm text-text-secondary">
                      {agreement.client_contact_name}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-secondary font-numeric">
                    {formatDate(agreement.start_date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-secondary">
                    {agreement.building}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(agreement.status)}`}>
                      {getStatusLabel(agreement.status)}
                    </span>
                    {agreement.status !== 'cancelled' && (
                      <select
                        value={agreement.status}
                        onChange={(e) => onStatusChange(agreement, e.target.value as AgreementStatus)}
                        className="ml-2 text-sm border-none bg-transparent focus:ring-0 text-text-secondary"
                      >
                        <option value="draft">Draft</option>
                        <option value="draft_approved">Approved</option>
                        <option value="signed">Signed</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    agreement.client_status === 'active' ? 'bg-teal-light text-teal-dark' : 'bg-coral-light text-coral-dark'
                  }`}>
                    {agreement.client_status?.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary line-clamp-2">
                    {agreement.notes}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
