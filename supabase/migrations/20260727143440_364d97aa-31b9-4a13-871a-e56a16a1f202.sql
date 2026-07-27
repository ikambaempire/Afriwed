
CREATE TABLE public.site_strings (
  key text PRIMARY KEY,
  value_en text NOT NULL DEFAULT '',
  value_rw text NOT NULL DEFAULT '',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_strings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_strings TO authenticated;
GRANT ALL ON public.site_strings TO service_role;

ALTER TABLE public.site_strings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site strings"
  ON public.site_strings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site strings"
  ON public.site_strings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site strings"
  ON public.site_strings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site strings"
  ON public.site_strings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_strings_updated_at
  BEFORE UPDATE ON public.site_strings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Also ensure admins can update blog_categories (for renaming)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_categories' AND policyname = 'Admins manage categories'
  ) THEN
    CREATE POLICY "Admins manage categories"
      ON public.blog_categories FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
