/**
 * ClaimKavach Design Tokens
 * =========================
 * Single source of truth for all colors, spacing, and typography.
 * NO hardcoded hex values anywhere else in the codebase.
 * All verdict tiers pair Color + Inline SVG Icon + Text Label.
 */

// ─── Brand Colors ─────────────────────────────────────────────────────────────

export const colors = {
  // Primary brand
  primaryNavy: '#0B1530',
  actionTeal: '#0F766E',
  actionTealHover: '#0D9488',
  softTealTint: '#E0F2F1',

  // Surfaces
  pageBg: '#F4F7FA',
  cardBg: '#FFFFFF',
  subtlePanel: '#F1F5F9',

  // Text
  textPrimary: '#0B1530',
  textSecondary: '#334155',
  textMuted: '#64748B', // Passes 4.5:1 on white (#FFFFFF)

  // Verdict Tier Colors (darkened to pass WCAG AA >= 4.5:1 on tinted backgrounds)
  verdictConfirmed: '#B91C1C',       // Red — CONFIRMED overcharge
  verdictConfirmedBg: '#FEF2F2',
  verdictLikely: '#B45309',          // Amber — LIKELY issue
  verdictLikelyBg: '#FFFBEB',
  verdictNeedsReview: '#0369A1',     // Sky — NEEDS_REVIEW
  verdictNeedsReviewBg: '#F0F9FF',
  verdictValidExclusion: '#047857',  // Emerald — VALID_EXCLUSION
  verdictValidExclusionBg: '#ECFDF5',
  verdictNotChecked: '#475569',      // Slate — NOT_CHECKED
  verdictNotCheckedBg: '#F8FAFC',

  // Borders & Dividers
  border: '#E2E8F0',
  borderFocus: '#0F766E',

  // Status
  error: '#B91C1C',
  errorBg: '#FEF2F2',
  success: '#047857',
  successBg: '#ECFDF5',
  warning: '#B45309',
  warningBg: '#FFFBEB',
} as const;

// ─── Verdict Tier Configuration ───────────────────────────────────────────────

export type VerdictTier =
  | 'CONFIRMED'
  | 'LIKELY'
  | 'NEEDS_REVIEW'
  | 'VALID_EXCLUSION'
  | 'NOT_CHECKED';

export type VerdictIconName =
  | 'alert-circle'
  | 'alert-triangle'
  | 'search'
  | 'check-circle'
  | 'minus-circle';

export interface VerdictTierConfig {
  label: string;
  color: string;
  bgColor: string;
  iconName: VerdictIconName;
  description: string;
}

export const verdictTiers: Record<VerdictTier, VerdictTierConfig> = {
  CONFIRMED: {
    label: 'Confirmed Issue',
    color: colors.verdictConfirmed,
    bgColor: colors.verdictConfirmedBg,
    iconName: 'alert-circle',
    description: 'Backed by verified reference data or pure arithmetic error.',
  },
  LIKELY: {
    label: 'Likely Issue',
    color: colors.verdictLikely,
    bgColor: colors.verdictLikelyBg,
    iconName: 'alert-triangle',
    description: 'Strong signal such as duplicate line or unverified reference match.',
  },
  NEEDS_REVIEW: {
    label: 'Needs Review',
    color: colors.verdictNeedsReview,
    bgColor: colors.verdictNeedsReviewBg,
    iconName: 'search',
    description: 'Ambiguous or lump-sum item requiring itemized bill.',
  },
  VALID_EXCLUSION: {
    label: 'Valid / Standard',
    color: colors.verdictValidExclusion,
    bgColor: colors.verdictValidExclusionBg,
    iconName: 'check-circle',
    description: 'Legitimate charge or standard exclusion.',
  },
  NOT_CHECKED: {
    label: 'Not Checked',
    color: colors.verdictNotChecked,
    bgColor: colors.verdictNotCheckedBg,
    iconName: 'minus-circle',
    description: 'Could not verify — explicit reason provided.',
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
} as const;

// ─── Accessibility ────────────────────────────────────────────────────────────

export const a11y = {
  minTapTarget: '44px',
  focusRingWidth: '2px',
  focusRingColor: colors.borderFocus,
  focusRingOffset: '2px',
} as const;

// ─── Contrast Ratios (pre-computed for WCAG AA testing) ───────────────────────

export const contrastPairs: Array<{
  foreground: string;
  background: string;
  label: string;
  minRatio: number;
}> = [
  { foreground: colors.textPrimary, background: colors.cardBg, label: 'Primary text on card', minRatio: 4.5 },
  { foreground: colors.textSecondary, background: colors.cardBg, label: 'Secondary text on card', minRatio: 4.5 },
  { foreground: colors.textMuted, background: colors.cardBg, label: 'Muted text on card', minRatio: 4.5 },
  { foreground: colors.textPrimary, background: colors.pageBg, label: 'Primary text on page', minRatio: 4.5 },
  { foreground: colors.textSecondary, background: colors.pageBg, label: 'Secondary text on page', minRatio: 4.5 },
  { foreground: colors.verdictConfirmed, background: colors.verdictConfirmedBg, label: 'Confirmed verdict text', minRatio: 4.5 },
  { foreground: colors.verdictLikely, background: colors.verdictLikelyBg, label: 'Likely verdict text', minRatio: 4.5 },
  { foreground: colors.verdictNeedsReview, background: colors.verdictNeedsReviewBg, label: 'Needs review verdict text', minRatio: 4.5 },
  { foreground: colors.verdictValidExclusion, background: colors.verdictValidExclusionBg, label: 'Valid exclusion verdict text', minRatio: 4.5 },
  { foreground: colors.verdictNotChecked, background: colors.verdictNotCheckedBg, label: 'Not checked verdict text', minRatio: 4.5 },
  { foreground: colors.cardBg, background: colors.actionTeal, label: 'White text on teal button', minRatio: 4.5 },
  { foreground: colors.cardBg, background: colors.primaryNavy, label: 'White text on deep navy', minRatio: 4.5 },
];
