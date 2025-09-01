-- CreateTable
CREATE TABLE "public"."Presentation" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "sub_topic" TEXT,
    "thumbnail_alt_text" TEXT,
    "thumbnail" TEXT,
    "presentation_content" TEXT,
    "presentation_view_link" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviews" INTEGER,
    "download_ppt_url" TEXT,
    "download_pdf_url" TEXT,
    "slides_export_link_url" TEXT,
    "meta_description" TEXT,
    "meta_titles" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- Create Indexes
CREATE UNIQUE INDEX "Presentation_slug_key" ON "public"."Presentation"("slug");
CREATE INDEX "Presentation_subject_idx" ON "public"."Presentation"("subject");
CREATE INDEX "Presentation_grade_idx" ON "public"."Presentation"("grade");
CREATE INDEX "Presentation_topic_idx" ON "public"."Presentation"("topic");
CREATE INDEX "Presentation_sub_topic_idx" ON "public"."Presentation"("sub_topic");

-- Enable trigram extension (safe if already exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for fuzzy search
CREATE INDEX IF NOT EXISTS presentation_search_idx
ON "public"."Presentation"
USING gin (
    (coalesce(name,'') || ' ' || coalesce(subject,'') || ' ' || coalesce(grade,'') || ' ' ||
     coalesce(topic,'') || ' ' || coalesce(sub_topic,'') || ' ' || coalesce(presentation_content,''))
    gin_trgm_ops
);
