/**
 * ClaimKavach i18n — Hindi strings
 * Every key MUST match en.ts (enforced by Vitest parity test).
 */
const hi = {
  // App
  appName: 'ClaimKavach',
  appTagline: 'आपका अस्पताल बिल ऑडिटर',
  appDescription: 'AI आपका बिल पढ़ता है। नियम-आधारित इंजन जाँच करता है। नियंत्रण आपके हाथ में।',

  // Privacy
  privacyNotice: 'हम कुछ भी संग्रहीत नहीं करते। आपकी फ़ाइल केवल टेक्स्ट पढ़ने के लिए Google Gemini को भेजी जाती है; ऑडिट आपके ब्राउज़र में स्थानीय रूप से चलता है।',
  privacyConsent: 'मैं समझता/समझती हूँ और आगे बढ़ने के लिए सहमत हूँ',
  privacyLearnMore: 'हमारे प्राइवेसी मॉडल के बारे में और जानें',

  // Navigation
  stepUpload: 'अपलोड',
  stepVerify: 'सत्यापन',
  stepReport: 'रिपोर्ट',

  // Landing
  landingTitle: 'भुगतान से पहले अपना अस्पताल बिल समझें',
  landingSubtitle: 'ClaimKavach आपके अस्पताल के बिल की सरकारी मूल्य सूची और गणित से जाँच करता है — ताकि आप बिलिंग काउंटर पर सही सवाल पूछ सकें।',
  ctaUpload: 'अपना बिल अपलोड करें',
  ctaDemo: 'डेमो बिल आज़माएँ (अपलोड की ज़रूरत नहीं)',
  demoStripTitle: 'सिंथेटिक डेमो बिल आज़माएँ',
  demoStripSubtitle: 'पहले से बने नमूना बिलों के साथ ClaimKavach को काम करते देखें',
  demoScenarioA: 'स्टेंट अधिक शुल्क + डुप्लिकेट + एकमुश्त राशि',
  demoScenarioADesc: 'DES स्टेंट, गणितीय अंतर, दोहराया गया लैब टेस्ट और एकमुश्त फ़ार्मेसी शुल्क वाला एंजियोप्लास्टी बिल।',
  demoScenarioB: 'TPA / बीमाकर्ता कटौती समीक्षा',
  demoScenarioBDesc: 'कंज्यूमेबल्स कटौती और अस्पष्ट "Reasonable & Customary" कटौती वाला डिस्चार्ज क्लेम।',
  demoScenarioC: 'सही बिल (शून्य गलत पहचान)',
  demoScenarioCDesc: 'सटीक जोड़, स्पष्ट इकाई विवरण और बिना किसी विसंगति वाला साफ अस्पताल बिल।',
  syntheticBadge: 'सिंथेटिक',

  // Upload
  uploadTitle: 'अपना अस्पताल बिल अपलोड करें',
  uploadDragDrop: 'अपना बिल यहाँ खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें',
  uploadFormats: 'समर्थित: PDF, JPG, PNG (अधिकतम 10 MB)',
  uploadProcessing: 'आपका बिल पढ़ा जा रहा है...',

  // Verify
  verifyTitle: 'निकाली गई लाइन आइटम सत्यापित करें',
  verifySubtitle: 'अपने बिल से निकाली गई जानकारी की समीक्षा करें। ऑडिट चलाने से पहले किसी भी गलत मान को संपादित करें।',
  reconcileBarLabel: 'मिलान',
  reconcileExtractedSum: 'लाइनों का निकाला गया योग',
  reconcileBillTotal: 'बिल में बताया गया कुल',
  reconcileMatch: 'कुल मिलान हो गया',
  reconcileDiscrepancy: 'विसंगति पाई गई',
  verifyConfirmToggle: 'मैंने यह जाँचा',
  verifyRunAudit: 'ऑडिट चलाएँ',

  // Report
  reportTitle: 'ऑडिट रिपोर्ट',
  reportCoverageTitle: 'कवरेज सारांश',
  reportArithmeticChecked: 'गणित जाँचा गया',
  reportReferenceChecked: 'संदर्भ जाँचा गया',
  reportNotChecked: 'जाँच नहीं हुई',
  reportNotCheckedReason: 'कारण',
  reportEvidencePanel: 'प्रमाण',
  reportSourceOrder: 'स्रोत आदेश सं.',
  reportUnverifiedBadge: 'असत्यापित डेटा',
  reportVerifiedBadge: 'सत्यापित डेटा',

  // Verdict Tiers
  verdictConfirmed: 'पुष्ट समस्या',
  verdictLikely: 'संभावित समस्या',
  verdictNeedsReview: 'समीक्षा आवश्यक',
  verdictValidExclusion: 'वैध / मानक',
  verdictNotChecked: 'जाँच नहीं हुई',

  // Dispute Pack
  disputeTitle: 'विवाद ड्राफ्ट पैक',
  disputeSubtitle: 'विभिन्न शिकायत मार्गों के लिए विनम्र, कॉपी-योग्य ड्राफ्ट। [BLANK] प्लेसहोल्डर को अपने विवरण से बदलें।',
  disputeHospitalQuery: 'अस्पताल बिलिंग पूछताछ',
  disputeInsurerGrievance: 'बीमाकर्ता शिकायत अधिकारी',
  disputeBimaBharosa: 'बीमा भरोसा पोर्टल',
  disputeOmbudsman: 'बीमा लोकपाल',
  disputeVerifyChecklist: 'भेजने से पहले, कृपया सत्यापित करें:',
  disputeCopyButton: 'क्लिपबोर्ड पर कॉपी करें',
  disputeCopied: 'कॉपी हो गया!',

  // Educational Disclaimer
  disclaimer: 'ClaimKavach एक शैक्षिक सत्यापन उपकरण है। यह कानूनी या चिकित्सा सलाह नहीं है। इस विश्लेषण के आधार पर निर्णय लेने से पहले हमेशा किसी योग्य पेशेवर से परामर्श करें।',

  // Errors
  errorFileTooLarge: 'फ़ाइल 10 MB की सीमा से अधिक है। कृपया अपने बिल को संपीड़ित या विभाजित करें।',
  errorUnsupportedFormat: 'असमर्थित फ़ाइल प्रारूप। कृपया PDF, JPG, या PNG का उपयोग करें।',
  errorExtractionFailed: 'बिल पढ़ नहीं सका। कृपया स्पष्ट छवि या PDF आज़माएँ।',
  errorGeneric: 'कुछ गलत हो गया। कृपया पुन: प्रयास करें।',

  // Misc
  of: 'में से',
  items: 'आइटम',
  close: 'बंद करें',
  back: 'वापस',
  next: 'आगे',
  loading: 'लोड हो रहा है...',
  listenButton: 'सुनें',
  listenWarning: 'यदि डिवाइस पर कोई आवाज़ उपलब्ध नहीं है तो ऑनलाइन स्पीच सेवा का उपयोग हो सकता है।',
  languageToggle: 'English',
} as const;

export default hi;
