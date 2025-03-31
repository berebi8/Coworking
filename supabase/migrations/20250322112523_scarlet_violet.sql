/*
  # Rename JSON columns in agreements table

  1. Changes
    - Rename office_spaces_json to office_spaces
    - Rename parking_spaces_json to parking_spaces
    - Rename services_json to services

  2. Data Migration
    - Preserve existing data during column renaming
*/

-- Rename the columns
ALTER TABLE agreements
  RENAME COLUMN office_spaces_json TO office_spaces;

ALTER TABLE agreements
  RENAME COLUMN parking_spaces_json TO parking_spaces;

ALTER TABLE agreements
  RENAME COLUMN services_json TO services;
