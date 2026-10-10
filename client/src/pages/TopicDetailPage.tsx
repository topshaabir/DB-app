import { ArrowLeft, BookOpen, Volume2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { StateMessage } from '../components/StateMessage';
import { LoadingState } from '../components/LoadingState';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { usePreferences } from '../services/preferences';
import { topicTitle } from '../services/topicTitle';

export function TopicDetailPage() {
  const { id } = useParams();
  const topicId = Number(id);
  const { language, t } = usePreferences();
  const { data: topic, loading, error } = useAsync(() => api.getTopic(topicId, language), [topicId, language]);

  function speak(word: string) {
    if (!('speechSynthesis' in window)) {
      globalThis.alert(t('speechUnavailable'));
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    const voice = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith('en'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !topic) {
    return <StateMessage title={t('topicNotFound')} message={error ?? t('topicUnavailable')} />;
  }

  return (
    <div className="page-stack">
      <Link to="/topics" className="text-link">
        <ArrowLeft size={18} />
        {t('backToTopics')}
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
            <h2>{t('wordsForTopic')}</h2>
          </div>
        </div>
        <div className="vocabulary-grid">
          {topic.vocabulary.map(word => (
            <article className="vocabulary-card" key={word.id}>
              <div className="vocabulary-card-head">
                <div>
                  <strong>{word.word}</strong>
                  {word.ipa ? <span className="ipa">{word.ipa}</span> : null}
                </div>
                <button type="button" className="icon-button" onClick={() => speak(word.word)} aria-label={`${t('listen')} ${word.word}`} title={t('listen')}>
                  <Volume2 size={18} aria-hidden="true" />
                </button>
              </div>
              {word.partOfSpeech ? <span className="part-of-speech">{word.partOfSpeech}</span> : null}
              <p>{word.translation}</p>
              {word.exampleSentence ? (
                <small>
                  <b>{t('example')}:</b> {word.exampleSentence}
                  {word.exampleTranslation ? <span>{word.exampleTranslation}</span> : null}
                </small>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
