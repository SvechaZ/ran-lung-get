import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { initLiff, isLiffLoggedIn, liffLogin } from "../lib/liff";
import { syncLineUserToSupabase, syncAuthUserToSupabase } from "../lib/supabase.service";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ · ร้านลุงเก้ต" },
      { name: "description", content: "เข้าสู่ระบบเพื่อสั่งอาหารจากร้านลุงเก้ต" },
    ],
  }),
  component: LoginPage,
});

// ── Brand ─────────────────────────────────────────────────────
const BRAND = "#002e47";
const BRAND_MID = "#004165";
const GOLD = "#fcc14a";
const LINEN = "#fff8f2";
const INK = "#0f1f2b";
const INK_MUTED = "#5a6e7a";
const LINE_GREEN = "#06C755";

type Tab = "login" | "register";

function LoginPage() {
  const navigate = useNavigate();

  // ── tab & form state ─────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  // ── check if already logged in ────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      let errorDesc: string | null = null;
      
      // Check hash (Implicit flow)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        errorDesc = hashParams.get("error_description");
      }
      
      // Check search (PKCE flow)
      if (!errorDesc && window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        errorDesc = searchParams.get("error_description");
      }

      if (errorDesc) {
        setFormError(decodeURIComponent(errorDesc).replace(/\+/g, " "));
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          await syncAuthUserToSupabase(session.user);
        } catch (e) {
          console.error("[Login] syncAuthUserToSupabase error:", e);
        }
        navigate({ to: "/" });
      }
    });

    // Also check LINE login (silent)
    initLiff()
      .then(() => {
        if (isLiffLoggedIn()) navigate({ to: "/" });
      })
      .catch(() => {}); // LIFF not configured — ignore

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // ── Supabase email/password ───────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!email.trim() || !password) {
      setFormError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setFormError(translateAuthError(error.message));
          setLoading(false);
        }
        // If success, onAuthStateChange will handle the redirect, keeping the spinner active
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setFormError(translateAuthError(error.message));
        } else {
          if (data.session) {
            setFormSuccess("สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...");
          } else {
            setFormSuccess("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ (หรือยืนยันอีเมลหากระบบต้องการ)");
            setTab("login");
          }
        }
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  // ── LINE Login ────────────────────────────────────────────────
  async function handleLineLogin() {
    setFormError("");
    setLineLoading(true);
    try {
      await initLiff();
      if (isLiffLoggedIn()) {
        // Already logged in via LINE — sync & go
        const { getLiffProfile } = await import("../lib/liff");
        const profile = await getLiffProfile();
        await syncLineUserToSupabase(profile).catch((e) => { console.error("[Login] syncLineUserToSupabase error:", e); });
        navigate({ to: "/" });
      } else {
        liffLogin(); // redirects to LINE
      }
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อ LINE ได้ในขณะนี้ กรุณาใช้ Email แทน");
      setLineLoading(false);
    }
  }

  // ── Google Login ──────────────────────────────────────────────
  async function handleGoogleLogin() {
    setFormError("");
    setLoading(true);
    try {
      // Remove redirectTo to let Supabase use the default Site URL configured in the dashboard.
      // This prevents strict URL matching errors (e.g., missing trailing slash).
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      
      if (error) {
        console.error("Google Login Error: " + error.message);
        setFormError(translateAuthError(error.message));
        setLoading(false);
      } else if (data?.url) {
        // If it succeeds, Supabase should navigate automatically. 
        // We log it so we know it didn't fail.
        console.log("Redirecting to: ", data.url);
      }
    } catch (err: any) {
      console.error("Google Login Exception: " + (err?.message || "Unknown error"));
      setFormError("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google");
      setLoading(false);
    }
  }

  function translateAuthError(msg: string): string {
    if (msg.includes("Invalid login credentials")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    if (msg.includes("Email not confirmed")) return "โปรดยืนยันอีเมลก่อนเข้าสู่ระบบ";
    if (msg.includes("User already registered")) return "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ";
    if (msg.includes("Password should be")) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (msg.includes("rate limit")) return "คุณพยายามสมัครบ่อยเกินไป กรุณารอสักครู่ (หรือตั้งค่าปลดล็อค Rate Limit ใน Supabase)";
    return msg;
  }

  // ── UI ───────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, #0d2d42 0%, #050d15 65%, #020609 100%)",
      }}
    >
      {/* Dot grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(252,193,74,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Frame */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "min(430px, 100vw)",
          minHeight: "min(932px, 100vh)",
          borderRadius: 28,
          background: LINEN,
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          zIndex: 1,
        }}
      >
        {/* ── Hero ─────────────────────────────────────────── */}
        <div
          className="flex flex-col items-center"
          style={{
            paddingTop: 48,
            paddingBottom: 40,
            background: `linear-gradient(170deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
          }}
        >
          {/* App icon */}
          <div
            className="mb-4 grid place-items-center"
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(252,193,74,0.3)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 28px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ fontSize: 40 }}>🍛</span>
          </div>

          <h1
            className="text-[24px] font-bold text-white tracking-tight"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            ร้านลุงเก้ต
          </h1>
          <p
            className="mt-1 text-[13px]"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            สั่งอาหารง่าย ๆ ผ่านระบบออนไลน์
          </p>

          {/* LINE logo badge */}
          <div
            className="mt-5 flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ background: "rgba(6,199,85,0.15)", border: "1px solid rgba(6,199,85,0.3)" }}
          >
            <LineIcon size={16} />
            <span style={{ color: "#06C755", fontSize: 12, fontWeight: 600 }}>
              รองรับการเข้าสู่ระบบด้วย LINE
            </span>
          </div>
        </div>

        {/* Wave */}
        <div style={{ marginTop: -1, lineHeight: 0 }}>
          <svg viewBox="0 0 430 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 C90 48 340 48 430 0 L430 48 L0 48 Z" fill={LINEN} />
          </svg>
        </div>

        {/* ── Form area ──────────────────────────────────── */}
        <div className="flex flex-col flex-1 px-7 pt-2 pb-8 gap-5">

          {/* Tab selector */}
          <div
            className="flex rounded-2xl p-1"
            style={{ background: "rgba(0,46,71,0.06)" }}
          >
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setFormError("");
                  setFormSuccess("");
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={
                  tab === t
                    ? {
                        background: BRAND,
                        color: "white",
                        boxShadow: "0 2px 12px rgba(0,46,71,0.25)",
                      }
                    : { color: INK_MUTED }
                }
              >
                {t === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </button>
            ))}
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email-input"
                className="text-xs font-semibold"
                style={{ color: INK_MUTED }}
              >
                อีเมล (Gmail หรืออีเมลอื่น)
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: INK_MUTED }}
                >
                  <MailIcon />
                </span>
                <input
                  id="email-input"
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  autoComplete="email"
                  className="w-full rounded-2xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(0,46,71,0.05)",
                    border: "1.5px solid rgba(0,46,71,0.12)",
                    color: INK,
                    fontFamily: "'Prompt', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = BRAND)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(0,46,71,0.12)")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password-input"
                  className="text-xs font-semibold"
                  style={{ color: INK_MUTED }}
                >
                  รหัสผ่าน
                </label>
                {tab === "login" && (
                  <button
                    type="button"
                    className="text-[11px] font-medium"
                    style={{ color: BRAND }}
                    onClick={() => setFormError("กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน")}
                  >
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: INK_MUTED }}
                >
                  <LockIcon />
                </span>
                <input
                  id="password-input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "login" ? "รหัสผ่านของคุณ" : "อย่างน้อย 6 ตัวอักษร"}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  className="w-full rounded-2xl py-3.5 pl-10 pr-12 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(0,46,71,0.05)",
                    border: "1.5px solid rgba(0,46,71,0.12)",
                    color: INK,
                    fontFamily: "'Prompt', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = BRAND)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(0,46,71,0.12)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: INK_MUTED }}
                  aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {formError && (
              <div
                className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#b91c1c" }}
              >
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div
                className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                style={{ background: "rgba(6,199,85,0.08)", border: "1px solid rgba(6,199,85,0.2)", color: "#15803d" }}
              >
                <span className="shrink-0 mt-0.5">✅</span>
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              id="email-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white text-[15px] transition-all active:scale-[0.97]"
              style={{
                background: loading
                  ? "rgba(0,46,71,0.4)"
                  : `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
                boxShadow: loading ? "none" : "0 6px 20px rgba(0,46,71,0.3)",
              }}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  กำลังดำเนินการ…
                </>
              ) : tab === "login" ? (
                "เข้าสู่ระบบ"
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "rgba(0,46,71,0.1)" }} />
            <span className="text-xs" style={{ color: INK_MUTED }}>
              หรือเข้าสู่ระบบด้วย
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(0,46,71,0.1)" }} />
          </div>

          {/* LINE Login Button */}
          <button
            id="line-login-btn"
            onClick={handleLineLogin}
            disabled={lineLoading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-bold text-white text-[15px] transition-all active:scale-[0.97]"
            style={{
              background: lineLoading
                ? "rgba(6,199,85,0.4)"
                : `linear-gradient(135deg, ${LINE_GREEN} 0%, #05a847 100%)`,
              boxShadow: lineLoading ? "none" : "0 6px 24px rgba(6,199,85,0.35)",
            }}
          >
            {lineLoading ? (
              <>
                <SpinnerIcon />
                กำลังเชื่อมต่อ LINE…
              </>
            ) : (
              <>
                <LineIcon size={22} />
                เข้าสู่ระบบด้วย LINE
              </>
            )}
          </button>

          {/* Google Login Button */}
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-bold text-slate-700 text-[15px] transition-all active:scale-[0.97]"
            style={{
              background: loading ? "rgba(255,255,255,0.7)" : "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            {loading ? (
              <>
                <SpinnerIcon />
                กำลังเชื่อมต่อ Google…
              </>
            ) : (
              <>
                <GoogleIcon size={22} />
                เข้าสู่ระบบด้วย Google
              </>
            )}
          </button>

          {/* Privacy note */}
          <p
            className="text-center text-[11px] leading-relaxed px-4"
            style={{ color: "rgba(0,46,71,0.35)" }}
          >
            การเข้าสู่ระบบแสดงว่าคุณยอมรับเงื่อนไขการใช้งาน
            <br />
            ข้อมูลของคุณจะถูกเก็บเป็นความลับ
          </p>
        </div>

        {/* Footer */}
        <div
          className="py-4 text-center border-t"
          style={{ borderColor: "rgba(0,46,71,0.07)" }}
        >
          <p className="text-[10px]" style={{ color: "rgba(0,46,71,0.3)" }}>
            © 2026 ร้านลุงเก้ต · Powered by Supabase & LINE LIFF
          </p>
        </div>

        {/* Keyframe */}
        <style>{`
          @keyframes spin-btn { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────────────────────
function LineIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="white"
      width={size}
      height={size}
    >
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{ animation: "spin-btn 0.8s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
