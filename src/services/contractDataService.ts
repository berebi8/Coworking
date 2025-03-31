import { supabase } from '../lib/supabase';
    import type { Agreement, NoticeRuleType } from '../types/database'; // Import NoticeRuleType

    export type DocumentStatus = 'ACTIVE' | 'PENDING' | 'FINISHED' | 'CANCELLED' | 'all';

    interface ClientDocument {
      client: string;
      document: string;
      status: DocumentStatus;
      clientId: string;
    }

    // Interface for the structure returned by getClientTerminationDetails
    export interface TerminationDetails { // Export the interface
      agreement: Agreement; // Include the full agreement object
      hasContinuousTerm: boolean;
      hasFixedTerm: boolean;
      fixedTermEndDate: string | null;
      noticeFixedPeriod: number; // Keep fixed term logic for now
      noticeFixedCurrentMonth: boolean; // Keep fixed term logic for now
      continuousNoticeRule: NoticeRuleType; // Use new field
      continuousNoticeDays: number | null; // Use new field
    }


    export async function getActiveClients() {
      try {
        // Get all signed agreements
        const { data: agreements, error: agreementsError } = await supabase
          .from('agreement_calculated_view')
          .select(`
            licensee_name,
            commercial_name,
            company_id,
            building,
            status,
            client_id,
            client_name,
            client_sap_number,
            client_contact_name,
            client_contact_email,
            client_contact_phone,
            client_location,
            client_status
          `)
          .eq('status', 'signed')  // Only get signed agreements
          .order('commercial_name');

        if (agreementsError) throw agreementsError;

        // Then get any additional clients from the clients table
        const { data: additionalClients, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('commercial_name');

        if (clientsError) throw clientsError;

        // Merge and deduplicate clients
        const uniqueClients = new Map();

        // First add agreement clients
        agreements?.forEach(agreement => {
          if (!uniqueClients.has(agreement.company_id)) {
            uniqueClients.set(agreement.company_id, {
              id: agreement.client_id,
              name: agreement.licensee_name,
              commercial_name: agreement.commercial_name,
              company_id: agreement.company_id,
              sap_number: agreement.client_sap_number,
              primary_contact_name: agreement.client_contact_name,
              primary_contact_email: agreement.client_contact_email,
              primary_contact_phone: agreement.client_contact_phone,
              location: agreement.building,
              status: agreement.client_status || 'active',
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

        // Convert to array and filter for active clients
        return Array.from(uniqueClients.values())
          .filter(client => client.status === 'active')
          .sort((a, b) => a.commercial_name.localeCompare(b.commercial_name));

      } catch (error) {
        console.error('Error fetching active clients:', error);
        return [];
      }
    }

    export async function getClientTerminationDetails(companyId: string): Promise<TerminationDetails | null> {
      try {
        // Get the active agreement for this client
        const { data: agreements, error: agreementsError } = await supabase
          .from('agreements')
          .select(`
            *,
            continuous_notice_rule,
            continuous_notice_days
          `) // Select all fields + new fields
          .eq('company_id', companyId)
          .eq('status', 'signed')  // Only consider signed agreements
          .order('start_date', { ascending: false });

        if (agreementsError) throw agreementsError;
        if (!agreements || agreements.length === 0) {
          console.warn(`No signed agreements found for company ID: ${companyId}`);
          return null;
        }

        // Find the active agreement (prioritize fixed term that's active)
        const today = new Date();
        let activeAgreement: Agreement | null = null;

        // First try to find an active fixed term
        activeAgreement = agreements.find(a => {
          if (!a.has_fixed_term) return false;
          const startDate = new Date(a.start_date);
          const endDate = a.first_fixed_term_end_date ? new Date(a.first_fixed_term_end_date) : null;
          return startDate <= today && endDate && endDate >= today;
        }) || null; // Ensure null if not found

        // If no active fixed term, look for active continuous term
        if (!activeAgreement) {
          activeAgreement = agreements.find(a => {
            const startDate = new Date(a.start_date);
            // Check if continuous term has started or if it's continuous only from start
            const continuousStartDate = a.continuous_term_start_date ? new Date(a.continuous_term_start_date) : (!a.has_fixed_term ? new Date(a.start_date) : null);
            return continuousStartDate && continuousStartDate <= today;
          }) || null; // Ensure null if not found
        }

        // If still no active agreement found (e.g., all agreements are future-dated)
         if (!activeAgreement) {
           // Fallback: Find the most recent signed agreement even if not currently active
           activeAgreement = agreements[0] || null;
           if (!activeAgreement) {
             console.warn(`No suitable agreement found for termination details for company ID: ${companyId}`);
             return null;
           }
           console.warn(`Using most recent signed agreement (ID: ${activeAgreement.id}) as no currently active one found for company ID: ${companyId}`);
         }


        // Ensure the agreement object is included in the return value
        return {
          agreement: activeAgreement, // Include the full agreement object
          hasContinuousTerm: activeAgreement.continuous_term_start_date !== null || !activeAgreement.has_fixed_term,
          hasFixedTerm: activeAgreement.has_fixed_term,
          fixedTermEndDate: activeAgreement.first_fixed_term_end_date,
          noticeFixedPeriod: activeAgreement.notice_period_fixed, // Keep fixed term logic for now
          noticeFixedCurrentMonth: activeAgreement.notice_period_fixed_current_month, // Keep fixed term logic for now
          continuousNoticeRule: activeAgreement.continuous_notice_rule || 'CLAUSE_4_4', // Use new field, default if null
          continuousNoticeDays: activeAgreement.continuous_notice_days // Use new field
        };
      } catch (error) {
        console.error('Error fetching termination details:', error);
        return null;
      }
    }

    // Helper function to get the last day of the month
    const getLastDayOfMonth = (date: Date): Date => {
      // Create a new date object to avoid modifying the original
      const newDate = new Date(date.getTime());
      // Set day to 0 of the *next* month, which results in the last day of the *current* month
      newDate.setMonth(newDate.getMonth() + 1, 0);
      return newDate;
    };

    export function calculateExpectedEndDate(
      noticeDateStr: string,
      terminationDetails: TerminationDetails | null
    ): string | null {
      if (!noticeDateStr || !terminationDetails || !terminationDetails.agreement) {
        console.warn("calculateExpectedEndDate: Missing noticeDate or terminationDetails/agreement.");
        return null;
      }

      const noticeDate = new Date(noticeDateStr);
      let continuousEndDate: Date | null = null;

      console.log(`Calculating end date for notice on ${noticeDateStr}`);
      console.log(`Agreement Details:`, terminationDetails);

      // --- Continuous Term Calculation ---
      if (terminationDetails.continuousNoticeRule === 'CURRENT_MONTH_PLUS_DAYS') {
        if (terminationDetails.continuousNoticeDays !== null && terminationDetails.continuousNoticeDays >= 0) {
          const endDate = new Date(noticeDate);
          endDate.setDate(endDate.getDate() + terminationDetails.continuousNoticeDays);
          continuousEndDate = getLastDayOfMonth(endDate); // Round to end of month
          console.log(`Current Month + ${terminationDetails.continuousNoticeDays} Days Logic: Calculated End Date = ${continuousEndDate?.toISOString().split('T')[0]}`);
        } else {
          console.warn(`Missing or invalid continuous_notice_days for rule 'CURRENT_MONTH_PLUS_DAYS'.`);
          continuousEndDate = null;
        }
      } else if (terminationDetails.continuousNoticeRule === 'CLAUSE_4_4') {
        const dayOfMonth = noticeDate.getDate();
        const endDate = new Date(noticeDate);
        const monthsToAdd = dayOfMonth <= 20 ? 1 : 2;
        endDate.setMonth(endDate.getMonth() + monthsToAdd); // Go to the target month
        continuousEndDate = getLastDayOfMonth(endDate); // Get last day of that month
        console.log(`Clause 4.4 Logic (Notice Day ${dayOfMonth}): Calculated End Date = ${continuousEndDate?.toISOString().split('T')[0]}`);
      } else {
        console.warn(`Unknown continuous_notice_rule: ${terminationDetails.continuousNoticeRule}.`);
        continuousEndDate = null;
      }

      // --- Fixed Term Handling ---
      let finalEndDate: Date | null = continuousEndDate;

      if (terminationDetails.hasFixedTerm && terminationDetails.fixedTermEndDate) {
        const fixedEndDateRaw = new Date(terminationDetails.fixedTermEndDate);
        // Round fixed term end date to the end of its month for comparison
        const fixedEndDateMonthEnd = getLastDayOfMonth(fixedEndDateRaw);
        console.log(`Fixed Term End Date (Raw): ${terminationDetails.fixedTermEndDate}, Rounded to Month End: ${fixedEndDateMonthEnd.toISOString().split('T')[0]}`);

        // The final end date is the LATER of the rounded fixed term end date and the calculated continuous end date.
        if (continuousEndDate && fixedEndDateMonthEnd > continuousEndDate) {
          finalEndDate = fixedEndDateMonthEnd;
          console.log(`Final Date: Fixed Term End Date is later (${finalEndDate.toISOString().split('T')[0]})`);
        } else if (!continuousEndDate) {
          // If continuous couldn't be calculated, use fixed term end date
          finalEndDate = fixedEndDateMonthEnd;
           console.log(`Final Date: Using Fixed Term End Date as Continuous is null (${finalEndDate.toISOString().split('T')[0]})`);
        } else {
          // Otherwise, the continuous date is later or equal
          finalEndDate = continuousEndDate;
          console.log(`Final Date: Continuous Term End Date is later or equal (${finalEndDate.toISOString().split('T')[0]})`);
        }
      } else {
        console.log(`Final Date (No Fixed Term): Using Continuous Term End Date (${finalEndDate?.toISOString().split('T')[0]})`);
      }

      // **Ensure final date is rounded to end of month**
      if (finalEndDate) {
        finalEndDate = getLastDayOfMonth(finalEndDate);
        console.log(`Final Date (Rounded to End of Month): ${finalEndDate.toISOString().split('T')[0]}`);
      }

      // Format the final date to YYYY-MM-DD string or return null
      return finalEndDate ? finalEndDate.toISOString().split('T')[0] : null;
    }
