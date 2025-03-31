import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AgreementsTable } from './AgreementsTable';
import { AgreementDialog } from './AgreementDialog';
import { ExportMenu } from '../common/ExportMenu';
import { exportAgreements } from '../../lib/export';
import { generateDocId } from '../../lib/utils';
import type { Agreement, AgreementFormData, AgreementStatus, AgreementType, Location, OfficeProperty, AddonService } from '../../types/database';

type StatusFilter = AgreementStatus | 'all';
type TypeFilter = AgreementType | 'all';

export function AgreementsManagement() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableOffices, setAvailableOffices] = useState<OfficeProperty[]>([]);
  const [availableServices, setAvailableServices] = useState<AddonService[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({
    start: '2000-01-01',
    end: '2100-12-31'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await Promise.all([
          fetchLocations(),
          fetchOffices(),
          fetchServices(),
          fetchAgreements()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [statusFilter, typeFilter, locationFilter, companyFilter, dateRange]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  };

  const fetchOffices = async () => {
    try {
      const { data, error } = await supabase
        .from('office_properties')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('status', 'active')
        .order('office_id');

      if (error) throw error;
      setAvailableOffices(data || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
      throw error;
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('addon_services')
        .select('*')
        .not('type', 'in', '(parking_reserved,parking_unassigned,parking_ev,parking_vip)')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setAvailableServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  };

  const fetchAgreements = async () => {
    try {
      let query = supabase
        .from('agreement_calculated_view')
        .select('*');
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (locationFilter !== 'all') {
        query = query.eq('building', locationFilter);
      }

      if (companyFilter !== 'all') {
        query = query.eq('commercial_name', companyFilter);
      }

      query = query
        .gte('start_date', dateRange.start)
        .lte('start_date', dateRange.end)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setAgreements(data || []);
    } catch (error) {
      console.error('Error fetching agreements:', error);
      throw error;
    }
  };

  const handleEdit = async (agreement: Agreement) => {
    try {
      const { data, error } = await supabase
        .from('agreement_calculated_view')
        .select('*')
        .eq('id', agreement.id)
        .single();

      if (error) throw error;

      setSelectedAgreement(data);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching agreement details:', error);
      setError('Failed to load agreement details');
    }
  };

  const handleSave = async (formData: AgreementFormData) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      if (selectedAgreement) {
        const { error: updateError } = await supabase
          .from('agreements')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', selectedAgreement.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('agreements')
          .insert([{
            ...formData,
            doc_id: generateDocId(),
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: user.id,
            updated_by: user.id
          }]);

        if (insertError) throw insertError;
      }

      setIsDialogOpen(false);
      setSelectedAgreement(undefined);
      await fetchAgreements();
    } catch (error: any) {
      console.error('Error saving agreement:', error);
      throw error;
    }
  };

  const handleDelete = async (agreement: Agreement) => {
    try {
      const { error } = await supabase
        .from('agreements')
        .delete()
        .eq('id', agreement.id);

      if (error) throw error;
      setIsDialogOpen(false);
      await fetchAgreements();
    } catch (error) {
      console.error('Error deleting agreement:', error);
      setError('Failed to delete agreement');
    }
  };

  const handleStatusChange = async (agreement: Agreement, newStatus: AgreementStatus) => {
    try {
      const { error } = await supabase
        .from('agreements')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', agreement.id);

      if (error) throw error;
      await fetchAgreements();
    } catch (error) {
      console.error('Error updating agreement status:', error);
      setError('Failed to update agreement status');
    }
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleQuickDateSelect = (option: 'this-month' | 'last-quarter' | 'this-year' | 'all') => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (option) {
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last-quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'all':
        start = new Date(2000, 0, 1);
        end = new Date(2100, 11, 31);
        break;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  const handleReset = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setLocationFilter('all');
    setCompanyFilter('all');
    handleQuickDateSelect('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-coral-light text-coral-dark rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Agreements & Drafts</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setSelectedAgreement(undefined);
              setIsDialogOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Draft</span>
          </button>
          <ExportMenu onExport={(format) => exportAgreements(agreements, format)} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Date Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <span className="text-text-secondary">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Quick Select
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuickDateSelect('this-month')}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                This Month
              </button>
              <button
                onClick={() => handleQuickDateSelect('last-quarter')}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Last Quarter
              </button>
              <button
                onClick={() => handleQuickDateSelect('this-year')}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                This Year
              </button>
              <button
                onClick={() => handleQuickDateSelect('all')}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                All Dates
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Companies</option>
              {agreements
                .filter((agreement, index, self) => 
                  index === self.findIndex(a => a.commercial_name === agreement.commercial_name)
                )
                .map(agreement => (
                  <option key={agreement.commercial_name} value={agreement.commercial_name}>
                    {agreement.commercial_name}
                  </option>
                ))
              }
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft (Not Approved)</option>
              <option value="draft_approved">Draft (Approved)</option>
              <option value="signed">Signed Contract</option>
              <option value="cancelled">Cancelled Contract</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Document Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="license">License Agreement</option>
              <option value="addendum">Addendum</option>
              <option value="termination">Termination Notice</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <AgreementsTable
        agreements={agreements}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
      />

      <AgreementDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedAgreement(undefined);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        agreement={selectedAgreement}
        locations={locations}
        availableOffices={availableOffices}
        availableServices={availableServices}
      />
    </div>
  );
}
