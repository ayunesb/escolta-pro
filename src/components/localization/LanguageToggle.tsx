import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export type Language = 'es' | 'en';

interface LanguageToggleProps {
  onLanguageChange?: (language: Language) => void;
}

export const LanguageToggle = ({ onLanguageChange }: LanguageToggleProps) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('app-language');
    return (stored as Language) || 'es';
  });

  const languages = {
    es: { name: 'Español', flag: '🇲🇽' },
    en: { name: 'English', flag: '🇺🇸' }
  };

  useEffect(() => {
    localStorage.setItem('app-language', currentLanguage);
    document.documentElement.lang = currentLanguage;
    onLanguageChange?.(currentLanguage);
  }, [currentLanguage, onLanguageChange]);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {languages[currentLanguage].flag} {languages[currentLanguage].name}
          </span>
          <span className="sm:hidden">
            {languages[currentLanguage].flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className={`gap-2 ${currentLanguage === code ? 'bg-accent' : ''}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};