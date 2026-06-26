# Supabase — ร้านลุงเก้ต

โฟลเดอร์นี้เก็บ Database Schema และ Migration files สำหรับโปรเจกต์ร้านอาหารรานลุงเก้ต

---

## 🗄️ โครงสร้าง Database

```
supabase/
└── migrations/
    └── 001_init_schema.sql   ← Schema หลัก (tables, RLS, triggers)
```

---

## 📋 Tables

### `users` — ผู้ใช้งาน LINE
| Column | Type | คำอธิบาย |
|--------|------|----------|
| `id` | UUID (PK) | ID ภายในระบบ |
| `line_user_id` | TEXT (UNIQUE) | LINE userId (Uxxxxx) |
| `display_name` | TEXT | ชื่อ LINE |
| `picture_url` | TEXT | รูปโปรไฟล์ |
| `status_message` | TEXT | สถานะ LINE |
| `is_active` | BOOLEAN | false = ถูก ban |
| `last_login_at` | TIMESTAMPTZ | เข้าสู่ระบบล่าสุด |

### `customers` — ข้อมูลลูกค้า
| Column | Type | คำอธิบาย |
|--------|------|----------|
| `id` | UUID (PK) | ID ภายในระบบ |
| `user_id` | UUID (FK → users) | ผูกกับ users |
| `line_user_id` | TEXT (UNIQUE) | LINE userId |
| `phone` | TEXT | เบอร์โทรศัพท์ |
| `default_address` | TEXT | ที่อยู่จัดส่งหลัก |
| `total_orders` | INTEGER | จำนวนออเดอร์สำเร็จ |
| `total_spent` | NUMERIC | ยอดซื้อสะสม (บาท) |
| `is_blocked` | BOOLEAN | ลูกค้าถูก block |

### `orders` — ออเดอร์
| Column | Type | คำอธิบาย |
|--------|------|----------|
| `id` | UUID (PK) | ID ออเดอร์ |
| `order_number` | TEXT (UNIQUE) | เลขออเดอร์ (#AK-xxxx) |
| `order_type` | ENUM | `dine-in`, `takeaway`, `delivery` |
| `status` | ENUM | `pending`, `preparing`, `delivering`, `completed`, `cancelled` |
| `total` | NUMERIC | ยอดรวมทั้งหมด |

### `order_items` — รายการอาหารในออเดอร์
| Column | Type | คำอธิบาย |
|--------|------|----------|
| `item_id` | TEXT | ID จาก MENU constant |
| `name` | TEXT | ชื่ออาหาร |
| `quantity` | INTEGER | จำนวน |
| `addons` | JSONB | ท็อปปิ้งเพิ่มเติม |
| `options` | JSONB | ตัวเลือก เช่น ระดับความเผ็ด |

---

## 🚀 วิธีสร้าง Tables

### วิธีที่ 1: ผ่าน Supabase Dashboard (แนะนำ)
1. เปิด [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project: **vshamisexmjcymsdyhym**
3. ไปที่ **SQL Editor**
4. คัดลอกเนื้อหาจาก `migrations/001_init_schema.sql` แล้ว paste แล้วกด **Run**

---

## 🔑 Environment Variables

```env
VITE_SUPABASE_URL=https://vshamisexmjcymsdyhym.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_viPzmZUj0b2sbHlyWAnz5Q_PntK9O03
```

---

## 🔐 Security Notes

- ใช้ **anon key** (Publishable) สำหรับ client-side — ปลอดภัย
- **Secret key** ไม่ควรใส่ใน frontend — ใช้เฉพาะ backend/Edge Functions เท่านั้น
- Row Level Security (RLS) เปิดใช้งานทุก table
