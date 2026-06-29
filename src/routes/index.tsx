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

    async function checkUserAndRedirect(sessionToCheck?: any) {
      if (cancelled) return;

      try {
        // 1. ตรวจสอบ Supabase Session
        let session = sessionToCheck || (await supabase.auth.getSession()).data.session;

        // ถ้าระบบหลักยังไม่ได้ session แต่มี access_token หรือ code ใน URL (ดักบั๊ก Supabase JS / PKCE)
        const hasHashToken = typeof window !== "undefined" && window.location.hash.includes("access_token");
        const hasPkceCode = typeof window !== "undefined" && window.location.search.includes("code=");

        if (!session && (hasHashToken || hasPkceCode)) {
          if (hasHashToken) {
            const hashStr = window.location.hash.substring(1);
            const params = new URLSearchParams(hashStr);
            const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          
          if (accessToken && refreshToken) {
            // บังคับยัด session เข้าไปเลย ไม่ต้องรอ Event
            const { data } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            session = data.session;
          }
          } else if (hasPkceCode) {
            // PKCE Flow: ต้องรอ Supabase แลก code เป็น session แบบ Asynchronous
            // เราแค่ return ออกไปก่อน เพื่อให้ onAuthStateChange มารับช่วงต่อ
            return;
          }
        }

        let userId = null;
        let isLineLogin = false;

        if (session) {
          userId = session.user.id;
        }

        // 2. ถ้าไม่มี Supabase Session ให้ตรวจสอบ LINE LIFF
        if (!userId && typeof window !== "undefined" && !window.location.hash.includes("access_token") && !window.location.hash.includes("error")) {
          try {
            // ป้องกัน initLiff ค้าง
            const liffPromise = initLiff();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("LIFF timeout")), 3000));
            await Promise.race([liffPromise, timeoutPromise]);
            
            if (isLiffLoggedIn()) {
              const p = await getLiffProfile();
              userId = p.userId;
              isLineLogin = true;
              try { await syncLineUserToSupabase(p); } catch (e) { console.error("[RootRedirector] syncLineUserToSupabase error:", e); }
            }
          } catch (e) {
            console.log("LIFF Init failed or timeout", e);
          }
        }

        if (cancelled) return;

        // 3. ถ้าไม่มีการ Login เลย ให้ไปหน้า login (แต่ต้องทำเฉพาะบน Client เท่านั้น เพื่อไม่ให้ SSR เตะกลับก่อนได้อ่าน Hash)
        if (!userId) {
          if (typeof window !== "undefined") {
            // DEBUG: Alert URL before we lose it!
            if (window.location.href.includes("error") || window.location.href.includes("code=") || window.location.hash) {
              console.log("Debug: RootRedirector is sending you to login. URL was: " + window.location.href);
            }
            navigate({ to: "/login" });
          }
          return;
        }

        // 4. ดึง Role จากฐานข้อมูล
        let role = "customer"; // ค่าเริ่มต้น
        
        // เราค้นหา user ด้วย auth_user_id หรือ line_user_id
        const query = isLineLogin 
          ? supabase.from("users").select("role").eq("line_user_id", userId).single()
          : supabase.from("users").select("role").eq("auth_user_id", userId).single();

        const { data, error } = await query;
        
        if (!error && data) {
          role = (data as any).role as string;
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

      } catch (err: any) {
        console.error("Error in RootRedirector", err);
        if (typeof window !== "undefined") {
          // alert("RootRedirector Error: " + (err?.message || JSON.stringify(err)));
          if (!cancelled) navigate({ to: "/login" });
        }
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkUserAndRedirect(session);
      }
    });

    checkUserAndRedirect();

    return () => { 
      cancelled = true; 
      authListener.subscription.unsubscribe();
    };
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
