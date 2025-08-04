-- Rollback Migration: Remove products table
-- Created: 2025-08-04
-- Description: Rollback script for products table creation

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;

-- Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop the policies
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON public.products;

-- Drop the indexes (they will be dropped automatically with the table, but explicit for clarity)
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_products_price;
DROP INDEX IF EXISTS idx_products_stock;

-- Drop the table
DROP TABLE IF EXISTS public.products;