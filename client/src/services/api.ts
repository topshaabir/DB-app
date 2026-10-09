import type {
  ChapterSummary,
  ProfileStats,
  SubmitTestRequest,
  TestQuestion,
  TestResult,
  TestScope,
  TopicDetail,
  TopicSummary,
  Vocabulary
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [1500, 3000, 6000, 10000];

const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() ?? 'GET';
  const canRetry = method === 'GET';
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        ...options
      });

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      const message = await response.text();
      lastError = new Error(message || `Request failed with status ${response.status}`);

      if (!canRetry || !RETRYABLE_STATUSES.has(response.status) || attempt === RETRY_DELAYS_MS.length) {
        throw lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network request failed');
      if (!canRetry || attempt === RETRY_DELAYS_MS.length) {
        throw lastError;
      }
    }

    await sleep(RETRY_DELAYS_MS[attempt]);
  }

  throw lastError ?? new Error('Request failed');
}

export const api = {
  getChapters: () => request<ChapterSummary[]>('/chapters'),
  getChapter: (id: number) => request<ChapterSummary>(`/chapters/${id}`),
  getTopics: () => request<TopicSummary[]>('/topics'),
  getTopic: (id: number) => request<TopicDetail>(`/topics/${id}`),
  getVocabulary: (topicId: number) => request<Vocabulary[]>(`/topics/${topicId}/vocabulary`),
  getTopicQuestions: (topicId: number) => request<TestQuestion[]>(`/topics/${topicId}/questions`),
  getTestScopes: () => request<TestScope[]>('/tests/scopes'),
  getTestQuestions: (scopeType: string, scopeId?: number | null) => {
    const params = new URLSearchParams({ scopeType });
    if (scopeId) {
      params.set('scopeId', String(scopeId));
    }
    return request<TestQuestion[]>(`/tests/questions?${params.toString()}`);
  },
  submitTest: (payload: SubmitTestRequest) =>
    request<TestResult>('/tests/submit', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getProfile: (name: string) => request<ProfileStats>(`/profile/${encodeURIComponent(name)}`),
  getResults: (name: string) => request<TestResult[]>(`/test-results/${encodeURIComponent(name)}`)
};
