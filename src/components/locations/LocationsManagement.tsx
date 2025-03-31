import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LocationsTable } from './LocationsTable';
import { LocationDialog } from './LocationDialog';
import type { Location, LocationFormData, LocationStatus } from '../../types/database';

type StatusFilter = LocationStatus | 'all';

export function LocationsManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();

  useEffect(() => {
    fetchLocations();
  }, [statusFilter]);

  const fetchLocations = async () => {
    let query = supabase
      .from('locations')
      .select(`
        *,
        floors:location_floors(*)
      `);
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching locations:', error);
      return;
    }

    setLocations(data);
  };

  const handleSave = async (formData: LocationFormData) => {
    try {
      // Check for existing location with same location_id
      const { data: existingLocations, error: checkError } = await supabase
        .from('locations')
        .select('id, location_id')
        .eq('location_id', formData.location_id)
        .neq('status', 'deleted');

      if (checkError) throw checkError;

      // If editing, filter out the current location from duplicates check
      const duplicates = selectedLocation
        ? existingLocations?.filter(loc => loc.id !== selectedLocation.id)
        : existingLocations;

      if (duplicates && duplicates.length > 0) {
        throw new Error('Location ID is already in use');
      }

      if (selectedLocation) {
        // Update location
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            name: formData.name,
            location_id: formData.location_id,
            notes: formData.notes,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedLocation.id);

        if (updateError) throw updateError;

        // Update floors
        const { error: deleteFloorsError } = await supabase
          .from('location_floors')
          .delete()
          .eq('location_id', selectedLocation.id);

        if (deleteFloorsError) throw deleteFloorsError;

        const { error: insertFloorsError } = await supabase
          .from('location_floors')
          .insert(
            formData.floors.map(floor => ({
              location_id: selectedLocation.id,
              floor_number: floor.floor_number,
              notes: floor.notes,
              status: formData.status
            }))
          );

        if (insertFloorsError) throw insertFloorsError;
      } else {
        // Insert new location
        const { data: newLocation, error: insertError } = await supabase
          .from('locations')
          .insert([{
            name: formData.name,
            location_id: formData.location_id,
            notes: formData.notes,
            status: formData.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (insertError || !newLocation) throw insertError || new Error('Failed to create location');

        // Insert floors
        const { error: insertFloorsError } = await supabase
          .from('location_floors')
          .insert(
            formData.floors.map(floor => ({
              location_id: newLocation.id,
              floor_number: floor.floor_number,
              notes: floor.notes,
              status: formData.status
            }))
          );

        if (insertFloorsError) throw insertFloorsError;
      }

      setIsDialogOpen(false);
      setSelectedLocation(undefined);
      fetchLocations();
    } catch (error: any) {
      console.error('Error saving location:', error);
      throw error;
    }
  };

  const handleDelete = async (location: Location) => {
    try {
      // Delete floors first
      const { error: deleteFloorsError } = await supabase
        .from('location_floors')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('location_id', location.id);

      if (deleteFloorsError) throw deleteFloorsError;

      // Then delete location
      const { error } = await supabase
        .from('locations')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', location.id);

      if (error) throw error;

      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setStatusFilter('active');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
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
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Reset
          </button>
        </div>
        <button
          onClick={() => {
            setSelectedLocation(undefined);
            setIsDialogOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Location</span>
        </button>
      </div>

      <LocationsTable
        locations={locations}
        onEdit={handleEdit}
      />

      <LocationDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedLocation(undefined);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        location={selectedLocation}
      />
    </div>
  );
}
