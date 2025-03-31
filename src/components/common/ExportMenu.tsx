import React, { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

interface ExportMenuProps {
  onExport: (format: 'xlsx' | 'csv') => void; // Single export handler
}

export function ExportMenu({ onExport }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-sm text-primary hover:text-primary-dark transition-colors"
      >
        <Download className="h-4 w-4" />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-dropdown border border-gray-100 py-1 z-10">
          <button
            onClick={() => {
              onExport('xlsx'); // Call onExport with 'xlsx'
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-accent-blue transition-colors"
          >
            Export to Excel (.xlsx)
          </button>
          <button
            onClick={() => {
              onExport('csv'); // Call onExport with 'csv'
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-accent-blue transition-colors"
          >
            Export to CSV
          </button>
        </div>
      )}
    </div>
  );
}
