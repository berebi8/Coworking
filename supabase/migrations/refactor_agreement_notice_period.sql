/*
      # Refactor Agreement Notice Period Logic

      This migration refactors how continuous term notice periods are stored in the `agreements` table.
      It replaces the `notice_period_continuous` and `notice_period_continuous_current_month` columns
      with a more structured approach using `continuous_notice_rule` and `continuous_notice_days`.

      1. New Columns
        - `continuous_notice_rule` (TEXT): Stores the rule type ('CLAUSE_4_4' or 'CURRENT_MONTH_PLUS_DAYS').
        - `continuous_notice_days` (INTEGER): Stores the number of days for the 'CURRENT_MONTH_PLUS_DAYS' rule (nullable).

      2. Data Migration
        - Populates the new columns based on the values in the old deprecated columns.
        - `CLAUSE_4_4` is used if `notice_period_continuous_current_month` was false.
        - `CURRENT_MONTH_PLUS_DAYS` is used if `notice_period_continuous_current_month` was true, and `continuous_notice_days` is populated from `notice_period_continuous`.

      3. Deprecation
        - Adds comments to `notice_period_continuous` and `notice_period_continuous_current_month` indicating they are deprecated.
        - Dropping the old columns is deferred to allow for a smoother transition and verification.

      4. Constraints
        - Adds a CHECK constraint to `continuous_notice_rule` to ensure valid values.
    */

    -- Add new columns for the refactored notice period logic
    ALTER TABLE public.agreements
    ADD COLUMN IF NOT EXISTS continuous_notice_rule TEXT CHECK (continuous_notice_rule IN ('CLAUSE_4_4', 'CURRENT_MONTH_PLUS_DAYS')),
    ADD COLUMN IF NOT EXISTS continuous_notice_days INTEGER;

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
      END
    WHERE continuous_notice_rule IS NULL; -- Only update rows that haven't been migrated

    -- Add comments indicating the old columns are deprecated
    COMMENT ON COLUMN public.agreements.notice_period_continuous IS 'Deprecated: Use continuous_notice_rule and continuous_notice_days instead.';
    COMMENT ON COLUMN public.agreements.notice_period_continuous_current_month IS 'Deprecated: Use continuous_notice_rule instead.';

    -- Note: Dropping the old columns is deferred to allow for a smoother transition.
    -- ALTER TABLE public.agreements DROP COLUMN notice_period_continuous;
    -- ALTER TABLE public.agreements DROP COLUMN notice_period_continuous_current_month;

    -- Potentially add NOT NULL constraints after verifying data migration
    -- ALTER TABLE public.agreements ALTER COLUMN continuous_notice_rule SET NOT NULL;
