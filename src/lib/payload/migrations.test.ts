import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const migration = readFileSync(
  path.resolve(
    process.cwd(),
    'migrations/20260826_220331_phase_10_related_words.ts',
  ),
  'utf8',
)

const grammarMigration = readFileSync(
  path.resolve(
    process.cwd(),
    'migrations/20260905_114923_phase_12_grammar_topics.ts',
  ),
  'utf8',
)

const grammarTables = [
  'grammar_topics',
  'grammar_topics_rels',
  'grammar_topics_examples',
  'grammar_topics_english_common_mistakes',
  'grammar_topics_bangla_common_mistakes',
  '_grammar_topics_v',
  '_grammar_topics_v_rels',
  '_grammar_topics_v_version_examples',
  '_grammar_topics_v_version_english_common_mistakes',
  '_grammar_topics_v_version_bangla_common_mistakes',
]

describe('Phase 10 related-word migration', () => {
  test('adds indexed self-relationships to current and versioned words', () => {
    expect(migration).toContain(
      'ALTER TABLE "words_rels" ADD COLUMN "words_id" integer',
    )
    expect(migration).toContain(
      'ALTER TABLE "_words_v_rels" ADD COLUMN "words_id" integer',
    )
    expect(migration).toContain('REFERENCES "public"."words"("id")')
    expect(migration).toContain('CREATE INDEX "words_rels_words_id_idx"')
    expect(migration).toContain('CREATE INDEX "_words_v_rels_words_id_idx"')
  })

  test('drops both relationship columns, constraints, and indexes', () => {
    expect(migration).toContain(
      'ALTER TABLE "words_rels" DROP CONSTRAINT "words_rels_words_fk"',
    )
    expect(migration).toContain(
      'ALTER TABLE "_words_v_rels" DROP CONSTRAINT "_words_v_rels_words_fk"',
    )
    expect(migration).toContain('DROP INDEX "words_rels_words_id_idx"')
    expect(migration).toContain('DROP INDEX "_words_v_rels_words_id_idx"')
    expect(migration).toContain(
      'ALTER TABLE "words_rels" DROP COLUMN "words_id"',
    )
    expect(migration).toContain(
      'ALTER TABLE "_words_v_rels" DROP COLUMN "words_id"',
    )
  })
})

describe('Phase 12 grammar topics migration', () => {
  test.each(grammarTables)('creates and drops %s', (table) => {
    expect(grammarMigration).toContain(`CREATE TABLE "${table}"`)
    expect(grammarMigration).toContain(`DROP TABLE "${table}" CASCADE`)
  })

  test('creates a drafts-enabled versioned collection with CEFR enums', () => {
    expect(grammarMigration).toContain(
      'CREATE TYPE "public"."enum_grammar_topics_cefr_level"',
    )
    expect(grammarMigration).toContain(
      'CREATE TYPE "public"."enum_grammar_topics_status"',
    )
    expect(grammarMigration).toContain(
      'CREATE TYPE "public"."enum__grammar_topics_v_version_cefr_level"',
    )
    expect(grammarMigration).toContain(
      'DROP TYPE "public"."enum_grammar_topics_cefr_level"',
    )
  })

  test('links locked documents to the new collection in both directions', () => {
    expect(grammarMigration).toContain(
      'ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "grammar_topics_id" integer',
    )
    expect(grammarMigration).toContain(
      'ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "grammar_topics_id"',
    )
  })

  test('tolerates constraints already removed by the cascading table drops', () => {
    expect(grammarMigration).toContain(
      'DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_grammar_topics_fk"',
    )
    expect(grammarMigration).toContain(
      'DROP INDEX IF EXISTS "payload_locked_documents_rels_grammar_topics_id_idx"',
    )
  })
})
