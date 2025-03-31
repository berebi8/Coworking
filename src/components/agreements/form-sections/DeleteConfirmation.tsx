import React from 'react';
import { Trash } from 'lucide-react';

interface DeleteConfirmationProps {
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  onDelete: () => void;
}

export function DeleteConfirmation({ showDeleteConfirm, setShowDeleteConfirm, onDelete }: DeleteConfirmationProps) {
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');

  const handleDelete = () => {
    if (deleteConfirmText === 'DELETE') {
      onDelete();
    }
  };

  if (!showDeleteConfirm) {
    return (
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
        >
          Delete Agreement
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          To delete this agreement, type "DELETE" in the field below and click confirm:
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
            <div className="flex items-center justify-center space-x-2">
              <Trash className="h-4 w-4" />
              <span>Confirm Delete</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
