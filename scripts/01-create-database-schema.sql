-- MINT International Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and role management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'receptionist', 'process_agent', 'accountant')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies/Employers table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    country VARCHAR(100),
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates/Applicants table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    date_of_birth DATE,
    marital_status VARCHAR(50),
    religion VARCHAR(100),
    passport_no VARCHAR(50) UNIQUE,
    date_of_issue DATE,
    date_of_expiry DATE,
    place_of_issue VARCHAR(255),
    academic_qualifications TEXT,
    technical_qualifications TEXT,
    languages_known TEXT[], -- Array of languages
    experience_total VARCHAR(50),
    post_applied_for VARCHAR(255),
    referred_by VARCHAR(255),
    profile_image VARCHAR(500),
    cv_file VARCHAR(500),
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'in_process', 'completed', 'rejected')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experience details table (one-to-many with candidates)
CREATE TABLE experience_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    duration VARCHAR(100),
    trade VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow stages table
CREATE TABLE workflow_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    medical_status VARCHAR(50) DEFAULT 'pending' CHECK (medical_status IN ('pending', 'completed', 'rejected')),
    medical_payment_status VARCHAR(50) DEFAULT 'pending' CHECK (medical_payment_status IN ('pending', 'paid', 'rejected')),
    visa_status VARCHAR(50) DEFAULT 'pending' CHECK (visa_status IN ('pending', 'completed', 'rejected')),
    visa_payment_status VARCHAR(50) DEFAULT 'pending' CHECK (visa_payment_status IN ('pending', 'paid', 'rejected')),
    protector_status VARCHAR(50) DEFAULT 'pending' CHECK (protector_status IN ('pending', 'completed', 'rejected')),
    protector_payment_status VARCHAR(50) DEFAULT 'pending' CHECK (protector_payment_status IN ('pending', 'paid', 'rejected')),
    passport_status VARCHAR(50) DEFAULT 'pending' CHECK (passport_status IN ('pending', 'completed', 'rejected')),
    passport_payment_status VARCHAR(50) DEFAULT 'pending' CHECK (passport_payment_status IN ('pending', 'paid', 'rejected')),
    flight_status VARCHAR(50) DEFAULT 'pending' CHECK (flight_status IN ('pending', 'completed', 'rejected')),
    flight_payment_status VARCHAR(50) DEFAULT 'pending' CHECK (flight_payment_status IN ('pending', 'paid', 'rejected')),
    overall_status VARCHAR(50) DEFAULT 'initiated' CHECK (overall_status IN ('initiated', 'in_progress', 'completed', 'cancelled')),
    assigned_agent UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflow_stages(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('medical', 'visa', 'protector', 'passport', 'flight')),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'rejected', 'refunded')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verification_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interviews table
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    interview_type VARCHAR(50) CHECK (interview_type IN ('online', 'in_person', 'phone')),
    interview_date TIMESTAMP,
    interview_status VARCHAR(50) DEFAULT 'scheduled' CHECK (interview_status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    feedback TEXT,
    result VARCHAR(50) CHECK (result IN ('selected', 'rejected', 'pending')),
    conducted_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table (for organizational expenses)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    expense_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    receipt_file VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salaries table (for employee salary management)
CREATE TABLE IF NOT EXISTS salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    basic_salary DECIMAL(10, 2) NOT NULL,
    allowances DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) NOT NULL,
    salary_month DATE NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    payment_date TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table (for tracking user actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_created_by ON candidates(created_by);
CREATE INDEX idx_workflow_stages_candidate_id ON workflow_stages(candidate_id);
CREATE INDEX idx_workflow_stages_assigned_agent ON workflow_stages(assigned_agent);
CREATE INDEX idx_payments_candidate_id ON payments(candidate_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_stages_updated_at BEFORE UPDATE ON workflow_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salaries_updated_at BEFORE UPDATE ON salaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
