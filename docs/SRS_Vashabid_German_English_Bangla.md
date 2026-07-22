# Software Requirements Specification: Vashabid

## Product Vision

Vashabid is a German learning application for English and Bangla speakers. The target language is German. The learner support languages are English and Bangla, so users can learn German through either English, Bangla, or both.

The app should not behave like a simple bilingual dictionary. It should work as a structured German learning system with vocabulary, grammar, pronunciation, translation, real-life scenarios, AI roleplay, and spaced review.

## Core Language Scope

### Target Language

- **German:** `de`, with Standard German as the default learning target.
- Primary German locale for audio, spelling, and examples: `de-DE`.
- Optional future variants: `de-AT` for Austrian German and `de-CH` for Swiss German where content justifies the difference.

### Learner Support Languages

- **English:** `en`.
- **Bangla/Bengali:** `bn`, with Bangladeshi Bangla content style preferred where regional wording matters. The UI should display this option as `বাংলা`.

### Language Preference Rules

- During onboarding, the user must select a primary support language: English or Bangla.
- The user may enable a secondary support language, allowing side-by-side English and Bangla explanations.
- The app must allow users to switch the support language at any time from account settings.
- German content must remain visible as the learning target even when explanations, hints, translations, and grammar notes are shown in English or Bangla.
- If a Bangla translation or explanation is missing, the app must either show an approved English fallback or mark the Bangla content as pending review, depending on admin configuration.

## User Types

### Learner

A learner is an English or Bangla speaker learning German for daily life, study, work, immigration, exams, or personal development.

Learners can:

- Choose English, Bangla, or both as explanation languages.
- Learn German words, phrases, grammar, and real-world dialogues.
- Save words and phrases to a personal learning queue.
- Review saved items through spaced repetition.
- Practice speaking and roleplay with an AI tutor.
- Translate German text into English or Bangla, or translate from English/Bangla into German.

### Admin / Content Editor

An admin creates, reviews, localizes, and publishes German learning content.

Admins can:

- Add German vocabulary and grammar content.
- Review AI-generated German, English, and Bangla content before publishing.
- Manage CEFR levels, examples, audio, media, and scenario content.
- Moderate learner feedback and correction suggestions.

### AI Tutor / AI Copilot

The AI tutor supports learners inside the app. The AI copilot supports admins inside Payload CMS.

The AI must:

- Keep German as the target language.
- Explain in the learner's selected support language.
- Avoid mixing English and Bangla unless the user has enabled both.
- Clearly separate direct translation, grammar explanation, usage note, and cultural context.
- Respect CEFR level constraints when generating examples and exercises.

## CEFR Learning Framework

All German learning content must be tagged by CEFR level:

- A1: Beginner survival German.
- A2: Basic daily communication.
- B1: Independent everyday German.
- B2: Work, study, and complex situations.
- C1: Academic, professional, and nuanced German.
- C2: Near-native precision and stylistic control.

Each word, sentence, grammar topic, scenario, quiz, and roleplay must have a CEFR level field. Where appropriate, content may include a minimum level and a recommended level.

## Phase 1: Foundation, Multilingual Knowledge Base, and Core Learning UX

### 1.1 The Ultimate German Word Detail Page

This is the heart of the app. It must be more comprehensive than a standard dictionary and should function as a cognitive map of a German word.

Each German word detail page must support English and Bangla learner explanations.

#### Core Word Identity

Each word page must include:

- German lemma.
- Word type, such as noun, verb, adjective, adverb, preposition, conjunction, phrase, or idiom.
- CEFR level.
- Frequency or usefulness rating.
- Thematic tags, such as family, work, immigration, university, health, travel, shopping, or government office.
- Register, such as neutral, formal, informal, slang, academic, official, rude, poetic, or archaic.

#### German Linguistic Properties

The page must include German-specific language data:

- IPA pronunciation.
- Standard German audio.
- Slow audio and natural-speed audio.
- Regional audio controls for `de-DE`, `de-AT`, and `de-CH` when those pronunciation variants are available.
- Noun gender: der, die, das.
- Plural form.
- Case forms where useful: nominative, accusative, dative, genitive.
- Verb conjugation tables for present, past, perfect, imperative, subjunctive, and participle forms where relevant.
- Verb properties: separable prefix, inseparable prefix, auxiliary verb, reflexive use, transitivity, and common preposition patterns.
- Adjective declension patterns where relevant.
- Dynamic morphology matrices covering verb conjugations, noun declensions, cases, and article/adjective gender agreement.
- Common compounds and word family members.
- Etymology and root notes when useful for memory.

