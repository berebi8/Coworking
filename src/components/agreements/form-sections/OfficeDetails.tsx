import React, { useState, useEffect } from 'react';
import { Plus, Trash } from 'lucide-react';
import type { AgreementFormData, OfficeProperty } from '../../../types/database';

interface OfficeDetailsProps {
  formData: AgreementFormData;
  setFormData: (data: AgreementFormData) => void;
  availableOffices: OfficeProperty[];
}

export function OfficeDetails({ formData, setFormData, availableOffices }: OfficeDetailsProps) {
  const [defaultDiscount, setDefaultDiscount] = useState(0);
  const [defaultSpecialDiscount, setDefaultSpecialDiscount] = useState(0);

  // Add default office line if none exists
  useEffect(() => {
    if (formData.office_spaces.length === 0) {
      setFormData({
        ...formData,
        office_spaces: [{
          office_id: '',
          workstations: 1,
          list_price: 0,
          discount_percentage: defaultDiscount,
          special_discount_percentage: defaultSpecialDiscount
        }]
      });
    }
  }, []);

  const handleOfficeSpaceChange = (index: number, field: string, value: any) => {
    const newOfficeSpaces = [...formData.office_spaces];
    
    if (field === 'office_id') {
      // When office is selected, update all related fields
      const selectedOffice = availableOffices.find(o => o.id === value);
      if (selectedOffice) {
        newOfficeSpaces[index] = {
          ...newOfficeSpaces[index],
          office_id: value,
          workstations: selectedOffice.default_ws,
          list_price: selectedOffice.list_price,
          discount_percentage: defaultDiscount,
          special_discount_percentage: defaultSpecialDiscount
        };
      }
    } else {
      // For other field changes
      newOfficeSpaces[index] = {
        ...newOfficeSpaces[index],
        [field]: value
      };

      // If changing discounts, update default values for new offices
      if (field === 'discount_percentage' || field === 'special_discount_percentage') {
        if (index === 0) {
          if (field === 'discount_percentage') {
            setDefaultDiscount(value);
          } else if (field === 'special_discount_percentage') {
            setDefaultSpecialDiscount(value);
          }
        }
      }
    }

    setFormData({
      ...formData,
      office_spaces: newOfficeSpaces
    });
  };

  const addOfficeSpace = () => {
    setFormData({
      ...formData,
      office_spaces: [
        ...formData.office_spaces,
        {
          office_id: '',
          workstations: 1,
          list_price: 0,
          discount_percentage: defaultDiscount,
          special_discount_percentage: defaultSpecialDiscount
        }
      ]
    });
  };

  const removeOfficeSpace = (index: number) => {
    if (formData.office_spaces.length > 1) {
      setFormData({
        ...formData,
        office_spaces: formData.office_spaces.filter((_, i) => i !== index)
      });
    }
  };

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IL').format(num);
  };

  // Calculate final price after both discounts
  const calculateFinalPrice = (listPrice: number, discount: number, specialDiscount: number) => {
    const totalDiscount = (discount + specialDiscount) / 100;
    return Math.round(listPrice * (1 - totalDiscount));
  };

  return (
    <div className="space-y-4 bg-green-50 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Office Details</h3>
        <button
          type="button"
          onClick={addOfficeSpace}
          className="flex items-center space-x-2 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Office</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Office Space</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">WS</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">List Price NIS+VAT</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Discount %</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Special Discount %</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Office Space Price</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {formData.office_spaces.map((space, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <select
                    value={space.office_id}
                    onChange={(e) => handleOfficeSpaceChange(index, 'office_id', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    required
                  >
                    <option value="">Select Office</option>
                    {availableOffices
                      .filter(office => !formData.office_spaces.some(s => s.office_id === office.id && s !== space))
                      .map(office => (
                        <option key={office.id} value={office.id}>
                          {office.office_id}
                        </option>
                      ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={space.workstations}
                    onChange={(e) => handleOfficeSpaceChange(index, 'workstations', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    min="1"
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="w-32 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm">
                    {formatNumber(space.list_price)}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={space.discount_percentage}
                    onChange={(e) => handleOfficeSpaceChange(index, 'discount_percentage', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    min="0"
                    max="100"
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={space.special_discount_percentage || 0}
                    onChange={(e) => handleOfficeSpaceChange(index, 'special_discount_percentage', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    min="0"
                    max="100"
                    required
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="w-32 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm">
                    {formatNumber(calculateFinalPrice(
                      space.list_price,
                      space.discount_percentage,
                      space.special_discount_percentage || 0
                    ))}
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
                    onClick={() => removeOfficeSpace(index)}
                    disabled={formData.office_spaces.length === 1}
                    className={`text-coral hover:text-coral-dark transition-colors ${
                      formData.office_spaces.length === 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
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
