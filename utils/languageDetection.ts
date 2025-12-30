/**
 * Advanced Turkish/English Language Detection
 * Uses comprehensive local heuristics for fast, accurate detection
 */

export type Language = "en" | "tr";

// Turkish-specific characters (most reliable indicator)
const TURKISH_CHARS = /[ğĞüÜşŞıİöÖçÇ]/;

// Turkish dotless i - critical character
const TURKISH_DOTLESS_I = /[ıİ]/;

// Common Turkish words and phrases (comprehensive list)
const TURKISH_WORDS = new Set([
  // Greetings
  "merhaba",
  "selam",
  "selamlar",
  "günaydın",
  "iyi",
  "günler",
  "akşamlar",
  "geceler",
  "hoşgeldin",
  "hoşgeldiniz",
  "hoşçakal",
  "görüşürüz",
  "bay",
  "bayan",
  // Pronouns
  "ben",
  "sen",
  "o",
  "biz",
  "siz",
  "onlar",
  "beni",
  "seni",
  "onu",
  "bizi",
  "sizi",
  "onları",
  "bana",
  "sana",
  "ona",
  "bize",
  "size",
  "onlara",
  "benim",
  "senin",
  "onun",
  "bizim",
  "sizin",
  "onların",
  // Question words
  "ne",
  "nedir",
  "neden",
  "niçin",
  "niye",
  "nasıl",
  "nasılsın",
  "nasılsınız",
  "nerede",
  "nereden",
  "nereye",
  "neresi",
  "kim",
  "kimi",
  "kime",
  "kimin",
  "hangi",
  "hangisi",
  "kaç",
  "kaçtane",
  // Common verbs (infinitive forms)
  "yapmak",
  "etmek",
  "olmak",
  "gitmek",
  "gelmek",
  "almak",
  "vermek",
  "görmek",
  "bakmak",
  "bilmek",
  "istemek",
  "sevmek",
  "söylemek",
  "demek",
  "düşünmek",
  "anlamak",
  "beklemek",
  "bulmak",
  "çalışmak",
  "kullanmak",
  "başlamak",
  "bitirmek",
  "yardım",
  // Common conjugated verbs
  "yapıyorum",
  "ediyorum",
  "gidiyorum",
  "geliyorum",
  "istiyorum",
  "biliyorum",
  "anlıyorum",
  "yapabilir",
  "edebilir",
  "gidebilir",
  "görebilir",
  "söyleyebilir",
  "yardımcı",
  "yaptım",
  "ettim",
  "gittim",
  "geldim",
  "aldım",
  "verdim",
  "gördüm",
  "söyledim",
  "yapacak",
  "edecek",
  "gidecek",
  "gelecek",
  "alacak",
  "verecek",
  "görecek",
  // Articles, conjunctions, prepositions
  "bir",
  "bu",
  "şu",
  "o",
  "ve",
  "veya",
  "ya",
  "ile",
  "için",
  "gibi",
  "kadar",
  "daha",
  "çok",
  "az",
  "en",
  "de",
  "da",
  "ki",
  "ama",
  "fakat",
  "ancak",
  "çünkü",
  "eğer",
  "ise",
  // Numbers
  "sıfır",
  "bir",
  "iki",
  "üç",
  "dört",
  "beş",
  "altı",
  "yedi",
  "sekiz",
  "dokuz",
  "on",
  "yirmi",
  "otuz",
  "kırk",
  "elli",
  "altmış",
  "yetmiş",
  "seksen",
  "doksan",
  "yüz",
  "bin",
  // Common responses
  "evet",
  "hayır",
  "tamam",
  "peki",
  "olur",
  "olmaz",
  "belki",
  "tabii",
  "elbette",
  "tabi",
  "lütfen",
  "teşekkür",
  "teşekkürler",
  "sağol",
  "sağolun",
  "rica",
  "ederim",
  "özür",
  "dilerim",
  "pardon",
  // Common nouns
  "ev",
  "iş",
  "zaman",
  "gün",
  "ay",
  "yıl",
  "hafta",
  "saat",
  "dakika",
  "şey",
  "yer",
  "kişi",
  "insan",
  "adam",
  "kadın",
  "çocuk",
  "arkadaş",
  "aile",
  "anne",
  "baba",
  // Tech-related
  "proje",
  "projeler",
  "sistem",
  "uygulama",
  "site",
  "sayfa",
  "yazılım",
  "geliştirici",
  "göster",
  "gösterir",
  "anlat",
  "anlatır",
  "açıkla",
  "yap",
  "oluştur",
  // Adjectives
  "güzel",
  "iyi",
  "kötü",
  "büyük",
  "küçük",
  "yeni",
  "eski",
  "uzun",
  "kısa",
  // State words
  "var",
  "yok",
  "lazım",
  "gerek",
  "şart",
  // Adverbs
  "şimdi",
  "sonra",
  "önce",
  "bugün",
  "yarın",
  "dün",
  "hep",
  "hiç",
  "bazen",
  "her",
  "zaman",
]);

