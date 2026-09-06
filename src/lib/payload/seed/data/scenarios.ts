import type { SituationType } from '../../../../features/scenarios/constants'
import type { CefrLevel } from '../../fields'

export interface ScenarioDialogueSeed {
  banglaExplanation?: string
  englishExplanation: string
  germanLine: string
  speaker: string
}

export interface ScenarioSeed {
  bangla?: {
    culturalNotes?: readonly string[]
    explanation: readonly string[]
    reviewed: boolean
  }
  cefrLevel: CefrLevel
  dialogue: readonly ScenarioDialogueSeed[]
  englishCulturalNotes?: readonly string[]
  englishExplanation: readonly string[]
  grammarSlugs: readonly string[]
  learnerGoal: string
  situationType: SituationType
  slug: string
  title: string
  topicSlugs: readonly string[]
  wordSlugs: readonly string[]
}

export const scenarioSeeds: readonly ScenarioSeed[] = [
  {
    bangla: {
      culturalNotes: [
        'জার্মানিতে অর্ডার করার সময় "Ich hätte gern" বলা বিনয়ী; শুধু "Ich will" রূঢ় শোনায়।',
      ],
      explanation: [
        'ক্যাফেতে অর্ডার করার সময় প্রথমে অভিবাদন, তারপর "Ich hätte gern" দিয়ে অনুরোধ করুন।',
        'বিল চাইতে "Die Rechnung, bitte" বলাই যথেষ্ট।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A1',
    dialogue: [
      {
        banglaExplanation: 'কর্মী প্রথমে অভিবাদন জানান।',
        englishExplanation: 'The server opens with a standard daytime greeting.',
        germanLine: 'Guten Tag! Was darf es sein?',
        speaker: 'Kellner',
      },
      {
        banglaExplanation:
          '"Ich hätte gern" হলো বিনয়ী অনুরোধের প্রচলিত রূপ।',
        englishExplanation:
          'Ich hätte gern is the polite way to order; it softens the request.',
        germanLine: 'Guten Tag! Ich hätte gern einen Kaffee, bitte.',
        speaker: 'Kundin',
      },
      {
        banglaExplanation: 'সঙ্গে কিছু নেবেন কি না জানতে চাওয়া হচ্ছে।',
        englishExplanation: 'A follow-up offer, using dazu for "with that".',
        germanLine: 'Gern. Möchten Sie ein Brot dazu?',
        speaker: 'Kellner',
      },
      {
        banglaExplanation: 'ধন্যবাদসহ প্রত্যাখ্যান করার ভদ্র উপায়।',
        englishExplanation:
          'Nein, danke politely declines. Die Rechnung, bitte asks for the bill.',
        germanLine: 'Nein, danke. Die Rechnung, bitte.',
        speaker: 'Kundin',
      },
    ],
    englishCulturalNotes: [
      'Greet before ordering. Walking up and naming a drink with no greeting reads as brusque.',
      'Rounding up a euro is normal; large percentage tips are not expected.',
    ],
    englishExplanation: [
      'Ordering in a German café follows a fixed shape: greet, request with Ich hätte gern, respond to any follow-up offer, then ask for the bill.',
      'Keep bitte in the request and danke in the reply. Both do most of the politeness work in this conversation.',
    ],
    grammarSlugs: ['bestimmter-artikel', 'der-akkusativ'],
    learnerGoal:
      'Ich kann in einem Café höflich ein Getränk bestellen und die Rechnung verlangen.',
    situationType: 'everyday',
    slug: 'im-cafe-bestellen',
    title: 'Im Café bestellen',
    topicSlugs: ['alltag', 'essen-und-trinken'],
    wordSlugs: ['das-brot', 'trinken', 'essen'],
  },
  {
    bangla: {
      explanation: [
        'স্টেশনে পথ জিজ্ঞাসা করতে "Entschuldigung" দিয়ে শুরু করুন, তারপর "Wo ist...?" ব্যবহার করুন।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A1',
    dialogue: [
      {
        banglaExplanation: 'অপরিচিত কাউকে থামানোর ভদ্র উপায়।',
        englishExplanation:
          'Entschuldigung is the standard opener for stopping a stranger.',
        germanLine: 'Entschuldigung, wo ist der Bahnhof?',
        speaker: 'Reisender',
      },
      {
        banglaExplanation: 'দিকনির্দেশ দিতে geradeaus এবং links ব্যবহৃত হয়।',
        englishExplanation:
          'Geradeaus means straight ahead; dann links means then left.',
        germanLine: 'Gehen Sie geradeaus und dann links.',
        speaker: 'Passantin',
      },
      {
        banglaExplanation: 'সময় জানতে "Wie lange dauert das?" জিজ্ঞাসা করুন।',
        englishExplanation: 'Asking how long the walk takes.',
        germanLine: 'Wie lange dauert das zu Fuß?',
        speaker: 'Reisender',
      },
      {
        banglaExplanation: 'প্রায় দশ মিনিট — ungefähr মানে "প্রায়"।',
        englishExplanation: 'Ungefähr softens the estimate to "about".',
        germanLine: 'Ungefähr zehn Minuten. Gute Reise!',
        speaker: 'Passantin',
      },
    ],
    englishCulturalNotes: [
      'Use Sie with strangers. Switching to du without invitation sounds over-familiar.',
    ],
    englishExplanation: [
      'Asking for directions works the same way almost everywhere in Germany: open with Entschuldigung, ask Wo ist plus the place, then confirm the detail you actually need.',
      'Directions come back as short imperatives with Sie, so listening for geradeaus, links, and rechts carries most of the meaning.',
    ],
    grammarSlugs: ['bestimmter-artikel', 'personalpronomen'],
    learnerGoal:
      'Ich kann nach dem Weg zum Bahnhof fragen und eine einfache Wegbeschreibung verstehen.',
    situationType: 'travel',
    slug: 'nach-dem-weg-fragen',
    title: 'Nach dem Weg fragen',
    topicSlugs: ['reisen', 'alltag'],
    wordSlugs: ['der-bahnhof', 'reisen'],
  },
  {
    bangla: {
      explanation: [
        'ডাক্তারের সময় নিতে ফোনে "Ich möchte einen Termin" বলুন এবং পছন্দের দিন জানান।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A2',
    dialogue: [
      {
        banglaExplanation: 'ফোন ধরে চেম্বারের নাম বলা হয়।',
        englishExplanation:
          'German practices answer by naming the practice, not with hello.',
        germanLine: 'Praxis Dr. Weber, guten Morgen.',
        speaker: 'Sprechstundenhilfe',
      },
      {
        banglaExplanation: '"Ich möchte" ভদ্র ইচ্ছা প্রকাশ করে।',
        englishExplanation:
          'Ich möchte einen Termin vereinbaren is the fixed phrase for booking.',
        germanLine:
          'Guten Morgen. Ich möchte einen Termin vereinbaren, bitte.',
        speaker: 'Patient',
      },
      {
        banglaExplanation: 'সম্ভাব্য সময় প্রস্তাব করা হচ্ছে।',
        englishExplanation:
          'Ginge es is a polite conditional: would it work for you?',
        germanLine: 'Ginge es am Donnerstag um zehn Uhr?',
        speaker: 'Sprechstundenhilfe',
      },
      {
        banglaExplanation: 'সম্মতি জানিয়ে ধন্যবাদ দেওয়া হচ্ছে।',
        englishExplanation: 'Das passt mir gut accepts the offered slot.',
        germanLine: 'Ja, das passt mir gut. Vielen Dank!',
        speaker: 'Patient',
      },
    ],
    englishCulturalNotes: [
      'Bring your insurance card to every appointment; you will be asked for it at the desk.',
      'Practices often close for a long midday break, so call in the morning.',
    ],
    englishExplanation: [
      'Booking a doctor is a short, scripted phone call. The practice answers with its own name, you state your purpose, and they offer a slot.',
      'The two phrases that carry it are Ich möchte einen Termin vereinbaren and Das passt mir gut.',
    ],
    grammarSlugs: ['modalverben', 'der-akkusativ'],
    learnerGoal:
      'Ich kann telefonisch einen Termin beim Arzt vereinbaren und einen Vorschlag annehmen.',
    situationType: 'health',
    slug: 'termin-beim-arzt',
    title: 'Einen Termin beim Arzt vereinbaren',
    topicSlugs: ['alltag'],
    wordSlugs: ['der-termin', 'machen'],
  },
  {
    bangla: {
      culturalNotes: [
        'জার্মান দোকানে নিজের ব্যাগ আনা স্বাভাবিক; প্লাস্টিক ব্যাগের জন্য আলাদা টাকা লাগে।',
      ],
      explanation: [
        'সুপারমার্কেটে জিনিস খুঁজতে "Wo finde ich...?" ব্যবহার করুন।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A1',
    dialogue: [
      {
        banglaExplanation: '"Wo finde ich" দিয়ে জিনিসের অবস্থান জানতে চাওয়া হয়।',
        englishExplanation: 'Wo finde ich asks where an item is kept.',
        germanLine: 'Entschuldigung, wo finde ich das Brot?',
        speaker: 'Kundin',
      },
      {
        banglaExplanation: 'পেছনে, ডান দিকে — hinten rechts।',
        englishExplanation: 'Hinten rechts places the aisle at the back right.',
        germanLine: 'Das Brot ist hinten rechts.',
        speaker: 'Mitarbeiter',
      },
      {
        banglaExplanation: 'দাম জানতে "Was kostet das?" যথেষ্ট।',
        englishExplanation: 'Was kostet das is the everyday way to ask a price.',
        germanLine: 'Danke. Und was kostet das hier?',
        speaker: 'Kundin',
      },
      {
        banglaExplanation: 'দাম বলার পর কার্ডে দেওয়া যাবে কি না জানানো হয়।',
        englishExplanation:
          'Prices are said with Euro after the number; card payment is confirmed separately.',
        germanLine: 'Zwei Euro. Sie können auch mit Karte zahlen.',
        speaker: 'Mitarbeiter',
      },
    ],
    englishCulturalNotes: [
      'Bag your own groceries, and do it quickly — the checkout moves fast.',
      'Many smaller shops are cash-first, so ask before assuming card payment.',
    ],
    englishExplanation: [
      'A supermarket exchange rarely needs more than two questions: where something is, and what it costs.',
      'Wo finde ich and Was kostet das cover almost every shopping trip on their own.',
    ],
    grammarSlugs: ['bestimmter-artikel', 'praesens-regelmaessige-verben'],
    learnerGoal:
      'Ich kann im Supermarkt nach einem Produkt und nach dem Preis fragen.',
    situationType: 'services',
    slug: 'im-supermarkt-einkaufen',
    title: 'Im Supermarkt einkaufen',
    topicSlugs: ['alltag', 'essen-und-trinken'],
    wordSlugs: ['das-brot', 'essen', 'machen'],
  },
  {
    bangla: {
      explanation: [
        'নতুন সহকর্মীর সঙ্গে পরিচয়ে নিজের নাম ও কাজ সংক্ষেপে বলুন এবং হাত মেলান।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A2',
    dialogue: [
      {
        banglaExplanation: 'নতুন সহকর্মীকে স্বাগত জানানো হচ্ছে।',
        englishExplanation:
          'Willkommen im Team is the standard welcome for a new colleague.',
        germanLine: 'Willkommen im Team! Ich bin Anna.',
        speaker: 'Kollegin',
      },
      {
        banglaExplanation: 'নিজের নাম বলে কাজ শুরুর কথা জানানো হচ্ছে।',
        englishExplanation:
          'Freut mich is the short, natural reply to an introduction.',
        germanLine: 'Freut mich, Anna. Ich heiße Samir und fange heute an.',
        speaker: 'Neuer Kollege',
      },
      {
        banglaExplanation: 'কাজের বিভাগ জানতে চাওয়া হচ্ছে।',
        englishExplanation: 'In welcher Abteilung asks which department.',
        germanLine: 'Schön! In welcher Abteilung arbeiten Sie?',
        speaker: 'Kollegin',
      },
      {
        banglaExplanation: 'উত্তরে বিভাগ ও শেখার আগ্রহ জানানো হচ্ছে।',
        englishExplanation:
          'Answering with the department, then offering a friendly next step.',
        germanLine:
          'Im Marketing. Ich möchte viel lernen. Können wir später sprechen?',
        speaker: 'Neuer Kollege',
      },
    ],
    englishCulturalNotes: [
      'Expect Sie on the first day. Colleagues will offer du when they are ready.',
      'A brief handshake at introduction is still common in German offices.',
    ],
    englishExplanation: [
      'A first-day introduction stays short: name, role, and one question back. Germans generally keep small talk brief at work.',
      'Ich heiße and Freut mich do the introduction; In welcher Abteilung keeps the conversation going.',
    ],
    grammarSlugs: ['personalpronomen', 'trennbare-verben'],
    learnerGoal:
      'Ich kann mich am ersten Arbeitstag vorstellen und nach der Abteilung fragen.',
    situationType: 'work',
    slug: 'sich-im-buero-vorstellen',
    title: 'Sich im Büro vorstellen',
    topicSlugs: ['arbeit-und-studium'],
    wordSlugs: ['arbeiten', 'lernen', 'machen'],
  },
  {
    bangla: {
      explanation: [
        'বিশ্ববিদ্যালয়ে কোর্সে ভর্তি হতে "Ich möchte mich für den Kurs anmelden" বলুন।',
      ],
      reviewed: true,
    },
    cefrLevel: 'B1',
    dialogue: [
      {
        banglaExplanation: 'ছাত্র উপদেষ্টা সহায়তার প্রস্তাব দিচ্ছেন।',
        englishExplanation: 'A standard opening offer of help at a service desk.',
        germanLine: 'Guten Tag, wie kann ich Ihnen helfen?',
        speaker: 'Studienberaterin',
      },
      {
        banglaExplanation:
          '"sich anmelden" একটি বিচ্ছেদ্য ক্রিয়া — উপসর্গ শেষে বসে।',
        englishExplanation:
          'Anmelden is separable, and reflexive here: ich melde mich an.',
        germanLine: 'Ich möchte mich für den Deutschkurs anmelden.',
        speaker: 'Studentin',
      },
      {
        banglaExplanation: 'স্তর নির্ধারণের পরীক্ষার কথা বলা হচ্ছে।',
        englishExplanation:
          'Haben Sie schon asks whether a step has already been completed.',
        germanLine: 'Haben Sie schon den Einstufungstest gemacht?',
        speaker: 'Studienberaterin',
      },
      {
        banglaExplanation: 'গত সপ্তাহে করা হয়েছে — Perfekt রূপ।',
        englishExplanation:
          'The Perfekt with haben reports a completed action: habe gemacht.',
        germanLine: 'Ja, den habe ich letzte Woche gemacht.',
        speaker: 'Studentin',
      },
    ],
    englishCulturalNotes: [
      'Deadlines for course registration are strict and rarely extended.',
      'Bring your student ID and any test results; offices ask for paperwork up front.',
    ],
    englishExplanation: [
      'University service desks expect you to state your business directly. Ich möchte mich für ... anmelden is the phrase that opens almost every registration.',
      'Expect a follow-up question about a prerequisite, usually answered in the Perfekt.',
    ],
    grammarSlugs: [
      'trennbare-verben',
      'modalverben',
      'perfekt-mit-haben-und-sein',
    ],
    learnerGoal:
      'Ich kann mich an der Universität für einen Kurs anmelden und Rückfragen beantworten.',
    situationType: 'study',
    slug: 'kurs-an-der-uni-anmelden',
    title: 'Sich für einen Kurs anmelden',
    topicSlugs: ['arbeit-und-studium'],
    wordSlugs: ['lernen', 'machen', 'der-termin'],
  },
  {
    bangla: {
      explanation: [
        'বন্ধুকে আমন্ত্রণ জানাতে "Hast du am Samstag Zeit?" জিজ্ঞাসা করুন।',
      ],
      reviewed: true,
    },
    cefrLevel: 'A2',
    dialogue: [
      {
        banglaExplanation: 'বন্ধুর সঙ্গে du ব্যবহার করা হয়।',
        englishExplanation:
          'With friends the informal du replaces Sie throughout.',
        germanLine: 'Hast du am Samstag Zeit?',
        speaker: 'Lena',
      },
      {
        banglaExplanation: 'সময় আছে জানিয়ে পাল্টা প্রশ্ন করা হচ্ছে।',
        englishExplanation: 'Was hast du vor asks what the other person plans.',
        germanLine: 'Ja, ich glaube schon. Was hast du vor?',
        speaker: 'Tom',
      },
      {
        banglaExplanation: 'প্রস্তাব দিতে "Wollen wir...?" ব্যবহৃত হয়।',
        englishExplanation:
          'Wollen wir plus an infinitive is the everyday way to suggest doing something together.',
        germanLine: 'Wollen wir zusammen essen gehen?',
        speaker: 'Lena',
      },
      {
        banglaExplanation: 'সানন্দে রাজি হয়ে সময় ঠিক করা হচ্ছে।',
        englishExplanation: 'Gute Idee accepts; then a concrete time is fixed.',
        germanLine: 'Gute Idee! Um sieben Uhr?',
        speaker: 'Tom',
      },
    ],
    englishCulturalNotes: [
      'Invitations are usually made a few days ahead; very short notice can feel inconsiderate.',
      'If you say yes, you are expected to come. Casual cancelling is taken more seriously than in some cultures.',
    ],
    englishExplanation: [
      'Making plans with a friend runs on du and two structures: Hast du ... Zeit? to check availability, and Wollen wir ...? to propose.',
      'Fix a concrete time at the end. German plans tend to get pinned down rather than left open.',
    ],
    grammarSlugs: ['modalverben', 'personalpronomen'],
    learnerGoal:
      'Ich kann eine Freundin oder einen Freund zum Essen einladen und einen Zeitpunkt vereinbaren.',
    situationType: 'social',
    slug: 'freunde-zum-essen-einladen',
    title: 'Freunde zum Essen einladen',
    topicSlugs: ['alltag', 'essen-und-trinken'],
    wordSlugs: ['essen', 'trinken', 'machen'],
  },
  {
    bangla: {
      explanation: [
        'ট্রেনের টিকিট কিনতে গন্তব্য এবং যাওয়া-আসার ধরন জানাতে হয়।',
      ],
      reviewed: false,
    },
    cefrLevel: 'B1',
    dialogue: [
      {
        englishExplanation:
          'Wohin möchten Sie asks for the destination, using the directional wohin.',
        germanLine: 'Guten Tag. Wohin möchten Sie fahren?',
        speaker: 'Mitarbeiterin',
      },
      {
        englishExplanation:
          'Naming the destination with nach, and hin und zurück for a return ticket.',
        germanLine: 'Nach Hamburg, bitte. Hin und zurück.',
        speaker: 'Reisender',
      },
      {
        englishExplanation:
          'Umsteigen means to change trains; the relative clause der um neun Uhr fährt describes which train.',
        germanLine:
          'Es gibt einen Zug, der um neun Uhr fährt. Sie müssen einmal umsteigen.',
        speaker: 'Mitarbeiterin',
      },
      {
        englishExplanation:
          'Confirming, then asking which platform with Von welchem Gleis.',
        germanLine: 'Das ist gut. Von welchem Gleis fährt er ab?',
        speaker: 'Reisender',
      },
    ],
    englishCulturalNotes: [
      'Buy before boarding. Travelling without a valid ticket carries an on-the-spot fine.',
      'Platform numbers change more often than the timetable suggests, so check the board.',
    ],
    englishExplanation: [
      'Buying a train ticket needs three pieces of information: destination, whether it is one-way or return, and when you want to travel.',
      'Staff answer with relative clauses describing which train, so this is a good place to hear Relativsätze in the wild.',
    ],
    grammarSlugs: ['relativsaetze', 'trennbare-verben', 'modalverben'],
    learnerGoal:
      'Ich kann am Schalter eine Zugfahrkarte kaufen und nach dem Gleis fragen.',
    situationType: 'travel',
    slug: 'fahrkarte-am-schalter-kaufen',
    title: 'Eine Fahrkarte am Schalter kaufen',
    topicSlugs: ['reisen'],
    wordSlugs: ['der-bahnhof', 'reisen', 'der-termin'],
  },
]
