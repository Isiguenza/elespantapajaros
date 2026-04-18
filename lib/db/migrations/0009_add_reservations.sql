-- Add reservation_status enum
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'arrived', 'cancelled', 'no_show');

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  guest_count INTEGER NOT NULL DEFAULT 1,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 120, -- Duration in minutes
  status reservation_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_table_id ON reservations(table_id);
CREATE INDEX idx_reservations_customer_name ON reservations(customer_name);

-- Add comment
COMMENT ON TABLE reservations IS 'Table reservations for the restaurant';
COMMENT ON COLUMN reservations.duration IS 'Reservation duration in minutes (default: 120 = 2 hours)';
