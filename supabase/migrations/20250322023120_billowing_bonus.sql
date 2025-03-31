/*
  # Delete all agreements and related data

  1. Changes
    - Delete all records from agreement_office_spaces
    - Delete all records from agreement_parking_spaces
    - Delete all records from agreement_services
    - Delete all records from agreements

  2. Data Migration
    - Ensure proper order of deletion to maintain referential integrity
    - Use CASCADE where appropriate
*/

-- First delete all related records from child tables
DELETE FROM agreement_office_spaces;
DELETE FROM agreement_parking_spaces;
DELETE FROM agreement_services;

-- Then delete all agreements
DELETE FROM agreements;
