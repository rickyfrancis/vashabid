import type { CefrLevel } from '../../fields'

export interface GrammarTopicExampleSeed {
  banglaExplanation?: string
  englishExplanation: string
  germanSentence: string
}

export interface GrammarTopicSeed {
  bangla?: {
    commonMistakes?: readonly string[]
    explanation: readonly string[]
    reviewed: boolean
  }
  cefrLevel: CefrLevel
  englishCommonMistakes?: readonly string[]
  englishExplanation: readonly string[]
  examples: readonly GrammarTopicExampleSeed[]
  name: string
  relatedSlugs: readonly string[]
  shortRule: string
  slug: string
  topicSlugs: readonly string[]
}

export const grammarTopicSeeds: readonly GrammarTopicSeed[] = [
  {
    bangla: {
      commonMistakes: [
        'ইংরেজির "the" ভেবে সব বিশেষ্যের আগে একই আর্টিকেল বসানো।',
      ],
      explanation: [
        'জার্মান বিশেষ্যের তিনটি লিঙ্গ আছে এবং প্রতিটির নির্দিষ্ট আর্টিকেল আলাদা: der, die, das।',
        'আর্টিকেল শব্দের অর্থ থেকে অনুমান করা যায় না, তাই শব্দ শেখার সময় আর্টিকেলসহ মুখস্থ করুন।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A1',
    englishCommonMistakes: [
      'Assuming the article matches the English translation rather than the German noun.',
      'Dropping the article when naming a noun in isolation.',
    ],
    englishExplanation: [
      'German nouns carry one of three genders, and each gender has its own definite article: der for masculine, die for feminine, and das for neuter.',
      'The article is not predictable from meaning, so learn every noun together with its article rather than on its own.',
    ],
    examples: [
      {
        banglaExplanation: 'স্টেশনটি পুরুষবাচক, তাই "der" ব্যবহৃত হয়।',
        englishExplanation: 'Bahnhof is masculine, so it takes der.',
        germanSentence: 'Der Bahnhof ist groß.',
      },
      {
        banglaExplanation: 'রুটি ক্লীবলিঙ্গ, তাই "das" ব্যবহৃত হয়।',
        englishExplanation: 'Brot is neuter, so it takes das.',
        germanSentence: 'Das Brot ist frisch.',
      },
    ],
    name: 'Bestimmter Artikel',
    relatedSlugs: ['der-artikel', 'das-brot', 'der-bahnhof'],
    shortRule:
      'Jedes deutsche Substantiv hat ein festes Genus mit dem Artikel der, die oder das.',
    slug: 'bestimmter-artikel',
    topicSlugs: ['grammatik'],
  },
  {
    bangla: {
      explanation: [
        'কর্মকারকে পুরুষবাচক আর্টিকেল der বদলে den হয়; die, das এবং বহুবচন অপরিবর্তিত থাকে।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A1',
    englishCommonMistakes: [
      'Leaving der unchanged after a verb that takes a direct object.',
    ],
    englishExplanation: [
      'The accusative marks the direct object of a sentence: the thing being eaten, bought, or seen.',
      'Only the masculine article changes shape. der becomes den, while die, das, and the plural die stay the same.',
    ],
    examples: [
      {
        banglaExplanation: 'রুটি এখানে কর্ম, কিন্তু das অপরিবর্তিত থাকে।',
        englishExplanation: 'Brot is the direct object, and das is unchanged.',
        germanSentence: 'Ich esse das Brot.',
      },
    ],
    name: 'Der Akkusativ',
    relatedSlugs: ['essen', 'trinken', 'das-brot'],
    shortRule:
      'Im Akkusativ wird aus der ein den, während die und das gleich bleiben.',
    slug: 'der-akkusativ',
    topicSlugs: ['grammatik', 'essen-und-trinken'],
  },
  {
    bangla: {
      explanation: [
        'জার্মান সর্বনাম কর্তা অনুযায়ী বদলায় এবং ক্রিয়ার রূপও সেই অনুযায়ী পরিবর্তিত হয়।',
        'ভদ্র সম্বোধনে Sie সবসময় বড় হাতের অক্ষরে লেখা হয়।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A1',
    englishCommonMistakes: [
      'Using du in formal situations where Sie is expected.',
      'Writing the formal Sie with a lowercase s.',
    ],
    englishExplanation: [
      'Personal pronouns replace a noun that is already known: ich, du, er, sie, es, wir, ihr, and sie.',
      'German separates the informal du from the formal Sie, which is always capitalised.',
    ],
    examples: [
      {
        banglaExplanation: '"wir" বহুবচন কর্তা, তাই ক্রিয়ায় -en যুক্ত হয়।',
        englishExplanation: 'wir is a plural subject, so the verb ends in -en.',
        germanSentence: 'Wir lernen Deutsch.',
      },
    ],
    name: 'Personalpronomen',
    relatedSlugs: ['lernen', 'machen'],
    shortRule:
      'Personalpronomen ersetzen ein bekanntes Substantiv und bestimmen die Verbform.',
    slug: 'personalpronomen',
    topicSlugs: ['grammatik'],
  },
  {
    bangla: {
      explanation: [
        'নিয়মিত ক্রিয়ায় মূল অংশের সঙ্গে -e, -st, -t, -en, -t, -en প্রত্যয় যুক্ত হয়।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A1',
    englishCommonMistakes: [
      'Forgetting the -st ending after du.',
      'Using the English continuous form instead of the simple German present.',
    ],
    englishExplanation: [
      'Regular verbs in the present tense drop the -en of the infinitive and add an ending that matches the subject.',
      'German has no separate continuous form, so ich mache covers both I make and I am making.',
    ],
    examples: [
      {
        banglaExplanation: '"du" কর্তার সঙ্গে ক্রিয়ায় -st প্রত্যয় যুক্ত হয়।',
        englishExplanation: 'The subject du takes the -st ending.',
        germanSentence: 'Du machst die Aufgabe.',
      },
    ],
    name: 'Präsens: regelmäßige Verben',
    relatedSlugs: ['machen', 'lernen', 'arbeiten'],
    shortRule:
      'Regelmäßige Verben verlieren die Endung -en und bekommen eine Endung passend zum Subjekt.',
    slug: 'praesens-regelmaessige-verben',
    topicSlugs: ['grammatik'],
  },
  {
    bangla: {
      explanation: [
        'মোডাল ক্রিয়া মূল ক্রিয়ার অর্থ বদলে দেয় এবং মূল ক্রিয়াটি বাক্যের শেষে infinitive রূপে বসে।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A2',
    englishCommonMistakes: [
      'Conjugating the second verb instead of leaving it as an infinitive.',
      'Placing the infinitive next to the modal instead of at the end of the clause.',
    ],
    englishExplanation: [
      'Modal verbs such as können, müssen, wollen, and dürfen change how the main verb is meant: ability, obligation, or intention.',
      'The modal verb is conjugated and the main verb moves to the end of the clause as an infinitive.',
    ],
    examples: [
      {
        banglaExplanation: 'মোডাল ক্রিয়া রূপ বদলায়, মূল ক্রিয়া শেষে থাকে।',
        englishExplanation:
          'The modal is conjugated and essen stays at the end as an infinitive.',
        germanSentence: 'Ich muss jetzt etwas essen.',
      },
    ],
    name: 'Modalverben',
    relatedSlugs: ['machen', 'essen', 'lernen'],
    shortRule:
      'Das Modalverb wird konjugiert und das Hauptverb steht als Infinitiv am Satzende.',
    slug: 'modalverben',
    topicSlugs: ['grammatik'],
  },
  {
    bangla: {
      commonMistakes: [
        'গতি বা অবস্থা পরিবর্তনের ক্রিয়ায় ভুল করে haben ব্যবহার করা।',
      ],
      explanation: [
        'অতীতের কথা বলতে জার্মানে সাধারণত Perfekt ব্যবহৃত হয়: সহায়ক ক্রিয়া haben বা sein এবং Partizip II।',
        'গতি বা অবস্থার পরিবর্তন বোঝালে sein ব্যবহৃত হয়, বাকি বেশিরভাগ ক্ষেত্রে haben।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A2',
    englishCommonMistakes: [
      'Using haben with verbs of movement such as reisen or gehen.',
      'Leaving the participle in the middle of the sentence instead of at the end.',
    ],
    englishExplanation: [
      'The Perfekt is the normal way to talk about the past in spoken German. It combines a conjugated haben or sein with a past participle.',
      'Verbs describing movement or a change of state take sein. Most other verbs take haben.',
    ],
    examples: [
      {
        banglaExplanation: 'ভ্রমণ গতিবাচক, তাই সহায়ক ক্রিয়া sein।',
        englishExplanation: 'reisen expresses movement, so it takes sein.',
        germanSentence: 'Ich bin nach Berlin gereist.',
      },
      {
        banglaExplanation: 'এখানে গতি নেই, তাই সহায়ক ক্রিয়া haben।',
        englishExplanation: 'No movement is involved, so arbeiten takes haben.',
        germanSentence: 'Ich habe gestern viel gearbeitet.',
      },
    ],
    name: 'Perfekt mit haben und sein',
    relatedSlugs: ['machen', 'reisen', 'arbeiten'],
    shortRule:
      'Das Perfekt bildet man mit haben oder sein und dem Partizip II am Satzende.',
    slug: 'perfekt-mit-haben-und-sein',
    topicSlugs: ['grammatik'],
  },
  {
    bangla: {
      explanation: [
        'বিচ্ছেদ্য উপসর্গ মূল বাক্যে ক্রিয়া থেকে আলাদা হয়ে বাক্যের শেষে চলে যায়।',
      ],
      reviewed: false,
    },
    cefrLevel: 'A2',
    englishCommonMistakes: [
      'Keeping the prefix attached to the verb in a main clause.',
      'Looking the verb up without its prefix and missing the real meaning.',
    ],
    englishExplanation: [
      'Separable verbs are built from a prefix and a base verb, such as aufstehen or anfangen. The prefix carries much of the meaning.',
      'In a main clause the prefix detaches and moves to the very end, while the base verb stays in second position.',
    ],
    examples: [
      {
        englishExplanation:
          'The prefix an detaches from anfangen and closes the sentence.',
        germanSentence: 'Ich fange um acht Uhr mit der Arbeit an.',
      },
    ],
    name: 'Trennbare Verben',
    relatedSlugs: ['arbeiten', 'machen'],
    shortRule:
      'Im Hauptsatz trennt sich die Vorsilbe vom Verb und steht am Satzende.',
    slug: 'trennbare-verben',
    topicSlugs: ['grammatik', 'arbeit-und-studium'],
  },
  {
    bangla: {
      explanation: [
        'সম্বন্ধবাচক বাক্যাংশ বিশেষ্য সম্পর্কে বাড়তি তথ্য দেয় এবং এতে ক্রিয়া বাক্যাংশের শেষে বসে।',
      ],
      reviewed: true,
    },
    cefrLevel: 'B1',
    englishCommonMistakes: [
      'Keeping English word order and leaving the verb in second position.',
      'Omitting the comma before the relative clause.',
    ],
    englishExplanation: [
      'Relative clauses add information about a noun without starting a new sentence. The relative pronoun agrees with the gender and number of that noun.',
      'A relative clause is a subordinate clause, so its conjugated verb moves to the end and a comma separates it from the main clause.',
    ],
    examples: [
      {
        banglaExplanation: 'সম্বন্ধবাচক বাক্যাংশে ক্রিয়া শেষে বসে।',
        englishExplanation:
          'The verb habe moves to the end of the relative clause.',
        germanSentence: 'Der Termin, den ich gebucht habe, ist morgen.',
      },
    ],
    name: 'Relativsätze',
    relatedSlugs: ['der-termin', 'der-bahnhof'],
    shortRule:
      'Im Relativsatz steht das konjugierte Verb am Ende und ein Komma trennt ihn vom Hauptsatz.',
    slug: 'relativsaetze',
    topicSlugs: ['grammatik'],
  },
]
