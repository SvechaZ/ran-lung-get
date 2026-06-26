-- ════════════════════════════════════════════════════════
-- ร้านลุงเก้ต — Full Database Schema
-- วิธีใช้: คัดลอกทั้งหมด วางใน Supabase SQL Editor แล้ว Run
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUM ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending','preparing','delivering','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('dine-in','takeaway','delivery');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

-- ════════════════════════════════════════════════════════
-- 1. USERS — ผู้ใช้งาน (LINE login และ Email/Password)
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id    TEXT UNIQUE,           -- LINE userId (ถ้าใช้ LINE login)
  auth_user_id    UUID UNIQUE,           -- Supabase auth.users.id (ถ้าใช้ email/password)
  display_name    TEXT NOT NULL,
  email           TEXT,
  picture_url     TEXT,
  status_message  TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users IS 'ผู้ใช้งานทุกคน ทั้ง LINE LIFF และ Email/Password';
COMMENT ON COLUMN public.users.line_user_id IS 'LINE userId จาก LIFF — NULL ถ้า login ด้วย email';
COMMENT ON COLUMN public.users.auth_user_id IS 'Supabase auth.users.id — NULL ถ้า login ด้วย LINE';
COMMENT ON COLUMN public.users.is_active    IS 'false = ถูก ban จากระบบ';

