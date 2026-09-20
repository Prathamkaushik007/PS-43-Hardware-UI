-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for role and status if they don't exist
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admin_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin_profiles table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role admin_role NOT NULL DEFAULT 'admin',
    approval_status admin_approval_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.admin_profiles;

-- RLS Policies

-- 1. Users can read their own profile
CREATE POLICY "Users can read own profile" 
ON public.admin_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles" 
ON public.admin_profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_profiles ap 
        WHERE ap.user_id = auth.uid() AND ap.role = 'super_admin'
    )
);

-- 3. Super admins can update profiles (approve/reject/change role)
CREATE POLICY "Super admins can update all profiles" 
ON public.admin_profiles 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_profiles ap 
        WHERE ap.user_id = auth.uid() AND ap.role = 'super_admin'
    )
);

-- 4. No one can INSERT directly from the client (handled by trigger)
-- No policy for INSERT.

-- Trigger to automatically create admin_profiles on user signup and handle bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_admin_user() 
RETURNS TRIGGER AS $$
DECLARE
    profile_count INT;
BEGIN
    -- Check if any profiles exist
    SELECT count(*) INTO profile_count FROM public.admin_profiles;

    -- If this is the first user, make them super_admin and approved
    IF profile_count = 0 THEN
        INSERT INTO public.admin_profiles (user_id, email, role, approval_status)
        VALUES (new.id, new.email, 'super_admin', 'approved');
    ELSE
        -- Otherwise, they are a normal admin and pending
        INSERT INTO public.admin_profiles (user_id, email, role, approval_status)
        VALUES (new.id, new.email, 'admin', 'pending');
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();
