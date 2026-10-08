import type { ChapterSummary } from '../types/api';
import { ProgressBar } from './ProgressBar';
import { TopicCard } from './TopicCard';

type ChapterCardProps = {
  chapter: ChapterSummary;
};

export function ChapterCard({ chapter }: ChapterCardProps) {
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
      <ProgressBar value={chapter.topics.length ? 25 : 0} label="Foundation progress" />
      <div className="topic-list">
        {chapter.topics.map(topic => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </section>
  );
}
