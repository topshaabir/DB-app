import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '../components/Button';
import { Dropdown } from '../components/Dropdown';
import { LoadingState } from '../components/LoadingState';
import { StateMessage } from '../components/StateMessage';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { saveMistakeSet, stashRetryMistakes, takeRetryMistakes, type StoredMistakeSet } from '../services/mistakes';
import { learningTitle, questionPrompt } from '../services/topicTitle';
import { usePreferences } from '../services/preferences';
import type { TestQuestion, TestResult, TestScope } from '../types/api';

type Difficulty = 'easy' | 'medium' | 'hard';
type QuestionCount = '5' | '10' | '20' | 'all';
type DraftAnswer = { answerId?: number | null; answerText?: string };

const progressKey = 'fluffy.activeTest';

function encodeScope(scope: TestScope) {
  return `${scope.type}:${scope.id ?? ''}`;
}

function decodeScope(value: string) {
  const [type, rawId] = value.split(':');
  return { scopeType: type || 'all', scopeId: rawId ? Number(rawId) : null };
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function isMultipleChoice(question: TestQuestion) {
  return question.questionType.toLowerCase().includes('multiple') || question.answers.length > 0;
}

function isFillBlank(question: TestQuestion) {
  const type = question.questionType.toLowerCase();
  return type.includes('blank') || question.questionText.includes('___');
}

function makeWriteQuestion(question: TestQuestion): TestQuestion {
  return {
    ...question,
    questionType: 'WriteTranslation',
    answers: [],
    questionText: question.questionText.replace(/^What does "(.+)" mean\?$/i, 'Translate: "$1"')
  };
}

function prepareQuestions(source: TestQuestion[], difficulty: Difficulty, count: QuestionCount) {
  const allowed = source.filter(question => {
    if (difficulty === 'easy') return isMultipleChoice(question);
    if (difficulty === 'medium') return isMultipleChoice(question) || isFillBlank(question);
    return isMultipleChoice(question) || isFillBlank(question) || question.questionType.toLowerCase().includes('write');
  });

  const expanded = difficulty === 'hard'
    ? allowed.map((question, index) => (index % 3 === 1 && isMultipleChoice(question) ? makeWriteQuestion(question) : question))
    : allowed;

  const unique = new Map<number, TestQuestion>();
  for (const question of shuffle(expanded)) unique.set(question.id, question);
  const limit = count === 'all' ? unique.size : Number(count);
  return [...unique.values()].slice(0, limit);
}

export function TestPage() {
  const { language, t } = usePreferences();
  const [userName, setUserName] = useState('');
  const [selectedScope, setSelectedScope] = useState('all:');
  const [questionCount, setQuestionCount] = useState<QuestionCount>('10');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, DraftAnswer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [parentResultId, setParentResultId] = useState<string | null>(null);
  const { data: scopes, loading, error } = useAsync(api.getTestScopes, []);

  useEffect(() => {
    const retry = takeRetryMistakes();
    if (retry) {
      setUserName(retry.userName);
      setParentResultId(retry.sourceResultId ?? retry.id);
      setQuestions(retry.mistakes.map(mistake => ({
        id: mistake.questionId,
        topicId: mistake.topicId,
        topicTitle: mistake.topicTitle,
        questionText: mistake.questionText,
        questionType: mistake.questionType,
        answers: [],
        correctAnswers: [mistake.correctAnswer],
        exampleSentence: mistake.exampleSentence,
        explanation: mistake.explanation
      })));
      setAnswers({});
      setResult(null);
      setCurrentIndex(0);
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) ?? 'null') as {
        userName: string;
        selectedScope: string;
        questionCount: QuestionCount;
        difficulty: Difficulty;
        questions: TestQuestion[];
        answers: Record<number, DraftAnswer>;
        currentIndex: number;
        parentResultId?: string | null;
      } | null;
      if (saved?.questions?.length) {
        setUserName(saved.userName);
        setSelectedScope(saved.selectedScope);
        setQuestionCount(saved.questionCount);
        setDifficulty(saved.difficulty);
        setQuestions(saved.questions);
        setAnswers(saved.answers ?? {});
        setCurrentIndex(saved.currentIndex ?? 0);
        setParentResultId(saved.parentResultId ?? null);
      }
    } catch {
      localStorage.removeItem(progressKey);
    }
  }, []);

  useEffect(() => {
    if (!questions.length || result) return;
    localStorage.setItem(progressKey, JSON.stringify({
      userName,
      selectedScope,
      questionCount,
      difficulty,
      questions,
      answers,
      currentIndex,
      parentResultId
    }));
  }, [answers, currentIndex, difficulty, parentResultId, questionCount, questions, result, selectedScope, userName]);

  const answeredCount = useMemo(() => Object.keys(answers).filter(id => {
    const answer = answers[Number(id)];
    return Boolean(answer?.answerId || answer?.answerText?.trim());
  }).length, [answers]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  async function startTest() {
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setFlowError(null);
    setResult(null);
    setParentResultId(null);
    if (!userName.trim()) {
      setFlowError(t('nameRequired'));
      return;
    }

    const scope = decodeScope(selectedScope);
    setLoadingQuestions(true);
    try {
      const loaded = await api.getTestQuestions(scope.scopeType, scope.scopeId, language);
      const nextQuestions = prepareQuestions(loaded, difficulty, questionCount);
      setQuestions(nextQuestions);
      if (nextQuestions.length === 0) {
        setFlowError(t('noQuestions'));
      } else if (nextQuestions.length < Math.min(loaded.length, questionCount === 'all' ? loaded.length : Number(questionCount))) {
        setFlowError(t('noFormats'));
      }
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : t('couldNotLoadQuestions'));
    } finally {
      setLoadingQuestions(false);
    }
  }

  function setAnswer(question: TestQuestion, answer: DraftAnswer) {
    setAnswers(current => ({ ...current, [question.id]: answer }));
    setFlowError(null);
  }

  function moveNext() {
    if (!currentQuestion) return;
    const answer = answers[currentQuestion.id];
    if (isMultipleChoice(currentQuestion) && !answer?.answerId) {
      setFlowError(t('chooseAnswer'));
      return;
    }
    if (!isMultipleChoice(currentQuestion) && !answer?.answerText?.trim()) {
      setFlowError(t('writeAnswer'));
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(index => index + 1);
    } else {
      void submitTest();
    }
  }

  async function submitTest() {
    if (!questions.length || submitting || result) return;
    const missing = questions.find(question => {
      const answer = answers[question.id];
      return isMultipleChoice(question) ? !answer?.answerId : !answer?.answerText?.trim();
    });
    if (missing) {
      setCurrentIndex(questions.indexOf(missing));
      setFlowError(isMultipleChoice(missing) ? t('chooseAnswer') : t('writeAnswer'));
      return;
    }

    const scope = decodeScope(selectedScope);
    setSubmitting(true);
    setFlowError(null);
    try {
      const savedResult = await api.submitTest({
        userName,
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
        questionIds: questions.map(question => question.id),
        parentResultId,
        answers: questions.map(question => ({
          questionId: question.id,
          answerId: answers[question.id]?.answerId ?? null,
          answerText: answers[question.id]?.answerText ?? null
        }))
      });
      setResult(savedResult);
      localStorage.removeItem(progressKey);
      if (savedResult.mistakes?.length) {
        saveMistakeSet({
          id: String(savedResult.id),
          sourceResultId: parentResultId,
          userName: savedResult.userName,
          createdAt: savedResult.completedAt,
          mistakes: savedResult.mistakes
        });
      }
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : t('couldNotSubmit'));
    } finally {
      setSubmitting(false);
    }
  }

  function retryMistakes() {
    if (!result?.mistakes?.length) return;
    const set: StoredMistakeSet = {
      id: String(result.id),
      sourceResultId: String(result.id),
      userName: result.userName,
      createdAt: result.completedAt,
      mistakes: shuffle(result.mistakes)
    };
    stashRetryMistakes(set);
    window.location.reload();
  }

  function newTest() {
    localStorage.removeItem(progressKey);
    takeRetryMistakes();
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setParentResultId(null);
    setFlowError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const activeAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <div className="test-page">
      {!questions.length && !result ? (
        <section className="test-setup">
          <div>
            <span className="eyebrow">{t('practice')}</span>
            <h1>{t('setupTitle')}</h1>
            <p>{t('setupCopy')}</p>
          </div>
          <div className="test-setup-grid">
            <label className="field">
              <span>{t('enterName')}</span>
              <input maxLength={120} disabled={loadingQuestions || submitting} value={userName} onChange={event => setUserName(event.target.value)} placeholder={t('namePlaceholder')} />
            </label>
            <Dropdown label={t('chooseTopic')} value={selectedScope} disabled={loading || loadingQuestions || submitting} onChange={event => setSelectedScope(event.target.value)}>
              {scopes?.map(scope => (
                <option key={encodeScope(scope)} value={encodeScope(scope)}>
                  {scope.type === 'all' ? t('allTopics') : learningTitle(scope.label, language)}
                </option>
              ))}
            </Dropdown>
            <Dropdown label={t('questionCount')} value={questionCount} disabled={loadingQuestions || submitting} onChange={event => setQuestionCount(event.target.value as QuestionCount)}>
              <option value="5">{t('fiveQuestions')}</option>
              <option value="10">{t('tenQuestions')}</option>
              <option value="20">{t('twentyQuestions')}</option>
              <option value="all">{t('allQuestions')}</option>
            </Dropdown>
            <Dropdown label={t('difficulty')} value={difficulty} disabled={loadingQuestions || submitting} onChange={event => setDifficulty(event.target.value as Difficulty)}>
              <option value="easy">{t('easy')}</option>
              <option value="medium">{t('medium')}</option>
              <option value="hard">{t('hard')}</option>
            </Dropdown>
          </div>
          <Button type="button" onClick={startTest} disabled={loading || loadingQuestions || submitting || !!error}>
            {loadingQuestions ? t('loading') : t('startTest')}
          </Button>
        </section>
      ) : null}

      {loading || loadingQuestions ? <LoadingState /> : null}
      {error ? <StateMessage title={t('scopesError')} message={error} /> : null}
      {flowError ? <StateMessage title={t('testMessage')} message={flowError} /> : null}

      {currentQuestion && !result ? (
        <section className="question-screen" aria-live="polite">
          <header className="question-topbar">
            <button type="button" className="back-button" onClick={() => setQuestions([])}>
              <ArrowLeft size={18} aria-hidden="true" />
              {t('back')}
            </button>
            <div className="question-progress-label">
              {t('question')} {currentIndex + 1} / {questions.length}
            </div>
          </header>
          <div className="progress-track question-progress">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <article className="single-question-card" key={currentQuestion.id + currentQuestion.questionType}>
            <div className="question-meta">{learningTitle(currentQuestion.topicTitle, language)}</div>
            <h1>{questionPrompt(currentQuestion.questionText, language)}</h1>
            {isMultipleChoice(currentQuestion) ? (
              <div className="single-answer-list">
                {currentQuestion.answers.map(answer => (
                  <button
                    type="button"
                    key={answer.id}
                    className={`single-answer ${activeAnswer?.answerId === answer.id ? 'selected' : ''}`}
                    onClick={() => setAnswer(currentQuestion, { answerId: answer.id, answerText: answer.answerText })}
                  >
                    {answer.answerText}
                  </button>
                ))}
              </div>
            ) : (
              <label className="written-answer">
                <span>{t('typeAnswer')}</span>
                <input
                  value={activeAnswer?.answerText ?? ''}
                  placeholder={isFillBlank(currentQuestion) ? t('blankPlaceholder') : t('answerPlaceholder')}
                  onChange={event => setAnswer(currentQuestion, { answerText: event.target.value })}
                  onKeyDown={event => {
                    if (event.key === 'Enter') moveNext();
                  }}
                />
                <small>{t('pressEnter')}</small>
              </label>
            )}
          </article>

          <footer className="question-nav">
            <Button type="button" onClick={() => setCurrentIndex(index => Math.max(0, index - 1))} disabled={currentIndex === 0 || submitting}>
              {t('previous')}
            </Button>
            <span>{answeredCount}/{questions.length} {t('answered')}</span>
            <Button type="button" onClick={moveNext} disabled={submitting}>
              {submitting ? t('saving') : currentIndex === questions.length - 1 ? t('finishTest') : t('next')}
            </Button>
          </footer>
        </section>
      ) : null}

      {result ? (
        <section className="results-screen">
          <span className="eyebrow">{t('results')}</span>
          <h1>{result.percentage}%</h1>
          <div className="results-stats">
            <div><span>{t('totalQuestions')}</span><strong>{result.totalQuestions}</strong></div>
            <div><span>{t('correctAnswers')}</span><strong>{result.score}</strong></div>
            <div><span>{t('incorrectAnswers')}</span><strong>{result.totalQuestions - result.score}</strong></div>
            <div><span>{t('accuracy')}</span><strong>{result.percentage}%</strong></div>
          </div>
          <div className="result-actions">
            <Button type="button" onClick={newTest}>
              <RotateCcw size={18} aria-hidden="true" />
              {t('newTest')}
            </Button>
            {result.mistakes?.length ? (
              <Button type="button" variant="secondary" onClick={retryMistakes}>{t('retryMistakes')}</Button>
            ) : null}
          </div>
          {result.mistakes?.length ? (
            <div className="mistake-list">
              <h2>{t('mistakes')}</h2>
              {result.mistakes.map(mistake => (
                <article className="mistake-card" key={mistake.questionId}>
                  <strong>{questionPrompt(mistake.questionText, language)}</strong>
                  <span>{t('yourAnswer')}: {mistake.userAnswer || '-'}</span>
                  <span>{t('correctAnswer')}: {mistake.correctAnswer}</span>
                  {mistake.exampleSentence ? <small>{t('example')}: {mistake.exampleSentence}</small> : null}
                  {mistake.explanation ? <small>{mistake.explanation}</small> : null}
                </article>
              ))}
            </div>
          ) : (
            <StateMessage title={t('noMistakes')} />
          )}
        </section>
      ) : null}
    </div>
  );
}
