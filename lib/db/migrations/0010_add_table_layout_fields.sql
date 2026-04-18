-- Add table_shape enum
CREATE TYPE table_shape AS ENUM ('square', 'round');

-- Add layout fields to tables
ALTER TABLE tables ADD COLUMN IF NOT EXISTS position_x INTEGER;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS position_y INTEGER;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS shape table_shape DEFAULT 'square';
ALTER TABLE tables ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN tables.position_x IS 'X position in the visual table layout editor';
COMMENT ON COLUMN tables.position_y IS 'Y position in the visual table layout editor';
COMMENT ON COLUMN tables.shape IS 'Visual shape of the table (square or round)';
COMMENT ON COLUMN tables.rotation IS 'Rotation angle in degrees (0-360)';
