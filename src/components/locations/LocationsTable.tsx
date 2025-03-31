import React from 'react';
import { Edit } from 'lucide-react';
import { ExportMenu } from '../common/ExportMenu';
import { exportLocations } from '../../lib/export';
import type { Location } from '../../types/database';

interface LocationsTableProps {
  locations: Location[];
  onEdit: (location: Location) => void;
}

export function LocationsTable({ locations, onEdit }: LocationsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-text-primary">Locations</h2>
        <ExportMenu onExport={(format) => exportLocations(locations, format)} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Location Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Location ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Floors
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
            {locations.map((location, index) => (
              <tr key={location.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-numeric">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded border ${location.status === 'active' ? 'bg-teal border-teal' : 'border-gray-300'}`}>
                      {location.status === 'active' && (
                        <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary">{location.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-numeric text-text-secondary">{location.location_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-secondary">
                    {location.floors?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {location.floors
                          .sort((a, b) => a.floor_number - b.floor_number)
                          .map((floor) => (
                            <span
                              key={floor.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-blue text-primary"
                              title={floor.notes || `Floor ${floor.floor_number}`}
                            >
                              {floor.floor_number}
                            </span>
                          ))
                        }
                      </div>
                    ) : (
                      '-'
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary line-clamp-2">{location.notes}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(location)}
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
