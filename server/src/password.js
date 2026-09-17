/**
 * Hasła: scrypt z wbudowanego modułu crypto Node'a. Bez zewnętrznej biblioteki,
 * bo Node ma to od lat i jest to funkcja zaprojektowana pod hasła (kosztowna
 * pamięciowo, więc łamanie kartą graficzną jest drogie).
 *
 * Format zapisu w bazie: scrypt$<sól hex>$<hash hex>
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const KEY_LEN = 64;
const SALT_LEN = 16;

export const MIN_PASSWORD = 8;

export async function hashPassword(plain) {
  if (typeof plain !== "string" || plain.length < MIN_PASSWORD) {
    throw new Error(`Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.`);
  }
  const salt = randomBytes(SALT_LEN);
  const key = await scrypt(plain, salt, KEY_LEN);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(plain, stored) {
  if (!stored) return false;
  const [algo, saltHex, keyHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !keyHex) return false;
  const key = Buffer.from(keyHex, "hex");
  const test = await scrypt(plain, Buffer.from(saltHex, "hex"), key.length);
  // timingSafeEqual, żeby czas odpowiedzi nie zdradzał, ile znaków się zgadza.
  return timingSafeEqual(key, test);
}
