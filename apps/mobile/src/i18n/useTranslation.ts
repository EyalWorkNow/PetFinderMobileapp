import { useSettings } from "../context/SettingsContext";
import { translations, TranslationKey, Language } from "./translations";

export function useTranslation() {
    const { language } = useSettings();

    const currentLang = (language as Language) || "Hebrew";
    const dict = translations[currentLang];

    const t = (key: TranslationKey): string => {
        return dict[key] || translations.English[key] || key;
    };

    const isRTL = currentLang === "Hebrew" || currentLang === "Arabic";

    return { t, isRTL, language: currentLang };
}
