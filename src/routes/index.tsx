import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
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
  Wifi,
  LogOut,
  Home as HomeIcon,
  ClipboardList,
  MessageCircle,
  User,
  Star,
  Utensils,
  Clock,
  Search,
  CreditCard,
  ChevronRight,
} from "lucide-react";

// Local meal images (placed in src/meal)
import imgKrapao from "../meal/krapao.jpg";
import imgFriedRice from "../meal/fried_rice.jpg";
import imgKhaoMooGarlic from "../meal/ข้าวหมูกระเทียม.jpg";
import imgWater from "../meal/น้ำเปล่า.jpeg";
import imgShavedIce from "../meal/น้ำแข็งไส.jpg";
import imgSquid from "../meal/ผัดถั่วฟักยาวทะเล.jpg";
import imgGrassJelly from "../meal/เฉาก๊วย.webp";
import imgCokeLocal from "../meal/โค้ก.jpg";
import imgPadSeeEw from "../meal/ผัดซีอิ๊ว.jpg"
import imgPadPak from "../meal/ผัดผัก.jpg"
import imgStirFriedCurry from "../meal/ผัดผงกะพรี่.jpg"
import imgLonganJuice from "../meal/น้ำลำไย.jpg"
import imgorangeJuice from "../meal/น้ำส้ม.jpg"

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
    id: "m_krapao_pork",
    name: "กระเพราหมูสับ (ข้าวราด)",
    desc: "กระเพราหมูสับผัดกับพริกและกระเทียม เสิร์ฟราดข้าวไทยร้อนๆ",
    price: 60,
    image: imgKrapao,
    category: "signature",
    options: [
      { id: "spicy", name: "ระดับความเผ็ด", choices: [ { id: "0", label: "ไม่เผ็ด" }, { id: "1", label: "เผ็ดน้อย" }, { id: "2", label: "เผ็ดกลาง" }, { id: "3", label: "เผ็ดมาก" } ] }
    ],
    addons: [ { id: "egg", name: "ไข่ดาว", price: 10 }, { id: "bacon", name: "หมูกรอบ", price: 20 } ],
  },
  {
    id: "m_pad_nam_prik_pao",
    name: "ผัดพริกเผา (ข้าวราด)",
    desc: "ผัดเครื่องพริกเผาเข้มข้น เคล้ากับเนื้อหรือไก่ตามสั่ง เสิร์ฟพร้อมข้าว",
    price: 65,
    image: imgSquid,
    category: "signature",
    addons: [ { id: "egg", name: "ไข่ดาว", price: 10 } ],
  },
  {
    id: "m_pad_nam_oil",
    name: "ผัดน้ำมันหอย (ข้าว/เส้น)",
    desc: "ผัดด้วยน้ำมันหอยหอมหวาน เลือกเนื้อสัตว์และข้าว/เส้นได้ตามต้องการ",
    price: 65,
    image: imgKhaoMooGarlic,
    category: "main",
  },
  {
    id: "m_pad_see_ew",
    name: "ผัดซีอิ๊ว (เส้นใหญ่)",
    desc: "เส้นใหญ่ผัดซีอิ๊วแบบร้านตามสั่ง ปรุงรสกลมกล่อม เสิร์ฟร้อน",
    price: 70,
    image: imgPadSeeEw,
    category: "noodles",
  },
  {
    id: "m_fried_rice",
    name: "ข้าวผัดกระเทียม (ข้าวผัด)",
    desc: "ข้าวผัดกลิ่นกระเทียม เจียวจนหอม พร้อมผักและเนื้อสัตว์เลือกได้",
    price: 70,
    image: imgFriedRice,
    category: "rice",
  },
  {
    id: "m_pad_phong_kari",
    name: "ผัดผงกะหรี่ (ไก่/หมู)",
    desc: "ผัดผงกะหรี่รสกลมกล่อม เสิร์ฟพร้อมข้าวร้อนๆ",
    price: 75,
    image: imgStirFriedCurry,
    category: "main",
  },
  {
    id: "m_pad_pak",
    name: "ผัดผักรวม (กับข้าว)",
    desc: "ผัดผักสดหลากหลาย ปรุงรสอ่อนๆ ทานคู่กับข้าวสวย",
    price: 55,
    image: imgPadPak,
    category: "vegetarian",
  },
  {
    id: "m_pad_prik_gaeng",
    name: "ผัดพริกแกง (ตามสั่ง)",
    desc: "ผัดพริกแกงกลมกล่อม สามารถเลือกเป็นหมู ไก่ หรือทะเลได้",
    price: 80,
    image: imgSquid,
    category: "signature",
  },
  {
    id: "d_water",
    name: "น้ำเปล่า",
    desc: "น้ำดื่มเย็นๆ ขวดเล็ก",
    price: 15,
    image: imgWater,
    category: "drinks",
  },
  {
    id: "d_coke",
    name: "โค้ก (ขวด)",
    desc: "น้ำอัดลม ซีโร่/ปกติ ตามสต็อก",
    price: 35,
    image: imgCokeLocal,
    category: "drinks",
  },
  {
    id: "d_luangyai",
    name: "น้ำลำไย",
    desc: "น้ำลำไยหวานหอม เสิร์ฟเย็น",
    price: 45,
    image: imgLonganJuice,
    category: "drinks",
  },
  {
    id: "d_orange",
    name: "น้ำส้มคั้น",
    desc: "น้ำส้มคั้นสด หวานอมเปรี้ยว",
    price: 50,
    image: imgorangeJuice,
    category: "drinks",
  },
  {
    id: "dess_grass_jelly",
    name: "เฉาก๊วย",
    desc: "เฉาก๊วยเย็นหวานกำลังดี ท็อปด้วยน้ำเชื่อม",
    price: 40,
    image: imgGrassJelly,
    category: "dessert",
  },
  {
    id: "dess_shaved_ice",
    name: "น้ำแข็งไส",
    desc: "น้ำแข็งไสพร้อมท็อปปิ้งหลากหลาย",
    price: 55,
    image: imgShavedIce,
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
                if (t === "home" || t === "status") setTab(t);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && <SuccessFlash key="sf" />}
        </AnimatePresence>

        {/* fixed cart bar inside app frame (constrained and centered) */}
        <AnimatePresence>
          {totalQty > 0 && (
            <motion.div
              key="fixed-cart-bar"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute z-20"
              style={{ left: 16, right: 16, bottom: 24, maxWidth: 430, marginLeft: "auto", marginRight: "auto" }}
            >
              <button
                onClick={() => setCartDrawer(true)}
                className="w-full rounded-2xl px-5 py-4 flex items-center justify-between shadow-lift"
                style={{ background: BRAND, color: "white" }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative grid h-9 w-9 place-items-center rounded-xl" style={{ background: "rgba(252,193,74,0.15)" }}>
                    <ShoppingBag size={18} style={{ color: GOLD }} />
                    <span className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-bold" style={{ background: GOLD, color: BRAND }}>
                      {totalQty}
                    </span>
                  </div>
                  <span className="font-medium">ตะกร้าสินค้า</span>
                </div>
                <span className="font-bold" style={{ color: GOLD }}>
                  ฿{subtotal}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DeliveryBlock() {
  const [address, setAddress] = useState("");
  const [addressType, setAddressType] = useState<"home" | "work" | "dorm">("home");

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full shrink-0" style={{ background: LINEN, color: BRAND }}>
          <MapPin size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: INK_MUTED }}>
            จัดส่ง
          </p>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="กรอกที่อยู่ เช่น ถนนสุขุมวิท 31"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "#ece4d6" }}
          />

          <div className="mt-3 flex gap-2">
            {[
              { id: "home", label: "บ้าน" },
              { id: "work", label: "ที่ทำงาน" },
              { id: "dorm", label: "หอพัก" },
            ].map((a) => (
              <button
                key={a.id}
                onClick={() => setAddressType(a.id as any)}
                className={`px-3 py-1 rounded-full border text-sm`}
                style={{
                  borderColor: addressType === a.id ? BRAND : "#ece4d6",
                  background: addressType === a.id ? BRAND : "white",
                  color: addressType === a.id ? GOLD : BRAND,
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {address && (
            <p className="mt-2 text-xs" style={{ color: INK_MUTED }}>
              ที่อยู่: {address} — ประเภท: {addressType === "home" ? "บ้าน" : addressType === "work" ? "ที่ทำงาน" : "หอพัก"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────
function DineInBlock({ selectedTable, onOpenPicker }: { selectedTable: string; onOpenPicker: () => void }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full shrink-0" style={{ background: LINEN, color: BRAND }}>
          <Utensils size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: INK_MUTED }}>
            ทานที่ร้าน
          </p>
          <div className="mt-2">
            <p className="text-sm text-slate-600">เลือกโต๊ะจะทำผ่านผังที่นั่ง (เปิด modal)</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: BRAND }}>
              {selectedTable ? `โต๊ะที่เลือก: ${selectedTable}` : "ยังไม่ได้เลือกโต๊ะ"}
            </p>
            <div className="mt-3">
              <button
                onClick={onOpenPicker}
                className="px-4 py-2 rounded-full border"
                style={{ borderColor: BRAND, color: BRAND }}
              >
                เปิดผังที่นั่ง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const [selectedTable, setSelectedTable] = useState("");
  const [showTablePicker, setShowTablePicker] = useState(false);

  const tables = [
    { id: "1", label: "โต๊ะ 1", status: "available" },
    { id: "2", label: "โต๊ะ 2", status: "occupied" },
    { id: "3", label: "โต๊ะ 3", status: "available" },
    { id: "4", label: "โต๊ะ 4", status: "available" },
    { id: "5", label: "โต๊ะ 5", status: "reserved" },
    { id: "6", label: "โต๊ะ 6", status: "occupied" },
    { id: "7", label: "โต๊ะ 7", status: "available" },
    { id: "8", label: "โต๊ะ 8", status: "available" },
  ];

  return (
    <div className="pb-36" style={{ background: LINEN }}>
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
        <button
          onClick={onOpenCart}
          className="absolute top-5 right-5 flex items-center gap-1 text-white/90 text-xs bg-white/10 backdrop-blur-md px-3 py-2 rounded-full border border-white/15"
        >
          <ShoppingBag size={14} />
          {totalQty > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold" style={{ background: GOLD, color: BRAND }}>
              {totalQty}
            </span>
          )}
        </button>

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">EPICUREAN</p>
          <h1 className="text-2xl font-bold mt-1">สวัสดี, ยินดีต้อนรับ</h1>
          <p className="text-sm text-white/80 mt-1">เลือกประสบการณ์การรับประทาน</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                เปิดบริการ
              </span>
              <span className="text-sm font-medium text-white/90">10:00 - 22:00</span>
            </div>
            <button
              onClick={() => {
                if (orderType === "dine-in" && !selectedTable) {
                  setShowTablePicker(true);
                  return;
                }
                onOpenMenu();
              }}
              className="inline-flex items-center justify-center rounded-full bg-[#ffcb44] px-4 py-2 text-sm font-semibold shadow-sm"
              style={{ color: BRAND }}
            >
              สั่งอาหาร <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Order type tiles */}
      <div className="px-5 mt-4">
          <h3 className="text-sm font-medium mb-3" style={{ color: BRAND }}>ช่องทางการรับอาหาร</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setOrderType("dine-in");
                setShowTablePicker(true);
              }}
              className="rounded-xl p-4 text-left flex flex-col gap-2"
              style={{ background: orderType === "dine-in" ? BRAND : "white", color: orderType === "dine-in" ? GOLD : BRAND }}
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-md" style={{ background: orderType === "dine-in" ? "rgba(252,193,74,0.12)" : LINEN, color: orderType === "dine-in" ? GOLD : BRAND }}>
                  <Utensils size={18} />
                </div>
              </div>
              <div className="font-semibold">ทานที่ร้าน</div>
              {orderType === "dine-in" && <div className="text-xs">เลือกโต๊ะและเชื่อมต่อ QR</div>}
            </button>

            <button
              onClick={() => setOrderType("delivery")}
              className="rounded-xl p-4 text-left flex flex-col gap-2"
              style={{ background: orderType === "delivery" ? "#f7fafb" : "white", border: `1px solid ${orderType === "delivery" ? BRAND : "#ece4d6"}`, color: BRAND }}
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-md" style={{ background: LINEN, color: BRAND }}>
                  <Bike size={18} />
                </div>
              </div>
              <div className="font-semibold">จัดส่งถึงที่</div>
              {orderType === "delivery" && <div className="text-xs">กรอกที่อยู่เพื่อจัดส่ง</div>}
            </button>
          </div>

          
        </div>

      {/* Conditional input for order type */}
      <div className="px-5 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={orderType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="w-full bg-white rounded-2xl px-4 py-4 shadow-soft border border-[#ece4d6]"
          >
            {orderType === "delivery" && <DeliveryBlock />}
            {orderType === "dine-in" && (
              <DineInBlock selectedTable={selectedTable} onOpenPicker={() => setShowTablePicker(true)} />
            )}
          </motion.div>
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

      {/* Menu list (horizontal slider) */}
      <div className="px-5 mt-5">
        <h2 className="text-lg font-bold mb-3" style={{ color: BRAND }}>
          เมนูแนะนำ
        </h2>
        <div className="-mx-5 px-5 overflow-x-auto no-scrollbar">
          <div className="flex gap-4">
            {items.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onPickItem(m)}
                className="bg-white rounded-2xl p-3 shadow-soft cursor-pointer active:scale-[0.99] transition-transform min-w-[220px] w-56"
              >
                <div className="relative h-36 w-full overflow-hidden rounded-xl mb-3">
                  <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: GOLD }}>
                    <Star size={10} fill={GOLD} stroke={GOLD} />
                    <span style={{ color: INK_MUTED }}>Chef's pick</span>
                  </div>
                  <h3 className="font-semibold text-[15px] truncate mt-1" style={{ color: BRAND }}>
                    {m.name}
                  </h3>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: INK_MUTED }}>
                    {m.desc}
                  </p>
                  <div className="mt-3 flex items-end justify-between">
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
        </div>
      </div>

      {/* Inline cart removed — using fixed cart bar inside app frame */}
          {/* Persistent CTA when cart empty */}

          <AnimatePresence>
            {showTablePicker && (
              <TablePickerBottomSheet
                tables={tables}
                selectedTable={selectedTable}
                onSelect={(tableId) => {
                  setSelectedTable(tableId);
                  setShowTablePicker(false);
                }}
                onClose={() => setShowTablePicker(false)}
              />
            )}
          </AnimatePresence>
        </div>
  );
}

