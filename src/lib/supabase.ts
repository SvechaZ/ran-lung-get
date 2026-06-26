import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[Supabase] VITE_SUPABASE_URL หรือ VITE_SUPABASE_ANON_KEY ยังไม่ได้ตั้งค่า");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
