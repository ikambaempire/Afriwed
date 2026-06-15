
-- ============ BLOG / EDITORIAL ============
CREATE TABLE public.blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_author_id integer UNIQUE,
  login text,
  display_name text NOT NULL,
  email text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_authors TO anon, authenticated;
GRANT ALL ON public.blog_authors TO service_role;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_authors public read" ON public.blog_authors FOR SELECT USING (true);
CREATE POLICY "blog_authors admin write" ON public.blog_authors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_term_id integer UNIQUE,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  parent_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_categories public read" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_categories admin write" ON public.blog_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_term_id integer UNIQUE,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_tags TO anon, authenticated;
GRANT ALL ON public.blog_tags TO service_role;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_tags public read" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "blog_tags admin write" ON public.blog_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_post_id integer UNIQUE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content_html text,
  status text NOT NULL DEFAULT 'publish',
  published_at timestamptz,
  featured_image_url text,
  view_count integer NOT NULL DEFAULT 0,
  author_id uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_posts_status_published_idx ON public.blog_posts(status, published_at DESC);
CREATE INDEX blog_posts_slug_idx ON public.blog_posts(slug);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_posts public read published" ON public.blog_posts FOR SELECT USING (status='publish');
CREATE POLICY "blog_posts admin all" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.blog_post_categories (
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
GRANT SELECT ON public.blog_post_categories TO anon, authenticated;
GRANT ALL ON public.blog_post_categories TO service_role;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpc public read" ON public.blog_post_categories FOR SELECT USING (true);
CREATE POLICY "bpc admin write" ON public.blog_post_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.blog_post_tags (
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT ON public.blog_post_tags TO anon, authenticated;
GRANT ALL ON public.blog_post_tags TO service_role;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpt public read" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "bpt admin write" ON public.blog_post_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_comment_id integer UNIQUE,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  parent_wp_comment_id integer,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_comments_post_idx ON public.blog_comments(post_id, created_at DESC);
GRANT SELECT, INSERT ON public.blog_comments TO authenticated;
GRANT SELECT ON public.blog_comments TO anon;
GRANT ALL ON public.blog_comments TO service_role;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_comments public read approved" ON public.blog_comments FOR SELECT USING (approved = true);
CREATE POLICY "blog_comments insert auth" ON public.blog_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blog_comments admin all" ON public.blog_comments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.blog_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text UNIQUE NOT NULL,
  hosted_url text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_media_assets TO authenticated;
GRANT ALL ON public.blog_media_assets TO service_role;
ALTER TABLE public.blog_media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media admin all" ON public.blog_media_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ REAL WEDDINGS ============
CREATE TABLE public.real_weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  couple_names text NOT NULL,
  story text,
  location text,
  country text DEFAULT 'Rwanda',
  wedding_type text DEFAULT 'modern',
  wedding_date date,
  cover_image_url text,
  gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  vendor_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX real_weddings_status_idx ON public.real_weddings(status, created_at DESC);
GRANT SELECT ON public.real_weddings TO anon, authenticated;
GRANT INSERT ON public.real_weddings TO authenticated;
GRANT ALL ON public.real_weddings TO service_role;
ALTER TABLE public.real_weddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rw public read approved" ON public.real_weddings FOR SELECT USING (status='approved');
CREATE POLICY "rw owner read own" ON public.real_weddings FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "rw insert auth" ON public.real_weddings FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "rw admin all" ON public.real_weddings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER real_weddings_updated BEFORE UPDATE ON public.real_weddings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUBMISSIONS INBOX ============
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type text NOT NULL, -- 'wedding' | 'vendor'
  submitter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitter_email text,
  submitter_name text,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX submissions_status_idx ON public.submissions(status, created_at DESC);
GRANT SELECT, INSERT ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions own read" ON public.submissions FOR SELECT TO authenticated USING (submitter_id = auth.uid());
CREATE POLICY "submissions insert auth" ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitter_id);
CREATE POLICY "submissions admin all" ON public.submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER submissions_updated BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
