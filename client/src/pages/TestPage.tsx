import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Dropdown } from '../components/Dropdown';
import { ScoreCard } from '../components/ScoreCard';
import { StateMessage } from '../components/StateMessage';
import { TestQuestionCard } from '../components/TestQuestionCard';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import type { TestQuestion, TestResult, TestScope } from '../types/api';

function encodeScope(scope: TestScope) {
  return `${scope.type}:${scope.id ?? ''}`;
}

function decodeScope(value: string) {
  const [type, rawId] = value.split(':');
  return { scopeType: type || 'all', scopeId: rawId ? Number(rawId) : null };
}

export function TestPage() {
  const [userName, setUserName] = useState('');
  const [selectedScope, setSelectedScope] = useState('all:');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const { data: scopes, loading, error } = useAsync(api.getTestScopes, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const canSubmit = questions.length > 0 && answeredCount === questions.length && userName.trim().length > 0;

  async function startTest() {
    setQuestions([]);
    setAnswers({});
    setFlowError(null);
    setResult(null);
    if (!userName.trim()) {
      setFlowError('Enter your name before starting the test.');
      return;
    }

    const scope = decodeScope(selectedScope);
    setLoadingQuestions(true);
    try {
      const nextQuestions = await api.getTestQuestions(scope.scopeType, scope.scopeId);
      setQuestions(nextQuestions);
      setAnswers({});
      if (nextQuestions.length === 0) {
        setFlowError('No active questions are available for this scope yet.');
      }
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Could not load questions.');
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function submitTest() {
    const scope = decodeScope(selectedScope);
    setSubmitting(true);
    setFlowError(null);
    try {
      const savedResult = await api.submitTest({
        userName,
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
        answers: Object.entries(answers).map(([questionId, answerId]) => ({
          questionId: Number(questionId),
          answerId
        }))
      });
      setResult(savedResult);
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Could not submit the test.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Practice</span>
          <h1>Test</h1>
        </div>
      </header>

      <section className="form-panel">
        <label className="field">
          <span>Enter your name</span>
          <input maxLength={120} disabled={loadingQuestions || submitting} value={userName} onChange={event => setUserName(event.target.value)} placeholder="Your name" />
        </label>
        <Dropdown label="Choose test scope" value={selectedScope} disabled={loadingQuestions || submitting} onChange={event => { setSelectedScope(event.target.value); setQuestions([]); setAnswers({}); setResult(null); setFlowError(null); }}>
          {scopes?.map(scope => (
            <option key={encodeScope(scope)} value={encodeScope(scope)}>
              {scope.label}
            </option>
          ))}
        </Dropdown>
        <Button type="button" onClick={startTest} disabled={loading || loadingQuestions || submitting || !!error}>
          {loadingQuestions ? 'Loading...' : 'Start test'}
        </Button>
      </section>

      {error ? <StateMessage title="Could not load scopes" message={error} /> : null}
      {flowError ? <StateMessage title="Test message" message={flowError} /> : null}

      {questions.length > 0 ? (
        <section className="content-section">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">
                {answeredCount}/{questions.length} answered
              </span>
              <h2>Questions</h2>
            </div>
            <Button type="button" onClick={submitTest} disabled={!canSubmit || submitting || !!result}>
              {submitting ? 'Saving...' : 'Submit'}
            </Button>
          </div>
          <div className="question-stack">
            {questions.map(question => (
              <TestQuestionCard
                key={question.id}
                question={question}
                selectedAnswerId={answers[question.id]}
                disabled={submitting || !!result}
                onSelect={(questionId, answerId) => setAnswers(current => ({ ...current, [questionId]: answerId }))}
              />
            ))}
          </div>
        </section>
      ) : null}

      {result ? <ScoreCard result={result} /> : null}
    </div>
  );
}
