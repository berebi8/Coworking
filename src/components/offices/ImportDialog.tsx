import React, { useState, useRef } from 'react';
import { X, Download, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import type { Location, OfficeProperty, OfficeType, OfficeViewType } from '../../types/database';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (backup: OfficeProperty[]) => void;
  locations: Location[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportPreview {
  valid: boolean;
  errors: ValidationError[];
  data: any[];
  backup?: OfficeProperty[];
}

export function ImportDialog({ isOpen, onClose, onComplete, locations }: ImportDialogProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateTemplate = () => {
    // Create sample data
    const sampleData = [
      // Regular office with sea view
      {
        'Location ID': locations[0]?.location_id || 'AB123',
        'Floor': locations[0]?.floors?.[0]?.floor_number || 10,
        'Office Type': 'office',
        'Office Number': '101',
        'View Type': 'sea_view',
        'Default WS': 4,
        'Max WS': 6,
        'List Price': 12000,
        'Additional Desk Price': 2000,
        'MR Credits': 20,
        'Print Quota B&W': 1000,
        'Print Quota Color': 500,
        'Notes': 'Corner office with great view'
      },
      // Regular office with city view
      {
        'Location ID': locations[0]?.location_id || 'AB123',
        'Floor': locations[0]?.floors?.[1]?.floor_number || 11,
        'Office Type': 'office',
        'Office Number': '202',
        'View Type': 'city_view',
        'Default WS': 2,
        'Max WS': 3,
        'List Price': 8000,
        'Additional Desk Price': 2000,
        'MR Credits': 15,
        'Print Quota B&W': 800,
        'Print Quota Color': 400,
        'Notes': 'City view office'
      },
      // Internal office
      {
        'Location ID': locations[0]?.location_id || 'AB123',
        'Floor': locations[0]?.floors?.[2]?.floor_number || 12,
        'Office Type': 'office',
        'Office Number': '303',
        'View Type': 'internal',
        'Default WS': 6,
        'Max WS': 8,
        'List Price': 15000,
        'Additional Desk Price': 2000,
        'MR Credits': 25,
        'Print Quota B&W': 1200,
        'Print Quota Color': 600,
        'Notes': 'Large internal office'
      },
      // Hot desk
      {
        'Location ID': locations[0]?.location_id || 'AB123',
        'Floor': locations[0]?.floors?.[0]?.floor_number || 10,
        'Office Type': 'hot_desk',
        'Office Number': 'A',
        'View Type': 'sea_view',
        'Default WS': 1,
        'Max WS': 1,
        'List Price': 2000,
        'Additional Desk Price': 0,
        'MR Credits': 5,
        'Print Quota B&W': 200,
        'Print Quota Color': 100,
        'Notes': 'Hot desk with sea view'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Add validation notes
    const validationNotes = [
      ['Import Template Instructions:'],
      ['1. Location ID must match an existing location'],
      ['2. Floor must exist in the specified location'],
      ['3. Office Type must be either "office" or "hot_desk"'],
      ['4. View Type must be "sea_view", "city_view", or "internal"'],
      ['5. For office type:'],
      ['   - Office Number format: floor/number (e.g., 10/101)'],
      ['   - Will be auto-formatted based on floor'],
      ['6. For hot_desk type:'],
      ['   - Office Number must be a single letter A-Z'],
      ['   - Will be auto-formatted as HDfloorLetter (e.g., HD10A)'],
      ['7. Default WS must be > 0 and <= Max WS'],
      ['8. All numeric values must be >= 0'],
      [],
      ['Note: Do not modify column headers']
    ];

    const notesWs = XLSX.utils.aoa_to_sheet(validationNotes);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.utils.book_append_sheet(wb, notesWs, 'Instructions');

    // Download the file
    XLSX.writeFile(wb, 'office_import_template.xlsx');
  };

  const formatOfficeNumber = (floor: number, number: string | number, type: 'office' | 'hot_desk'): string => {
    const paddedFloor = floor.toString().padStart(2, '0');
    
    if (type === 'office') {
      // Ensure office number is at least 2 digits
      const paddedNumber = number.toString().padStart(2, '0');
      return `${paddedFloor}/${paddedNumber}`;
    } else {
      // For hot desks, just use the letter as is (already validated to be A-Z)
      return `HD${paddedFloor}${number}`;
    }
  };

  const validateData = async (data: any[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    const locationMap = new Map(locations.map(l => [l.location_id, l]));

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Account for header row

      // Check location
      const location = locationMap.get(row['Location ID']);
      if (!location) {
        errors.push({
          row: rowNum,
          field: 'Location ID',
          message: `Location "${row['Location ID']}" not found`
        });
        continue;
      }

      // Check floor
      const floor = location.floors?.find(f => f.floor_number === row['Floor']);
      if (!floor) {
        errors.push({
          row: rowNum,
          field: 'Floor',
          message: `Floor ${row['Floor']} not found in location ${location.name}`
        });
      }

      // Check office type
      if (!['office', 'hot_desk'].includes(row['Office Type'])) {
        errors.push({
          row: rowNum,
          field: 'Office Type',
          message: 'Office Type must be either "office" or "hot_desk"'
        });
      }

      // Check view type
      if (!['sea_view', 'city_view', 'internal'].includes(row['View Type'])) {
        errors.push({
          row: rowNum,
          field: 'View Type',
          message: 'View Type must be "sea_view", "city_view", or "internal"'
        });
      }

      // Format and check office number
      const officeId = formatOfficeNumber(
        row['Floor'],
        row['Office Number'],
        row['Office Type'] as 'office' | 'hot_desk'
      );

      if (row['Office Type'] === 'office') {
        // Validate office number is numeric
        if (!/^\d+$/.test(row['Office Number'].toString())) {
          errors.push({
            row: rowNum,
            field: 'Office Number',
            message: 'Office Number must be numeric for office type'
          });
        }
      } else if (row['Office Type'] === 'hot_desk' && !/^[A-Z]$/.test(row['Office Number'])) {
        errors.push({
          row: rowNum,
          field: 'Office Number',
          message: 'Office Number must be a single letter (A-Z) for hot_desk type'
        });
      }

      // Check for duplicate office IDs
      const { data: existingOffices } = await supabase
        .from('office_properties')
        .select('office_id')
        .eq('office_id', officeId)
        .neq('status', 'deleted');

      if (existingOffices && existingOffices.length > 0) {
        errors.push({
          row: rowNum,
          field: 'Office Number',
          message: `Office ID ${officeId} already exists`
        });
      }

      // Check workstation values
      if (row['Default WS'] <= 0) {
        errors.push({
          row: rowNum,
          field: 'Default WS',
          message: 'Default WS must be greater than 0'
        });
      }

      if (row['Max WS'] < row['Default WS']) {
        errors.push({
          row: rowNum,
          field: 'Max WS',
          message: 'Max WS must be greater than or equal to Default WS'
        });
      }

      // Check numeric values
      ['List Price', 'Additional Desk Price', 'MR Credits', 'Print Quota B&W', 'Print Quota Color'].forEach(field => {
        if (row[field] < 0) {
          errors.push({
            row: rowNum,
            field,
            message: `${field} must be greater than or equal to 0`
          });
        }
      });
    }

    return errors;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setIsValidating(false);
    setPreview(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          setIsValidating(true);

          // Backup current data
          const { data: currentOffices } = await supabase
            .from('office_properties')
            .select('*')
            .order('created_at');

          // Validate the data
          const errors = await validateData(jsonData);

          setPreview({
            valid: errors.length === 0,
            errors,
            data: jsonData,
            backup: currentOffices || []
          });
        } finally {
          setIsValidating(false);
          setIsProcessingFile(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setIsProcessingFile(false);
    }
  };

  const handleImport = async () => {
    if (!preview || !preview.valid || isImporting) return;

    setIsImporting(true);
    try {
      // Transform data for import
      const importData = preview.data.map((row: any) => {
        const location = locations.find(l => l.location_id === row['Location ID']);
        const officeId = formatOfficeNumber(
          row['Floor'],
          row['Office Number'],
          row['Office Type'] as 'office' | 'hot_desk'
        );

        return {
          location_id: location?.id,
          floor: row['Floor'],
          office_type: row['Office Type'] as OfficeType,
          office_id: officeId,
          view_type: row['View Type'] as OfficeViewType,
          default_ws: row['Default WS'],
          max_ws: row['Max WS'],
          list_price: row['List Price'],
          additional_desk_price: row['Additional Desk Price'],
          mr_credits: row['MR Credits'],
          print_quota_bw: row['Print Quota B&W'],
          print_quota_color: row['Print Quota Color'],
          notes: row['Notes'],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('office_properties')
        .insert(importData);

      if (error) throw error;

      setImportSuccess(true);
      onComplete(preview.backup || []);
    } catch (error) {
      console.error('Error importing data:', error);
      setError('Failed to import data. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">
            Import Offices
          </h2>
          <button
            onClick={onClose}
            disabled={isValidating || isImporting}
            className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-1">
                Download Template
              </h3>
              <p className="text-sm text-text-secondary">
                Start with our template file containing example data
              </p>
            </div>
            <button
              onClick={generateTemplate}
              disabled={isValidating || isImporting}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Download Template</span>
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-1">
                  Upload Data
                </h3>
                <p className="text-sm text-text-secondary">
                  Upload your completed template file
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="hidden"
                disabled={isProcessingFile || isValidating || isImporting}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile || isValidating || isImporting}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span>Choose File</span>
              </button>
            </div>
          </div>

          {isProcessingFile && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-center space-x-3 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Processing file...</span>
              </div>
            </div>
          )}

          {isValidating && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-center space-x-3 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Validating data...</span>
              </div>
            </div>
          )}

          {preview && !isValidating && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-text-primary mb-4">
                Import Preview
              </h3>

              {preview.errors.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-coral">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Found {preview.errors.length} errors</span>
                  </div>
                  <div className="bg-coral-light rounded-lg p-4">
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                      {preview.errors.map((error, index) => (
                        <p key={index} className="text-sm text-coral-dark">
                          Row {error.row}: {error.field} - {error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-teal">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Ready to import {preview.data.length} offices</span>
                  </div>
                  <div className="bg-teal-light rounded-lg p-4">
                    <p className="text-sm text-teal-dark">
                      All data is valid and ready to be imported. Click Import to proceed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          {preview?.valid && !importSuccess && (
            <button
              onClick={handleImport}
              disabled={isImporting || isValidating}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isImporting || isValidating
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark'
              }`}
            >
              {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isImporting ? 'Importing...' : 'Import'}</span>
            </button>
          )}
          {!importSuccess && (
            <button
              onClick={onClose}
              disabled={isImporting || isValidating}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        {importSuccess && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-teal mx-auto" />
              <p className="text-lg font-medium text-text-primary">Import Successful!</p>
              <p className="text-sm text-text-secondary">
                You can review the imported data and rollback if needed.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
