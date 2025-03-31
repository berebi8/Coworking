import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerProps {
  label?: string;
  error?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export function DatePicker({ 
  label, 
  error, 
  value, 
  onChange,
  minDate,
  maxDate,
  disabled
}: DatePickerProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <ReactDatePicker
        selected={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
          error
            ? 'border-coral focus:ring-coral/20'
            : 'border-gray-300 focus:ring-primary/20'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        dateFormat="yyyy-MM-dd"
      />
      {error && (
        <p className="mt-1 text-sm text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
