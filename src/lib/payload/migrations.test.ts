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
