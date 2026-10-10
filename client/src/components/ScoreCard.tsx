import { usePreferences } from '../services/preferences';
import type { TestResult } from '../types/api';

type ScoreCardProps = {
  result: TestResult;
};

export function ScoreCard({ result }: ScoreCardProps) {
  const { t } = usePreferences();
  return (
    <section className="score-card">
      <span className="eyebrow">{t('savedResult')}</span>
      <h2>{result.percentage}%</h2>
      <p>
        {result.userName}: {t('correctAnswers')} {result.score}/{result.totalQuestions}.
      </p>
      <div className="score-grid">
        <span>{t('userName')}</span>
        <strong>{result.userName}</strong>
        <span>{t('scope')}</span>
        <strong>{result.scopeLabel ?? t('selectedTest')}</strong>
        <span>{t('score')}</span>
        <strong>
          {result.score}/{result.totalQuestions}
        </strong>
      </div>
    </section>
  );
}
