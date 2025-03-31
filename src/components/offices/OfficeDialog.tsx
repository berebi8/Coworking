import React, { useState, useEffect } from 'react';
import { X, Trash } from 'lucide-react';
import type { OfficeProperty, OfficeFormData, Location, LocationFloor } from '../../types/database';

interface OfficeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OfficeFormData) => void;
  onDelete?: (office: OfficeProperty) => void;
  onPermanentDelete?: (office: OfficeProperty) => void;
  office?: OfficeProperty;
  locations: Location[];
}

const initialFormData: OfficeFormData = {
  location_id: '',
  floor: 1,
  office_id: '',
  office_type: 'office',
  default_ws: 1,
  list_price: 0,
  mr_credits: 0,
  print_quota_bw: 0,
  print_quota_color: 0,
  view_type: 'internal',
  additional_desk_price: 0,
  max_ws: 1,
  notes: '',
  status: 'active',
};

export function OfficeDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  onPermanentDelete,
  office, 
  locations 
}: OfficeDialogProps) {
  const [formData, setFormData] = useState<OfficeFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [availableFloors, setAvailableFloors] = useState<LocationFloor[]>([]);
  const [officeNumber, setOfficeNumber] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [permanentDeleteConfirmText, setPermanentDeleteConfirmText] = useState('');

  useEffect(() => {
    if (office) {
      setFormData({
        ...office,
        notes: office.notes || '',
      });
      if (office.office_type === 'office') {
        // Extract and pad the office number when editing
        const number = office.office_id.split('/')[1] || '';
        setOfficeNumber(number.padStart(2, '0'));
      } else {
        setOfficeNumber(office.office_id.replace(/^HD\d+/, ''));
      }
    } else {
      setFormData(initialFormData);
      setOfficeNumber('');
    }
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setError(null);
  }, [office, isOpen]);

  useEffect(() => {
    if (formData.location_id) {
      const selectedLocation = locations.find(loc => loc.id === formData.location_id);
      if (selectedLocation?.floors) {
        const activeFloors = selectedLocation.floors.filter(f => f.status === 'active');
        setAvailableFloors(activeFloors);
        
        if (activeFloors.length > 0 && !activeFloors.some(f => f.floor_number === formData.floor)) {
          setFormData(prev => ({
            ...prev,
            floor: activeFloors[0].floor_number
          }));
        }
      } else {
        setAvailableFloors([]);
      }
    } else {
      setAvailableFloors([]);
    }
  }, [formData.location_id, locations]);

  useEffect(() => {
    if (formData.floor && officeNumber) {
      const paddedFloor = formData.floor.toString().padStart(2, '0');
      const newOfficeId = formData.office_type === 'office'
        ? `${paddedFloor}/${officeNumber.padStart(2, '0')}`
        : `HD${paddedFloor}${officeNumber.toUpperCase()}`;
      
      setFormData(prev => ({
        ...prev,
        office_id: newOfficeId
      }));
    }
  }, [formData.floor, officeNumber, formData.office_type]);

  const handleOfficeTypeChange = (type: OfficeType) => {
    setFormData(prev => ({
      ...prev,
      office_type: type,
      office_id: ''
    }));
    setOfficeNumber('');
  };

  const handleOfficeNumberChange = (value: string) => {
    if (formData.office_type === 'office') {
      // Only allow numbers and pad with leading zeros
      const numberValue = value.replace(/[^\d]/g, '');
      // Ensure the number is at least 2 digits
      setOfficeNumber(numberValue.padStart(2, '0'));
    } else {
      const letterValue = value.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (letterValue.length <= 1) {
        setOfficeNumber(letterValue);
      }
    }
  };

  const validateOfficeId = () => {
    if (formData.office_type === 'office') {
      return /^\d+\/\d+$/.test(formData.office_id);
    } else {
      return /^HD\d+[A-Z]$/.test(formData.office_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!validateOfficeId()) {
        throw new Error('Invalid office ID format');
      }

      if (formData.max_ws < formData.default_ws) {
        throw new Error('Maximum workstations must be greater than or equal to default workstations');
      }

      await onSave(formData);
    } catch (error: any) {
      setError(error.message || 'An error occurred while saving');
    }
  };

  const handleDelete = () => {
    if (deleteConfirmText === 'DELETE' && office && onDelete) {
      onDelete(office);
      onClose();
    }
  };

  const handlePermanentDelete = () => {
    if (permanentDeleteConfirmText === 'DELETE FOREVER' && office && onPermanentDelete) {
      onPermanentDelete(office);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            {office ? 'Edit Office' : 'Add Office'}
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
            <div>
              <label htmlFor="location_id" className="block text-sm font-medium text-text-secondary mb-1">
                Location
              </label>
              <select
                id="location_id"
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select Location</option>
                {locations
                  .filter(location => location.status === 'active')
                  .map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label htmlFor="floor" className="block text-sm font-medium text-text-secondary mb-1">
                Floor
              </label>
              <select
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                disabled={!formData.location_id || availableFloors.length === 0}
              >
                {availableFloors.length === 0 ? (
                  <option value="">No floors available</option>
                ) : (
                  availableFloors
                    .sort((a, b) => a.floor_number - b.floor_number)
                    .map((floor) => (
                      <option key={floor.id} value={floor.floor_number}>
                        Floor {floor.floor_number}{floor.notes ? ` - ${floor.notes}` : ''}
                      </option>
                    ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Office Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={formData.office_type === 'office'}
                    onChange={() => handleOfficeTypeChange('office')}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Office</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={formData.office_type === 'hot_desk'}
                    onChange={() => handleOfficeTypeChange('hot_desk')}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Hot Desk</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="office_number" className="block text-sm font-medium text-text-secondary mb-1">
                Office Number
              </label>
              <div className="relative">
                <div className="flex items-center">
                  {formData.office_type === 'office' && (
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg font-mono text-text-secondary">
                      {formData.floor.toString().padStart(2, '0')}/
                    </span>
                  )}
                  {formData.office_type === 'hot_desk' && (
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg font-mono text-text-secondary">
                      HD{formData.floor.toString().padStart(2, '0')}
                    </span>
                  )}
                  <input
                    type="text"
                    id="office_number"
                    value={officeNumber}
                    onChange={(e) => handleOfficeNumberChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                    placeholder={formData.office_type === 'office' ? 'Room number' : 'Letter (A-Z)'}
                    required
                  />
                </div>
                <div className="mt-1 text-xs text-text-secondary">
                  {formData.office_type === 'office' 
                    ? 'Format: Floor/Number (e.g., 12/01)'
                    : 'Format: HDFloorLetter (e.g., HD12A)'}
                </div>
                <div className="mt-1 text-xs text-primary">
                  ID will be: {formData.office_id || '...'}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="view_type" className="block text-sm font-medium text-text-secondary mb-1">
                View Type
              </label>
              <select
                id="view_type"
                value={formData.view_type}
                onChange={(e) => setFormData({ ...formData, view_type: e.target.value as OfficeProperty['view_type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="sea_view">Sea View</option>
                <option value="city_view">City View</option>
                <option value="internal">Internal</option>
              </select>
            </div>

            <div>
              <label htmlFor="default_ws" className="block text-sm font-medium text-text-secondary mb-1">
                Default Workstations
              </label>
              <input
                type="number"
                id="default_ws"
                value={formData.default_ws}
                onChange={(e) => setFormData({ ...formData, default_ws: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="max_ws" className="block text-sm font-medium text-text-secondary mb-1">
                Maximum Workstations
              </label>
              <input
                type="number"
                id="max_ws"
                value={formData.max_ws}
                onChange={(e) => setFormData({ ...formData, max_ws: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min={formData.default_ws}
                required
              />
            </div>

            <div>
              <label htmlFor="list_price" className="block text-sm font-medium text-text-secondary mb-1">
                List Price (NIS)
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
              <label htmlFor="additional_desk_price" className="block text-sm font-medium text-text-secondary mb-1">
                Additional Desk Price (NIS)
              </label>
              <input
                type="number"
                id="additional_desk_price"
                value={formData.additional_desk_price}
                onChange={(e) => setFormData({ ...formData, additional_desk_price: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                step="100"
                required
              />
            </div>

            <div>
              <label htmlFor="mr_credits" className="block text-sm font-medium text-text-secondary mb-1">
                Meeting Room Credits
              </label>
              <input
                type="number"
                id="mr_credits"
                value={formData.mr_credits}
                onChange={(e) => setFormData({ ...formData, mr_credits: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                required
              />
            </div>

            <div>
              <label htmlFor="print_quota_bw" className="block text-sm font-medium text-text-secondary mb-1">
                B&W Print Quota
              </label>
              <input
                type="number"
                id="print_quota_bw"
                value={formData.print_quota_bw}
                onChange={(e) => setFormData({ ...formData, print_quota_bw: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                required
              />
            </div>

            <div>
              <label htmlFor="print_quota_color" className="block text-sm font-medium text-text-secondary mb-1">
                Color Print Quota
              </label>
              <input
                type="number"
                id="print_quota_color"
                value={formData.print_quota_color}
                onChange={(e) => setFormData({ ...formData, print_quota_color: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                required
              />
            </div>
          </div>

          <div>
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

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.status === 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-text-secondary">Active</span>
            </label>
          </div>

          {office && office.status !== 'deleted' && onDelete && (
            <div className="pt-4 border-t border-gray-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                >
                  Delete Office
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary">
                    To delete this office, type "DELETE" in the field below and click confirm:
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

          {office && office.status === 'deleted' && onPermanentDelete && (
            <div className="pt-4 border-t border-gray-200">
              {!showPermanentDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowPermanentDeleteConfirm(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                >
                  Permanently Delete Office
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-coral-light text-coral-dark rounded-lg">
                    <p className="text-sm font-medium">⚠️ Warning: This action cannot be undone!</p>
                    <p className="text-sm mt-1">
                      This will permanently delete this office and all its associated data.
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Type "DELETE FOREVER" to confirm permanent deletion:
                  </p>
                  <input
                    type="text"
                    value={permanentDeleteConfirmText}
                    onChange={(e) => setPermanentDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-coral rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
                    placeholder="Type DELETE FOREVER to confirm"
                  />
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowPermanentDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePermanentDelete}
                      disabled={permanentDeleteConfirmText !== 'DELETE FOREVER'}
                      className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                        permanentDeleteConfirmText === 'DELETE FOREVER'
                          ? 'bg-coral hover:bg-coral-dark'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Confirm Permanent Delete
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
              disabled={office?.status === 'deleted'}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
