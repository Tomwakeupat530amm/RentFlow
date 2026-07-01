-- Create a function to prevent double bookings
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- A booking is overlapping if it has the same room_id, 
  -- its status is active (not cancelled or checked_out),
  -- and its date range overlaps with the new booking's date range.
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = NEW.room_id
      AND status NOT IN ('cancelled', 'checked_out')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND check_in_date < NEW.check_out_date
      AND check_out_date > NEW.check_in_date
  ) THEN
    RAISE EXCEPTION 'Double booking prevented: Room is already booked for the selected dates.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the bookings table
DROP TRIGGER IF EXISTS prevent_double_booking ON bookings;
CREATE TRIGGER prevent_double_booking
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_booking_overlap();
