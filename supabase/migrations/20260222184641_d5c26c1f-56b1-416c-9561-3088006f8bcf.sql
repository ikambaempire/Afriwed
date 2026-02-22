
-- ============================================
-- 1. FIX SECURITY ISSUES
-- ============================================

-- Fix profiles: only let users see their own profile, admins see all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix bookings: restrict SELECT to only show event_date/vendor_id for availability, full access for involved parties
DROP POLICY IF EXISTS "Anyone can check vendor availability" ON public.bookings;
CREATE POLICY "Clients can view own bookings" ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = client_id);
CREATE POLICY "Vendors can view own bookings" ON public.bookings FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Fix transactions: add INSERT policy for clients creating payments
CREATE POLICY "Clients can create transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- ============================================
-- 2. PAYMENT SCHEMA
-- ============================================

-- Add payment_status to bookings to track upfront payment
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- Vendor payment details (MoMo, bank, etc.)
CREATE TABLE IF NOT EXISTS public.vendor_payment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  payment_method text NOT NULL DEFAULT 'momo',
  account_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  bank_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vendor_id)
);

ALTER TABLE public.vendor_payment_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage own payment details" ON public.vendor_payment_details FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all payment details" ON public.vendor_payment_details FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  commission bigint NOT NULL DEFAULT 0,
  net_amount bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can request withdrawals" ON public.withdrawal_requests FOR INSERT TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawal_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_vendor_payment_details_updated_at
  BEFORE UPDATE ON public.vendor_payment_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
