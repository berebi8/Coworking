import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Select from 'react-select';
import type { AddonService, AddonServiceFormData, Location } from '../../types/database';

interface ParkingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddonServiceFormData) => void;
  onDelete: (service: AddonService) => void;
  service?: AddonService;
  locations: Location[];
}

const parkingTypes = [
  { value: 'parking_reserved', label: 'Reserved' },
  { value: 'parking_unassigned', label: 'Unassigned' },
  { value: 'parking_ev', label: 'EV Charging' },
  { value: 'parking_vip', label: 'VIP' }
];

export function ParkingDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  service,
  locations
}: ParkingDialogProps) {
  const [formData, setFormData] = useState<AddonServiceFormData>({
    name: '',
    type: 'parking_reserved',
    is_incidental: false,
    list_price: 0,
    quantity: null,
    locations: [],
    notes: '',
    status: 'active'
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        type: service.type,
        is_incidental: service.is_incidental,
        list_price: service.list_price,
        quantity: service.quantity,
        locations: service.locations,
        notes: service.notes || '',
        status: service.status
      });
    } else {
      setFormData({
        name: '',
        type: 'parking_reserved',
        is_incidental: false,
        list_price: 0,
        quantity: null,
        locations: [],
        notes: '',
        status: 'active'
      });
    }
  }, [service]);

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSave(formData);
    } catch (error: any) {
      setError(error.message || 'An error occurred while saving');
    }
  };

  const handleDelete = () => {
    if (deleteConfirmText === 'DELETE' && service) {
      onDelete(service);
      onClose();
    }
  };

  const locationOptions = locations.map(location => ({
    value: location.id,
    label: location.name
  }));

  const selectedLocations = locationOptions.filter(option => 
    formData.locations.includes(option.value)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            {service ? 'Edit Parking' : 'Add Parking'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-coral-light text-coral-dark rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Locations
              </label>
              <Select
                isMulti
                options={locationOptions}
                value={selectedLocations}
                onChange={(selected) => setFormData({
                  ...formData,
                  locations: selected.map(option => option.value)
                })}
                className="text-sm"
                placeholder="Select locations (leave empty for all locations)"
                isClearable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Parking Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({
                  ...formData,
                  type: e.target.value as AddonService['type']
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {parkingTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="list_price" className="block text-sm font-medium text-text-secondary mb-1">
                Default Price (NIS)
              </label>
              <input
                type="number"
                id="list_price"
                value={formData.list_price}
                onChange={(e) => setFormData({ ...formData, list_price: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                step="100"
                required
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-1">
                Quantity
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  id="quantity"
                  value={formData.quantity === null ? '' : formData.quantity}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    quantity: e.target.value === '' ? null : parseInt(e.target.value)
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="1"
                  placeholder="Unlimited"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.quantity === null}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      quantity: e.target.checked ? null : 1
                    })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-secondary">Unlimited</span>
                </label>
              </div>
            </div>

            <div className="col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.status === 'active'}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  status: e.target.checked ? 'active' : 'inactive'
                })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-text-secondary">Active</span>
            </label>
          </div>

          {service && service.status !== 'deleted' && (
            <div className="pt-4 border-t border-gray-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                >
                  Delete Parking
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary">
                    To delete this parking, type "DELETE" in the field below and click confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-coral rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
                    placeholder="Type DELETE to confirm"
                  />
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteConfirmText !== 'DELETE'}
                      className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                        deleteConfirmText === 'DELETE'
                          ? 'bg-coral hover:bg-coral-dark'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
              disabled={service?.status === 'deleted'}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
