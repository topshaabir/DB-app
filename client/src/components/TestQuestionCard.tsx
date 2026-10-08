import type { TestQuestion } from '../types/api';

type TestQuestionCardProps = {
  question: TestQuestion;
  selectedAnswerId?: number;
  disabled?: boolean;
  onSelect: (questionId: number, answerId: number) => void;
};

export function TestQuestionCard({ question, selectedAnswerId, onSelect, disabled }: TestQuestionCardProps) {
  return (
    <article className="question-card">
      <div className="question-meta">{question.topicTitle}</div>
      <h3>{question.questionText}</h3>
      <div className="answer-grid">
        {question.answers.map(answer => (
          <button
            type="button"
            disabled={disabled}
            key={answer.id}
            className={`answer-option ${selectedAnswerId === answer.id ? 'selected' : ''}`}
            onClick={() => onSelect(question.id, answer.id)}
          >
            {answer.answerText}
          </button>
        ))}
      </div>
    </article>
  );
}
