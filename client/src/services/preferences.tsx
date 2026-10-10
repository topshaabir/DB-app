import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'kz' | 'ru' | 'en';
export type ThemeMode = 'light' | 'dark';

const languageKey = 'fluffy.language';
const themeKey = 'fluffy.theme';

const dictionaries = {
  en: {
    appSubtitle: 'English learning',
    topics: 'Topics',
    test: 'Test',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
    practice: 'Practice',
    yourProgress: 'Your progress',
    vocabulary: 'Vocabulary',
    wordsForTopic: 'Words for this topic',
    backToTopics: 'Back to topics',
    topicNotFound: 'Topic not found',
    topicUnavailable: 'The requested topic is unavailable.',
    listen: 'Listen',
    example: 'Example',
    speechUnavailable: 'Speech synthesis is not supported in this browser.',
    enterName: 'Enter your name',
    namePlaceholder: 'Your name',
    chooseTopic: 'Topic',
    allTopics: 'All Topics (Mixed)',
    questionCount: 'Number of Questions',
    fiveQuestions: '5 Questions',
    tenQuestions: '10 Questions',
    twentyQuestions: '20 Questions',
    allQuestions: 'All Questions',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    startTest: 'Start Test',
    loading: 'Loading...',
    saving: 'Saving...',
    setupTitle: 'Quick Test',
    setupCopy: 'Choose a topic, length, and difficulty before you begin.',
    nameRequired: 'Enter your name before starting the test.',
    noQuestions: 'No active questions match these settings yet.',
    noFormats: 'This topic does not have questions for the selected difficulty yet. Available formats were used.',
    couldNotLoadQuestions: 'Could not load questions.',
    couldNotSubmit: 'Could not submit the test.',
    testMessage: 'Test message',
    question: 'Question',
    previous: 'Previous',
    next: 'Next',
    finishTest: 'Finish Test',
    back: 'Back',
    answered: 'answered',
    typeAnswer: 'Type your answer',
    answerPlaceholder: 'Write the translation',
    blankPlaceholder: 'Missing word',
    pressEnter: 'Press Enter to continue',
    chooseAnswer: 'Choose an answer before continuing.',
    writeAnswer: 'Write an answer before continuing.',
    results: 'Results',
    totalQuestions: 'Total Questions',
    correctAnswers: 'Correct Answers',
    incorrectAnswers: 'Incorrect Answers',
    accuracy: 'Accuracy',
    mistakes: 'Mistakes',
    yourAnswer: 'Your Answer',
    correctAnswer: 'Correct Answer',
    noMistakes: 'Great work. No mistakes to retry.',
    retryMistakes: 'Retry Mistakes',
    profileHint: 'Look up saved test statistics by name. Authentication can be added later without changing this flow.',
    userName: 'User name',
    profilePlaceholder: 'Name used in tests',
    viewProfile: 'View profile',
    profileNameRequired: 'Enter a name to view profile statistics.',
    profileMessage: 'Profile message',
    recent: 'Recent',
    savedResults: 'Saved results',
    noResults: 'No test results yet',
    completeTest: 'Complete a test to fill this profile.',
    selectedTest: 'Selected test',
    savedMistakes: 'Saved mistakes',
    noSavedMistakes: 'Mistakes from finished tests will appear here.',
    retryLater: 'Retry these mistakes in Test',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    language: 'Language'
  },
  ru: {
    appSubtitle: 'Изучение английского',
    topics: 'Темы',
    test: 'Тест',
    profile: 'Профиль',
    leaderboard: 'Лидерборд',
    practice: 'Практика',
    yourProgress: 'Ваш прогресс',
    vocabulary: 'Слова',
    wordsForTopic: 'Слова этой темы',
    backToTopics: 'Назад к темам',
    topicNotFound: 'Тема не найдена',
    topicUnavailable: 'Запрошенная тема недоступна.',
    listen: 'Слушать',
    example: 'Пример',
    speechUnavailable: 'Синтез речи не поддерживается в этом браузере.',
    enterName: 'Введите имя',
    namePlaceholder: 'Ваше имя',
    chooseTopic: 'Тема',
    allTopics: 'Все темы (смешанный)',
    questionCount: 'Количество вопросов',
    fiveQuestions: '5 вопросов',
    tenQuestions: '10 вопросов',
    twentyQuestions: '20 вопросов',
    allQuestions: 'Все вопросы',
    difficulty: 'Сложность',
    easy: 'Лёгкий',
    medium: 'Средний',
    hard: 'Сложный',
    startTest: 'Начать тест',
    loading: 'Загрузка...',
    saving: 'Сохранение...',
    setupTitle: 'Быстрый тест',
    setupCopy: 'Выберите тему, количество и сложность перед началом.',
    nameRequired: 'Введите имя перед началом теста.',
    noQuestions: 'Для этих настроек пока нет активных вопросов.',
    noFormats: 'В этой теме пока нет всех форматов выбранной сложности. Использованы доступные форматы.',
    couldNotLoadQuestions: 'Не удалось загрузить вопросы.',
    couldNotSubmit: 'Не удалось отправить тест.',
    testMessage: 'Сообщение теста',
    question: 'Вопрос',
    previous: 'Назад',
    next: 'Далее',
    finishTest: 'Завершить тест',
    back: 'Назад',
    answered: 'отвечено',
    typeAnswer: 'Введите ответ',
    answerPlaceholder: 'Напишите перевод',
    blankPlaceholder: 'Пропущенное слово',
    pressEnter: 'Нажмите Enter, чтобы продолжить',
    chooseAnswer: 'Выберите ответ, чтобы продолжить.',
    writeAnswer: 'Введите ответ, чтобы продолжить.',
    results: 'Результаты',
    totalQuestions: 'Всего вопросов',
    correctAnswers: 'Правильные ответы',
    incorrectAnswers: 'Ошибки',
    accuracy: 'Точность',
    mistakes: 'Ошибки',
    yourAnswer: 'Ваш ответ',
    correctAnswer: 'Правильный ответ',
    noMistakes: 'Отлично. Ошибок для повтора нет.',
    retryMistakes: 'Повторить ошибки',
    profileHint: 'Посмотрите сохранённую статистику тестов по имени. Авторизацию можно добавить позже без изменения этого сценария.',
    userName: 'Имя пользователя',
    profilePlaceholder: 'Имя из тестов',
    viewProfile: 'Открыть профиль',
    profileNameRequired: 'Введите имя, чтобы посмотреть статистику.',
    profileMessage: 'Сообщение профиля',
    recent: 'Недавние',
    savedResults: 'Сохранённые результаты',
    noResults: 'Пока нет результатов',
    completeTest: 'Пройдите тест, чтобы заполнить профиль.',
    selectedTest: 'Выбранный тест',
    savedMistakes: 'Сохранённые ошибки',
    noSavedMistakes: 'Ошибки завершённых тестов появятся здесь.',
    retryLater: 'Повторить эти ошибки в тесте',
    lightMode: 'Светлая тема',
    darkMode: 'Тёмная тема',
    language: 'Язык'
  },
  kz: {
    appSubtitle: 'Ағылшын тілін үйрену',
    topics: 'Тақырыптар',
    test: 'Тест',
    profile: 'Профиль',
    leaderboard: 'Көшбасшылар',
    practice: 'Жаттығу',
    yourProgress: 'Сіздің прогресіңіз',
    vocabulary: 'Сөздік',
    wordsForTopic: 'Осы тақырыптың сөздері',
    backToTopics: 'Тақырыптарға оралу',
    topicNotFound: 'Тақырып табылмады',
    topicUnavailable: 'Сұралған тақырып қолжетімсіз.',
    listen: 'Тыңдау',
    example: 'Мысал',
    speechUnavailable: 'Бұл браузер сөйлеуді қолдамайды.',
    enterName: 'Атыңызды енгізіңіз',
    namePlaceholder: 'Атыңыз',
    chooseTopic: 'Тақырып',
    allTopics: 'Барлық тақырыптар (аралас)',
    questionCount: 'Сұрақ саны',
    fiveQuestions: '5 сұрақ',
    tenQuestions: '10 сұрақ',
    twentyQuestions: '20 сұрақ',
    allQuestions: 'Барлық сұрақ',
    difficulty: 'Қиындық',
    easy: 'Оңай',
    medium: 'Орташа',
    hard: 'Қиын',
    startTest: 'Тестті бастау',
    loading: 'Жүктелуде...',
    saving: 'Сақталуда...',
    setupTitle: 'Жылдам тест',
    setupCopy: 'Бастамас бұрын тақырыпты, санын және деңгейін таңдаңыз.',
    nameRequired: 'Тестті бастамас бұрын атыңызды енгізіңіз.',
    noQuestions: 'Бұл баптауларға сай белсенді сұрақ жоқ.',
    noFormats: 'Бұл тақырыпта таңдалған деңгейдің барлық форматы жоқ. Қолжетімді форматтар қолданылды.',
    couldNotLoadQuestions: 'Сұрақтарды жүктеу мүмкін болмады.',
    couldNotSubmit: 'Тестті жіберу мүмкін болмады.',
    testMessage: 'Тест хабарламасы',
    question: 'Сұрақ',
    previous: 'Алдыңғы',
    next: 'Келесі',
    finishTest: 'Тестті аяқтау',
    back: 'Артқа',
    answered: 'жауап берілді',
    typeAnswer: 'Жауапты енгізіңіз',
    answerPlaceholder: 'Аударманы жазыңыз',
    blankPlaceholder: 'Қалып кеткен сөз',
    pressEnter: 'Жалғастыру үшін Enter басыңыз',
    chooseAnswer: 'Жалғастыру үшін жауап таңдаңыз.',
    writeAnswer: 'Жалғастыру үшін жауап жазыңыз.',
    results: 'Нәтижелер',
    totalQuestions: 'Барлық сұрақ',
    correctAnswers: 'Дұрыс жауаптар',
    incorrectAnswers: 'Қате жауаптар',
    accuracy: 'Дәлдік',
    mistakes: 'Қателер',
    yourAnswer: 'Сіздің жауабыңыз',
    correctAnswer: 'Дұрыс жауап',
    noMistakes: 'Тамаша. Қайталайтын қате жоқ.',
    retryMistakes: 'Қате сөздерді қайта тапсыру',
    profileHint: 'Тест статистикасын аты бойынша қараңыз. Авторизацияны кейін осы ағымды өзгертпей қосуға болады.',
    userName: 'Пайдаланушы аты',
    profilePlaceholder: 'Тестте қолданған атыңыз',
    viewProfile: 'Профильді көру',
    profileNameRequired: 'Статистиканы көру үшін атыңызды енгізіңіз.',
    profileMessage: 'Профиль хабарламасы',
    recent: 'Соңғы',
    savedResults: 'Сақталған нәтижелер',
    noResults: 'Әзірге нәтиже жоқ',
    completeTest: 'Профильді толтыру үшін тест тапсырыңыз.',
    selectedTest: 'Таңдалған тест',
    savedMistakes: 'Сақталған қателер',
    noSavedMistakes: 'Аяқталған тест қателері осында шығады.',
    retryLater: 'Осы қателерді тестте қайталау',
    lightMode: 'Жарық режим',
    darkMode: 'Қараңғы режим',
    language: 'Тіл'
  }
} as const;

type TranslationKey = keyof typeof dictionaries.en;

type PreferencesContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: (key: TranslationKey) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function initialLanguage(): Language {
  const stored = localStorage.getItem(languageKey);
  return stored === 'kz' || stored === 'ru' || stored === 'en' ? stored : 'en';
}

function initialTheme(): ThemeMode {
  const stored = localStorage.getItem(themeKey);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    localStorage.setItem(languageKey, language);
    document.documentElement.lang = language === 'kz' ? 'kk' : language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem(themeKey, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    theme,
    setTheme: setThemeState,
    t: key => dictionaries[language][key] ?? dictionaries.en[key]
  }), [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used within PreferencesProvider');
  return value;
}

export const languageOptions: Array<{ value: Language; label: string; flag: string }> = [
  { value: 'kz', label: 'Қазақша', flag: '🇰🇿' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇬🇧' }
];
