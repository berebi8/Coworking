import React, { useEffect } from 'react';
    import { formatDate, calculateDuration } from '../../../lib/utils';
    import type { AgreementFormData, NoticeRuleType } from '../../../types/database';

    interface LicenseTermsProps {
      formData: AgreementFormData;
      setFormData: (data: AgreementFormData) => void;
    }

    export function LicenseTerms({ formData, setFormData }: LicenseTermsProps) {
      // Calculate continuous term start date (1 day after fixed term end date)
      const calculateContinuousStartDate = (endDate: string): string => {
        const date = new Date(endDate);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
      };

      // Update dates and durations when dates change
      useEffect(() => {
        if (formData.has_fixed_term && formData.start_date && formData.first_fixed_term_end_date) {
          // Calculate duration
          const duration = calculateDuration(formData.start_date, formData.first_fixed_term_end_date);

          // Calculate continuous term start date
          const continuousStartDate = calculateContinuousStartDate(formData.first_fixed_term_end_date);

          setFormData({
            ...formData,
            first_fixed_term_duration: duration.months,
            continuous_term_start_date: continuousStartDate
          });
        } else if (!formData.has_fixed_term && formData.start_date) {
          // If only continuous term, start date is the continuous start date
          setFormData({
            ...formData,
            continuous_term_start_date: formData.start_date
          });
        }
      }, [formData.start_date, formData.first_fixed_term_end_date, formData.has_fixed_term]);

      const handleContinuousNoticeRuleChange = (rule: NoticeRuleType) => {
        setFormData({
          ...formData,
          continuous_notice_rule: rule,
          // Reset days if switching to CLAUSE_4_4, keep existing/default if switching to PLUS_DAYS
          continuous_notice_days: rule === 'CLAUSE_4_4' ? null : (formData.continuous_notice_days ?? 180)
        });
      };

      const handleContinuousNoticeDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
        // Only update if the rule is CURRENT_MONTH_PLUS_DAYS
        if (formData.continuous_notice_rule === 'CURRENT_MONTH_PLUS_DAYS') {
          setFormData({
            ...formData,
            continuous_notice_days: value
          });
        }
      };


      return (
        <div className="space-y-4 bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-text-secondary">License Terms</h3>

          {/* Term Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Term Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.has_fixed_term}
                  onChange={() => setFormData({
                    ...formData,
                    has_fixed_term: true,
                    first_fixed_term_duration: null,
                    first_fixed_term_end_date: '',
                    continuous_term_start_date: '', // Will be recalculated by useEffect
                    continuous_term_duration: 'month-to-month'
                  })}
                  className="text-primary focus:ring-primary"
                />
                <span>Fixed Term + Continuous Term</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={!formData.has_fixed_term}
                  onChange={() => setFormData({
                    ...formData,
                    has_fixed_term: false,
                    first_fixed_term_duration: null,
                    first_fixed_term_end_date: null,
                    continuous_term_start_date: formData.start_date, // Set directly
                    continuous_term_duration: 'month-to-month'
                  })}
                  className="text-primary focus:ring-primary"
                />
                <span>Continuous Term Only</span>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            {/* First Fixed Term */}
            {formData.has_fixed_term && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-text-secondary">First Fixed Term</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      License Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                    <div className="mt-1 text-xs text-text-secondary">
                      {formData.start_date ? formatDate(formData.start_date) : ''}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      First Fixed Term End Date
                    </label>
                    <input
                      type="date"
                      value={formData.first_fixed_term_end_date || ''}
                      onChange={(e) => setFormData({ ...formData, first_fixed_term_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      min={formData.start_date}
                    />
                    <div className="mt-1 text-xs text-text-secondary">
                      {formData.first_fixed_term_end_date ? formatDate(formData.first_fixed_term_end_date) : ''}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Duration
                    </label>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-text-secondary">
                      {formData.start_date && formData.first_fixed_term_end_date ? (
                        (() => {
                          const { months, days } = calculateDuration(formData.start_date, formData.first_fixed_term_end_date);
                          return `${months} months and ${days} days`;
                        })()
                      ) : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Notice Period for Non-Renewal (Fixed Term)
                    </label>
                    {/* Note: Fixed term notice period logic remains unchanged for now */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={!formData.notice_period_fixed_current_month}
                          onChange={() => setFormData({
                            ...formData,
                            notice_period_fixed_current_month: false
                          })}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm">as set forth in clauses 4.4(a) and 4.4(b)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={formData.notice_period_fixed_current_month}
                          onChange={() => setFormData({
                            ...formData,
                            notice_period_fixed_current_month: true
                          })}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Current month +</span>
                        <input
                          type="number"
                          value={formData.notice_period_fixed}
                          onChange={(e) => setFormData({
                            ...formData,
                            notice_period_fixed: parseInt(e.target.value)
                          })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                          min="0"
                          disabled={!formData.notice_period_fixed_current_month}
                        />
                        <span className="text-sm">days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Continuous Term */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-text-secondary">Continuous Term</h4>
              <div className="grid grid-cols-2 gap-4">
                {!formData.has_fixed_term && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      License Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({
                        ...formData,
                        start_date: e.target.value,
                        // Update continuous start date directly if no fixed term
                        continuous_term_start_date: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                    <div className="mt-1 text-xs text-text-secondary">
                      {formData.start_date ? formatDate(formData.start_date) : ''}
                    </div>
                  </div>
                )}
                {formData.has_fixed_term && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Continuous Term Start Date
                    </label>
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-text-secondary">
                      {formData.continuous_term_start_date ? formatDate(formData.continuous_term_start_date) : '-'}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Continuous Term Duration
                  </label>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-text-secondary">
                    Month-to-Month
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Notice Period for Non-Renewal (Continuous Term)
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="continuousNoticeRule"
                        value="CLAUSE_4_4"
                        checked={formData.continuous_notice_rule === 'CLAUSE_4_4'}
                        onChange={() => handleContinuousNoticeRuleChange('CLAUSE_4_4')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">as set forth in clauses 4.4(a) and 4.4(b)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="continuousNoticeRule"
                        value="CURRENT_MONTH_PLUS_DAYS"
                        checked={formData.continuous_notice_rule === 'CURRENT_MONTH_PLUS_DAYS'}
                        onChange={() => handleContinuousNoticeRuleChange('CURRENT_MONTH_PLUS_DAYS')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Current month +</span>
                      <input
                        type="number"
                        value={formData.continuous_notice_days ?? ''} // Use nullish coalescing for empty display
                        onChange={handleContinuousNoticeDaysChange}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                        min="0"
                        disabled={formData.continuous_notice_rule !== 'CURRENT_MONTH_PLUS_DAYS'}
                      />
                      <span className="text-sm">days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
