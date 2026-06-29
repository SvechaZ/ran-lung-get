-- เพิ่ม enum สำหรับ role
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'staff', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

-- เพิ่ม column role ให้กับตาราง users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'customer';

COMMENT ON COLUMN public.users.role IS 'สิทธิ์การใช้งานระบบ: admin, staff, customer';
