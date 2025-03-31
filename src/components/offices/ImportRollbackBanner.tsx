import React, { useState } from 'react';
import { History, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { OfficeProperty } from '../../types/database';

interface ImportRollbackBannerProps {
  backup: OfficeProperty[];
  onClose: () => void;
}

export function ImportRollbackBanner({ backup, onClose }: ImportRollbackBannerProps) {
  const [isRollingBack, setIsRollingBack] = useState(false);

  const handleRollback = async () => {
    setIsRollingBack(true);
    try {
      // Start a batch operation
      const batchSize = 100;
      const batches = Math.ceil(backup.length / batchSize);

      // First delete all records except one to maintain RLS
      await supabase
        .from('office_properties')
        .delete()
        .neq('id', backup[0]?.id || '');

      // Delete associated price history
      await supabase
        .from('office_price_history')
        .delete()
        .not('office_id', 'in', `(${backup.map(o => `'${o.id}'`).join(',')})`);

      // Then restore backup in batches
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = start + batchSize;
        const batchData = backup.slice(start, end).map(record => ({
          ...record,
          created_at: new Date(record.created_at).toISOString(),
          updated_at: new Date(record.updated_at).toISOString(),
          deleted_at: record.deleted_at ? new Date(record.deleted_at).toISOString() : null
        }));

        // First restore the office properties
        const { error: officeError } = await supabase
          .from('office_properties')
          .upsert(batchData, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (officeError) throw officeError;

        // Then restore price history for this batch if it exists
        const { data: priceHistory } = await supabase
          .from('office_price_history')
          .select('*')
          .in('office_id', batchData.map(o => o.id));

        if (priceHistory && priceHistory.length > 0) {
          const { error: historyError } = await supabase
            .from('office_price_history')
            .upsert(priceHistory.map(record => ({
              ...record,
              changed_at: new Date(record.changed_at).toISOString()
            })), {
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (historyError) throw historyError;
        }
      }

      window.location.reload();
    } catch (error) {
      console.error('Error rolling back:', error);
      setIsRollingBack(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-lg border border-coral p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-coral-light rounded-full flex items-center justify-center">
            <History className="h-5 w-5 text-coral" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">
              Recent Import Detected
            </h3>
            <p className="text-sm text-text-secondary">
              Review the imported data and choose to keep or rollback the changes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRollback}
            disabled={isRollingBack}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors disabled:opacity-50"
          >
            {isRollingBack ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <History className="h-4 w-4" />
            )}
            <span>{isRollingBack ? 'Rolling Back...' : 'Rollback Changes'}</span>
          </button>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
