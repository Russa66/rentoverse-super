-- ============================================================
-- FULL SUPABASE SCHEMA FOR RENTOVERSE
-- Copy and paste this script into your Supabase SQL Editor
-- Click "Run" to set up your entire database and storage instantly!
-- ============================================================

-- 1. Create the `users` table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  nearest_communication TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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
ALTER TABLE public.room_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_search_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Users Table Policies: Users can read everyone, but only update themselves
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Room Listings Policies: Anyone can view listings, only owners can insert/update
CREATE POLICY "Anyone can view active listings" ON public.room_listings FOR SELECT USING (true);
CREATE POLICY "Landlords can create listings" ON public.room_listings FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update own listings" ON public.room_listings FOR UPDATE USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can delete own listings" ON public.room_listings FOR DELETE USING (auth.uid() = landlord_id);

-- Saved Searches Policies: Only renters can see and manage their own searches
CREATE POLICY "Renters can view own searches" ON public.saved_search_requests FOR SELECT USING (auth.uid() = renter_id);
CREATE POLICY "Renters can insert own searches" ON public.saved_search_requests FOR INSERT WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "Renters can update own searches" ON public.saved_search_requests FOR UPDATE USING (auth.uid() = renter_id);
CREATE POLICY "Renters can delete own searches" ON public.saved_search_requests FOR DELETE USING (auth.uid() = renter_id);

-- Social Posts Policies
CREATE POLICY "Anyone can view social posts" ON public.social_posts FOR SELECT USING (true);
CREATE POLICY "Admins/Authors can create posts" ON public.social_posts FOR INSERT WITH CHECK (auth.uid() = author_id);


-- ============================================================
-- SET UP SUPABASE STORAGE BUCKET
-- ============================================================

-- Create the "properties" bucket securely if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Ensure images can be uploaded and viewed
CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING ( bucket_id = 'properties' );
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'properties' );
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'properties' AND auth.uid() = owner);
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

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

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

CREATE POLICY "Users can view own negotiations" ON public.property_negotiations FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Users can insert own negotiations" ON public.property_negotiations FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Landlords can view negotiations for their rooms" ON public.property_negotiations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_listings 
    WHERE public.room_listings.id = public.property_negotiations.room_id 
    AND public.room_listings.landlord_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all negotiations" ON public.property_negotiations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND is_admin = true)
);
