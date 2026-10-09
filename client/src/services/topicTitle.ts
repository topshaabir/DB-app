import type { TopicSummary } from '../types/api';

export function topicTitle(topic: TopicSummary) {
  return topic.title.toLowerCase() === 'vocabulary' ? topic.chapterTitle : topic.title;
}
