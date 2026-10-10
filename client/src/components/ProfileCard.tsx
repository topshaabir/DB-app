import { usePreferences } from '../services/preferences';
import type { ProfileStats } from '../types/api';

type ProfileCardProps = {
  profile: ProfileStats;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  const { t } = usePreferences();
  return (
    <section className="profile-card">
      <div>
        <span className="eyebrow">{t('profile')}</span>
        <h2>{profile.userName}</h2>
      </div>
      <div className="stats-grid">
        <div>
          <span>{t('completedTests')}</span>
          <strong>{profile.completedTests}</strong>
        </div>
        <div>
          <span>{t('bestScore')}</span>
          <strong>{profile.bestScore}</strong>
        </div>
        <div>
          <span>{t('averageScore')}</span>
          <strong>{profile.averageScore}</strong>
        </div>
        <div>
          <span>{t('averagePercent')}</span>
          <strong>{profile.averagePercentage}%</strong>
        </div>
        <div>
          <span>{t('learnedTopics')}</span>
          <strong>{profile.totalLearnedTopics}</strong>
        </div>
      </div>
    </section>
  );
}
