import type { TestResult } from '../types/api';

type ScoreCardProps = {
  result: TestResult;
};

export function ScoreCard({ result }: ScoreCardProps) {
  return (
    <section className="score-card">
      <span className="eyebrow">Saved result</span>
      <h2>{result.percentage}%</h2>
      <p>
        {result.userName}, you answered {result.score} of {result.totalQuestions} questions correctly.
      </p>
      <div className="score-grid">
        <span>Name</span>
        <strong>{result.userName}</strong>
        <span>Scope</span>
        <strong>{result.scopeLabel ?? 'Selected test'}</strong>
        <span>Score</span>
        <strong>
          {result.score}/{result.totalQuestions}
        </strong>
      </div>
    </section>
  );
}
