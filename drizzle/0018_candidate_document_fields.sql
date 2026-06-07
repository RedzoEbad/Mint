ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "cnic_front_image" varchar(500);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "cnic_back_image" varchar(500);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "matric_certificate" varchar(500);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "intermediate_certificate" varchar(500);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "diploma_certificate" varchar(500);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "experience_letter" varchar(500);
