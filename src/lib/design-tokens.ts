/**
 * ClaimKavach Design Tokens
 * =========================
 * Single source of truth for all colors, spacing, and typography.
 * NO hardcoded hex values anywhere else in the codebase.
 * All verdict tiers use Color + Icon + Text Label (never color alone).
 */

// ─── Brand Colors ─────────────────────────────────────────────────────────────

export const colors = {
  // Primary brand
  primaryNavy: '#102A43',
  actionTeal: '#0F766E',
  actionTealHover: '#0D9488',
  softTealTint: '#E0F2F1',

  // Surfaces
  pageBg: '#F8FAFC',
  cardBg: '#FFFFFF',
  subtlePanel: '#F1F5F9',

  // Text
  textPrimary: '#102A43',
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

export interface VerdictTierConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string; // Emoji for accessibility (Color + Icon + Text Label)
  description: string;
}

export const verdictTiers: Record<VerdictTier, VerdictTierConfig> = {
  CONFIRMED: {
    label: 'Confirmed Issue',
    color: colors.verdictConfirmed,
    bgColor: colors.verdictConfirmedBg,
    icon: '🔴',
    description: 'Backed by verified reference data or pure arithmetic error.',
  },
  LIKELY: {
    label: 'Likely Issue',
    color: colors.verdictLikely,
    bgColor: colors.verdictLikelyBg,
    icon: '🟠',
    description: 'Strong signal such as duplicate line or unverified reference match.',
  },
  NEEDS_REVIEW: {
    label: 'Needs Review',
    color: colors.verdictNeedsReview,
    bgColor: colors.verdictNeedsReviewBg,
    icon: '🔵',
    description: 'Ambiguous or lump-sum item requiring itemized bill.',
  },
  VALID_EXCLUSION: {
    label: 'Valid / Standard',
    color: colors.verdictValidExclusion,
    bgColor: colors.verdictValidExclusionBg,
    icon: '🟢',
    description: 'Legitimate charge or standard exclusion.',
  },
  NOT_CHECKED: {
    label: 'Not Checked',
    color: colors.verdictNotChecked,
    bgColor: colors.verdictNotCheckedBg,
    icon: '⚪',
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
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'Fira Code', monospace",
  sizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
} as const;

// ─── Accessibility ────────────────────────────────────────────────────────────

export const a11y = {
  minTapTarget: '44px',
  focusRingWidth: '2px',
  focusRingColor: colors.borderFocus,
  focusRingOffset: '2px',
} as const;

// ─── Contrast Ratios (pre-computed for testing) ───────────────────────────────
// WCAG AA requires >= 4.5:1 for normal text, >= 3:1 for large text.
// These are the critical pairs we must verify.

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
  { foreground: colors.cardBg, background: colors.primaryNavy, label: 'White text on navy', minRatio: 4.5 },
];
