-- Migration: Create products table with sample data
-- Created: 2025-08-04
-- Description: Creates a products table for testing with appropriate constraints, RLS, and sample data

-- Create the products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create an index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- Create an index on price for range queries
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- Create an index on stock_quantity for inventory queries
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create a policy for public read access
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

-- Create a policy for authenticated users to insert/update products
CREATE POLICY "Allow authenticated users to manage products" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample product data
INSERT INTO public.products (name, description, price, stock_quantity) VALUES
    ('Laptop Computer', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 25),
    ('Wireless Mouse', 'Ergonomic wireless mouse with long battery life', 29.99, 150),
    ('USB-C Hub', 'Multi-port USB-C hub with HDMI, USB-A, and power delivery', 79.99, 75),
    ('Mechanical Keyboard', 'RGB backlit mechanical keyboard with tactile switches', 149.99, 40),
    ('External Monitor', '27-inch 4K external monitor with USB-C connectivity', 399.99, 20),
    ('Webcam HD', '1080p HD webcam with built-in microphone', 89.99, 60),
    ('Bluetooth Headphones', 'Noise-cancelling bluetooth headphones with 30hr battery', 199.99, 35),
    ('Smartphone Case', 'Protective smartphone case with drop protection', 24.99, 200),
    ('Portable Charger', '10000mAh portable battery pack with fast charging', 49.99, 85),
    ('Cable Organizer', 'Desk cable management system with multiple slots', 19.99, 120);

-- Add comments to the table and columns for documentation
COMMENT ON TABLE public.products IS 'Products catalog table for e-commerce testing';
COMMENT ON COLUMN public.products.id IS 'Unique identifier for each product';
COMMENT ON COLUMN public.products.name IS 'Product name (required)';
COMMENT ON COLUMN public.products.description IS 'Detailed product description';
COMMENT ON COLUMN public.products.price IS 'Product price in USD (must be >= 0)';
COMMENT ON COLUMN public.products.stock_quantity IS 'Available inventory count (must be >= 0)';
COMMENT ON COLUMN public.products.created_at IS 'Timestamp when product was created';
COMMENT ON COLUMN public.products.updated_at IS 'Timestamp when product was last updated';