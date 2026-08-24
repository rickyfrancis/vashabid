export interface TopicTagSeed {
  banglaDescription: string
  englishDescription: string
  name: string
  parentSlug: string | null
  slug: string
  sortOrder: number
}

export const topicTagSeeds: readonly TopicTagSeed[] = [
  {
    banglaDescription: 'দৈনন্দিন জীবন ও সাধারণ কাজকর্মের শব্দভাণ্ডার।',
    englishDescription: 'Vocabulary for daily life and everyday activities.',
    name: 'Alltag',
    parentSlug: null,
    slug: 'alltag',
    sortOrder: 10,
  },
  {
    banglaDescription: 'খাবার, পানীয় ও খাওয়াদাওয়া সম্পর্কিত শব্দভাণ্ডার।',
    englishDescription: 'Vocabulary for food, drinks, and eating.',
    name: 'Essen und Trinken',
    parentSlug: 'alltag',
    slug: 'essen-und-trinken',
    sortOrder: 20,
  },
  {
    banglaDescription: 'ভ্রমণ, যাতায়াত ও গন্তব্য সম্পর্কিত শব্দভাণ্ডার।',
    englishDescription: 'Vocabulary for travel, transport, and destinations.',
    name: 'Reisen',
    parentSlug: null,
    slug: 'reisen',
    sortOrder: 30,
  },
  {
    banglaDescription: 'কাজ, পেশা ও পড়াশোনা সম্পর্কিত শব্দভাণ্ডার।',
    englishDescription: 'Vocabulary for work, professions, and study.',
    name: 'Arbeit und Studium',
    parentSlug: null,
    slug: 'arbeit-und-studium',
    sortOrder: 40,
  },
  {
    banglaDescription: 'জার্মান ব্যাকরণের নিয়ম ও ধারণা।',
    englishDescription: 'Rules and concepts used in German grammar.',
    name: 'Grammatik',
    parentSlug: null,
    slug: 'grammatik',
    sortOrder: 50,
  },
]
