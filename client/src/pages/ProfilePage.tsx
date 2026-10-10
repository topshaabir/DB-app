import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ProfileCard } from '../components/ProfileCard';
import { StateMessage } from '../components/StateMessage';
import { LoadingState } from '../components/LoadingState';
import { learningTitle } from '../services/topicTitle';
import { api } from '../services/api';
import { loadMistakeSets, stashRetryMistakes } from '../services/mistakes';
import { languageLocale, usePreferences } from '../services/preferences';
import type { ProfileStats } from '../types/api';

export function ProfilePage() {
  const { t, language } = usePreferences();
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    setError(null);
    if (!name.trim()) {
      setError(t('profileNameRequired'));
      return;
    }

    setLoading(true);
    try {
      setProfile(await api.getProfile(name));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profileError'));
    } finally {
      setLoading(false);
    }
  }

  const mistakeSets = loadMistakeSets(profile?.userName ?? name);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('yourProgress')}</span>
          <h1>{t('profile')}</h1>
          <p>{t('profileHint')}</p>
        </div>
      </header>

      <section className="form-panel">
        <label className="field">
          <span>{t('userName')}</span>
          <input value={name} onChange={event => setName(event.target.value)} placeholder={t('profilePlaceholder')} />
        </label>
        <Button type="button" onClick={loadProfile} disabled={loading}>
          {loading ? t('loading') : t('viewProfile')}
        </Button>
      </section>

      {loading ? <LoadingState /> : null}
      {error ? <StateMessage title={t('profileMessage')} message={error} /> : null}
      {profile ? (
        <>
          <ProfileCard profile={profile} />
          <section className="content-section">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">{t('recent')}</span>
                <h2>{t('savedResults')}</h2>
              </div>
            </div>
            <div className="results-list">
              {profile.recentResults.length === 0 ? (
                <StateMessage title={t('noResults')} message={t('completeTest')} />
              ) : (
                profile.recentResults.map(result => (
                  <article className="result-row" key={result.id}>
                    <div>
                      <strong>{result.scopeLabel ? learningTitle(result.scopeLabel, language) : t('selectedTest')}</strong>
                      <span>{new Date(result.completedAt).toLocaleDateString(languageLocale(language))}</span>
                    </div>
                    <b>{result.percentage}%</b>
                  </article>
                ))
              )}
            </div>
          </section>
          <section className="content-section">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">{t('mistakes')}</span>
                <h2>{t('savedMistakes')}</h2>
              </div>
            </div>
            <div className="results-list">
              {mistakeSets.length === 0 ? (
                <StateMessage title={t('noSavedMistakes')} />
              ) : (
                mistakeSets.slice(0, 6).map(set => (
                  <article className="result-row" key={set.id}>
                    <div>
                      <strong>{set.mistakes.length} {t('incorrectAnswers')}</strong>
                      <span>{new Date(set.createdAt).toLocaleDateString(languageLocale(language))}</span>
                    </div>
                    <Link className="button primary inline-button" to="/test" onClick={() => stashRetryMistakes(set)}>
                      {t('retryLater')}
                    </Link>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
