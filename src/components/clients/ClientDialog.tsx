import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Client, ClientFormData } from '../../types/database';

interface ClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClientFormData) => void;
  client?: Client;
}

export function ClientDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  client 
}: ClientDialogProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    company_id: '',
    commercial_name: '',
    sap_number: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    location: '',
    notes: '',
    status: 'active'
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        company_id: client.company_id,
        commercial_name: client.commercial_name,
        sap_number: client.sap_number,
        primary_contact_name: client.primary_contact_name || '',
        primary_contact_email: client.primary_contact_email || '',
        primary_contact_phone: client.primary_contact_phone || '',
        location: client.location || '',
        notes: client.notes || '',
        status: client.status
      });
    } else {
      setFormData({
        name: '',
        company_id: '',
        commercial_name: '',
        sap_number: '',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        location: '',
        notes: '',
        status: 'active'
      });
    }
    setError(null);
  }, [client, isOpen]);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            {client ? 'Edit Client' : 'Add Client'}
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
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Company ID
              </label>
              <input
                type="text"
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Commercial Name
              </label>
              <input
                type="text"
                value={formData.commercial_name}
                onChange={(e) => setFormData({ ...formData, commercial_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                SAP Number
              </label>
              <input
                type="text"
                value={formData.sap_number}
                onChange={(e) => setFormData({ ...formData, sap_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Primary Contact Name
              </label>
              <input
                type="text"
                value={formData.primary_contact_name}
                onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Primary Contact Email
              </label>
              <input
                type="email"
                value={formData.primary_contact_email}
                onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Primary Contact Phone
              </label>
              <input
                type="tel"
                value={formData.primary_contact_phone}
                onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notes
            </label>
            <textarea
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
                onChange={(e) => setFormData({ 
                  ...formData, 
                  status: e.target.checked ? 'active' : 'inactive'
                })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-text-secondary">Active</span>
            </label>
          </div>

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
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
