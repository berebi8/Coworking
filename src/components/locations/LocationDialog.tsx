import React, { useState, useEffect } from 'react';
import { X, Plus, Trash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Location, LocationFormData, LocationStatus, LocationFloor } from '../../types/database';

interface LocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LocationFormData) => void;
  onDelete: (location: Location) => void;
  location?: Location;
}

const initialFormData: LocationFormData = {
  name: '',
  location_id: '',
  notes: '',
  status: 'active',
  floors: [{ floor_number: 1 }]
};

export function LocationDialog({ isOpen, onClose, onSave, onDelete, location }: LocationDialogProps) {
  const [formData, setFormData] = useState<LocationFormData>(initialFormData);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [validationMessages, setValidationMessages] = useState<{
    name?: { type: 'info' | 'error'; message: string };
    location_id?: { type: 'error'; message: string };
  }>({});

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        location_id: location.location_id,
        notes: location.notes || '',
        status: location.status,
        floors: location.floors?.map(floor => ({
          floor_number: floor.floor_number,
          notes: floor.notes || ''
        })) || [{ floor_number: 1 }]
      });
    } else {
      setFormData(initialFormData);
    }
    setValidationMessages({});
  }, [location, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setValidationMessages({});
    }
  }, [isOpen]);

  const validateField = async (field: 'name' | 'location_id', value: string) => {
    if (!value) return;

    try {
      const { data: existingLocations } = await supabase
        .from('locations')
        .select('id')
        .eq(field, value)
        .neq('status', 'deleted');

      const duplicates = location
        ? existingLocations?.filter(loc => loc.id !== location.id)
        : existingLocations;

      if (duplicates && duplicates.length > 0) {
        if (field === 'name') {
          setValidationMessages(prev => ({
            ...prev,
            name: {
              type: 'info',
              message: 'This location name already exists but you can still proceed',
            },
          }));
        } else if (field === 'location_id') {
          setValidationMessages(prev => ({
            ...prev,
            location_id: {
              type: 'error',
              message: 'This location ID is already in use',
            },
          }));
        }
      } else {
        setValidationMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[field];
          return newMessages;
        });
      }
    } catch (error) {
      console.error(`Error validating ${field}:`, error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationMessages.location_id?.type === 'error') {
      return;
    }

    try {
      await onSave(formData);
    } catch (error: any) {
      console.error('Error saving location:', error);
      setValidationMessages(prev => ({
        ...prev,
        location_id: {
          type: 'error',
          message: error.message || 'An error occurred while saving',
        },
      }));
    }
  };

  const handleLocationIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData({ ...formData, location_id: value });
    validateField('location_id', value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });
    validateField('name', value);
  };

  const handleDelete = () => {
    if (deleteConfirmText === 'DELETE' && location) {
      onDelete(location);
      onClose();
    }
  };

  const addFloor = () => {
    const maxFloor = Math.max(...formData.floors.map(f => f.floor_number), 0);
    setFormData({
      ...formData,
      floors: [...formData.floors, { floor_number: maxFloor + 1 }]
    });
  };

  const removeFloor = (index: number) => {
    setFormData({
      ...formData,
      floors: formData.floors.filter((_, i) => i !== index)
    });
  };

  const updateFloor = (index: number, field: keyof LocationFloor, value: any) => {
    setFormData({
      ...formData,
      floors: formData.floors.map((floor, i) => 
        i === index ? { ...floor, [field]: value } : floor
      )
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            {location ? 'Edit Location' : 'Add Location'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {validationMessages.location_id?.type === 'error' && (
            <div className="p-3 bg-coral-light text-coral-dark rounded-lg">
              {validationMessages.location_id.message}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
              Location Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                validationMessages.name?.type === 'info'
                  ? 'border-teal focus:ring-teal'
                  : 'border-gray-300 focus:ring-primary'
              }`}
              required
              disabled={location?.status === 'deleted'}
            />
            {validationMessages.name && (
              <p className="mt-1 text-sm text-teal">
                {validationMessages.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="location_id" className="block text-sm font-medium text-text-secondary mb-1">
              Location ID
            </label>
            <div className="space-y-2">
              <input
                type="text"
                id="location_id"
                value={formData.location_id}
                onChange={handleLocationIdChange}
                className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationMessages.location_id
                    ? 'border-coral focus:ring-coral'
                    : 'border-gray-300 focus:ring-primary'
                }`}
                maxLength={5}
                placeholder="AB123"
                pattern="[A-Z0-9]{5}"
                title="5 characters code (letters and numbers)"
                required
                disabled={location?.status === 'deleted'}
              />
              <p className="text-xs text-text-secondary">
                Format: 2 letters followed by 3 numbers (e.g., AB123, XY789)
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LocationStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={location?.status === 'deleted'}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Floors
            </label>
            <div className="space-y-3">
              {formData.floors.map((floor, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={floor.floor_number}
                        onChange={(e) => updateFloor(index, 'floor_number', parseInt(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        min="1"
                        required
                      />
                      <input
                        type="text"
                        value={floor.notes || ''}
                        onChange={(e) => updateFloor(index, 'notes', e.target.value)}
                        placeholder="Floor notes"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  {formData.floors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFloor(index)}
                      className="p-2 text-text-secondary hover:text-coral transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFloor}
                className="flex items-center space-x-1 text-sm text-primary hover:text-primary-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Floor</span>
              </button>
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

          {location && location.status !== 'deleted' && (
            <div className="pt-4 border-t border-gray-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                >
                  Delete Location
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary">
                    To delete this location, type "DELETE" in the field below and click confirm:
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
              disabled={location?.status === 'deleted' || validationMessages.location_id?.type === 'error'}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
