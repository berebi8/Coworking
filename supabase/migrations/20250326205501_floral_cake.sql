-- Check current credit values for recent agreements
SELECT 
  doc_id,
  commercial_name,
  conference_room_credits,
  conference_room_credits_override,
  print_credits_bw,
  print_credits_bw_override,
  print_credits_color,
  print_credits_color_override,
  -- Extract credit values from office spaces for comparison
  (
    SELECT SUM(COALESCE((o->>'mr_credits')::integer, 0))
    FROM jsonb_array_elements(office_spaces) o
  ) as calculated_mr_credits,
  (
    SELECT SUM(COALESCE((o->>'print_quota_bw')::integer, 0))
    FROM jsonb_array_elements(office_spaces) o
  ) as calculated_bw_credits,
  (
    SELECT SUM(COALESCE((o->>'print_quota_color')::integer, 0))
    FROM jsonb_array_elements(office_spaces) o
  ) as calculated_color_credits
FROM agreements
WHERE office_spaces IS NOT NULL
  AND jsonb_array_length(office_spaces) > 0
ORDER BY updated_at DESC
LIMIT 5;

-- Check if there are any discrepancies between stored and calculated values
SELECT 
  doc_id,
  commercial_name,
  print_credits_bw as stored_bw,
  (
    SELECT SUM(COALESCE((o->>'print_quota_bw')::integer, 0))
    FROM jsonb_array_elements(office_spaces) o
  ) as calculated_bw,
  print_credits_bw_override as bw_override,
  ABS(
    print_credits_bw - (
      SELECT SUM(COALESCE((o->>'print_quota_bw')::integer, 0))
      FROM jsonb_array_elements(office_spaces) o
    )
  ) as bw_difference
FROM agreements
WHERE office_spaces IS NOT NULL
  AND jsonb_array_length(office_spaces) > 0
  AND print_credits_bw_override IS NULL
  AND ABS(
    print_credits_bw - (
      SELECT SUM(COALESCE((o->>'print_quota_bw')::integer, 0))
      FROM jsonb_array_elements(office_spaces) o
    )
  ) > 0
ORDER BY updated_at DESC;

-- Add logging trigger to track credit changes
CREATE OR REPLACE FUNCTION log_credit_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    NEW.print_credits_bw != OLD.print_credits_bw OR
    NEW.print_credits_color != OLD.print_credits_color OR
    NEW.conference_room_credits != OLD.conference_room_credits OR
    NEW.print_credits_bw_override != OLD.print_credits_bw_override OR
    NEW.print_credits_color_override != OLD.print_credits_color_override OR
    NEW.conference_room_credits_override != OLD.conference_room_credits_override
  ) THEN
    RAISE NOTICE 'Credit values changed for agreement %:
      BW: % -> % (override: %)
      Color: % -> % (override: %)
      MR: % -> % (override: %)',
      NEW.doc_id,
      OLD.print_credits_bw, NEW.print_credits_bw, NEW.print_credits_bw_override,
      OLD.print_credits_color, NEW.print_credits_color, NEW.print_credits_color_override,
      OLD.conference_room_credits, NEW.conference_room_credits, NEW.conference_room_credits_override;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS credit_changes_trigger ON agreements;
CREATE TRIGGER credit_changes_trigger
  AFTER UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION log_credit_changes();
