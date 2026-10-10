import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const base = process.argv[2];
if (!base || !/^https:\/\/.+\.workers\.dev$/.test(base)) throw new Error('Pass the deployed workers.dev URL.');
async function get(path) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  return response.json();
}

const db = new DatabaseSync(':memory:');
try {
  db.exec('PRAGMA foreign_keys=ON');
  db.exec(readFileSync(new URL('../migrations/0001_schema.sql', import.meta.url), 'utf8'));
  db.exec(readFileSync(new URL('../data/migration.sql', import.meta.url), 'utf8'));
  assert.equal((await get('/health')).database, 'd1');
  const chapters = await get('/api/chapters');
  assert.equal(chapters.length, db.prepare('SELECT count(*) AS n FROM chapters').get().n);
  const topics = await get('/api/topics');
  assert.equal(topics.length, db.prepare('SELECT count(*) AS n FROM topics WHERE isActive=1').get().n);
  const questions = await get('/api/tests/questions?scopeType=all');
  const correct = db.prepare(`SELECT q.id,a.id AS answerId,a.answerText FROM questions q
    JOIN topics t ON t.id=q.topicId JOIN answers a ON a.questionId=q.id
    WHERE q.isActive=1 AND t.isActive=1 AND a.isCorrect=1`).all();
  assert.equal(questions.length, correct.length);
  for (const expected of correct) {
    const question = questions.find(question => question.id === expected.id);
    assert.ok(question, 'Imported question ID is retained');
    assert.ok(question.answers.some(option => option.id === expected.answerId && option.answerText === expected.answerText), 'Correct answer mapping is retained');
    assert.ok(question.answers.every(option => !Object.hasOwn(option, 'isCorrect')));
  }
  const results = db.prepare('SELECT id,userName,score,totalQuestions,percentage,completedAt FROM results').all();
  for (const name of new Set(results.map(result => result.userName))) {
    const expected = results.filter(result => result.userName.toUpperCase() === name.toUpperCase());
    const history = await get('/api/test-results/' + encodeURIComponent(name));
    assert.equal(history.length, expected.length);
    for (const result of expected) {
      const actual = history.find(actual => actual.id === result.id);
      for (const field of ['score', 'totalQuestions', 'percentage', 'completedAt']) assert.equal(actual?.[field], result[field], 'Historical result is retained');
    }
    assert.equal((await get('/api/profile/' + encodeURIComponent(name))).completedTests, expected.length);
  }
  assert.equal((await get('/api/leaderboard')).totalTests, results.length);
  const rejected = await fetch(base + '/api/tests/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'Migration verification', scopeType: 'all', answers: [] })
  });
  assert.equal(rejected.status, 400);
  console.log(`Live deployment verified: ${chapters.length} chapters, ${topics.length} topics, ${questions.length} questions, ${results.length} historical results; profile, leaderboard, and invalid submission checks passed.`);
} finally { db.close(); }
