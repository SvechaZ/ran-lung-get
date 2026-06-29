import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/staff/")({
  component: StaffDashboard,
});

type TableInfo = { id: string; label: string; status: string };
type OrderCounts = { pending: number; preparing: number; completed: number };

function StaffDashboard() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [counts, setCounts] = useState<OrderCounts>({ pending: 0, preparing: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  async function fetchData() {
    setLoading(true);
    try {
      const { data: tablesData } = await (supabase as any)
        .from("tables")
        .select("id, label, status")
        .order("id");
      if (tablesData) setTables(tablesData as TableInfo[]);

      try {
        const { data: ordersData } = await (supabase as any)
          .from("orders")
          .select("status");
        if (ordersData) {
          setCounts({
            pending: (ordersData as any[]).filter((o) => o.status === "pending").length,
            preparing: (ordersData as any[]).filter((o) => o.status === "preparing").length,
            completed: (ordersData as any[]).filter((o) => o.status === "completed").length,
          });
        }
      } catch { /* orders not ready */ }
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }

  useEffect(() => {
    fetchData();
    const tablesCh = (supabase as any)
      .channel("staff-tables-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () => fetchData())
      .subscribe();
    const ordersCh = (supabase as any)
      .channel("staff-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .subscribe();
    return () => {
      (supabase as any).removeChannel(tablesCh);
      (supabase as any).removeChannel(ordersCh);
    };
  }, []);

  const occupied = tables.filter((t) => t.status === "occupied");
  const available = tables.filter((t) => t.status === "available");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-[#002e47] text-white px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-widest">Staff Panel</p>
            <h1 className="text-2xl font-bold mt-1">ระบบจัดการร้าน</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs bg-white/15 px-3 py-1.5 rounded-full"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            รีเฟรช
          </motion.button>
        </div>
        <p className="text-xs text-white/40 mt-2">อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString("th-TH")}</p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Order stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "รอยืนยัน", value: counts.pending, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
            { label: "กำลังทำ", value: counts.preparing, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
            { label: "เสร็จแล้ว", value: counts.completed, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
          ].map((c) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-3 text-center border"
              style={{ background: c.bg, borderColor: c.border }}
            >
              <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{c.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Table status grid */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#002e47]">สถานะโต๊ะ</h2>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />ว่าง {available.length}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />ไม่ว่าง {occupied.length}
              </span>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-[#002e47] border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl p-2 text-center text-xs font-bold border-2"
                  style={{
                    background: t.status === "occupied" ? "#fee2e2" : "#dcfce7",
                    borderColor: t.status === "occupied" ? "#dc2626" : "#15803d",
                    color: t.status === "occupied" ? "#7f1d1d" : "#14532d",
                  }}
                >
                  <p>{t.label}</p>
                  <p className="text-[10px] font-normal opacity-70 mt-0.5">
                    {t.status === "occupied" ? "ไม่ว่าง" : "ว่าง"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Occupied detail */}
        {occupied.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-[#002e47] mb-3">โต๊ะที่มีลูกค้า ({occupied.length})</h2>
            <div className="space-y-2">
              {occupied.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-xl border border-red-100"
                >
                  <span className="text-sm font-semibold text-red-900">{t.label}</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      // Optimistic update
                      setTables((prev) => prev.map(table => table.id === t.id ? { ...table, status: "available" } : table));
                      // Update DB
                      await (supabase as any).from("tables").update({ status: "available" }).eq("id", t.id);
                    }}
                    className="text-xs bg-white text-red-700 border border-red-200 shadow-sm font-bold px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                  >
                    เคลียร์โต๊ะ
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tables.length === 0 && !loading && (
          <div className="text-center py-10 text-slate-400 text-sm">
            ยังไม่มีข้อมูลโต๊ะ — กรุณา run SQL ใน Supabase ก่อน
          </div>
        )}
      </div>
    </div>
  );
}
