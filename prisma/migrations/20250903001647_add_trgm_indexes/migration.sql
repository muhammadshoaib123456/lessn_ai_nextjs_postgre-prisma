-- Enable trigram (safe if already exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indexes for fuzzy search the query planner can actually use
CREATE INDEX IF NOT EXISTS "pres_name_trgm"
  ON "public"."Presentation" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "pres_subject_trgm"
  ON "public"."Presentation" USING GIN (lower("subject") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "pres_grade_trgm"
  ON "public"."Presentation" USING GIN (lower("grade") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "pres_topic_trgm"
  ON "public"."Presentation" USING GIN (lower("topic") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "pres_subtopic_trgm"
  ON "public"."Presentation" USING GIN (lower("sub_topic") gin_trgm_ops);

-- Useful composite (subject + grade filters together)
CREATE INDEX IF NOT EXISTS "pres_subject_grade_idx"
  ON "public"."Presentation"("subject","grade");

-- (Optional) If you previously created a single concatenated trigram index,
-- you can drop it to save space:
-- DROP INDEX IF EXISTS presentation_search_idx;
