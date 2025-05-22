/*
  # Initial Schema for Business Management System
  
  1. New Tables
     - `profiles`: User profiles with personal information
     - `businesses`: Business information
     - `employees`: Employee records
     - `clients`: Client information
     - `products`: Products and services
     - `invoices`: Invoice headers
     - `invoice_items`: Invoice line items
  
  2. Security
     - Enable RLS on all tables
     - Add policies for authenticated users to manage their own business data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  hire_date DATE,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'product' or 'service'
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'unpaid' NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Businesses: Owners can manage their businesses
CREATE POLICY "Owners can view their businesses"
  ON businesses FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their businesses"
  ON businesses FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their businesses"
  ON businesses FOR DELETE
  USING (auth.uid() = owner_id);

-- Employees: Business owners can manage employees
CREATE POLICY "Owners can view their employees"
  ON employees FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert employees"
  ON employees FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update employees"
  ON employees FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete employees"
  ON employees FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Clients: Business owners can manage clients
CREATE POLICY "Owners can view their clients"
  ON clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = clients.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert clients"
  ON clients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = clients.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update clients"
  ON clients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = clients.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete clients"
  ON clients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = clients.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Products: Business owners can manage products
CREATE POLICY "Owners can view their products"
  ON products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert products"
  ON products FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update products"
  ON products FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete products"
  ON products FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = products.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Invoices: Business owners can manage invoices
CREATE POLICY "Owners can view their invoices"
  ON invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = invoices.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = invoices.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update invoices"
  ON invoices FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = invoices.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete invoices"
  ON invoices FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = invoices.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Invoice Items: Business owners can manage invoice items
CREATE POLICY "Owners can view their invoice items"
  ON invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices
    JOIN businesses ON businesses.id = invoices.business_id
    WHERE invoices.id = invoice_items.invoice_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert invoice items"
  ON invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM invoices
    JOIN businesses ON businesses.id = invoices.business_id
    WHERE invoices.id = invoice_items.invoice_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update invoice items"
  ON invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM invoices
    JOIN businesses ON businesses.id = invoices.business_id
    WHERE invoices.id = invoice_items.invoice_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete invoice items"
  ON invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM invoices
    JOIN businesses ON businesses.id = invoices.business_id
    WHERE invoices.id = invoice_items.invoice_id
    AND businesses.owner_id = auth.uid()
  ));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_invoice_items_updated_at
BEFORE UPDATE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION update_modified_column();