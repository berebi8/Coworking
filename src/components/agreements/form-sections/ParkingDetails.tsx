import React, { useState, useEffect } from 'react';
import { Plus, Trash } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { AgreementFormData, AddonService } from '../../../types/database';

interface ParkingDetailsProps {
  formData: AgreementFormData;
  setFormData: (data: AgreementFormData) => void;
}

export function ParkingDetails({ formData, setFormData }: ParkingDetailsProps) {
  const [availableParkingServices, setAvailableParkingServices] = useState<AddonService[]>([]);

  useEffect(() => {
    fetchParkingServices();
  }, []);

  const fetchParkingServices = async () => {
    try {
      const { data, error } = await supabase
        .from('addon_services')
        .select('*')
        .in('type', ['parking_reserved', 'parking_unassigned', 'parking_ev', 'parking_vip'])
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setAvailableParkingServices(data || []);
    } catch (error) {
      console.error('Error fetching parking services:', error);
    }
  };

  const handleParkingSpaceChange = (index: number, field: string, value: any) => {
    const newParkingSpaces = [...formData.parking_spaces];
    
    if (field === 'parking_type') {
      // When parking service is selected, update related fields
      const selectedService = availableParkingServices.find(s => s.id === value);
      if (selectedService) {
        newParkingSpaces[index] = {
          ...newParkingSpaces[index],
          parking_type: value,
          list_price: selectedService.list_price, // Original list price per item
          quantity: 1,
          discount_percentage: 0
        };
      }
    } else {
      newParkingSpaces[index] = {
        ...newParkingSpaces[index],
        [field]: value
      };

      // If discount changes, update list price from original service price
      if (field === 'discount_percentage') {
        const service = availableParkingServices.find(s => s.id === newParkingSpaces[index].parking_type);
        if (service) {
          const discountMultiplier = 1 - (newParkingSpaces[index].discount_percentage / 100);
          newParkingSpaces[index].list_price = service.list_price; // Keep original price per item
        }
      }
    }

    setFormData({
      ...formData,
      parking_spaces: newParkingSpaces
    });
  };

  const addParkingSpace = () => {
    setFormData({
      ...formData,
      parking_spaces: [
        ...formData.parking_spaces,
        {
          parking_type: '',
          list_price: 0,
          quantity: 1,
          discount_percentage: 0
        }
      ]
    });
  };

  const removeParkingSpace = (index: number) => {
    setFormData({
      ...formData,
      parking_spaces: formData.parking_spaces.filter((_, i) => i !== index)
    });
  };

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IL').format(num);
  };

  // Calculate final price including quantity and discount
  const calculateFinalPrice = (space: any) => {
    const basePrice = space.list_price; // Price per item
    const discountMultiplier = 1 - (space.discount_percentage / 100);
    const quantity = space.quantity || 1;
    return Math.round(basePrice * discountMultiplier * quantity);
  };

  return (
    <div className="space-y-4 bg-green-50 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Parking Details</h3>
        <button
          type="button"
          onClick={addParkingSpace}
          className="flex items-center space-x-2 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Parking</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">List Price NIS+VAT</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Quantity</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Discount %</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Final Price</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {formData.parking_spaces.map((space, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <select
                    value={space.parking_type}
                    onChange={(e) => handleParkingSpaceChange(index, 'parking_type', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    required
                  >
                    <option value="">Select Parking</option>
                    {availableParkingServices.map(service => (
                      <option 
                        key={service.id} 
                        value={service.id}
                        disabled={formData.parking_spaces.some(s => s.parking_type === service.id && s !== space)}
                      >
                        {service.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="w-32 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm">
                    {formatNumber(space.list_price)} {/* Show price per item */}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={space.quantity || 1}
                    onChange={(e) => handleParkingSpaceChange(index, 'quantity', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    min="1"
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={space.discount_percentage}
                    onChange={(e) => handleParkingSpaceChange(index, 'discount_percentage', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    min="0"
                    max="100"
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="w-32 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm">
                    {formatNumber(calculateFinalPrice(space))}
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
                    onClick={() => removeParkingSpace(index)}
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
