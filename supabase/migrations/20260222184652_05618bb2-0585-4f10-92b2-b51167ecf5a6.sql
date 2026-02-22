
-- Create a security definer function to check vendor availability without exposing booking details
CREATE OR REPLACE FUNCTION public.get_vendor_booked_dates(_vendor_id uuid)
RETURNS SETOF date
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_date FROM public.bookings
  WHERE vendor_id = _vendor_id AND status IN ('pending', 'confirmed')
$$;
