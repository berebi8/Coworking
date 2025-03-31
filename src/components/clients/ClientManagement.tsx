import React, { useState, useEffect } from 'react';
import { Building2, FileText, Plus, Printer, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ClientHeader } from './ClientHeader';
import { ContractTimeline } from './ContractTimeline';
import { CurrentProducts } from './CurrentProducts';
import { DocumentHistory } from './DocumentHistory';
import { FutureChanges } from './FutureChanges';
import type { Agreement } from '../../types/database';

type TabType = 'current' | 'documents' | 'future';

export function ClientManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('agreement_calculated_view')
        .select('*')
        .order('start_date', { ascending: true });

      if (fetchError) throw fetchError;
      setAgreements(data || []);
    } catch (error: any) {
      console.error('Error fetching agreements:', error);
      setError('Failed to load client data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewDraft = () => {
    // TODO: Implement new draft creation
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-secondary">Loading client data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-coral-light text-coral-dark rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <ClientHeader onNewDraft={handleNewDraft} />

      {/* Contract Timeline */}
      <ContractTimeline 
        agreements={agreements}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'current'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
              }
            `}
          >
            Current Products
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'documents'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
              }
            `}
          >
            Documents & History
          </button>
          <button
            onClick={() => setActiveTab('future')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'future'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
              }
            `}
          >
            Future Changes
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'current' && (
          <CurrentProducts 
            agreements={agreements}
            selectedDate={selectedDate}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentHistory 
            agreements={agreements}
          />
        )}
        {activeTab === 'future' && (
          <FutureChanges 
            agreements={agreements}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
}
