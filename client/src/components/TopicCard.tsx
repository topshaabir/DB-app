import { BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePreferences } from '../services/preferences';
import type { TopicSummary } from '../types/api';
import { learningDescription, topicTitle } from '../services/topicTitle';

type TopicCardProps = {
  topic: TopicSummary;
  description?: string | null;
};

export function TopicCard({ topic, description }: TopicCardProps) {
  const { language } = usePreferences();
  return (
    <Link className="topic-card" to={`/topics/${topic.id}`}>
      <div className="topic-icon" aria-hidden="true">
        <BookOpen size={24} />
      </div>
      <div className="topic-card-body">
        <strong>{topicTitle(topic, language)}</strong>
        {description || topic.description ? <span>{learningDescription(description || topic.description, language)}</span> : null}
      </div>
      <ChevronRight className="topic-bookmark" size={21} aria-hidden="true" />
    </Link>
  );
}