// Short Turkish words that are strong indicators
const SHORT_TURKISH_WORDS = new Set([
  "ne",
  "bu",
  "şu",
  "ve",
  "de",
  "da",
  "ki",
  "mi",
  "mı",
  "mu",
  "mü",
  "bir",
  "iki",
  "üç",
  "var",
  "yok",
  "iyi",
  "çok",
  "az",
]);

// Turkish grammar patterns (suffixes, endings)
const TURKISH_SUFFIX_PATTERNS = [
  /\b\w+(lar|ler)\b/i,
  /\b\w+(mak|mek)\b/i,
  /\b\w+(ıyor|iyor|uyor|üyor)\b/i,
  /\b\w+(dı|di|du|dü|tı|ti|tu|tü)\b/i,
  /\b\w+(acak|ecek)\b/i,
  /\b\w*(mı|mi|mu|mü)\b/i,
  /\b\w+(abil|ebil)\b/i,
];

// Common English words
const ENGLISH_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "can",
  "may",
  "might",
  "must",
  "shall",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "its",
  "our",
  "their",
  "what",
  "which",
  "who",
  "whom",
  "where",
  "when",
  "why",
  "how",
  "if",
  "then",
  "else",
  "so",
  "because",
  "and",
  "or",
  "but",
  "not",
  "no",
  "yes",
  "hello",
  "hi",
  "hey",
  "thanks",
  "thank",
  "please",
  "sorry",
  "okay",
  "ok",
  "good",
  "great",
  "nice",
  "bad",
  "from",
  "to",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "about",
  "into",
  "show",
  "tell",
  "help",
  "need",
  "want",
  "like",
  "know",
  "think",
  "see",
  "project",
  "projects",
  "portfolio",
  "experience",
  "work",
  "job",
]);

/**
 * Local language detection (synchronous fallback)
 */
export function detectLanguageLocal(text: string): Language {
  if (!text || text.trim().length === 0) return "en";

  const trimmed = text.trim();
  const lowerText = trimmed.toLowerCase();
  const words = lowerText.split(/\s+/).filter((w) => w.length > 0);

  if (trimmed.length < 2) return "en";

  let turkishScore = 0;
  let englishScore = 0;

  // Turkish-specific characters (definitive)
  if (TURKISH_CHARS.test(text)) turkishScore += 15;
  if (TURKISH_DOTLESS_I.test(text)) turkishScore += 10;

  // Turkish words
  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:'"()]/g, "");
    if (TURKISH_WORDS.has(cleanWord)) turkishScore += 4;
    if (SHORT_TURKISH_WORDS.has(cleanWord)) turkishScore += 2;
    if (ENGLISH_WORDS.has(cleanWord)) englishScore += 2;
  }

  // Turkish patterns
  for (const pattern of TURKISH_SUFFIX_PATTERNS) {
    if (pattern.test(text)) turkishScore += 3;
  }

  if (turkishScore > englishScore && turkishScore >= 3) return "tr";
  if (TURKISH_CHARS.test(text) && turkishScore >= englishScore) return "tr";

  return "en";
}

/**
 * Synchronous detection (for backward compatibility)
 * Uses local detection - for async with AI, use detectLanguageWithAI
 */
export function detectLanguage(text: string): Language {
  return detectLanguageLocal(text);
}

/**
 * Detects language from multiple text samples
 */
export function detectLanguageFromSamples(texts: string[]): Language {
  if (texts.length === 0) return "en";
  const detections = texts.map(detectLanguageLocal);
  const turkishCount = detections.filter((lang) => lang === "tr").length;
  return turkishCount > texts.length / 2 ? "tr" : "en";
}
