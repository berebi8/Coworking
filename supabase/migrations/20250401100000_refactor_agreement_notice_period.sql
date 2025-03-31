-- Add new columns for the refactored notice period logic
ALTER TABLE public.agreements
ADD COLUMN continuous_notice_rule TEXT CHECK (continuous_notice_rule IN ('CLAUSE_4_4', 'CURRENT_MONTH_PLUS_DAYS')),
ADD COLUMN continuous_notice_days INTEGER;

-- Migrate data from old columns to new columns
UPDATE public.agreements
SET
  continuous_notice_rule = CASE
    WHEN notice_period_continuous_current_month = TRUE THEN 'CURRENT_MONTH_PLUS_DAYS'
    ELSE 'CLAUSE_4_4'
  END,
  continuous_notice_days = CASE
    WHEN notice_period_continuous_current_month = TRUE THEN notice_period_continuous
    ELSE NULL
  END;

-- Add comments indicating the old columns are deprecated
COMMENT ON COLUMN public.agreements.notice_period_continuous IS 'Deprecated: Use continuous_notice_rule and continuous_notice_days instead.';
COMMENT ON COLUMN public.agreements.notice_period_continuous_current_month IS 'Deprecated: Use continuous_notice_rule instead.';

-- Note: Dropping the old columns is deferred to allow for a smoother transition.
-- ALTER TABLE public.agreements DROP COLUMN notice_period_continuous;
-- ALTER TABLE public.agreements DROP COLUMN notice_period_continuous_current_month;

-- Potentially add NOT NULL constraints after verifying data migration
-- ALTER TABLE public.agreements ALTER COLUMN continuous_notice_rule SET NOT NULL;
