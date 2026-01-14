import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Language, detectLanguageLocal } from "../utils/languageDetection";
import { t, TranslationKey } from "../utils/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  detectAndSetLanguage: (text: string) => void;
  translate: (key: TranslationKey, params?: Record<string, string>) => string;
  showActivation: boolean;
  setShowActivation: (show: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [showActivation, setShowActivation] = useState(false);
  const [hasActivated, setHasActivated] = useState(false);

  const detectAndSetLanguage = useCallback(
    (text: string) => {
      if (!text || text.trim().length === 0) return;

      const detected = detectLanguageLocal(text);
      if (import.meta.env.DEV) {
        console.log("[Language Context] Detection result:", detected);
      }

      if (detected === "tr" && language === "en") {
        setLanguage("tr");
        if (!hasActivated) {
          setShowActivation(true);
          setHasActivated(true);
        }
      }
    },
    [language, hasActivated]
  );

  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string>) => {
      return t(key, language, params);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        detectAndSetLanguage,
        translate,
        showActivation,
        setShowActivation,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export { LanguageProvider, useLanguage };