#### Learner Explanation Layer

For every important field, the app must support:

- English explanation.
- Bangla explanation.
- Optional side-by-side English and Bangla mode.
- Beginner-friendly grammar explanation.
- Literal translation where helpful.
- Natural translation where helpful.
- Cultural or usage context.

Example structure for a word page:

- German word: `der Termin`.
- English meaning: appointment.
- Bangla meaning: অ্যাপয়েন্টমেন্ট / নির্ধারিত সময়.
- German example: `Ich habe morgen einen Termin beim Arzt.`
- English explanation: This means you have an appointment with the doctor tomorrow.
- Bangla explanation: এর অর্থ, আগামীকাল আপনার ডাক্তারের সঙ্গে একটি অ্যাপয়েন্টমেন্ট আছে।

#### Bangla-Specific Learning Support

Bangla-speaking learners often need explanations that are not just direct translations from English. The app must include Bangla-native learning aids:

- Bangla explanations written naturally, not word-for-word English translations.
- Bangla pronunciation support for difficult German sounds, such as `ch`, `ü`, `ö`, `ä`, `r`, and final consonants.
- Notes for German concepts that do not map cleanly to Bangla, such as grammatical gender, articles, cases, and verb position.
- Common Bangla-speaker mistakes, such as missing articles, incorrect gender, word order errors, and difficulty with formal `Sie` versus informal `du`.
- Optional romanized Bangla support for search and onboarding help, but the main Bangla content must use Bangla script.

#### English-Specific Learning Support

English-speaking learners must receive explanations that address typical English-to-German issues:

- False friends between German and English.
- Word order differences.
- Modal verbs and separable verbs.
- Articles and gender.
- Case usage.
- Preposition traps.

#### Semantic Mapping

Each word page must include:

- Synonyms.
- Antonyms.
- Related words.
- Hypernyms and hyponyms where useful.
- Collocations.
- Common phrases.
- Idiomatic uses.
- Confusing similar words.

For example, `wissen` and `kennen` must be linked and explained clearly in English and Bangla.

#### Contextual Proofs

Each word page should include real contextual examples:

- Short German sentences across difficulty levels.
- Real-life dialogue examples.
- Public-domain, licensed, or properly embedded media examples only.
- Licensed, public-domain, or properly embedded snippets from movies, songs, and literature that demonstrate the word in natural use.
- Media clips must not be scraped or stored unless licensing permits it.
- Each example must have English and Bangla explanations.

#### Embedded Micro-Interactions

Each word page must include small learning interactions:

- Quick meaning check.
- Fill-in-the-blank exercise.
- Article/gender quiz for nouns.
- Case quiz where relevant.
- Listening recognition quiz.
- Example sentence reorder exercise.
- An inline reinforcement quiz at the end of the page to help the learner retain the word immediately.
- Add to learning queue button.

### 1.2 Smart Translator and Sentence Mining Tool

The translator must help users learn German, not only convert text.

#### Translation Directions

The translator must support:

- German to English.
- German to Bangla.
- English to German.
- Bangla to German.
- German to both English and Bangla when side-by-side mode is enabled.

#### Learning-Aware Translation

For pasted text, the app must:

- Detect German words and inflected forms.
- Link known words to the German word detail page.
- Open linked words in a word-detail modal or contextual overlay so the learner can inspect them without leaving the translation.
- Show the root lemma when a user taps an inflected form.
- Explain grammar patterns in the selected support language.
- Highlight words already saved in the user's learning queue.
- Highlight words due for review.

#### Sentence Mining

Users must be able to turn any translated sentence into a flashcard.

The sentence mining flow must allow the user to:

- Save the full sentence.
- Select key German words from the sentence.
- Add a cloze deletion card.
- Save English meaning, Bangla meaning, or both.
- Add audio if available.
- Assign or auto-detect CEFR level.

### 1.3 Intelligent Homepage and Search

The homepage must adapt to the learner's selected explanation language and German level.

#### Search Requirements

The search bar must support:

- German words.
- German inflected forms.
- Inflected-form results must resolve and route the learner to the root German lemma.
- Umlaut-insensitive search, such as `Mädchen`, `Madchen`, and `Maedchen`.
- English meanings.
- Bangla meanings in Bangla script.
- Optional romanized Bangla input.
- Common misspellings.
- Compound word discovery.
- Grammar topic search, such as `dative`, `Dativ`, `case`, `কারক`, or `জার্মান case`.
- CEFR search, such as `A1 verbs`, `B1 writing`, or `A2 German Bangla`.

