ALTER TABLE vocabulary ADD COLUMN translationRu TEXT;
ALTER TABLE vocabulary ADD COLUMN translationKz TEXT;
ALTER TABLE vocabulary ADD COLUMN exampleTranslation TEXT;
ALTER TABLE vocabulary ADD COLUMN ipa TEXT;
ALTER TABLE results ADD COLUMN parentResultId TEXT;

CREATE TABLE userAnswers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  testResultId INTEGER NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  questionId INTEGER NOT NULL REFERENCES questions(id),
  answerId INTEGER REFERENCES answers(id),
  answerText TEXT,
  isCorrect INTEGER NOT NULL CHECK (isCorrect IN (0, 1)),
  correctAnswerText TEXT NOT NULL,
  explanation TEXT
);
CREATE INDEX userAnswers_result ON userAnswers(testResultId);
CREATE INDEX userAnswers_question ON userAnswers(questionId);
