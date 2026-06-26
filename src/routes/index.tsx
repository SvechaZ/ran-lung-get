import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  initLiff,
  isLiffLoggedIn,
  liffLogout,
  getLiffProfile,
  type LiffProfile,
} from "../lib/liff";
import { syncLineUserToSupabase } from "../lib/supabase.service";
import { supabase } from "../lib/supabase";
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
  History,
  Receipt,
  Package,
  ArrowUpDown,
  SlidersHorizontal,
  Store,
} from "lucide-react";

// Images are served from /meal (public directory)

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

const HERO_IMG = "/thai_food_hero.png";

const MENU: MenuItem[] = [
  {
    id: "m_krapao_pork",
    name: "กระเพราหมูสับ (ข้าวราด)",
    desc: "กระเพราหมูสับผัดกับพริกและกระเทียม เสิร์ฟราดข้าวไทยร้อนๆ",
    price: 60,
    image: '/meal/krapao.jpg',
    category: "signature",
    options: [
      { id: "spicy", name: "ระดับความเผ็ด", choices: [{ id: "0", label: "ไม่เผ็ด" }, { id: "1", label: "เผ็ดน้อย" }, { id: "2", label: "เผ็ดกลาง" }, { id: "3", label: "เผ็ดมาก" }] }
    ],
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }, { id: "bacon", name: "หมูกรอบ", price: 20 }],
  },
  {
    id: "m_pad_nam_prik_pao",
    name: "ผัดพริกเผา (ข้าวราด)",
    desc: "ผัดเครื่องพริกเผาเข้มข้น เคล้ากับเนื้อหรือไก่ตามสั่ง เสิร์ฟพร้อมข้าว",
    price: 65,
    image: '/meal/pad_tua_sea.jpg',
    category: "signature",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_pad_nam_oil",
    name: "ผัดน้ำมันหอย (ข้าว/เส้น)",
    desc: "ผัดด้วยน้ำมันหอยหอมหวาน เลือกเนื้อสัตว์และข้าว/เส้นได้ตามต้องการ",
    price: 65,
    image: '/meal/khao_moo_garlic.jpg',
    category: "main",
  },
  {
    id: "m_pad_see_ew",
    name: "ผัดซีอิ๊ว (เส้นใหญ่)",
    desc: "เส้นใหญ่ผัดซีอิ๊วแบบร้านตามสั่ง ปรุงรสกลมกล่อม เสิร์ฟร้อน",
    price: 70,
    image: '/meal/pad_see_ew.jpg',
    category: "noodles",
  },
  {
    id: "m_fried_rice",
    name: "ข้าวผัดกระเทียม (ข้าวผัด)",
    desc: "ข้าวผัดกลิ่นกระเทียม เจียวจนหอม พร้อมผักและเนื้อสัตว์เลือกได้",
    price: 70,
    image: '/meal/fried_rice.jpg',
    category: "rice",
  },
  {
    id: "m_pad_phong_kari",
    name: "ผัดผงกะหรี่ (ไก่/หมู)",
    desc: "ผัดผงกะหรี่รสกลมกล่อม เสิร์ฟพร้อมข้าวร้อนๆ",
    price: 75,
    image: '/meal/pad_pong_gari.jpg',
    category: "main",
  },
  {
    id: "m_pad_pak",
    name: "ผัดผักรวม (กับข้าว)",
    desc: "ผัดผักสดหลากหลาย ปรุงรสอ่อนๆ ทานคู่กับข้าวสวย",
    price: 55,
    image: '/meal/pad_pak.jpg',
    category: "vegetarian",
  },
  {
    id: "m_pad_prik_gaeng",
    name: "ผัดพริกแกง (ตามสั่ง)",
    desc: "ผัดพริกแกงกลมกล่อม สามารถเลือกเป็นหมู ไก่ หรือทะเลได้",
    price: 80,
    image: '/meal/pad_tua_sea.jpg',
    category: "signature",
  },
  {
    id: "d_water",
    name: "น้ำเปล่า",
    desc: "น้ำดื่มเย็นๆ ขวดเล็ก",
    price: 15,
    image: '/meal/water.jpg',
    category: "drinks",
  },
  {
    id: "d_coke",
    name: "โค้ก (ขวด)",
    desc: "น้ำอัดลม ซีโร่/ปกติ ตามสต็อก",
    price: 35,
    image: '/meal/coke.jpg',
    category: "drinks",
  },
  {
    id: "d_luangyai",
    name: "น้ำลำไย",
    desc: "น้ำลำไยหวานหอม เสิร์ฟเย็น",
    price: 45,
    image: '/meal/longan_juice.jpg',
    category: "drinks",
  },
  {
    id: "d_orange",
    name: "น้ำส้มคั้น",
    desc: "น้ำส้มคั้นสด หวานอมเปรี้ยว",
    price: 50,
    image: '/meal/orange_juice.jpg',
    category: "drinks",
  },
  {
    id: "dess_grass_jelly",
    name: "เฉาก๊วย",
    desc: "เฉาก๊วยเย็นหวานกำลังดี ท็อปด้วยน้ำเชื่อม",
    price: 40,
    image: '/meal/grass_jelly.webp',
    category: "dessert",
  },
  {
    id: "dess_shaved_ice",
    name: "น้ำแข็งไส",
    desc: "น้ำแข็งไสพร้อมท็อปปิ้งหลากหลาย",
    price: 55,
    image: '/meal/shaved_ice.jpg',
    category: "dessert",
  },
  {
    id: "m_krapao_crispy_pork",
    name: "กระเพราหมูกรอบ (ข้าวราด)",
    desc: "กระเพราหมูกรอบหนังสามชั้นกรอบนอกนุ่มใน ผัดใบกระเพราแท้รสจัดจ้าน เสิร์ฟราดข้าวหอมมะลิร้อนๆ",
    price: 70,
    image: '/meal/krapao.jpg',
    category: "signature",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_kana_crispy_pork",
    name: "ผัดคะน้าหมูกรอบ (ข้าวราด)",
    desc: "ผัดคะน้าใบเขียวสดกรอบกับหมูกรอบสามชั้น ปรุงรสกลมกล่อม ราดข้าวหอมมะลิร้อนๆ",
    price: 70,
    image: '/meal/pad_pak.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_prik_gaeng_crispy_pork",
    name: "ผัดพริกแกงหมูกรอบ (ข้าวราด)",
    desc: "พริกแกงรสเข้มข้นผัดคลุกเคล้ากับหมูกรอบและถั่วฝักยาว ราดข้าวหอมมะลิร้อนๆ",
    price: 70,
    image: '/meal/pad_tua_sea.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_garlic_sliced_pork",
    name: "กระเทียมพริกไทยหมูชิ้น (ข้าวราด)",
    desc: "หมูชิ้นนุ่มๆ ผัดซอสกระเทียมพริกไทยรสเข้มข้น หอมกระเทียมเจียว ราดข้าว",
    price: 60,
    image: '/meal/khao_moo_garlic.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_pong_kari_sea",
    name: "ผัดผงกะหรี่ทะเล (ข้าวราด)",
    desc: "เนื้อกุ้งและปลาหมึกสดผัดผงกะหรี่เข้มข้น ไข่นุ่มละมุนลิ้น ราดข้าวหอมมะลิ",
    price: 70,
    image: '/meal/pad_pong_gari.jpg',
    category: "signature",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_khua_prik_beef",
    name: "คั่วพริกแกงเนื้อ (ข้าวราด)",
    desc: "เนื้อวัวเกรดดีผัดคั่วพริกแกงตำมือ รสจัดจ้านถึงใจ สมุนไพรไทยครบเครื่อง ราดข้าว",
    price: 60,
    image: '/meal/pad_tua_sea.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_see_ew_crispy_pork",
    name: "ผัดซีอิ๊วเส้นใหญ่หมูกรอบ",
    desc: "เส้นใหญ่เหนียวนุ่มผัดซีอิ๊วดำหอมกลิ่นกระทะ คลุกเคล้ากับหมูกรอบและคะน้าสด",
    price: 75,
    image: '/meal/pad_see_ew.jpg',
    category: "noodles",
  },
  {
    id: "m_mama_prik_gaeng_shrimp",
    name: "มาม่าผัดคั่วพริกแกงกุ้ง",
    desc: "เส้นมาม่าเหนียวนุ่มผัดซอสพริกแกงเข้มข้นและกุ้งสดเด้งๆ สมุนไพรหอมกรุ่น",
    price: 65,
    image: '/meal/pad_tua_sea.jpg',
    category: "noodles",
  },
  {
    id: "m_prik_pao_clam",
    name: "ผัดพริกเผาหอยลาย (ข้าวราด)",
    desc: "หอยลายสดผัดน้ำพริกเผาสูตรเด็ด รสชาติหวานเค็มเผ็ดลงตัว หอมใบโหระพา ราดข้าว",
    price: 60,
    image: '/meal/pad_tua_sea.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_pad_pak_no_meat",
    name: "ผัดผักรวมมิตร (ข้าวราด / มังสวิรัติ)",
    desc: "ผัดผักสดรวมมิตรรสชาติเบาๆ สุขภาพดี ปรุงด้วยซีอิ๊วขาวและน้ำมันหอยสูตรเจ ราดข้าว",
    price: 50,
    image: '/meal/pad_pak.jpg',
    category: "vegetarian",
  },
];

