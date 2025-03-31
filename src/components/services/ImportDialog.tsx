import React, { useState, useRef } from 'react';
import { X, Download, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import type { Location, AddonService } from '../../types/database';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (backup: AddonService[]) => void;
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
  backup?: AddonService[];
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
      {
        'Location': locations[0]?.name || 'Main Office',
        'Add-On/Incidental': 'Add-On Service',
        'Name': 'Meeting Room Access',
        'Default Price': 500,
        'Quantity': 'Unlimited',
        'Notes': 'Access to meeting rooms during business hours'
      },
      {
        'Location': 'All Locations',
        'Add-On/Incidental': 'Add-On Service',
        'Name': 'Dedicated Storage',
        'Default Price': 300,
        'Quantity': 50,
        'Notes': 'Personal storage locker'
      },
      {
        'Location': locations[0]?.name || 'Main Office',
        'Add-On/Incidental': 'Incidental',
        'Name': 'Printing Service',
        'Default Price': 1,
        'Quantity': 'Unlimited',
        'Notes': 'Per page cost for printing'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Add validation notes
    const validationNotes = [
      ['Import Template Instructions:'],
      ['1. Location:'],
      ['   - Must match existing location names'],
      ['   - Use "All Locations" to make service available everywhere'],
      ['   - Multiple locations should be separated by semicolons'],
      ['2. Add-On/Incidental:'],
      ['   - Must be either "Add-On Service" or "Incidental"'],
      ['3. Name:'],
      ['   - Must be unique for each service'],
      ['   - Cannot be empty'],
      ['4. Default Price:'],
      ['   - Must be a whole number >= 0'],
      ['   - Decimal values will be rounded to the nearest integer'],
      ['5. Quantity:'],
      ['   - Must be a whole number > 0 or "Unlimited"'],
      ['6. Notes:'],
      ['   - Optional field for additional information'],
      [],
      ['Note: Do not modify column headers']
    ];

    const notesWs = XLSX.utils.aoa_to_sheet(validationNotes);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.utils.book_append_sheet(wb, notesWs, 'Instructions');

    // Download the file
    XLSX.writeFile(wb, 'addon_services_import_template.xlsx');
  };

  const validateData = async (data: any[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    const locationMap = new Map(locations.map(l => [l.name, l]));
    const existingServices = new Map<string, Set<string>>();

    // Get existing service names and types
    const { data: currentServices } = await supabase
      .from('addon_services')
      .select('name, type')
      .in('type', SERVICE_TYPES)
      .neq('status', 'deleted');

    if (currentServices) {
      currentServices.forEach(service => {
        if (!existingServices.has(service.name)) {
          existingServices.set(service.name, new Set());
        }
        existingServices.get(service.name)?.add(service.type);
      });
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Account for header row

      // Check Add-On/Incidental
      if (!['Add-On Service', 'Incidental'].includes(row['Add-On/Incidental'])) {
        errors.push({
          row: rowNum,
          field: 'Add-On/Incidental',
          message: 'Must be either "Add-On Service" or "Incidental"'
        });
      }

      // Check name
      if (!row['Name']) {
        errors.push({
          row: rowNum,
          field: 'Name',
          message: 'Name is required'
        });
      } else if (existingServices.has(row['Name']) && existingServices.get(row['Name'])?.has('amenities')) {
        errors.push({
          row: rowNum,
          field: 'Name',
          message: `Service "${row['Name']}" already exists`
        });
      }

      // Check for duplicates within the import data
      for (let j = 0; j < i; j++) {
        const otherRow = data[j];
        if (row['Name'] === otherRow['Name']) {
          errors.push({
            row: rowNum,
            field: 'Name',
            message: `Duplicate entry: Service "${row['Name']}" appears multiple times in the import file`
          });
        }
      }

      // Check locations
      if (row['Location'] !== 'All Locations') {
        const locationNames = row['Location'].split(';').map((l: string) => l.trim());
        for (const locationName of locationNames) {
          if (!locationMap.has(locationName)) {
            errors.push({
              row: rowNum,
              field: 'Location',
              message: `Location "${locationName}" not found`
            });
          }
        }
      }

      // Check default price
      const price = parseFloat(row['Default Price']);
      if (isNaN(price) || price < 0) {
        errors.push({
          row: rowNum,
          field: 'Default Price',
          message: 'Default Price must be a number greater than or equal to 0'
        });
      }

      // Check quantity
      if (row['Quantity'] !== 'Unlimited') {
        const quantity = parseInt(row['Quantity']);
        if (isNaN(quantity) || quantity <= 0) {
          errors.push({
            row: rowNum,
            field: 'Quantity',
            message: 'Quantity must be a number greater than 0 or "Unlimited"'
          });
        }
      }
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
          const { data: currentServices } = await supabase
            .from('addon_services')
            .select('*')
            .order('created_at');

          // Validate the data
          const errors = await validateData(jsonData);

          setPreview({
            valid: errors.length === 0,
            errors,
            data: jsonData,
            backup: currentServices || []
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
        const locationIds = row['Location'] === 'All Locations'
          ? []
          : row['Location'].split(';')
              .map((name: string) => locations.find(l => l.name === name.trim())?.id)
              .filter(Boolean);

        // Round the price to the nearest integer
        const price = Math.round(parseFloat(row['Default Price']));

        return {
          name: row['Name'],
          type: 'amenities',
          is_incidental: row['Add-On/Incidental'] === 'Incidental',
          list_price: price,
          quantity: row['Quantity'] === 'Unlimited' ? null : parseInt(row['Quantity']),
          locations: locationIds,
          notes: row['Notes'] || '',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('addon_services')
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
            Import Services
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
                    <span className="font-medium">Ready to import {preview.data.length} services</span>
                  </div>
                  <div className="bg-teal-light rounded-lg p-4">
                    <p className="text-sm text-teal-dark">
                      All data is valid and ready to be imported. Click Import to proceed.
                    </p>
                    <p className="text-sm text-teal-dark mt-2">
                      Note: Decimal prices will be rounded to the nearest whole number.
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
