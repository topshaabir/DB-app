CREATE TABLE chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  orderIndex INTEGER NOT NULL
);
CREATE TABLE topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapterId INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  imageUrl TEXT,
  orderIndex INTEGER NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX topics_chapter ON topics(chapterId, isActive, orderIndex);
CREATE TABLE vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topicId INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  exampleSentence TEXT NOT NULL DEFAULT '',
  partOfSpeech TEXT
);
CREATE INDEX vocabulary_topic ON vocabulary(topicId);
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topicId INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  questionText TEXT NOT NULL,
  questionType TEXT NOT NULL DEFAULT 'MultipleChoice',
  isActive INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX questions_topic ON questions(topicId, isActive);
CREATE TABLE answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  questionId INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answerText TEXT NOT NULL,
  isCorrect INTEGER NOT NULL CHECK (isCorrect IN (0, 1))
);
CREATE INDEX answers_question ON answers(questionId);
CREATE TABLE results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userName TEXT NOT NULL CHECK (length(userName) BETWEEN 1 AND 120),
  userKey TEXT NOT NULL,
  topicId INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  scopeLabel TEXT,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= totalQuestions),
  totalQuestions INTEGER NOT NULL CHECK (totalQuestions > 0),
  percentage REAL NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  completedAt TEXT NOT NULL
);
CREATE INDEX results_user ON results(userKey, completedAt DESC);
CREATE INDEX results_period ON results(completedAt, topicId);
