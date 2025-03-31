import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { OfficesTable } from './OfficesTable';
import { OfficeDialog } from './OfficeDialog';
import { ImportDialog } from './ImportDialog';
import { BulkOperationsDialog } from './BulkOperationsDialog';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { ExportMenu } from '../common/ExportMenu';
import { exportOffices } from '../../lib/export';
import type { OfficeProperty, OfficeStatus, OfficeViewType, OfficeType, Location } from '../../types/database';
import { ImportRollbackBanner } from './ImportRollbackBanner';

type StatusFilter = OfficeStatus | 'all';
type ViewFilter = OfficeViewType | 'all';
type TypeFilter = OfficeType | 'all';

export function OfficesManagement() {
  const [offices, setOffices] = useState<OfficeProperty[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<OfficeProperty | undefined>();
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [totalOffices, setTotalOffices] = useState<number>(0);
  const [importBackup, setImportBackup] = useState<OfficeProperty[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
    fetchOffices();
  }, [statusFilter, locationFilter, floorFilter, viewFilter, typeFilter]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          floors:location_floors(*)
        `)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching locations:', error);
        setError('Failed to fetch locations. Please try refreshing the page.');
        return;
      }

      setLocations(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to fetch locations. Please try refreshing the page.');
      setLocations([]);
    }
  };

  const fetchOffices = async () => {
    try {
      let query = supabase
        .from('office_properties')
        .select(`
          *,
          location:locations(
            *,
            floors:location_floors(*)
          )
        `);
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (locationFilter !== 'all') {
        query = query.eq('location_id', locationFilter);
      }

      if (floorFilter !== 'all') {
        query = query.eq('floor', floorFilter);
      }

      if (viewFilter !== 'all') {
        query = query.eq('view_type', viewFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('office_type', typeFilter);
      }

      const { data, error } = await query.order('office_id');
      
      if (error) {
        console.error('Error fetching offices:', error);
        setError('Failed to fetch offices. Please try refreshing the page.');
        return;
      }

      setOffices(data || []);

      // Update available floors
      const uniqueFloors = [...new Set(data.map(office => office.floor))].sort((a, b) => a - b);
      setFloors(uniqueFloors);

      // Get total count
      const { count, error: countError } = await supabase
        .from('office_properties')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        setTotalOffices(count || 0);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching offices:', error);
      setError('Failed to fetch offices. Please try refreshing the page.');
      setOffices([]);
      setFloors([]);
      setTotalOffices(0);
    }
  };

  const handleEdit = (office: OfficeProperty) => {
    setSelectedOffice(office);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: OfficeFormData) => {
    try {
      // Check for existing office with same office_id
      const { data: existingOffices, error: checkError } = await supabase
        .from('office_properties')
        .select('id, office_id')
        .eq('office_id', formData.office_id)
        .neq('status', 'deleted');

      if (checkError) throw checkError;

      // If editing, filter out the current office from duplicates check
      const duplicates = selectedOffice
        ? existingOffices?.filter(office => office.id !== selectedOffice.id)
        : existingOffices;

      if (duplicates && duplicates.length > 0) {
        throw new Error('Office ID is already in use');
      }

      if (selectedOffice) {
        // Store old price for history
        const oldPrice = selectedOffice.list_price;

        const { error: updateError } = await supabase
          .from('office_properties')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedOffice.id);

        if (updateError) throw updateError;

        // If price changed, record in history
        if (oldPrice !== formData.list_price) {
          const { error: historyError } = await supabase
            .from('office_price_history')
            .insert({
              office_id: selectedOffice.id,
              old_price: oldPrice,
              new_price: formData.list_price,
              changed_by: (await supabase.auth.getUser()).data.user?.id
            });

          if (historyError) throw historyError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('office_properties')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      setIsDialogOpen(false);
      setSelectedOffice(undefined);
      fetchOffices();
    } catch (error: any) {
      console.error('Error saving office:', error);
      throw error;
    }
  };

  const handleDelete = async (office: OfficeProperty) => {
    try {
      const { error } = await supabase
        .from('office_properties')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', office.id);

      if (error) throw error;

      fetchOffices();
    } catch (error) {
      console.error('Error deleting office:', error);
    }
  };

  const handlePermanentDelete = async (office: OfficeProperty) => {
    try {
      // First verify if the user is an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminUser, error: adminCheckError } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (adminCheckError || !adminUser) throw new Error('User not found');
      if (adminUser.role !== 'Admin') throw new Error('Only administrators can permanently delete offices');

      // Delete price history first
      const { error: historyError } = await supabase
        .from('office_price_history')
        .delete()
        .eq('office_id', office.id);

      if (historyError) throw historyError;

      // Then delete the office
      const { error: officeError } = await supabase
        .from('office_properties')
        .delete()
        .eq('id', office.id);

      if (officeError) throw officeError;

      // Refresh the office list
      await fetchOffices();
    } catch (error: any) {
      console.error('Error permanently deleting office:', error);
      alert(error.message || 'An error occurred while deleting the office');
    }
  };

  const handleBulkOperation = async (operation: string, value: number) => {
    try {
      const updates: any = {};
      const user_id = (await supabase.auth.getUser()).data.user?.id;

      switch (operation) {
        case 'price':
          updates.list_price = value;
          // Record price history for each office
          for (const officeId of selectedOffices) {
            const office = offices.find(o => o.id === officeId);
            if (office) {
              await supabase
                .from('office_price_history')
                .insert({
                  office_id: officeId,
                  old_price: office.list_price,
                  new_price: value,
                  changed_by: user_id
                });
            }
          }
          break;
        case 'mr_credits':
          updates.mr_credits = value;
          break;
        case 'print_quota_bw':
          updates.print_quota_bw = value;
          break;
        case 'print_quota_color':
          updates.print_quota_color = value;
          break;
        case 'status':
          updates.status = value ? 'active' : 'inactive';
          break;
      }

      const { error } = await supabase
        .from('office_properties')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedOffices);

      if (error) throw error;

      setIsBulkDialogOpen(false);
      setSelectedOffices([]);
      fetchOffices();
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('office_properties')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .in('id', selectedOffices);

      if (error) throw error;

      setSelectedOffices([]);
      fetchOffices();
    } catch (error) {
      console.error('Error performing bulk delete:', error);
    }
  };

  const handleReset = () => {
    setStatusFilter('active');
    setLocationFilter('all');
    setFloorFilter('all');
    setViewFilter('all');
    setTypeFilter('all');
  };

  const handleImportComplete = (backup: OfficeProperty[]) => {
    setImportBackup(backup);
    setIsImportDialogOpen(false);
    fetchOffices();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-coral-light text-coral-dark rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-secondary">Location:</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-secondary">Floor:</label>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Floors</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-secondary">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="office">Office</option>
              <option value="hot_desk">Hot Desk</option>
            </select>
          </div>
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
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-secondary">View:</label>
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Views</option>
              <option value="sea_view">Sea View</option>
              <option value="city_view">City View</option>
              <option value="internal">Internal</option>
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
            setSelectedOffice(undefined);
            setIsDialogOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Office</span>
        </button>
      </div>

      <OfficesTable
        offices={offices}
        onEdit={handleEdit}
        selectedOffices={selectedOffices}
        onSelectionChange={setSelectedOffices}
        onImport={() => setIsImportDialogOpen(true)}
      />

      {selectedOffices.length > 0 && (
        <div className="fixed bottom-8 right-8 flex space-x-4">
          <button
            onClick={() => setIsBulkDeleteDialogOpen(true)}
            className="action-button bg-coral hover:bg-coral-dark"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Selected ({selectedOffices.length})</span>
          </button>
          <button
            onClick={() => setIsBulkDialogOpen(true)}
            className="action-button bg-primary hover:bg-primary-dark"
          >
            Bulk Update ({selectedOffices.length} selected)
          </button>
        </div>
      )}

      <OfficeDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedOffice(undefined);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        onPermanentDelete={handlePermanentDelete}
        office={selectedOffice}
        locations={locations}
      />

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onComplete={handleImportComplete}
        locations={locations}
      />

      <BulkOperationsDialog
        isOpen={isBulkDialogOpen}
        onClose={() => setIsBulkDialogOpen(false)}
        onSubmit={handleBulkOperation}
        selectedCount={selectedOffices.length}
      />

      <BulkDeleteDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        selectedCount={selectedOffices.length}
        onDelete={handleBulkDelete}
      />

      {importBackup && (
        <ImportRollbackBanner
          backup={importBackup}
          onClose={() => setImportBackup(null)}
        />
      )}

      <div className="mt-8 text-sm text-text-secondary">
        Last updated: {new Date().toLocaleDateString()} | {totalOffices} offices in database
      </div>
    </div>
  );
}
