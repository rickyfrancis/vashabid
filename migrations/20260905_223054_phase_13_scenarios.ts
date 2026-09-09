import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_scenarios_cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum_scenarios_situation_type" AS ENUM('everyday', 'travel', 'work', 'study', 'health', 'services', 'social');
  CREATE TYPE "public"."enum_scenarios_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__scenarios_v_version_cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum__scenarios_v_version_situation_type" AS ENUM('everyday', 'travel', 'work', 'study', 'health', 'services', 'social');
  CREATE TYPE "public"."enum__scenarios_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "scenarios_english_cultural_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "scenarios_bangla_cultural_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "scenarios_dialogue" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"speaker" varchar,
  	"german_line" varchar,
  	"english_explanation" varchar,
  	"bangla_explanation" varchar
  );
  
  CREATE TABLE "scenarios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"cefr_level" "enum_scenarios_cefr_level",
  	"situation_type" "enum_scenarios_situation_type",
  	"learner_goal" varchar,
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
  	"_status" "enum_scenarios_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "scenarios_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topic_tags_id" integer,
  	"words_id" integer,
  	"grammar_topics_id" integer
  );
  
  CREATE TABLE "_scenarios_v_version_english_cultural_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_scenarios_v_version_bangla_cultural_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_scenarios_v_version_dialogue" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"speaker" varchar,
  	"german_line" varchar,
  	"english_explanation" varchar,
  	"bangla_explanation" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_scenarios_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_cefr_level" "enum__scenarios_v_version_cefr_level",
  	"version_situation_type" "enum__scenarios_v_version_situation_type",
  	"version_learner_goal" varchar,
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
  	"version__status" "enum__scenarios_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_scenarios_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topic_tags_id" integer,
  	"words_id" integer,
  	"grammar_topics_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "scenarios_id" integer;
  ALTER TABLE "scenarios_english_cultural_notes" ADD CONSTRAINT "scenarios_english_cultural_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scenarios_bangla_cultural_notes" ADD CONSTRAINT "scenarios_bangla_cultural_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scenarios_dialogue" ADD CONSTRAINT "scenarios_dialogue_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scenarios_rels" ADD CONSTRAINT "scenarios_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scenarios_rels" ADD CONSTRAINT "scenarios_rels_topic_tags_fk" FOREIGN KEY ("topic_tags_id") REFERENCES "public"."topic_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scenarios_rels" ADD CONSTRAINT "scenarios_rels_words_fk" FOREIGN KEY ("words_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scenarios_rels" ADD CONSTRAINT "scenarios_rels_grammar_topics_fk" FOREIGN KEY ("grammar_topics_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scenarios_v_version_english_cultural_notes" ADD CONSTRAINT "_scenarios_v_version_english_cultural_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_scenarios_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scenarios_v_version_bangla_cultural_notes" ADD CONSTRAINT "_scenarios_v_version_bangla_cultural_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_scenarios_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scenarios_v_version_dialogue" ADD CONSTRAINT "_scenarios_v_version_dialogue_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_scenarios_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scenarios_v" ADD CONSTRAINT "_scenarios_v_parent_id_scenarios_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."scenarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_scenarios_v_rels" ADD CONSTRAINT "_scenarios_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_scenarios_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scenarios_v_rels" ADD CONSTRAINT "_scenarios_v_rels_topic_tags_fk" FOREIGN KEY ("topic_tags_id") REFERENCES "public"."topic_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scenarios_v_rels" ADD CONSTRAINT "_scenarios_v_rels_words_fk" FOREIGN KEY ("words_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scenarios_v_rels" ADD CONSTRAINT "_scenarios_v_rels_grammar_topics_fk" FOREIGN KEY ("grammar_topics_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "scenarios_english_cultural_notes_order_idx" ON "scenarios_english_cultural_notes" USING btree ("_order");
  CREATE INDEX "scenarios_english_cultural_notes_parent_id_idx" ON "scenarios_english_cultural_notes" USING btree ("_parent_id");
  CREATE INDEX "scenarios_bangla_cultural_notes_order_idx" ON "scenarios_bangla_cultural_notes" USING btree ("_order");
  CREATE INDEX "scenarios_bangla_cultural_notes_parent_id_idx" ON "scenarios_bangla_cultural_notes" USING btree ("_parent_id");
  CREATE INDEX "scenarios_dialogue_order_idx" ON "scenarios_dialogue" USING btree ("_order");
  CREATE INDEX "scenarios_dialogue_parent_id_idx" ON "scenarios_dialogue" USING btree ("_parent_id");
  CREATE INDEX "scenarios_title_idx" ON "scenarios" USING btree ("title");
  CREATE UNIQUE INDEX "scenarios_slug_idx" ON "scenarios" USING btree ("slug");
  CREATE INDEX "scenarios_cefr_level_idx" ON "scenarios" USING btree ("cefr_level");
  CREATE INDEX "scenarios_situation_type_idx" ON "scenarios" USING btree ("situation_type");
  CREATE INDEX "scenarios_updated_at_idx" ON "scenarios" USING btree ("updated_at");
  CREATE INDEX "scenarios_created_at_idx" ON "scenarios" USING btree ("created_at");
  CREATE INDEX "scenarios__status_idx" ON "scenarios" USING btree ("_status");
  CREATE INDEX "scenarios_rels_order_idx" ON "scenarios_rels" USING btree ("order");
  CREATE INDEX "scenarios_rels_parent_idx" ON "scenarios_rels" USING btree ("parent_id");
  CREATE INDEX "scenarios_rels_path_idx" ON "scenarios_rels" USING btree ("path");
  CREATE INDEX "scenarios_rels_topic_tags_id_idx" ON "scenarios_rels" USING btree ("topic_tags_id");
  CREATE INDEX "scenarios_rels_words_id_idx" ON "scenarios_rels" USING btree ("words_id");
  CREATE INDEX "scenarios_rels_grammar_topics_id_idx" ON "scenarios_rels" USING btree ("grammar_topics_id");
  CREATE INDEX "_scenarios_v_version_english_cultural_notes_order_idx" ON "_scenarios_v_version_english_cultural_notes" USING btree ("_order");
  CREATE INDEX "_scenarios_v_version_english_cultural_notes_parent_id_idx" ON "_scenarios_v_version_english_cultural_notes" USING btree ("_parent_id");
  CREATE INDEX "_scenarios_v_version_bangla_cultural_notes_order_idx" ON "_scenarios_v_version_bangla_cultural_notes" USING btree ("_order");
  CREATE INDEX "_scenarios_v_version_bangla_cultural_notes_parent_id_idx" ON "_scenarios_v_version_bangla_cultural_notes" USING btree ("_parent_id");
  CREATE INDEX "_scenarios_v_version_dialogue_order_idx" ON "_scenarios_v_version_dialogue" USING btree ("_order");
  CREATE INDEX "_scenarios_v_version_dialogue_parent_id_idx" ON "_scenarios_v_version_dialogue" USING btree ("_parent_id");
  CREATE INDEX "_scenarios_v_parent_idx" ON "_scenarios_v" USING btree ("parent_id");
  CREATE INDEX "_scenarios_v_version_version_title_idx" ON "_scenarios_v" USING btree ("version_title");
  CREATE INDEX "_scenarios_v_version_version_slug_idx" ON "_scenarios_v" USING btree ("version_slug");
  CREATE INDEX "_scenarios_v_version_version_cefr_level_idx" ON "_scenarios_v" USING btree ("version_cefr_level");
  CREATE INDEX "_scenarios_v_version_version_situation_type_idx" ON "_scenarios_v" USING btree ("version_situation_type");
  CREATE INDEX "_scenarios_v_version_version_updated_at_idx" ON "_scenarios_v" USING btree ("version_updated_at");
  CREATE INDEX "_scenarios_v_version_version_created_at_idx" ON "_scenarios_v" USING btree ("version_created_at");
  CREATE INDEX "_scenarios_v_version_version__status_idx" ON "_scenarios_v" USING btree ("version__status");
  CREATE INDEX "_scenarios_v_created_at_idx" ON "_scenarios_v" USING btree ("created_at");
  CREATE INDEX "_scenarios_v_updated_at_idx" ON "_scenarios_v" USING btree ("updated_at");
  CREATE INDEX "_scenarios_v_latest_idx" ON "_scenarios_v" USING btree ("latest");
  CREATE INDEX "_scenarios_v_rels_order_idx" ON "_scenarios_v_rels" USING btree ("order");
  CREATE INDEX "_scenarios_v_rels_parent_idx" ON "_scenarios_v_rels" USING btree ("parent_id");
  CREATE INDEX "_scenarios_v_rels_path_idx" ON "_scenarios_v_rels" USING btree ("path");
  CREATE INDEX "_scenarios_v_rels_topic_tags_id_idx" ON "_scenarios_v_rels" USING btree ("topic_tags_id");
  CREATE INDEX "_scenarios_v_rels_words_id_idx" ON "_scenarios_v_rels" USING btree ("words_id");
  CREATE INDEX "_scenarios_v_rels_grammar_topics_id_idx" ON "_scenarios_v_rels" USING btree ("grammar_topics_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_scenarios_fk" FOREIGN KEY ("scenarios_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_scenarios_id_idx" ON "payload_locked_documents_rels" USING btree ("scenarios_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "scenarios_english_cultural_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scenarios_bangla_cultural_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scenarios_dialogue" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scenarios" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scenarios_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scenarios_v_version_english_cultural_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scenarios_v_version_bangla_cultural_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scenarios_v_version_dialogue" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scenarios_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scenarios_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "scenarios_english_cultural_notes" CASCADE;
  DROP TABLE "scenarios_bangla_cultural_notes" CASCADE;
  DROP TABLE "scenarios_dialogue" CASCADE;
  DROP TABLE "scenarios" CASCADE;
  DROP TABLE "scenarios_rels" CASCADE;
  DROP TABLE "_scenarios_v_version_english_cultural_notes" CASCADE;
  DROP TABLE "_scenarios_v_version_bangla_cultural_notes" CASCADE;
  DROP TABLE "_scenarios_v_version_dialogue" CASCADE;
  DROP TABLE "_scenarios_v" CASCADE;
  DROP TABLE "_scenarios_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_scenarios_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_scenarios_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "scenarios_id";
  DROP TYPE "public"."enum_scenarios_cefr_level";
  DROP TYPE "public"."enum_scenarios_situation_type";
  DROP TYPE "public"."enum_scenarios_status";
  DROP TYPE "public"."enum__scenarios_v_version_cefr_level";
  DROP TYPE "public"."enum__scenarios_v_version_situation_type";
  DROP TYPE "public"."enum__scenarios_v_version_status";`)
}
