-- Create enum for promotion types
CREATE TYPE promotion_type AS ENUM ('buy_x_get_y', 'percentage_discount', 'fixed_discount', 'combo');

-- Create enum for promotion apply_to
CREATE TYPE promotion_apply_to AS ENUM ('all_products', 'specific_products', 'category');

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type promotion_type NOT NULL,
  buy_quantity INTEGER,
  get_quantity INTEGER,
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  apply_to promotion_apply_to NOT NULL,
  product_ids TEXT, -- JSON array of product IDs
  category_id UUID REFERENCES categories(id),
  active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  days_of_week TEXT, -- JSON array [0,1,2,3,4,5,6]
  start_time TIME,
  end_time TIME,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on active promotions
CREATE INDEX idx_promotions_active ON promotions(active) WHERE active = true;

-- Create index on category_id
CREATE INDEX idx_promotions_category ON promotions(category_id) WHERE category_id IS NOT NULL;
