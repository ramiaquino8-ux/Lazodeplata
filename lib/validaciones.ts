import { z } from "zod";

export const CATEGORIAS = [
  "Entretenimiento",
  "Comidas",
  "Salidas",
  "Compras",
  "Otros",
] as const;

const numeroPositivo = z.coerce
  .number({ invalid_type_error: "Ingresá un número válido." })
  .int("Tiene que ser un número entero.")
  .positive("Tiene que ser mayor que cero.");

const numeroNoNegativo = z.coerce
  .number({ invalid_type_error: "Ingresá un número válido." })
  .int("Tiene que ser un número entero.")
  .nonnegative("No puede ser negativo.");

export const esquemaUsuario = z
  .string()
  .trim()
  .min(2, "El usuario tiene que tener al menos 2 caracteres.")
  .max(20, "El usuario no puede superar los 20 caracteres.")
  .regex(
    /^[a-z0-9._-]+$/i,
    "Solo letras, números, punto, guión y guión bajo."
  );

export const esquemaNombreFamilia = z
  .string()
  .trim()
  .min(2, "El nombre de la familia tiene que tener al menos 2 caracteres.")
  .max(40, "El nombre no puede superar los 40 caracteres.");

export const esquemaNombre = z
  .string()
  .trim()
  .min(1, "Ingresá tu nombre.")
  .max(60, "El nombre no puede superar los 60 caracteres.");

export const esquemaPin = z
  .string()
  .trim()
  .regex(/^\d{4,10}$/, "El PIN tiene que ser de 4 a 10 números.");

export const esquemaCrearFamilia = z.object({
  familia: esquemaNombreFamilia,
  nombre: esquemaNombre,
  usuario: esquemaUsuario,
  pin: esquemaPin,
});

export const esquemaEntrar = z.object({
  familia: z.string().trim().min(1, "Ingresá el nombre de la familia."),
  usuario: z.string().trim().min(1, "Ingresá tu usuario."),
  pin: esquemaPin,
});

export const AVATARES = [
  "🦊",
  "🐱",
  "🐼",
  "🦉",
  "🐺",
  "🦁",
  "🐢",
  "🦄",
] as const;

export const esquemaAltaHijo = z.object({
  usuario: esquemaUsuario,
  nombre: esquemaNombre,
  fechaNacimiento: z.coerce.date({ invalid_type_error: "Ingresá la fecha de nacimiento." }),
  avatar: z.enum(AVATARES, { errorMap: () => ({ message: "Elegí un avatar." }) }),
  mesada: numeroNoNegativo.optional().default(0),
  periodo: z.enum(["mensual", "semanal"]).optional().default("mensual"),
});

export const esquemaGasto = z.object({
  monto: numeroPositivo.max(1_000_000, "Ese monto parece un error."),
  categoria: z.enum(CATEGORIAS, { errorMap: () => ({ message: "Elegí una categoría." }) }),
  descripcion: z.string().trim().max(200, "La descripción es muy larga.").optional().default(""),
});

export const esquemaAhorro = z.object({
  monto: numeroPositivo.max(1_000_000, "Ese monto parece un error."),
});

export const esquemaObjetivo = z.object({
  nombre: z.string().trim().min(2, "Ponle un nombre al objetivo.").max(60, "Nombre muy largo."),
  meta: numeroPositivo.max(10_000_000, "Ese monto parece un error."),
  fechaDeseada: z.string().optional().default(""),
});

export const esquemaAporte = z.object({
  objetivoId: z.coerce.number().int().positive(),
  monto: numeroPositivo.max(1_000_000, "Ese monto parece un error."),
});

export const esquemaPedido = z.object({
  monto: numeroPositivo.max(1_000_000, "Ese monto parece un error."),
  motivo: z.string().trim().min(3, "Contá un poco más por qué lo necesitás.").max(200, "Motivo muy largo."),
});

export const esquemaRespuestaPedido = z.object({
  pedidoId: z.coerce.number().int().positive(),
  accion: z.enum(["aprobar", "rechazar", "contraoferta"]),
  monto: numeroNoNegativo.optional().default(0),
  motivo: z.string().trim().max(200).optional().default(""),
});

export const esquemaPresupuesto = z.object({
  hijoId: z.coerce.number().int().positive(),
  categoria: z.enum(CATEGORIAS),
  limite: numeroNoNegativo.max(10_000_000, "Ese monto parece un error."),
});

export const esquemaNivel = z.object({
  hijoId: z.coerce.number().int().positive(),
  nivel: z.coerce.number().int().min(1).max(3),
});

export const esquemaMesada = z.object({
  hijoId: z.coerce.number().int().positive(),
  monto: numeroNoNegativo.max(10_000_000, "Ese monto parece un error."),
  periodo: z.enum(["mensual", "semanal"]).optional().default("mensual"),
});

export const esquemaExtra = z.object({
  hijoId: z.coerce.number().int().positive(),
  monto: numeroPositivo.max(1_000_000, "Ese monto parece un error."),
  motivo: z.string().trim().min(2, "Contá el motivo.").max(200, "Motivo muy largo."),
});

export function primeraError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisá los datos ingresados.";
}