-- Seed initial data for MINT International

-- Insert default Super Admin user (password: admin123 - should be changed in production)
INSERT INTO users (email, password_hash, role, full_name, phone) VALUES 
('admin@mintinternational.org', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQq', 'super_admin', 'System Administrator', '+92-300-0000000');

-- Insert sample employee users
INSERT INTO users (email, password_hash, role, full_name, phone) VALUES 
('receptionist@mintinternational.org', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQq', 'receptionist', 'Sarah Ahmed', '+92-300-1111111'),
('agent@mintinternational.org', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQq', 'process_agent', 'Muhammad Ali', '+92-300-2222222'),
('accounts@mintinternational.org', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQq', 'accountant', 'Fatima Khan', '+92-300-3333333');

-- Insert sample companies
INSERT INTO companies (name, contact_person, email, phone, address, country, requirements) VALUES 
('Saudi Construction Co.', 'Ahmed Al-Rashid', 'hr@saudiconstruction.com', '+966-11-1234567', 'Riyadh, Saudi Arabia', 'Saudi Arabia', 'Construction workers, Engineers, Supervisors'),
('Gulf Manufacturing Ltd.', 'Omar Al-Mahmoud', 'recruitment@gulfmanufacturing.com', '+966-13-7654321', 'Dammam, Saudi Arabia', 'Saudi Arabia', 'Factory workers, Technicians, Quality control'),
('Royal Hospitality Group', 'Nadia Al-Zahra', 'jobs@royalhospitality.sa', '+966-12-9876543', 'Jeddah, Saudi Arabia', 'Saudi Arabia', 'Hotel staff, Chefs, Housekeeping');

-- Insert sample workflow stages for demonstration
-- (These would typically be created when a candidate is matched with a company)
