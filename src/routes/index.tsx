import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { initLiff, isLiffLoggedIn, getLiffProfile } from "../lib/liff";
import { syncLineUserToSupabase } from "../lib/supabase.service";

export const Route = createFileRoute("/")({
  component: RootRedirector,
});

function RootRedirector() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkUserAndRedirect() {
      try {
        // 0. ตรวจสอบ Mock Staff Token ก่อนเลย (สำหรับทดสอบ/ดีบัก)
        const mockStaffToken = localStorage.getItem("ran-lung-get-staff-token");
        if (mockStaffToken) {
          if (!cancelled) navigate({ to: "/staff" });
          return;
        }

        let userId = null;
        let isLineLogin = false;

        // 1. ตรวจสอบ Supabase Session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          userId = session.user.id;
        }

        // 2. ถ้าไม่มี Supabase Session ให้ตรวจสอบ LINE LIFF
        if (!userId) {
          try {
            await initLiff();
            if (isLiffLoggedIn()) {
              const p = await getLiffProfile();
              userId = p.userId;
              isLineLogin = true;
              try { await syncLineUserToSupabase(p); } catch (e) { console.error("[RootRedirector] syncLineUserToSupabase error:", e); }
            }
          } catch (e) {
            console.log("LIFF Init failed or not in LINE environment", e);
          }
        }

        if (cancelled) return;

        // 3. ถ้าไม่มีการ Login เลย ให้ไปหน้า login
        if (!userId) {
          navigate({ to: "/login" });
          return;
        }

        // 4. ดึง Role จากฐานข้อมูล
        let role = "customer"; // ค่าเริ่มต้น

        const query = isLineLogin
          ? supabase.from("users").select("role").eq("line_user_id", userId).single()
          : supabase.from("users").select("role").eq("auth_user_id", userId).single();

        const { data, error } = await query;

        if (!error && data) {
          role = (data as { role: string }).role;
        }

        if (cancelled) return;

        // 5. เปลี่ยนเส้นทางไปยังหน้า Dashboard ของแต่ละ Role
        if (role === "admin") {
          navigate({ to: "/admin" });
        } else if (role === "staff") {
          navigate({ to: "/staff" });
        } else {
          navigate({ to: "/customer" });
        }

      } catch (err) {
        console.error("Error in RootRedirector", err);
        if (!cancelled) navigate({ to: "/login" });
      }
    }

    checkUserAndRedirect();

    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, #11304a 0%, #050c14 60%, #02060b 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "4px solid transparent",
            borderTopColor: "#fcc14a",
            borderBottomColor: "#002e47",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>กำลังตรวจสอบการเข้าสู่ระบบ…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}