import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../src/index.mjs';
import { parseContent, seedSql } from '../scripts/seed.mjs';
import { distractors, QUESTION_PREFIX } from '../src/choices.mjs';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  sqlite.exec(readFileSync(new URL('../migrations/0001_schema.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_fluffy_v2.sql', import.meta.url), 'utf8'));
  sqlite.exec(seedSql(parseContent(readFileSync(new URL('../../es-russian.txt', import.meta.url), 'utf8'))));
  const DB = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let params = [];
      const query = {
        bind(...values) { params = values; return query; },
        async all() { return { results: statement.all(...params) }; },
        async first() { return statement.get(...params) ?? null; },
        async run() { const result = statement.run(...params); return { meta: { last_row_id: Number(result.lastInsertRowid) } }; }
      };
      return query;
    }
  };
  const env = { DB, ASSETS: { fetch: async () => new Response('spa') } };
  const call = (path, body) => worker.fetch(new Request('https://fluffy.example' + path,
    body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env);
  return { sqlite, call };
}

test('learning routes and question payload match the frontend contract', async () => {
  const { sqlite, call } = fixture();
  try {
    const chapters = await (await call('/api/chapters')).json();
    assert.ok(chapters.length >= 5);
    const id = chapters[0].topics[0].id;
    const topic = await (await call(`/api/topics/${id}`)).json();
    assert.ok(topic.vocabulary.length > 0);
    const questions = await (await call(`/api/topics/${id}/questions`)).json();
    assert.equal(questions.length, topic.vocabulary.length);
    for (const question of questions) {
      assert.ok(question.questionText.startsWith(QUESTION_PREFIX));
      assert.ok(question.answers.length >= 2);
      assert.equal(question.topicTitle, chapters[0].title);
      assert.ok(question.answers.every(option => Object.keys(option).sort().join() === 'answerText,id'));
      assert.ok(Array.isArray(question.correctAnswers));
    }
    for (const path of ['/api/topics', '/api/tests/scopes', '/api/chapters/1', `/api/topics/${id}/vocabulary`, '/health']) {
      assert.equal((await call(path)).status, 200, path);
    }
    assert.equal((await call('/api/topics/99999')).status, 404);
    assert.equal((await call('/api/missing')).status, 404);
    assert.equal(await (await call('/profile')).text(), 'spa');
    assert.deepEqual(await (await call('/api/tests/questions?scopeType=invalid')).json(), []);
  } finally { sqlite.close(); }
});

test('scoring rejects tampering and persists results, profile and leaderboard', async () => {
  const { sqlite, call } = fixture();
  try {
    const answers = sqlite.prepare('SELECT questionId,id AS answerId FROM answers WHERE isCorrect=1 ORDER BY questionId').all();
    const body = { userName: ' Alice ', scopeType: 'all', scopeId: null, answers };
    const response = await call('/api/tests/submit', body);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.percentage, 100);
    assert.equal(result.score, answers.length);
    assert.equal(result.userName, 'Alice');
    const invalid = [
      { ...body, answers: answers.slice(1) },
      { ...body, answers: [...answers.slice(1), answers[1]] },
      { ...body, answers: answers.map(answer => ({ ...answer, answerId: -1 })) },
      { ...body, scopeType: 'topic', scopeId: 1 },
      { ...body, scopeType: 'invalid' },
      { ...body, scopeId: 1 },
      { ...body, scopeType: null },
      { ...body, userName: ' ' },
      { ...body, userName: 'x'.repeat(121) },
      null
    ];
    for (const value of invalid) assert.equal((await call('/api/tests/submit', value)).status, 400);
    assert.equal(sqlite.prepare('SELECT count(*) AS n FROM results').get().n, 1);
    const wrong = sqlite.prepare('SELECT questionId,min(id) AS answerId FROM answers WHERE isCorrect=0 GROUP BY questionId').all();
    assert.equal((await (await call('/api/tests/submit', { ...body, userName: 'alice', answers: wrong })).json()).score, 0);
    const profile = await (await call('/api/profile/ALICE')).json();
    assert.equal(profile.completedTests, 2);
    assert.equal(profile.averagePercentage, 50);
    assert.equal(profile.recentResults.length, 2);
    assert.equal((await (await call('/api/test-results/Alice')).json()).length, 2);
    const leaderboard = await (await call('/api/leaderboard')).json();
    assert.equal(leaderboard.totalPlayers, 1);
    assert.equal(leaderboard.totalTests, 2);
    assert.equal(leaderboard.entries[0].points, answers.length);
    assert.equal(leaderboard.entries[0].accuracy, 50);
    sqlite.exec("UPDATE results SET completedAt='2000-01-01T00:00:00.000Z'");
    assert.equal((await (await call('/api/leaderboard?period=week')).json()).totalTests, 0);
    assert.equal((await call('/api/leaderboard?period=invalid')).status, 400);
    assert.equal((await call('/api/leaderboard?topicId=-1')).status, 400);
  } finally { sqlite.close(); }
});

test('topic and chapter scopes validate and label their results', async () => {
  const { sqlite, call } = fixture();
  try {
    for (const scopeType of ['topic', 'chapter']) {
      const answers = sqlite.prepare(`SELECT a.questionId,a.id AS answerId FROM answers a
        JOIN questions q ON q.id=a.questionId JOIN topics t ON t.id=q.topicId
        WHERE a.isCorrect=1 AND ${scopeType === 'topic' ? 'q.topicId' : 't.chapterId'}=1`).all();
      const result = await (await call('/api/tests/submit', { userName: 'Scope', scopeType, scopeId: 1, answers })).json();
      assert.equal(result.percentage, 100);
      assert.equal(result.topicId, scopeType === 'topic' ? 1 : null);
      assert.ok(result.scopeLabel.includes('Food and cooking'));
    }
    assert.equal((await (await call('/api/profile/Scope')).json()).totalLearnedTopics, 1);
    assert.equal((await (await call('/api/leaderboard?topicId=1')).json()).totalTests, 1);
  } finally { sqlite.close(); }
});

test('distractors exclude synonyms and duplicates', () => {
  const word = { topicId: 1, word: 'siblings', translation: 'brothers; sisters' };
  const candidates = [word,
    { topicId: 1, word: 'brothers and sisters', translation: 'sisters' },
    { topicId: 1, word: 'father', translation: 'parent' },
    { topicId: 1, word: 'dad', translation: 'PARENT' },
    { topicId: 2, word: 'other', translation: 'unrelated' }
  ];
  const values = distractors(word, candidates);
  assert.equal(values.length, 1);
  assert.equal(values[0].toLowerCase(), 'parent');
});
