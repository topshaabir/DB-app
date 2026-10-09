import { ChapterCard } from '../components/ChapterCard';
import { LoadingState } from '../components/LoadingState';
import { StateMessage } from '../components/StateMessage';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';

export function TopicsPage() {
  const { data: chapters, loading, error } = useAsync(api.getChapters, []);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Fluffy</span>
          <h1>Өтілген тақырыптар</h1>
          <p>Review studied English topics, vocabulary, and examples from your learning chapters.</p>
        </div>
      </header>

      {loading ? <LoadingState /> : null}
      {error ? <StateMessage title="Could not load topics" message={error} /> : null}
      {chapters?.map(chapter => (
        <ChapterCard key={chapter.id} chapter={chapter} />
      ))}
    </div>
  );
}
