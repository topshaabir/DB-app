import type { TestMistake } from '../types/api';

const key = 'fluffy.mistakes';

export type StoredMistakeSet = {
  id: string;
  userName: string;
  createdAt: string;
  sourceResultId?: string | null;
  mistakes: TestMistake[];
};

export function loadMistakeSets(userName?: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]') as StoredMistakeSet[];
    if (!userName?.trim()) return parsed;
    const normalized = userName.trim().toLowerCase();
    return parsed.filter(item => item.userName.trim().toLowerCase() === normalized);
  } catch {
    return [];
  }
}

export function saveMistakeSet(set: StoredMistakeSet) {
  const current = loadMistakeSets();
  localStorage.setItem(key, JSON.stringify([set, ...current].slice(0, 40)));
}

export function stashRetryMistakes(set: StoredMistakeSet) {
  sessionStorage.setItem('fluffy.retryMistakes', JSON.stringify(set));
}

export function takeRetryMistakes() {
  const raw = sessionStorage.getItem('fluffy.retryMistakes');
  if (!raw) return null;
  sessionStorage.removeItem('fluffy.retryMistakes');
  try {
    return JSON.parse(raw) as StoredMistakeSet;
  } catch {
    return null;
  }
}