#### Homepage Sections

The homepage must include:

- Continue learning.
- Due reviews.
- Word of the day.
- Trending German slang.
- German phrase of the day.
- Grammar bite.
- Scenario practice.
- Recommended words by CEFR level.
- Recently searched items.
- Learning queue.

The support language selected by the learner must determine whether explanations appear in English, Bangla, or both.

### 1.4 Onboarding and Learner Profile

The onboarding flow must collect:

- Primary support language: English or Bangla.
- Optional secondary support language.
- Current German level: unknown, A1, A2, B1, B2, C1, or C2.
- Learning goal: daily life, university, work, Ausbildung, exam, immigration, family, travel, or general learning.
- Preferred practice style: vocabulary, grammar, listening, speaking, reading, writing, or mixed.
- Daily study target.

The learner profile must store:

- Support language preference.
- German level.
- Saved words.
- Saved sentences.
- Review history.
- Scenario progress.
- Roleplay history.
- Known words.
- Difficult grammar areas.

## Phase 2: Admin Workspace and AI Orchestration

Payload CMS must act as an AI-assisted multilingual content workstation.

### 2.1 Content Model Requirements

The CMS must support the following collections:

- German words.
- German phrases.
- Example sentences.
- Grammar topics.
- Scenarios.
- Dialogues.
- Quizzes.
- Flashcard templates.
- Audio files.
- Media references.
- Localized UI strings.
- Learner feedback.
- AI generation jobs.
- Content review tasks.

Each content item must separate:

- German source content.
- English learner explanation.
- Bangla learner explanation.
- Metadata such as CEFR level, tags, register, source, review status, and version.

### 2.2 AI Data-Entry Copilot

The admin must be able to enter a German root word or phrase. The AI copilot should generate a draft containing:

- German word identity.
- IPA.
- Audio generation prompt or audio request.
- Noun gender and plural if applicable.
- Verb conjugations if applicable.
- Definitions.
- Etymology and root notes.
- English explanations.
- Bangla explanations.
- Example sentences at multiple CEFR levels.
- At least three example sentences spanning different difficulty or CEFR levels.
- English and Bangla explanations for each example.
- Collocations.
- Synonyms and related words.
- False friends or confusion warnings.
- Common learner mistakes for English speakers.
- Common learner mistakes for Bangla speakers.
- Quiz suggestions.

The AI-generated content must always enter a review queue before publication.

### 2.3 Multilingual Review Workflow

Each item must support independent review states:

- German reviewed.
- English reviewed.
- Bangla reviewed.
- Audio reviewed.
- Quiz reviewed.
- Ready to publish.

The app must not publish learner-facing Bangla content until a Bangla reviewer or admin approves it.

### 2.4 Translation Memory and Glossary Control

The CMS must include a controlled glossary so recurring terms remain consistent.

Examples:

- `der Artikel` should map consistently to the approved English and Bangla grammar terms.
- `Dativ`, `Akkusativ`, `Nominativ`, and `Genitiv` must have consistent support-language labels.
- CEFR level names must be consistent across the app.

The admin must be able to lock specific translations and prevent the AI from changing them casually.

### 2.5 Automated Media Sourcing

The system may integrate with approved APIs for media examples, but all media must be legally safe.

Requirements:

- Admins can search for German word usage examples.
- Approved provider integrations may include services such as PlayPhrase.me or the YouTube API.
- The system can suggest public-domain, licensed, or embeddable media references.
- Where provider capabilities and usage rights permit, the system can suggest approximately five-second clips containing the exact German word for admin approval.
- The system must store source attribution and license metadata.
- Media cannot be stored locally unless the license allows it.
- Admin approval is required before learner-facing publication.

### 2.6 Learner Feedback Moderation

Learners must be able to report:

- Incorrect German.
- Incorrect English explanation.
- Incorrect Bangla explanation.
- Missing audio.
- Bad example sentence.
- Wrong CEFR level.
- Unclear grammar explanation.
- Context or usage suggestion for a word page.

Admins must see these reports in a moderation dashboard with status tracking.

## Phase 3: Scenario Hub, Roleplay, and Review System

### 3.1 Curated German Scenario Hub

The app must include real-world German scenarios grouped by learner goals.

Example scenario categories:

- At the doctor.
- At the pharmacy.
- Opening a bank account.
- Anmeldung and Bürgeramt.
- Ausländerbehörde appointment.
- Renting an apartment.
- Talking to a landlord.
- University office.
- Job interview.
- Mini job or part-time job communication.
- Ordering food.
- Buying a train ticket.
- Calling customer service.
- Writing a formal email.
- German workplace small talk.

