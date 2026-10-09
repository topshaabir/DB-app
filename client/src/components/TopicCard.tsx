import { BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TopicSummary } from '../types/api';
import { topicTitle } from '../services/topicTitle';

type TopicCardProps = {
  topic: TopicSummary;
  description?: string | null;
};

export function TopicCard({ topic, description }: TopicCardProps) {
  return (
    <Link className="topic-card" to={`/topics/${topic.id}`}>
      <div className="topic-icon" aria-hidden="true">
        <BookOpen size={24} />
      </div>
      <div className="topic-card-body">
        <strong>{topicTitle(topic)}</strong>
        {description || topic.description ? <span>{description || topic.description}</span> : null}
      </div>
      <ChevronRight className="topic-bookmark" size={21} aria-hidden="true" />
    </Link>
  );
}
