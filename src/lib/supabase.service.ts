import { supabase } from "./supabase";
import type { UserRow, CustomerRow } from "./supabase.types";
import type { LiffProfile } from "./liff";

// ─────────────────────────────────────────────────────────────
// User Service — จัดการข้อมูล users table
// ─────────────────────────────────────────────────────────────

/**
 * Upsert ข้อมูลผู้ใช้จาก LINE profile
 * ถ้ามีอยู่แล้ว → อัปเดต display_name, picture_url, last_login_at
 * ถ้าใหม่ → สร้าง record ใหม่
 */
export async function upsertUser(profile: LiffProfile): Promise<UserRow> {
  const now = new Date().toISOString();

  // ใช้ any cast เพราะ Supabase SDK ต้องการ typed schema generation
  // ซึ่งในโปรเจกต์นี้ใช้ manual type ผ่าน supabase.types.ts แทน
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("users")
    .upsert(
      {
        line_user_id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl ?? null,
        status_message: profile.statusMessage ?? null,
        is_active: true,
        updated_at: now,
        last_login_at: now,
      },
      {
        onConflict: "line_user_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[Supabase] upsertUser error:", error);
    throw error;
  }

  return data as UserRow;
}

/**
 * ดึงข้อมูล user จาก line_user_id
 */
export async function getUserByLineId(lineUserId: string): Promise<UserRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error) {
    console.error("[Supabase] getUserByLineId error:", error);
    throw error;
  }

  return data as UserRow | null;
}

// ─────────────────────────────────────────────────────────────
// Customer Service — จัดการข้อมูล customers table
// ─────────────────────────────────────────────────────────────

/**
 * Upsert ข้อมูลลูกค้า — สร้าง/อัปเดต customer profile ที่ผูกกับ user
 */
export async function upsertCustomer(
  user: UserRow,
  extra?: {
    phone?: string;
    email?: string;
    default_address?: string;
    default_address_type?: "home" | "work" | "dorm";
    notes?: string;
  }
): Promise<CustomerRow> {
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("customers")
    .upsert(
      {
        user_id: user.id,
        line_user_id: user.line_user_id,
        display_name: user.display_name,
        updated_at: now,
        ...(extra?.phone !== undefined && { phone: extra.phone }),
        ...(extra?.email !== undefined && { email: extra.email }),
        ...(extra?.default_address !== undefined && { default_address: extra.default_address }),
        ...(extra?.default_address_type !== undefined && { default_address_type: extra.default_address_type }),
        ...(extra?.notes !== undefined && { notes: extra.notes }),
      },
      {
        onConflict: "line_user_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[Supabase] upsertCustomer error:", error);
    throw error;
  }

  return data as CustomerRow;
}

/**
 * ดึงข้อมูลลูกค้าจาก line_user_id
 */
export async function getCustomerByLineId(lineUserId: string): Promise<CustomerRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error) {
    console.error("[Supabase] getCustomerByLineId error:", error);
    throw error;
  }

  return data as CustomerRow | null;
}

/**
 * อัปเดตยอดซื้อสะสมของลูกค้าหลังจากสั่งอาหาร
 */
export async function incrementCustomerStats(
  lineUserId: string,
  orderTotal: number
): Promise<void> {
  const customer = await getCustomerByLineId(lineUserId);
  if (!customer) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { error } = await client
    .from("customers")
    .update({
      total_orders: customer.total_orders + 1,
      total_spent: customer.total_spent + orderTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("line_user_id", lineUserId);

  if (error) {
    console.error("[Supabase] incrementCustomerStats error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Login Flow — เรียกทั้งสองพร้อมกัน
// ─────────────────────────────────────────────────────────────

/**
 * เรียกใช้หลังจาก LINE login สำเร็จ:
 * 1. Upsert user record
 * 2. Upsert customer record
 * คืนค่า { user, customer }
 */
export async function syncLineUserToSupabase(profile: LiffProfile): Promise<{
  user: UserRow;
  customer: CustomerRow;
}> {
  const user = await upsertUser(profile);
  const customer = await upsertCustomer(user);
  return { user, customer };
}
