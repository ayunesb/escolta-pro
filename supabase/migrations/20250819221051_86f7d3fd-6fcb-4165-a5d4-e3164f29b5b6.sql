-- Create a profile for existing users who don't have one
-- Insert profile for the current test user
INSERT INTO public.profiles (id, first_name, email, role, created_at, updated_at)
VALUES ('4ceda43a-cba9-413f-8a00-87e918a9060f', 'Test', 'ayunesb@icloud.com', 'client', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create trigger to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, role, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    'client',
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add logging to the bookings edge function for debugging
-- No need to update the function, we'll just add console.log