/*
  # Module Integration Updates
  
  1. Changes
    - Add branch_inventory table to track product stock by branch
    - Add sale_items table to track items in a sale
    - Add triggers for inventory management
    - Add functions for invoice generation
*/

-- Create branch_inventory table
CREATE TABLE IF NOT EXISTS branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER DEFAULT 0 NOT NULL,
  min_stock_level INTEGER DEFAULT 5 NOT NULL,
  max_stock_level INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(branch_id, product_id)
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE branch_inventory ENABLE ROW LEVEL_SECURITY;
ALTER TABLE sale_items ENABLE ROW_LEVEL_SECURITY;

-- Create RLS policies for branch_inventory
CREATE POLICY "Owners and branch employees can view branch inventory"
  ON branch_inventory FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM branches
    JOIN businesses ON businesses.id = branches.business_id
    WHERE branches.id = branch_inventory.branch_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.branch_id = branch_inventory.branch_id
        AND employees.auth_user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Owners and branch employees can update branch inventory"
  ON branch_inventory FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM branches
    JOIN businesses ON businesses.id = branches.business_id
    WHERE branches.id = branch_inventory.branch_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.branch_id = branch_inventory.branch_id
        AND employees.auth_user_id = auth.uid()
      )
    )
  ));

-- Create RLS policies for sale_items
CREATE POLICY "Owners and branch employees can view sale items"
  ON sale_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sales
    JOIN businesses ON businesses.id = sales.business_id
    WHERE sales.id = sale_items.sale_id
    AND (businesses.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = sales.employee_id
        AND employees.auth_user_id = auth.uid()
      )
    )
  ));

-- Create function to update inventory on sale
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease branch inventory
  UPDATE branch_inventory
  SET quantity = quantity - NEW.quantity
  WHERE branch_id = (
    SELECT branch_id FROM sales WHERE id = NEW.sale_id
  )
  AND product_id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory update
CREATE TRIGGER update_inventory_after_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale();

-- Create function to generate invoice from sale
CREATE OR REPLACE FUNCTION generate_invoice_from_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_total_amount DECIMAL(10,2);
BEGIN
  -- Generate invoice number
  SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD(COALESCE(
           (SELECT COUNT(*) + 1 FROM invoices 
            WHERE business_id = NEW.business_id 
            AND DATE(created_at) = CURRENT_DATE)::text, 
           '1'
         ), 4, '0')
  INTO v_invoice_number;
  
  -- Calculate total amount
  SELECT COALESCE(SUM(quantity * price), 0)
  INTO v_total_amount
  FROM sale_items
  WHERE sale_id = NEW.id;
  
  -- Create invoice
  INSERT INTO invoices (
    business_id,
    branch_id,
    client_id,
    invoice_number,
    issue_date,
    due_date,
    status,
    total_amount
  ) VALUES (
    NEW.business_id,
    NEW.branch_id,
    (SELECT client_id FROM sales WHERE id = NEW.id),
    v_invoice_number,
    NEW.sale_date,
    NEW.sale_date + INTERVAL '30 days',
    'paid',
    v_total_amount
  ) RETURNING id INTO v_invoice_id;
  
  -- Create invoice items
  INSERT INTO invoice_items (
    invoice_id,
    product_id,
    quantity,
    price
  )
  SELECT 
    v_invoice_id,
    product_id,
    quantity,
    price
  FROM sale_items
  WHERE sale_id = NEW.id;
  
  -- Update sale with invoice reference
  UPDATE sales
  SET invoice_id = v_invoice_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice generation
CREATE TRIGGER generate_invoice_after_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_from_sale();

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_branch_inventory_updated_at
  BEFORE UPDATE ON branch_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sale_items_updated_at
  BEFORE UPDATE ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();