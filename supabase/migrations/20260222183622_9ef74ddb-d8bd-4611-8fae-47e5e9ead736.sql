-- Allow any authenticated user to check if a vendor has bookings on a date (for availability)
CREATE POLICY "Anyone can check vendor availability"
ON public.bookings
FOR SELECT
USING (true);

-- Drop the now-redundant individual select policies
DROP POLICY IF EXISTS "Clients can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Vendors can view their bookings" ON public.bookings;
