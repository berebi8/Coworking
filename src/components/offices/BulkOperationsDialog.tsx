import React, { useState } from 'react';
import { X } from 'lucide-react';

interface BulkOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (operation: string, value: number) => void;
  selectedCount: number;
}

export function BulkOperationsDialog({ isOpen, onClose, onSubmit, selectedCount }: BulkOperationsDialogProps) {
  const [operation, setOperation] = useState('price');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    onSubmit(operation, numValue);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            Bulk Update ({selectedCount} offices)
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
            <label htmlFor="operation" className="block text-sm font-medium text-text-secondary mb-1">
              Operation
            </label>
            <select
              id="operation"
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="price">Update List Price</option>
              <option value="mr_credits">Update MR Credits</option>
              <option value="print_quota_bw">Update B&W Print Quota</option>
              <option value="print_quota_color">Update Color Print Quota</option>
              <option value="status">Change Status</option>
            </select>
          </div>

          {operation === 'status' ? (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={value === '1'}
                  onChange={(e) => setValue(e.target.checked ? '1' : '0')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-text-secondary">Active</span>
              </label>
            </div>
          ) : (
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-text-secondary mb-1">
                {operation === 'price' ? 'New Price (NIS)' :
                 operation === 'mr_credits' ? 'New MR Credits' :
                 operation === 'print_quota_bw' ? 'New B&W Print Quota' :
                 'New Color Print Quota'}
              </label>
              <input
                type="number"
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                step={operation === 'price' ? '100' : '1'}
                required
              />
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
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
