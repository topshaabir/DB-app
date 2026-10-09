import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { StateMessage } from '../components/StateMessage';
import { LoadingState } from '../components/LoadingState';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { topicTitle } from '../services/topicTitle';

export function TopicDetailPage() {
  const { id } = useParams();
  const topicId = Number(id);
  const { data: topic, loading, error } = useAsync(() => api.getTopic(topicId), [topicId]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !topic) {
    return <StateMessage title="Topic not found" message={error ?? 'The requested topic is unavailable.'} />;
  }

  return (
    <div className="page-stack">
      <Link to="/topics" className="text-link">
        <ArrowLeft size={18} />
        Back to topics
      </Link>

      <header className="topic-detail-header">
        <div className="topic-icon large" aria-hidden="true">
          <BookOpen size={32} />
        </div>
        <div>
          {topic.title.toLowerCase() !== 'vocabulary' ? <span className="eyebrow">{topic.chapterTitle}</span> : null}
          <h1>{topicTitle(topic)}</h1>
          <p>{topic.description}</p>
        </div>
      </header>

      <section className="content-section">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Vocabulary</span>
            <h2>Words for this topic</h2>
          </div>
        </div>
        <div className="vocabulary-grid">
          {topic.vocabulary.map(word => (
            <article className="vocabulary-card" key={word.id}>
              <div>
                <strong>{word.word}</strong>
                {word.partOfSpeech ? <span>{word.partOfSpeech}</span> : null}
              </div>
              <p>{word.translation}</p>
              <small>{word.exampleSentence}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
