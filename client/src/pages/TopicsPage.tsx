import { ChapterCard } from '../components/ChapterCard';
import { LoadingState } from '../components/LoadingState';
import { StateMessage } from '../components/StateMessage';
import { useAsync } from '../hooks/useAsync';
import { usePreferences } from '../services/preferences';
import { api } from '../services/api';

export function TopicsPage() {
  const { t } = usePreferences();
  const { data: chapters, loading, error } = useAsync(api.getChapters, []);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Fluffy</span>
          <h1>{t('studiedTopics')}</h1>
          <p>{t('topicsDescription')}</p>
        </div>
      </header>

      {loading ? <LoadingState /> : null}
      {error ? <StateMessage title={t('topicsError')} message={error} /> : null}
      {chapters?.map(chapter => (
        <ChapterCard key={chapter.id} chapter={chapter} />
      ))}
    </div>
  );
}
