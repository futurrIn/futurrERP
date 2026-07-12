INSERT INTO public.profiles (id, email, "fullName", phone, role, department, "jobPosition")
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'fullName', ''),
  COALESCE(raw_user_meta_data->>'phone', ''),
  COALESCE(raw_user_meta_data->>'role', 'Employee'),
  raw_user_meta_data->>'department',
  raw_user_meta_data->>'jobPosition'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
