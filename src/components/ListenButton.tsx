'use client';

import { useEffect, useMemo, useState } from 'react';
import { SpeakerIcon } from '@/components/Icons';
import { useI18n } from '@/lib/i18n';
import type { AuditReport } from '@/lib/schemas/audit';

interface ListenButtonProps {
  report: AuditReport;
}

type SpeechStatus = 'idle' | 'speaking' | 'paused';

function buildSpeechSummary(report: AuditReport, locale: 'en' | 'hi'): string {
  const { coverage, tiers } = report;
  if (locale === 'hi') {
    return [
      `ClaimKavach ऑडिट सारांश।`,
      `कुल ${coverage.totalLines} लाइनों में से ${coverage.arithmeticCheckedCount} का गणित जाँचा गया और ${coverage.referenceCheckedCount} का संदर्भ डेटा से मिलान किया गया।`,
      `${coverage.notCheckedCount} आइटम जाँच नहीं हुए।`,
      `पुष्ट समस्याएँ: ${tiers.CONFIRMED.count}।`,
      `संभावित समस्याएँ: ${tiers.LIKELY.count}।`,
      `समीक्षा आवश्यक: ${tiers.NEEDS_REVIEW.count}।`,
      `वैध या मानक: ${tiers.VALID_EXCLUSION.count}।`,
      `जाँच नहीं हुई: ${tiers.NOT_CHECKED.count}।`,
    ].join(' ');
  }

  return [
    `ClaimKavach audit summary.`,
    `Arithmetic checked on ${coverage.arithmeticCheckedCount} of ${coverage.totalLines} lines.`,
    `Reference data checked on ${coverage.referenceCheckedCount} of ${coverage.totalLines} lines.`,
    `Not checked: ${coverage.notCheckedCount} items.`,
    `Confirmed issues: ${tiers.CONFIRMED.count}.`,
    `Likely issues: ${tiers.LIKELY.count}.`,
    `Needs review: ${tiers.NEEDS_REVIEW.count}.`,
    `Valid or standard: ${tiers.VALID_EXCLUSION.count}.`,
    `Not checked tier: ${tiers.NOT_CHECKED.count}.`,
  ].join(' ');
}

function selectPreferredVoice(
  voices: SpeechSynthesisVoice[],
  locale: 'en' | 'hi',
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const preferredLang = locale === 'hi' ? 'hi-in' : 'en-in';
  const langPrefix = locale === 'hi' ? 'hi' : 'en';

  const exactLocal = voices.find(
    (v) => v.localService && v.lang.toLowerCase() === preferredLang,
  );
  if (exactLocal) return exactLocal;

  const prefixLocal = voices.find(
    (v) => v.localService && v.lang.toLowerCase().startsWith(langPrefix),
  );
  if (prefixLocal) return prefixLocal;

  const anyLocal = voices.find((v) => v.localService);
  if (anyLocal) return anyLocal;

  const exactCloud = voices.find((v) => v.lang.toLowerCase() === preferredLang);
  if (exactCloud) return exactCloud;

  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ?? voices[0]
  );
}

export function ListenButton({ report }: ListenButtonProps) {
  const { locale, t } = useI18n();
  const [speechSession, setSpeechSession] = useState<{
    status: SpeechStatus;
    locale: 'en' | 'hi';
  }>({ status: 'idle', locale });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechState: SpeechStatus =
    speechSession.locale === locale ? speechSession.status : 'idle';

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      setVoices(synth.getVoices());
    };
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);

    return () => {
      synth.removeEventListener?.('voiceschanged', loadVoices);
      synth.cancel();
    };
  }, [isSupported]);

  // Stop ongoing speech when switching EN <-> HI or unmounting
  useEffect(() => {
    if (!isSupported) return;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isSupported, locale]);

  const preferredVoice = useMemo(
    () => selectPreferredVoice(voices, locale),
    [voices, locale],
  );

  const usesOnlineVoice =
    preferredVoice !== null && preferredVoice.localService === false;

  if (!isSupported) {
    return (
      <div className="no-print text-xs text-text-muted">
        {t('listenUnsupported')}
      </div>
    );
  }

  function handlePlayOrResume() {
    const synth = window.speechSynthesis;
    if (speechState === 'paused') {
      synth.resume();
      setSpeechSession({ status: 'speaking', locale });
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(
      buildSpeechSummary(report, locale),
    );
    utterance.lang = locale === 'hi' ? 'hi-IN' : 'en-IN';
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.onend = () => setSpeechSession({ status: 'idle', locale });
    utterance.onerror = () => setSpeechSession({ status: 'idle', locale });
    synth.speak(utterance);
    setSpeechSession({ status: 'speaking', locale });
  }

  function handlePause() {
    window.speechSynthesis.pause();
    setSpeechSession({ status: 'paused', locale });
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setSpeechSession({ status: 'idle', locale });
  }

  return (
    <div className="no-print rounded-2xl border border-border bg-card-bg p-4 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <SpeakerIcon className="w-4 h-4 text-action-teal flex-shrink-0" />
          <span className="text-sm font-semibold text-primary-navy">
            {t('listenTitle')}
          </span>
          {preferredVoice?.localService === true && (
            <span className="px-2 py-0.5 rounded bg-verdict-valid-bg text-verdict-valid text-[11px] font-semibold">
              {t('listenLocalBadge')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {speechState === 'speaking' ? (
            <button
              type="button"
              onClick={handlePause}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-border bg-subtle-panel hover:bg-soft-teal-tint text-sm font-semibold text-text-primary cursor-pointer"
            >
              {t('listenPause')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlayOrResume}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-soft-teal-tint hover:bg-action-teal/15 text-action-teal border border-action-teal/30 text-sm font-semibold cursor-pointer"
            >
              {speechState === 'paused' ? t('listenResume') : t('listenPlay')}
            </button>
          )}

          {speechState !== 'idle' && (
            <button
              type="button"
              onClick={handleStop}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-border bg-card-bg hover:bg-subtle-panel text-sm font-semibold text-text-secondary cursor-pointer"
            >
              {t('listenStop')}
            </button>
          )}
        </div>
      </div>

      {usesOnlineVoice && (
        <p className="text-xs text-verdict-likely bg-verdict-likely-bg border border-verdict-likely/20 rounded-lg px-3 py-2">
          {t('listenOnlineNotice')}
        </p>
      )}
    </div>
  );
}
