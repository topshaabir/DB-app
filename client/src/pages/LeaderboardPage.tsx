import { Trophy } from 'lucide-react';

export function LeaderboardPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Future-ready</span>
          <h1>Leaderboard</h1>
          <p>The database already stores score, percentage, name, scope, and completion time for a future leaderboard.</p>
        </div>
      </header>
      <section className="empty-feature">
        <Trophy size={42} aria-hidden="true" />
        <strong>Leaderboard is planned for the next phase.</strong>
      </section>
    </div>
  );
}
