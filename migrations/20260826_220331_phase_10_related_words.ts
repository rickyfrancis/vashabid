import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "words_rels" ADD COLUMN "words_id" integer;
  ALTER TABLE "_words_v_rels" ADD COLUMN "words_id" integer;
  ALTER TABLE "words_rels" ADD CONSTRAINT "words_rels_words_fk" FOREIGN KEY ("words_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v_rels" ADD CONSTRAINT "_words_v_rels_words_fk" FOREIGN KEY ("words_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "words_rels_words_id_idx" ON "words_rels" USING btree ("words_id");
  CREATE INDEX "_words_v_rels_words_id_idx" ON "_words_v_rels" USING btree ("words_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "words_rels" DROP CONSTRAINT "words_rels_words_fk";
  
  ALTER TABLE "_words_v_rels" DROP CONSTRAINT "_words_v_rels_words_fk";
  
  DROP INDEX "words_rels_words_id_idx";
  DROP INDEX "_words_v_rels_words_id_idx";
  ALTER TABLE "words_rels" DROP COLUMN "words_id";
  ALTER TABLE "_words_v_rels" DROP COLUMN "words_id";`)
}
