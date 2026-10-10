export const QUESTION_PREFIX = '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0435\u0440\u0435\u0432\u043e\u0434: ';

export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function distractors(word, vocabulary, count = 3) {
  const meanings = text => text.split(/[,;/]/).map(value => value.trim().toLowerCase()).filter(Boolean);
  const correct = new Set(meanings(word.translation));
  const distinct = new Map();
  for (const candidate of vocabulary) {
    if (candidate.topicId !== word.topicId || candidate.word.trim().toLowerCase() === word.word.trim().toLowerCase()
      || meanings(candidate.translation).some(value => correct.has(value))) continue;
    const text = candidate.translation.trim();
    if (text) distinct.set(text.toLowerCase(), text);
  }
  const candidates = [...distinct.values()].sort((a, b) =>
    Math.abs(a.length - word.translation.trim().length) - Math.abs(b.length - word.translation.trim().length));
  return shuffle(candidates.slice(0, Math.max(count, 8))).slice(0, count);
}

export function choices(question, options, vocabulary) {
  if (!question.questionText.startsWith(QUESTION_PREFIX)) {
    return shuffle(options.map(({ id, answerText }) => ({ id, answerText })));
  }
  const word = vocabulary.find(word => word.topicId === question.topicId
    && word.word === question.questionText.slice(QUESTION_PREFIX.length));
  const correct = options.filter(option => option.isCorrect);
  if (!word || correct.length !== 1) throw new Error('Invalid translation question');
  const wrong = options.filter(option => !option.isCorrect).sort((a, b) => a.id - b.id);
  const texts = distractors(word, vocabulary, wrong.length);
  if (!texts.length) throw new Error('Topic needs distinct translations');
  return shuffle([
    ...texts.map((answerText, index) => ({ id: wrong[index].id, answerText })),
    { id: correct[0].id, answerText: word.translation }
  ]);
}
