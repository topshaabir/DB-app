import { Bookmark, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TopicSummary } from '../types/api';

type TopicCardProps = {
  topic: TopicSummary;
};

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <Link className="topic-card" to={`/topics/${topic.id}`}>
      <div className="topic-icon" aria-hidden="true">
        <Plane size={24} />
      </div>
      <div className="topic-card-body">
        <strong>{topic.title}</strong>
        <span>{topic.description}</span>
      </div>
      <Bookmark className="topic-bookmark" size={21} aria-hidden="true" />
    </Link>
  );
}
