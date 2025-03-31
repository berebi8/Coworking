import React from 'react';
import { Edit, Upload } from 'lucide-react';
import { ExportMenu } from '../common/ExportMenu';
import { exportAddonServices } from '../../lib/export';
import type { AddonService, Location } from '../../types/database';

interface ParkingTableProps {
  services: AddonService[];
  locations: Location[];
  onEdit: (service: AddonService) => void;
  onImport: () => void;
}

export function ParkingTable({ 
  services, 
  locations, 
  onEdit,
  onImport
}: ParkingTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getLocationNames = (locationIds: string[]) => {
    if (locationIds.length === 0) return 'All Locations';
    return locations
      .filter(loc => locationIds.includes(loc.id))
      .map(loc => loc.name)
      .join(', ');
  };

  const getParkingTypeStyle = (type: string) => {
    switch (type) {
      case 'parking_reserved':
        return 'bg-purple-light text-purple-dark'; // Purple for reserved
      case 'parking_unassigned':
        return 'bg-teal-light text-teal-dark'; // Teal for unassigned
      case 'parking_ev':
        return 'bg-primary-light text-primary-dark'; // Blue for EV charging
      case 'parking_vip':
        return 'bg-coral-light text-coral-dark'; // Coral for VIP
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getParkingTypeLabel = (type: string) => {
    switch (type) {
      case 'parking_reserved':
        return 'Reserved';
      case 'parking_unassigned':
        return 'Unassigned';
      case 'parking_ev':
        return 'EV Charging';
      case 'parking_vip':
        return 'VIP';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-text-primary">Parking Services</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={onImport}
            className="flex items-center space-x-2 text-sm text-primary hover:text-primary-dark transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <ExportMenu onExport={(format) => exportAddonServices(services, format)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Default Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Quantity
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
            {services.map((service, index) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-numeric">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded border ${service.status === 'active' ? 'bg-teal border-teal' : 'border-gray-300'}`}>
                      {service.status === 'active' && (
                        <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-primary">{getLocationNames(service.locations)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getParkingTypeStyle(service.type)}`}>
                    {getParkingTypeLabel(service.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary">{service.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">{formatCurrency(service.list_price)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary font-numeric">
                    {service.quantity === null ? 'Unlimited' : service.quantity}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary line-clamp-2">{service.notes}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(service)}
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