const PROTEINS = [
  { id: "p_minced_pork", name: "หมูสับ", price: 0 },
  { id: "p_crispy_pork", name: "หมูกรอบ", price: 20 },
  { id: "p_sliced_pork", name: "หมูชิ้น", price: 10 },
  { id: "p_minced_chicken", name: "ไก่สับ", price: 0 },
  { id: "p_boiled_chicken", name: "ไก่ต้ม", price: 0 },
  { id: "p_beef", name: "เนื้อ", price: 10 },
  { id: "p_squid", name: "หมึก", price: 10 },
  { id: "p_shrimp", name: "กุ้ง", price: 10 },
  { id: "p_clam", name: "หอยลาย", price: 10 },
  { id: "p_no_meat", name: "ไม่เอาเนื้อสัตว์", price: 0 }
];

const TOPPINGS = [
  { id: "t_sausage", name: "ไส้กรอก", price: 10 },
  { id: "t_chinese_sausage", name: "กุนเชียง", price: 10 },
  { id: "t_soft_boiled_egg", name: "ไข่ดาวไม่สุก", price: 10 },
  { id: "t_fried_egg", name: "ไข่ดาวสุก", price: 10 },
  { id: "t_boiled_egg", name: "ไข่ต้ม", price: 10 },
  { id: "t_omelet", name: "ไข่เจียว", price: 10 }
];

