-- Add promotion fields to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id),
ADD COLUMN IF NOT EXISTS promotion_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS promotion_discount DECIMAL(10,2);

-- Add discount fields to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES discounts(id),
ADD COLUMN IF NOT EXISTS discount_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);

-- Create index on promotion_id
CREATE INDEX IF NOT EXISTS idx_order_items_promotion ON order_items(promotion_id) WHERE promotion_id IS NOT NULL;

-- Create index on discount_id
CREATE INDEX IF NOT EXISTS idx_orders_discount ON orders(discount_id) WHERE discount_id IS NOT NULL;
