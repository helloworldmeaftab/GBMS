/*
  # Add Employee Authentication Support
  
  1. Changes
    - Add auth fields to employees table
    - Add employee_auth table for login credentials
    - Update RLS policies for employee access
*/

-- Add employee authentication fields
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create employee_auth table
CREATE TABLE IF NOT EXISTS employee_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  password_hash TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE employee_auth ENABLE ROW LEVEL SECURITY;

-- Update employee RLS policies
CREATE POLICY "Employees can view their own auth data"
  ON employee_auth FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = employee_auth.employee_id
    AND employees.auth_user_id = auth.uid()
  ));

-- Add trigger for employee ID generation
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TRIGGER AS $$
DECLARE
  branch_code TEXT;
  emp_count INTEGER;
BEGIN
  -- Get branch code
  SELECT code INTO branch_code
  FROM branches
  WHERE id = NEW.branch_id;
  
  -- Get current employee count for branch
  SELECT COUNT(*) + 1 INTO emp_count
  FROM employees
  WHERE branch_id = NEW.branch_id;
  
  -- Generate employee ID: BRANCH-EMP001
  NEW.employee_id := branch_code || '-EMP' || LPAD(emp_count::text, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_employee_id_trigger
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION generate_employee_id();