import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { QUESTION_PREFIX, distractors, shuffle } from '../src/choices.mjs';
import { insert } from './sql.mjs';
import { pathToFileURL } from 'node:url';

export function parseContent(text) {
  const chapters = [];
  let chapter;
  let topic;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const separator = line.indexOf(' \u2014 ');
    if (separator < 0) throw new Error(`Invalid content: ${line}`);
    const left = line.slice(0, separator).trim();
    const right = line.slice(separator + 3).trim();
    if (!left || !right) throw new Error('Empty content entry');
    const heading = left.match(/^Chapter-\d+\.\s*(.+)$/);
    if (heading) {
      if (chapters.some(item => item.title.toLowerCase() === heading[1].toLowerCase())) throw new Error('Duplicate chapter');
      chapter = { title: heading[1], description: right, topics: [] };
      chapters.push(chapter);
      topic = null;
      continue;
    }
    if (!chapter) throw new Error('Content must start with a chapter');
    const subheading = left.match(/^Topic-\d+\.\s*(.+)$/);
    if (subheading) {
      if (chapter.topics.some(item => item.title.toLowerCase() === subheading[1].toLowerCase())) throw new Error('Duplicate topic');
      topic = { title: subheading[1], description: right, words: [] };
      chapter.topics.push(topic);
      continue;
    }
    if (!topic) {
      topic = { title: 'Vocabulary', description: null, words: [] };
      chapter.topics.push(topic);
    }
    if (topic.words.some(item => item.word.toLowerCase() === left.toLowerCase())) throw new Error(`Duplicate word: ${left}`);
    topic.words.push({ word: left, translation: right });
  }
  if (!chapters.length) throw new Error('No chapters');
  return chapters;
}

export function seedSql(chapters) {
  const sql = [];
  let topicId = 0;
  let wordId = 0;
  let answerId = 0;
  chapters.forEach((chapter, index) => {
    sql.push(insert('chapters', { id: index + 1, title: chapter.title, description: chapter.description, orderIndex: index + 1 }));
    chapter.topics.forEach((topic, order) => {
      topicId++;
      sql.push(insert('topics', { id: topicId, chapterId: index + 1, title: topic.title, description: topic.description, imageUrl: null, orderIndex: order + 1, isActive: 1 }));
      const vocabulary = topic.words.map(word => ({ id: ++wordId, topicId, ...word, exampleSentence: '', partOfSpeech: null }));
      for (const word of vocabulary) {
        sql.push(insert('vocabulary', word));
        sql.push(insert('questions', { id: word.id, topicId, questionText: QUESTION_PREFIX + word.word, questionType: 'MultipleChoice', isActive: 1 }));
        const wrong = distractors(word, vocabulary);
        if (!wrong.length) throw new Error(`Topic ${topic.title} needs distinct translations`);
        const options = shuffle([...wrong.map(answerText => ({ answerText, isCorrect: 0 })), { answerText: word.translation, isCorrect: 1 }]);
        for (const option of options) sql.push(insert('answers', { id: ++answerId, questionId: word.id, ...option }));
      }
    });
  });
  return sql.join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const chapters = parseContent(await readFile(new URL('../../es-russian.txt', import.meta.url), 'utf8'));
  await mkdir(new URL('../data/', import.meta.url), { recursive: true });
  await writeFile(new URL('../data/seed.sql', import.meta.url), seedSql(chapters));
  console.log(`Prepared ${chapters.length} chapters and ${chapters.reduce((sum, c) => sum + c.topics.reduce((n, t) => n + t.words.length, 0), 0)} words in data/seed.sql`);
}
