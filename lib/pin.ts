import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPin(pin: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return { hash, salt };
}

export function verificarPin(pin: string, hash: string, salt: string): boolean {
  const calculado = scryptSync(pin, salt, 64);
  const guardado = Buffer.from(hash, "hex");
  return guardado.length === calculado.length && timingSafeEqual(guardado, calculado);
}