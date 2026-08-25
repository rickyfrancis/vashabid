import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'learner');
  CREATE TYPE "public"."enum_users_account_status" AS ENUM('active', 'suspended');
  CREATE TYPE "public"."enum_users_ui_locale" AS ENUM('en', 'bn');
  CREATE TYPE "public"."enum_users_support_mode" AS ENUM('en', 'bn', 'both');
  CREATE TYPE "public"."enum_topic_tags_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__topic_tags_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_words_word_type" AS ENUM('noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'phrase', 'idiom');
  CREATE TYPE "public"."enum_words_cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum_words_gender" AS ENUM('der', 'die', 'das');
  CREATE TYPE "public"."enum_words_register" AS ENUM('neutral', 'formal', 'informal', 'slang', 'academic', 'official', 'rude', 'poetic', 'archaic');
  CREATE TYPE "public"."enum_words_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum_words_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__words_v_version_word_type" AS ENUM('noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'phrase', 'idiom');
  CREATE TYPE "public"."enum__words_v_version_cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum__words_v_version_gender" AS ENUM('der', 'die', 'das');
  CREATE TYPE "public"."enum__words_v_version_register" AS ENUM('neutral', 'formal', 'informal', 'slang', 'academic', 'official', 'rude', 'poetic', 'archaic');
  CREATE TYPE "public"."enum__words_v_version_lifecycle_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__words_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"role" "enum_users_role" DEFAULT 'learner' NOT NULL,
  	"account_status" "enum_users_account_status" DEFAULT 'active' NOT NULL,
  	"ui_locale" "enum_users_ui_locale" DEFAULT 'en' NOT NULL,
  	"support_mode" "enum_users_support_mode" DEFAULT 'en' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "topic_tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"english_description" varchar,
  	"bangla_description" varchar,
  	"parent_id" integer,
  	"sort_order" numeric DEFAULT 0,
  	"review_german_reviewed" boolean DEFAULT false,
  	"review_english_reviewed" boolean DEFAULT false,
  	"review_bangla_reviewed" boolean DEFAULT false,
  	"source_attribution" varchar,
  	"source_source_url" varchar,
  	"source_license_name" varchar,
  	"source_license_url" varchar,
  	"source_usage_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_topic_tags_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_topic_tags_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_english_description" varchar,
  	"version_bangla_description" varchar,
  	"version_parent_id" integer,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_review_german_reviewed" boolean DEFAULT false,
  	"version_review_english_reviewed" boolean DEFAULT false,
  	"version_review_bangla_reviewed" boolean DEFAULT false,
  	"version_source_attribution" varchar,
  	"version_source_source_url" varchar,
  	"version_source_license_name" varchar,
  	"version_source_license_url" varchar,
  	"version_source_usage_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__topic_tags_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "words_english_meanings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"meaning" varchar
  );
  
  CREATE TABLE "words_english_common_mistakes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mistake" varchar
  );
  
  CREATE TABLE "words_bangla_meanings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"meaning" varchar
  );
  
  CREATE TABLE "words_bangla_pronunciation_hints" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hint" varchar
  );
  
  CREATE TABLE "words_bangla_common_mistakes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mistake" varchar
  );
  
  CREATE TABLE "words_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"german_sentence" varchar,
  	"english_explanation" varchar,
  	"bangla_explanation" varchar
  );
  
  CREATE TABLE "words" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lemma" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"word_type" "enum_words_word_type",
  	"cefr_level" "enum_words_cefr_level",
  	"gender" "enum_words_gender",
  	"plural_form" varchar,
  	"ipa" varchar,
  	"register" "enum_words_register" DEFAULT 'neutral',
  	"usefulness_score" numeric,
  	"english_explanation" varchar,
  	"bangla_explanation" varchar,
  	"bangla_romanized_helper" varchar,
  	"source_attribution" varchar,
  	"source_source_url" varchar,
  	"source_license_name" varchar,
  	"source_license_url" varchar,
  	"source_usage_notes" varchar,
  	"lifecycle_status" "enum_words_lifecycle_status" DEFAULT 'active',
  	"review_german_reviewed" boolean DEFAULT false,
  	"review_english_reviewed" boolean DEFAULT false,
  	"review_bangla_reviewed" boolean DEFAULT false,
  	"review_audio_reviewed" boolean DEFAULT false,
  	"review_quiz_reviewed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_words_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "words_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topic_tags_id" integer
  );
  
  CREATE TABLE "_words_v_version_english_meanings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"meaning" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_words_v_version_english_common_mistakes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mistake" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_words_v_version_bangla_meanings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"meaning" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_words_v_version_bangla_pronunciation_hints" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hint" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_words_v_version_bangla_common_mistakes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mistake" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_words_v_version_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"german_sentence" varchar,
  	"english_explanation" varchar,
  	"bangla_explanation" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_words_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_lemma" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_word_type" "enum__words_v_version_word_type",
  	"version_cefr_level" "enum__words_v_version_cefr_level",
  	"version_gender" "enum__words_v_version_gender",
  	"version_plural_form" varchar,
  	"version_ipa" varchar,
  	"version_register" "enum__words_v_version_register" DEFAULT 'neutral',
  	"version_usefulness_score" numeric,
  	"version_english_explanation" varchar,
  	"version_bangla_explanation" varchar,
  	"version_bangla_romanized_helper" varchar,
  	"version_source_attribution" varchar,
  	"version_source_source_url" varchar,
  	"version_source_license_name" varchar,
  	"version_source_license_url" varchar,
  	"version_source_usage_notes" varchar,
  	"version_lifecycle_status" "enum__words_v_version_lifecycle_status" DEFAULT 'active',
  	"version_review_german_reviewed" boolean DEFAULT false,
  	"version_review_english_reviewed" boolean DEFAULT false,
  	"version_review_bangla_reviewed" boolean DEFAULT false,
  	"version_review_audio_reviewed" boolean DEFAULT false,
  	"version_review_quiz_reviewed" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__words_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_words_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topic_tags_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"topic_tags_id" integer,
  	"words_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "topic_tags" ADD CONSTRAINT "topic_tags_parent_id_topic_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."topic_tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_topic_tags_v" ADD CONSTRAINT "_topic_tags_v_parent_id_topic_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."topic_tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_topic_tags_v" ADD CONSTRAINT "_topic_tags_v_version_parent_id_topic_tags_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."topic_tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "words_english_meanings" ADD CONSTRAINT "words_english_meanings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "words_english_common_mistakes" ADD CONSTRAINT "words_english_common_mistakes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "words_bangla_meanings" ADD CONSTRAINT "words_bangla_meanings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "words_bangla_pronunciation_hints" ADD CONSTRAINT "words_bangla_pronunciation_hints_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "words_bangla_common_mistakes" ADD CONSTRAINT "words_bangla_common_mistakes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "words_examples" ADD CONSTRAINT "words_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "words_rels" ADD CONSTRAINT "words_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "words_rels" ADD CONSTRAINT "words_rels_topic_tags_fk" FOREIGN KEY ("topic_tags_id") REFERENCES "public"."topic_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v_version_english_meanings" ADD CONSTRAINT "_words_v_version_english_meanings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_words_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v_version_english_common_mistakes" ADD CONSTRAINT "_words_v_version_english_common_mistakes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_words_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v_version_bangla_meanings" ADD CONSTRAINT "_words_v_version_bangla_meanings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_words_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v_version_bangla_pronunciation_hints" ADD CONSTRAINT "_words_v_version_bangla_pronunciation_hints_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_words_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v_version_bangla_common_mistakes" ADD CONSTRAINT "_words_v_version_bangla_common_mistakes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_words_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v_version_examples" ADD CONSTRAINT "_words_v_version_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_words_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v" ADD CONSTRAINT "_words_v_parent_id_words_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."words"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_words_v_rels" ADD CONSTRAINT "_words_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_words_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_words_v_rels" ADD CONSTRAINT "_words_v_rels_topic_tags_fk" FOREIGN KEY ("topic_tags_id") REFERENCES "public"."topic_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topic_tags_fk" FOREIGN KEY ("topic_tags_id") REFERENCES "public"."topic_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_words_fk" FOREIGN KEY ("words_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "topic_tags_slug_idx" ON "topic_tags" USING btree ("slug");
  CREATE INDEX "topic_tags_parent_idx" ON "topic_tags" USING btree ("parent_id");
  CREATE INDEX "topic_tags_updated_at_idx" ON "topic_tags" USING btree ("updated_at");
  CREATE INDEX "topic_tags_created_at_idx" ON "topic_tags" USING btree ("created_at");
  CREATE INDEX "topic_tags__status_idx" ON "topic_tags" USING btree ("_status");
  CREATE INDEX "_topic_tags_v_parent_idx" ON "_topic_tags_v" USING btree ("parent_id");
  CREATE INDEX "_topic_tags_v_version_version_slug_idx" ON "_topic_tags_v" USING btree ("version_slug");
  CREATE INDEX "_topic_tags_v_version_version_parent_idx" ON "_topic_tags_v" USING btree ("version_parent_id");
  CREATE INDEX "_topic_tags_v_version_version_updated_at_idx" ON "_topic_tags_v" USING btree ("version_updated_at");
  CREATE INDEX "_topic_tags_v_version_version_created_at_idx" ON "_topic_tags_v" USING btree ("version_created_at");
  CREATE INDEX "_topic_tags_v_version_version__status_idx" ON "_topic_tags_v" USING btree ("version__status");
  CREATE INDEX "_topic_tags_v_created_at_idx" ON "_topic_tags_v" USING btree ("created_at");
  CREATE INDEX "_topic_tags_v_updated_at_idx" ON "_topic_tags_v" USING btree ("updated_at");
  CREATE INDEX "_topic_tags_v_latest_idx" ON "_topic_tags_v" USING btree ("latest");
  CREATE INDEX "words_english_meanings_order_idx" ON "words_english_meanings" USING btree ("_order");
  CREATE INDEX "words_english_meanings_parent_id_idx" ON "words_english_meanings" USING btree ("_parent_id");
  CREATE INDEX "words_english_common_mistakes_order_idx" ON "words_english_common_mistakes" USING btree ("_order");
  CREATE INDEX "words_english_common_mistakes_parent_id_idx" ON "words_english_common_mistakes" USING btree ("_parent_id");
  CREATE INDEX "words_bangla_meanings_order_idx" ON "words_bangla_meanings" USING btree ("_order");
  CREATE INDEX "words_bangla_meanings_parent_id_idx" ON "words_bangla_meanings" USING btree ("_parent_id");
  CREATE INDEX "words_bangla_pronunciation_hints_order_idx" ON "words_bangla_pronunciation_hints" USING btree ("_order");
  CREATE INDEX "words_bangla_pronunciation_hints_parent_id_idx" ON "words_bangla_pronunciation_hints" USING btree ("_parent_id");
  CREATE INDEX "words_bangla_common_mistakes_order_idx" ON "words_bangla_common_mistakes" USING btree ("_order");
  CREATE INDEX "words_bangla_common_mistakes_parent_id_idx" ON "words_bangla_common_mistakes" USING btree ("_parent_id");
  CREATE INDEX "words_examples_order_idx" ON "words_examples" USING btree ("_order");
  CREATE INDEX "words_examples_parent_id_idx" ON "words_examples" USING btree ("_parent_id");
  CREATE INDEX "words_lemma_idx" ON "words" USING btree ("lemma");
  CREATE UNIQUE INDEX "words_slug_idx" ON "words" USING btree ("slug");
  CREATE INDEX "words_word_type_idx" ON "words" USING btree ("word_type");
  CREATE INDEX "words_cefr_level_idx" ON "words" USING btree ("cefr_level");
  CREATE INDEX "words_lifecycle_status_idx" ON "words" USING btree ("lifecycle_status");
  CREATE INDEX "words_updated_at_idx" ON "words" USING btree ("updated_at");
  CREATE INDEX "words_created_at_idx" ON "words" USING btree ("created_at");
  CREATE INDEX "words__status_idx" ON "words" USING btree ("_status");
  CREATE INDEX "words_rels_order_idx" ON "words_rels" USING btree ("order");
  CREATE INDEX "words_rels_parent_idx" ON "words_rels" USING btree ("parent_id");
  CREATE INDEX "words_rels_path_idx" ON "words_rels" USING btree ("path");
  CREATE INDEX "words_rels_topic_tags_id_idx" ON "words_rels" USING btree ("topic_tags_id");
  CREATE INDEX "_words_v_version_english_meanings_order_idx" ON "_words_v_version_english_meanings" USING btree ("_order");
  CREATE INDEX "_words_v_version_english_meanings_parent_id_idx" ON "_words_v_version_english_meanings" USING btree ("_parent_id");
  CREATE INDEX "_words_v_version_english_common_mistakes_order_idx" ON "_words_v_version_english_common_mistakes" USING btree ("_order");
  CREATE INDEX "_words_v_version_english_common_mistakes_parent_id_idx" ON "_words_v_version_english_common_mistakes" USING btree ("_parent_id");
  CREATE INDEX "_words_v_version_bangla_meanings_order_idx" ON "_words_v_version_bangla_meanings" USING btree ("_order");
  CREATE INDEX "_words_v_version_bangla_meanings_parent_id_idx" ON "_words_v_version_bangla_meanings" USING btree ("_parent_id");
  CREATE INDEX "_words_v_version_bangla_pronunciation_hints_order_idx" ON "_words_v_version_bangla_pronunciation_hints" USING btree ("_order");
  CREATE INDEX "_words_v_version_bangla_pronunciation_hints_parent_id_idx" ON "_words_v_version_bangla_pronunciation_hints" USING btree ("_parent_id");
  CREATE INDEX "_words_v_version_bangla_common_mistakes_order_idx" ON "_words_v_version_bangla_common_mistakes" USING btree ("_order");
  CREATE INDEX "_words_v_version_bangla_common_mistakes_parent_id_idx" ON "_words_v_version_bangla_common_mistakes" USING btree ("_parent_id");
  CREATE INDEX "_words_v_version_examples_order_idx" ON "_words_v_version_examples" USING btree ("_order");
  CREATE INDEX "_words_v_version_examples_parent_id_idx" ON "_words_v_version_examples" USING btree ("_parent_id");
  CREATE INDEX "_words_v_parent_idx" ON "_words_v" USING btree ("parent_id");
  CREATE INDEX "_words_v_version_version_lemma_idx" ON "_words_v" USING btree ("version_lemma");
  CREATE INDEX "_words_v_version_version_slug_idx" ON "_words_v" USING btree ("version_slug");
  CREATE INDEX "_words_v_version_version_word_type_idx" ON "_words_v" USING btree ("version_word_type");
  CREATE INDEX "_words_v_version_version_cefr_level_idx" ON "_words_v" USING btree ("version_cefr_level");
  CREATE INDEX "_words_v_version_version_lifecycle_status_idx" ON "_words_v" USING btree ("version_lifecycle_status");
  CREATE INDEX "_words_v_version_version_updated_at_idx" ON "_words_v" USING btree ("version_updated_at");
  CREATE INDEX "_words_v_version_version_created_at_idx" ON "_words_v" USING btree ("version_created_at");
  CREATE INDEX "_words_v_version_version__status_idx" ON "_words_v" USING btree ("version__status");
  CREATE INDEX "_words_v_created_at_idx" ON "_words_v" USING btree ("created_at");
  CREATE INDEX "_words_v_updated_at_idx" ON "_words_v" USING btree ("updated_at");
  CREATE INDEX "_words_v_latest_idx" ON "_words_v" USING btree ("latest");
  CREATE INDEX "_words_v_rels_order_idx" ON "_words_v_rels" USING btree ("order");
  CREATE INDEX "_words_v_rels_parent_idx" ON "_words_v_rels" USING btree ("parent_id");
  CREATE INDEX "_words_v_rels_path_idx" ON "_words_v_rels" USING btree ("path");
  CREATE INDEX "_words_v_rels_topic_tags_id_idx" ON "_words_v_rels" USING btree ("topic_tags_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_topic_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("topic_tags_id");
  CREATE INDEX "payload_locked_documents_rels_words_id_idx" ON "payload_locked_documents_rels" USING btree ("words_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "topic_tags" CASCADE;
  DROP TABLE "_topic_tags_v" CASCADE;
  DROP TABLE "words_english_meanings" CASCADE;
  DROP TABLE "words_english_common_mistakes" CASCADE;
  DROP TABLE "words_bangla_meanings" CASCADE;
  DROP TABLE "words_bangla_pronunciation_hints" CASCADE;
  DROP TABLE "words_bangla_common_mistakes" CASCADE;
  DROP TABLE "words_examples" CASCADE;
  DROP TABLE "words" CASCADE;
  DROP TABLE "words_rels" CASCADE;
  DROP TABLE "_words_v_version_english_meanings" CASCADE;
  DROP TABLE "_words_v_version_english_common_mistakes" CASCADE;
  DROP TABLE "_words_v_version_bangla_meanings" CASCADE;
  DROP TABLE "_words_v_version_bangla_pronunciation_hints" CASCADE;
  DROP TABLE "_words_v_version_bangla_common_mistakes" CASCADE;
  DROP TABLE "_words_v_version_examples" CASCADE;
  DROP TABLE "_words_v" CASCADE;
  DROP TABLE "_words_v_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_account_status";
  DROP TYPE "public"."enum_users_ui_locale";
  DROP TYPE "public"."enum_users_support_mode";
  DROP TYPE "public"."enum_topic_tags_status";
  DROP TYPE "public"."enum__topic_tags_v_version_status";
  DROP TYPE "public"."enum_words_word_type";
  DROP TYPE "public"."enum_words_cefr_level";
  DROP TYPE "public"."enum_words_gender";
  DROP TYPE "public"."enum_words_register";
  DROP TYPE "public"."enum_words_lifecycle_status";
  DROP TYPE "public"."enum_words_status";
  DROP TYPE "public"."enum__words_v_version_word_type";
  DROP TYPE "public"."enum__words_v_version_cefr_level";
  DROP TYPE "public"."enum__words_v_version_gender";
  DROP TYPE "public"."enum__words_v_version_register";
  DROP TYPE "public"."enum__words_v_version_lifecycle_status";
  DROP TYPE "public"."enum__words_v_version_status";`)
}
