import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../../lib/supabase';
import { ParkingTable } from './ParkingTable';
import { ParkingDialog } from './ParkingDialog';
import { ImportDialog } from './ImportDialog';
import { ImportRollbackBanner } from './ImportRollbackBanner';
import type { AddonService, AddonServiceFormData, AddonServiceStatus, Location } from '../../types/database';

type StatusFilter = AddonServiceStatus | 'all';

// List of parking service types
const PARKING_TYPES = ['parking_reserved', 'parking_unassigned', 'parking_ev', 'parking_vip'];

export function ParkingManagement() {
  const [services, setServices] = useState<AddonService[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AddonService | undefined>();
  const [importBackup, setImportBackup] = useState<AddonService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchServices();
  }, [statusFilter, locationFilter]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to load locations. Please try refreshing the page.');
      setLocations([]);
    }
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('addon_services')
        .select('*')
        .in('type', PARKING_TYPES);
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (locationFilter.length > 0) {
        query = query.overlaps('locations', locationFilter);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      setServices(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load parking services. Please try refreshing the page.');
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (formData: AddonServiceFormData) => {
    try {
      // Add a default type when saving
      const serviceData = {
        ...formData,
        type: selectedService?.type || 'parking_reserved'
      };

      if (selectedService) {
        const { error } = await supabase
          .from('addon_services')
          .update({
            ...serviceData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('addon_services')
          .insert([{
            ...serviceData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      setIsDialogOpen(false);
      setSelectedService(undefined);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      throw error;
    }
  };

  const handleDelete = async (service: AddonService) => {
    try {
      const { error } = await supabase
        .from('addon_services')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', service.id);

      if (error) throw error;

      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete parking service. Please try again.');
    }
  };

  const handleEdit = (service: AddonService) => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setStatusFilter('active');
    setLocationFilter([]);
  };

  const handleImportComplete = (backup: AddonService[]) => {
    setImportBackup(backup);
    setIsImportDialogOpen(false);
    fetchServices();
  };

  const locationOptions = locations.map(location => ({
    value: location.id,
    label: location.name
  }));

  const selectedLocations = locationOptions.filter(option => 
    locationFilter.includes(option.value)
  );

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
            <label className="text-sm font-medium text-text-secondary">Location:</label>
            <div className="w-64">
              <Select
                isMulti
                options={locationOptions}
                value={selectedLocations}
                onChange={(selected) => setLocationFilter(selected.map(option => option.value))}
                className="text-sm"
                placeholder="All Locations"
                isClearable
              />
            </div>
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
            setSelectedService(undefined);
            setIsDialogOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Parking</span>
        </button>
      </div>

      <ParkingTable
        services={services}
        locations={locations}
        onEdit={handleEdit}
        onImport={() => setIsImportDialogOpen(true)}
      />

      <ParkingDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedService(undefined);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        service={selectedService}
        locations={locations}
      />

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onComplete={handleImportComplete}
        locations={locations}
      />

      {importBackup && (
        <ImportRollbackBanner
          backup={importBackup}
          onClose={() => setImportBackup(null)}
        />
      )}
    </div>
  );
}
