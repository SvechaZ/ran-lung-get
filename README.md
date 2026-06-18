# 🍜 ร้านลุงเกตุ (Ran Lung Get) - LINE LIFF Epicurean Delivery

เว็บแอปพลิเคชันสั่งอาหารระดับพรีเมียมที่ออกแบบมาให้ทำงานได้อย่างราบรื่นและสวยงามผ่าน **LINE Front-end Framework (LIFF)**

แอปพลิเคชันนี้ใช้โครงสร้างสถาปัตยกรรมยุคใหม่ด้วย **TanStack Start** และ **React 19** มอบประสบการณ์การใช้งาน (UX/UI) ที่ลื่นไหลเหมือน Native App บนมือถือ

---

## ✨ Features (คุณสมบัติเด่น)

- 🛵 **ช่องทางการสั่งอาหารแบบ Hybrid**:
  - **จัดส่งถึงที่ (Delivery)**: ระบบระบุที่อยู่พร้อมพิกัดด่วน (บ้าน, ที่ทำงาน, หอพัก) และเลือกวิธีการรับอาหาร (วางหน้าประตู หรือ ลงมารับเอง)
  - **ทานที่ร้าน (Dine-in)**: เลือกโต๊ะอาหารผ่าน **ผังที่นั่งจำลอง (Seats Layout)** ที่อัปเดตสถานะแบบ Real-time (ว่าง, ไม่ว่าง, จองแล้ว)
- 🛒 **เมนูอาหารระดับพรีเมียม**:
  - สไลเดอร์แนะนำเมนูแนะนำ (Chef's Pick) พร้อมระบุระดับความเผ็ด และเพิ่มตัวเลือกพิเศษ (เช่น ไข่ดาว, หมูกรอบ)
  - ตะกร้าสินค้าด้านล่าง (Floating Cart) และหน้าสรุปคำสั่งซื้อดึงข้อมูลพร้อมคำนวณราคาอัตโนมัติ
- 💳 **ชำระเงินสะดวกผ่าน PromptPay**:
  - หน้าต่าง QR Code พร้อมฟังก์ชันคัดลอกหมายเลขพร้อมเพย์แบบคลิกเดียว
  - ฟังก์ชันแนบและพรีวิวสลิปหลักฐานการโอนเงิน
- 📍 **ระบบติดตามสถานะการจัดส่ง (Order Tracking)**:
  - **Mini Order Tracker (หน้าหลัก)**: แถบสถานะย่อขนาดกะทัดรัดใต้รูปภาพแบนเนอร์หลัก แสดงการเชื่อมต่อสถานะแต่ละขั้นตอนในรูปแบบ Timeline ที่เห็นชัดเจนและเข้าใจง่าย
  - **หน้าเช็คสถานะหลัก**: ระบบตรวจดูสถานะแบบละเอียด (รับออเดอร์, กำลังเตรียม, ออกจัดส่ง, ส่งถึงแล้ว)
- 🕒 **ประวัติการสั่งซื้อ (Order History)**:
  - บันทึกและเรียกดูรายการที่เคยสั่งซื้อย้อนหลังพร้อมแสดงสถานะเสร็จสิ้น
- 📱 **เมนูควบคุมด้านข้าง (Sidebar Navigation)**:
  - เข้าถึงหน้าต่างๆ ได้อย่างรวดเร็วและเป็นระเบียบ

---

## 🛠️ Tech Stack (เทคโนโลยีที่ใช้)

- **Framework**: [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (TanStack Router + React 19)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (ใช้ `@tailwindcss/vite` ในการประมวลผล)
- **Components**: [Radix UI](https://www.radix-ui.com/) Primitives
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://motion.dev/) (ชุดไลบรารี `motion/react`)
- **Forms & Validation**: React Hook Form, Zod

---

## 🚀 Getting Started (วิธีการใช้งานในเครื่องของคุณ)

### Prerequisites

ตรวจสอบให้แน่ใจว่าเครื่องของคุณติดตั้ง **Node.js** (แนะนำเวอร์ชัน 18 ขึ้นไป) เรียบร้อยแล้ว

### 1. โคลนโปรเจกต์
```bash
git clone <project>
cd <project>
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. รันโปรเจกต์ในโหมด Development
```bash
npm run dev
```


### 4. การ Build สำหรับ Production
```bash
npm run build
npm run preview
```

---

## 📂 Project Structure (โครงสร้างโฟลเดอร์หลัก)

```text
ran-lung-get/
├── public/              # รูปภาพประกอบและไอคอนต่างๆ
├── src/
│   ├── routes/
│   │   ├── __root.tsx   # โครงสร้างหลัก (Root layout และ Global context)
│   │   └── index.tsx    # หน้าหลักแอปพลิเคชัน (HomeScreen, StatusScreen, Tracker)
│   ├── components/      # UI Components ทั่วไป
│   └── main.tsx         # จุดเริ่มต้นของแอปพลิเคชัน
├── package.json         # ข้อมูลโปรเจกต์และ dependencies
└── vite.config.ts       # การตั้งค่า Vite
```