const SIZES = [
  { id: "s_regular", name: "ธรรมดา", price: 0 },
  { id: "s_special", name: "พิเศษ", price: 10 }
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

type OrderHistory = {
  id: string;
  orderNumber: string;
  date: string;
  items: { name: string; qty: number; price: number; image: string }[];
  subtotal: number;
  delivery: number;
  total: number;
  status: string;
  orderType?: OrderType;
  tableNumber?: string;
  customerName?: string;
  note?: string;
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
  const navigate = useNavigate();
  const [liffReady, setLiffReady] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);

  // ── Auth Guard (Supabase Session OR LINE LIFF) ──────────────
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        // 1. ตรวจสอบ Supabase session (email/password login)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (!cancelled) {
            // Profile จาก Supabase user
            const sbProfile: LiffProfile = {
              userId: session.user.id,
              displayName: session.user.email ?? "ผู้ใช้งาน",
              pictureUrl: undefined,
            };
            setProfile(sbProfile);
            setLiffReady(true);
          }
          return;
        }

        // 2. ถ้าไม่มี Supabase session → ลอง LIFF
        try {
          await initLiff();
          if (cancelled) return;
          if (isLiffLoggedIn()) {
            const p = await getLiffProfile();
            if (cancelled) return;
            try { await syncLineUserToSupabase(p); } catch { /* silent */ }
            if (!cancelled) {
              setProfile(p);
              setLiffReady(true);
            }
            return;
          }
        } catch {
          // LIFF not configured — ok
        }

        // 3. ไม่มี session ใดเลย → redirect ไป login
        if (!cancelled) navigate({ to: "/login" });
      } catch (err) {
        if (!cancelled) {
          console.error("[Auth Guard error]", err);
          navigate({ to: "/login" });
        }
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, [navigate]);

  const [tab, setTab] = useState<"home" | "status">("home");
  const [overlay, setOverlay] = useState<null | "menu" | "orderConfirm" | "payment" | "history" | "contact">(null);
  const [sidebar, setSidebar] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartDrawer, setCartDrawer] = useState(false);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeOrderNumber, setActiveOrderNumber] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [tables, setTables] = useState([
    { id: "1", label: "โต๊ะ 1", status: "available" },
    { id: "2", label: "โต๊ะ 2", status: "occupied" },
    { id: "3", label: "โต๊ะ 3", status: "available" },
    { id: "4", label: "โต๊ะ 4", status: "available" },
    { id: "5", label: "โต๊ะ 5", status: "available" },
    { id: "6", label: "โต๊ะ 6", status: "occupied" },
    { id: "7", label: "โต๊ะ 7", status: "available" },
    { id: "8", label: "โต๊ะ 8", status: "available" },
  ]);
  const [address, setAddress] = useState("");
  const [addressType, setAddressType] = useState<"home" | "work" | "dorm">("home");
  const [deliveryMethod, setDeliveryMethod] = useState<"leave" | "pickup" | null>(null);
  const [showAddressError, setShowAddressError] = useState(false);
  const [showTypeError, setShowTypeError] = useState(false);

  // Simulating store closed state (for prototype testing)
  const [simulateClosed, setSimulateClosed] = useState(false);
  const [bypassRealClosed, setBypassRealClosed] = useState(false);



  const isCurrentlyClosed = useMemo(() => {
    if (simulateClosed) return true;
    if (bypassRealClosed) return false;

    // Bangkok timezone ICT (UTC+7)
    const now = new Date();
    // Shift date to ICT (UTC+7) in milliseconds
    const thTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const day = thTime.getUTCDay(); // 0 is Sunday, 6 is Saturday
    const hour = thTime.getUTCHours();
    const minute = thTime.getUTCMinutes();

    // Closed all day Saturday (6)
    if (day === 6) {
      return true;
    }

    // Open Sunday-Friday from 08:00 to 21:00
    const timeInMinutes = hour * 60 + minute;
    const openTime = 8 * 60; // 08:00
    const closeTime = 21 * 60; // 21:00

    if (timeInMinutes < openTime || timeInMinutes >= closeTime) {
      return true;
    }

    return false;
  }, [simulateClosed, bypassRealClosed]);

  const shouldShowClosedOverlay = isCurrentlyClosed && 
    tab === "home" && 
    (overlay === null || overlay === "menu" || overlay === "orderConfirm" || overlay === "payment");

  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);

  // Load from localStorage or default mocks on mount (client-side only to avoid SSR issues)
  useEffect(() => {
    const saved = localStorage.getItem("ran-lung-get-orders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOrderHistory(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default mocks if not found or invalid
    const defaultHistory: OrderHistory[] = [
      {
        id: "hist_1",
        orderNumber: "#AK-2841",
        date: "17 มิ.ย. 2026 · 18:30",
        items: [
          { name: "กระเพราหมูสับ (ข้าวราด)", qty: 2, price: 60, image: "/meal/krapao.jpg" },
          { name: "น้ำส้มคั้น", qty: 1, price: 50, image: "/meal/orange_juice.jpg" },
        ],
        subtotal: 170,
        delivery: 40,
        total: 210,
        status: "สำเร็จ",
        orderType: "delivery",
      },
      {
        id: "hist_2",
        orderNumber: "#AK-2835",
        date: "15 มิ.ย. 2026 · 12:15",
        items: [
          { name: "ผัดซีอิ๊ว (เส้นใหญ่)", qty: 1, price: 70, image: "/meal/pad_see_ew.jpg" },
          { name: "เฉาก๊วย", qty: 1, price: 40, image: "/meal/grass_jelly.webp" },
        ],
        subtotal: 110,
        delivery: 40,
        total: 150,
        status: "สำเร็จ",
        orderType: "delivery",
      },
    ];
    setOrderHistory(defaultHistory);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(defaultHistory));
  }, []);

  // Sync state with other tabs/windows in real-time when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ran-lung-get-orders" && e.newValue) {
        try {
          setOrderHistory(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Poll localStorage as a fallback for real-time synchronization in environments where storage events are restricted
  useEffect(() => {
    let lastValue = localStorage.getItem("ran-lung-get-orders");
    const interval = setInterval(() => {
      const currentValue = localStorage.getItem("ran-lung-get-orders");
      if (currentValue !== lastValue) {
        lastValue = currentValue;
        if (currentValue) {
          try {
            setOrderHistory(JSON.parse(currentValue));
          } catch (err) {
            console.error(err);
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveOrders = (updatedHistory: OrderHistory[]) => {
    setOrderHistory(updatedHistory);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(updatedHistory));
    window.dispatchEvent(new StorageEvent("storage", {
      key: "ran-lung-get-orders",
      newValue: JSON.stringify(updatedHistory),
    }));
  };

  const totalQty = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const deliveryFee = orderType === "delivery" ? 40 : 0;

  const addToCart = (line: CartLine) => setCart((c) => [...c, line]);
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.id !== id));

  const saveOrderToHistory = () => {
    if (cart.length === 0) return;
    const orderNum = `#AK-${Math.floor(2848 + Math.random() * 100)}`;
    const selectedTableObj = tables.find((t) => t.id === selectedTable);
    const tableNumStr = orderType === "dine-in" && selectedTableObj ? selectedTableObj.label : undefined;
    
    const newOrder: OrderHistory = {
      id: `hist_${Date.now()}`,
      orderNumber: orderNum,
      date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      items: cart.map((l) => ({ name: l.name, qty: l.qty, price: l.price, image: l.image })),
      subtotal,
      delivery: deliveryFee,
      total: subtotal + deliveryFee,
      status: "รอดำเนินการ",
      orderType: orderType || "delivery",
      tableNumber: tableNumStr,
    };
    
    const updatedHistory = [newOrder, ...orderHistory];
    saveOrders(updatedHistory);
    setActiveOrderNumber(orderNum);
    setHasActiveOrder(true);

    if (orderType === "dine-in" && selectedTable) {
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTable ? { ...t, status: "occupied" } : t))
      );
    }
  };

  const resetAll = () => {
    setCart([]);
    setOverlay(null);
    setCartDrawer(false);
    setSelectedItem(null);
    setTab("home");
    setSelectedTable("");
    setAddress("");
    setDeliveryMethod(null);
    setShowAddressError(false);
    setShowTypeError(false);
  };
  if (!liffReady) {
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
              isCurrentlyClosed={isCurrentlyClosed}
              bypassRealClosed={bypassRealClosed}
              setOrderType={setOrderType}
              onPickItem={(it) => setSelectedItem(it)}
              onOpenCart={() => setCartDrawer(true)}
              totalQty={totalQty}
              subtotal={subtotal}
              onOpenMenu={() => setOverlay("menu")}
              hasActiveOrder={hasActiveOrder}
              activeOrderNumber={activeOrderNumber}
              onGoToStatus={() => setTab("status")}
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              tables={tables}
              activeOrderType={orderHistory.find((o) => o.orderNumber === activeOrderNumber)?.orderType}
              activeOrderStatus={orderHistory.find((o) => o.orderNumber === activeOrderNumber)?.status}
              address={address}
              setAddress={setAddress}
              addressType={addressType}
              setAddressType={setAddressType}
              deliveryMethod={deliveryMethod}
              setDeliveryMethod={setDeliveryMethod}
              showAddressError={showAddressError}
              setShowAddressError={setShowAddressError}
              showTypeError={showTypeError}
              setShowTypeError={setShowTypeError}
            />
          )}
          {tab === "status" && (
            <StatusScreen
              onOpenSidebar={() => setSidebar(true)}
              activeOrder={orderHistory.find((o) => o.orderNumber === activeOrderNumber) || orderHistory[0]}
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
              deliveryFee={deliveryFee}
              onBack={() => setOverlay("menu")}
              onRemove={removeLine}
              onProceed={() => setOverlay("payment")}
            />
          )}
          {overlay === "payment" && (
            <PaymentOverlay
              key="pay"
              total={subtotal + deliveryFee}
              onBack={() => setOverlay("orderConfirm")}
              onSuccess={() => {
                saveOrderToHistory();
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
          {overlay === "history" && (
            <HistoryOverlay
              key="history"
              orderHistory={orderHistory}
              onBack={() => setOverlay(null)}
            />
          )}
          {overlay === "contact" && (
            <ContactOverlay
              key="contact"
              onBack={() => setOverlay(null)}
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
                if (t === "history") setOverlay("history");
                if (t === "contact") setOverlay("contact");
              }}
              orderHistory={orderHistory}
              simulateClosed={simulateClosed}
              setSimulateClosed={(val) => {
                setSimulateClosed(val);
                if (val) {
                  setBypassRealClosed(false);
                }
              }}
              profile={profile}
              onLogout={async () => {
                // Sign out จาก Supabase Auth
                await supabase.auth.signOut().catch(() => {});
                // Sign out จาก LIFF (ถ้า login อยู่)
                try { liffLogout(); } catch { /* ignore */ }
                navigate({ to: "/login" });
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {shouldShowClosedOverlay && (
            <StoreClosedOverlay
              key="closed"
              onBypass={() => {
                setBypassRealClosed(true);
                setSimulateClosed(false);
              }}
              onOpenSidebar={() => setSidebar(true)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && <SuccessFlash key="sf" />}
        </AnimatePresence>

        {/* fixed cart bar inside app frame (constrained and centered) */}
        <AnimatePresence>
          {totalQty > 0 && tab !== "status" && (
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

        {tab === "status" && (
          <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-4">
            <button
              onClick={resetAll}
              className="w-full h-12 rounded-full font-semibold"
              style={{ background: BRAND, color: "white" }}
            >
              กลับไปยังหน้าหลัก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryBlock({
  onOpenMenu,
  address,
  setAddress,
  addressType,
  setAddressType,
  deliveryMethod,
  setDeliveryMethod,
  showAddressError,
  setShowAddressError,
}: {
  onOpenMenu: () => void;
  address: string;
  setAddress: (val: string) => void;
  addressType: "home" | "work" | "dorm";
  setAddressType: (val: "home" | "work" | "dorm") => void;
  deliveryMethod: "leave" | "pickup" | null;
  setDeliveryMethod: (val: "leave" | "pickup" | null) => void;
  showAddressError: boolean;
  setShowAddressError: (val: boolean) => void;
}) {
  const [touched, setTouched] = useState(false);
  const isReady = address.trim().length >= 5 && deliveryMethod !== null;

  const DELIVERY_METHODS = [
    {
      id: "leave" as const,
      label: "วางไว้ที่หน้าประตู",
      sublabel: "เราวางอาหารไว้ให้",
      icon: <HomeIcon size={20} />,
    },
    {
      id: "pickup" as const,
      label: "ลงมารับเอง",
      sublabel: "รับที่จุดรับอาหาร",
      icon: <User size={20} />,
    },
  ];

  const handleAddressChange = (val: string) => {
    setAddress(val);
    setTouched(true);
    if (val.trim().length >= 5 && deliveryMethod) {
      setShowAddressError(false);
    }
  };

  const handleDeliveryMethodChange = (method: "leave" | "pickup" | null) => {
    setDeliveryMethod(method);
    if (address.trim().length >= 5 && method) {
      setShowAddressError(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Address */}
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full shrink-0" style={{ background: LINEN, color: BRAND }}>
          <MapPin size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.12em] mb-1" style={{ color: INK_MUTED }}>
            ที่อยู่จัดส่ง
          </p>
          <input
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="กรอกที่อยู่ เช่น ถนนสุขุมวิท 31"
            className="w-full rounded-xl border px-3 py-2.5 text-sm transition"
            style={{
              borderColor: showAddressError || (touched && address.trim().length < 5) ? "#ef4444" : address.trim().length >= 5 ? "#16a34a" : "#ece4d6",
              outline: "none",
            }}
          />
          {(showAddressError || (touched && address.trim().length < 5)) && (
            <p className="mt-1 text-[11px] text-red-500">กรุณากรอกที่อยู่ให้ครบถ้วน (อย่างน้อย 5 ตัวอักษร)</p>
          )}
          <div className="mt-2.5 flex gap-2">
            {(["home", "work", "dorm"] as const).map((id) => {
              const labels = { home: "บ้าน", work: "ที่ทำงาน", dorm: "หอพัก" };
              return (
                <button
                  key={id}
                  onClick={() => setAddressType(id)}
                  className="px-3 py-1 rounded-full border text-xs font-medium transition"
                  style={{
                    borderColor: addressType === id ? BRAND : "#ece4d6",
                    background: addressType === id ? BRAND : "white",
                    color: addressType === id ? GOLD : BRAND,
                  }}
                >
                  {labels[id]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery method */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] mb-2" style={{ color: INK_MUTED }}>
          รูปแบบการรับอาหาร
        </p>
        {showAddressError && !deliveryMethod && (
          <p className="text-xs text-red-500 font-semibold mb-2">* กรุณาเลือกรูปแบบการรับอาหาร</p>
        )}
        <div className="grid grid-cols-2 gap-2" style={{ border: showAddressError && !deliveryMethod ? "1px solid #ef4444" : "none", padding: showAddressError && !deliveryMethod ? "4px" : "0px", borderRadius: "12px" }}>
          {DELIVERY_METHODS.map((m) => {
            const active = deliveryMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleDeliveryMethodChange(m.id)}
                className="flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition"
                style={{
                  borderColor: active ? BRAND : "#ece4d6",
                  background: active ? "#f0f6fa" : "white",
                }}
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ background: active ? BRAND : LINEN, color: active ? GOLD : BRAND }}
                >
                  {m.icon}
                </div>
                <span className="text-xs font-semibold leading-tight" style={{ color: BRAND }}>{m.label}</span>
                <span className="text-[10px]" style={{ color: INK_MUTED }}>{m.sublabel}</span>
              </button>
            );
          })}
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
  hasActiveOrder,
  activeOrderNumber,
  onGoToStatus,
  selectedTable,
  setSelectedTable,
  tables,
  activeOrderType,
  activeOrderStatus,
  address,
  setAddress,
  addressType,
  setAddressType,
  deliveryMethod,
  setDeliveryMethod,
  showAddressError,
  setShowAddressError,
  showTypeError,
  setShowTypeError,
  isCurrentlyClosed,
  bypassRealClosed,
}: {
  onOpenSidebar: () => void;
  orderType: OrderType | null;
  setOrderType: (m: OrderType | null) => void;
  onPickItem: (m: MenuItem) => void;
  onOpenCart: () => void;
  totalQty: number;
  subtotal: number;
  onOpenMenu: () => void;
  hasActiveOrder: boolean;
  activeOrderNumber: string;
  onGoToStatus: () => void;
  selectedTable: string;
  setSelectedTable: (t: string) => void;
  tables: { id: string; label: string; status: string }[];
  activeOrderType?: OrderType;
  activeOrderStatus?: string;
  address: string;
  setAddress: (val: string) => void;
  addressType: "home" | "work" | "dorm";
  setAddressType: (val: "home" | "work" | "dorm") => void;
  deliveryMethod: "leave" | "pickup" | null;
  setDeliveryMethod: (val: "leave" | "pickup" | null) => void;
  showAddressError: boolean;
  setShowAddressError: (val: boolean) => void;
  showTypeError: boolean;
  setShowTypeError: (val: boolean) => void;
  isCurrentlyClosed: boolean;
  bypassRealClosed: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 240; // width of card (220px) + gap (16px)
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const [showTablePicker, setShowTablePicker] = useState(false);
  const orderTypeRef = useRef<HTMLDivElement>(null);

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
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border backdrop-blur-sm ${
                isCurrentlyClosed
                  ? "bg-red-500/20 text-red-400 border-red-500/35"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/35"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isCurrentlyClosed ? "bg-red-400" : "bg-emerald-400"}`} />
                {isCurrentlyClosed ? "ปิดบริการ" : "เปิดบริการ"}
              </span>
              <span className="text-xs font-semibold text-white/90">
                {isCurrentlyClosed ? "อา. - ศ. 08:00 - 21:00" : "08:00 - 21:00"}
              </span>
              {bypassRealClosed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/25 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                  โหมดสาธิต
                </span>
              )}
            </div>
            <button
              onClick={() => {
                if (!orderType) {
                  setShowTypeError(true);
                  orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                  return;
                }
                if (orderType === "dine-in" && !selectedTable) {
                  setShowTablePicker(true);
                  return;
                }
                if (orderType === "delivery" && (!address || address.trim().length < 5 || !deliveryMethod)) {
                  setShowAddressError(true);
                  orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                  return;
                }
                onOpenMenu();
              }}
              className="inline-flex items-center justify-center rounded-full bg-[#ffcb44] px-4 py-2 text-sm font-semibold shadow-sm cursor-pointer"
              style={{ color: BRAND }}
            >
              สั่งอาหาร <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mini order status tracker */}
      <AnimatePresence>
        {hasActiveOrder && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="px-5 mt-4"
          >
            <MiniOrderTracker
              orderNumber={activeOrderNumber}
              onGoToStatus={onGoToStatus}
              orderType={activeOrderType || "delivery"}
              status={activeOrderStatus || "รอดำเนินการ"}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order type tiles */}
      <div ref={orderTypeRef} className="px-5 mt-4">
        <h3 className="text-sm font-medium mb-3 flex flex-wrap items-center gap-x-1.5" style={{ color: BRAND }}>
          <span>ช่องทางการรับอาหาร <span className="text-red-500">*</span></span>
          {orderType === null && (
            <span className="text-xs text-slate-400 font-normal">
              (กรุณาเลือกช่องทางการรับอาหารด้านบนเพื่อระบุรายละเอียด)
            </span>
          )}
        </h3>
        {showTypeError && (
          <p className="text-xs text-red-500 font-semibold mb-3">
            * กรุณาเลือกช่องทางการรับอาหาร (ทานที่ร้าน หรือ จัดส่งถึงที่) ก่อนเริ่มสั่งซื้อ
          </p>
        )}
        <div className={`grid grid-cols-2 gap-3 p-1.5 rounded-2xl transition-all duration-300 ${showTypeError ? "border-2 border-red-500 bg-red-50/20" : "border-2 border-transparent"}`}>
          <button
            onClick={() => {
              setOrderType("dine-in");
              setShowTypeError(false);
              setShowTablePicker(true);
            }}
            className="rounded-xl p-4 text-left flex flex-col gap-2 cursor-pointer transition active:scale-95"
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
            onClick={() => {
              setOrderType("delivery");
              setShowTypeError(false);
            }}
            className="rounded-xl p-4 text-left flex flex-col gap-2 cursor-pointer transition active:scale-95"
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
      {orderType !== null && (
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
              {orderType === "delivery" && (
                <DeliveryBlock
                  onOpenMenu={onOpenMenu}
                  address={address}
                  setAddress={setAddress}
                  addressType={addressType}
                  setAddressType={setAddressType}
                  deliveryMethod={deliveryMethod}
                  setDeliveryMethod={setDeliveryMethod}
                  showAddressError={showAddressError}
                  setShowAddressError={setShowAddressError}
                />
              )}
              {orderType === "dine-in" && (
                <DineInBlock selectedTable={selectedTable} onOpenPicker={() => setShowTablePicker(true)} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Menu list (horizontal slider) */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: BRAND }}>
            เมนูแนะนำ
          </h2>
        </div>
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/50 backdrop-blur-[2px] border border-[#ece4d6]/50 hover:bg-white/80 transition shadow-sm"
            style={{ color: BRAND, marginLeft: -4 }}
            aria-label="เลื่อนซ้าย"
          >
            <ChevronLeft size={18} />
          </button>
          <div ref={scrollRef} className="-mx-5 px-10 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-4">
              {MENU.filter((m) => m.category !== "drinks" && m.category !== "dessert").map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    if (!orderType) {
                      setShowTypeError(true);
                      orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                      return;
                    }
                    if (orderType === "dine-in" && !selectedTable) {
                      setShowTablePicker(true);
                      return;
                    }
                    if (orderType === "delivery" && (!address || address.trim().length < 5 || !deliveryMethod)) {
                      setShowAddressError(true);
                      orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                      return;
                    }
                    onPickItem(m);
                  }}
                  className="bg-white rounded-2xl p-3 shadow-soft cursor-pointer active:scale-[0.99] transition-transform min-w-[220px] w-56 shrink-0"
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-xl mb-3">
                    <img src={encodeURI(String(m.image))} alt={m.name} className="h-full w-full object-cover" />
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
                          if (!orderType) {
                            setShowTypeError(true);
                            orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                            return;
                          }
                          if (orderType === "dine-in" && !selectedTable) {
                            setShowTablePicker(true);
                            return;
                          }
                          if (orderType === "delivery" && (!address || address.trim().length < 5 || !deliveryMethod)) {
                            setShowAddressError(true);
                            orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                            return;
                          }
                          onPickItem(m);
                        }}
                        className="grid h-9 w-9 place-items-center rounded-full shadow-soft cursor-pointer"
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
          {/* Right arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/50 backdrop-blur-[2px] border border-[#ece4d6]/50 hover:bg-white/80 transition shadow-sm"
            style={{ color: BRAND, marginRight: -4 }}
            aria-label="เลื่อนขวา"
          >
            <ChevronRight size={18} />
          </button>
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

  const [tableFilter, setTableFilter] = useState<"all" | "available" | "occupied">("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const displayTables = useMemo(() => {
    let list = [...tables].sort((a, b) => Number(a.id) - Number(b.id));
    if (tableFilter === "available") {
      return list.filter((t) => t.status === "available");
    } else if (tableFilter === "occupied") {
      return list.filter((t) => t.status === "occupied");
    }
    return list;
  }, [tables, tableFilter]);

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
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">เลือกโต๊ะ</p>
            <h2 className="text-base font-bold text-slate-800">ผังที่นั่ง</h2>
          </div>
          
          {/* Custom Dropdown Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-bold text-slate-700 cursor-pointer transition hover:bg-slate-100/80 active:scale-95 select-none"
            >
              {tableFilter === "all" && (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                  <span>ทั้งหมด</span>
                </>
              )}
              {tableFilter === "available" && (
                <>
                  <span className="h-2 w-2 rounded-full bg-[#15803d] shrink-0" />
                  <span className="text-[#15803d]">โต๊ะว่าง</span>
                </>
              )}
              {tableFilter === "occupied" && (
                <>
                  <span className="h-2 w-2 rounded-full bg-[#dc2626] shrink-0" />
                  <span className="text-[#dc2626]">เต็ม</span>
                </>
              )}
              <ChevronRight size={12} className={`text-slate-400 transition-transform ${showFilterDropdown ? "rotate-90" : ""}`} />
            </button>

            <AnimatePresence>
              {showFilterDropdown && (
                <>
                  {/* Local overlay to close dropdown */}
                  <div
                    onClick={() => setShowFilterDropdown(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  {/* Dropdown list */}
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-1.5 w-28 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-20 space-y-0.5"
                  >
                    {[
                      { id: "all", label: "ทั้งหมด", color: "bg-slate-400" },
                      { id: "available", label: "โต๊ะว่าง", color: "bg-[#15803d]" },
                      { id: "occupied", label: "เต็ม", color: "bg-[#dc2626]" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setTableFilter(opt.id as any);
                          setShowFilterDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-bold transition hover:bg-slate-50 cursor-pointer"
                        style={{
                          color: tableFilter === opt.id ? BRAND : "#64748b"
                        }}
                      >
                        <span className={`h-2 w-2 rounded-full shrink-0 ${opt.color}`} />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => onClose()}
            className="text-slate-500 text-sm font-semibold hover:text-slate-800"
            title={selectedTable ? "ปิด" : "ปิด"}
          >
            ปิด
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {displayTables.length === 0 ? (
            <div className="col-span-2 text-center py-12 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-slate-500">ไม่พบโต๊ะในสถานะนี้</p>
            </div>
          ) : (
            displayTables.map((table) => {
            const available = table.status === "available";
            const isOccupied = table.status === "occupied";
            const statusLabel = available ? "ว่าง" : "ไม่ว่าง";
            const statusStyle: React.CSSProperties =
              available
                ? { background: "#bbf7d0", color: "#14532d", padding: "4px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700 }
                : { background: "#fecaca", color: "#7f1d1d", padding: "4px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700 };

            // Light pastel background + dark border per status
            const boxBg = selectedTable === table.id
              ? BRAND
              : available
                ? "#dcfce7"   // green-100
                : "#fee2e2";  // red-100

            const boxBorder = selectedTable === table.id
              ? BRAND
              : available
                ? "#15803d"   // green-700
                : "#dc2626";  // red-600

            const boxText = selectedTable === table.id ? GOLD : available ? "#14532d" : "#7f1d1d";
            const boxSubText = selectedTable === table.id ? "rgba(252,193,74,0.7)" : available ? "#166534" : "#991b1b";

            return (
              <button
                key={table.id}
                disabled={!available}
                onClick={() => available && onSelect(table.id)}
                className="rounded-2xl p-4 text-left transition active:scale-95"
                style={{
                  background: boxBg,
                  color: boxText,
                  border: `2px solid ${boxBorder}`,
                  opacity: !available && selectedTable !== table.id ? 0.9 : 1,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{table.label}</span>
                  <span style={statusStyle}>{statusLabel}</span>
                </div>
                <p className="mt-2 text-xs" style={{ color: boxSubText }}>พื้นที่นั่งสบายสำหรับ 2-4 คน</p>
              </button>
            );
          })
        )}
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">สถานะโต๊ะ</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span style={{ background: "#dcfce7", color: "#14532d", border: "2px solid #15803d", padding: "5px 14px", borderRadius: 9999, fontWeight: 700 }}>ว่าง</span>
            <span style={{ background: "#fee2e2", color: "#7f1d1d", border: "2px solid #dc2626", padding: "5px 14px", borderRadius: 9999, fontWeight: 700 }}>ไม่ว่าง</span>
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
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]); // For drinks/desserts
  const [note, setNote] = useState("");

  const isFood = item.category !== "drinks" && item.category !== "dessert";

  // Dynamic default protein selection based on item name
  const defaultProteinId = useMemo(() => {
    if (!isFood) return "";
    const found = PROTEINS.find((p) => p.name !== "ไม่เอาเนื้อสัตว์" && item.name.includes(p.name));
    return found ? found.id : "p_minced_pork";
  }, [item.name, isFood]);

  const [protein, setProtein] = useState(defaultProteinId);
  const [size, setSize] = useState("s_regular");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  // Calculate base price excluding default protein price
  const basePrice = useMemo(() => {
    if (!isFood) return item.price;
    const defaultProtein = PROTEINS.find((p) => p.id === defaultProteinId);
    const defaultProteinPrice = defaultProtein ? defaultProtein.price : 0;
    return Math.max(0, item.price - defaultProteinPrice);
  }, [item.price, defaultProteinId, isFood]);

  // Total unit price
  const unitPrice = useMemo(() => {
    if (!isFood) {
      const addonTotal = (item.addons ?? [])
        .filter((a) => selectedAddons.includes(a.id))
        .reduce((s, a) => s + a.price, 0);
      return item.price + addonTotal;
    }

    const proteinItem = PROTEINS.find((p) => p.id === protein);
    const proteinPrice = proteinItem ? proteinItem.price : 0;

    const sizeItem = SIZES.find((s) => s.id === size);
    const sizePrice = sizeItem ? sizeItem.price : 0;

    const toppingsPrice = TOPPINGS
      .filter((t) => selectedToppings.includes(t.id))
      .reduce((sum, t) => sum + t.price, 0);

    return basePrice + proteinPrice + toppingsPrice + sizePrice;
  }, [isFood, item.price, selectedAddons, protein, size, selectedToppings, basePrice]);

  const total = unitPrice * qty;

  // Custom formatted dish name for cart
  const formattedName = useMemo(() => {
    if (!isFood) return item.name;

    let name = item.name;
    const defaultProtein = PROTEINS.find((p) => p.id === defaultProteinId);
    const proteinItem = PROTEINS.find((p) => p.id === protein);

    if (defaultProtein && proteinItem && defaultProtein.id !== proteinItem.id) {
      const newProteinName = proteinItem.name === "ไม่เอาเนื้อสัตว์" ? "" : proteinItem.name;
      if (name.includes(defaultProtein.name)) {
        name = name.replace(defaultProtein.name, newProteinName);
      } else {
        name = `${name} ${newProteinName}`;
      }
    }

    const sizeItem = SIZES.find((s) => s.id === size);
    if (sizeItem && sizeItem.id === "s_special" && !name.includes("(พิเศษ)")) {
      name += " (พิเศษ)";
    }

    return name;
  }, [item.name, isFood, defaultProteinId, protein, size]);

  const handleAdd = () => {
    if (!isFood) {
      const addons = (item.addons ?? [])
        .filter((a) => selectedAddons.includes(a.id))
        .map((a) => ({ id: a.id, name: a.name, price: a.price }));

      onAdd({
        id: `${item.id}-${Date.now()}`,
        itemId: item.id,
        name: item.name,
        price: unitPrice,
        qty,
        addons,
        options,
        note,
        image: item.image,
      });
      return;
    }

    const toppingsList = TOPPINGS.filter((t) => selectedToppings.includes(t.id));
    const addons = toppingsList.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
    }));

    onAdd({
      id: `${item.id}-${Date.now()}`,
      itemId: item.id,
      name: formattedName,
      price: unitPrice,
      qty,
      addons,
      options: {
        ...options,
        protein: PROTEINS.find((p) => p.id === protein)?.name || "",
        size: SIZES.find((s) => s.id === size)?.name || "",
      },
      note,
      image: item.image,
    });
  };

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
                {formattedName}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              <p className="mt-3 text-xl font-bold" style={{ color: BRAND }}>
                ฿{unitPrice}
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

          {isFood ? (
            <>
              {/* Choose Protein */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5" style={{ color: BRAND }}>
                    🥩 เลือกวัตถุดิบหลัก
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#fff2d6", color: BRAND }}>
                    จำเป็น
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PROTEINS.map((p) => {
                    const active = protein === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setProtein(p.id)}
                        className="flex items-center justify-between rounded-xl border p-3 text-left transition duration-150"
                        style={{
                          borderColor: active ? BRAND : "#ece4d6",
                          background: active ? "#fffcf5" : "white",
                        }}
                      >
                        <span className="text-xs font-semibold" style={{ color: BRAND }}>
                          {p.name}
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: active ? BRAND : INK_MUTED }}>
                          {p.price > 0 ? `+${p.price} ฿` : "ฟรี"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Choose Size */}
              <div className="mt-6">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-2.5" style={{ color: BRAND }}>
                  ⚖️ เลือกขนาด
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {SIZES.map((s) => {
                    const active = size === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSize(s.id)}
                        className="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition duration-150"
                        style={{
                          borderColor: active ? BRAND : "#ece4d6",
                          background: active ? "#fffcf5" : "white",
                        }}
                      >
                        <span className="text-xs font-semibold" style={{ color: BRAND }}>
                          {s.name}
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: BRAND }}>
                          {s.price > 0 ? `+${s.price} ฿` : "ฟรี"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Choose Toppings */}
              <div className="mt-6">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-2.5" style={{ color: BRAND }}>
                  🥚 ท็อปปิ้งเพิ่มเติม (เลือกได้หลายรายการ)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TOPPINGS.map((t) => {
                    const active = selectedToppings.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() =>
                          setSelectedToppings((prev) =>
                            active ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                          )
                        }
                        className="flex items-center justify-between rounded-xl border p-3 text-left transition duration-150"
                        style={{
                          borderColor: active ? BRAND : "#ece4d6",
                          background: active ? "#fffcf5" : "white",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="grid h-4 w-4 place-items-center rounded border"
                            style={{
                              borderColor: active ? BRAND : "#cbd5d8",
                              background: active ? BRAND : "transparent",
                            }}
                          >
                            {active && <Check size={10} color={GOLD} strokeWidth={4} />}
                          </span>
                          <span className="text-xs font-medium" style={{ color: BRAND }}>
                            {t.name}
                          </span>
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: BRAND }}>
                          +{t.price} ฿
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            item.addons && item.addons.length > 0 && (
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
                            active ? s.filter((x) => x !== a.id) : [...s, a.id]
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
            )
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
              onClick={handleAdd}
              className="flex-1 h-12 rounded-full font-semibold flex items-center justify-between px-5"
              style={{ background: BRAND, color: "white" }}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showSortModal, setShowSortModal] = useState(false);

  const categories = [
    { id: "all", label: "แนะนำ" },
    { id: "signature", label: "อาหารจานหลัก" },
    { id: "drinks", label: "เครื่องดื่ม" },
    { id: "dessert", label: "ของหวาน" },
  ];

  // Filter and sort items dynamically
  const filteredAndSortedItems = useMemo(() => {
    let list = activeCat === "all"
      ? MENU.filter((m) => m.category === "signature")
      : activeCat === "signature"
      ? MENU.filter((m) => m.category !== "drinks" && m.category !== "dessert")
      : MENU.filter((m) => m.category === activeCat);

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.desc && m.desc.toLowerCase().includes(q))
      );
    }

    if (sortBy === "price-low") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [activeCat, searchQuery, sortBy]);


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
        
        {/* Search input and Sort button */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-200 flex items-center gap-3">
            <Search size={16} className="text-slate-400" />
            <input
              aria-label="ค้นหาเมนู"
              placeholder="ค้นหาเมนู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowSortModal(true)}
            className="grid h-11 w-11 place-items-center rounded-2xl border shadow-sm transition active:scale-95 cursor-pointer relative"
            style={{
              background: sortBy !== "default" ? BRAND : "white",
              color: sortBy !== "default" ? GOLD : BRAND,
              borderColor: sortBy !== "default" ? BRAND : "#ece4d6",
            }}
            aria-label="เรียงลำดับเมนู"
          >
            <SlidersHorizontal size={18} />
            {sortBy !== "default" && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm border border-white">
                1
              </span>
            )}
          </button>
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

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-32">
        <div className="mt-5 space-y-3">
          {filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <Search size={32} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">ไม่พบเมนูที่คุณค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองใช้คำอื่น หรือรีเซ็ตการค้นหา</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 bg-[#002e47] text-[#fcc14a] rounded-full text-xs font-bold shadow-soft cursor-pointer transition active:scale-95"
              >
                ล้างคำค้นหา
              </button>
            </div>
          ) : (
            filteredAndSortedItems.map((m) => (
              <div key={m.id} className="w-full bg-white rounded-2xl p-3 shadow-soft flex items-start gap-3">
                <img src={encodeURI(String(m.image))} alt={m.name} className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: BRAND }}>{m.name}</h3>
                      <p className="text-xs mt-1 text-slate-500 whitespace-normal">{m.desc}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-lg" style={{ color: "#a16207" }}>฿{m.price}</span>
                      <div className="flex-shrink-0 grid place-items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPickItem(m);
                          }}
                          className="h-10 w-10 rounded-full bg-[#002e47] text-white grid place-items-center cursor-pointer transition active:scale-95 hover:opacity-90"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div
            key="menu-cart-fixed"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute z-40"
            style={{ left: 16, right: 16, bottom: 24 }}
          >
            <button
              onClick={onOpenCart}
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
                <span className="font-medium">ดูตะกร้าสินค้า</span>
              </div>
              <span className="font-bold text-lg" style={{ color: GOLD }}>
                ฿{subtotal}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sorting Bottom Sheet */}
      <AnimatePresence>
        {showSortModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSortModal(false)}
              className="absolute inset-0 bg-black/50 z-50 cursor-pointer"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl pb-8"
            >
              <div className="px-5 pt-3 pb-4 border-b border-slate-100">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold flex items-center gap-1.5" style={{ color: BRAND }}>
                    <SlidersHorizontal size={16} />
                    <span>เรียงลำดับตาม</span>
                  </h2>
                  <button onClick={() => setShowSortModal(false)} className="text-sm font-semibold" style={{ color: INK_MUTED }}>
                    เสร็จสิ้น
                  </button>
                </div>
              </div>
              
              <div className="px-5 mt-4 space-y-2.5">
                {[
                  { id: "default", label: "🔥 ยอดนิยม (แนะนำ)", desc: "เมนูขายดีประจำสัปดาห์" },
                  { id: "price-low", label: "💵 ราคา: ต่ำ - สูง", desc: "เมนูราคาประหยัด เรียงตามเงินบาท" },
                  { id: "price-high", label: "💵 ราคา: สูง - ต่ำ", desc: "เมนูระดับพรีเมียมคัดสรรพิเศษ" },
                ].map((opt) => {
                  const active = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortBy(opt.id);
                        setShowSortModal(false);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition duration-200 active:scale-[0.98] cursor-pointer"
                      style={{
                        background: active ? "rgba(0,46,71,0.02)" : "white",
                        borderColor: active ? BRAND : "#ece4d6",
                      }}
                    >
                      <div>
                        <p className="font-semibold text-sm" style={{ color: BRAND }}>{opt.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                      <div
                        className="h-5 w-5 rounded-full border-2 flex items-center justify-center transition"
                        style={{
                          borderColor: active ? BRAND : "#cbd5e1",
                          background: active ? BRAND : "transparent"
                        }}
                      >
                        {active && (
                          <div className="h-2 w-2 rounded-full bg-[#fcc14a]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              <img src={encodeURI(String(l.image))} alt={l.name} className="h-16 w-16 rounded-xl object-cover" />
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
              style={{ background: BRAND, color: "white" }}
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
  deliveryFee,
  onBack,
  onRemove,
  onProceed,
}: {
  cart: CartLine[];
  subtotal: number;
  deliveryFee: number;
  onBack: () => void;
  onRemove: (id: string) => void;
  onProceed: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const grand = subtotal + deliveryFee;

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
              <img src={encodeURI(String(l.image))} alt={l.name} className="h-16 w-16 rounded-xl object-cover" />
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
          <Row label="ค่าจัดส่ง" value={`฿${deliveryFee}`} />
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
          style={{ background: BRAND, color: "white" }}
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
    navigator.clipboard?.writeText(PROMPTPAY).catch(() => { });
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
            style={{ background: BRAND, color: "white" }}
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
  activeOrder,
}: {
  onOpenSidebar: () => void;
  activeOrder?: OrderHistory;
}) {
  const orderType = activeOrder?.orderType || "delivery";
  const status = activeOrder?.status || "รอดำเนินการ";

  const steps = orderType === "dine-in"
    ? [
        { id: 1, label: "รับออเดอร์", icon: Check, done: status !== "รอดำเนินการ", active: status === "รอดำเนินการ" },
        { id: 2, label: "กำลังทำอาหาร", icon: ChefHat, done: status === "พร้อมเสิร์ฟ" || status === "สำเร็จ", active: status === "กำลังเตรียม" || status === "กำลังทำ" },
        { id: 3, label: "เสร็จสิ้น", icon: PartyPopper, done: status === "สำเร็จ", active: status === "พร้อมเสิร์ฟ" },
      ]
    : [
        { id: 1, label: "รับออเดอร์", icon: Check, done: status !== "รอดำเนินการ", active: status === "รอดำเนินการ" },
        { id: 2, label: "กำลังเตรียมอาหาร", icon: ChefHat, done: status === "พร้อมเสิร์ฟ" || status === "สำเร็จ", active: status === "กำลังเตรียม" || status === "กำลังทำ" },
        { id: 3, label: "คนรับอาหาร/กำลังขับไป", icon: Bike, done: status === "สำเร็จ", active: status === "พร้อมเสิร์ฟ" },
        { id: 4, label: "เสร็จสิ้น", icon: PartyPopper, done: status === "สำเร็จ", active: false },
      ];

  const doneCount = steps.filter((s) => s.done).length;
  const hasActive = steps.some((s) => s.active);
  let progressRatio = 0;
  if (status === "สำเร็จ") {
    progressRatio = 1;
  } else if (steps.length > 1) {
    progressRatio = (doneCount + (hasActive ? 0.5 : 0) - 0.5) / (steps.length - 1);
  }
  const progressHeightPercent = Math.max(0, Math.min(100, progressRatio * 100));

  const statusDetails = useMemo(() => {
    switch (status) {
      case "รอดำเนินการ":
        return {
          title: "ได้รับออเดอร์แล้ว",
          desc: "กำลังส่งรายการอาหารไปยังห้องครัว...",
          icon: ClipboardList,
          bg: GOLD,
          color: BRAND,
        };
      case "กำลังเตรียม":
      case "กำลังทำ":
        return {
          title: "กำลังปรุงอาหาร",
          desc: orderType === "dine-in" ? "เชฟกำลังทำอาหารให้อย่างสุดฝีมือ" : "ครัวกำลังปรุงอาหารและเตรียมบรรจุกล่อง",
          icon: ChefHat,
          bg: "#3b82f6",
          color: "#ffffff",
        };
      case "พร้อมเสิร์ฟ":
        return {
          title: orderType === "dine-in" ? "อาหารพร้อมเสิร์ฟ" : "เตรียมจัดส่งเรียบร้อย",
          desc: orderType === "dine-in" ? "อาหารเสร็จแล้ว กำลังนำไปเสิร์ฟที่โต๊ะของคุณ" : "คนขับรับอาหารและกำลังเดินทางไปส่งให้คุณ",
          icon: orderType === "dine-in" ? Utensils : Bike,
          bg: "#10b981",
          color: "#ffffff",
        };
      case "สำเร็จ":
      default:
        return {
          title: "เสร็จสิ้นรายการ",
          desc: "ขอบคุณที่อุดหนุนร้านลุงเกตุ ขอให้อร่อยกับอาหารนะ!",
          icon: CheckCircle,
          bg: "#22c55e",
          color: "#ffffff",
        };
    }
  }, [status, orderType]);

  const StatusIcon = statusDetails.icon;

  const orderItems = (activeOrder && Array.isArray(activeOrder.items))
    ? activeOrder.items
    : ([
      { name: "Premium Wagyu Don", qty: 1, price: 420 },
      { name: "Matcha Latte", qty: 2, price: 120 },
    ] as { name: string; qty: number; price: number }[]);
  const total = activeOrder ? activeOrder.total : 420 + 240 + 40;

  return (
    <div className="min-h-full pb-28" style={{ background: SURFACE }}>
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
          className="grid h-24 w-24 place-items-center rounded-full shadow-lift"
          style={{ background: statusDetails.bg }}
        >
          <StatusIcon size={48} color={statusDetails.color} strokeWidth={2} />
        </motion.div>
        <h2 className="mt-5 text-2xl font-bold" style={{ color: BRAND }}>
          {statusDetails.title}
        </h2>
        <p className="mt-1 text-sm px-4" style={{ color: INK_MUTED }}>
          {statusDetails.desc}
        </p>
      </div>

      <div className="px-5 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: INK_MUTED }}>
              หมายเลขออเดอร์
            </p>
            <p className="text-sm font-bold" style={{ color: BRAND }}>
              {activeOrder ? activeOrder.orderNumber : "#AK-2847"}
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
              animate={{ height: `${progressHeightPercent}%` }}
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
                        {status === "สำเร็จ" ? "เสร็จสิ้น" : orderType === "dine-in" ? "10 นาที" : "14 นาที"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini Order Tracker (Home Page)
// ─────────────────────────────────────────────────────────────
function MiniOrderTracker({
  orderNumber,
  onGoToStatus,
  orderType,
  status = "รอดำเนินการ",
}: {
  orderNumber: string;
  onGoToStatus: () => void;
  orderType: OrderType;
  status?: string;
}) {
  const steps = orderType === "dine-in"
    ? [
        { id: 1, label: "รับออเดอร์", icon: Check, done: status !== "รอดำเนินการ", active: status === "รอดำเนินการ" },
        { id: 2, label: "กำลังทำอาหาร", icon: ChefHat, done: status === "พร้อมเสิร์ฟ" || status === "สำเร็จ", active: status === "กำลังเตรียม" || status === "กำลังทำ" },
        { id: 3, label: "เสร็จสิ้น", icon: PartyPopper, done: status === "สำเร็จ", active: status === "พร้อมเสิร์ฟ" },
      ]
    : [
        { id: 1, label: "รับออเดอร์", icon: Check, done: status !== "รอดำเนินการ", active: status === "รอดำเนินการ" },
        { id: 2, label: "กำลังเตรียมอาหาร", icon: ChefHat, done: status === "พร้อมเสิร์ฟ" || status === "สำเร็จ", active: status === "กำลังเตรียม" || status === "กำลังทำ" },
        { id: 3, label: "คนรับอาหาร/กำลังขับไป", icon: Bike, done: status === "สำเร็จ", active: status === "พร้อมเสิร์ฟ" },
        { id: 4, label: "เสร็จสิ้น", icon: PartyPopper, done: status === "สำเร็จ", active: false },
      ];

  const doneCount = steps.filter((s) => s.done).length;
  const hasActive = steps.some((s) => s.active);
  const progressPercent = status === "สำเร็จ"
    ? 100
    : ((doneCount + (hasActive ? 0.5 : 0)) / steps.length) * 100;

  const statusBadge = useMemo(() => {
    switch (status) {
      case "รอดำเนินการ":
        return {
          label: "รอรับออเดอร์",
          bg: "rgba(252,193,74,0.1)",
          color: "#d97706",
          dotBg: "bg-amber-500",
        };
      case "กำลังเตรียม":
      case "กำลังทำ":
        return {
          label: "กำลังปรุงอาหาร",
          bg: "rgba(59,130,246,0.1)",
          color: "#2563eb",
          dotBg: "bg-blue-500",
        };
      case "พร้อมเสิร์ฟ":
        return {
          label: orderType === "dine-in" ? "พร้อมเสิร์ฟ" : "กำลังจัดส่ง",
          bg: "rgba(16,185,129,0.1)",
          color: "#059669",
          dotBg: "bg-emerald-500",
        };
      case "สำเร็จ":
      default:
        return {
          label: "เสร็จสิ้น",
          bg: "rgba(34,197,94,0.1)",
          color: "#166534",
          dotBg: "bg-green-500",
        };
    }
  }, [status, orderType]);

  return (
    <div
      className="bg-white rounded-2xl p-3 shadow-soft border overflow-hidden"
      style={{ borderColor: "#ece4d6" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ background: "rgba(255, 203, 68, 0.15)" }}
          >
            <ClipboardList size={14} style={{ color: "#ffcb44" }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: BRAND }}>
              สถานะ Order ของคุณ
            </p>
            <p className="text-[10px]" style={{ color: INK_MUTED }}>
              {orderNumber}
            </p>
          </div>
        </div>
        <motion.span
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
          style={{ background: statusBadge.bg, color: statusBadge.color }}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotBg} animate-pulse`} />
          {statusBadge.label}
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-slate-100 mb-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "#ffcb44" }}
        />
      </div>

      {/* Step icons row with connection line behind them */}
      <div className="relative flex items-center justify-between mb-3">
        {/* Gray connecting line */}
        <div
          className="absolute top-4 h-[2px] -translate-y-1/2"
          style={{ background: "#eef2f6", left: 16, right: 16 }}
        />
        {/* Yellow active connecting line */}
        <div
          className="absolute top-4 h-[2px] -translate-y-1/2 transition-all duration-500"
          style={{
            background: "#ffcb44",
            left: 16,
            width: `calc((${Math.max(0, (doneCount - 1) / (steps.length - 1))} * (100% - 32px)))`,
          }}
        />
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex flex-col items-center gap-1 flex-1 relative z-10">
              <div className="relative">
                <div
                  className="grid h-8 w-8 place-items-center rounded-full transition-all relative z-10"
                  style={{
                    background: s.done ? BRAND : s.active ? "#ffcb44" : "#eef2f6",
                    color: s.done ? "#ffcb44" : s.active ? BRAND : INK_MUTED,
                    boxShadow: s.active ? "0 0 0 3px rgba(255, 203, 68, 0.3)" : "none",
                  }}
                >
                  <Icon size={14} />
                </div>
                {s.active && (
                  <motion.span
                    className="absolute inset-0 rounded-full z-0"
                    style={{ border: `2px solid #ffcb44` }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-semibold text-center leading-tight mt-1"
                style={{ color: s.done || s.active ? BRAND : INK_MUTED }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Underlined text link to status screen */}
      <div className="text-center mt-2.5">
        <button
          onClick={onGoToStatus}
          className="text-xs font-semibold underline transition hover:opacity-80"
          style={{ color: BRAND }}
        >
          ดูรายละเอียดสถานะทั้งหมด
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// History Overlay (Full Page)
// ─────────────────────────────────────────────────────────────
function HistoryOverlay({
  orderHistory,
  onBack,
}: {
  orderHistory: OrderHistory[];
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ background: BRAND, color: "white" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
          >
            <ChevronLeft size={20} color={GOLD} />
          </button>
          <div>
            <h1 className="text-lg font-bold">ประวัติการสั่งซื้อ</h1>
            <p className="text-xs text-white/60">{orderHistory.length} รายการ</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-8 space-y-4">
        {orderHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package size={48} className="mb-4" style={{ color: INK_MUTED }} />
            <p className="text-sm font-medium" style={{ color: INK_MUTED }}>
              ยังไม่มีประวัติการสั่งซื้อ
            </p>
            <p className="text-xs mt-1" style={{ color: INK_MUTED }}>
              เริ่มสั่งอาหารเลย!
            </p>
          </div>
        ) : (
          orderHistory.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white rounded-2xl shadow-soft overflow-hidden"
            >
              {/* Order header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: "rgba(0,46,71,0.03)", borderBottom: "1px solid #f1ece4" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-xl"
                    style={{ background: BRAND, color: GOLD }}
                  >
                    <Receipt size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: BRAND }}>
                      {order.orderNumber}
                    </p>
                    <p className="text-[10px]" style={{ color: INK_MUTED }}>
                      {order.date}
                    </p>
                  </div>
                </div>
                <span
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5"
                  style={{
                    background:
                      order.status === "สำเร็จ"
                        ? "#dcfce7"
                        : order.status === "กำลังจัดส่ง"
                          ? "#dbeafe"
                          : "#fef9c3",
                    color:
                      order.status === "สำเร็จ"
                        ? "#15803d"
                        : order.status === "กำลังจัดส่ง"
                          ? "#1d4ed8"
                          : "#a16207",
                  }}
                >
                  {order.status === "สำเร็จ" && <CheckCircle size={12} />}
                  {order.status === "กำลังจัดส่ง" && <Bike size={12} />}
                  {order.status === "กำลังเตรียม" && <ChefHat size={12} />}
                  {order.status}
                </span>
              </div>

              {/* Order items */}
              <div className="px-4 py-3 space-y-2.5">
                {(order.items || []).map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-3">
                    <img
                      src={encodeURI(String(item.image))}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: BRAND }}>
                        {item.name}
                      </p>
                      <p className="text-xs" style={{ color: INK_MUTED }}>
                        × {item.qty} · ฿{item.price}/ชิ้น
                      </p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: BRAND }}>
                      ฿{item.price * item.qty}
                    </p>
                  </div>
                ))}
              </div>

              {/* Order total */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: "#fafbfc", borderTop: "1px solid #f1ece4" }}
              >
                <div className="text-xs" style={{ color: INK_MUTED }}>
                  <span>อาหาร ฿{order.subtotal}</span>
                  <span className="mx-1.5">·</span>
                  <span>จัดส่ง ฿{order.delivery}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: INK_MUTED }}>
                    รวม
                  </span>
                  <span className="text-lg font-bold" style={{ color: BRAND }}>
                    ฿{order.total}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Contact Overlay (Full Page)
// ─────────────────────────────────────────────────────────────
function ContactOverlay({ onBack }: { onBack: () => void }) {
  const reviews = [
    {
      id: 1,
      name: "Panisa T.",
      initials: "PT",
      stars: 5,
      date: "5 มิ.ย. 2026",
      text: "อร่อยสุดยอดมากครับ กระเพราหมูกรอบคือที่สุด! หนังหมูกรอบกรุบกรอบกำลังดี รสชาติเผ็ดจัดจ้านสะใจ แนะนำเลยครับ",
    },
    {
      id: 2,
      name: "Chawalit R.",
      initials: "CR",
      stars: 5,
      date: "2 มิ.ย. 2026",
      text: "ชอบผัดพริกแกงหมูกรอบมากครับ รสชาติเข้มข้นถึงเครื่องแกง ไข่ดาวทอดมาแบบกึ่งสุกกึ่งดิบกำลังดี บริการส่งรวดเร็วทันใจมากครับ",
    },
    {
      id: 3,
      name: "Somsri K.",
      initials: "SK",
      stars: 4,
      date: "28 พ.ค. 2026",
      text: "น้ำลำไยหวานชื่นใจ หอมกลิ่นลำไยสด ดื่มคู่กับผัดซีอิ๊วอร่อยลงตัวมากๆ ค่ะ ร้านสะอาดและใช้วัตถุดิบคุณภาพดีจริงๆ",
    },
  ];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ background: BRAND, color: "white" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
          >
            <ChevronLeft size={20} color={GOLD} />
          </button>
          <h1 className="text-lg font-bold">ข้อมูลร้านค้า</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* Google Maps Container */}
        <div className="relative h-64 w-full bg-slate-200 overflow-hidden">
          <iframe
            title="Google Maps"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.6416801968853!2d100.5670868153347!3d13.737152990356773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29f03b57e7939%3A0xe5a3637e163b7e80!2sSukhumvit%2031%2C%20Khlong%20Toei%20Nuea%2C%20Watthana%2C%20Bangkok%2010110!5e0!3m2!1sen!2sth!4v1655610000000!5m2!1sen!2sth"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          ></iframe>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

          {/* Shop info overlay on Map */}
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between pointer-events-none">
            <div className="text-white">
              <h2 className="text-xl font-bold">ร้านลุงเก็ต</h2>
              <p className="text-xs text-white/80 mt-1">อาหารตามสั่ง · Street Food</p>
            </div>
            
            {/* Rating badge */}
            <div className="bg-[#ffcb44] rounded-2xl px-3 py-2 flex flex-col items-center shadow-lg shrink-0" style={{ color: BRAND }}>
              <span className="text-base font-extrabold leading-none">4.8</span>
              <div className="flex gap-0.5 my-0.5" style={{ color: BRAND }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={8} fill="currentColor" stroke="none" />
                ))}
              </div>
              <span className="text-[9px] font-semibold leading-none opacity-85">214 รีวิว</span>
            </div>
          </div>
        </div>

        {/* Contact info details list */}
        <div className="mx-5 mt-5 bg-white rounded-2xl border border-slate-200/80 shadow-soft divide-y divide-slate-100">
          {/* Address */}
          <div className="p-4 flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl shrink-0" style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}>
              <MapPin size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400">Address</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">
                88/12 ซอยสุขุมวิท 31 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110
              </p>
            </div>
            <a
              href="https://maps.app.goo.gl/yS3EHz9n2H4Hkpxu7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full border text-xs font-bold shrink-0 flex items-center gap-1 transition hover:bg-slate-50 mt-1"
              style={{ borderColor: BRAND, color: BRAND }}
            >
              <MapPin size={12} /> นำทาง
            </a>
          </div>

          {/* Opening Hours */}
          <div className="p-4 flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl shrink-0" style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}>
              <Clock size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400">Opening Hours</p>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-700 font-medium">อาทิตย์ - ศุกร์</span>
                <span className="text-slate-800 font-semibold">08:00 - 21:00</span>
              </div>
              <div className="flex justify-between text-sm mt-0.5">
                <span className="text-red-500 font-medium">วันเสาร์</span>
                <span className="text-red-500 font-semibold">ปิดทำการ</span>
              </div>
            </div>
          </div>

          {/* Phone */}
          <a
            href="tel:02-123-4567"
            className="p-4 flex items-center gap-3 transition hover:bg-slate-50"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl shrink-0" style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}>
              <Phone size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400">Phone</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: GOLD }}>
                02-123-4567
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </a>
        </div>

        {/* Reviews Section */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base" style={{ color: BRAND }}>Reviews</h3>
            <button className="text-xs font-semibold hover:underline" style={{ color: BRAND }}>
              See all
            </button>
          </div>

          {/* Rating Summary Box */}
          <div className="bg-[#002e47] text-white rounded-2xl p-5 mt-3 flex items-center justify-between shadow-soft">
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold leading-none">4.8</span>
              <div className="flex gap-0.5 text-[#ffcb44] my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" stroke="none" />
                ))}
              </div>
              <span className="text-xs text-white/70">214 รีวิว</span>
            </div>

            {/* Progress Bars */}
            <div className="flex-1 max-w-[160px] space-y-1.5">
              {[
                { star: 5, pct: 85 },
                { star: 4, pct: 10 },
                { star: 3, pct: 3 },
                { star: 2, pct: 1 },
                { star: 1, pct: 1 },
              ].map((item) => (
                <div key={item.star} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/80 font-medium w-2 leading-none">{item.star}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#ffcb44]" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review List */}
          <div className="mt-4 space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full text-white font-bold text-sm bg-[#002e47]">
                    {r.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{r.name}</h4>
                      <span className="text-[10px] text-slate-400">{r.date}</span>
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          fill={i < r.stars ? "#ffcb44" : "none"}
                          stroke={i < r.stars ? "none" : "#cbd5e1"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: BRAND }}>
                  {r.text}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Store Closed Overlay
// ─────────────────────────────────────────────────────────────
function StoreClosedOverlay({
  onBypass,
  onOpenSidebar,
}: {
  onBypass: () => void;
  onOpenSidebar: () => void;
}) {
  const todayDay = useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const thTime = new Date(utc + 3600000 * 7);
    return thTime.getUTCDay();
  }, []);

  const daysInfo = [
    { name: "วันอาทิตย์", label: "อา.", time: "08:00 - 21:00", open: true, dayIndex: 0 },
    { name: "วันจันทร์", label: "จ.", time: "08:00 - 21:00", open: true, dayIndex: 1 },
    { name: "วันอังคาร", label: "อ.", time: "08:00 - 21:00", open: true, dayIndex: 2 },
    { name: "วันพุธ", label: "พ.", time: "08:00 - 21:00", open: true, dayIndex: 3 },
    { name: "วันพฤหัสบดี", label: "พฤ.", time: "08:00 - 21:00", open: true, dayIndex: 4 },
    { name: "วันศุกร์", label: "ศ.", time: "08:00 - 21:00", open: true, dayIndex: 5 },
    { name: "วันเสาร์", label: "ส.", time: "ปิดทำการ", open: false, dayIndex: 6 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between shadow-sm" style={{ background: BRAND, color: "white" }}>
        <button
          onClick={onOpenSidebar}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 active:scale-95 transition-transform"
        >
          <Menu size={20} color={GOLD} />
        </button>
        <span className="text-xs uppercase tracking-[0.25em] text-white/60 font-bold">EPICUREAN</span>
        <div className="w-10" />
      </div>

      {/* Main Banner */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Pulsing closed icon */}
          <div className="flex justify-center mt-2">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-sm animate-pulse">
                <Store size={38} className="stroke-[1.5]" />
              </div>
              <div className="absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white border border-white shadow-md">
                <Clock size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>
          </div>

          {/* Main Closed Text Box */}
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold text-slate-800 leading-snug">
              วันนี้ร้านปิดทำการ ขออภัยในความไม่สะดวก
            </h2>
            <div className="inline-block bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4 mt-2 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-amber-900 leading-relaxed">
                เราจะเปิดบริการอีกครั้งวันอาทิตย์-ศุกร์<br />
                เวลา <span className="font-extrabold text-amber-950 text-base">8:00 - 21:00 น.</span>
              </p>
            </div>
          </div>

          {/* Opening Schedule Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">ตารางเวลาให้บริการ</h3>
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft divide-y divide-slate-100 overflow-hidden">
              {daysInfo.map((day) => {
                const isToday = day.dayIndex === todayDay;
                return (
                  <div
                    key={day.dayIndex}
                    className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
                      isToday ? "bg-amber-500/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                        isToday 
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {day.label}
                      </span>
                      <span className={`text-sm font-semibold ${isToday ? "text-slate-800" : "text-slate-600"}`}>
                        {day.name} {isToday && <span className="ml-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">วันนี้</span>}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700">{day.time}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${day.open ? "bg-emerald-500" : "bg-red-500"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Demo Bypass Button */}
        <div className="mt-8 space-y-3">
          <button
            onClick={onBypass}
            className="w-full py-4 px-5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200/80 transition-all text-center flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            เข้าสู่หน้าร้าน (โหมดสาธิตสำหรับทดสอบ)
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            * ปุ่มด้านบนสำหรับผู้ตรวจสอบเพื่อทดสอบการใช้งานในวันหยุด/นอกเวลา
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
function Sidebar({
  onClose,
  onNavigate,
  orderHistory,
  simulateClosed,
  setSimulateClosed,
  profile,
  onLogout,
}: {
  onClose: () => void;
  onNavigate: (t: string) => void;
  orderHistory: OrderHistory[];
  simulateClosed: boolean;
  setSimulateClosed: (s: boolean) => void;
  profile: LiffProfile | null;
  onLogout: () => void;
}) {
  const items = [
    { id: "home", label: "หน้าแรก", icon: HomeIcon },
    { id: "status", label: "สถานะการสั่งซื้อ", icon: ClipboardList },
    { id: "history", label: "ประวัติการสั่งซื้อ", icon: History },
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
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="h-12 w-12 rounded-full object-cover"
                style={{ border: "2px solid " + GOLD }}
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: GOLD, color: BRAND }}>
                <User size={22} />
              </div>
            )}
            <div>
              <p className="font-bold">{profile?.displayName ?? "ผู้ใช้งาน"}</p>
              <p className="text-xs text-white/60">LINE Account</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          <nav className="space-y-1">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  onNavigate(it.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-white/5"
              >
                <it.icon size={18} color={GOLD} />
                <span className="font-medium text-sm">{it.label}</span>
                {it.id === "history" && orderHistory.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: GOLD, color: BRAND }}>
                    {orderHistory.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-5 border-t border-white/10 space-y-4">
          {/* Simulator Panel */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5">
              โหมดผู้พัฒนา (Developer Mode)
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">จำลองสถานะร้านปิด</span>
              <button
                type="button"
                onClick={() => setSimulateClosed(!simulateClosed)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  simulateClosed ? "bg-amber-500" : "bg-white/15"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    simulateClosed ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10">
              <a
                href="/kitchen"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition text-center"
              >
                <span>เปิดระบบจัดการครัว (Kitchen Monitor)</span>
                <ChevronRight size={14} />
              </a>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.08)", color: "white" }}
          >
            <LogOut size={16} /> ออกจากระบบ LINE
          </button>
          <p className="mt-2 text-center text-[10px] text-white/40">
            © 2026 Epicurean · LINE LIFF
          </p>
        </div>

      </motion.aside>
    </>
  );
}
