import liff from "@line/liff";

// ─── กำหนด LIFF ID ของคุณตรงนี้ ───────────────────────────────
// สร้างได้ที่ https://developers.line.biz/console/
// แล้วใส่ใน .env ด้วย VITE_LIFF_ID=xxxxxxxxxxxx-xxxxxxxx
const LIFF_ID = import.meta.env.VITE_LIFF_ID ?? "YOUR_LIFF_ID_HERE";

export type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

let initialized = false;

export async function initLiff(): Promise<void> {
  if (initialized) return;
  await liff.init({ liffId: LIFF_ID });
  initialized = true;
}

export function isLiffLoggedIn(): boolean {
  return liff.isLoggedIn();
}

export function liffLogin(): void {
  liff.login();
}

export function liffLogout(): void {
  liff.logout();
  initialized = false;
}

export async function getLiffProfile(): Promise<LiffProfile> {
  return await liff.getProfile();
}

export function isInLiffClient(): boolean {
  return liff.isInClient();
}
