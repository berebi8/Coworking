/*
  # Fix Add-on Services Separation and Cleanup

  1. Changes
    - Delete all soft-deleted services
    - Ensure proper separation between parking and add-on services
    - Fix any duplicate entries

  2. Data Migration
    - Remove all records with status = 'deleted'
    - Ensure parking services have correct type
    - Ensure add-on services have correct type
*/

-- First, permanently delete all soft-deleted services
DELETE FROM addon_services
WHERE status = 'deleted';

-- Create a temporary table to store unique services
CREATE TEMP TABLE unique_services AS
SELECT DISTINCT ON (name, type) *
FROM addon_services;

-- Delete all records from the main table
DELETE FROM addon_services;

-- Reinsert the unique records
INSERT INTO addon_services
SELECT *
FROM unique_services;

-- Drop the temporary table
DROP TABLE unique_services;

-- Ensure parking services have correct type
UPDATE addon_services
SET type = 'parking_reserved'
WHERE type NOT IN ('parking_reserved', 'parking_unassigned', 'parking_ev', 'parking_vip', 'amenities', 'room', 'storage', 'technology', 'support')
AND name ILIKE '%reserved%parking%';

UPDATE addon_services
SET type = 'parking_unassigned'
WHERE type NOT IN ('parking_reserved', 'parking_unassigned', 'parking_ev', 'parking_vip', 'amenities', 'room', 'storage', 'technology', 'support')
AND name ILIKE '%unassigned%parking%';

UPDATE addon_services
SET type = 'parking_ev'
WHERE type NOT IN ('parking_reserved', 'parking_unassigned', 'parking_ev', 'parking_vip', 'amenities', 'room', 'storage', 'technology', 'support')
AND (name ILIKE '%ev%charging%' OR name ILIKE '%electric%vehicle%');

UPDATE addon_services
SET type = 'parking_vip'
WHERE type NOT IN ('parking_reserved', 'parking_unassigned', 'parking_ev', 'parking_vip', 'amenities', 'room', 'storage', 'technology', 'support')
AND name ILIKE '%vip%parking%';

-- Set remaining services to amenities type if they don't have a valid type
UPDATE addon_services
SET type = 'amenities'
WHERE type NOT IN ('parking_reserved', 'parking_unassigned', 'parking_ev', 'parking_vip', 'amenities', 'room', 'storage', 'technology', 'support');
