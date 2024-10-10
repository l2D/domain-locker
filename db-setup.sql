-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Domains table
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  domain_name TEXT NOT NULL,
  expiry_date DATE,
  registration_date DATE,
  updated_date DATE,
  notes TEXT,
  registrar_id UUID REFERENCES registrars(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, domain_name)
);

-- Enable RLS on domains table
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Create policy for domains
CREATE POLICY domains_policy ON domains
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  UNIQUE(name)
);

-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create policy for tags (allow read for all, insert/update/delete for authenticated users)
CREATE POLICY tags_select_policy ON tags FOR SELECT USING (true);
CREATE POLICY tags_modify_policy ON tags USING (auth.role() = 'authenticated');

-- Domain Tags junction table
CREATE TABLE domain_tags (
  domain_id UUID REFERENCES domains(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (domain_id, tag_id)
);

-- Enable RLS on domain_tags table
ALTER TABLE domain_tags ENABLE ROW LEVEL SECURITY;

-- Create policy for domain_tags
CREATE POLICY domain_tags_policy ON domain_tags
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_tags.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_tags.domain_id AND domains.user_id = auth.uid()));

-- Create Registrar table
CREATE TABLE registrars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT,
  UNIQUE(name)
);

-- Enable RLS on registrars table
ALTER TABLE registrars ENABLE ROW LEVEL SECURITY;

-- Create policy for registrars (allow read for all, insert/update/delete for authenticated users)
CREATE POLICY registrars_select_policy ON registrars FOR SELECT USING (true);
CREATE POLICY registrars_modify_policy ON registrars USING (auth.role() = 'authenticated');

-- Create Hosts table
CREATE TABLE hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip INET NOT NULL,
  lat NUMERIC,
  lon NUMERIC,
  isp TEXT,
  org TEXT,
  as_number TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  UNIQUE(ip)
);

-- Enable RLS on hosts table
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;

-- Create policy for hosts (allow read for all, insert/update/delete for authenticated users)
CREATE POLICY hosts_select_policy ON hosts FOR SELECT USING (true);
CREATE POLICY hosts_modify_policy ON hosts USING (auth.role() = 'authenticated');

-- Create Domain-Host junction table
CREATE TABLE domain_hosts (
  domain_id UUID REFERENCES domains(id),
  host_id UUID REFERENCES hosts(id),
  PRIMARY KEY (domain_id, host_id)
);

-- Enable RLS on domain_hosts table
ALTER TABLE domain_hosts ENABLE ROW LEVEL SECURITY;

-- Create policy for domain_hosts
CREATE POLICY domain_hosts_policy ON domain_hosts
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_hosts.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = domain_hosts.domain_id AND domains.user_id = auth.uid()));

-- Add index for performance
CREATE INDEX idx_domains_registrar_id ON domains(registrar_id);
CREATE INDEX idx_domain_hosts_domain_id ON domain_hosts(domain_id);
CREATE INDEX idx_domain_hosts_host_id ON domain_hosts(host_id);

-- WHOIS Information table
CREATE TABLE whois_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  name TEXT,
  organization TEXT,
  country TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  UNIQUE(domain_id)
);

-- Enable RLS on whois_info table
ALTER TABLE whois_info ENABLE ROW LEVEL SECURITY;

-- Create policy for whois_info
CREATE POLICY whois_info_policy ON whois_info
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = whois_info.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = whois_info.domain_id AND domains.user_id = auth.uid()));

-- DNS Records table
CREATE TABLE dns_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  record_type TEXT NOT NULL,
  record_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on dns_records table
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;

-- Create policy for dns_records
CREATE POLICY dns_records_policy ON dns_records
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = dns_records.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = dns_records.domain_id AND domains.user_id = auth.uid()));

-- SSL Certificates table
CREATE TABLE ssl_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  issuer TEXT,
  issuer_country TEXT,
  subject TEXT,
  valid_from DATE,
  valid_to DATE,
  fingerprint TEXT,
  key_size INTEGER,
  signature_algorithm TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on ssl_certificates table
ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;

-- Create policy for ssl_certificates
CREATE POLICY ssl_certificates_policy ON ssl_certificates
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = ssl_certificates.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = ssl_certificates.domain_id AND domains.user_id = auth.uid()));

-- IP Addresses table
CREATE TABLE ip_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  ip_address INET NOT NULL,
  is_ipv6 BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on ip_addresses table
ALTER TABLE ip_addresses ENABLE ROW LEVEL SECURITY;

-- Create policy for ip_addresses
CREATE POLICY ip_addresses_policy ON ip_addresses
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = ip_addresses.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = ip_addresses.domain_id AND domains.user_id = auth.uid()));

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id),
  notification_type TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(domain_id, notification_type)
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications
CREATE POLICY notifications_policy ON notifications
  USING (EXISTS (SELECT 1 FROM domains WHERE domains.id = notifications.domain_id AND domains.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM domains WHERE domains.id = notifications.domain_id AND domains.user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_dns_records_domain_id ON dns_records(domain_id);
CREATE INDEX idx_ssl_certificates_domain_id ON ssl_certificates(domain_id);
CREATE INDEX idx_ip_addresses_domain_id ON ip_addresses(domain_id);
CREATE INDEX idx_notifications_domain_id ON notifications(domain_id);
