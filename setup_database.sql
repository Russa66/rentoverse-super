-- ============================================================
-- FULL SUPABASE SCHEMA FOR RENTOVERSE
-- Copy and paste this script into your Supabase SQL Editor
-- Click "Run" to set up your entire database and storage instantly!
-- ============================================================

-- 1. Create the `users` table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  phone_number TEXT,
  email TEXT UNIQUE,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.5 Create the `admin_list` table to prevent RLS recursion
CREATE TABLE IF NOT EXISTS public.admin_list (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Migration: Sync existing users who were created before the auth_id column
-- Run this once if migrating from old schema:
-- UPDATE public.users SET auth_id = id WHERE auth_id IS NULL;

-- 2. Create the `room_listings` table
CREATE TABLE IF NOT EXISTS public.room_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  locality TEXT,
  area_sq_ft NUMERIC,
  bhk_count TEXT,
  property_type TEXT,
  nearest_communication TEXT,
  monthly_rent NUMERIC NOT NULL,
  amenities TEXT[],
  water_supply_condition TEXT,
  description TEXT,
  ideal_for TEXT,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  photo_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create the `saved_search_requests` table
CREATE TABLE IF NOT EXISTS public.saved_search_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  location_filter TEXT,
  max_rent NUMERIC,
  notification_preference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create the `social_posts` table
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT,
  post_content TEXT,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- SET UP ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_search_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Admin List Policies: Strictly read-only for others, hidden by default
DROP POLICY IF EXISTS "Anyone can see if they are admin" ON public.admin_list;
CREATE POLICY "Anyone can see if they are admin" ON public.admin_list FOR SELECT USING (auth.uid() = user_id);

-- Users Table Policies: Users can read everyone, but only update themselves
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_id OR (auth_id IS NULL AND email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id OR (auth_id IS NULL AND email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_list WHERE user_id = auth.uid())
);

-- Room Listings Policies: Anyone can view listings, only owners can insert/update
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.room_listings;
CREATE POLICY "Anyone can view active listings" ON public.room_listings FOR SELECT USING (status = 'Approved' AND is_active = true);

DROP POLICY IF EXISTS "Owners can manage listings" ON public.room_listings;
CREATE POLICY "Owners can manage listings" ON public.room_listings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.room_listings.landlord_id AND public.users.auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage all listings" ON public.room_listings;
CREATE POLICY "Admins can manage all listings" ON public.room_listings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_list WHERE user_id = auth.uid())
);

-- Saved Searches Policies: Only renters can see and manage their own searches
DROP POLICY IF EXISTS "Renters can manage own searches" ON public.saved_search_requests;
CREATE POLICY "Renters can manage own searches" ON public.saved_search_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.saved_search_requests.renter_id AND public.users.auth_id = auth.uid())
);

-- Social Posts Policies
DROP POLICY IF EXISTS "Anyone can view social posts" ON public.social_posts;
CREATE POLICY "Anyone can view social posts" ON public.social_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins/Authors can create posts" ON public.social_posts;
CREATE POLICY "Admins/Authors can create posts" ON public.social_posts FOR INSERT WITH CHECK (auth.uid() = author_id);


-- ============================================================
-- SET UP SUPABASE STORAGE BUCKET
-- ============================================================

-- Create the "properties" bucket securely if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Ensure images can be uploaded and viewed
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING ( bucket_id = 'properties' );

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'properties' );

DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'properties' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'properties' AND auth.uid() = owner);

-- ============================================================
-- 5. Create the `user_favorites` table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.room_listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, room_id)
);

-- User Favorites Policies
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites" ON public.user_favorites FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.user_favorites.user_id AND public.users.auth_id = auth.uid())
);

-- ============================================================
-- 6. Create the `property_negotiations` table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.room_listings(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  offered_price NUMERIC NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.property_negotiations ENABLE ROW LEVEL SECURITY;

-- Property Negotiations Policies
DROP POLICY IF EXISTS "Applicants can manage own negotiations" ON public.property_negotiations;
CREATE POLICY "Applicants can manage own negotiations" ON public.property_negotiations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.property_negotiations.applicant_id AND public.users.auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Landlords can view negotiations for their rooms" ON public.property_negotiations;
CREATE POLICY "Landlords can view negotiations for their rooms" ON public.property_negotiations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_listings 
    WHERE public.room_listings.id = public.property_negotiations.room_id 
    AND EXISTS (SELECT 1 FROM public.users WHERE public.users.id = public.room_listings.landlord_id AND public.users.auth_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can view all negotiations" ON public.property_negotiations;
CREATE POLICY "Admins can view all negotiations" ON public.property_negotiations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_list WHERE user_id = auth.uid())
);

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP (Required for phone login)
-- Run this in Supabase SQL Editor after updating the auth flow
-- ============================================================

-- Trigger function: fires after every new auth signup
-- Reads name + phone_number from metadata and inserts into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, auth_id, name, phone_number, email, is_verified, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone_number',
    new.email,
    true,
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    name = COALESCE(EXCLUDED.name, public.users.name),
    phone_number = COALESCE(EXCLUDED.phone_number, public.users.phone_number),
    is_verified = true,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

