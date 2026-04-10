-- Add 'platform_delivery' to payment_method enum
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'platform_delivery';
