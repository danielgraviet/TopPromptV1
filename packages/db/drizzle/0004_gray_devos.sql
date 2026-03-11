-- Add slug column (nullable first to allow backfill)
ALTER TABLE "prompts" ADD COLUMN "slug" text;--> statement-breakpoint

-- Backfill existing rows with a stable slug derived from title + id
UPDATE "prompts"
SET "slug" = LOWER(REGEXP_REPLACE(COALESCE("title", ''), '[^a-z0-9]+', '-', 'g')) || '-' || SUBSTRING("id", 1, 7)
WHERE "slug" IS NULL;--> statement-breakpoint

-- Enforce constraints after backfill
ALTER TABLE "prompts" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompts_slug_idx" ON "prompts" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_slug_unique" UNIQUE("slug");
