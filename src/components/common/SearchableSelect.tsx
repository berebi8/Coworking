import React from 'react';
import Select, { Props as SelectProps } from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps extends Omit<SelectProps<Option, false>, 'classNames'> {
  label?: string;
  error?: string;
}

export function SearchableSelect({ label, error, ...props }: SearchableSelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <Select
        {...props}
        classNames={{
          control: (state) => 
            `!bg-white !border-gray-300 !rounded-lg !shadow-none !transition-colors ${
              state.isFocused ? '!border-primary !ring-2 !ring-primary/20' : ''
            } ${error ? '!border-coral !ring-2 !ring-coral/20' : ''}`,
          menu: () => "!bg-white !border !border-gray-100 !shadow-lg !rounded-lg !mt-1",
          option: (state) => 
            `!transition-colors ${
              state.isSelected
                ? '!bg-primary !text-white'
                : state.isFocused
                ? '!bg-accent-blue !text-primary'
                : ''
            }`,
          input: () => "!text-sm",
          placeholder: () => "!text-gray-400",
          singleValue: () => "!text-text-primary",
          valueContainer: () => "!py-1",
        }}
      />
      {error && (
        <p className="mt-1 text-sm text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
