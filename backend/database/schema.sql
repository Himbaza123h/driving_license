-- Supabase Database Schema for DLV Burundi
-- Run these commands in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Citizens table (our dummy National ID database)
CREATE TABLE citizens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    national_id VARCHAR(16) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication sessions table
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID REFERENCES citizens(id),
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- License applications table
CREATE TABLE license_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID REFERENCES citizens(id),
    application_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    application_data JSONB,
    documents JSONB, -- Store document URLs
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_citizens_national_id ON citizens(national_id);
CREATE INDEX idx_auth_sessions_transaction_id ON auth_sessions(transaction_id);
CREATE INDEX idx_auth_sessions_citizen_id ON auth_sessions(citizen_id);
CREATE INDEX idx_license_applications_citizen_id ON license_applications(citizen_id);
CREATE INDEX idx_license_applications_status ON license_applications(status);

-- Row Level Security (RLS)
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_applications ENABLE ROW LEVEL SECURITY;

-- Policies (basic - can be refined later)
CREATE POLICY "Enable read for authenticated users" ON citizens FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for service role" ON citizens FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read for authenticated users" ON auth_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for service role" ON auth_sessions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read for authenticated users" ON license_applications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all operations for service role" ON license_applications FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_citizens_updated_at BEFORE UPDATE ON citizens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_sessions_updated_at BEFORE UPDATE ON auth_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_applications_updated_at BEFORE UPDATE ON license_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
