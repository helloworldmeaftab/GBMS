/*
  # Phase 2 Schema Updates
  
  1. New Tables
     - `branches`: Branch/location management
     - `roles`: Role definitions
     - `permissions`: Permission settings
     - `employee_roles`: Employee-role assignments
     - `sales`: Sales transactions
     - `expenses`: Financial expenses
  
  2. Changes
     - Add branch_id to employees table
     - Add role_id to employees table
     - Add branch_id to invoices table
     - Add branch_id to products table
  
  3. Security
     - Enable RLS on all new tables
     - Update existing RLS policies for branch-based access
     - Add role-based access policies
*/

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(business_id, code)
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(business_id, name)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) NOT NULL,
  module TEXT NOT NULL,
  create_permission BOOLEAN DEFAULT false NOT NULL,
  read_permission BOOLEAN DEFAULT false NOT NULL,
  update_permission BOOLEAN DEFAULT false NOT NULL,
  delete_permission BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(role_id, module)
);

-- Create employee_roles table
CREATE TABLE IF NOT EXISTS employee_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  role_id UUID REFERENCES roles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(employee_id, role_id)
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  branch_id UUID REFERENCES branches(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  sale_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'completed' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  branch_id UUID REFERENCES branches(id) NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'paid' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add branch_id to existing tables
ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Enable Row Level Security
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Branches
CREATE POLICY "Owners can view their branches"
  ON branches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert branches"
  ON branches FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update branches"
  ON branches FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete branches"
  ON branches FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = branches.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Roles
CREATE POLICY "Owners can view their roles"
  ON roles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = roles.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert roles"
  ON roles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update roles"
  ON roles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = roles.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete roles"
  ON roles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = roles.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Permissions
CREATE POLICY "Owners can view permissions"
  ON permissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM roles
    JOIN businesses ON businesses.id = roles.business_id
    WHERE roles.id = permissions.role_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert permissions"
  ON permissions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM roles
    JOIN businesses ON businesses.id = roles.business_id
    WHERE roles.id = role_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update permissions"
  ON permissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM roles
    JOIN businesses ON businesses.id = roles.business_id
    WHERE roles.id = permissions.role_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete permissions"
  ON permissions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM roles
    JOIN businesses ON businesses.id = roles.business_id
    WHERE roles.id = permissions.role_id
    AND businesses.owner_id = auth.uid()
  ));

-- Employee Roles
CREATE POLICY "Owners can view employee roles"
  ON employee_roles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM employees
    JOIN businesses ON businesses.id = employees.business_id
    WHERE employees.id = employee_roles.employee_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert employee roles"
  ON employee_roles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM employees
    JOIN businesses ON businesses.id = employees.business_id
    WHERE employees.id = employee_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update employee roles"
  ON employee_roles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM employees
    JOIN businesses ON businesses.id = employees.business_id
    WHERE employees.id = employee_roles.employee_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete employee roles"
  ON employee_roles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM employees
    JOIN businesses ON businesses.id = employees.business_id
    WHERE employees.id = employee_roles.employee_id
    AND businesses.owner_id = auth.uid()
  ));

-- Sales
CREATE POLICY "Owners and branch employees can view sales"
  ON sales FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = sales.business_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = sales.employee_id
        AND employees.branch_id = sales.branch_id
      )
    )
  ));

CREATE POLICY "Owners and branch employees can insert sales"
  ON sales FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = employee_id
        AND employees.branch_id = branch_id
      )
    )
  ));

CREATE POLICY "Owners and branch employees can update sales"
  ON sales FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = sales.business_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = sales.employee_id
        AND employees.branch_id = sales.branch_id
      )
    )
  ));

CREATE POLICY "Owners can delete sales"
  ON sales FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = sales.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Expenses
CREATE POLICY "Owners and branch employees can view expenses"
  ON expenses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = expenses.business_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.branch_id = expenses.branch_id
      )
    )
  ));

CREATE POLICY "Owners and branch employees can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.branch_id = branch_id
      )
    )
  ));

CREATE POLICY "Owners and branch employees can update expenses"
  ON expenses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = expenses.business_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.branch_id = expenses.branch_id
      )
    )
  ));

CREATE POLICY "Owners can delete expenses"
  ON expenses FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = expenses.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_employee_roles_updated_at
  BEFORE UPDATE ON employee_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();