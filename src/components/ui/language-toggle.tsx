import { useState, useEffect } from 'react';
import { Button } from './button';
import { Globe } from 'lucide-react';
import { Lang, getPreferredLanguage, setPreferredLanguage, t } from '@/lib/i18n';

export function LanguageToggle() {
  const [currentLang, setCurrentLang] = useState<Lang>('en');

  useEffect(() => {
    setCurrentLang(getPreferredLanguage());
  }, []);

  const toggleLanguage = () => {
    const newLang: Lang = currentLang === 'en' ? 'es' : 'en';
    setCurrentLang(newLang);
    setPreferredLanguage(newLang);
    // Force a page refresh to update all text
    window.location.reload();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      aria-label={t('language', currentLang)}
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline">
        {currentLang === 'en' ? t('spanish', currentLang) : t('english', currentLang)}
      </span>
      <span className="sm:hidden">
        {currentLang === 'en' ? 'ES' : 'EN'}
      </span>
    </Button>
  );
}