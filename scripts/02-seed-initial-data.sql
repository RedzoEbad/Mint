-- Seed initial data for MINT International

-- Users are seeded via scripts/init-db.js to ensure hashed passwords

-- Insert sample companies
INSERT INTO companies (name, contact_person, email, phone, address, country, requirements) VALUES 
('Saudi Construction Co.', 'Ahmed Al-Rashid', 'hr@saudiconstruction.com', '+966-11-1234567', 'Riyadh, Saudi Arabia', 'Saudi Arabia', 'Construction workers, Engineers, Supervisors'),
('Gulf Manufacturing Ltd.', 'Omar Al-Mahmoud', 'recruitment@gulfmanufacturing.com', '+966-13-7654321', 'Dammam, Saudi Arabia', 'Saudi Arabia', 'Factory workers, Technicians, Quality control'),
('Royal Hospitality Group', 'Nadia Al-Zahra', 'jobs@royalhospitality.sa', '+966-12-9876543', 'Jeddah, Saudi Arabia', 'Saudi Arabia', 'Hotel staff, Chefs, Housekeeping');

-- Insert sample workflow stages for demonstration
-- (These would typically be created when a candidate is matched with a company)
