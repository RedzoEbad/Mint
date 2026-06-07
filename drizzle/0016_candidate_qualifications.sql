ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "primary_school" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "secondary_school" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "higher_education" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "diploma" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "technical_qualification_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"qualification_name" varchar(255) NOT NULL,
	"institution" varchar(255),
	"year" varchar(20),
	"certificate_file" varchar(500),
	"created_at" timestamp DEFAULT now()
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"file_name" varchar(255),
	"description" text,
	"created_at" timestamp DEFAULT now()
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "technical_qualification_details" ADD CONSTRAINT "technical_qualification_details_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_certificates" ADD CONSTRAINT "candidate_certificates_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
