import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { initLiff, isLiffLoggedIn, liffLogin } from "../lib/liff";
import { syncLineUserToSupabase } from "../lib/supabase.service";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ · ร้านลุงเกตุ" },
      { name: "description", content: "เข้าสู่ระบบเพื่อสั่งอาหารจากร้านลุงเกตุ" },
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

type AuthTab = "customer" | "staff";
type CustomerSubTab = "login" | "register";

function LoginPage() {
  const navigate = useNavigate();

  // ── top-level tab: customer or staff ─────────────────────────
  const [authTab, setAuthTab] = useState<AuthTab>("customer");

  // ── customer sub-tab & form state ────────────────────────────
  const [tab, setTab] = useState<CustomerSubTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lineLoading, setLineLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  // ── staff form state ──────────────────────────────────────────
  const [staffPassword, setStaffPassword] = useState("");
  const [staffError, setStaffError] = useState("");

  // ── check if already logged in ────────────────────────────────
  useEffect(() => {
    // Check mock staff token
    if (localStorage.getItem("ran-lung-get-staff-token")) {
      navigate({ to: "/staff" });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    initLiff()
      .then(() => { if (isLiffLoggedIn()) navigate({ to: "/" }); })
      .catch(() => {});
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
        } else {
          navigate({ to: "/" });
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setFormError(translateAuthError(error.message));
        } else {
          setFormSuccess("สมัครสมาชิกสำเร็จ! โปรดตรวจสอบอีเมลเพื่อยืนยันบัญชี");
          setTab("login");
        }
      }
    } finally {
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
        const { getLiffProfile } = await import("../lib/liff");
        const profile = await getLiffProfile();
        await syncLineUserToSupabase(profile).catch((e) => { console.error("[Login] syncLineUserToSupabase error:", e); });
        navigate({ to: "/" });
      } else {
        liffLogin();
      }
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อ LINE ได้ในขณะนี้ กรุณาใช้ Email แทน");
      setLineLoading(false);
    }
  }

  // ── Staff mock login ──────────────────────────────────────────
  function handleStaffLogin(e: React.FormEvent) {
    e.preventDefault();
    setStaffError("");
    if (staffPassword === "1234") {
      localStorage.setItem("ran-lung-get-staff-token", "authenticated-staff-token-1234");
      navigate({ to: "/staff" });
    } else {
      setStaffError("รหัสผ่านไม่ถูกต้อง (ทดลองใช้: 1234)");
    }
  }

  function translateAuthError(msg: string): string {
    if (msg.includes("Invalid login credentials")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    if (msg.includes("Email not confirmed")) return "โปรดยืนยันอีเมลก่อนเข้าสู่ระบบ";
    if (msg.includes("User already registered")) return "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ";
    if (msg.includes("Password should be")) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (msg.includes("rate limit")) return "ลองใหม่อีกครู่";
    return msg;
  }

  // ── UI ───────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 20% 20%, #0d2d42 0%, #050d15 65%, #020609 100%)",
      }}
    >
      {/* Dot grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(252,193,74,0.05) 1px, transparent 1px)",
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
          boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
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
            ร้านลุงเกตุ
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            สั่งอาหารง่าย ๆ ผ่านระบบออนไลน์
          </p>

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

        {/* ── Auth Tab Switcher (Customer / Staff) ─────────── */}
        <div className="flex px-7 gap-3 mb-4">
          {(["customer", "staff"] as AuthTab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setAuthTab(t);
                setFormError("");
                setStaffError("");
              }}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={
                authTab === t
                  ? { background: BRAND, color: "white", boxShadow: "0 2px 12px rgba(0,46,71,0.25)" }
                  : { background: "rgba(0,46,71,0.06)", color: INK_MUTED }
              }
            >
              {t === "customer" ? "🛍️ ลูกค้า" : "👨‍🍳 พนักงานร้าน"}
            </button>
          ))}
        </div>

        {/* ── Form area ────────────────────────────────────── */}
        <div className="flex flex-col flex-1 px-7 pb-8 gap-5">

          {authTab === "customer" ? (
            <>
              {/* Customer sub-tab: login / register */}
              <div
                className="flex rounded-2xl p-1"
                style={{ background: "rgba(0,46,71,0.06)" }}
              >
                {(["login", "register"] as CustomerSubTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setFormError(""); setFormSuccess(""); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={
                      tab === t
                        ? { background: BRAND, color: "white", boxShadow: "0 2px 12px rgba(0,46,71,0.25)" }
                        : { color: INK_MUTED }
                    }
                  >
                    {t === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                  </button>
                ))}
              </div>

              {/* Email/Password form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email-input" className="text-xs font-semibold" style={{ color: INK_MUTED }}>
                    อีเมล (Gmail หรืออีเมลอื่น)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: INK_MUTED }}>
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
                      }}
                      onFocus={(e) => (e.target.style.borderColor = BRAND)}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(0,46,71,0.12)")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password-input" className="text-xs font-semibold" style={{ color: INK_MUTED }}>
                      รหัสผ่าน
                    </label>
                    {tab === "login" && (
                      <button type="button" className="text-[11px] font-medium" style={{ color: BRAND }}
                        onClick={() => setFormError("กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน")}>
                        ลืมรหัสผ่าน?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: INK_MUTED }}>
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
                      }}
                      onFocus={(e) => (e.target.style.borderColor = BRAND)}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(0,46,71,0.12)")}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: INK_MUTED }}>
                      {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#b91c1c" }}>
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                    style={{ background: "rgba(6,199,85,0.08)", border: "1px solid rgba(6,199,85,0.2)", color: "#15803d" }}>
                    <span className="shrink-0 mt-0.5">✅</span>
                    <span>{formSuccess}</span>
                  </div>
                )}

                <button
                  id="email-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white text-[15px] transition-all active:scale-[0.97]"
                  style={{
                    background: loading ? "rgba(0,46,71,0.4)" : `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
                    boxShadow: loading ? "none" : "0 6px 20px rgba(0,46,71,0.3)",
                  }}
                >
                  {loading ? (<><SpinnerIcon />กำลังดำเนินการ…</>) : tab === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(0,46,71,0.1)" }} />
                <span className="text-xs" style={{ color: INK_MUTED }}>หรือเข้าสู่ระบบด้วย</span>
                <div className="flex-1 h-px" style={{ background: "rgba(0,46,71,0.1)" }} />
              </div>

              {/* LINE Login Button */}
              <button
                id="line-login-btn"
                onClick={handleLineLogin}
                disabled={lineLoading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-bold text-white text-[15px] transition-all active:scale-[0.97]"
                style={{
                  background: lineLoading ? "rgba(6,199,85,0.4)" : `linear-gradient(135deg, ${LINE_GREEN} 0%, #05a847 100%)`,
                  boxShadow: lineLoading ? "none" : "0 6px 24px rgba(6,199,85,0.35)",
                }}
              >
                {lineLoading ? (<><SpinnerIcon />กำลังเชื่อมต่อ LINE…</>) : (<><LineIcon size={22} />เข้าสู่ระบบด้วย LINE</>)}
              </button>

              <p className="text-center text-[11px] leading-relaxed px-4" style={{ color: "rgba(0,46,71,0.35)" }}>
                การเข้าสู่ระบบแสดงว่าคุณยอมรับเงื่อนไขการใช้งาน
                <br />ข้อมูลของคุณจะถูกเก็บเป็นความลับ
              </p>
            </>
          ) : (
            /* ── Staff login section ──────────────────────── */
            <form onSubmit={handleStaffLogin} className="flex flex-col gap-4">
              <div
                className="p-4 rounded-2xl text-center"
                style={{ background: "rgba(0,46,71,0.05)", border: "1.5px solid rgba(0,46,71,0.1)" }}
              >
                <p className="text-2xl mb-1">👨‍🍳</p>
                <h2 className="text-sm font-bold" style={{ color: BRAND }}>ล็อกอินสำหรับพนักงานร้าน</h2>
                <p className="text-xs mt-1" style={{ color: INK_MUTED }}>จำกัดการเข้าถึงสำหรับพนักงานในครัวและผู้ดูแลร้านเท่านั้น</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-password-input" className="text-xs font-semibold" style={{ color: INK_MUTED }}>
                  รหัสผ่านพนักงาน
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: INK_MUTED }}>
                    <LockIcon />
                  </span>
                  <input
                    id="staff-password-input"
                    type="password"
                    value={staffPassword}
                    onChange={(e) => { setStaffPassword(e.target.value); setStaffError(""); }}
                    placeholder="กรอกรหัสผ่าน..."
                    className="w-full rounded-2xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all"
                    style={{
                      background: "rgba(0,46,71,0.05)",
                      border: "1.5px solid rgba(0,46,71,0.12)",
                      color: INK,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = BRAND)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(0,46,71,0.12)")}
                  />
                </div>
              </div>

              {staffError && (
                <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#b91c1c" }}>
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{staffError}</span>
                </div>
              )}

              <button
                id="staff-submit-btn"
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white text-[15px] transition-all active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
                  boxShadow: "0 6px 20px rgba(0,46,71,0.3)",
                }}
              >
                🔐 เข้าสู่ระบบหลังบ้าน
              </button>

              <p className="text-center text-[11px]" style={{ color: "rgba(0,46,71,0.4)" }}>
                ทดสอบ: ใช้รหัสผ่าน <strong>1234</strong>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="py-4 text-center border-t" style={{ borderColor: "rgba(0,46,71,0.07)" }}>
          <p className="text-[10px]" style={{ color: "rgba(0,46,71,0.3)" }}>
            © 2026 ร้านลุงเกตุ · Powered by Supabase & LINE LIFF
          </p>
        </div>

        <style>{`@keyframes spin-btn { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Inline SVG Icons ──────────────────────────────────────────
function LineIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width={size} height={size}>
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: "spin-btn 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}