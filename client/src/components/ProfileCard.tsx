import type { ProfileStats } from '../types/api';

type ProfileCardProps = {
  profile: ProfileStats;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <section className="profile-card">
      <div>
        <span className="eyebrow">Profile</span>
        <h2>{profile.userName}</h2>
      </div>
      <div className="stats-grid">
        <div>
          <span>Completed tests</span>
          <strong>{profile.completedTests}</strong>
        </div>
        <div>
          <span>Best score</span>
          <strong>{profile.bestScore}</strong>
        </div>
        <div>
          <span>Average score</span>
          <strong>{profile.averageScore}</strong>
        </div>
        <div>
          <span>Average percent</span>
          <strong>{profile.averagePercentage}%</strong>
        </div>
        <div>
          <span>Learned topics</span>
          <strong>{profile.totalLearnedTopics}</strong>
        </div>
      </div>
    </section>
  );
}
