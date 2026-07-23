UPDATE public.blog_categories SET name = REPLACE(REPLACE(REPLACE(name, '&amp;', '&'), '&#038;', '&'), '&#8217;', '''');
UPDATE public.blog_tags SET name = REPLACE(REPLACE(REPLACE(name, '&amp;', '&'), '&#038;', '&'), '&#8217;', '''');
UPDATE public.blog_posts SET title = REPLACE(REPLACE(REPLACE(title, '&amp;', '&'), '&#038;', '&'), '&#8217;', '''');