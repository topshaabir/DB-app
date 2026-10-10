export type TopicSummary = {
  id: number;
  chapterId: number;
  chapterTitle: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  orderIndex: number;
};

export type ChapterSummary = {
  id: number;
  title: string;
  description?: string | null;
  orderIndex: number;
  topics: TopicSummary[];
};

export type Vocabulary = {
  id: number;
  topicId: number;
  word: string;
  translation: string;
  translationRu?: string | null;
  translationKz?: string | null;
  exampleSentence: string;
  exampleTranslation?: string | null;
  ipa?: string | null;
  partOfSpeech?: string | null;
};

export type TopicDetail = TopicSummary & {
  vocabulary: Vocabulary[];
};

export type AnswerOption = {
  id: number;
  answerText: string;
};

export type TestMistake = {
  questionId: number;
  topicId: number;
  topicTitle: string;
  questionText: string;
  questionType: string;
  userAnswer: string;
  correctAnswer: string;
  exampleSentence?: string | null;
  explanation?: string | null;
};

export type TestQuestion = {
  id: number;
  topicId: number;
  topicTitle: string;
  questionText: string;
  questionType: string;
  correctAnswers?: string[];
  exampleSentence?: string | null;
  explanation?: string | null;
  answers: AnswerOption[];
};

export type TestScope = {
  type: string;
  id?: number | null;
  label: string;
};

export type TestResult = {
  id: number;
  userName: string;
  topicId?: number | null;
  scopeLabel?: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  mistakes?: TestMistake[];
  parentResultId?: string | null;
};

export type ProfileStats = {
  userName: string;
  completedTests: number;
  bestScore: number;
  averageScore: number;
  averagePercentage: number;
  totalLearnedTopics: number;
  recentResults: TestResult[];
};

export type SubmitTestRequest = {
  userName: string;
  scopeType: string;
  scopeId?: number | null;
  questionIds?: number[];
  parentResultId?: string | null;
  answers: Array<{
    questionId: number;
    answerId?: number | null;
    answerText?: string | null;
  }>;
};

export type LeaderboardEntry = {
  rank: number;
  userName: string;
  points: number;
  accuracy: number;
  completedTests: number;
  lastCompletedAt: string;
};

export type Leaderboard = {
  totalPlayers: number;
  totalTests: number;
  entries: LeaderboardEntry[];
};
