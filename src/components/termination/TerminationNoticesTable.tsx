import React from 'react';
import { Edit, FileText } from 'lucide-react';
import { formatDate } from '../../lib/utils'; // Assuming formatDate is in utils
import type { TerminationNotice, TerminationNoticeStatus } from '../../types/database';

interface TerminationNoticesTableProps {
  notices: TerminationNotice[];
  onEdit: (notice: TerminationNotice) => void;
  onStatusChange: (notice: TerminationNotice, newStatus: TerminationNoticeStatus) => void;
}

export function TerminationNoticesTable({
  notices,
  onEdit,
  onStatusChange
}: TerminationNoticesTableProps) {

  const getStatusStyle = (status: TerminationNoticeStatus) => {
    switch (status) {
      case 'draft': return 'bg-amber-100 text-amber-800';
      case 'active': return 'bg-teal-light text-teal-dark';
      case 'completed': return 'bg-purple-light text-purple-dark';
      case 'cancelled': return 'bg-coral-light text-coral-dark';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: TerminationNoticeStatus) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Define available status options for the dropdown
  const statusOptions: TerminationNoticeStatus[] = ['draft', 'active', 'completed', 'cancelled'];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Removed redundant header and export menu from table component */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Removed # column */}
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Doc ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Notice Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Recipient
              </th>
              {/* Removed Notice Period column */}
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Effective End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Status
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
            {notices.map((notice) => (
              <tr key={notice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-mono">
                  {notice.doc_id || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary">
                    {/* Access nested client name */}
                    {notice.client?.commercial_name || <span className="text-gray-400">Unknown Client</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-secondary font-numeric">
                    {formatDate(notice.notice_date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-secondary">
                    {/* Access nested recipient username */}
                    {notice.recipient?.username || <span className="text-gray-400">Unknown User</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-secondary font-numeric">
                    {formatDate(notice.override_end_date || notice.expected_end_date)}
                    {notice.override_end_date && (
                      <span className="ml-1 text-xs text-coral-dark font-medium">(Override)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Status Dropdown */}
                  <select
                    value={notice.status}
                    onChange={(e) => onStatusChange(notice, e.target.value as TerminationNoticeStatus)}
                    className={`w-full text-xs font-semibold leading-5 rounded-md border-none focus:ring-0 p-1 ${getStatusStyle(notice.status)}`}
                    // Add basic styling for the select itself if needed
                    style={{ appearance: 'none', paddingRight: '1.5rem', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                  >
                    {statusOptions.map(statusValue => (
                      <option key={statusValue} value={statusValue} className="bg-white text-black">
                        {getStatusLabel(statusValue)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 max-w-xs"> {/* Added max-width */}
                  <div className="text-sm text-text-secondary truncate" title={notice.notes || ''}> {/* Added truncate and title */}
                    {notice.notes || <span className="text-gray-400">--</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onEdit(notice)}
                      className="text-primary hover:text-primary-dark transition-colors p-1 rounded hover:bg-accent-blue"
                      title="Edit Notice"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {/* Placeholder for potential future actions like view document */}
                    {/* <button
                      className="text-gray-400 hover:text-primary transition-colors p-1 rounded hover:bg-accent-blue"
                      title="View Document (Not Implemented)"
                    >
                      <FileText className="h-4 w-4" />
                    </button> */}
                  </div>
                </td>
              </tr>
            ))}
            {notices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No matching termination notices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
