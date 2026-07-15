-- 1. Ensure the profiles table has the necessary columns to catch the data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Create the automation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    standard_credits,
    ai_credits,
    last_reset_date
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name', -- Extracts the name from your React AuthScreen payload
    'user',                                -- Default tier
    50,                                    -- Default Standard Searches
    10,                                    -- Default AI Pitches
    now()                                  -- Starts the 72-hour clock
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the function to the authentication system
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();