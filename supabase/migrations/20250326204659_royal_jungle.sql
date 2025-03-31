/*
  # Debug credit fields in agreements table
  
  1. Changes
    - Add debug queries to check credit field values
    - Check JSONB structure of office_spaces
    - Verify data consistency
*/

-- Check the current state of credit fields
SELECT 
  doc_id,
  commercial_name,
  conference_room_credits,
  conference_room_credits_override,
  print_credits_bw,
  print_credits_bw_override,
  print_credits_color,
  print_credits_color_override
FROM agreements
ORDER BY updated_at DESC
LIMIT 10;

-- Debug: Check if the office_spaces JSONB contains the expected credit values
SELECT
  doc_id,
  commercial_name,
  jsonb_pretty(office_spaces) as office_spaces_formatted
FROM agreements
WHERE office_spaces IS NOT NULL
  AND jsonb_array_length(office_spaces) > 0
ORDER BY updated_at DESC
LIMIT 5;

-- Check for any NULL or invalid credit values
SELECT 
  doc_id,
  commercial_name,
  CASE 
    WHEN conference_room_credits IS NULL THEN 'NULL'
    WHEN conference_room_credits < 0 THEN 'NEGATIVE'
    ELSE 'VALID'
  END as mr_credits_status,
  CASE 
    WHEN print_credits_bw IS NULL THEN 'NULL'
    WHEN print_credits_bw < 0 THEN 'NEGATIVE'
    ELSE 'VALID'
  END as bw_credits_status,
  CASE 
    WHEN print_credits_color IS NULL THEN 'NULL'
    WHEN print_credits_color < 0 THEN 'NEGATIVE'
    ELSE 'VALID'
  END as color_credits_status
FROM agreements
WHERE conference_room_credits IS NULL 
   OR print_credits_bw IS NULL 
   OR print_credits_color IS NULL
   OR conference_room_credits < 0
   OR print_credits_bw < 0
   OR print_credits_color < 0;

-- Check if any override values are strings instead of integers
SELECT 
  doc_id,
  commercial_name,
  conference_room_credits_override,
  print_credits_bw_override,
  print_credits_color_override,
  pg_typeof(conference_room_credits_override) as mr_override_type,
  pg_typeof(print_credits_bw_override) as bw_override_type,
  pg_typeof(print_credits_color_override) as color_override_type
FROM agreements
WHERE conference_room_credits_override IS NOT NULL
   OR print_credits_bw_override IS NOT NULL
   OR print_credits_color_override IS NOT NULL;
