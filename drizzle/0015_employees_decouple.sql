-- Decouple employees from users: no FK/linkage

DO $$ BEGIN
  ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
  DROP INDEX IF EXISTS uq_employees_user;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE employees
  DROP COLUMN IF EXISTS user_id,
  ADD COLUMN IF NOT EXISTS full_name varchar(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS email varchar(255),
  ADD COLUMN IF NOT EXISTS phone varchar(20);


