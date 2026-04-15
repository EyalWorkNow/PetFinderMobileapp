import { useSettings } from "../context/SettingsContext";
import { translations, TranslationKey, Language } from "./translations";

export function useTranslation() {
    const { language } = useSettings();

    const currentLang = (language as Language) || "Hebrew";
    const dict = translations[currentLang];

    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
        let text = (dict as Record<string, string>)[key] || translations.English[key] || (key as string);
        if (params) {
            Object.keys(params).forEach(p => {
                text = text.replace(`{{${p}}}`, params[p].toString());
            });
        }
        return text;
    };

    const isRTL = currentLang === "Hebrew" || currentLang === "Arabic";

    return { t, isRTL, language: currentLang };
}
