import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ClientsTable } from './ClientsTable';
import { ClientDialog } from './ClientDialog';
import { ExportMenu } from '../common/ExportMenu';
import { exportClients } from '../../lib/export';
import type { Client, ClientFormData, ClientStatus } from '../../types/database';

type StatusFilter = ClientStatus | 'all';

export function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, [statusFilter, locationFilter]);

  const fetchClients = async () => {
    try {
      // First get all unique clients from agreements
      const { data: agreementClients, error: agreementError } = await supabase
        .from('agreement_calculated_view')
        .select('licensee_name, commercial_name, company_id, building')
        .order('commercial_name');

      if (agreementError) throw agreementError;

      // Then get any additional clients from the clients table
      const { data: additionalClients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('commercial_name');

      if (clientsError) throw clientsError;

      // Merge and deduplicate clients
      const uniqueClients = new Map();

      // First add agreement clients
      agreementClients?.forEach(agreement => {
        if (!uniqueClients.has(agreement.company_id)) {
          uniqueClients.set(agreement.company_id, {
            id: agreement.company_id,
            name: agreement.licensee_name, // Use licensee_name from agreements
            commercial_name: agreement.commercial_name,
            company_id: agreement.company_id,
            location: agreement.building,
            status: 'active' as const,
            source: 'agreement'
          });
        }
      });

      // Then add/update with clients table data
      additionalClients?.forEach(client => {
        // If client exists from agreements, merge the data
        const existingClient = uniqueClients.get(client.company_id);
        if (existingClient) {
          uniqueClients.set(client.company_id, {
            ...client,
            // Keep agreement data if it exists
            name: existingClient.name || client.name,
            commercial_name: existingClient.commercial_name || client.commercial_name,
            location: existingClient.location || client.location,
            source: 'both'
          });
        } else {
          uniqueClients.set(client.company_id, {
            ...client,
            source: 'clients'
          });
        }
      });

      // Apply filters
      let filteredClients = Array.from(uniqueClients.values());

      if (statusFilter !== 'all') {
        filteredClients = filteredClients.filter(client => client.status === statusFilter);
      }

      if (locationFilter !== 'all') {
        filteredClients = filteredClients.filter(client => client.location === locationFilter);
      }

      setClients(filteredClients);
      setError(null);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients. Please try refreshing the page.');
    }
  };

  const handleSave = async (formData: ClientFormData) => {
    try {
      if (selectedClient) {
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedClient.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('clients')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      setIsDialogOpen(false);
      setSelectedClient(undefined);
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      throw error;
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setStatusFilter('active');
    setLocationFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-secondary">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-secondary">Location:</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Locations</option>
              {/* TODO: Add locations from database */}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Reset
          </button>
        </div>

        <button
          onClick={() => {
            setSelectedClient(undefined);
            setIsDialogOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-coral-light text-coral-dark rounded-lg">
          {error}
        </div>
      )}

      <ClientsTable
        clients={clients}
        onEdit={handleEdit}
      />

      <ClientDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedClient(undefined);
        }}
        onSave={handleSave}
        client={selectedClient}
      />
    </div>
  );
}
