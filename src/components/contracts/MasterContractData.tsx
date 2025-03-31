import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Eye, Edit2, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ExportMenu } from '../common/ExportMenu';
import { formatDate } from '../../lib/utils';
import type { Agreement } from '../../types/database';

interface MasterContractLine {
  client: string;
  document: string;
  type: string;
  product: string;
  qty: number;
  start: string;
  end: string | null;
  commitment: string;
  listPrice: number;
  discount: number;
  actualPrice: number;
  status: string;
  sortOrder: number;
  sortDate: string;
}

type DocumentStatus = 'ACTIVE' | 'PENDING' | 'FINISHED' | 'CANCELLED' | 'all';

export function MasterContractData() {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<boolean>(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [contractData, setContractData] = useState<MasterContractLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [documentStatusFilter, setDocumentStatusFilter] = useState<DocumentStatus>('all');
  const [clients, setClients] = useState<string[]>([]);

  useEffect(() => {
    fetchContractData();
  }, [typeFilter, clientFilter, startDateFilter, endDateFilter, statusFilter, documentStatusFilter]);

  const getDocumentStatus = (lines: MasterContractLine[]): DocumentStatus => {
    const today = new Date();
    const startDate = new Date(lines[0].start);
    const endDate = lines[0].end ? new Date(lines[0].end) : null;

    if (lines[0].status === 'cancelled') {
      return 'CANCELLED';
    }

    if (endDate && endDate < today) {
      return 'FINISHED';
    }

    if (startDate > today) {
      return 'PENDING';
    }

    if ((!endDate && startDate <= today) || (endDate && today <= endDate)) {
      return 'ACTIVE';
    }

    return 'all';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'FINISHED':
        return 'bg-gray-100 text-gray-800';
      case 'ACTIVE':
        return 'bg-teal-light text-teal-dark';
      case 'PENDING':
        return 'bg-primary-light text-primary-dark';
      case 'CANCELLED':
        return 'bg-coral-light text-coral-dark';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const safeParseInt = (value: any): number => {
    if (value === undefined || value === null || value === '') return 0;
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchContractData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [officePropertiesResponse, addonServicesResponse, agreementsResponse] = await Promise.all([
        supabase.from('office_properties').select('id, office_id'),
        supabase.from('addon_services').select('id, type, name'),
        (() => {
          let query = supabase.from('agreements').select('*');
          
          if (typeFilter !== 'all') {
            query = query.eq('type', typeFilter);
          }
          
          if (clientFilter !== 'all') {
            query = query.eq('commercial_name', clientFilter);
          }
          
          if (startDateFilter) {
            query = query.gte('start_date', startDateFilter);
          }
          
          if (endDateFilter) {
            query = query.lte('start_date', endDateFilter);
          }
          
          if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
          }
          
          return query.order('commercial_name');
        })()
      ]);

      if (officePropertiesResponse.error) throw officePropertiesResponse.error;
      if (addonServicesResponse.error) throw addonServicesResponse.error;
      if (agreementsResponse.error) throw agreementsResponse.error;

      const officeMap = new Map();
      officePropertiesResponse.data?.forEach(office => {
        officeMap.set(office.id, office.office_id);
      });

      const serviceMap = new Map();
      addonServicesResponse.data?.forEach(service => {
        serviceMap.set(service.id, service.name);
        serviceMap.set(service.type, service.name);
      });

      const lines: MasterContractLine[] = [];
      const uniqueClients = new Set<string>();
      const creditsAddedForAgreement = new Set<string>();

      agreementsResponse.data?.forEach((agreement) => {
        uniqueClients.add(agreement.commercial_name);
        
        const officeSpaces = agreement.office_spaces || [];
        officeSpaces.forEach((space: any) => {
          const userFriendlyOfficeId = officeMap.get(space.office_id) || space.office_id.substring(0, 8);
          
          const listPrice = parseFloat(space.list_price) || 0;
          const discountPercentage = parseFloat(space.discount_percentage) || 0;
          const specialDiscountPercentage = parseFloat(space.special_discount_percentage) || 0;
          const totalDiscount = discountPercentage + specialDiscountPercentage;

          if (agreement.has_fixed_term) {
            lines.push({
              client: agreement.commercial_name,
              document: agreement.doc_id,
              type: 'Office',
              product: `Office ${userFriendlyOfficeId}`,
              qty: space.workstations,
              start: agreement.start_date,
              end: agreement.first_fixed_term_end_date,
              commitment: `Until ${formatDate(agreement.first_fixed_term_end_date)}`,
              listPrice: listPrice,
              discount: totalDiscount,
              actualPrice: space.fixed_term_price || (listPrice * (1 - totalDiscount / 100)),
              status: 'Active',
              sortOrder: 1,
              sortDate: agreement.start_date
            });

            lines.push({
              client: agreement.commercial_name,
              document: agreement.doc_id,
              type: 'Office',
              product: `Office ${userFriendlyOfficeId}`,
              qty: space.workstations,
              start: agreement.continuous_term_start_date,
              end: null,
              commitment: 'No commitment',
              listPrice: listPrice,
              discount: 0,
              actualPrice: space.continuous_term_price || listPrice,
              status: 'Pending',
              sortOrder: 1,
              sortDate: agreement.continuous_term_start_date || ''
            });
          } else {
            lines.push({
              client: agreement.commercial_name,
              document: agreement.doc_id,
              type: 'Office',
              product: `Office ${userFriendlyOfficeId}`,
              qty: space.workstations,
              start: agreement.start_date,
              end: null,
              commitment: 'No commitment',
              listPrice: listPrice,
              discount: 0,
              actualPrice: space.continuous_term_price || listPrice,
              status: 'Active',
              sortOrder: 1,
              sortDate: agreement.start_date
            });
          }
        });

        const parkingSpaces = agreement.parking_spaces || [];
        parkingSpaces.forEach((space: any) => {
          const userFriendlyParkingName = serviceMap.get(space.parking_type) || 
            space.parking_type.replace('parking_', '').replace('_', ' ').toUpperCase();
          
          const listPrice = parseFloat(space.list_price) || 0;
          const discountPercentage = parseFloat(space.discount_percentage) || 0;
          const quantity = parseInt(space.quantity) || 1;
          
          lines.push({
            client: agreement.commercial_name,
            document: agreement.doc_id,
            type: 'Parking',
            product: userFriendlyParkingName,
            qty: quantity,
            start: agreement.start_date,
            end: null,
            commitment: 'Ongoing',
            listPrice: listPrice,
            discount: discountPercentage,
            actualPrice: space.final_price || (listPrice * quantity * (1 - discountPercentage / 100)),
            status: 'Active',
            sortOrder: 2,
            sortDate: agreement.start_date
          });
        });

        const services = agreement.services || [];
        services.forEach((service: any) => {
          const userFriendlyServiceName = serviceMap.get(service.service_id) || 
            serviceMap.get(service.type) ||
            service.type.replace('_', ' ').toUpperCase();
          
          const listPrice = parseFloat(service.list_price) || 0;
          const discountPercentage = parseFloat(service.discount_percentage) || 0;
          const quantity = parseInt(service.quantity) || 1;
          
          lines.push({
            client: agreement.commercial_name,
            document: agreement.doc_id,
            type: 'Service',
            product: userFriendlyServiceName,
            qty: quantity,
            start: agreement.start_date,
            end: null,
            commitment: 'Ongoing',
            listPrice: listPrice,
            discount: discountPercentage,
            actualPrice: service.final_price || (listPrice * quantity * (1 - discountPercentage / 100)),
            status: 'Active',
            sortOrder: 3,
            sortDate: agreement.start_date
          });
        });
        
        if (!creditsAddedForAgreement.has(agreement.id)) {
          creditsAddedForAgreement.add(agreement.id);
          
          let mrCredits = safeParseInt(agreement.conference_room_credits);
          let bwCredits = safeParseInt(agreement.print_credits_bw);
          let colorCredits = safeParseInt(agreement.print_credits_color);
          
          if (agreement.has_fixed_term) {
            if (agreement.conference_room_credits_override !== null && agreement.conference_room_credits_override !== undefined) {
              mrCredits = safeParseInt(agreement.conference_room_credits_override);
            }
            
            if (agreement.print_credits_bw_override !== null && agreement.print_credits_bw_override !== undefined) {
              bwCredits = safeParseInt(agreement.print_credits_bw_override);
            }
            
            if (agreement.print_credits_color_override !== null && agreement.print_credits_color_override !== undefined) {
              colorCredits = safeParseInt(agreement.print_credits_color_override);
            }
          }
          
          lines.push({
            client: agreement.commercial_name,
            document: agreement.doc_id,
            type: 'Credits',
            product: 'Meeting Room Credits',
            qty: mrCredits,
            start: agreement.start_date,
            end: null,
            commitment: 'Ongoing',
            listPrice: 0,
            discount: 0,
            actualPrice: 0,
            status: 'Active',
            sortOrder: 4,
            sortDate: agreement.start_date
          });

          lines.push({
            client: agreement.commercial_name,
            document: agreement.doc_id,
            type: 'Credits',
            product: 'B&W Print Credits',
            qty: bwCredits,
            start: agreement.start_date,
            end: null,
            commitment: 'Ongoing',
            listPrice: 0,
            discount: 0,
            actualPrice: 0,
            status: 'Active',
            sortOrder: 4,
            sortDate: agreement.start_date
          });

          lines.push({
            client: agreement.commercial_name,
            document: agreement.doc_id,
            type: 'Credits',
            product: 'Color Print Credits',
            qty: colorCredits,
            start: agreement.start_date,
            end: null,
            commitment: 'Ongoing',
            listPrice: 0,
            discount: 0,
            actualPrice: 0,
            status: 'Active',
            sortOrder: 4,
            sortDate: agreement.start_date
          });
        }
      });

      const sortedLines = [...lines].sort((a, b) => {
        if (a.client !== b.client) {
          return a.client.localeCompare(b.client);
        }
        
        if (a.document !== b.document) {
          return a.document.localeCompare(b.document);
        }
        
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        
        if (a.type === 'Credits' && b.type === 'Credits') {
          return a.product.localeCompare(b.product);
        }
        
        if (a.sortDate && b.sortDate) {
          return a.sortDate.localeCompare(b.sortDate);
        }
        
        return 0;
      });

      let filteredLines = sortedLines;
      
      if (documentStatusFilter !== 'all') {
        const documentStatuses = new Map<string, DocumentStatus>();
        
        const documentGroups = sortedLines.reduce((acc, line) => {
          if (!acc[line.document]) {
            acc[line.document] = [];
          }
          acc[line.document].push(line);
          return acc;
        }, {} as Record<string, MasterContractLine[]>);
        
        Object.entries(documentGroups).forEach(([docId, docLines]) => {
          documentStatuses.set(docId, getDocumentStatus(docLines));
        });
        
        const allowedDocuments = new Set<string>();
        documentStatuses.forEach((status, docId) => {
          if (status === documentStatusFilter) {
            allowedDocuments.add(docId);
          }
        });
        
        filteredLines = sortedLines.filter(line => allowedDocuments.has(line.document));
      }

      setContractData(filteredLines);
      setClients(Array.from(uniqueClients).sort());
      setError(null);
    } catch (error: any) {
      console.error('Error fetching contract data:', error);
      setError('Failed to load contract data. Please try refreshing the page.');
      setContractData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₪0';
    }
    
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const toggleClient = (client: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(client)) {
        next.delete(client);
      } else {
        next.add(client);
      }
      return next;
    });
  };

  const toggleDocument = (document: string) => {
    setExpandedDocuments(prev => {
      const next = new Set(prev);
      if (next.has(document)) {
        next.delete(document);
      } else {
        next.add(document);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allClients = new Set(contractData.map(line => line.client));
    const allDocuments = new Set(contractData.map(line => line.document));
    setExpandedClients(allClients);
    setExpandedDocuments(allDocuments);
  };

  const collapseAll = () => {
    setExpandedClients(new Set());
    setExpandedDocuments(new Set());
  };

  const groupedData = contractData.reduce((acc, line) => {
    if (!acc[line.client]) {
      acc[line.client] = {};
    }
    if (!acc[line.client][line.document]) {
      acc[line.client][line.document] = [];
    }
    acc[line.client][line.document].push(line);
    return acc;
  }, {} as Record<string, Record<string, MasterContractLine[]>>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Master Contract Data</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setFilters(!filters)}
            className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Filters
          </button>
          <ExportMenu onExport={() => {}} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="license">License Agreement</option>
              <option value="addendum">Addendum</option>
              <option value="termination">Termination Notice</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Client
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Draft Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="draft_approved">Draft (Approved)</option>
              <option value="signed">Signed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Document Status
            </label>
            <select
              value={documentStatusFilter}
              onChange={(e) => setDocumentStatusFilter(e.target.value as DocumentStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="FINISHED">Finished</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Date Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <span className="text-text-secondary">to</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => {
              setStatusFilter('all');
              setDocumentStatusFilter('all');
              setTypeFilter('all');
              setClientFilter('all');
              setStartDateFilter('');
              setEndDateFilter('');
            }}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">QTY</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">End</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Commitment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">List Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actual Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contractData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={13} className="px-6 py-4 text-center text-text-secondary">
                    No results found. Try adjusting your filters.
                  </td>
                </tr>
              )}
              {Object.entries(groupedData).map(([client, documents]) => (
                <React.Fragment key={client}>
                  <tr className="bg-gray-50">
                    <td colSpan={13} className="px-6 py-4">
                      <button
                        onClick={() => toggleClient(client)}
                        className="flex items-center space-x-2 text-text-primary hover:text-primary transition-colors"
                      >
                        {expandedClients.has(client) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{client}</span>
                      </button>
                    </td>
                  </tr>

                  {expandedClients.has(client) && Object.entries(documents).map(([document, lines]) => (
                    <React.Fragment key={document}>
                      <tr className="bg-accent-blue">
                        <td className="pl-12 py-3" colSpan={13}>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleDocument(document)}
                              className="flex items-center space-x-2 text-text-primary hover:text-primary transition-colors"
                            >
                              {expandedDocuments.has(document) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="font-medium">{document}</span>
                            </button>
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(getDocumentStatus(lines))}`}>
                              {getDocumentStatus(lines)}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {expandedDocuments.has(document) && lines.map((line, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap"></td>
                          <td className="px-6 py-4 whitespace-nowrap"></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              line.type === 'Office' ? 'bg-primary-light text-primary-dark' :
                              line.type === 'Parking' ? 'bg-teal-light text-teal-dark' :
                              line.type === 'Credits' ? 'bg-coral-light text-coral-dark' :
                              'bg-purple-light text-purple-dark'
                            }`}>
                              {line.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{line.product}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-numeric">{line.qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-numeric">{formatDate(line.start)}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-numeric">{line.end ? formatDate(line.end) : '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{line.commitment}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-numeric">{formatCurrency(line.listPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-numeric">{line.discount}%</td>
                          <td className="px-6 py-4 whitespace-nowrap font-numeric">{formatCurrency(line.actualPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              line.status === 'Active' ? 'bg-teal-light text-teal-dark' :
                              'bg-purple-light text-purple-dark'
                            }`}>
                              {line.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button className="text-primary hover:text-primary-dark transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="text-primary hover:text-primary-dark transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
