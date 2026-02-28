-- Agregar campo password_hash para login al dashboard
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
