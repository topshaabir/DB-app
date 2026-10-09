import { useState } from 'react';
import { Button } from '../components/Button';
import { ProfileCard } from '../components/ProfileCard';
import { StateMessage } from '../components/StateMessage';
import { LoadingState } from '../components/LoadingState';
import { api } from '../services/api';
import type { ProfileStats } from '../types/api';

export function ProfilePage() {
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    setError(null);
    if (!name.trim()) {
      setError('Enter a name to view profile statistics.');
      return;
    }

    setLoading(true);
    try {
      setProfile(await api.getProfile(name));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Your progress</span>
          <h1>Profile</h1>
          <p>Look up saved test statistics by name. Authentication can be added later without changing this flow.</p>
        </div>
      </header>

      <section className="form-panel">
        <label className="field">
          <span>User name</span>
          <input value={name} onChange={event => setName(event.target.value)} placeholder="Name used in tests" />
        </label>
        <Button type="button" onClick={loadProfile} disabled={loading}>
          {loading ? 'Loading...' : 'View profile'}
        </Button>
      </section>

      {loading ? <LoadingState /> : null}
      {error ? <StateMessage title="Profile message" message={error} /> : null}
      {profile ? (
        <>
          <ProfileCard profile={profile} />
          <section className="content-section">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">Recent</span>
                <h2>Saved results</h2>
              </div>
            </div>
            <div className="results-list">
              {profile.recentResults.length === 0 ? (
                <StateMessage title="No test results yet" message="Complete a test to fill this profile." />
              ) : (
                profile.recentResults.map(result => (
                  <article className="result-row" key={result.id}>
                    <div>
                      <strong>{result.scopeLabel ?? 'Selected test'}</strong>
                      <span>{new Date(result.completedAt).toLocaleDateString()}</span>
                    </div>
                    <b>{result.percentage}%</b>
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
