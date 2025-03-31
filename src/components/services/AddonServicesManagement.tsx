import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../../lib/supabase';
import { AddonServicesTable } from './AddonServicesTable';
import { AddonServiceDialog } from './AddonServiceDialog';
import { ImportDialog } from './ImportDialog';
import { ImportRollbackBanner } from './ImportRollbackBanner';
import type { AddonService, AddonServiceFormData, AddonServiceStatus, Location } from '../../types/database';

type StatusFilter = AddonServiceStatus | 'all';

// List of non-parking service types
const SERVICE_TYPES = ['amenities', 'room', 'storage', 'technology', 'support'];

export function AddonServicesManagement() {
  const [services, setServices] = useState<AddonService[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [incidentalFilter, setIncidentalFilter] = useState<boolean | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AddonService | undefined>();
  const [importBackup, setImportBackup] = useState<AddonService[] | null>(null);

  useEffect(() => {
    fetchLocations();
    fetchServices();
  }, [statusFilter, locationFilter, incidentalFilter]);

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching locations:', error);
      return;
    }

    setLocations(data);
  };

  const fetchServices = async () => {
    let query = supabase
      .from('addon_services')
      .select('*')
      .in('type', SERVICE_TYPES); // Only fetch non-parking services
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (locationFilter.length > 0) {
      query = query.overlaps('locations', locationFilter);
    }

    if (incidentalFilter !== null) {
      query = query.eq('is_incidental', incidentalFilter);
    }

    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching services:', error);
      return;
    }

    setServices(data);
  };

  const handleSave = async (formData: AddonServiceFormData) => {
    try {
      // Add a default type when saving
      const serviceData = {
        ...formData,
        type: selectedService?.type || 'amenities' // Default to amenities for new services
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
    }
  };

  const handleEdit = (service: AddonService) => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setStatusFilter('active');
    setLocationFilter([]);
    setIncidentalFilter(null);
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

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-secondary">Add-On/Incidental:</label>
            <select
              value={incidentalFilter === null ? 'all' : incidentalFilter.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setIncidentalFilter(value === 'all' ? null : value === 'true');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All</option>
              <option value="false">Add-On Services</option>
              <option value="true">Incidentals</option>
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
            setSelectedService(undefined);
            setIsDialogOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </button>
      </div>

      <AddonServicesTable
        services={services}
        locations={locations}
        onEdit={handleEdit}
        onImport={() => setIsImportDialogOpen(true)}
      />

      <AddonServiceDialog
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
