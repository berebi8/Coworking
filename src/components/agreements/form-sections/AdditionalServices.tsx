import React from 'react';
import { Plus, Trash } from 'lucide-react';
import type { AgreementFormData, AddonService } from '../../../types/database';

interface AdditionalServicesProps {
  formData: AgreementFormData;
  setFormData: (data: AgreementFormData) => void;
  availableServices: AddonService[];
}

export function AdditionalServices({ formData, setFormData, availableServices }: AdditionalServicesProps) {
  // Create a new service entry in the form data
  const addService = () => {
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        {
          service_id: '',
          type: '',
          list_price: 0,
          quantity: 1,
          discount_percentage: 0
        }
      ]
    });
  };

  // Remove a service entry at the given index
  const removeService = (index: number) => {
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index)
    });
  };

  // Update service properties and handle price calculations
  const updateService = (index: number, updates: Partial<typeof formData.services[0]>) => {
    const newServices = [...formData.services];
    
    newServices[index] = {
      ...newServices[index],
      ...updates
    };
    
    // Recalculate price based on discount and quantity if necessary
    if ('discount_percentage' in updates || 'quantity' in updates) {
      const service = availableServices.find(s => s.id === newServices[index].service_id);
      if (service) {
        const discountMultiplier = 1 - (newServices[index].discount_percentage / 100);
        const quantity = newServices[index].quantity || 1;
        newServices[index].list_price = Math.round(service.list_price * quantity * discountMultiplier);
      }
    }
    
    setFormData({
      ...formData,
      services: newServices
    });
  };

  // When a service is selected from the dropdown
  const handleServiceSelection = (index: number, serviceId: string) => {
    // Find the selected service data
    const selectedService = availableServices.find(s => s.id === serviceId);
    
    if (selectedService) {
      updateService(index, {
        service_id: serviceId,
        type: selectedService.type,
        list_price: selectedService.list_price,
      });
    }
  };

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IL').format(num);
  };

  return (
    <div className="space-y-4 bg-yellow-50 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Additional Services</h3>
        <button
          type="button"
          onClick={addService}
          className="flex items-center space-x-2 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Service</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">List Price NIS+VAT</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Quantity</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Discount %</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Final Price</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {formData.services.map((service, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <select
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    value={service.service_id}
                    onChange={(e) => handleServiceSelection(index, e.target.value)}
                  >
                    <option value="">Select Service</option>
                    {availableServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="w-32 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm">
                    {formatNumber(service.list_price)}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={service.quantity || 1}
                    onChange={(e) => updateService(index, { quantity: parseInt(e.target.value) })}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    min="1"
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={service.discount_percentage}
                    onChange={(e) => updateService(index, { discount_percentage: parseInt(e.target.value) })}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    min="0"
                    max="100"
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="w-32 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm">
                    {formatNumber(Math.round(service.list_price * (1 - service.discount_percentage / 100) * (service.quantity || 1)))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-coral hover:text-coral-dark transition-colors"
                  >
                    <Trash className="h-4 w-4" />
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
