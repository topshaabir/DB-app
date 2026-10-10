import { learningDescription, learningTitle } from '../services/topicTitle';
import { usePreferences } from '../services/preferences';
import type { ChapterSummary } from '../types/api';
import { TopicCard } from './TopicCard';

type ChapterCardProps = {
  chapter: ChapterSummary;
};

export function ChapterCard({ chapter }: ChapterCardProps) {
  const { t, language } = usePreferences();
  if (chapter.topics.length === 1 && chapter.topics[0].title.toLowerCase() === 'vocabulary') {
    return <TopicCard topic={chapter.topics[0]} description={learningDescription(chapter.description, language)} />;
  }
  return (
    <section className="chapter-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t('chapter')} {chapter.orderIndex}</span>
          <h2>{learningTitle(chapter.title, language)}</h2>
          <p>{learningDescription(chapter.description, language)}</p>
        </div>
        <div className="chapter-count">{chapter.topics.length} {t('topics')}</div>
      </div>
      <div className="topic-list">
        {chapter.topics.length === 0 ? <span className="topic-empty">{t('comingSoon')}</span> : null}
        {chapter.topics.map(topic => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </section>
  );
}
