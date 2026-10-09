import { Medal, RefreshCw, Search, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingState } from '../components/LoadingState';
import { StateMessage } from '../components/StateMessage';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { topicTitle } from '../services/topicTitle';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();
}

const number = new Intl.NumberFormat('en');

export function LeaderboardPage() {
  const [period, setPeriod] = useState('all');
  const [topicId, setTopicId] = useState('');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const { data, loading, error } = useAsync(() => api.getLeaderboard(period, topicId ? Number(topicId) : undefined), [period, topicId, refresh]);
  const { data: topics, loading: loadingTopics, error: topicsError } = useAsync(api.getTopics, []);
  const entries = data?.entries.filter(entry => entry.userName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) ?? [];

  return (
    <div className="page-stack leaderboard-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Fluffy community</span>
          <h1>Leaderboard</h1>
        </div>
        <button className="icon-button" type="button" title="Refresh leaderboard" aria-label="Refresh leaderboard" disabled={loading} onClick={() => setRefresh(value => value + 1)}>
          <RefreshCw size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="leaderboard-toolbar">
        <div className="period-tabs" role="group" aria-label="Ranking period">
          {[['all', 'All time'], ['week', 'Last 7 days']].map(([value, label]) => (
            <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>
          ))}
        </div>
        <label className="field leaderboard-topic">
          <span className="sr-only">Filter by topic</span>
          <select value={topicId} disabled={loadingTopics || !!topicsError} onChange={event => setTopicId(event.target.value)}>
            <option value="">All tests</option>
            {topics?.map(topic => <option key={topic.id} value={topic.id}>{topicTitle(topic)}</option>)}
          </select>
        </label>
      </div>
      {topicsError ? <StateMessage title="Topic filters are unavailable" message={topicsError} /> : null}
      {loading ? <LoadingState fullScreen={false} /> : error ? <StateMessage title="Could not load leaderboard" message={error} /> : data ? (
        <>
          <div className="leaderboard-totals">
            <span><Users size={17} aria-hidden="true" /> <strong>{number.format(data.totalPlayers)}</strong> learners</span>
            <span><Trophy size={17} aria-hidden="true" /> <strong>{number.format(data.totalTests)}</strong> completed tests</span>
          </div>
          {data.entries.length === 0 ? (
            <div className="leaderboard-empty">
              <img src="/images/fluffy-loading.png" alt="" width={100} height={100} />
              <h2>No results yet</h2>
              <Link className="text-link" to="/test">Take a test</Link>
            </div>
          ) : (
            <>
              <div className="leaderboard-podium">
                {data.entries.slice(0, 3).map(entry => (
                  <article className={`podium-player place-${entry.rank}`} key={entry.userName}>
                    <div className="podium-rank"><Medal size={19} aria-hidden="true" /> #{entry.rank}</div>
                    <div className="player-avatar" aria-hidden="true">{initials(entry.userName)}</div>
                    <h2 title={entry.userName}>{entry.userName}</h2>
                    <strong className="podium-points">{number.format(entry.points)} <span>points</span></strong>
                    <span className="podium-accuracy">{entry.accuracy}% accuracy</span>
                  </article>
                ))}
              </div>
              <section className="leaderboard-results" aria-label="Rankings">
                <div className="leaderboard-table-heading">
                  <h2>{data.totalPlayers > 100 ? 'Top 100' : 'Rankings'}</h2>
                  <label className="leaderboard-search">
                    <Search size={18} aria-hidden="true" />
                    <input type="search" aria-label="Search ranked learners" placeholder="Search learners" value={search} onChange={event => setSearch(event.target.value)} />
                  </label>
                </div>
                {entries.length === 0 ? <StateMessage title="No matching learners" /> : (
                  <div className="leaderboard-table-wrap">
                    <table className="leaderboard-table">
                      <thead><tr><th scope="col">Rank</th><th scope="col">Learner</th><th scope="col">Points</th><th scope="col">Accuracy</th><th scope="col">Tests</th></tr></thead>
                      <tbody>{entries.map(entry => (
                        <tr key={entry.userName}>
                          <td className="rank-cell">{entry.rank <= 3 ? <Medal size={17} aria-hidden="true" /> : null}{entry.rank}</td>
                          <th scope="row"><div className="ranked-player"><span className="player-avatar small" aria-hidden="true">{initials(entry.userName)}</span><span>{entry.userName}</span></div></th>
                          <td className="points-cell">{number.format(entry.points)}</td>
                          <td>{entry.accuracy}%</td>
                          <td>{number.format(entry.completedTests)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
