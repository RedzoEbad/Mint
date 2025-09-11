CREATE TYPE "public"."candidate_status" AS ENUM('active', 'in_process', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."interview_result" AS ENUM('selected', 'rejected', 'pending');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'completed', 'cancelled', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('online', 'in_person', 'phone');--> statement-breakpoint
CREATE TYPE "public"."overall_status" AS ENUM('initiated', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'rejected', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('medical', 'visa', 'protector', 'passport', 'flight');--> statement-breakpoint
CREATE TYPE "public"."salary_payment_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'receptionist', 'process_agent', 'accountant');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('pending', 'completed', 'rejected');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"fresh" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keys" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"hashed_password" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255),
	"phone" varchar(20),
	"address" text,
	"country" varchar(100),
	"requirements" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"father_name" varchar(255),
	"date_of_birth" date,
	"marital_status" varchar(50),
	"religion" varchar(100),
	"passport_no" varchar(50),
	"date_of_issue" date,
	"date_of_expiry" date,
	"place_of_issue" varchar(255),
	"academic_qualifications" text,
	"technical_qualifications" text,
	"languages_known" text[],
	"experience_total" varchar(50),
	"post_applied_for" varchar(255),
	"referred_by" varchar(255),
	"profile_image" varchar(500),
	"cv_file" varchar(500),
	"remarks" text,
	"status" "candidate_status" DEFAULT 'active',
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "candidates_passport_no_unique" UNIQUE("passport_no")
);
--> statement-breakpoint
CREATE TABLE "experience_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"duration" varchar(100),
	"trade" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"company_id" uuid,
	"medical_status" "workflow_status" DEFAULT 'pending',
	"medical_payment_status" "payment_status" DEFAULT 'pending',
	"visa_status" "workflow_status" DEFAULT 'pending',
	"visa_payment_status" "payment_status" DEFAULT 'pending',
	"protector_status" "workflow_status" DEFAULT 'pending',
	"protector_payment_status" "payment_status" DEFAULT 'pending',
	"passport_status" "workflow_status" DEFAULT 'pending',
	"passport_payment_status" "payment_status" DEFAULT 'pending',
	"flight_status" "workflow_status" DEFAULT 'pending',
	"flight_payment_status" "payment_status" DEFAULT 'pending',
	"overall_status" "overall_status" DEFAULT 'initiated',
	"assigned_agent" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"workflow_id" uuid,
	"payment_type" "payment_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SAR',
	"payment_status" "payment_status" DEFAULT 'pending',
	"payment_method" varchar(50),
	"transaction_id" varchar(255),
	"payment_date" timestamp,
	"verified_by" uuid,
	"verification_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"company_id" uuid,
	"interview_type" "interview_type",
	"interview_date" timestamp,
	"interview_status" "interview_status" DEFAULT 'scheduled',
	"feedback" text,
	"result" "interview_result",
	"conducted_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SAR',
	"expense_date" date NOT NULL,
	"created_by" uuid,
	"approved_by" uuid,
	"status" "expense_status" DEFAULT 'pending',
	"receipt_file" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"basic_salary" numeric(10, 2) NOT NULL,
	"allowances" numeric(10, 2) DEFAULT '0',
	"deductions" numeric(10, 2) DEFAULT '0',
	"net_salary" numeric(10, 2) NOT NULL,
	"salary_month" date NOT NULL,
	"payment_status" "salary_payment_status" DEFAULT 'pending',
	"payment_date" timestamp,
	"processed_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(255) NOT NULL,
	"table_name" varchar(100),
	"record_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_details" ADD CONSTRAINT "experience_details_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_assigned_agent_users_id_fk" FOREIGN KEY ("assigned_agent") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_workflow_id_workflow_stages_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_conducted_by_users_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaries" ADD CONSTRAINT "salaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaries" ADD CONSTRAINT "salaries_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_keys_user_id" ON "keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_candidates_status" ON "candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_candidates_created_by" ON "candidates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_workflow_stages_candidate_id" ON "workflow_stages" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_stages_assigned_agent" ON "workflow_stages" USING btree ("assigned_agent");--> statement-breakpoint
CREATE INDEX "idx_payments_candidate_id" ON "payments" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");