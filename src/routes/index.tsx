import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Menu,
  Plus,
  Minus,
  ShoppingBag,
  ChevronLeft,
  Trash2,
  X,
  Copy,
  Check,
  Upload,
  CheckCircle,
  ChefHat,
  Bike,
  PartyPopper,
  Phone,
  MapPin,
  LogOut,
  Home as HomeIcon,
  ClipboardList,
  MessageCircle,
  User,
  Star,
  Utensils,
  Clock,
  ChevronRight,
} from "lucide-react";

type OrderType = "dine-in" | "takeaway" | "delivery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LINE LIFF · Epicurean Delivery" },
      { name: "description", content: "สั่งอาหารพรีเมียมผ่าน LINE LIFF" },
      { property: "og:title", content: "Epicurean Delivery" },
      { property: "og:description", content: "Premium food delivery on LINE" },
    ],
  }),
  component: LiffApp,
});

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────
type Addon = { id: string; name: string; price: number };
type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  category: string;
  spicy?: boolean;
  options?: { id: string; name: string; choices: { id: string; label: string; price?: number }[] }[];
  addons?: Addon[];
};

const HERO_IMG =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80";

const MENU: MenuItem[] = [
  {
    id: "m1",
    name: "Premium Wagyu Don",
    desc: "ข้าวหน้าเนื้อวากิวย่างซอสญี่ปุ่นต้นตำรับ",
    price: 420,
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    category: "signature",
    options: [
      {
        id: "spicy",
        name: "ระดับความเผ็ด",
        choices: [
          { id: "0", label: "ไม่เผ็ด" },
          { id: "1", label: "เผ็ดน้อย" },
          { id: "2", label: "เผ็ดกลาง" },
          { id: "3", label: "เผ็ดมาก" },
        ],
      },
    ],
    addons: [
      { id: "egg", name: "ไข่ดาว", price: 15 },
      { id: "cheese", name: "ชีสพิเศษ", price: 30 },
    ],
  },
  {
    id: "m2",
    name: "Truffle Mushroom Risotto",
    desc: "ริซอตโต้เห็ดทรัฟเฟิลครีมสไตล์อิตาเลียน",
    price: 360,
    image:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80",
    category: "signature",
    addons: [
      { id: "parm", name: "พาร์เมซานเพิ่ม", price: 40 },
    ],
  },
  {
    id: "m3",
    name: "Charcoal Salmon Bowl",
    desc: "แซลมอนย่างถ่านเสิร์ฟพร้อมข้าวญี่ปุ่น",
    price: 290,
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
    category: "signature",
  },
  {
    id: "m4",
    name: "Matcha Latte",
    desc: "มัทฉะแท้จากอุจิ เสิร์ฟเย็น",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80",
    category: "drinks",
  },
  {
    id: "m5",
    name: "Cold Brew Coffee",
    desc: "กาแฟสกัดเย็น 12 ชั่วโมง รสชาตินุ่มลึก",
    price: 110,
    image:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
    category: "drinks",
  },
  {
    id: "m6",
    name: "Tiramisu Classico",
    desc: "ทีรามิสุสูตรต้นตำรับ มาสคาร์โปเนแท้",
    price: 160,
    image:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
    category: "dessert",
  },
];

const CATEGORIES = [
  { id: "all", label: "ทั้งหมด" },
  { id: "signature", label: "Signature" },
  { id: "drinks", label: "เครื่องดื่ม" },
  { id: "dessert", label: "ของหวาน" },
];

type CartLine = {
  id: string; // unique line id
  itemId: string;
  name: string;
  price: number; // unit price w/ addons
  qty: number;
  addons: Addon[];
  options: Record<string, string>;
  note: string;
  image: string;
};

