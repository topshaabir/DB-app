import { Moon, Sun } from 'lucide-react';
import { languageOptions, usePreferences } from '../services/preferences';

export function AppControls() {
  const { language, setLanguage, theme, setTheme, t } = usePreferences();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className="app-controls" aria-label={t('preferences')}>
      <label className="language-select">
        <span className="sr-only">{t('language')}</span>
        <select value={language} onChange={event => setLanguage(event.target.value as typeof language)}>
          {languageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.flag} {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="theme-toggle"
        aria-label={nextTheme === 'dark' ? t('darkMode') : t('lightMode')}
        title={nextTheme === 'dark' ? t('darkMode') : t('lightMode')}
        onClick={() => setTheme(nextTheme)}
      >
        {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
