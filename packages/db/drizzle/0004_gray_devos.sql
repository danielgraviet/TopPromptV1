ALTER TABLE "prompts" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE INDEX "prompts_slug_idx" ON "prompts" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_slug_unique" UNIQUE("slug");