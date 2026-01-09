/**
 * Translations for the portfolio application
 */

export type TranslationKey =
  | "welcome.title"
  | "welcome.subtitle"
  | "voice.speak"
  | "voice.stop"
  | "voice.listening"
  | "voice.processing"
  | "chat.placeholder"
  | "chat.send"
  | "chat.status"
  | "chat.encrypted"
  | "chat.remoteUser"
  | "chat.systemArchive"
  | "chat.signalInterrupted"
  | "context.whoAreYou"
  | "context.hide"
  | "context.recruiterMode"
  | "context.visitorMode"
  | "context.set"
  | "context.techFocus"
  | "context.custom"
  | "context.networkActivity"
  | "context.jobDetails"
  | "context.anythingElse"
  | "context.resetContext"
  | "project.terminate"
  | "project.downloadSrc"
  | "project.initializeDemo"
  | "project.watchDemo"
  | "project.dataPacket"
  | "project.assignment"
  | "project.briefing"
  | "project.techStack"
  | "project.impact"
  | "project.sourceCode"
  | "email.modal.title"
  | "email.modal.name"
  | "email.modal.email"
  | "email.modal.send"
  | "email.modal.cancel"
  | "email.modal.loading"
  | "system.resumeSent"
  | "system.error";

export const translations = {
  en: {
    "welcome.title": "[IDENTITY VERIFIED: ERHAN GUMUS]",
    "welcome.subtitle":
      "[SYSTEM_LOG]: Mainframe accessed successfully. Greetings. I am the neural bridge to Erhan's work. What information are you authorized to view?",
    "voice.speak": "SPEAK",
    "voice.stop": "STOP",
    "voice.listening": "LISTENING...",
    "voice.processing": "PROCESSING...",
    "chat.placeholder": "TYPE HERE...",
    "chat.send": "SEND",
    "chat.status": "STATUS",
    "chat.encrypted": "ENCRYPTED",
    "chat.remoteUser": "[REMOTE_USER]",
    "chat.systemArchive": "[SYSTEM_ARCHIVE]",
    "chat.signalInterrupted": "SIGNAL INTERRUPTED. RETRYING...",
    "context.whoAreYou": "+ WHO ARE YOU?",
    "context.hide": "× HIDE",
    "context.recruiterMode": "RECRUITER MODE",
    "context.visitorMode": "VISITOR MODE",
    "context.set": "CONTEXT SET",
    "context.techFocus": "TECH FOCUS",
    "context.custom": "CUSTOM",
    "context.networkActivity": "NETWORK_ACTIVITY",
    "context.jobDetails": "JOB_DETAILS",
    "context.anythingElse": "ANYTHING_ELSE",
    "context.resetContext": "RESET_CONTEXT",
    "project.terminate": "[TERMINATE]",
    "project.downloadSrc": "DOWNLOAD_SRC",
    "project.initializeDemo": "INITIALIZE_DEMO",
    "project.watchDemo": "WATCH_DEMO",
    "project.dataPacket": "DECIPHERED_DATA_PACKET",
    "project.assignment": "ASSIGNMENT",
    "project.briefing": "INTELLIGENCE_BRIEFING",
    "project.techStack": "LOGIC_GATE_STACK",
    "project.impact": "FIELD_IMPACT",
    "project.sourceCode": "KERNEL_SOURCE_PARTIAL",
    "email.modal.title": "[RESUME_REQUEST]",
    "email.modal.name": "YOUR_NAME (Optional)",
    "email.modal.email": "RECIPIENT_EMAIL",
    "email.modal.send": "SEND_RESUME",
    "email.modal.cancel": "CANCEL",
    "email.modal.loading": "TRANSMITTING...",
    "system.resumeSent":
      "[RESUME_SENT]: Resume delivered to {email}. Check your inbox.",
    "system.error": "[ERROR]: {message}",
  },
  tr: {
    "welcome.title": "[KİMLİK DOĞRULANDI: ERHAN GÜMÜŞ]",
    "welcome.subtitle":
      "[SİSTEM_KAYDI]: Ana sistem başarıyla erişildi. Selamlar. Ben Erhan'ın çalışmalarına giden sinir köprüsüyüm. Hangi bilgilere yetkiniz var?",
    "voice.speak": "KONUŞ",
    "voice.stop": "DUR",
    "voice.listening": "DİNLİYOR...",
    "voice.processing": "İŞLENİYOR...",
    "chat.placeholder": "BURAYA YAZ...",
    "chat.send": "GÖNDER",
    "chat.status": "DURUM",
    "chat.encrypted": "ŞİFRELİ",
    "chat.remoteUser": "[UZAK_KULLANICI]",
    "chat.systemArchive": "[SİSTEM_ARŞİVİ]",
    "chat.signalInterrupted": "SİNYAL KESİLDİ. YENİDEN DENENİYOR...",
    "context.whoAreYou": "+ KİM SİNİZ?",
    "context.hide": "× GİZLE",
    "context.recruiterMode": "İŞVEREN MODU",
    "context.visitorMode": "ZİYARETÇİ MODU",
    "context.set": "BAĞLAM AYARLANDI",
    "context.techFocus": "TEKNOLOJİ ODAĞI",
    "context.custom": "ÖZEL",
    "context.networkActivity": "AĞ_AKTİVİTESİ",
    "context.jobDetails": "İŞ_DETAYLARI",
    "context.anythingElse": "BAŞKA_BİRŞEY",
    "context.resetContext": "BAĞLAMI_SIFIRLA",
    "project.terminate": "[SONLANDIR]",
    "project.downloadSrc": "KAYNAK_İNDİR",
    "project.initializeDemo": "DEMO_BAŞLAT",
    "project.watchDemo": "DEMO_İZLE",
    "project.dataPacket": "ŞİFRESİ_ÇÖZÜLMÜŞ_VERİ_PAKETİ",
    "project.assignment": "GÖREV",
    "project.briefing": "İSTİHBARAT_BRİFİNGİ",
    "project.techStack": "TEKNOLOJİ_YIĞINI",
    "project.impact": "ETKİ_ALANI",
    "project.sourceCode": "KAYNAK_KOD_PARÇASI",
    "email.modal.title": "[ÖZGEÇMİŞ_İSTEĞİ]",
    "email.modal.name": "ADINIZ (İsteğe Bağlı)",
    "email.modal.email": "ALICI_E_POSTA",
    "email.modal.send": "ÖZGEÇMİŞ_GÖNDER",
    "email.modal.cancel": "İPTAL",
    "email.modal.loading": "İLETİLİYOR...",
    "system.resumeSent":
      "[ÖZGEÇMİŞ_GÖNDERİLDİ]: Özgeçmiş {email} adresine iletildi. Gelen kutunuzu kontrol edin.",
    "system.error": "[HATA]: {message}",
  },
};

export function t(
  key: TranslationKey,
  lang: "en" | "tr" = "en",
  params?: Record<string, string>
): string {
  const translation = translations[lang][key] || translations.en[key] || key;

  if (params) {
    return Object.entries(params).reduce(
      (str, [paramKey, value]) => str.replace(`{${paramKey}}`, value),
      translation
    );
  }

  return translation;
}