-- ════════════════════════════════════════════════════════
-- 2. CUSTOMERS — ข้อมูลลูกค้า (ที่อยู่, เบอร์, สถิติ)
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.customers (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  line_user_id         TEXT UNIQUE,
  auth_user_id         UUID UNIQUE,
  display_name         TEXT NOT NULL,
  phone                TEXT,
  email                TEXT,
  default_address      TEXT,
  default_address_type TEXT CHECK (default_address_type IN ('home','work','dorm')),
  notes                TEXT,                          -- หมายเหตุจากเจ้าของร้าน
  total_orders         INTEGER NOT NULL DEFAULT 0,
  total_spent          NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_blocked           BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.customers IS 'โปรไฟล์ลูกค้า (1:1 กับ users)';
COMMENT ON COLUMN public.customers.total_orders IS 'จำนวนออเดอร์ที่ status = completed';
COMMENT ON COLUMN public.customers.total_spent  IS 'ยอดซื้อสะสม (บาท)';
COMMENT ON COLUMN public.customers.is_blocked   IS 'true = ลูกค้าถูก block ไม่ให้สั่งได้';

-- ════════════════════════════════════════════════════════
-- 3. MENU_ITEMS — เมนูอาหาร (ข้อมูลจาก MENU constant)
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.menu_items (
  id          TEXT PRIMARY KEY,           -- ตรงกับ id ใน MENU constant เช่น m_krapao_pork
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  image       TEXT,                       -- path รูป เช่น /meal/krapao.jpg
  category    TEXT NOT NULL,              -- signature, main, noodles, rice, drinks, dessert, vegetarian
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_spicy    BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  options     JSONB,                      -- [{ id, name, choices:[{id,label,price}] }]
  addons      JSONB,                      -- [{ id, name, price }]
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.menu_items IS 'เมนูอาหารทั้งหมดของร้าน';
COMMENT ON COLUMN public.menu_items.options  IS 'ตัวเลือก เช่น ระดับความเผ็ด';
COMMENT ON COLUMN public.menu_items.addons   IS 'ของเพิ่ม เช่น ไข่ดาว +10 บาท';

-- ════════════════════════════════════════════════════════
-- 4. ORDERS — ออเดอร์
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number         TEXT NOT NULL UNIQUE,
  user_id              UUID NOT NULL REFERENCES public.users(id),
  customer_id          UUID NOT NULL REFERENCES public.customers(id),
  line_user_id         TEXT,
  auth_user_id         UUID,
  order_type           order_type NOT NULL,
  status               order_status NOT NULL DEFAULT 'pending',
  subtotal             NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee         NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                NUMERIC(10,2) NOT NULL DEFAULT 0,
  table_number         TEXT,             -- สำหรับ dine-in
  delivery_address     TEXT,             -- สำหรับ delivery
  special_instructions TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ
);

COMMENT ON TABLE  public.orders IS 'ออเดอร์ทั้งหมด';
COMMENT ON COLUMN public.orders.order_number IS 'เลขออเดอร์ เช่น #AK-2841';

-- ════════════════════════════════════════════════════════
-- 5. ORDER_ITEMS — รายการอาหารในออเดอร์
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,             -- ตรงกับ menu_items.id
  name        TEXT NOT NULL,
  image       TEXT,
  unit_price  NUMERIC(10,2) NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  addons      JSONB,                     -- [{ id, name, price }]
  options     JSONB,                     -- { spicy: "2" }
  note        TEXT,
  line_total  NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_items IS 'รายการอาหารในแต่ละออเดอร์';

-- ════════════════════════════════════════════════════════
-- 6. TABLES — โต๊ะในร้าน
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id         TEXT PRIMARY KEY,           -- "1", "2", ...
  label      TEXT NOT NULL,              -- "โต๊ะ 1"
  status     TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','reserved')),
  capacity   INTEGER NOT NULL DEFAULT 4,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.restaurant_tables IS 'โต๊ะทั้งหมดในร้าน';

-- ════════════════════════════════════════════════════════
-- 7. INDEXES
-- ════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_line_user_id        ON public.users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id        ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id         ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_user_id    ON public.customers(line_user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category       ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available      ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id            ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id        ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status             ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at         ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id      ON public.order_items(order_id);

-- ════════════════════════════════════════════════════════
-- 8. ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables  ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- customers
CREATE POLICY "customers_select" ON public.customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- menu_items: อ่านได้ทุกคน, แก้ไขได้เฉพาะ authenticated (เจ้าของร้าน)
CREATE POLICY "menu_select" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "menu_insert" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "menu_update" ON public.menu_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "menu_delete" ON public.menu_items FOR DELETE TO authenticated USING (true);

-- orders
CREATE POLICY "orders_select" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- order_items
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

-- tables: อ่านได้ทุกคน แก้ได้เฉพาะ authenticated
CREATE POLICY "tables_select" ON public.restaurant_tables FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tables_update" ON public.restaurant_tables FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════
-- 9. FUNCTIONS & TRIGGERS
-- ════════════════════════════════════════════════════════

-- auto updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_menu_updated_at
  BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto generate order_number: #AK-XXXX
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  new_num TEXT;
  counter INT := 0;
BEGIN
  LOOP
    new_num := '#AK-' || LPAD(floor(random() * 9000 + 1000)::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_num);
    counter := counter + 1;
    IF counter > 20 THEN
      new_num := '#AK-' || extract(epoch FROM now())::bigint::text;
      EXIT;
    END IF;
  END LOOP;
  NEW.order_number := new_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- auto update customer stats เมื่อออเดอร์ completed
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE public.customers
    SET
      total_orders = total_orders + 1,
      total_spent  = total_spent + NEW.total,
      updated_at   = now()
    WHERE id = NEW.customer_id;
    -- mark table as available (dine-in)
    IF NEW.order_type = 'dine-in' AND NEW.table_number IS NOT NULL THEN
      UPDATE public.restaurant_tables
      SET status = 'available', updated_at = now()
      WHERE id = NEW.table_number;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_completed
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

-- ════════════════════════════════════════════════════════
-- 10. SEED DATA — ข้อมูลเริ่มต้น
-- ════════════════════════════════════════════════════════

-- โต๊ะ 8 โต๊ะ
INSERT INTO public.restaurant_tables (id, label, status, capacity) VALUES
  ('1','โต๊ะ 1','available',4),
  ('2','โต๊ะ 2','occupied',4),
  ('3','โต๊ะ 3','available',4),
  ('4','โต๊ะ 4','available',6),
  ('5','โต๊ะ 5','available',4),
  ('6','โต๊ะ 6','occupied',2),
  ('7','โต๊ะ 7','available',4),
  ('8','โต๊ะ 8','available',6)
ON CONFLICT (id) DO NOTHING;

-- เมนูอาหาร (ตรงกับ MENU constant ใน index.tsx)
INSERT INTO public.menu_items (id, name, description, price, image, category, is_available, sort_order, addons, options) VALUES
  ('m_krapao_pork','กระเพราหมูสับ (ข้าวราด)','กระเพราหมูสับผัดกับพริกและกระเทียม เสิร์ฟราดข้าวไทยร้อนๆ',60,'/meal/krapao.jpg','signature',true,1,
    '[{"id":"egg","name":"ไข่ดาว","price":10},{"id":"bacon","name":"หมูกรอบ","price":20}]',
    '[{"id":"spicy","name":"ระดับความเผ็ด","choices":[{"id":"0","label":"ไม่เผ็ด"},{"id":"1","label":"เผ็ดน้อย"},{"id":"2","label":"เผ็ดกลาง"},{"id":"3","label":"เผ็ดมาก"}]}]'),
  ('m_pad_nam_prik_pao','ผัดพริกเผา (ข้าวราด)','ผัดเครื่องพริกเผาเข้มข้น เคล้ากับเนื้อหรือไก่ตามสั่ง เสิร์ฟพร้อมข้าว',65,'/meal/pad_tua_sea.jpg','signature',true,2,
    '[{"id":"egg","name":"ไข่ดาว","price":10}]',null),
  ('m_pad_nam_oil','ผัดน้ำมันหอย (ข้าว/เส้น)','ผัดด้วยน้ำมันหอยหอมหวาน เลือกเนื้อสัตว์และข้าว/เส้นได้ตามต้องการ',65,'/meal/khao_moo_garlic.jpg','main',true,3,null,null),
  ('m_pad_see_ew','ผัดซีอิ๊ว (เส้นใหญ่)','เส้นใหญ่ผัดซีอิ๊วแบบร้านตามสั่ง ปรุงรสกลมกล่อม เสิร์ฟร้อน',70,'/meal/pad_see_ew.jpg','noodles',true,4,null,null),
  ('m_fried_rice','ข้าวผัดกระเทียม (ข้าวผัด)','ข้าวผัดกลิ่นกระเทียม เจียวจนหอม พร้อมผักและเนื้อสัตว์เลือกได้',70,'/meal/fried_rice.jpg','rice',true,5,null,null),
  ('m_pad_phong_kari','ผัดผงกะหรี่ (ไก่/หมู)','ผัดผงกะหรี่รสกลมกล่อม เสิร์ฟพร้อมข้าวร้อนๆ',75,'/meal/pad_pong_gari.jpg','main',true,6,null,null),
  ('m_pad_pak','ผัดผักรวม (กับข้าว)','ผัดผักสดหลากหลาย ปรุงรสอ่อนๆ ทานคู่กับข้าวสวย',55,'/meal/pad_pak.jpg','vegetarian',true,7,null,null),
  ('m_pad_prik_gaeng','ผัดพริกแกง (ตามสั่ง)','ผัดพริกแกงกลมกล่อม สามารถเลือกเป็นหมู ไก่ หรือทะเลได้',80,'/meal/pad_tua_sea.jpg','signature',true,8,null,null),
  ('m_krapao_crispy_pork','กระเพราหมูกรอบ (ข้าวราด)','กระเพราหมูกรอบหนังสามชั้นกรอบนอกนุ่มใน ผัดใบกระเพราแท้รสจัดจ้าน เสิร์ฟราดข้าวหอมมะลิร้อนๆ',70,'/meal/krapao.jpg','signature',true,9,
    '[{"id":"egg","name":"ไข่ดาว","price":10}]',null),
  ('m_kana_crispy_pork','ผัดคะน้าหมูกรอบ (ข้าวราด)','ผัดคะน้าใบเขียวสดกรอบกับหมูกรอบสามชั้น ปรุงรสกลมกล่อม ราดข้าวหอมมะลิร้อนๆ',70,'/meal/pad_pak.jpg','main',true,10,
    '[{"id":"egg","name":"ไข่ดาว","price":10}]',null),
  ('m_prik_gaeng_crispy_pork','ผัดพริกแกงหมูกรอบ (ข้าวราด)','พริกแกงรสเข้มข้นผัดคลุกเคล้ากับหมูกรอบและถั่วฝักยาว ราดข้าวหอมมะลิร้อนๆ',70,'/meal/pad_tua_sea.jpg','main',true,11,
    '[{"id":"egg","name":"ไข่ดาว","price":10}]',null),
  ('m_garlic_sliced_pork','กระเทียมพริกไทยหมูชิ้น (ข้าวราด)','หมูชิ้นนุ่มๆ ผัดซอสกระเทียมพริกไทยรสเข้มข้น หอมกระเทียมเจียว ราดข้าว',60,'/meal/khao_moo_garlic.jpg','main',true,12,
    '[{"id":"egg","name":"ไข่ดาว","price":10}]',null),
  ('m_pong_kari_sea','ผัดผงกะหรี่ทะเล (ข้าวราด)','เนื้อกุ้งและปลาหมึกสดผัดผงกะหรี่เข้มข้น ไข่นุ่มละมุนลิ้น ราดข้าวหอมมะลิ',70,'/meal/pad_pong_gari.jpg','signature',true,13,
    '[{"id":"egg","name":"ไข่ดาว","price":10}]',null),
  ('m_khua_prik_beef','คั่วพริกแกงเนื้อ (ข้าวราด)','เนื้อวัวเกรดดีผัดคั่วพริกแกงตำมือ รสจัดจ้านถึงใจ สมุนไพรไทยครบเครื่อง ราดข้าว',60,'/meal/pad_tua_sea.jpg','main',true,14,
    '[{"id":"egg","name":"ไข่ดาว","price":10}]',null),
  ('m_see_ew_crispy_pork','ผัดซีอิ๊วเส้นใหญ่หมูกรอบ','เส้นใหญ่เหนียวนุ่มผัดซีอิ๊วดำหอมกลิ่นกระทะ คลุกเคล้ากับหมูกรอบและคะน้าสด',75,'/meal/pad_see_ew.jpg','noodles',true,15,null,null),
  ('m_mama_prik_gaeng_shrimp','มาม่าผัดคั่วพริกแกงกุ้ง','เส้นมาม่าเหนียวนุ่มผัดซอสพริกแกงเข้มข้นและกุ้งสดเด้งๆ สมุนไพรหอมกรุ่น',65,'/meal/pad_tua_sea.jpg','noodles',true,16,null,null),
  ('m_prik_pao_clam','ผัดพริกเผาหอยลาย (ข้าวราด)','หอยลายสดผัดน้ำพริกเผาสูตรเด็ด รสชาติหวานเค็มเผ็ดลงตัว หอมใบโหระพา ราดข้าว',60,'/meal/pad_tua_sea.jpg','main',true,17,
    '[{"id":"egg","name":"ไข่ดาว","price":10}]',null),
  ('m_pad_pak_no_meat','ผัดผักรวมมิตร (ข้าวราด / มังสวิรัติ)','ผัดผักสดรวมมิตรรสชาติเบาๆ สุขภาพดี ปรุงด้วยซีอิ๊วขาวและน้ำมันหอยสูตรเจ ราดข้าว',50,'/meal/pad_pak.jpg','vegetarian',true,18,null,null),
  -- เครื่องดื่ม
  ('d_water','น้ำเปล่า','น้ำดื่มเย็นๆ ขวดเล็ก',15,'/meal/water.jpg','drinks',true,20,null,null),
  ('d_coke','โค้ก (ขวด)','น้ำอัดลม ซีโร่/ปกติ ตามสต็อก',35,'/meal/coke.jpg','drinks',true,21,null,null),
  ('d_luangyai','น้ำลำไย','น้ำลำไยหวานหอม เสิร์ฟเย็น',45,'/meal/longan_juice.jpg','drinks',true,22,null,null),
  ('d_orange','น้ำส้มคั้น','น้ำส้มคั้นสด หวานอมเปรี้ยว',50,'/meal/orange_juice.jpg','drinks',true,23,null,null),
  -- ของหวาน
  ('dess_grass_jelly','เฉาก๊วย','เฉาก๊วยเย็นหวานกำลังดี ท็อปด้วยน้ำเชื่อม',40,'/meal/grass_jelly.webp','dessert',true,30,null,null),
  ('dess_shaved_ice','น้ำแข็งไส','น้ำแข็งไสพร้อมท็อปปิ้งหลากหลาย',55,'/meal/shaved_ice.jpg','dessert',true,31,null,null)
ON CONFLICT (id) DO NOTHING;
