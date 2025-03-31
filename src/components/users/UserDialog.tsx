import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AppUser, UserFormData } from '../../types/database';

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserFormData) => void;
  onDelete: (user: AppUser) => void;
  user?: AppUser;
}

export function UserDialog({ isOpen, onClose, onSave, onDelete, user }: UserDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    full_name: '',
    email: '',
    role: 'Client',
    notes: '',
    status: 'active',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        full_name: user.full_name,
        email: user.masked_email || user.email,
        role: user.role,
        notes: user.notes || '',
        status: user.status,
      });
    } else {
      // Reset form when adding new user
      setFormData({
        username: '',
        full_name: '',
        email: '',
        role: 'Client',
        notes: '',
        status: 'active',
      });
    }
  }, [user]);

  // Reset state when dialog closes
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
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        setError('This email address is already in use');
      } else {
        setError(error.message || 'An error occurred while saving');
      }
    }
  };

  const handleDelete = () => {
    if (deleteConfirmText === 'DELETE' && user) {
      onDelete(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            {user ? 'Edit User' : 'Add User'}
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
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-text-secondary mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={user?.status === 'deleted'}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text-secondary mb-1">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppUser['role'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="Admin">Admin</option>
              <option value="Finance Manager">Finance Manager</option>
              <option value="Coworking Manager">Coworking Manager</option>
              <option value="Client">Client</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={user?.status === 'deleted'}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
          
          {user && user.status !== 'deleted' && (
            <div className="pt-4 border-t border-gray-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                >
                  Delete User
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary">
                    To delete this user, type "DELETE" in the field below and click confirm:
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
              disabled={user?.status === 'deleted'}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
