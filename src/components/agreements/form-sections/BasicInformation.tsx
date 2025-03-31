import React from 'react';
import type { AgreementFormData, Location } from '../../../types/database';

interface BasicInformationProps {
  formData: AgreementFormData;
  setFormData: (data: AgreementFormData) => void;
  availableLocations: Location[];
  docId?: string;
}

export function BasicInformation({ formData, setFormData, availableLocations, docId }: BasicInformationProps) {
  const handleSameDetailsChange = (checked: boolean) => {
    if (checked) {
      // Copy Primary Member details to Invoicing details
      setFormData({
        ...formData,
        invoice_name: formData.primary_member_name || '',
        invoice_email: formData.primary_member_email || '',
        invoice_phone: formData.primary_member_phone || ''
      });
    }
  };

  return (
    <div className="space-y-6 bg-red-50 p-4 rounded-lg">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-text-secondary">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Name of Licensee
            </label>
            <input
              type="text"
              value={formData.licensee_name}
              onChange={(e) => setFormData({ ...formData, licensee_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              ID/Com. No.
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
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.commercial_name}
                onChange={(e) => setFormData({ ...formData, commercial_name: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              {docId && (
                <div className="w-48">
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    DOC ID
                  </label>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-text-secondary font-mono">
                    {docId}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Payment Method
            </label>
            <select
              value={formData.payment_method || 'standing_order'}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="standing_order">Standing Order</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_wire">Bank Wire Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Document Date
            </label>
            <input
              type="date"
              value={formData.document_date}
              onChange={(e) => setFormData({ ...formData, document_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Building
            </label>
            <select
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Select Building</option>
              {availableLocations.map(location => (
                <option key={location.id} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Service Agreement Type
            </label>
            <select
              value={formData.service_agreement_type}
              onChange={(e) => setFormData({ ...formData, service_agreement_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="private_office">Private Office</option>
              <option value="hot_desk">Hot Desk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Permitted Use
            </label>
            <input
              type="text"
              value={formData.permitted_use}
              onChange={(e) => setFormData({ ...formData, permitted_use: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Primary Member Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-text-secondary">Primary Member Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.primary_member_name || ''}
              onChange={(e) => setFormData({ ...formData, primary_member_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.primary_member_title || ''}
              onChange={(e) => setFormData({ ...formData, primary_member_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Telephone
            </label>
            <input
              type="tel"
              value={formData.primary_member_phone || ''}
              onChange={(e) => setFormData({ ...formData, primary_member_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email address
            </label>
            <input
              type="email"
              value={formData.primary_member_email || ''}
              onChange={(e) => setFormData({ ...formData, primary_member_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Checkbox for same details */}
      <div className="flex items-center space-x-2 border-t border-b border-gray-200 py-3">
        <input
          type="checkbox"
          id="same-details"
          onChange={(e) => handleSameDetailsChange(e.target.checked)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="same-details" className="text-sm font-medium text-text-secondary">
          Invoicing Details are the same as Primary Member Information
        </label>
      </div>

      {/* Invoicing Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-text-secondary">Invoicing Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.invoice_name || ''}
              onChange={(e) => setFormData({ ...formData, invoice_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email address
            </label>
            <input
              type="email"
              value={formData.invoice_email || ''}
              onChange={(e) => setFormData({ ...formData, invoice_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Telephone
            </label>
            <input
              type="tel"
              value={formData.invoice_phone || ''}
              onChange={(e) => setFormData({ ...formData, invoice_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
