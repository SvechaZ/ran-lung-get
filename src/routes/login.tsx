import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { User, ShieldAlert, KeyRound, Phone, ChevronRight, Check } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});

const BRAND = "#002e47";
const GOLD = "#fcc14a";
const INK_MUTED = "#5a6e7a";
const LINEN = "#fff8f2";
const SURFACE = "#f8fafc";

function LoginScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"customer" | "staff">("customer");
  
  // Customer states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerError, setCustomerError] = useState("");

  // Staff states
  const [password, setPassword] = useState("");
  const [staffError, setStaffError] = useState("");

  // Check if already logged in
  useEffect(() => {
    // If query param has role=staff, switch tab
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("role") === "staff") {
      setActiveTab("staff");
    }
  }, []);

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setCustomerError("กรุณากรอกชื่อของคุณ");
      return;
    }
    if (phone.length < 10) {
      setCustomerError("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");
      return;
    }
    
    // Save customer info
    localStorage.setItem(
      "ran-lung-get-user",
      JSON.stringify({ name: name.trim(), phone })
    );
    
    // Redirect to home page
    navigate({ to: "/" });
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1234") {
      // Save staff mock token
      localStorage.setItem("ran-lung-get-staff-token", "authenticated-staff-token-1234");
      
      // Redirect to kitchen monitor
      navigate({ to: "/kitchen" });
    } else {
      setStaffError("รหัสผ่านไม่ถูกต้อง (ทดลองใช้รหัส: 1234)");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, #11304a 0%, #050c14 60%, #02060b 100%)",
      }}
    >
      <div
        className="relative overflow-hidden bg-[var(--linen)] flex flex-col no-scrollbar"
        style={{
          width: "min(430px, 100vw)",
          height: "min(932px, 100vh)",
          borderRadius: 28,
          boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
          background: LINEN,
        }}
      >
        {/* Banner header */}
        <div className="px-6 pt-12 pb-8 text-center text-white" style={{ background: BRAND }}>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: GOLD }}>
            ร้านลุงเกตุ
          </h1>
          <p className="text-sm text-white/70 mt-1 uppercase tracking-[0.2em] font-medium">
            RAN LUNG GET ORDERING SYSTEM
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex px-6 mt-6">
          <div className="w-full flex bg-[#002e47]/5 p-1 rounded-2xl border border-[#ece4d6]">
            <button
              onClick={() => {
                setActiveTab("customer");
                setCustomerError("");
              }}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: activeTab === "customer" ? BRAND : "transparent",
                color: activeTab === "customer" ? GOLD : INK_MUTED,
              }}
            >
              <User size={16} />
              <span>ลูกค้า</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("staff");
                setStaffError("");
              }}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: activeTab === "staff" ? BRAND : "transparent",
                color: activeTab === "staff" ? GOLD : INK_MUTED,
              }}
            >
              <ShieldAlert size={16} />
              <span>พนักงานร้าน</span>
            </button>
          </div>
        </div>

        {/* Form contents */}
        <div className="flex-1 px-6 mt-8">
          {activeTab === "customer" ? (
            <motion.form
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleCustomerLogin}
              className="space-y-5"
            >
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold" style={{ color: BRAND }}>
                  ลงทะเบียนผู้เข้าใช้งาน
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  พิมพ์ข้อมูลด้านล่างเพื่อเชื่อมโยงออเดอร์และบันทึกประวัติการสั่งซื้อ
                </p>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: BRAND }}>
                  ชื่อของคุณ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setCustomerError("");
                    }}
                    placeholder="กรอกชื่อสำหรับสั่งอาหาร..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#002e47]/20 transition-all"
                    style={{ borderColor: "#ece4d6", color: BRAND, background: "white" }}
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: BRAND }}>
                  เบอร์โทรศัพท์สำหรับติดต่อ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setCustomerError("");
                    }}
                    placeholder="0XXXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002e47]/20 transition-all"
                    style={{ borderColor: "#ece4d6", color: BRAND, background: "white" }}
                  />
                </div>
              </div>

              {customerError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-semibold leading-normal">
                  * {customerError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6"
                style={{ background: BRAND }}
              >
                <span>เข้าสู่หน้าร้านอาหาร</span>
                <ChevronRight size={16} style={{ color: GOLD }} />
              </button>
            </motion.form>
          ) : (
            <motion.form
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleStaffLogin}
              className="space-y-5"
            >
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold" style={{ color: BRAND }}>
                  ล็อกอินสำหรับพนักงานร้าน
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  จำกัดการเข้าถึงสำหรับพนักงานในครัวและผู้ดูแลร้านเท่านั้น
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: BRAND }}>
                  รหัสผ่านพนักงาน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setStaffError("");
                    }}
                    placeholder="กรอกรหัสผ่าน..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#002e47]/20 transition-all"
                    style={{ borderColor: "#ece4d6", color: BRAND, background: "white" }}
                  />
                </div>
              </div>

              {staffError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-semibold leading-normal">
                  * {staffError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6"
                style={{ background: BRAND }}
              >
                <span>เข้าสู่ระบบครัว</span>
                <ChevronRight size={16} style={{ color: GOLD }} />
              </button>
            </motion.form>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-6 border-t border-[#ece4d6]/60 text-center">
          <p className="text-[10px] text-slate-400 font-medium leading-normal">
            ระบบจัดจำหน่ายผ่าน LINE LIFF ร้านลุงเกตุ เวอร์ชันทดสอบ Prototype<br />
            © 2026 Ran Lung Get Restaurant
          </p>
        </div>
      </div>
    </div>
  );
}
