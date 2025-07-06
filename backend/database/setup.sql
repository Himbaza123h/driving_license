-- DLV Burundi Database Schema
-- Run this in Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Citizens table (National ID records)
CREATE TABLE IF NOT EXISTS citizens (
    id BIGSERIAL PRIMARY KEY,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth sessions table (OTP sessions)
CREATE TABLE IF NOT EXISTS auth_sessions (
    id BIGSERIAL PRIMARY KEY,
    citizen_id BIGINT REFERENCES citizens(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    otp_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED')),
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- License applications table
CREATE TABLE IF NOT EXISTS license_applications (
    id VARCHAR(50) PRIMARY KEY, -- e.g., DLV17512071234ABCD
    citizen_id BIGINT REFERENCES citizens(id) ON DELETE CASCADE,
    license_type VARCHAR(20) DEFAULT 'STANDARD' CHECK (license_type IN ('STANDARD', 'MOTORCYCLE', 'COMMERCIAL', 'HEAVY_VEHICLE')),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')),
    personal_info JSONB NOT NULL,
    documents JSONB NOT NULL,
    emergency_contact JSONB NOT NULL,
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_citizens_national_id ON citizens(national_id);
CREATE INDEX IF NOT EXISTS idx_citizens_status ON citizens(status);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_transaction_id ON auth_sessions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_citizen_id ON auth_sessions(citizen_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_status ON auth_sessions(status);
CREATE INDEX IF NOT EXISTS idx_license_applications_citizen_id ON license_applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_license_applications_status ON license_applications(status);

-- Row Level Security (RLS) policies
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_applications ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data (for backend operations)
CREATE POLICY "Service role can manage citizens" ON citizens FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage auth_sessions" ON auth_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage license_applications" ON license_applications FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own citizen data" ON citizens FOR SELECT USING (auth.uid()::text = national_id);
CREATE POLICY "Users can read own applications" ON license_applications FOR SELECT USING (citizen_id = (SELECT id FROM citizens WHERE national_id = auth.uid()::text));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_citizens_updated_at BEFORE UPDATE ON citizens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_sessions_updated_at BEFORE UPDATE ON auth_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_license_applications_updated_at BEFORE UPDATE ON license_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial dummy data for testing
INSERT INTO citizens (national_id, full_name, date_of_birth, address, phone_number, email) VALUES
('1198700123456', 'Jean Baptiste NIYONGABO', '1987-03-15', 'Rohero, Bujumbura', '+257 79 123 456', 'jean.niyongabo@example.com'),
('1199200234567', 'Marie Claire NZEYIMANA', '1992-08-22', 'Ngagara, Bujumbura', '+257 78 234 567', 'marie.nzeyimana@example.com'),
('1199500345678', 'Pierre HAKIZIMANA', '1995-12-10', 'Kigobe, Bujumbura', '+257 76 345 678', 'pierre.hakizimana@example.com'),
('1198800456789', 'Esperance NDAYISHIMIYE', '1988-06-18', 'Buyenzi, Bujumbura', '+257 75 456 789', 'esperance.ndayishimiye@example.com'),
('1199700567890', 'Emmanuel BIGIRIMANA', '1997-11-30', 'Cibitoke, Bujumbura', '+257 74 567 890', 'emmanuel.bigirimana@example.com')
ON CONFLICT (national_id) DO NOTHING;

-- Verify the setup
SELECT 'Citizens table created and populated with ' || COUNT(*) || ' records' as status FROM citizens;
SELECT 'Auth sessions table created' as status FROM auth_sessions LIMIT 0;
SELECT 'License applications table created' as status FROM license_applications LIMIT 0;
