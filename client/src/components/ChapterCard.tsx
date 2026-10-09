import type { ChapterSummary } from '../types/api';
import { TopicCard } from './TopicCard';

type ChapterCardProps = {
  chapter: ChapterSummary;
};

export function ChapterCard({ chapter }: ChapterCardProps) {
  if (chapter.topics.length === 1 && chapter.topics[0].title.toLowerCase() === 'vocabulary') {
    return <TopicCard topic={chapter.topics[0]} description={chapter.description} />;
  }
  return (
    <section className="chapter-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Chapter {chapter.orderIndex}</span>
          <h2>{chapter.title}</h2>
          <p>{chapter.description}</p>
        </div>
        <div className="chapter-count">{chapter.topics.length} topics</div>
      </div>
      <div className="topic-list">
        {chapter.topics.length === 0 ? <span className="topic-empty">Coming soon</span> : null}
        {chapter.topics.map(topic => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </section>
  );
}
