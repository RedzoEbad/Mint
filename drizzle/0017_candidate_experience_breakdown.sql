ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "gcc_experience" varchar(50);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "ksa_experience" varchar(50);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "local_experience" varchar(50);
