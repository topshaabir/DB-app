import { choices } from './choices.mjs';

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
const bad = message => json({ error: message }, 400);
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const userKey = value => value.trim().toUpperCase();
const topicTitle = topic => topic.title.toLowerCase() === 'vocabulary' ? topic.chapterTitle : topic.title;
const topicSelect = `SELECT t.id, t.chapterId, c.title AS chapterTitle, t.title, t.description,
  t.imageUrl, t.orderIndex FROM topics t JOIN chapters c ON c.id=t.chapterId WHERE t.isActive=1`;
const resultSelect = 'SELECT id, userName, topicId, scopeLabel, score, totalQuestions, percentage, completedAt, parentResultId FROM results';

async function rows(db, sql, ...params) {
  return (await db.prepare(sql).bind(...params).all()).results;
}

function scopeFilter(type, id) {
  if (typeof type !== 'string') return null;
  const normalized = type.trim().toLowerCase();
  if (normalized === 'all' && id == null) return { type: normalized, sql: '', params: [] };
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (normalized === 'topic') return { type: normalized, sql: ' AND q.topicId=?', params: [id] };
  if (normalized === 'chapter') return { type: normalized, sql: ' AND t.chapterId=?', params: [id] };
  return null;
}

const questionSelect = `SELECT q.id, q.topicId, q.questionText, q.questionType,
  t.title, c.title AS chapterTitle, c.orderIndex AS chapterOrder
  FROM questions q JOIN topics t ON t.id=q.topicId JOIN chapters c ON c.id=t.chapterId
  WHERE q.isActive=1 AND t.isActive=1`;

async function questionRows(db, scope) {
  if (!scope) return [];
  return rows(db, questionSelect + scope.sql + ' ORDER BY c.orderIndex, t.orderIndex, q.id', ...scope.params);
}

async function getQuestions(db, scope) {
  const questions = await questionRows(db, scope);
  if (!questions.length) return [];
  const [options, vocabulary] = await Promise.all([
    rows(db, `SELECT a.* FROM answers a JOIN questions q ON q.id=a.questionId
      JOIN topics t ON t.id=q.topicId WHERE q.isActive=1 AND t.isActive=1` + scope.sql, ...scope.params),
    rows(db, 'SELECT v.* FROM vocabulary v JOIN topics t ON t.id=v.topicId WHERE t.isActive=1')
  ]);
  const byQuestion = new Map();
  for (const option of options) {
    if (!byQuestion.has(option.questionId)) byQuestion.set(option.questionId, []);
    byQuestion.get(option.questionId).push(option);
  }
  return questions.map(question => ({
    id: question.id, topicId: question.topicId, topicTitle: topicTitle(question),
    questionText: question.questionText, questionType: question.questionType,
    answers: choices(question, byQuestion.get(question.id) ?? [], vocabulary),
    correctAnswers: (byQuestion.get(question.id) ?? []).filter(option => option.isCorrect).map(option => option.answerText),
    exampleSentence: null,
    explanation: question.questionType?.toLowerCase().includes('blank') ? 'Use the preposition or word that completes the sentence naturally.' : null
  }));
}

