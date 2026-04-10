-- Add platform_price column to products table for delivery platform pricing
ALTER TABLE products ADD COLUMN IF NOT EXISTS platform_price NUMERIC(10, 2);

-- Add comment to explain the column
COMMENT ON COLUMN products.platform_price IS 'Precio especial para plataformas de delivery (Uber/Rappi/Didi). Si es NULL, usa el precio normal.';