Each scenario must include:

- German dialogue.
- English explanation.
- Bangla explanation.
- Vocabulary extraction.
- Extraction of the ten most important vocabulary items, with an option to bulk-add them to the learning queue.
- Grammar notes.
- Cultural notes.
- Audio playback.
- Practice exercises.
- Add selected vocabulary to learning queue.

### 3.2 AI Roleplay Tutor

The learner can tap a Practice button to roleplay with an AI tutor.

The roleplay system must:

- Keep the conversation primarily in German.
- Support voice-based roleplay where voice input and output are technically available.
- Use English or Bangla for hints based on the learner's preference.
- Support beginner mode, where the AI gives more help.
- Support strict mode, where the AI responds naturally in German and corrects mistakes after the learner answers.
- Provide pronunciation feedback where voice input is available.
- Provide a post-practice report.

The post-practice report must include:

- Correct German phrases used.
- Mistakes and corrections.
- New vocabulary.
- Suggested review cards.
- English or Bangla explanation based on preference.

### 3.3 Spaced Review System Using FSRS

The app must include a spaced review system using the Free Spaced Repetition Scheduler algorithm or an equivalent scheduler.

When a learner marks a word or phrase as Learning, the app must add the corresponding review card or cards to the scheduler.

The review system must support multiple card types:

- German to English meaning.
- German to Bangla meaning.
- English to German recall.
- Bangla to German recall.
- Audio to German word recognition.
- Cloze deletion inside German sentences.
- Article/gender recall.
- Case selection.
- Verb conjugation recall.
- Phrase completion.

The review scheduler must track:

- Card difficulty.
- Stability.
- Retrievability.
- Last review time.
- Next due time.
- Review rating.
- Lapse count.
- Support language used during review.

The user dashboard must show:

- Due reviews.
- Review streak.
- A study-streak heat map.
- Vocabulary size.
- Known words by CEFR level.
- Difficult words.
- Difficult grammar topics.
- Progress by scenario category.
- Progress by support language if the user studies with both English and Bangla.

## Phase 4: Discovery Feed and Mobile Learning Loop

Once the core database and review system are reliable, the app may add a discovery feed.

### 4.1 Infinite Vertical Feed

The feed must be mobile-optimized and use full-screen vocabulary or phrase cards.

The feed must include:

- German word or phrase.
- German audio.
- An auto-playing short audio or video snippet showing the item in context when approved media is available, sourced from the word-page media library and governed by the learner's autoplay, accessibility, and data-saving settings.
- CEFR level.
- Short example sentence.
- Learner support explanation in English, Bangla, or both.
- Quick quiz.
- Save to learning queue button.
- Mark as known button.
- Deep dive button linking to the word detail page.

### 4.2 Feed Personalization

The feed algorithm must serve a mix of:

- New German words appropriate to the learner's CEFR level.
- Due review words from the spaced review system.
- Scenario-related vocabulary based on the learner's goals.
- Words connected to recent mistakes.
- High-frequency German words.
- Interest-based words.

### 4.3 Card Behavior

Tapping the card must flip it between its front and back sides.

The front side of a card should show:

- German word or phrase.
- Audio.
- CEFR level.
- Short German example.

The back side should show:

- Meaning in English, Bangla, or both.
- Grammar hint.
- Usage note.
- Quick quiz.
- Add to learning queue.
- Deep dive link.

A persistent action bar must group the Mark as known, Add to learning queue, and Deep dive actions for quick access.

## Phase 5: Grammar Learning System

German grammar must be treated as a structured learning system, not only as notes attached to words.

### 5.1 Grammar Topic Pages

Each grammar topic page must include:

- German topic name.
- English explanation.
- Bangla explanation.
- CEFR level.
- Short rule.
- Examples.
- Common mistakes.
- Practice exercises.
- Related vocabulary.
- Related scenarios.

Important grammar topics include:

- Articles: der, die, das.
- Noun gender.
- Plurals.
- Cases: nominative, accusative, dative, genitive.
- Personal pronouns.
- Possessive articles.
- Modal verbs.
- Separable verbs.
- Verb position.
- Perfect tense.
- Prepositions with cases.
- Adjective endings.
- Subordinate clauses.
- Formal and informal address.

### 5.2 English and Bangla Comparison Notes

The app must include comparison notes explaining why German works differently from English and Bangla.

Examples:

