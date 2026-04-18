-- Add 'flexible' to discount_type enum
ALTER TYPE discount_type ADD VALUE IF NOT EXISTS 'flexible';
