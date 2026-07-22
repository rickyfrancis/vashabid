# Software Requirements Specification (SRS): "Vashabid"

## Phase 1: The Foundation & Knowledge Base

### 1.1 The "Ultimate" Word Detail Page (The Encyclopedia)

This is the heart of the app. It must be more comprehensive than a standard dictionary, functioning as a complete cognitive map of the word.

- **Linguistic Properties:**
- **Phonetics:** International Phonetic Alphabet (IPA) spelling with regional audio toggles (e.g., Castilian vs. Latin American Spanish).
- **Morphology Matrices:** Dynamic tables showing all verb conjugations, noun declensions, cases, and gender agreements.
- **Etymology & Roots:** Breakdown of prefixes, suffixes, and historical origin to build memory hooks.

- **Semantic Mapping:**
- **Lexical Relations:** Not just synonyms, but antonyms, hypernyms (broader terms), and hyponyms (narrower terms).
- **Collocations:** A list of words it naturally pairs with (e.g., you "commit" a crime, you don't "do" a crime).
- **False Friends Warning:** Alerts the user if the word looks like an English word but means something different (e.g., Spanish _embarazada_ means pregnant, not embarrassed).

- **Contextual Proofs:**
- **Pop Culture / Literary Snippets:** Text and short video/audio clips showing the word used naturally in movies, songs, or literature (public domain or fair use).
- **Register & Tone:** Indicators if the word is slang, formal, academic, or archaic.

- **Embedded Micro-Interactions:**
- Inline mini-quizzes (e.g., a quick fill-in-the-blank) at the bottom of the page to lock the word into memory immediately.

### 1.2 The Smart Translator Tool

- **Context-Aware Translation:** Users paste text, but instead of a flat output, the translation cross-references the app's database.
- **Knowledge Integration:** Any word in the translated text that already exists in your database is hyperlinked. The user can click it to open a modal of the Word Detail Page.
- **"Mine This Sentence":** A feature allowing users to turn the sentence they just translated into a custom learning flashcard.

### 1.3 Intelligent Homepage & Search

- **Fuzzy AI Search:** The search bar must tolerate misspellings and recognize inflected forms. If a user searches the past tense "went," the app routes them to the root lemma "go."
- **Reverse Search:** Users can search by the English meaning, by a specific grammatical topic (e.g., "irregular verbs"), or by CEFR level (A1-C2).
- **Curated Dashboards:** Homepage sections displaying "Word of the Day," "Trending Slang," and "Your Learning Queue."

---

## Phase 2: Admin Workspace & AI Orchestration (The Content Engine)

Building a database of this magnitude manually is a massive bottleneck. The backend (Payload CMS) must act as an AI-assisted workstation.

- **AI Data-Entry Copilot:**
- The admin inputs a single root word.
- The AI auto-generates the IPA, etymology, definitions, conjugation tables, 3 example sentences at varying difficulty levels, and suggests synonyms.
- The admin simply reviews, edits, and clicks "Publish."

- **Automated Media Sourcing:** API integrations (e.g., PlayPhrase.me or YouTube APIs) where the admin types a word, and the system fetches 5-second public video clips containing that exact word for approval.
- **User Feedback Moderation Queue:** A dashboard where admins review "Bug Reports" or "Context Suggestions" submitted by users on the Word Pages.

---

## Phase 3: Scenarios & The Spaced Repetition System (SRS)

### 3.1 Curated Scenario Hub

- **Real-World Dialogues:** Grouped by situation (e.g., "At the Dentist," "Opening a Bank Account").
- **AI Roleplay Integration:** The user can read the dialogue, but can also tap a "Practice" button to have a voice-based roleplay with an AI tutor acting as the dentist or bank teller.
- **Vocabulary Extraction:** Each scenario extracts the top 10 key vocabulary words and allows the user to bulk-add them to their learning queue.

### 3.2 Spaced Repetition System (FSRS Algorithm)

- **Memory Tracking:** When a user marks a word as "Learning," the system uses a Free Spaced Repetition Scheduler (FSRS) algorithm.
- **Review Mechanics:** The word will be pushed back to the user to review just as they are about to forget it (e.g., 1 day later, then 3 days, then 10 days).
- **Analytics:** A user dashboard showing a "heat map" of their study streaks and total vocabulary size broken down by CEFR proficiency levels.

---

## Phase 4: The Discovery Feed (The Reel/Story Interface)

Once the core database is massive and the user profiles are actively tracking memory data, we introduce the dopamine-driven discovery loop.

- **Infinite Vertical Scroll:** A mobile-optimized, full-screen feed of vocabulary cards.
- **Algorithmically Curated:** The feed is not random. It serves a mix of:

1. **New Words:** Tailored to their CEFR level and declared interests.
2. **Review Words:** Words the FSRS algorithm determines they need to review today.

- **The Card Anatomy:**
- **Front:** Word, level, auto-playing video/audio snippet of the word in action (sourced from the Word Page database).
- **Interaction:** Tapping the screen flips the card to reveal the translation, grammar hints, and a quick quiz.
- **Action Bar:** Quick buttons to "Mark as Known," "Add to Learning Queue," or "Deep Dive" (which navigates them directly to the Ultimate Word Page built in Phase 1).