- German nouns have grammatical gender, unlike English and Bangla.
- German uses case marking in articles and pronouns.
- German word order changes in subordinate clauses.
- Bangla often does not require articles, so Bangla speakers need focused practice with German articles.
- English speakers may confuse German present perfect usage with English present perfect usage.

## Phase 6: Writing, Speaking, and Exam Practice

### 6.1 Writing Practice

The app should support German writing tasks by CEFR level.

Writing task types:

- Short message.
- Formal email.
- Complaint message.
- Appointment request.
- Job application message.
- University office message.
- Personal letter.

The AI should provide feedback in the learner's selected support language.

Feedback must include:

- Corrected German version.
- Explanation of mistakes.
- Vocabulary suggestions.
- Grammar notes.
- CEFR-level appropriateness.

### 6.2 Speaking Practice

The app should support voice input where technically available.

Speaking practice must include:

- Repeat-after-me pronunciation practice.
- Dialogue practice.
- Scenario roleplay.
- Short answer prompts.
- Pronunciation feedback.
- Suggested corrections in English or Bangla.

### 6.3 Exam-Oriented Practice

The app may include exam-style practice packs for learners preparing for German exams.

Practice packs may include:

- Reading practice.
- Listening practice.
- Writing practice.
- Speaking prompts.
- Vocabulary by CEFR level.
- Grammar drills.

The app must avoid implying official affiliation with any exam provider unless such affiliation exists.

## Nonfunctional Requirements

### Internationalization and Localization

The app must be built as an internationalized product from the beginning.

Requirements:

- Store UI strings separately from code.
- Use language tags for German, English, and Bangla content.
- Support per-content language metadata.
- Set correct HTML `lang` attributes for screen readers and browser processing.
- Support mixed-language pages where German examples appear inside English or Bangla explanations.
- Use Unicode-safe search, storage, and rendering.
- Ensure Bangla fonts render correctly on mobile and desktop.
- Avoid hard-coded text in the frontend.
- Support future additional learner support languages without rewriting the core content model.

### Accessibility

The app must support:

- Keyboard navigation.
- Screen reader labels.
- Correct language attributes for multilingual content.
- Captions or transcripts for audio/video where possible.
- High-contrast mode.
- Adjustable text size.
- Slow audio playback.

### Performance

The app should feel fast on mobile devices.

Requirements:

- Lazy-load heavy conjugation tables and media.
- Cache word detail pages.
- Use efficient search indexing for German, English, and Bangla.
- Avoid loading both English and Bangla content unless the user has enabled both.
- Preload due review cards.

### Privacy and Safety

The app must:

- Store only necessary learner data.
- Ask consent before using microphone features.
- Clearly explain how voice data is processed.
- Allow users to delete their account and learning history.
- Avoid storing sensitive immigration or personal scenario information unless required and consented.

### AI Safety and Quality

AI-generated content must be treated as a draft until reviewed.

Requirements:

- AI outputs must be reviewed before publication in the main knowledge base.
- AI tutor corrections must be clearly marked as AI feedback.
- The AI must not invent official rules, exam affiliation, legal advice, immigration advice, or medical advice.
- For sensitive scenarios, the app must provide language-learning help only and should recommend official sources for actual decisions.

## Suggested MVP Scope

The first production version should focus on a strong multilingual German learning foundation.

### MVP Features

- Onboarding with English or Bangla support language selection.
- German word detail page with English and Bangla fields.
- Search by German, English, and Bangla.
- A1 and A2 vocabulary database.
- Basic grammar topic pages.
- Sentence mining from translator.
- Learning queue.
- Spaced review system.
- Admin CMS with AI draft generation and human review.
- Basic scenario hub with 10 to 20 real-life German scenarios.

### MVP Content Targets

- 1,000 to 2,000 A1 to A2 German words.
- 100 to 200 common German phrases.
- 30 to 50 core grammar topics.
- 10 to 20 scenarios.
- English and Bangla explanations for all MVP content.
- Audio for high-priority words and phrases.

## Future Expansion

Future phases may add:

- B1 to C2 expansion.
- More German regional variants.
- Community corrections.
- Teacher dashboard.
- Group classrooms.
- Downloadable lessons.
- Offline review mode.
- More support languages.
- Exam-specific learning paths.
- Advanced writing evaluation.
- Advanced speaking evaluation.

## External Standards and Reference Notes

The implementation should use CEFR levels as the primary language proficiency framework. The product should use standard web internationalization practices, including correct language tags and localized text handling. The spaced review system should be implemented using FSRS or an equivalent modern spaced repetition scheduler.
