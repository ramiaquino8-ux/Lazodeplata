import { cookies } from "next/headers";

const NOMBRE_COOKIE = "lazo_sesion";
const UN_ANIO = 60 * 60 * 24 * 365;

export async function crearSesion(miembroId: number): Promise<void> {
  const c = await cookies();
  const payload = Buffer.from(JSON.stringify({ m: miembroId })).toString("base64url");
  c.set(NOMBRE_COOKIE, payload, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.LAZO_SECURE_COOKIE === "true",
    path: "/",
    maxAge: UN_ANIO,
  });
}

export async function obtenerMiembroId(): Promise<number | null> {
  const c = await cookies();
  const raw = c.get(NOMBRE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const data = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      m?: number;
    };
    return typeof data.m === "number" ? data.m : null;
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  const c = await cookies();
  c.delete(NOMBRE_COOKIE);
}