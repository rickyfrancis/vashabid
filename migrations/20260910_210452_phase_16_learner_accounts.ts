import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_learner_profiles_primary_support_language" AS ENUM('en', 'bn');
  CREATE TYPE "public"."enum_learner_profiles_secondary_support_language" AS ENUM('en', 'bn');
  CREATE TYPE "public"."enum_learner_profiles_learning_goal" AS ENUM('travel', 'work', 'study', 'exam', 'family', 'culture');
  CREATE TYPE "public"."enum_learner_profiles_practice_style" AS ENUM('vocabulary', 'grammar', 'conversation', 'listening', 'mixed');
  CREATE TYPE "public"."enum_learner_profiles_daily_study_target" AS ENUM('5', '10', '20', '30', '60');
  CREATE TYPE "public"."enum_learner_profiles_german_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TABLE "learner_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"primary_support_language" "enum_learner_profiles_primary_support_language" NOT NULL,
  	"secondary_support_language" "enum_learner_profiles_secondary_support_language",
  	"learning_goal" "enum_learner_profiles_learning_goal" NOT NULL,
  	"practice_style" "enum_learner_profiles_practice_style" NOT NULL,
  	"daily_study_target" "enum_learner_profiles_daily_study_target" NOT NULL,
  	"german_level" "enum_learner_profiles_german_level" NOT NULL,
  	"onboarding_completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learner_profiles_id" integer;
  ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "learner_profiles_user_idx" ON "learner_profiles" USING btree ("user_id");
  CREATE INDEX "learner_profiles_updated_at_idx" ON "learner_profiles" USING btree ("updated_at");
  CREATE INDEX "learner_profiles_created_at_idx" ON "learner_profiles" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_learner_profiles_fk" FOREIGN KEY ("learner_profiles_id") REFERENCES "public"."learner_profiles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_learner_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("learner_profiles_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "learner_profiles" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "learner_profiles" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_learner_profiles_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_learner_profiles_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "learner_profiles_id";
  DROP TYPE IF EXISTS "public"."enum_learner_profiles_primary_support_language";
  DROP TYPE IF EXISTS "public"."enum_learner_profiles_secondary_support_language";
  DROP TYPE IF EXISTS "public"."enum_learner_profiles_learning_goal";
  DROP TYPE IF EXISTS "public"."enum_learner_profiles_practice_style";
  DROP TYPE IF EXISTS "public"."enum_learner_profiles_daily_study_target";
  DROP TYPE IF EXISTS "public"."enum_learner_profiles_german_level";`)
}
