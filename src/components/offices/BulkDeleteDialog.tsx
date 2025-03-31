import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onDelete: () => void;
}

export function BulkDeleteDialog({ isOpen, onClose, selectedCount, onDelete }: BulkDeleteDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      // First verify the credentials
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw new Error('Invalid credentials');

      // Then verify if the user is an admin
      const { data: adminUser, error: adminCheckError } = await supabase
        .from('app_users')
        .select('role')
        .eq('email', email)
        .single();

      if (adminCheckError || !adminUser) throw new Error('User not found');
      if (adminUser.role !== 'Admin') throw new Error('Only administrators can perform this action');

      // If we get here, the user is verified as an admin
      onDelete();
      onClose();
    } catch (error: any) {
      setError(error.message || 'An error occurred during verification');
    } finally {
      setIsVerifying(false);
      setPassword(''); // Clear password for security
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            Confirm Bulk Delete
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-3 text-coral mb-4">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">You are about to delete {selectedCount} offices</p>
          </div>

          <p className="text-sm text-text-secondary mb-6">
            This action requires administrator verification. Please enter your admin credentials to proceed.
          </p>

          {error && (
            <div className="p-3 mb-4 bg-coral-light text-coral-dark rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                Admin Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
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
                disabled={isVerifying}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors disabled:opacity-50"
              >
                {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Delete {selectedCount} Offices</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
