import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_grammar_topics_cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum_grammar_topics_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__grammar_topics_v_version_cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum__grammar_topics_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "grammar_topics_english_common_mistakes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mistake" varchar
  );
  
  CREATE TABLE "grammar_topics_bangla_common_mistakes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mistake" varchar
  );
  
  CREATE TABLE "grammar_topics_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"german_sentence" varchar,
  	"english_explanation" varchar,
  	"bangla_explanation" varchar
  );
  
  CREATE TABLE "grammar_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"cefr_level" "enum_grammar_topics_cefr_level",
  	"short_rule" varchar,
  	"english_explanation" jsonb,
  	"bangla_explanation" jsonb,
  	"source_attribution" varchar,
  	"source_source_url" varchar,
  	"source_license_name" varchar,
  	"source_license_url" varchar,
  	"source_usage_notes" varchar,
  	"review_german_reviewed" boolean DEFAULT false,
  	"review_english_reviewed" boolean DEFAULT false,
  	"review_bangla_reviewed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_grammar_topics_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "grammar_topics_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topic_tags_id" integer,
  	"words_id" integer
  );
  
  CREATE TABLE "_grammar_topics_v_version_english_common_mistakes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mistake" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_grammar_topics_v_version_bangla_common_mistakes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mistake" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_grammar_topics_v_version_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"german_sentence" varchar,
  	"english_explanation" varchar,
  	"bangla_explanation" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_grammar_topics_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_cefr_level" "enum__grammar_topics_v_version_cefr_level",
  	"version_short_rule" varchar,
  	"version_english_explanation" jsonb,
  	"version_bangla_explanation" jsonb,
  	"version_source_attribution" varchar,
  	"version_source_source_url" varchar,
  	"version_source_license_name" varchar,
  	"version_source_license_url" varchar,
  	"version_source_usage_notes" varchar,
  	"version_review_german_reviewed" boolean DEFAULT false,
  	"version_review_english_reviewed" boolean DEFAULT false,
  	"version_review_bangla_reviewed" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__grammar_topics_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_grammar_topics_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topic_tags_id" integer,
  	"words_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "grammar_topics_id" integer;
  ALTER TABLE "grammar_topics_english_common_mistakes" ADD CONSTRAINT "grammar_topics_english_common_mistakes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "grammar_topics_bangla_common_mistakes" ADD CONSTRAINT "grammar_topics_bangla_common_mistakes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "grammar_topics_examples" ADD CONSTRAINT "grammar_topics_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "grammar_topics_rels" ADD CONSTRAINT "grammar_topics_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "grammar_topics_rels" ADD CONSTRAINT "grammar_topics_rels_topic_tags_fk" FOREIGN KEY ("topic_tags_id") REFERENCES "public"."topic_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "grammar_topics_rels" ADD CONSTRAINT "grammar_topics_rels_words_fk" FOREIGN KEY ("words_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_grammar_topics_v_version_english_common_mistakes" ADD CONSTRAINT "_grammar_topics_v_version_english_common_mistakes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_grammar_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_grammar_topics_v_version_bangla_common_mistakes" ADD CONSTRAINT "_grammar_topics_v_version_bangla_common_mistakes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_grammar_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_grammar_topics_v_version_examples" ADD CONSTRAINT "_grammar_topics_v_version_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_grammar_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_grammar_topics_v" ADD CONSTRAINT "_grammar_topics_v_parent_id_grammar_topics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."grammar_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_grammar_topics_v_rels" ADD CONSTRAINT "_grammar_topics_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_grammar_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_grammar_topics_v_rels" ADD CONSTRAINT "_grammar_topics_v_rels_topic_tags_fk" FOREIGN KEY ("topic_tags_id") REFERENCES "public"."topic_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_grammar_topics_v_rels" ADD CONSTRAINT "_grammar_topics_v_rels_words_fk" FOREIGN KEY ("words_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "grammar_topics_english_common_mistakes_order_idx" ON "grammar_topics_english_common_mistakes" USING btree ("_order");
  CREATE INDEX "grammar_topics_english_common_mistakes_parent_id_idx" ON "grammar_topics_english_common_mistakes" USING btree ("_parent_id");
  CREATE INDEX "grammar_topics_bangla_common_mistakes_order_idx" ON "grammar_topics_bangla_common_mistakes" USING btree ("_order");
  CREATE INDEX "grammar_topics_bangla_common_mistakes_parent_id_idx" ON "grammar_topics_bangla_common_mistakes" USING btree ("_parent_id");
  CREATE INDEX "grammar_topics_examples_order_idx" ON "grammar_topics_examples" USING btree ("_order");
  CREATE INDEX "grammar_topics_examples_parent_id_idx" ON "grammar_topics_examples" USING btree ("_parent_id");
  CREATE INDEX "grammar_topics_name_idx" ON "grammar_topics" USING btree ("name");
  CREATE UNIQUE INDEX "grammar_topics_slug_idx" ON "grammar_topics" USING btree ("slug");
  CREATE INDEX "grammar_topics_cefr_level_idx" ON "grammar_topics" USING btree ("cefr_level");
  CREATE INDEX "grammar_topics_updated_at_idx" ON "grammar_topics" USING btree ("updated_at");
  CREATE INDEX "grammar_topics_created_at_idx" ON "grammar_topics" USING btree ("created_at");
  CREATE INDEX "grammar_topics__status_idx" ON "grammar_topics" USING btree ("_status");
  CREATE INDEX "grammar_topics_rels_order_idx" ON "grammar_topics_rels" USING btree ("order");
  CREATE INDEX "grammar_topics_rels_parent_idx" ON "grammar_topics_rels" USING btree ("parent_id");
  CREATE INDEX "grammar_topics_rels_path_idx" ON "grammar_topics_rels" USING btree ("path");
  CREATE INDEX "grammar_topics_rels_topic_tags_id_idx" ON "grammar_topics_rels" USING btree ("topic_tags_id");
  CREATE INDEX "grammar_topics_rels_words_id_idx" ON "grammar_topics_rels" USING btree ("words_id");
  CREATE INDEX "_grammar_topics_v_version_english_common_mistakes_order_idx" ON "_grammar_topics_v_version_english_common_mistakes" USING btree ("_order");
  CREATE INDEX "_grammar_topics_v_version_english_common_mistakes_parent_id_idx" ON "_grammar_topics_v_version_english_common_mistakes" USING btree ("_parent_id");
  CREATE INDEX "_grammar_topics_v_version_bangla_common_mistakes_order_idx" ON "_grammar_topics_v_version_bangla_common_mistakes" USING btree ("_order");
  CREATE INDEX "_grammar_topics_v_version_bangla_common_mistakes_parent_id_idx" ON "_grammar_topics_v_version_bangla_common_mistakes" USING btree ("_parent_id");
  CREATE INDEX "_grammar_topics_v_version_examples_order_idx" ON "_grammar_topics_v_version_examples" USING btree ("_order");
  CREATE INDEX "_grammar_topics_v_version_examples_parent_id_idx" ON "_grammar_topics_v_version_examples" USING btree ("_parent_id");
  CREATE INDEX "_grammar_topics_v_parent_idx" ON "_grammar_topics_v" USING btree ("parent_id");
  CREATE INDEX "_grammar_topics_v_version_version_name_idx" ON "_grammar_topics_v" USING btree ("version_name");
  CREATE INDEX "_grammar_topics_v_version_version_slug_idx" ON "_grammar_topics_v" USING btree ("version_slug");
  CREATE INDEX "_grammar_topics_v_version_version_cefr_level_idx" ON "_grammar_topics_v" USING btree ("version_cefr_level");
  CREATE INDEX "_grammar_topics_v_version_version_updated_at_idx" ON "_grammar_topics_v" USING btree ("version_updated_at");
  CREATE INDEX "_grammar_topics_v_version_version_created_at_idx" ON "_grammar_topics_v" USING btree ("version_created_at");
  CREATE INDEX "_grammar_topics_v_version_version__status_idx" ON "_grammar_topics_v" USING btree ("version__status");
  CREATE INDEX "_grammar_topics_v_created_at_idx" ON "_grammar_topics_v" USING btree ("created_at");
  CREATE INDEX "_grammar_topics_v_updated_at_idx" ON "_grammar_topics_v" USING btree ("updated_at");
  CREATE INDEX "_grammar_topics_v_latest_idx" ON "_grammar_topics_v" USING btree ("latest");
  CREATE INDEX "_grammar_topics_v_rels_order_idx" ON "_grammar_topics_v_rels" USING btree ("order");
  CREATE INDEX "_grammar_topics_v_rels_parent_idx" ON "_grammar_topics_v_rels" USING btree ("parent_id");
  CREATE INDEX "_grammar_topics_v_rels_path_idx" ON "_grammar_topics_v_rels" USING btree ("path");
  CREATE INDEX "_grammar_topics_v_rels_topic_tags_id_idx" ON "_grammar_topics_v_rels" USING btree ("topic_tags_id");
  CREATE INDEX "_grammar_topics_v_rels_words_id_idx" ON "_grammar_topics_v_rels" USING btree ("words_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_grammar_topics_fk" FOREIGN KEY ("grammar_topics_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_grammar_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("grammar_topics_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "grammar_topics_english_common_mistakes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "grammar_topics_bangla_common_mistakes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "grammar_topics_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "grammar_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "grammar_topics_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_grammar_topics_v_version_english_common_mistakes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_grammar_topics_v_version_bangla_common_mistakes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_grammar_topics_v_version_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_grammar_topics_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_grammar_topics_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "grammar_topics_english_common_mistakes" CASCADE;
  DROP TABLE "grammar_topics_bangla_common_mistakes" CASCADE;
  DROP TABLE "grammar_topics_examples" CASCADE;
  DROP TABLE "grammar_topics" CASCADE;
  DROP TABLE "grammar_topics_rels" CASCADE;
  DROP TABLE "_grammar_topics_v_version_english_common_mistakes" CASCADE;
  DROP TABLE "_grammar_topics_v_version_bangla_common_mistakes" CASCADE;
  DROP TABLE "_grammar_topics_v_version_examples" CASCADE;
  DROP TABLE "_grammar_topics_v" CASCADE;
  DROP TABLE "_grammar_topics_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_grammar_topics_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_grammar_topics_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "grammar_topics_id";
  DROP TYPE "public"."enum_grammar_topics_cefr_level";
  DROP TYPE "public"."enum_grammar_topics_status";
  DROP TYPE "public"."enum__grammar_topics_v_version_cefr_level";
  DROP TYPE "public"."enum__grammar_topics_v_version_status";`)
}
