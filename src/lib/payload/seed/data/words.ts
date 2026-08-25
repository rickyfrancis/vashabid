import type {
  WordRegister,
  WordType,
} from '../../../../../collections/Words'
import type { CefrLevel } from '../../fields'

interface BanglaWordSeed {
  explanation: string
  meaning: string
  pronunciationHint?: string
  reviewed: boolean
  romanizedHelper?: string
}

interface WordExampleSeed {
  banglaExplanation?: string
  englishExplanation: string
  germanSentence: string
}

export interface WordSeed {
  bangla?: BanglaWordSeed
  cefrLevel: CefrLevel
  englishExplanation: string
  englishMeaning: string
  example: WordExampleSeed
  gender?: 'das' | 'der' | 'die'
  ipa?: string
  lemma: string
  pluralForm?: string
  register: WordRegister
  slug: string
  topicSlugs: readonly string[]
  usefulnessScore: number
  wordType: WordType
}

export const wordSeeds: readonly WordSeed[] = [
  {
    bangla: {
      explanation:
        'নির্দিষ্ট সময়ে কারও সঙ্গে দেখা করা বা কোনো সেবা নেওয়ার জন্য ঠিক করা সময়।',
      meaning: 'অ্যাপয়েন্টমেন্ট / নির্ধারিত সময়',
      reviewed: true,
      romanizedHelper: 'appointment / nirdharito shomoy',
    },
    cefrLevel: 'A2',
    englishExplanation:
      'A scheduled time for a meeting, appointment, or official visit.',
    englishMeaning: 'appointment',
    example: {
      banglaExplanation: 'আগামীকাল আমার একটি অ্যাপয়েন্টমেন্ট আছে।',
      englishExplanation: 'I have an appointment tomorrow.',
      germanSentence: 'Ich habe morgen einen Termin.',
    },
    gender: 'der',
    ipa: '/tɛʁˈmiːn/',
    lemma: 'der Termin',
    pluralForm: 'die Termine',
    register: 'neutral',
    slug: 'der-termin',
    topicSlugs: ['alltag'],
    usefulnessScore: 5,
    wordType: 'noun',
  },
  {
    bangla: {
      explanation: 'কোনো কাজ করা বা কোনো কিছু তৈরি করা বোঝাতে ব্যবহৃত হয়।',
      meaning: 'করা / তৈরি করা',
      reviewed: true,
      romanizedHelper: 'kora / toiri kora',
    },
    cefrLevel: 'A1',
    englishExplanation: 'A common verb meaning to do or to make something.',
    englishMeaning: 'to do; to make',
    example: {
      banglaExplanation: 'তুমি আজ কী করছ?',
      englishExplanation: 'What are you doing today?',
      germanSentence: 'Was machst du heute?',
    },
    ipa: '/ˈmaxn̩/',
    lemma: 'machen',
    register: 'neutral',
    slug: 'machen',
    topicSlugs: ['alltag'],
    usefulnessScore: 5,
    wordType: 'verb',
  },
  {
    bangla: {
      explanation: 'খাবার গ্রহণ করা বোঝাতে ব্যবহৃত সাধারণ ক্রিয়া।',
      meaning: 'খাওয়া',
      reviewed: true,
      romanizedHelper: 'khaoa',
    },
    cefrLevel: 'A1',
    englishExplanation: 'The standard verb for consuming food.',
    englishMeaning: 'to eat',
    example: {
      banglaExplanation: 'আমরা একসঙ্গে খাই।',
      englishExplanation: 'We eat together.',
      germanSentence: 'Wir essen zusammen.',
    },
    ipa: '/ˈɛsn̩/',
    lemma: 'essen',
    register: 'neutral',
    slug: 'essen',
    topicSlugs: ['essen-und-trinken'],
    usefulnessScore: 5,
    wordType: 'verb',
  },
  {
    bangla: {
      explanation: 'পানি বা অন্য কোনো পানীয় পান করা বোঝায়।',
      meaning: 'পান করা',
      reviewed: true,
      romanizedHelper: 'pan kora',
    },
    cefrLevel: 'A1',
    englishExplanation: 'The standard verb for consuming a drink.',
    englishMeaning: 'to drink',
    example: {
      banglaExplanation: 'আমি পানি পান করি।',
      englishExplanation: 'I drink water.',
      germanSentence: 'Ich trinke Wasser.',
    },
    ipa: '/ˈtʁɪŋkn̩/',
    lemma: 'trinken',
    register: 'neutral',
    slug: 'trinken',
    topicSlugs: ['essen-und-trinken'],
    usefulnessScore: 5,
    wordType: 'verb',
  },
  {
    bangla: {
      explanation: 'ময়দা বা শস্য থেকে তৈরি একটি প্রধান খাবার।',
      meaning: 'রুটি / পাউরুটি',
      pronunciationHint: 'দীর্ঘ “ও” ধ্বনি ব্যবহার করুন।',
      reviewed: false,
      romanizedHelper: 'ruti / pauruti',
    },
    cefrLevel: 'A1',
    englishExplanation: 'Bread as a food; German nouns are capitalized.',
    englishMeaning: 'bread',
    example: {
      banglaExplanation: 'পাউরুটিটি টাটকা।',
      englishExplanation: 'The bread is fresh.',
      germanSentence: 'Das Brot ist frisch.',
    },
    gender: 'das',
    ipa: '/bʁoːt/',
    lemma: 'das Brot',
    pluralForm: 'die Brote',
    register: 'neutral',
    slug: 'das-brot',
    topicSlugs: ['essen-und-trinken'],
    usefulnessScore: 4,
    wordType: 'noun',
  },
  {
    cefrLevel: 'A1',
    englishExplanation: 'To travel from one place to another.',
    englishMeaning: 'to travel',
    example: {
      englishExplanation: 'We are travelling to Berlin.',
      germanSentence: 'Wir reisen nach Berlin.',
    },
    ipa: '/ˈʁaɪ̯zn̩/',
    lemma: 'reisen',
    register: 'neutral',
    slug: 'reisen',
    topicSlugs: ['reisen'],
    usefulnessScore: 4,
    wordType: 'verb',
  },
  {
    cefrLevel: 'A1',
    englishExplanation: 'A railway station where trains arrive and depart.',
    englishMeaning: 'train station',
    example: {
      englishExplanation: 'The train station is nearby.',
      germanSentence: 'Der Bahnhof ist in der Nähe.',
    },
    gender: 'der',
    ipa: '/ˈbaːnhoːf/',
    lemma: 'der Bahnhof',
    pluralForm: 'die Bahnhöfe',
    register: 'neutral',
    slug: 'der-bahnhof',
    topicSlugs: ['reisen'],
    usefulnessScore: 5,
    wordType: 'noun',
  },
  {
    cefrLevel: 'A1',
    englishExplanation: 'To perform work or be employed.',
    englishMeaning: 'to work',
    example: {
      englishExplanation: 'I am working from home today.',
      germanSentence: 'Ich arbeite heute zu Hause.',
    },
    ipa: '/ˈaʁbaɪ̯tn̩/',
    lemma: 'arbeiten',
    register: 'neutral',
    slug: 'arbeiten',
    topicSlugs: ['arbeit-und-studium'],
    usefulnessScore: 5,
    wordType: 'verb',
  },
  {
    cefrLevel: 'A1',
    englishExplanation: 'To gain knowledge or practise a skill.',
    englishMeaning: 'to learn; to study',
    example: {
      englishExplanation: 'She is learning German.',
      germanSentence: 'Sie lernt Deutsch.',
    },
    ipa: '/ˈlɛʁnən/',
    lemma: 'lernen',
    register: 'neutral',
    slug: 'lernen',
    topicSlugs: ['arbeit-und-studium'],
    usefulnessScore: 5,
    wordType: 'verb',
  },
  {
    cefrLevel: 'A1',
    englishExplanation:
      'In grammar, a word such as der, die, das, ein, or eine used with a noun.',
    englishMeaning: 'article (grammar)',
    example: {
      englishExplanation: '“Der” is a definite article.',
      germanSentence: '„Der“ ist ein bestimmter Artikel.',
    },
    gender: 'der',
    ipa: '/ˈaʁtɪkl̩/',
    lemma: 'der Artikel',
    pluralForm: 'die Artikel',
    register: 'neutral',
    slug: 'der-artikel',
    topicSlugs: ['grammatik'],
    usefulnessScore: 4,
    wordType: 'noun',
  },
]
