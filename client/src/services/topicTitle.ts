import type { TopicSummary } from '../types/api';
import type { Language } from './preferences';

const titles: Record<string, [string, string]> = {
  'Food and cooking': ['Еда и приготовление пищи', 'Тамақ және ас дайындау'],
  'Happy Family': ['Счастливая семья', 'Бақытты отбасы'],
  Personality: ['Характер', 'Мінез'],
  Money: ['Деньги', 'Ақша'],
  Transport: ['Транспорт', 'Көлік'],
  'Dependent prepositions': ['Зависимые предлоги', 'Тәуелді предлогтар'],
  'Public transport and vehicles': ['Общественный транспорт и транспортные средства', 'Қоғамдық көлік және көлік құралдары'],
  'On the road': ['В дороге', 'Жолда'],
  'Phrasal verbs': ['Фразовые глаголы', 'Фразалық етістіктер'],
  'After verbs': ['После глаголов', 'Етістіктерден кейін'],
  'After adjectives': ['После прилагательных', 'Сын есімдерден кейін'],
  Vocabulary: ['Слова', 'Сөздік']
};

export function learningTitle(title: string, language: Language): string {
  if (language !== 'en' && title.includes(' - ')) {
    return title.split(' - ').map(part => learningTitle(part, language)).join(' - ');
  }
  if (language !== 'en' && /^Chapter \d+$/.test(title)) {
    return title.replace('Chapter', language === 'ru' ? 'Раздел' : 'Бөлім');
  }
  if (title === 'All topics' || title === 'All Topics') {
    return { en: title, ru: 'Все темы', kz: 'Барлық тақырыптар' }[language];
  }
  const translated = titles[title];
  return language === 'en' || !translated ? title : translated[language === 'ru' ? 0 : 1];
}

export function learningDescription(description: string | null | undefined, language: Language) {
  if (!description) return description;
  for (const [title, translations] of Object.entries(titles)) {
    if (description === title || translations.includes(description)) return learningTitle(title, language);
  }
  if (description === 'Жолда: күрделі зат есімдерге арналған сөздер мен тіркестер') {
    return { en: 'On the road: compound nouns and phrases', ru: 'В дороге: сложные существительные и выражения', kz: description }[language];
  }
  return description;
}

export function questionPrompt(prompt: string, language: Language): string {
  if (language === 'en') return prompt;
  const word = prompt.match(/^(?:What does "(.+)" mean\?|Translate: "(.+)")$/i);
  if (!word) return prompt;
  return `${language === 'ru' ? 'Переведите' : 'Аударыңыз'}: "${word[1] ?? word[2]}"`;
}

export function topicTitle(topic: TopicSummary, language: Language = 'en') {
  return learningTitle(topic.title.toLowerCase() === 'vocabulary' ? topic.chapterTitle : topic.title, language);
}