const splitAnswers = text => String(text ?? '').split(/[,;/]/).map(value => value.trim()).filter(Boolean);
const normalizeAnswer = text => String(text ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');

async function submit(request, db) {
  let body;
  try { body = await request.json(); } catch { return bad('Invalid JSON.'); }
  if (!body || typeof body.userName !== 'string' || !body.userName.trim() || body.userName.trim().length > 120
    || !Array.isArray(body.answers) || !body.answers.length) return bad('Invalid test submission.');
  const scope = scopeFilter(body.scopeType, body.scopeId);
  if (!scope) return bad('Invalid test scope.');
  let questions = await questionRows(db, scope);
  if (Array.isArray(body.questionIds) && body.questionIds.length) {
    const ids = [...new Set(body.questionIds)];
    if (ids.length !== body.questionIds.length || ids.some(id => !Number.isSafeInteger(id) || !questions.some(question => question.id === id))) return bad('Invalid question set.');
    questions = ids.map(id => questions.find(question => question.id === id));
  }
  if (!questions.length || questions.length !== body.answers.length) return bad('Complete every question in the selected test.');
  const submitted = new Map();
  for (const answer of body.answers) {
    if (!answer || !Number.isSafeInteger(answer.questionId) || submitted.has(answer.questionId)) return bad('Invalid or duplicate answer.');
    submitted.set(answer.questionId, answer);
  }
  const options = await rows(db, `SELECT a.* FROM answers a JOIN questions q ON q.id=a.questionId
    JOIN topics t ON t.id=q.topicId WHERE q.isActive=1 AND t.isActive=1` + scope.sql, ...scope.params);
  const byQuestion = new Map();
  for (const option of options) {
    if (!byQuestion.has(option.questionId)) byQuestion.set(option.questionId, []);
    byQuestion.get(option.questionId).push(option);
  }
  let score = 0;
  const scored = [];
  const mistakes = [];
  for (const question of questions) {
    const candidates = byQuestion.get(question.id) ?? [];
    const submission = submitted.get(question.id);
    const selected = Number.isSafeInteger(submission.answerId) ? candidates.find(option => option.id === submission.answerId) : null;
    const correctTexts = candidates.filter(option => option.isCorrect).flatMap(option => splitAnswers(option.answerText));
    if (!correctTexts.length || (submission.answerId != null && !selected)) return bad('Invalid answer for this question.');
    const userAnswer = selected?.answerText ?? String(submission.answerText ?? '').trim();
    const isCorrect = selected ? Boolean(selected.isCorrect) : correctTexts.some(text => normalizeAnswer(text) === normalizeAnswer(userAnswer));
    score += isCorrect ? 1 : 0;
    scored.push({ question, answerId: submission.answerId ?? null, userAnswer, isCorrect, correctAnswer: correctTexts[0] });
    if (!isCorrect) {
      mistakes.push({
        questionId: question.id, topicId: question.topicId, topicTitle: topicTitle(question),
        questionText: question.questionText, questionType: question.questionType,
        userAnswer, correctAnswer: correctTexts[0], exampleSentence: null,
        explanation: question.questionType?.toLowerCase().includes('blank') ? 'Use the preposition or word that completes the sentence naturally.' : null
      });
    }
  }
  let scopeLabel = 'All topics';
  if (scope.type === 'topic') scopeLabel = topicTitle(questions[0]);
  if (scope.type === 'chapter') scopeLabel = `Chapter ${questions[0].chapterOrder} - ${questions[0].chapterTitle}`;
  const result = {
    userName: body.userName.trim(), topicId: scope.type === 'topic' ? body.scopeId : null,
    scopeLabel, score, totalQuestions: questions.length,
    percentage: round(score / questions.length * 100), completedAt: new Date().toISOString(),
    parentResultId: typeof body.parentResultId === 'string' ? body.parentResultId : null
  };
  const inserted = await db.prepare(`INSERT INTO results
    (userName,userKey,topicId,scopeLabel,score,totalQuestions,percentage,completedAt,parentResultId) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(result.userName, userKey(result.userName), result.topicId, result.scopeLabel, score,
      result.totalQuestions, result.percentage, result.completedAt, result.parentResultId).run();
  const resultId = inserted.meta.last_row_id;
  for (const item of scored) {
    await db.prepare(`INSERT INTO userAnswers
      (testResultId,questionId,answerId,answerText,isCorrect,correctAnswerText,explanation) VALUES (?,?,?,?,?,?,?)`)
      .bind(resultId, item.question.id, item.answerId, item.userAnswer, item.isCorrect ? 1 : 0, item.correctAnswer, null).run();
  }
  return json({ id: resultId, ...result, mistakes });
}

async function api(request, db, url) {
  const path = url.pathname.replace(/\/$/, '');
  if (path === '/health') {
    await db.prepare('SELECT 1 FROM chapters LIMIT 1').all();
    return json({ status: 'ok', database: 'd1' });
  }
  if (path === '/api/tests/submit' && request.method === 'POST') return submit(request, db);
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  if (path === '/api/chapters' || /^\/api\/chapters\/\d+$/.test(path)) {
    const id = path === '/api/chapters' ? null : Number(path.split('/').pop());
    const chapters = await rows(db, 'SELECT * FROM chapters' + (id == null ? ' ORDER BY orderIndex' : ' WHERE id=?'), ...(id == null ? [] : [id]));
    const topics = await rows(db, topicSelect + (id == null ? '' : ' AND t.chapterId=?') + ' ORDER BY t.orderIndex', ...(id == null ? [] : [id]));
    const data = chapters.map(chapter => ({ ...chapter, topics: topics.filter(topic => topic.chapterId === chapter.id) }));
    return id == null ? json(data) : data.length ? json(data[0]) : json({ error: 'Chapter not found.' }, 404);
  }
  if (path === '/api/topics') return json(await rows(db, topicSelect + ' ORDER BY c.orderIndex,t.orderIndex'));
  const topicMatch = path.match(/^\/api\/topics\/(\d+)(?:\/(vocabulary|questions))?$/);
  if (topicMatch) {
    const id = Number(topicMatch[1]);
    const topic = await db.prepare(topicSelect + ' AND t.id=?').bind(id).first();
    if (!topic) return json({ error: 'Topic not found.' }, 404);
    if (topicMatch[2] === 'questions') return json(await getQuestions(db, scopeFilter('topic', id)));
    const vocabulary = await rows(db, 'SELECT id,topicId,word,translation,translationRu,translationKz,exampleSentence,exampleTranslation,ipa,partOfSpeech FROM vocabulary WHERE topicId=? ORDER BY id', id);
    return json(topicMatch[2] === 'vocabulary' ? vocabulary : { ...topic, vocabulary });
  }
  if (path === '/api/tests/questions') {
    const id = url.searchParams.get('scopeId');
    return json(await getQuestions(db, scopeFilter(url.searchParams.get('scopeType') ?? 'all', id == null ? null : Number(id))));
  }
  if (path === '/api/tests/scopes') {
    const chapters = await rows(db, `SELECT c.* FROM chapters c WHERE
      (SELECT count(*) FROM topics t WHERE t.chapterId=c.id AND t.isActive=1
      AND EXISTS(SELECT 1 FROM questions q WHERE q.topicId=t.id AND q.isActive=1))>1 ORDER BY c.orderIndex`);
    const topics = await rows(db, topicSelect + ' AND EXISTS(SELECT 1 FROM questions q WHERE q.topicId=t.id AND q.isActive=1) ORDER BY c.orderIndex,t.orderIndex');
    return json([
      { type: 'all', id: null, label: 'All topics' },
      ...chapters.map(chapter => ({ type: 'chapter', id: chapter.id, label: `Chapter ${chapter.orderIndex} - ${chapter.title}` })),
      ...topics.map(topic => ({ type: 'topic', id: topic.id, label: topic.title === 'Vocabulary' ? topic.chapterTitle : `${topic.chapterTitle} - ${topic.title}` }))
    ]);
  }
  const profileMatch = path.match(/^\/api\/(profile|test-results)\/(.+)$/);
  if (profileMatch) {
    const name = decodeURIComponent(profileMatch[2]).trim();
    if (!name || name.length > 120) return bad('Name is required and must be at most 120 characters.');
    const results = await rows(db, resultSelect + ' WHERE userKey=? ORDER BY completedAt DESC,id DESC', userKey(name));
    if (profileMatch[1] === 'test-results') return json(results);
    return json({
      userName: name, completedTests: results.length, bestScore: Math.max(0, ...results.map(result => result.score)),
      averageScore: results.length ? round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : 0,
      averagePercentage: results.length ? round(results.reduce((sum, result) => sum + result.percentage, 0) / results.length) : 0,
      totalLearnedTopics: new Set(results.filter(result => result.topicId != null).map(result => result.topicId)).size,
      recentResults: results.slice(0, 5)
    });
  }
  if (path === '/api/leaderboard') {
    const period = url.searchParams.get('period') ?? 'all';
    const topic = url.searchParams.get('topicId');
    const topicId = topic == null ? null : Number(topic);
    if (!['all', 'week'].includes(period) || (topicId != null && (!Number.isSafeInteger(topicId) || topicId <= 0))) return bad('Choose all or week and a valid topic ID.');
    let where = ' WHERE totalQuestions>0 AND trim(userName)!=\'\'';
    const params = [];
    if (period === 'week') { where += ' AND completedAt>=?'; params.push(new Date(Date.now() - 7 * 86400000).toISOString()); }
    if (topicId != null) { where += ' AND topicId=?'; params.push(topicId); }
    const totals = await db.prepare('SELECT count(DISTINCT userKey) AS totalPlayers,count(*) AS totalTests FROM results' + where).bind(...params).first();
    const entries = await rows(db, `SELECT min(userName) AS userName,sum(score) AS points,
      sum(totalQuestions) AS questions,count(*) AS completedTests,max(completedAt) AS lastCompletedAt
      FROM results${where} GROUP BY userKey ORDER BY points DESC,1.0*sum(score)/sum(totalQuestions) DESC,userName LIMIT 100`, ...params);
    return json({ ...totals, entries: entries.map(({ questions, ...entry }, index) => ({ rank: index + 1, ...entry, accuracy: round(entry.points / questions * 100) })) });
  }
  return json({ error: 'API route not found.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/health' && url.pathname !== '/api' && !url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try { return await api(request, env.DB, url); }
    catch (error) {
      console.error('API request failed', error);
      return json({ error: 'The request could not be completed.' }, 500);
    }
  }
};
