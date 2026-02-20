
-- Create advertisements table for admin-managed vendor ads
CREATE TABLE public.advertisements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Only admins can manage ads
CREATE POLICY "Admins can manage advertisements"
  ON public.advertisements
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active ads
CREATE POLICY "Anyone can view active ads"
  ON public.advertisements
  FOR SELECT
  USING (is_active = true);

-- Enable realtime for ads
ALTER PUBLICATION supabase_realtime ADD TABLE public.advertisements;
