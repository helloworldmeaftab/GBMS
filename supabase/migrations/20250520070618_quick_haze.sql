/*
  # Add quantity column to products table

  1. Changes
    - Add quantity column to products table with default value of 0
    - Update existing rows to have default quantity
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN quantity INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;