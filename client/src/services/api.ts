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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
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