function TablePickerBottomSheet({
  tables,
  selectedTable,
  onSelect,
  onClose,
}: {
  tables: { id: string; label: string; status: string }[];
  selectedTable: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches?.[0]?.clientY ?? null;
  };

  const onTouchMoveModal = (e: React.TouchEvent) => {
    if (!modalRef.current) return;
    const startY = touchStartY.current;
    if (startY == null) return;
    const currentY = e.touches?.[0]?.clientY ?? 0;
    const delta = currentY - startY;
    // if at top of scroll and pulling down, prevent default to stop rubber-band
    if (modalRef.current.scrollTop <= 0 && delta > 0) {
      e.preventDefault();
    }
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          onClose();
        }}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm z-40"
        style={{ touchAction: "none" }}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 top-10 z-50 rounded-t-3xl bg-white p-5 shadow-2xl overflow-y-auto"
        style={{ minHeight: "70vh", overscrollBehavior: "none", WebkitOverflowScrolling: "touch", overflowY: 'auto' }}
        ref={modalRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMoveModal}
      >
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">เลือกโต๊ะ</p>
            <h2 className="text-lg font-semibold text-slate-900">ผังที่นั่ง</h2>
          </div>
          <button
            onClick={() => onClose()}
            className="text-slate-500 text-sm"
            title={selectedTable ? "ปิด" : "ปิด"}
          >
            ปิด
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tables.map((table) => {
            const available = table.status === "available";
            const statusLabel = table.status === "available" ? "ว่าง" : table.status === "occupied" ? "ไม่ว่าง" : "จองแล้ว";
            const statusStyle: React.CSSProperties =
              table.status === "available"
                ? { background: "#dcfce7", color: "#065f46", padding: "4px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700 }
                : table.status === "occupied"
                ? { background: "#fee2e2", color: "#7f1d1d", padding: "4px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700 }
                : { background: "#fff7ed", color: "#92400e", padding: "4px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700 };

            return (
              <button
                key={table.id}
                disabled={!available}
                onClick={() => available && onSelect(table.id)}
                className="rounded-3xl p-4 text-left border transition"
                style={{
                  background: selectedTable === table.id ? BRAND : available ? "#f8fafc" : "#f5f5f5",
                  color: selectedTable === table.id ? GOLD : "#0f172a",
                  borderColor: selectedTable === table.id ? BRAND : available ? "#e2e8f0" : "#d1d5db",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{table.label}</span>
                  <span style={statusStyle}>{statusLabel}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">พื้นที่นั่งสบายสำหรับ 2-4 คน</p>
              </button>
            );
          })}
        </div>
        <div className="mt-5 rounded-3xl bg-slate-50 p-4">
          <p className="text-sm font-semibold">สถานะโต๊ะ</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span style={{ background: "#dcfce7", color: "#065f46", padding: "6px 10px", borderRadius: 9999, fontWeight: 700 }}>ว่าง</span>
            <span style={{ background: "#fee2e2", color: "#7f1d1d", padding: "6px 10px", borderRadius: 9999, fontWeight: 700 }}>ไม่ว่าง</span>
            <span style={{ background: "#fff7ed", color: "#92400e", padding: "6px 10px", borderRadius: 9999, fontWeight: 700 }}>จองแล้ว</span>
          </div>
        </div>
      </motion.div>
    </>
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
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "#f1ece4" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">ปรับแต่ง</p>
              <h2 className="text-2xl font-bold truncate" style={{ color: BRAND }}>
                {item.name}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              <p className="mt-3 text-xl font-bold" style={{ color: BRAND }}>
                ฿{item.price}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 shadow-sm"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-32">

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
  onOpenCart: () => void;
  totalQty: number;
  subtotal: number;
}) {
  const [activeCat, setActiveCat] = useState("all");
  const categories = [
    { id: "all", label: "แนะนำ" },
    { id: "signature", label: "อาหารจานหลัก" },
    { id: "drinks", label: "เครื่องดื่ม" },
    { id: "dessert", label: "ของหวาน" },
  ];
  const items = activeCat === "all" ? MENU : MENU.filter((m) => m.category === activeCat);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--linen)] flex flex-col"
    >
      <div className="z-20 bg-[var(--linen)] border-b border-slate-200/80 px-5 pt-5 pb-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white"
            style={{ color: BRAND, boxShadow: "0 2px 12px rgba(0,46,71,0.08)" }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-center flex-1" style={{ color: BRAND }}>
            รายการเมนู
          </h1>
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-white"
            style={{ color: BRAND, boxShadow: "0 2px 12px rgba(0,46,71,0.08)" }}
          >
            <Search size={20} />
          </button>
        </div>
        <div className="mt-4">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-200 flex items-center gap-3">
            <Search size={16} className="text-slate-400" />
            <input
              aria-label="ค้นหาเมนู"
              placeholder="ค้นหาเมนู..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => {
            const active = cat.id === activeCat;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className="relative rounded-full px-4 py-2 text-sm font-medium transition"
                style={{ color: active ? "white" : BRAND }}
              >
                {active && (
                  <motion.span
                    layoutId="menu-cat-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: BRAND }}
                  />
                )}
                <span className="relative">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-20">
        <div className="mt-5 space-y-3">
        {items.map((m) => (
          <div key={m.id} className="w-full bg-white rounded-2xl p-3 shadow-soft flex items-start gap-3">
            <img src={m.image} alt={m.name} className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate" style={{ color: BRAND }}>{m.name}</h3>
                  <p className="text-xs mt-1 text-slate-500 whitespace-normal">{m.desc}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-lg" style={{ color: GOLD }}>฿{m.price}</span>
                  <div className="flex-shrink-0 grid place-items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPickItem(m);
                      }}
                      className="h-10 w-10 rounded-full bg-[#002e47] text-white grid place-items-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

                <AnimatePresence>
                  {totalQty > 0 && (
                    <motion.div
                      key="menu-cart-inline"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="mt-6"
                    >
                      <button
                        onClick={onOpenCart}
                        className="w-full rounded-full py-3 flex items-center justify-between px-4 shadow-lift"
                        style={{ background: BRAND, color: "white" }}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <ShoppingBag size={18} style={{ color: GOLD }} /> ดูตะกร้าสินค้า
                        </span>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: GOLD }}>
                          <span className="rounded-full bg-white/10 px-2 py-1">{totalQty}</span>
                          ฿{subtotal}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
    </div>

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

      <div className="px-5 mt-4 space-y-3">
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

      <div className="px-5 pb-8 mt-4">
        <button
          onClick={() => {
            if (phone.length < 10) {
              setErr("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก");
              return;
            }
            onProceed();
          }}
          className="w-full h-12 rounded-full font-semibold flex items-center justify-center gap-2"
          style={{ background: BRAND, color: GOLD }}
        >
          <CreditCard size={16} /> ไปยังช่องทางชำระเงิน · ฿{grand}
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

      <div className="px-5 pb-8">
        <div className="mt-4">
          <button
            onClick={onSuccess}
            disabled={!slip}
            className="w-full h-12 rounded-full font-semibold disabled:opacity-50"
            style={{ background: BRAND, color: GOLD }}
          >
            ยืนยันการชำระเงินเรียบร้อย
          </button>
        </div>
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
    <div className="min-h-screen pb-28" style={{ background: SURFACE }}>
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
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-4">
        <button
          onClick={onBackHome}
          className="w-full h-12 rounded-full font-semibold"
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
  onNavigate: (t: string) => void;
}) {
  const items = [
    { id: "home", label: "หน้าแรก", icon: HomeIcon },
    { id: "status", label: "สถานะการสั่งซื้อ", icon: ClipboardList },
    { id: "contact", label: "ติดต่อเรา", icon: MessageCircle },
  ];

  const [activeTab, setActiveTab] = useState<"main" | "contact">("main");

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
        <div className="flex-1 p-3">
          {activeTab === "main" ? (
            <nav className="space-y-1">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => {
                    if (it.id === "contact") {
                      setActiveTab("contact");
                      return;
                    }
                    onNavigate(it.id);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-white/5"
                >
                  <it.icon size={18} color={GOLD} />
                  <span className="font-medium text-sm">{it.label}</span>
                </button>
              ))}
            </nav>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab("main")}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-medium"
              >
                <ChevronLeft size={16} /> ย้อนกลับ
              </button>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70 mb-2">Location</p>
                <p className="text-sm font-semibold">Sukhumvit 31, กรุงเทพฯ</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70 mb-2">เบอร์โทร</p>
                <p className="text-sm font-semibold">02-123-4567</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70 mb-2">รีวิวร้าน</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">4.8</span>
                  <div className="flex items-center gap-1 text-white/90">
                    <Star size={14} /> <Star size={14} /> <Star size={14} /> <Star size={14} /> <Star size={14} />
                  </div>
                </div>
                <p className="text-xs text-white/70 mt-1">“บรรยากาศดี อาหารอร่อย บริการไว”</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-white/10 space-y-4">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70 mb-2">Location</p>
            <p className="text-sm font-semibold">Sukhumvit 31, กรุงเทพฯ</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70 mb-2">เบอร์โทร</p>
            <p className="text-sm font-semibold">02-123-4567</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70 mb-2">รีวิวร้าน</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">4.8</span>
              <div className="flex items-center gap-1 text-white/90">
                <Star size={14} /> <Star size={14} /> <Star size={14} /> <Star size={14} /> <Star size={14} />
              </div>
            </div>
            <p className="text-xs text-white/70 mt-1">“บรรยากาศดี อาหารอร่อย บริการไว”</p>
          </div>
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
