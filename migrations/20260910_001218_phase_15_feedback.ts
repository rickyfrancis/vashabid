import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_feedback_content_type" AS ENUM('word', 'grammar-topic', 'scenario');
  CREATE TYPE "public"."enum_feedback_feedback_type" AS ENUM('incorrect-german', 'incorrect-english', 'incorrect-bangla', 'missing-audio', 'bad-example', 'wrong-cefr', 'unclear-explanation', 'usage-suggestion', 'other');
  CREATE TYPE "public"."enum_feedback_submitter_locale" AS ENUM('en', 'bn');
  CREATE TYPE "public"."enum_feedback_status" AS ENUM('new', 'triaged', 'resolved', 'rejected');
  CREATE TABLE "feedback" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"content_type" "enum_feedback_content_type" NOT NULL,
  	"feedback_type" "enum_feedback_feedback_type" NOT NULL,
  	"related_slug" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"email" varchar,
  	"submitter_locale" "enum_feedback_submitter_locale",
  	"status" "enum_feedback_status" DEFAULT 'new' NOT NULL,
  	"admin_notes" varchar,
  	"handled_by_id" integer,
  	"handled_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "feedback_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"words_id" integer,
  	"grammar_topics_id" integer,
  	"scenarios_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "feedback_id" integer;
  ALTER TABLE "feedback" ADD CONSTRAINT "feedback_handled_by_id_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "feedback_rels" ADD CONSTRAINT "feedback_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "feedback_rels" ADD CONSTRAINT "feedback_rels_words_fk" FOREIGN KEY ("words_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "feedback_rels" ADD CONSTRAINT "feedback_rels_grammar_topics_fk" FOREIGN KEY ("grammar_topics_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "feedback_rels" ADD CONSTRAINT "feedback_rels_scenarios_fk" FOREIGN KEY ("scenarios_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "feedback_content_type_idx" ON "feedback" USING btree ("content_type");
  CREATE INDEX "feedback_feedback_type_idx" ON "feedback" USING btree ("feedback_type");
  CREATE INDEX "feedback_related_slug_idx" ON "feedback" USING btree ("related_slug");
  CREATE INDEX "feedback_status_idx" ON "feedback" USING btree ("status");
  CREATE INDEX "feedback_handled_by_idx" ON "feedback" USING btree ("handled_by_id");
  CREATE INDEX "feedback_updated_at_idx" ON "feedback" USING btree ("updated_at");
  CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");
  CREATE INDEX "feedback_rels_order_idx" ON "feedback_rels" USING btree ("order");
  CREATE INDEX "feedback_rels_parent_idx" ON "feedback_rels" USING btree ("parent_id");
  CREATE INDEX "feedback_rels_path_idx" ON "feedback_rels" USING btree ("path");
  CREATE INDEX "feedback_rels_words_id_idx" ON "feedback_rels" USING btree ("words_id");
  CREATE INDEX "feedback_rels_grammar_topics_id_idx" ON "feedback_rels" USING btree ("grammar_topics_id");
  CREATE INDEX "feedback_rels_scenarios_id_idx" ON "feedback_rels" USING btree ("scenarios_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feedback_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_feedback_id_idx" ON "payload_locked_documents_rels" USING btree ("feedback_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feedback" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "feedback_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "feedback" CASCADE;
  DROP TABLE "feedback_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_feedback_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_feedback_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "feedback_id";
  DROP TYPE "public"."enum_feedback_content_type";
  DROP TYPE "public"."enum_feedback_feedback_type";
  DROP TYPE "public"."enum_feedback_submitter_locale";
  DROP TYPE "public"."enum_feedback_status";`)
}
