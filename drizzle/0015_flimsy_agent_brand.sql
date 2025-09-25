ALTER TABLE "employees" DROP CONSTRAINT "employees_user_id_fkey";
--> statement-breakpoint
DROP INDEX "uq_employees_user";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "full_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "user_id";