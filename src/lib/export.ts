import * as XLSX from 'xlsx-js-style';
import type { Location, AppUser, OfficeProperty, AddonService, Agreement, Client } from '../types/database';

// Helper function to format date
const formatDate = (date: string | null | undefined): string => {
  if (!date) return '';
  // Handle potential invalid date strings gracefully
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  } catch (e) {
    return '';
  }
};

// Helper function to format date-time
const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  } catch (e) {
    return '';
  }
};


// Helper function to format currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '';
  return new Intl.NumberFormat('en-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to format office number with leading zeros
const formatOfficeNumber = (office: OfficeProperty): string => {
  if (!office || !office.office_id) return '';
  if (office.office_type === 'hot_desk') {
    const match = office.office_id.match(/^HD(\d+)([A-Z])$/);
    return match ? match[2] : ''; // Return only the letter part for hot desks
  } else {
    const match = office.office_id.match(/^(\d+)\/(\d+)$/);
    return match ? match[2].padStart(2, '0') : ''; // Return padded number part
  }
};

// Helper function to format floor number with leading zeros
const formatFloorNumber = (floor: number | null | undefined): string => {
  if (floor == null) return '';
  return floor.toString().padStart(2, '0');
};

// Generic function to handle worksheet creation and file download
const exportData = (data: any[], sheetName: string, fileNamePrefix: string, format: 'xlsx' | 'csv') => {
  if (!data || data.length === 0) {
    console.warn('No data provided for export.');
    // Optionally show a user notification here
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Apply text format to specific columns if needed (example for 'Floor', 'Office Number')
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const textColumns = ['Floor', 'Office Number']; // Add headers of columns needing text format

    headers.forEach((header, C) => {
      if (textColumns.includes(header)) {
        for (let R = range.s.r + 1; R <= range.e.r; R++) { // Start from row 1 (data)
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].t = 's'; // Set type to string
            worksheet[cellAddress].z = '@'; // Set format to Text
          }
        }
      }
      // You could add other formatting here (currency, date) if needed,
      // but pre-formatting data before calling json_to_sheet is often easier.
    });


    const fileName = `${fileNamePrefix}_export_${new Date().toISOString().split('T')[0]}.${format}`;
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error(`Error exporting ${sheetName} to ${format}:`, error);
    // Optionally show a user notification about the error
  }
};


// Export locations to Excel or CSV
export const exportLocations = (locations: Location[], format: 'xlsx' | 'csv') => {
  const data = locations.map(location => ({
    'Location Name': location.name,
    'Location ID': location.location_id,
    'Status': location.status,
    'Notes': location.notes || '',
    'Created At': formatDate(location.created_at),
    'Updated At': formatDate(location.updated_at),
    'Deleted At': formatDate(location.deleted_at),
  }));
  exportData(data, 'Locations', 'locations', format);
};

// Export users to Excel or CSV
export const exportUsers = (users: AppUser[], format: 'xlsx' | 'csv') => {
  const data = users.map(user => ({
    'Username': user.username,
    'Full Name': user.full_name,
    'Email': user.email || user.masked_email || '',
    'Role': user.role,
    'Status': user.status,
    'Notes': user.notes || '',
    'Last Login': formatDate(user.last_login),
    'Created At': formatDate(user.created_at),
    'Updated At': formatDate(user.updated_at),
    'Deleted At': formatDate(user.deleted_at),
  }));
  exportData(data, 'Users', 'users', format);
};

// Export offices to Excel or CSV
export const exportOffices = (offices: OfficeProperty[], format: 'xlsx' | 'csv') => {
  const data = offices.map(office => ({
    'Location': office.location?.name || '',
    'Floor': formatFloorNumber(office.floor),
    'Office Type': office.office_type,
    'Office Number': formatOfficeNumber(office),
    'Status': office.status,
    'Default WS': office.default_ws,
    'Max WS': office.max_ws,
    'List Price': formatCurrency(office.list_price),
    'Additional Desk Price': formatCurrency(office.additional_desk_price),
    'MR Credits': office.mr_credits,
    'Print Quota B&W': office.print_quota_bw,
    'Print Quota Color': office.print_quota_color,
    'View Type': office.view_type?.replace('_', ' ') || '',
    'Notes': office.notes || '',
    'Created At': formatDate(office.created_at),
    'Updated At': formatDate(office.updated_at),
    'Deleted At': formatDate(office.deleted_at),
  }));
   exportData(data, 'Offices', 'offices', format);
};

// Export addon services to Excel or CSV
export const exportAddonServices = (services: AddonService[], format: 'xlsx' | 'csv') => {
  const data = services.map(service => ({
    'Name': service.name,
    'Type': service.type,
    'Add-On/Incidental': service.is_incidental ? 'Incidental' : 'Add-On Service',
    'List Price': formatCurrency(service.list_price),
    'Quantity': service.quantity === null ? 'Unlimited' : service.quantity,
    'Locations': service.locations?.length === 0 ? 'All Locations' : service.locations?.join(', ') || '',
    'Status': service.status,
    'Notes': service.notes || '',
    'Created At': formatDate(service.created_at),
    'Updated At': formatDate(service.updated_at),
    'Deleted At': formatDate(service.deleted_at),
  }));
  exportData(data, 'Add-On Services', 'addon_services', format);
};

// Export agreements to Excel or CSV
export const exportAgreements = (agreements: Agreement[], format: 'xlsx' | 'csv') => {
  const data = agreements.map(agreement => ({
    'DOC ID': agreement.doc_id,
    'Company': agreement.commercial_name,
    'Start Date': formatDate(agreement.start_date),
    'Location': agreement.building,
    'Status': agreement.status === 'draft' ? 'Draft (Not Approved)' :
             agreement.status === 'draft_approved' ? 'Draft (Approved)' :
             agreement.status === 'signed' ? 'Signed Contract' : 'Cancelled Contract',
    'Notes': agreement.notes || ''
  }));
  exportData(data, 'Agreements', 'agreements', format);
};

// Export clients to Excel or CSV
export const exportClients = (clients: Client[], format: 'xlsx' | 'csv') => {
  const data = clients.map(client => ({
    'Client Name': client.name,
    'Company ID': client.company_id,
    'Commercial Name': client.commercial_name,
    'SAP Number': client.sap_number,
    'Status': client.status?.toUpperCase() || '',
    'Location': client.location || '',
    'Primary Contact': client.primary_contact_name || '',
    'Contact Email': client.primary_contact_email || '',
    'Contact Phone': client.primary_contact_phone || '',
    'Notes': client.notes || '',
    'Created At': formatDate(client.created_at),
    'Updated At': formatDate(client.updated_at)
  }));
  exportData(data, 'Clients', 'clients', format);
};

// Export Termination Notices
// Accepts pre-formatted data array
export const exportTerminationNotices = (data: any[], format: 'xlsx' | 'csv') => {
  exportData(data, 'TerminationNotices', 'termination_notices', format);
};
