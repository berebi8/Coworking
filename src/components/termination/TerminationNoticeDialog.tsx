import React, { useState, useEffect } from 'react';
    import { X, Trash } from 'lucide-react';
    import { supabase } from '../../lib/supabase';
    import { getClientTerminationDetails, calculateExpectedEndDate, TerminationDetails } from '../../services/contractDataService'; // Import TerminationDetails
    import { SearchableSelect } from '../common/SearchableSelect';
    import { DatePicker } from '../common/DatePicker'; // Import DatePicker
    import { formatDate } from '../../lib/utils';
    import type { TerminationNotice, TerminationNoticeFormData, Client, AppUser } from '../../types/database';

    // Define the enhanced client type expected from the parent
    interface EligibleClient extends Client {
      isEligibleForNewNotice: boolean; // True if NO draft/active notice exists
      hasActiveAgreement: boolean;     // True if at least one 'signed' agreement started on/before today
    }

    interface TerminationNoticeDialogProps {
      isOpen: boolean;
      onClose: () => void;
      onSave: (data: TerminationNoticeFormData) => void;
      onDelete?: (notice: TerminationNotice) => void;
      notice?: TerminationNotice;
      currentUser?: AppUser;
      availableClients: EligibleClient[]; // Use the enhanced type
    }

    export function TerminationNoticeDialog({
      isOpen,
      onClose,
      onSave,
      onDelete,
      notice,
      currentUser,
      availableClients
    }: TerminationNoticeDialogProps) {
      const [terminationDetails, setTerminationDetails] = useState<TerminationDetails | null>(null); // Use TerminationDetails type
      const [isLoadingDetails, setIsLoadingDetails] = useState(false);
      const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
      const [deleteConfirmText, setDeleteConfirmText] = useState('');

      const [formData, setFormData] = useState<TerminationNoticeFormData>({
        company_id: '',
        notice_date: new Date().toISOString().split('T')[0],
        recipient_id: currentUser?.id || '',
        expected_end_date: '',
        override_end_date: undefined,
        notes: '',
        status: 'draft'
      });

      const [users, setUsers] = useState<AppUser[]>([]);
      const [error, setError] = useState<string | null>(null);

      // Prepare options for SearchableSelect, incorporating both eligibility checks
      const clientOptions = availableClients.map(client => {
        const hasExistingNotice = !client.isEligibleForNewNotice;
        const hasActiveAgreement = client.hasActiveAgreement;
        let label = client.commercial_name;
        let isDisabled = false;

        if (hasExistingNotice) {
          label += ' (Notice Exists)';
          isDisabled = true;
        } else if (!hasActiveAgreement) {
          label += ' (No Active Agreement)';
          isDisabled = true;
        }

        // When editing, the field is disabled anyway, so individual option disabling doesn't matter
        // When creating, disable if either condition makes them ineligible
        const finalIsDisabled = !!notice ? false : isDisabled; // Field disabled if editing, otherwise check flags

        return {
          value: client.company_id,
          label: label,
          isDisabled: finalIsDisabled
        };
      });

      // Find the selected client option for SearchableSelect value prop
       const selectedClientOption = clientOptions.find(option => option.value === formData.company_id) || null;

      useEffect(() => {
        if (isOpen) {
          fetchUsers();
        }
      }, [isOpen]);

      useEffect(() => {
        if (notice) {
          setFormData({
            company_id: notice.company_id,
            notice_date: notice.notice_date,
            recipient_id: notice.recipient_id,
            expected_end_date: notice.expected_end_date,
            override_end_date: notice.override_end_date || undefined,
            notes: notice.notes || '',
            status: notice.status
          });
          if (notice.company_id) {
            fetchTerminationDetails(notice.company_id);
          }
        } else {
          // Reset form for new notice
          setFormData({
            company_id: '',
            notice_date: new Date().toISOString().split('T')[0],
            recipient_id: currentUser?.id || '',
            expected_end_date: '',
            override_end_date: undefined,
            notes: '',
            status: 'draft'
          });
          setTerminationDetails(null);
        }
        setError(null);
        setShowDeleteConfirm(false);
        setDeleteConfirmText('');
      }, [notice, currentUser, isOpen]);

      const fetchUsers = async () => {
        try {
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('status', 'active')
            .order('username');
          if (error) throw error;
          setUsers(data || []);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      const fetchTerminationDetails = async (companyId: string) => {
        if (!companyId) {
          setTerminationDetails(null);
          setFormData(prev => ({ ...prev, expected_end_date: '' }));
          return;
        }
        try {
          setIsLoadingDetails(true);
          setError(null);
          const details = await getClientTerminationDetails(companyId);
          setTerminationDetails(details);

          if (details) {
            const endDate = calculateExpectedEndDate(formData.notice_date, details);
            setFormData(prev => ({
              ...prev,
              expected_end_date: endDate || '' // Set to empty string if calculation fails
            }));
          } else {
             setFormData(prev => ({ ...prev, expected_end_date: '' }));
          }
        } catch (error: any) {
          console.error('Error fetching termination details:', error);
          setError(`Failed to load client agreement details: ${error.message}`);
          setTerminationDetails(null);
          setFormData(prev => ({ ...prev, expected_end_date: '' }));
        } finally {
          setIsLoadingDetails(false);
        }
      };

      // Fetch details when company_id changes (and not editing)
      useEffect(() => {
        if (formData.company_id && !notice) { // Only fetch/clear if creating new and company changes
            fetchTerminationDetails(formData.company_id);
        } else if (!formData.company_id && !notice) {
            setTerminationDetails(null);
            setFormData(prev => ({ ...prev, expected_end_date: '' }));
        }
        // If editing (notice exists), details are fetched once in the initial useEffect
      }, [formData.company_id, notice]); // Add notice dependency

      // Recalculate expected end date when notice_date changes AND details are available
      useEffect(() => {
        if (formData.notice_date && terminationDetails) {
          const endDate = calculateExpectedEndDate(formData.notice_date, terminationDetails);
          setFormData(prev => ({
            ...prev,
            expected_end_date: endDate || ''
          }));
        } else if (!terminationDetails) {
           setFormData(prev => ({ ...prev, expected_end_date: '' }));
        }
      }, [formData.notice_date, terminationDetails]);

      if (!isOpen) return null;

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
          if (!formData.company_id) throw new Error('Please select a company');
          if (!formData.notice_date) throw new Error('Please enter a notice date');
          if (!formData.recipient_id) throw new Error('Please select a recipient');

          if (formData.override_end_date) {
            const overrideDate = new Date(formData.override_end_date);
            const noticeDate = new Date(formData.notice_date);
            if (overrideDate < noticeDate) {
              throw new Error('Override end date must be on or after the notice date');
            }
          }

          await onSave(formData);
        } catch (error: any) {
          setError(error.message || 'An error occurred while saving');
        }
      };

      const handleDelete = () => {
        if (deleteConfirmText === 'DELETE' && notice && onDelete) {
          onDelete(notice);
        }
      };

      const handleOverrideDateChange = (date: Date | null) => {
        setError(null);
        const dateValue = date ? date.toISOString().split('T')[0] : undefined;
        setFormData(prev => ({ ...prev, override_end_date: dateValue }));
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-text-primary">
                {notice ? 'Edit Termination Notice' : 'Add Termination Notice'}
              </h2>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-coral-light text-coral-dark rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <SearchableSelect
                     label="Company"
                     options={clientOptions}
                     value={selectedClientOption}
                     onChange={(selectedOption) => {
                       setFormData({ ...formData, company_id: selectedOption?.value || '' });
                     }}
                     placeholder="Select Company..."
                     isClearable={!notice} // Allow clearing only when creating
                     // Disable the entire select field when editing an existing notice.
                     isDisabled={!!notice}
                     required // HTML5 required attribute
                   />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Notice Date
                  </label>
                  <input
                    type="date"
                    value={formData.notice_date}
                    onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Recipient
                  </label>
                  <select
                    value={formData.recipient_id}
                    onChange={(e) => setFormData({ ...formData, recipient_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select Recipient</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Required Notice Period (Based on Agreement)
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-text-secondary min-h-[40px]">
                    {isLoadingDetails ? (
                      <span>Loading agreement details...</span>
                    ) : terminationDetails ? (
                      <div>
                        {terminationDetails.hasFixedTerm ? (
                          <>
                            Fixed Term until {formatDate(terminationDetails.fixedTermEndDate)}
                            <br />
                            {/* Display fixed term notice details */}
                            Notice Required: {terminationDetails.noticeFixedPeriod} days {terminationDetails.noticeFixedCurrentMonth ? ' (incl. current month)' : ''}
                          </>
                        ) : (
                           <>
                             Continuous Term
                             <br />
                             {/* Display continuous term notice details */}
                             Notice Required: {
                               terminationDetails.continuousNoticeRule === 'CURRENT_MONTH_PLUS_DAYS'
                                 ? `Current month + ${terminationDetails.continuousNoticeDays ?? 'N/A'} days`
                                 : 'Clause 4.4 (by 20th -> next month end, after 20th -> second next month end)'
                             }
                           </>
                        )}
                      </div>
                    ) : formData.company_id ? (
                       <span>Agreement details not found or applicable.</span>
                    ) : (
                      <span>Select a company to view notice period details.</span>
                    )}
                  </div>
                </div>

                <div className="col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Calculated Expected End Date
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-text-secondary min-h-[40px]">
                      {formData.expected_end_date ? (
                        // Use formatDate here
                        formatDate(formData.expected_end_date)
                      ) : isLoadingDetails ? (
                         'Calculating...'
                      ) : formData.company_id ? (
                         'Could not calculate (check agreement details)'
                      ) : (
                        'Select company and notice date'
                      )}
                    </div>
                  </div>

                  <div>
                    <DatePicker
                      label="Override End Date (Optional)"
                      value={formData.override_end_date ? new Date(formData.override_end_date) : null}
                      onChange={handleOverrideDateChange}
                      minDate={new Date(formData.notice_date)}
                      error={error?.includes('Override end date') ? error : undefined}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for termination or other notes"
                  />
                </div>
              </div>

              {/* Delete Section */}
              {notice && onDelete && (
                <div className="pt-4 border-t border-gray-200">
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                    >
                      Delete Notice
                    </button>
                  ) : (
                    <div className="space-y-3 p-3 border border-coral rounded-lg">
                      <p className="text-sm text-text-secondary font-medium">
                        Are you sure? Type "DELETE" to confirm.
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-3 py-2 border border-coral rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
                        placeholder="Type DELETE"
                      />
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleteConfirmText !== 'DELETE'}
                          className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                            deleteConfirmText === 'DELETE'
                              ? 'bg-coral hover:bg-coral-dark'
                              : 'bg-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <Trash className="h-4 w-4" />
                            <span>Confirm Delete</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-text-secondary hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                  disabled={isLoadingDetails}
                >
                  {isLoadingDetails ? 'Loading...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
