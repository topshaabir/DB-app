import { Medal, RefreshCw, Search, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingState } from '../components/LoadingState';
import { StateMessage } from '../components/StateMessage';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { languageLocale, usePreferences } from '../services/preferences';
import { topicTitle } from '../services/topicTitle';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();
}



export function LeaderboardPage() {
  const { t, language } = usePreferences();
  const number = new Intl.NumberFormat(languageLocale(language));
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
          <span className="eyebrow">{t('community')}</span>
          <h1>{t('leaderboard')}</h1>
        </div>
        <button className="icon-button" type="button" title={t('refreshLeaderboard')} aria-label={t('refreshLeaderboard')} disabled={loading} onClick={() => setRefresh(value => value + 1)}>
          <RefreshCw size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="leaderboard-toolbar">
        <div className="period-tabs" role="group" aria-label={t('rankingPeriod')}>
          {[['all', t('allTime')], ['week', t('lastWeek')]].map(([value, label]) => (
            <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>
          ))}
        </div>
        <label className="field leaderboard-topic">
          <span className="sr-only">{t('filterTopic')}</span>
          <select value={topicId} disabled={loadingTopics || !!topicsError} onChange={event => setTopicId(event.target.value)}>
            <option value="">{t('allTests')}</option>
            {topics?.map(topic => <option key={topic.id} value={topic.id}>{topicTitle(topic, language)}</option>)}
          </select>
        </label>
      </div>
      {topicsError ? <StateMessage title={t('filtersUnavailable')} message={topicsError} /> : null}
      {loading ? <LoadingState fullScreen={false} /> : error ? <StateMessage title={t('leaderboardError')} message={error} /> : data ? (
        <>
          <div className="leaderboard-totals">
            <span><Users size={17} aria-hidden="true" /> <strong>{number.format(data.totalPlayers)}</strong> {t('learners')}</span>
            <span><Trophy size={17} aria-hidden="true" /> <strong>{number.format(data.totalTests)}</strong> {t('completedTests')}</span>
          </div>
          {data.entries.length === 0 ? (
            <div className="leaderboard-empty">
              <img src="/images/fluffy-logo-transparent.png" alt="" width={100} height={100} />
              <h2>{t('noResults')}</h2>
              <Link className="text-link" to="/test">{t('takeTest')}</Link>
            </div>
          ) : (
            <>
              <div className="leaderboard-podium">
                {data.entries.slice(0, 3).map(entry => (
                  <article className={`podium-player place-${entry.rank}`} key={entry.userName}>
                    <div className="podium-rank"><Medal size={19} aria-hidden="true" /> #{entry.rank}</div>
                    <div className="player-avatar" aria-hidden="true">{initials(entry.userName)}</div>
                    <h2 title={entry.userName}>{entry.userName}</h2>
                    <strong className="podium-points">{number.format(entry.points)} <span>{t('points')}</span></strong>
                    <span className="podium-accuracy">{entry.accuracy}% {t('accuracy')}</span>
                  </article>
                ))}
              </div>
              <section className="leaderboard-results" aria-label={t('rankings')}>
                <div className="leaderboard-table-heading">
                  <h2>{data.totalPlayers > 100 ? t('topHundred') : t('rankings')}</h2>
                  <label className="leaderboard-search">
                    <Search size={18} aria-hidden="true" />
                    <input type="search" aria-label={t('searchLearners')} placeholder={t('searchLearners')} value={search} onChange={event => setSearch(event.target.value)} />
                  </label>
                </div>
                {entries.length === 0 ? <StateMessage title={t('noLearners')} /> : (
                  <div className="leaderboard-table-wrap">
                    <table className="leaderboard-table">
                      <thead><tr><th scope="col">{t('rank')}</th><th scope="col">{t('learner')}</th><th scope="col">{t('points')}</th><th scope="col">{t('accuracy')}</th><th scope="col">{t('tests')}</th></tr></thead>
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
