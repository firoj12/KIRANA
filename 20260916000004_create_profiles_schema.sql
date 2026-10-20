-- Migration: 20260916000004_create_profiles_schema.sql
-- Create profiles table for store settings, owner information, and shop details

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    shop_name TEXT NOT NULL DEFAULT 'Shree Ganesh Kirana Store',
    owner_name TEXT NOT NULL DEFAULT 'Ramesh Gupta',
    phone TEXT NOT NULL DEFAULT '9876543210',
    address TEXT NOT NULL DEFAULT 'Shop #4, Main Market, APMC Road',
    gstin TEXT DEFAULT '27AAAAA0000A1Z5',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