const BRAND = "#002e47";
const GOLD = "#fcc14a";
const INK_MUTED = "#5a6e7a";
const LINEN = "#fff8f2";
const SURFACE = "#f8fafc";

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────
function LiffApp() {
  const [tab, setTab] = useState<"home" | "status">("home");
  const [overlay, setOverlay] = useState<null | "menu" | "orderConfirm" | "payment">(null);
  const [sidebar, setSidebar] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartDrawer, setCartDrawer] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [showSuccess, setShowSuccess] = useState(false);

  const totalQty = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);

  const addToCart = (line: CartLine) => setCart((c) => [...c, line]);
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.id !== id));
  const resetAll = () => {
    setCart([]);
    setOverlay(null);
    setCartDrawer(false);
    setSelectedItem(null);
    setTab("home");
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
        className="relative overflow-hidden bg-[var(--linen)] no-scrollbar"
        style={{
          width: "min(430px, 100vw)",
          height: "min(932px, 100vh)",
          borderRadius: 28,
          boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        <div className="absolute inset-0 overflow-y-auto no-scrollbar">
          {tab === "home" && (
            <HomeScreen
              onOpenSidebar={() => setSidebar(true)}
              orderType={orderType}
              setOrderType={setOrderType}
              onPickItem={(it) => setSelectedItem(it)}
              onOpenCart={() => setCartDrawer(true)}
              totalQty={totalQty}
              subtotal={subtotal}
              onOpenMenu={() => setOverlay("menu")}
            />
          )}
          {tab === "status" && (
            <StatusScreen
              onOpenSidebar={() => setSidebar(true)}
              onBackHome={resetAll}
              cart={cart}
              subtotal={subtotal}
            />
          )}
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {selectedItem && (
            <ItemModal
              key="item"
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAdd={(line) => {
                addToCart(line);
                setSelectedItem(null);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {overlay === "menu" && (
            <MenuOverlay
              key="menu"
              onBack={() => setOverlay(null)}
              onPickItem={(it) => setSelectedItem(it)}
              cart={cart}
              onOpenCart={() => setCartDrawer(true)}
              totalQty={totalQty}
              subtotal={subtotal}
            />
          )}
          {overlay === "orderConfirm" && (
            <OrderConfirmOverlay
              key="confirm"
              cart={cart}
              subtotal={subtotal}
              onBack={() => setOverlay("menu")}
              onRemove={removeLine}
              onProceed={() => setOverlay("payment")}
            />
          )}
          {overlay === "payment" && (
            <PaymentOverlay
              key="pay"
              total={subtotal + 40}
              onBack={() => setOverlay("orderConfirm")}
              onSuccess={() => {
                setShowSuccess(true);
                setTimeout(() => {
                  setShowSuccess(false);
                  setOverlay(null);
                  setTab("status");
                }, 1500);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cartDrawer && (
            <CartDrawer
              key="cd"
              cart={cart}
              subtotal={subtotal}
              onClose={() => setCartDrawer(false)}
              onRemove={removeLine}
              onCheckout={() => {
                setCartDrawer(false);
                setOverlay("orderConfirm");
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sidebar && (
            <Sidebar
              key="sb"
              onClose={() => setSidebar(false)}
              onNavigate={(t) => {
                setSidebar(false);
                setTab(t);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && <SuccessFlash key="sf" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────
function HomeScreen({
  onOpenSidebar,
  orderType,
  setOrderType,
  onPickItem,
  onOpenCart,
  totalQty,
  subtotal,
  onOpenMenu,
}: {
  onOpenSidebar: () => void;
  orderType: OrderType;
  setOrderType: (m: OrderType) => void;
  onPickItem: (m: MenuItem) => void;
  onOpenCart: () => void;
  totalQty: number;
  subtotal: number;
  onOpenMenu: () => void;
}) {
  const [cat, setCat] = useState("all");
  const items = useMemo(
    () => (cat === "all" ? MENU : MENU.filter((m) => m.category === cat)),
    [cat],
  );

  return (
    <div className="pb-32" style={{ background: LINEN }}>
      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden">
        <img src={HERO_IMG} alt="restaurant" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,18,30,0.55) 0%, rgba(0,18,30,0.25) 40%, rgba(0,18,30,0.85) 100%)",
          }}
        />
        <button
          onClick={onOpenSidebar}
          className="absolute top-5 left-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20"
        >
          <Menu size={20} />
        </button>
        <div className="absolute top-5 right-5 flex items-center gap-1 text-white/90 text-xs bg-white/10 backdrop-blur-md px-3 py-2 rounded-full border border-white/15">
          <MapPin size={14} /> Sukhumvit 31
        </div>

        <div className="absolute bottom-20 left-5 right-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">EPICUREAN</p>
          <h1 className="text-2xl font-bold mt-1">สวัสดี, ยินดีต้อนรับ</h1>
          <p className="text-sm text-white/80 mt-1">เลือกประสบการณ์การรับประทาน</p>
        </div>

        {/* Order type segmented control floating */}
        <div className="absolute -bottom-6 left-5 right-5">
          <div
            className="rounded-full p-1 flex backdrop-blur-md border border-white/40 shadow-lift"
            style={{ background: "rgba(255,255,255,0.85)" }}
          >
            {(
              [
                { id: "dine-in", label: "กินที่ร้าน" },
                { id: "takeaway", label: "รับกลับบ้าน" },
                { id: "delivery", label: "จัดส่ง" },
              ] as { id: OrderType; label: string }[]
            ).map((m) => {
              const active = orderType === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setOrderType(m.id)}
                  className="relative flex-1 py-2.5 text-[13px] rounded-full transition-colors"
                  style={{
                    color: active ? GOLD : INK_MUTED,
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: BRAND,
                        boxShadow: "0 8px 20px -6px rgba(0,46,71,0.45)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conditional input for order type */}
      <div className="px-5 mt-10">
        <AnimatePresence mode="wait">
          <motion.button
            key={orderType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-soft border border-[#ece4d6]"
          >
            <div
              className="grid h-10 w-10 place-items-center rounded-full shrink-0"
              style={{ background: LINEN, color: BRAND }}
            >
              {orderType === "delivery" && <MapPin size={18} />}
              {orderType === "dine-in" && <Utensils size={18} />}
              {orderType === "takeaway" && <Clock size={18} />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: INK_MUTED }}>
                {orderType === "delivery" && "Delivery"}
                {orderType === "dine-in" && "Dine-in"}
                {orderType === "takeaway" && "Takeaway"}
              </p>
              <p className="text-sm font-semibold truncate" style={{ color: BRAND }}>
                {orderType === "delivery" && "จัดส่งที่: ระบุที่อยู่ของคุณ"}
                {orderType === "dine-in" && "ระบุหมายเลขโต๊ะของคุณ"}
                {orderType === "takeaway" && "รับอาหารเวลา: ด่วนที่สุด (15 นาที)"}
              </p>
            </div>
            <ChevronRight size={18} style={{ color: INK_MUTED }} />
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Categories */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: BRAND }}>
            หมวดหมู่
          </h2>
          <button onClick={onOpenMenu} className="text-xs font-medium" style={{ color: INK_MUTED }}>
            ดูทั้งหมด →
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          {CATEGORIES.map((c) => {
            const active = c.id === cat;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all"
                style={{
                  background: active ? BRAND : "white",
                  color: active ? GOLD : BRAND,
                  borderColor: active ? BRAND : "#ece4d6",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu list */}
      <div className="px-5 mt-5 space-y-4">
        <h2 className="text-lg font-bold" style={{ color: BRAND }}>
          เมนูแนะนำ
        </h2>
        {items.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onPickItem(m)}
            className="bg-white rounded-2xl p-3 flex gap-3 shadow-soft cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
              <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: GOLD }}>
                <Star size={10} fill={GOLD} stroke={GOLD} />
                <span style={{ color: INK_MUTED }}>Chef's pick</span>
              </div>
              <h3 className="font-semibold text-[15px] truncate" style={{ color: BRAND }}>
                {m.name}
              </h3>
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: INK_MUTED }}>
                {m.desc}
              </p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="font-bold text-base" style={{ color: BRAND }}>
                  ฿{m.price}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickItem(m);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full shadow-soft"
                  style={{ background: BRAND, color: GOLD }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sticky cart bar */}
      {totalQty > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 pt-10 pb-5 px-5"
          style={{
            background:
              "linear-gradient(to top, rgba(255,248,242,1) 35%, rgba(255,248,242,0.6) 70%, rgba(255,248,242,0) 100%)",
          }}
        >
          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={onOpenCart}
            className="w-full rounded-2xl px-5 py-4 flex items-center justify-between shadow-lift"
            style={{ background: BRAND, color: "white" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative grid h-9 w-9 place-items-center rounded-xl" style={{ background: "rgba(252,193,74,0.15)" }}>
                <ShoppingBag size={18} style={{ color: GOLD }} />
                <span
                  className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-bold"
                  style={{ background: GOLD, color: BRAND }}
                >
                  {totalQty}
                </span>
              </div>
              <span className="font-medium">ตะกร้าสินค้า</span>
            </div>
            <span className="font-bold" style={{ color: GOLD }}>
              ฿{subtotal}
            </span>
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Item Modal
// ─────────────────────────────────────────────────────────────
function ItemModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const [qty, setQty] = useState(1);
  const [options, setOptions] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    item.options?.forEach((g) => (o[g.id] = g.choices[0].id));
    return o;
  });
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const addonTotal = (item.addons ?? [])
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((s, a) => s + a.price, 0);
  const unit = item.price + addonTotal;
  const total = unit * qty;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 z-30"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 top-12 z-40 bg-white rounded-t-3xl overflow-hidden flex flex-col"
      >
        <div className="relative h-56 shrink-0">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-soft"
          >
            <X size={18} style={{ color: BRAND }} />
          </button>
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold" style={{ background: GOLD, color: BRAND }}>
            Signature
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-32">
          <h2 className="text-2xl font-bold" style={{ color: BRAND }}>
            {item.name}
          </h2>
          <p className="text-sm mt-1" style={{ color: INK_MUTED }}>
            {item.desc}
          </p>
          <p className="mt-2 text-xl font-bold" style={{ color: BRAND }}>
            ฿{item.price}
          </p>

          {item.options?.map((g) => (
            <div key={g.id} className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold" style={{ color: BRAND }}>
                  {g.name}
                </h3>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#fff2d6", color: BRAND }}>
                  จำเป็น
                </span>
              </div>
              <div className="space-y-2">
                {g.choices.map((c) => {
                  const active = options[g.id] === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setOptions({ ...options, [g.id]: c.id })}
                      className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left"
                      style={{
                        borderColor: active ? BRAND : "#ece4d6",
                        background: active ? "#fff8e6" : "white",
                      }}
                    >
                      <span className="text-sm font-medium" style={{ color: BRAND }}>
                        {c.label}
                      </span>
                      <span
                        className="grid h-5 w-5 place-items-center rounded-full border-2"
                        style={{ borderColor: active ? BRAND : "#cbd5d8" }}
                      >
                        {active && <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND }} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {item.addons && item.addons.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2" style={{ color: BRAND }}>
                เพิ่มเติม
              </h3>
              <div className="space-y-2">
                {item.addons.map((a) => {
                  const active = selectedAddons.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() =>
                        setSelectedAddons((s) =>
                          active ? s.filter((x) => x !== a.id) : [...s, a.id],
                        )
                      }
                      className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left"
                      style={{
                        borderColor: active ? BRAND : "#ece4d6",
                        background: active ? "#fff8e6" : "white",
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="grid h-5 w-5 place-items-center rounded-md border-2"
                          style={{
                            borderColor: active ? BRAND : "#cbd5d8",
                            background: active ? BRAND : "transparent",
                          }}
                        >
                          {active && <Check size={12} color={GOLD} strokeWidth={3} />}
                        </span>
                        <span className="text-sm font-medium" style={{ color: BRAND }}>
                          + {a.name}
                        </span>
                      </span>
                      <span className="text-sm font-semibold" style={{ color: BRAND }}>
                        {a.price} ฿
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-semibold mb-2" style={{ color: BRAND }}>
              ระบุความต้องการพิเศษ
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ไม่ใส่ผัก, รสจัดพิเศษ"
              className="w-full rounded-xl border bg-white p-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#ece4d6", color: BRAND, minHeight: 80 }}
            />
          </div>
        </div>

        {/* sticky footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t" style={{ borderColor: "#f1ece4" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[var(--surface)] rounded-full p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ background: "white", color: BRAND }}
              >
                <Minus size={16} />
              </button>
              <span className="w-7 text-center font-bold" style={{ color: BRAND }}>
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ background: BRAND, color: GOLD }}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() =>
                onAdd({
                  id: `${item.id}-${Date.now()}`,
                  itemId: item.id,
                  name: item.name,
                  price: unit,
                  qty,
                  addons: (item.addons ?? []).filter((a) => selectedAddons.includes(a.id)),
                  options,
                  note,
                  image: item.image,
                })
              }
              className="flex-1 h-12 rounded-full font-semibold flex items-center justify-between px-5"
              style={{ background: BRAND, color: GOLD }}
            >
              <span>เพิ่มลงตะกร้า</span>
              <span>฿{total}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Menu Overlay
// ─────────────────────────────────────────────────────────────
function MenuOverlay({
  onBack,
  onPickItem,
  onOpenCart,
  totalQty,
  subtotal,
}: {
  onBack: () => void;
  onPickItem: (m: MenuItem) => void;
  cart: CartLine[];
  onOpenCart: () => void;
  totalQty: number;
  subtotal: number;
}) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--linen)] overflow-y-auto no-scrollbar pb-32"
    >
      <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: LINEN }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ background: "white", color: BRAND, boxShadow: "0 2px 12px rgba(0,46,71,0.08)" }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: BRAND }}>
            เมนูทั้งหมด
          </h1>
        </div>
      </div>

      {CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
        const items = MENU.filter((m) => m.category === cat.id);
        if (!items.length) return null;
        return (
          <div key={cat.id} className="px-5 mt-5">
            <h2 className="text-base font-bold mb-3" style={{ color: BRAND }}>
              {cat.label}
            </h2>
            <div className="space-y-3">
              {items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onPickItem(m)}
                  className="w-full bg-white rounded-2xl p-3 flex gap-3 shadow-soft text-left"
                >
                  <img src={m.image} alt={m.name} className="h-20 w-20 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm" style={{ color: BRAND }}>
                      {m.name}
                    </h3>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: INK_MUTED }}>
                      {m.desc}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-bold text-sm" style={{ color: BRAND }}>
                        ฿{m.price}
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: BRAND, color: GOLD }}>
                        <Plus size={14} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {totalQty > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 pt-10 pb-5 px-5 z-20"
          style={{
            background:
              "linear-gradient(to top, rgba(255,248,242,1) 35%, rgba(255,248,242,0) 100%)",
          }}
        >
          <button
            onClick={onOpenCart}
            className="w-full rounded-2xl px-5 py-4 flex items-center justify-between shadow-lift"
            style={{ background: BRAND, color: "white" }}
          >
            <span className="flex items-center gap-2 font-medium">
              <ShoppingBag size={18} style={{ color: GOLD }} /> {totalQty} รายการ
            </span>
            <span className="font-bold" style={{ color: GOLD }}>
              ฿{subtotal}
            </span>
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Cart Drawer
// ─────────────────────────────────────────────────────────────
function CartDrawer({
  cart,
  subtotal,
  onClose,
  onRemove,
  onCheckout,
}: {
  cart: CartLine[];
  subtotal: number;
  onClose: () => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[85%] flex flex-col"
      >
        <div className="px-5 pt-3 pb-4 border-b" style={{ borderColor: "#f1ece4" }}>
          <div className="mx-auto h-1.5 w-12 rounded-full bg-[#e5dccc] mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: BRAND }}>
              ตะกร้าของคุณ
            </h2>
            <button onClick={onClose} className="text-sm" style={{ color: INK_MUTED }}>
              ปิด
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
          {cart.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: INK_MUTED }}>
              ยังไม่มีรายการในตะกร้า
            </p>
          )}
          {cart.map((l) => (
            <div key={l.id} className="flex gap-3 bg-[var(--surface)] rounded-2xl p-3">
              <img src={l.image} alt={l.name} className="h-16 w-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm" style={{ color: BRAND }}>
                  {l.name}
                </h3>
                <p className="text-xs" style={{ color: INK_MUTED }}>
                  × {l.qty}
                  {l.addons.length > 0 && ` · ${l.addons.map((a) => a.name).join(", ")}`}
                </p>
                <p className="text-sm font-bold mt-1" style={{ color: BRAND }}>
                  ฿{l.price * l.qty}
                </p>
              </div>
              <button
                onClick={() => onRemove(l.id)}
                className="grid h-9 w-9 place-items-center rounded-full self-start"
                style={{ background: "#fee2e2", color: "#dc2626" }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="px-5 pt-3 pb-5 border-t space-y-3" style={{ borderColor: "#f1ece4" }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: INK_MUTED }}>ยอดรวม</span>
              <span className="font-bold text-base" style={{ color: BRAND }}>
                ฿{subtotal}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full h-12 rounded-full font-semibold"
              style={{ background: BRAND, color: GOLD }}
            >
              ดำเนินการสั่งซื้อ
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Order Confirm
// ─────────────────────────────────────────────────────────────
function OrderConfirmOverlay({
  cart,
  subtotal,
  onBack,
  onRemove,
  onProceed,
}: {
  cart: CartLine[];
  subtotal: number;
  onBack: () => void;
  onRemove: (id: string) => void;
  onProceed: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const delivery = 40;
  const grand = subtotal + delivery;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-40 bg-[var(--surface)] overflow-y-auto no-scrollbar pb-32"
    >
      <div className="px-5 pt-5 pb-6" style={{ background: BRAND, color: "white" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
          >
            <ChevronLeft size={20} color={GOLD} />
          </button>
          <h1 className="text-lg font-bold">รายการสั่งซื้อในตะกร้า</h1>
        </div>
        <p className="text-sm mt-2 text-white/70">ตรวจสอบรายการก่อนชำระเงิน</p>
      </div>

      <div className="px-5 -mt-3 space-y-3">
        {cart.map((l) => (
          <div key={l.id} className="bg-white rounded-2xl p-4 shadow-soft">
            <div className="flex gap-3">
              <img src={l.image} alt={l.name} className="h-16 w-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm" style={{ color: BRAND }}>
                    {l.name}
                  </h3>
                  <span className="font-bold text-sm" style={{ color: BRAND }}>
                    ฿{l.price * l.qty}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: INK_MUTED }}>
                  จำนวน × {l.qty} · ฿{l.price}/ชิ้น
                </p>
                {l.addons.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: INK_MUTED }}>
                    + {l.addons.map((a) => a.name).join(", ")}
                  </p>
                )}
                {l.note && (
                  <p className="text-xs mt-0.5 italic" style={{ color: INK_MUTED }}>
                    "{l.note}"
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemove(l.id)}
              className="mt-3 w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
              style={{ background: "#fee2e2", color: "#dc2626" }}
            >
              <Trash2 size={14} /> ลบรายการ
            </button>
          </div>
        ))}

        <div className="bg-white rounded-2xl p-4 shadow-soft space-y-2.5">
          <h3 className="font-semibold mb-2" style={{ color: BRAND }}>
            สรุปคำสั่งซื้อ
          </h3>
          <Row label="ยอดรวมอาหาร" value={`฿${subtotal}`} />
          <Row label="ค่าจัดส่ง" value={`฿${delivery}`} />
          <div className="border-t pt-2.5 mt-2.5" style={{ borderColor: "#f1ece4" }}>
            <Row label="รวมทั้งหมด" value={`฿${grand}`} bold />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <label className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND }}>
            <Phone size={14} /> เบอร์โทรสำหรับติดต่อ
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
              setErr("");
            }}
            placeholder="0XX-XXX-XXXX"
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: err ? "#ef4444" : "#ece4d6", color: BRAND }}
          />
          {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 p-5"
        style={{
          background: "linear-gradient(to top, white 60%, rgba(255,255,255,0) 100%)",
        }}
      >
        <button
          onClick={() => {
            if (phone.length < 10) {
              setErr("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก");
              return;
            }
            onProceed();
          }}
          className="w-full h-13 py-4 rounded-full font-semibold flex items-center justify-center gap-2"
          style={{ background: BRAND, color: GOLD }}
        >
          ไปยังช่องทางชำระเงิน →
        </button>
      </div>
    </motion.div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: bold ? BRAND : INK_MUTED, fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span className={bold ? "text-lg" : ""} style={{ color: BRAND, fontWeight: bold ? 700 : 500 }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Payment
// ─────────────────────────────────────────────────────────────
function PaymentOverlay({
  total,
  onBack,
  onSuccess,
}: {
  total: number;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [slip, setSlip] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const PROMPTPAY = "089-123-4567";

  const handleCopy = () => {
    navigator.clipboard?.writeText(PROMPTPAY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setSlip(url);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-50 bg-[var(--surface)] overflow-y-auto no-scrollbar pb-32"
    >
      <div className="px-5 pt-5 pb-6" style={{ background: BRAND, color: "white" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
          >
            <ChevronLeft size={20} color={GOLD} />
          </button>
          <h1 className="text-lg font-bold">ชำระค่าอาหารผ่านพร้อมเพย์</h1>
        </div>
      </div>

      <div className="px-5 -mt-3 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-soft flex flex-col items-center">
          <div className="px-3 py-1 rounded-md text-[10px] font-bold tracking-widest" style={{ background: "#003d6b", color: "white" }}>
            PROMPTPAY
          </div>
          <div className="mt-4 rounded-2xl p-3 bg-white border-2" style={{ borderColor: "#f1ece4" }}>
            <MockQR />
          </div>
          <p className="mt-3 text-xs" style={{ color: INK_MUTED }}>
            ยอดที่ต้องชำระ
          </p>
          <p className="text-3xl font-bold" style={{ color: BRAND }}>
            ฿{total.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <p className="text-xs" style={{ color: INK_MUTED }}>
            หมายเลขพร้อมเพย์
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-lg font-bold tracking-wide" style={{ color: BRAND }}>
              {PROMPTPAY}
            </p>
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.button
                  key="ok"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "#dcfce7", color: "#16a34a" }}
                >
                  <Check size={14} /> คัดลอกแล้ว
                </motion.button>
              ) : (
                <motion.button
                  key="copy"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "#fff2d6", color: BRAND }}
                >
                  <Copy size={14} /> คัดลอก
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: BRAND }}>
            แนบหลักฐานการโอน
          </p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-full rounded-2xl border-2 border-dashed overflow-hidden"
            style={{
              borderColor: slip ? "transparent" : "#cbd5d8",
              background: slip ? "#000" : "white",
              minHeight: 200,
            }}
          >
            {slip ? (
              <>
                <img src={slip} alt="slip" className="w-full h-56 object-contain" />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-xs font-semibold text-white">เปลี่ยนไฟล์</span>
                </div>
              </>
            ) : (
              <div className="py-12 flex flex-col items-center gap-2">
                <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "#fff2d6" }}>
                  <Upload size={20} color={BRAND} />
                </div>
                <p className="text-sm font-medium" style={{ color: BRAND }}>
                  แตะเพื่ออัปโหลดสลิป
                </p>
                <p className="text-xs" style={{ color: INK_MUTED }}>
                  JPG / PNG ไม่เกิน 5MB
                </p>
              </div>
            )}
          </button>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 p-5"
        style={{ background: "linear-gradient(to top, white 60%, rgba(255,255,255,0) 100%)" }}
      >
        <button
          onClick={onSuccess}
          disabled={!slip}
          className="w-full h-13 py-4 rounded-full font-semibold disabled:opacity-50"
          style={{ background: BRAND, color: GOLD }}
        >
          ยืนยันการชำระเงินเรียบร้อย
        </button>
      </div>
    </motion.div>
  );
}

function MockQR() {
  // simple deterministic SVG mock QR
  const cells = 25;
  const size = 200;
  const c = size / cells;
  const rand = (i: number, j: number) => ((i * 73 + j * 137 + i * j * 31) % 7) < 3;
  const dots = [];
  for (let i = 0; i < cells; i++)
    for (let j = 0; j < cells; j++) if (rand(i, j)) dots.push({ i, j });

  const Corner = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width={c * 7} height={c * 7} fill={BRAND} rx={4} />
      <rect x={x + c} y={y + c} width={c * 5} height={c * 5} fill="white" rx={2} />
      <rect x={x + c * 2} y={y + c * 2} width={c * 3} height={c * 3} fill={BRAND} rx={1} />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {dots.map((d, k) => {
        // skip corners
        if ((d.i < 8 && d.j < 8) || (d.i < 8 && d.j > cells - 9) || (d.i > cells - 9 && d.j < 8))
          return null;
        return <rect key={k} x={d.i * c} y={d.j * c} width={c} height={c} fill={BRAND} />;
      })}
      <Corner x={0} y={0} />
      <Corner x={size - c * 7} y={0} />
      <Corner x={0} y={size - c * 7} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Success flash
// ─────────────────────────────────────────────────────────────
function SuccessFlash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-center justify-center"
      style={{ background: BRAND }}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="grid h-24 w-24 place-items-center rounded-full"
          style={{ background: GOLD }}
        >
          <Check size={48} color={BRAND} strokeWidth={3} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white font-bold text-lg"
        >
          ชำระเงินสำเร็จ
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Status Screen
// ─────────────────────────────────────────────────────────────
function StatusScreen({
  onOpenSidebar,
  onBackHome,
  cart,
  subtotal,
}: {
  onOpenSidebar: () => void;
  onBackHome: () => void;
  cart: CartLine[];
  subtotal: number;
}) {
  const steps = [
    { id: 1, label: "รับออเดอร์", icon: Check, done: true },
    { id: 2, label: "กำลังเตรียมอาหาร", icon: ChefHat, done: true },
    { id: 3, label: "ออกจัดส่ง", icon: Bike, done: false, active: true },
    { id: 4, label: "ส่งถึงแล้ว", icon: PartyPopper, done: false },
  ];

  const orderItems = cart.length
    ? cart
    : ([
        { name: "Premium Wagyu Don", qty: 1, price: 420 },
        { name: "Matcha Latte", qty: 2, price: 120 },
      ] as { name: string; qty: number; price: number }[]);
  const total = cart.length ? subtotal + 40 : 420 + 240 + 40;

  return (
    <div className="min-h-full pb-32" style={{ background: SURFACE }}>
      <div className="px-5 py-4 bg-white border-b flex items-center gap-3" style={{ borderColor: "#eef2f6" }}>
        <button
          onClick={onOpenSidebar}
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: SURFACE, color: BRAND }}
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: BRAND }}>
          สถานะการสั่งซื้อ
        </h1>
      </div>

      <div className="flex flex-col items-center pt-8 pb-6 px-5 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 180 }}
          className="grid h-24 w-24 place-items-center rounded-full bg-green-500 shadow-lift"
        >
          <CheckCircle size={56} color="white" strokeWidth={2} />
        </motion.div>
        <h2 className="mt-5 text-2xl font-bold" style={{ color: BRAND }}>
          รายการสำเร็จ
        </h2>
        <p className="mt-1 text-sm" style={{ color: INK_MUTED }}>
          รอรับอาหารในอีก 14 นาที
        </p>
      </div>

      <div className="px-5 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: INK_MUTED }}>
              หมายเลขออเดอร์
            </p>
            <p className="text-sm font-bold" style={{ color: BRAND }}>
              #AK-2847
            </p>
          </div>
          <div className="space-y-2">
            {orderItems.map((o, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span style={{ color: BRAND }}>
                  {o.name} <span style={{ color: INK_MUTED }}>× {o.qty}</span>
                </span>
                <span className="font-medium" style={{ color: BRAND }}>
                  ฿{o.price * o.qty}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "#f1ece4" }}>
            <span className="text-sm" style={{ color: INK_MUTED }}>
              รวมทั้งหมด
            </span>
            <span className="text-lg font-bold" style={{ color: BRAND }}>
              ฿{total.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft">
          <h3 className="font-bold mb-4" style={{ color: BRAND }}>
            ติดตามสถานะ
          </h3>
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[#eef2f6]" />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "50%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute left-[19px] top-2 w-0.5"
              style={{ background: BRAND }}
            />
            <div className="space-y-5">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.id} className="relative flex items-center gap-3">
                    <div
                      className="relative z-10 grid h-10 w-10 place-items-center rounded-full"
                      style={{
                        background: s.done ? BRAND : s.active ? GOLD : "#eef2f6",
                        color: s.done ? GOLD : s.active ? BRAND : INK_MUTED,
                      }}
                    >
                      <Icon size={18} />
                      {s.active && (
                        <motion.span
                          className="absolute inset-0 rounded-full"
                          style={{ background: GOLD }}
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: s.done || s.active ? BRAND : INK_MUTED }}
                      >
                        {s.label}
                      </p>
                      <p className="text-xs" style={{ color: INK_MUTED }}>
                        {s.done ? "เสร็จสมบูรณ์" : s.active ? "กำลังดำเนินการ" : "รอดำเนินการ"}
                      </p>
                    </div>
                    {i === steps.length - 1 && (
                      <span className="text-xs" style={{ color: INK_MUTED }}>
                        14 นาที
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 p-5"
        style={{ background: "linear-gradient(to top, white 60%, rgba(248,250,252,0) 100%)" }}
      >
        <button
          onClick={onBackHome}
          className="w-full py-4 rounded-full font-semibold"
          style={{ background: BRAND, color: "white" }}
        >
          กลับไปยังหน้าหลัก
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
function Sidebar({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (t: "home" | "status") => void;
}) {
  const items = [
    { id: "home", label: "หน้าแรก", icon: HomeIcon },
    { id: "status", label: "สถานะการสั่งซื้อ", icon: ClipboardList },
    { id: "contact", label: "ติดต่อเรา", icon: MessageCircle },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 z-[60]"
      />
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", duration: 0.28 }}
        className="absolute top-0 left-0 bottom-0 w-[78%] z-[70] flex flex-col"
        style={{ background: BRAND, color: "white" }}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: GOLD, color: BRAND }}>
              <User size={22} />
            </div>
            <div>
              <p className="font-bold">คุณ ภัทร</p>
              <p className="text-xs text-white/60">LINE ID · @epicurean</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => {
                if (it.id === "home" || it.id === "status") onNavigate(it.id);
                else onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-white/5"
            >
              <it.icon size={18} color={GOLD} />
              <span className="font-medium text-sm">{it.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-5 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.08)", color: "white" }}
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
          <p className="mt-4 text-center text-[10px] text-white/40">
            © 2026 Epicurean · LINE LIFF
          </p>
        </div>
      </motion.aside>
    </>
  );
}
