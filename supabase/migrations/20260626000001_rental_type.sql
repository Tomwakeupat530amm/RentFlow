-- Create enum types if they don't exist (optional, but we can just use text constraints for simplicity)
-- Adds rental_type to buildings
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS rental_type TEXT DEFAULT 'long_term' CHECK (rental_type IN ('long_term', 'short_term', 'mixed'));

-- Adds rental_type to rooms
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS rental_type TEXT DEFAULT 'long_term' CHECK (rental_type IN ('long_term', 'short_term'));

-- Update existing rooms based on existing logic if needed (optional)
-- We will just default everything to long_term for now.
