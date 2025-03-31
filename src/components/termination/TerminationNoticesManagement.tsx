import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TerminationNoticeDialog } from './TerminationNoticeDialog';
import { TerminationNoticesTable } from './TerminationNoticesTable';
import { ExportMenu } from '../common/ExportMenu';
import { exportTerminationNotices } from '../../lib/export';
import type { TerminationNotice, Client, AppUser, TerminationNoticeFormData, TerminationNoticeStatus } from '../../types/database';

// Define the enhanced client type for the dropdown
interface EligibleClient extends Client {
  isEligibleForNewNotice: boolean; // True if NO draft/active notice exists
  hasActiveAgreement: boolean;     // True if at least one 'signed' agreement started on/before today
}

// Helper function to format date
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  } catch (e) { return ''; }
};

// Helper function to format date-time
const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleString();
  } catch (e) { return ''; }
};


export function TerminationNoticesManagement() {
  const [notices, setNotices] = useState<TerminationNotice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<TerminationNotice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<TerminationNotice | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<AppUser | undefined>(undefined);
  const [eligibleClients, setEligibleClients] = useState<EligibleClient[]>([]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: appUser, error: userError } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (userError) throw userError;
        setCurrentUser(appUser || undefined);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError('Failed to fetch user information.');
    }
  }, []);

  const fetchEligibleClients = useCallback(async () => {
    try {
      // 1. Fetch active clients
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, company_id, commercial_name, status')
        .eq('status', 'active')
        .order('commercial_name');
      if (clientError) throw clientError;

      // 2. Fetch company IDs with existing 'draft' or 'active' termination notices
      const { data: existingNotices, error: noticeError } = await supabase
        .from('termination_notices')
        .select('company_id')
        .in('status', ['draft', 'active']);
      if (noticeError) throw noticeError;
      const ineligibleNoticeCompanyIds = new Set(
        existingNotices?.map(n => n.company_id).filter((id): id is string => id != null) || []
      );

      // 3. Fetch company IDs with 'signed' agreements that have started
      const today = new Date().toISOString().split('T')[0];
      const { data: activeAgreements, error: agreementError } = await supabase
        .from('agreements')
        .select('company_id')
        .eq('status', 'signed') // 'signed' is the active status for agreements
        .lte('start_date', today); // Start date is on or before today
      if (agreementError) throw agreementError;
      const activeAgreementCompanyIds = new Set(
        activeAgreements?.map(a => a.company_id).filter((id): id is string => id != null) || []
      );

      // 4. Map clients and determine eligibility based on BOTH criteria
      const processedClients: EligibleClient[] = (clients || []).map(client => {
        const hasExistingNotice = client.company_id != null && ineligibleNoticeCompanyIds.has(client.company_id);
        const hasActiveAgreement = client.company_id != null && activeAgreementCompanyIds.has(client.company_id);
        return {
          ...client,
          isEligibleForNewNotice: !hasExistingNotice,
          hasActiveAgreement: hasActiveAgreement
        };
      });

      setEligibleClients(processedClients);

    } catch (error: any) {
      console.error('Error fetching eligible clients:', error);
      setError(`Failed to load client data for dropdown: ${error.message}`);
      setEligibleClients([]);
    }
  }, []);


  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Ensure the select includes the necessary fields from related tables
      const { data, error } = await supabase
        .from('termination_notices')
        .select(`
          id,
          doc_id,
          company_id,
          notice_date,
          recipient_id,
          expected_end_date,
          override_end_date,
          notes,
          status,
          created_at,
          updated_at,
          created_by,
          updated_by,
          recipient:recipient_id ( id, username ),
          client:company_id ( id, company_id, commercial_name )
        `)
        .order('notice_date', { ascending: false });

      if (error) throw error;

      // Type assertion to ensure data matches TerminationNotice[]
      const typedData = (data as TerminationNotice[]) || [];
      setNotices(typedData);
      setFilteredNotices(typedData);

    } catch (error: any) {
      console.error('Error fetching termination notices:', error);
      setError(`Failed to load termination notices: ${error.message}`);
      setNotices([]);
      setFilteredNotices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchNotices();
    fetchEligibleClients();
  }, [fetchCurrentUser, fetchNotices, fetchEligibleClients]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = notices.filter(notice =>
      notice.client?.commercial_name?.toLowerCase().includes(lowerSearchTerm) ||
      notice.doc_id?.toLowerCase().includes(lowerSearchTerm) ||
      notice.status.toLowerCase().includes(lowerSearchTerm) ||
      notice.recipient?.username?.toLowerCase().includes(lowerSearchTerm)
    );
    setFilteredNotices(filtered);
  }, [searchTerm, notices]);

  const handleSave = async (formData: TerminationNoticeFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const dataToSave = {
        ...formData,
        updated_by: currentUser?.id,
        ...(selectedNotice ? {} : { created_by: currentUser?.id })
      };

      let result;
      if (selectedNotice) {
        result = await supabase
          .from('termination_notices')
          .update(dataToSave)
          .eq('id', selectedNotice.id)
          .select()
          .single();
      } else {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
        const doc_id = `TN-${datePart}-${randomPart}`;
        result = await supabase
          .from('termination_notices')
          .insert({ ...dataToSave, doc_id })
          .select()
          .single();
      }

      const { data, error } = result;
      if (error) throw error;

      if (data) {
        await fetchNotices();
        await fetchEligibleClients(); // Refresh client eligibility
        setIsDialogOpen(false);
        setSelectedNotice(undefined);
      } else {
        throw new Error("No data returned after save operation.");
      }

    } catch (error: any) {
      console.error('Error saving termination notice:', error);
      setError(`Failed to save termination notice: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noticeToDelete: TerminationNotice) => {
     if (!currentUser || currentUser.role !== 'Admin') {
       setError('You do not have permission to delete notices.');
       return;
     }
     setIsLoading(true);
     setError(null);
     try {
       const { error } = await supabase
         .from('termination_notices')
         .delete()
         .eq('id', noticeToDelete.id);
       if (error) throw error;

       await fetchNotices();
       await fetchEligibleClients(); // Refresh client eligibility
       setIsDialogOpen(false);
       setSelectedNotice(undefined);

     } catch (error: any) {
       console.error('Error deleting termination notice:', error);
       setError(`Failed to delete termination notice: ${error.message}`);
     } finally {
       setIsLoading(false);
     }
   };

   const handleStatusChange = async (notice: TerminationNotice, newStatus: TerminationNoticeStatus) => {
     setIsLoading(true);
     setError(null);
     try {
       const { error } = await supabase
         .from('termination_notices')
         .update({ status: newStatus, updated_by: currentUser?.id })
         .eq('id', notice.id);

       if (error) throw error;

       // Optimistic update or refetch
       // Refetching is simpler for now
       await fetchNotices();
       await fetchEligibleClients(); // Status change might affect eligibility

     } catch (error: any) {
       console.error('Error updating notice status:', error);
       setError(`Failed to update status: ${error.message}`);
     } finally {
       setIsLoading(false);
     }
   };

  const handleAddNew = () => {
    setSelectedNotice(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (notice: TerminationNotice) => {
    setSelectedNotice(notice);
    setIsDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchNotices();
    fetchEligibleClients();
  };

  const getExportData = useCallback(() => {
    return filteredNotices.map(n => ({
      'Document ID': n.doc_id || '',
      'Company': n.client?.commercial_name || n.company_id || '', // Use nested data
      'Notice Date': formatDate(n.notice_date),
      'Recipient': n.recipient?.username || n.recipient_id || '', // Use nested data
      'Expected End Date': formatDate(n.expected_end_date),
      'Override End Date': formatDate(n.override_end_date),
      'Status': n.status || '',
      'Notes': n.notes || '',
      'Created At': formatDateTime(n.created_at),
      'Updated At': formatDateTime(n.updated_at),
    }));
  }, [filteredNotices]);

  return (
    <div className="p-6 bg-background-main min-h-screen">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">Termination Notices</h1>

      {error && (
        <div className="mb-4 p-3 bg-coral-light text-coral-dark rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-sm font-medium">Dismiss</button>
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-grow w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company, doc ID, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex space-x-2">
           <button
             onClick={handleRefresh}
             className="p-2 text-text-secondary hover:text-primary transition-colors"
             title="Refresh Data"
           >
             <RefreshCw className="h-5 w-5" />
           </button>
           <ExportMenu
             onExport={(format) => exportTerminationNotices(getExportData(), format)}
           />
           <button
             onClick={handleAddNew}
             className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center space-x-2"
           >
             <Plus className="h-5 w-5" />
             <span>Add New</span>
           </button>
        </div>
      </div>

      {isLoading && !notices.length ? (
        <div className="text-center py-10">Loading notices...</div>
      ) : !isLoading && !notices.length && !error ? (
         <div className="text-center py-10 text-text-secondary">No termination notices found.</div>
      ) : (
        <TerminationNoticesTable
          notices={filteredNotices}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange} // Pass the handler
          // isLoading prop removed as it's not used in the table
        />
      )}

      {isDialogOpen && (
        <TerminationNoticeDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setSelectedNotice(undefined); }}
          onSave={handleSave}
          onDelete={currentUser?.role === 'Admin' ? handleDelete : undefined}
          notice={selectedNotice}
          currentUser={currentUser}
          availableClients={eligibleClients} // Pass the enhanced list with eligibility flags
        />
      )}
    </div>
  );
}
