import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UsersTable } from './UsersTable';
import { UserDialog } from './UserDialog';
import type { AppUser, UserFormData, UserStatus } from '../../types/database';

type StatusFilter = UserStatus | 'all';
type RoleFilter = 'all' | AppUser['role'];

export function UsersManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | undefined>();

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, roleFilter]);

  const fetchUsers = async () => {
    let query = supabase.from('app_users').select('*');
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    const { data, error } = await query.order('username');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers(data);
  };

  const handleSave = async (formData: UserFormData) => {
    try {
      if (selectedUser) {
        // For existing users, check if email is being changed
        if (selectedUser.email !== formData.email) {
          // Check if the new email is already in use
          const { data: existingUser } = await supabase
            .from('app_users')
            .select('id')
            .eq('email', formData.email)
            .neq('status', 'deleted')
            .single();

          if (existingUser) {
            throw new Error('This email address is already in use');
          }
        }

        const { error } = await supabase
          .from('app_users')
          .update(formData)
          .eq('id', selectedUser.id);

        if (error) throw error;
      } else {
        // For new users, check if email exists
        const { data: existingUser } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', formData.email)
          .neq('status', 'deleted')
          .single();

        if (existingUser) {
          throw new Error('This email address is already in use');
        }

        const { error } = await supabase
          .from('app_users')
          .insert([formData]);

        if (error) throw error;
      }

      setIsDialogOpen(false);
      setSelectedUser(undefined);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const handleDelete = async (user: AppUser) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          masked_email: user.email, // Store the original email
          email: null // Set email to null to free it up
        })
        .eq('id', user.id);

      if (error) throw error;

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleEdit = (user: AppUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setStatusFilter('active');
    setRoleFilter('all');
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
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-secondary">Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Finance Manager">Finance Manager</option>
              <option value="Coworking Manager">Coworking Manager</option>
              <option value="Client">Client</option>
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
            setSelectedUser(undefined);
            setIsDialogOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      <UsersTable
        users={users}
        onEdit={handleEdit}
      />

      <UserDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedUser(undefined);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        user={selectedUser}
      />
    </div>
  );
}
