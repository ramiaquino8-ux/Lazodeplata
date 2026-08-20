"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { run, transaccion, get } from "@/lib/db";
import { crearSesion, obtenerMiembroId, cerrarSesion } from "@/lib/session";
import { hashPin, verificarPin } from "@/lib/pin";
import * as d from "@/lib/data";
import {
  esquemaAltaHijo,
  esquemaAporte,
  esquemaAhorro,
  esquemaCrearFamilia,
  esquemaEntrar,
  esquemaExtra,
  esquemaGasto,
  esquemaMesada,
  esquemaNivel,
  esquemaObjetivo,
  esquemaPedido,
  esquemaPresupuesto,
  esquemaRespuestaPedido,
  primeraError,
} from "@/lib/validaciones";
import type { EstadoAction, MiembroRow } from "@/lib/tipos";

const GENERICO = "No pudimos completar esta operación, probá de nuevo.";

function leer<T>(formData: FormData, schema: z.ZodType<T>): { data: T } | { error: string } {
  const res = schema.safeParse(Object.fromEntries(formData));
  if (!res.success) return { error: primeraError(res.error) };
  return { data: res.data };
}

async function miembroActual(): Promise<MiembroRow | null> {
  const id = await obtenerMiembroId();
  if (!id) return null;
  return d.getMiembro(id) ?? null;
}

function guardarParent(miembro: MiembroRow | null, familiaId: number): string | null {
  if (!miembro) return "Tu sesión expiró. Volvé a entrar.";
  if (miembro.rol !== "parent" || miembro.familia_id !== familiaId)
    return "No tenés permiso para hacer esto.";
  return null;
}

function guardarHijo(miembro: MiembroRow | null, familiaId: number): string | null {
  if (!miembro) return "Tu sesión expiró. Volvé a entrar.";
  if (miembro.rol !== "child" || miembro.familia_id !== familiaId)
    return "No tenés permiso para hacer esto.";
  return null;
}

async function conTry(fn: () => Promise<EstadoAction>): Promise<EstadoAction> {
  try {
    return await fn();
  } catch (e) {
    console.error(e);
    return { ok: false, error: GENERICO };
  }
}

function getHijoDeFamilia(familiaId: number, hijoId: number): MiembroRow | null {
  const miembro = d.getMiembro(hijoId);
  if (!miembro || miembro.rol !== "child" || miembro.familia_id !== familiaId) return null;
  return miembro;
}

// ---------------------------------------------------------------------------
// Sesión y acceso
// ---------------------------------------------------------------------------

export async function crearFamilia(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  const res = leer(formData, esquemaCrearFamilia);
  if ("error" in res) return { ok: false, error: res.error };
  const { familia, nombre, usuario, pin } = res.data;

  if (d.getFamiliaPorNombre(familia)) {
    return { ok: false, error: "Ya existe una familia con ese nombre." };
  }
  const nombreDefinitivo = familia.charAt(0).toUpperCase() + familia.slice(1).toLowerCase();
  const { hash, salt } = hashPin(pin);

  const miembroId = transaccion(() => {
    const fId = run(
      "INSERT INTO familias (nombre, pin_hash, pin_salt) VALUES (?,?,?)",
      nombreDefinitivo,
      hash,
      salt
    ).lastInsertRowid;
    return run(
      `INSERT INTO miembros (familia_id, usuario, rol, nombre, mesada_periodo)
       VALUES (?,?, 'parent', ?, 'mensual')`,
      fId,
      usuario,
      nombre
    ).lastInsertRowid;
  });

  await crearSesion(miembroId);
  const miembro = d.getMiembro(miembroId);
  redirect(`/f/${miembro!.familia_id}/padre`);
}

export async function entrarFamilia(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  const res = leer(formData, esquemaEntrar);
  if ("error" in res) return { ok: false, error: res.error };
  const { familia, usuario, pin } = res.data;

  const fam = d.getFamiliaPorNombre(familia);
  if (!fam) return { ok: false, error: "No encontramos una familia con ese nombre." };
  if (!fam.pin_hash || !fam.pin_salt || !verificarPin(pin, fam.pin_hash, fam.pin_salt)) {
    return { ok: false, error: "El PIN no es correcto." };
  }
  const miembro = d.getMiembroEnFamilia(fam.id, usuario);
  if (!miembro)
    return { ok: false, error: `Ese usuario no está anotado en la familia "${fam.nombre}".` };

  await crearSesion(miembro.id);
  redirect(
    miembro.rol === "parent" ? `/f/${fam.id}/padre` : `/f/${fam.id}/hijo`
  );
}

export async function salir(_prev: EstadoAction): Promise<EstadoAction> {
  await cerrarSesion();
  redirect("/login");
}

export async function salirDeLaApp(): Promise<void> {
  await cerrarSesion();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Adulto: alta de hijo
// ---------------------------------------------------------------------------

export async function agregarHijo(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaAltaHijo);
    if ("error" in res) return { ok: false, error: res.error };
    const { usuario, nombre, fechaNacimiento, avatar, mesada, periodo } = res.data;

    if (d.getMiembroEnFamilia(familiaId, usuario)) {
      return { ok: false, error: "Ya hay alguien con ese usuario en esta familia." };
    }

    const nacimiento =
      fechaNacimiento instanceof Date
        ? fechaNacimiento.toISOString().slice(0, 10)
        : String(fechaNacimiento).slice(0, 10);

    const hijoId = run(
      `INSERT INTO miembros
         (familia_id, usuario, rol, nombre, fecha_nacimiento, avatar, nivel, mesada_monto, mesada_periodo, mesada_ultimo_pago)
       VALUES (?,?, 'child', ?, ?, ?, 2, ?, ?, date('now','-1 day'))`,
      familiaId,
      usuario,
      nombre,
      nacimiento,
      avatar,
      mesada ?? 0,
      periodo ?? "mensual"
    ).lastInsertRowid;
    run("INSERT INTO wallets (miembro_id, saldo, ahorrado) VALUES (?,0,0)", hijoId);

    revalidatePath(`/f/${familiaId}/padre`);
    return { ok: true, mensaje: `${nombre} ya forma parte de la familia.` };
  });
}

// ---------------------------------------------------------------------------
// Adulto: plata y configuración por hijo
// ---------------------------------------------------------------------------

export async function mandarMesada(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const hijoId = Number(formData.get("hijoId"));
    const hijo = getHijoDeFamilia(familiaId, hijoId);
    if (!hijo) return { ok: false, error: "Ese hijo no pertenece a tu familia." };
    if (hijo.mesada_monto <= 0)
      return { ok: false, error: "Configurá un monto de mesada para este hijo primero." };

    run(
      `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, descripcion, estado)
       VALUES (?,?, 'mesada', ?, 'Mesada', 'aprobado')`,
      familiaId,
      hijo.id,
      hijo.mesada_monto
    );
    run("UPDATE wallets SET saldo = saldo + ? WHERE miembro_id = ?", hijo.mesada_monto, hijo.id);
    run("UPDATE miembros SET mesada_ultimo_pago = date('now') WHERE id = ?", hijo.id);

    revalidatePath(`/f/${familiaId}/padre`);
    revalidatePath(`/f/${familiaId}/hijo`);
    return {
      ok: true,
      mensaje: `Mesada de ${hijo.nombre} depositada.`,
    };
  });
}

export async function mandarPlataExtra(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaExtra);
    if ("error" in res) return { ok: false, error: res.error };
    const { hijoId, monto, motivo } = res.data;

    const hijo = getHijoDeFamilia(familiaId, hijoId);
    if (!hijo) return { ok: false, error: "Ese hijo no pertenece a tu familia." };

    run(
      `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, descripcion, estado)
       VALUES (?,?, 'extra', ?, ?, 'aprobado')`,
      familiaId,
      hijo.id,
      monto,
      motivo
    );
    run("UPDATE wallets SET saldo = saldo + ? WHERE miembro_id = ?", monto, hijo.id);

    revalidatePath(`/f/${familiaId}/padre`);
    revalidatePath(`/f/${familiaId}/hijo`);
    return { ok: true, mensaje: `Le mandaste $${monto.toLocaleString("es-AR")} a ${hijo.nombre}.` };
  });
}

export async function configurarMesada(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaMesada);
    if ("error" in res) return { ok: false, error: res.error };
    const { hijoId, monto, periodo } = res.data;

    const hijo = getHijoDeFamilia(familiaId, hijoId);
    if (!hijo) return { ok: false, error: "Ese hijo no pertenece a tu familia." };

    run("UPDATE miembros SET mesada_monto = ?, mesada_periodo = ? WHERE id = ?", monto, periodo ?? "mensual", hijo.id);

    revalidatePath(`/f/${familiaId}/padre`);
    return { ok: true, mensaje: "Mesada configurada." };
  });
}

export async function configurarPresupuesto(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaPresupuesto);
    if ("error" in res) return { ok: false, error: res.error };
    const { hijoId, categoria, limite } = res.data;

    const hijo = getHijoDeFamilia(familiaId, hijoId);
    if (!hijo) return { ok: false, error: "Ese hijo no pertenece a tu familia." };

    run(
      `INSERT INTO presupuestos (miembro_id, categoria, limite_mensual)
       VALUES (?,?,?)
       ON CONFLICT(miembro_id, categoria) DO UPDATE SET limite_mensual = excluded.limite_mensual`,
      hijo.id,
      categoria,
      limite
    );

    revalidatePath(`/f/${familiaId}/padre`);
    return { ok: true, mensaje: `Presupuesto de ${categoria} actualizado.` };
  });
}

export async function cambiarNivel(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaNivel);
    if ("error" in res) return { ok: false, error: res.error };
    const { hijoId, nivel } = res.data;

    const hijo = getHijoDeFamilia(familiaId, hijoId);
    if (!hijo) return { ok: false, error: "Ese hijo no pertenece a tu familia." };

    run("UPDATE miembros SET nivel = ? WHERE id = ?", nivel, hijo.id);

    revalidatePath(`/f/${familiaId}/padre`);
    revalidatePath(`/f/${familiaId}/hijo`);
    return { ok: true, mensaje: "Nivel de autonomía actualizado." };
  });
}

// ---------------------------------------------------------------------------
// Hijo: gastos, ahorro, objetivos
// ---------------------------------------------------------------------------

function avisoPresupuesto(
  miembroId: number,
  categoria: string
): string | null {
  const presupuesto = get<{ limite: number }>(
    "SELECT limite_mensual AS limite FROM presupuestos WHERE miembro_id = ? AND categoria = ?",
    miembroId,
    categoria
  );
  if (!presupuesto) return null;
  const gastado = d.getGastadoCategoriaMes(miembroId, categoria);
  const pct = gastado / presupuesto.limite;
  if (pct >= 1)
    return `Llegaste al límite de ${categoria} este mes ($${gastado.toLocaleString("es-AR")} de $${presupuesto.limite.toLocaleString("es-AR")}).`;
  if (pct >= 0.8)
    return `Vas por el ${Math.round(pct * 100)}% del presupuesto de ${categoria}.`;
  return null;
}

export async function registrarGasto(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarHijo(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaGasto);
    if ("error" in res) return { ok: false, error: res.error };
    const { monto, categoria, descripcion } = res.data;

    const resumen = d.getWalletResumen(actual.id);
    if (monto > resumen.disponible)
      return {
        ok: false,
        error: `No te alcanza la plata disponible (tenés $${resumen.disponible.toLocaleString("es-AR")}).`,
      };

    if (actual.nivel === 1) {
      run(
        `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, categoria, descripcion, estado)
         VALUES (?,?, 'gasto', ?, ?, ?, 'pendiente')`,
        familiaId,
        actual.id,
        monto,
        categoria,
        descripcion || "Gasto"
      );
      revalidatePath(`/f/${familiaId}/hijo`);
      return {
        ok: true,
        mensaje: "Quedó pendiente de aprobación. Avisá a tu adulto para que lo apruebe.",
      };
    }

    if (actual.nivel === 2) {
      const presupuesto = get<{ limite: number }>(
        "SELECT limite_mensual AS limite FROM presupuestos WHERE miembro_id = ? AND categoria = ?",
        actual.id,
        categoria
      );
      if (presupuesto) {
        const gastado = d.getGastadoCategoriaMes(actual.id, categoria);
        if (gastado + monto > presupuesto.limite) {
          return {
            ok: false,
            error: `Te pasás del presupuesto de ${categoria} ($${gastado.toLocaleString("es-AR")} de $${presupuesto.limite.toLocaleString("es-AR")} este mes). Ajustá el monto o pedí plata extra.`,
          };
        }
      }
    }

    run(
      `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, categoria, descripcion, estado)
       VALUES (?,?, 'gasto', ?, ?, ?, 'aprobado')`,
      familiaId,
      actual.id,
      monto,
      categoria,
      descripcion || "Gasto"
    );
    run("UPDATE wallets SET saldo = saldo - ? WHERE miembro_id = ?", monto, actual.id);

    const aviso = avisoPresupuesto(actual.id, categoria);
    revalidatePath(`/f/${familiaId}/hijo`);
    revalidatePath(`/f/${familiaId}/padre`);
    return { ok: true, mensaje: aviso ?? "Gasto registrado." };
  });
}

export async function aprobarGasto(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const movimientoId = Number(formData.get("movimientoId"));
    const mov = get<{ id: number; familia_id: number; miembro_id: number; monto: number }>(
      "SELECT id, familia_id, miembro_id, monto FROM movimientos WHERE id = ? AND estado = 'pendiente'",
      movimientoId
    );
    if (!mov || mov.familia_id !== familiaId)
      return { ok: false, error: "No encontramos ese gasto pendiente." };

    const resumen = d.getWalletResumen(mov.miembro_id);
    if (mov.monto > resumen.disponible) {
      run("UPDATE movimientos SET estado = 'rechazado' WHERE id = ?", mov.id);
      return {
        ok: true,
        mensaje: "El hijo no tenía plata suficiente: quedó rechazado automáticamente.",
      };
    }

    run("UPDATE movimientos SET estado = 'aprobado' WHERE id = ?", mov.id);
    run("UPDATE wallets SET saldo = saldo - ? WHERE miembro_id = ?", mov.monto, mov.miembro_id);

    revalidatePath(`/f/${familiaId}/padre`);
    revalidatePath(`/f/${familiaId}/hijo`);
    return { ok: true, mensaje: "Gasto aprobado." };
  });
}

export async function rechazarGasto(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const movimientoId = Number(formData.get("movimientoId"));
    const mov = get<{ id: number; familia_id: number }>(
      "SELECT id, familia_id FROM movimientos WHERE id = ? AND estado = 'pendiente'",
      movimientoId
    );
    if (!mov || mov.familia_id !== familiaId)
      return { ok: false, error: "No encontramos ese gasto pendiente." };

    run("UPDATE movimientos SET estado = 'rechazado' WHERE id = ?", mov.id);
    revalidatePath(`/f/${familiaId}/padre`);
    revalidatePath(`/f/${familiaId}/hijo`);
    return { ok: true, mensaje: "Gasto rechazado." };
  });
}

export async function ahorrar(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarHijo(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaAhorro);
    if ("error" in res) return { ok: false, error: res.error };
    const { monto } = res.data;

    const resumen = d.getWalletResumen(actual.id);
    if (monto > resumen.disponible)
      return { ok: false, error: "No tenés esa plata disponible para ahorrar." };

    run("UPDATE wallets SET ahorrado = ahorrado + ? WHERE miembro_id = ?", monto, actual.id);
    run(
      `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, descripcion, estado)
       VALUES (?,?, 'ahorro', ?, 'Ahorro', 'aprobado')`,
      familiaId,
      actual.id,
      monto
    );

    revalidatePath(`/f/${familiaId}/hijo`);
    revalidatePath(`/f/${familiaId}/padre`);
    return { ok: true, mensaje: "¡Plata ahorrada!" };
  });
}

export async function crearObjetivo(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarHijo(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaObjetivo);
    if ("error" in res) return { ok: false, error: res.error };
    const { nombre, meta, fechaDeseada } = res.data;

    run(
      "INSERT INTO objetivos (miembro_id, nombre, meta, ahorrado, fecha_deseada) VALUES (?,?,?,0,?)",
      actual.id,
      nombre,
      meta,
      fechaDeseada || null
    );

    revalidatePath(`/f/${familiaId}/hijo/objetivo`);
    return { ok: true, mensaje: "Objetivo creado. ¡A ahorrar!" };
  });
}

export async function aportarObjetivo(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarHijo(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaAporte);
    if ("error" in res) return { ok: false, error: res.error };
    const { objetivoId, monto } = res.data;

    const objetivo = get<{ id: number; miembro_id: number; meta: number; ahorrado: number; nombre: string }>(
      "SELECT * FROM objetivos WHERE id = ?",
      objetivoId
    );
    if (!objetivo || objetivo.miembro_id !== actual.id)
      return { ok: false, error: "No encontramos ese objetivo." };

    const resumen = d.getWalletResumen(actual.id);
    if (monto > resumen.disponible)
      return { ok: false, error: "No tenés esa plata disponible para el objetivo." };

    run("UPDATE objetivos SET ahorrado = ahorrado + ? WHERE id = ?", monto, objetivo.id);
    run(
      `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, descripcion, estado)
       VALUES (?,?, 'aporte_objetivo', ?, ?, 'aprobado')`,
      familiaId,
      actual.id,
      monto,
      objetivo.nombre
    );

    revalidatePath(`/f/${familiaId}/hijo/objetivo`);
    revalidatePath(`/f/${familiaId}/hijo`);
    const nuevoAhorrado = objetivo.ahorrado + monto;
    return {
      ok: true,
      mensaje:
        nuevoAhorrado >= objetivo.meta
          ? "¡Meta cumplida! Este objetivo está completo."
          : "Aporte sumado al objetivo.",
    };
  });
}

export async function aportarObjetivoAdulto(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaAporte);
    if ("error" in res) return { ok: false, error: res.error };
    const { objetivoId, monto } = res.data;

    const objetivo = get<{ id: number; miembro_id: number; meta: number; ahorrado: number; nombre: string }>(
      "SELECT * FROM objetivos WHERE id = ?",
      objetivoId
    );
    const hijo = objetivo ? d.getMiembro(objetivo.miembro_id) : null;
    if (!objetivo || !hijo || hijo.rol !== "child" || hijo.familia_id !== familiaId)
      return { ok: false, error: "No encontramos ese objetivo." };

    run("UPDATE objetivos SET ahorrado = ahorrado + ? WHERE id = ?", monto, objetivo.id);
    run("UPDATE wallets SET saldo = saldo + ? WHERE miembro_id = ?", monto, hijo.id);
    run(
      `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, descripcion, estado)
       VALUES (?,?, 'aporte_objetivo', ?, 'Aporte del adulto', 'aprobado')`,
      familiaId,
      hijo.id,
      monto
    );

    revalidatePath(`/f/${familiaId}/padre`);
    revalidatePath(`/f/${familiaId}/hijo/objetivo`);
    return { ok: true, mensaje: `Le sumaste $${monto.toLocaleString("es-AR")} al objetivo de ${hijo.nombre}.` };
  });
}

// ---------------------------------------------------------------------------
// Pedidos de plata
// ---------------------------------------------------------------------------

export async function pedirPlata(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarHijo(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaPedido);
    if ("error" in res) return { ok: false, error: res.error };
    const { monto, motivo } = res.data;

    run(
      "INSERT INTO pedidos (familia_id, miembro_id, monto, motivo, estado) VALUES (?,?,?,?, 'pendiente')",
      familiaId,
      actual.id,
      monto,
      motivo
    );

    revalidatePath(`/f/${familiaId}/hijo`);
    return { ok: true, mensaje: "Pedido enviado. Esperando la respuesta." };
  });
}

export async function responderPedido(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarParent(actual, familiaId);
    if (error) return { ok: false, error };

    const res = leer(formData, esquemaRespuestaPedido);
    if ("error" in res) return { ok: false, error: res.error };
    const { pedidoId, accion, monto, motivo } = res.data;

    const pedido = get<{ id: number; familia_id: number; miembro_id: number; monto: number }>(
      "SELECT * FROM pedidos WHERE id = ? AND estado = 'pendiente'",
      pedidoId
    );
    const hijo = pedido ? d.getMiembro(pedido.miembro_id) : null;
    if (!pedido || !hijo || hijo.rol !== "child" || pedido.familia_id !== familiaId)
      return { ok: false, error: "No encontramos ese pedido." };

    if (accion === "aprobar") {
      run("UPDATE pedidos SET estado = 'aprobado', respuesta = 'Aprobado' WHERE id = ?", pedido.id);
      run("UPDATE wallets SET saldo = saldo + ? WHERE miembro_id = ?", pedido.monto, pedido.miembro_id);
      run(
        `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, descripcion, estado)
         VALUES (?,?, 'extra', ?, 'Pedido aprobado', 'aprobado')`,
        familiaId,
        pedido.miembro_id,
        pedido.monto
      );
    } else if (accion === "rechazar") {
      run(
        "UPDATE pedidos SET estado = 'rechazado', respuesta = ? WHERE id = ?",
        motivo || "No por ahora",
        pedido.id
      );
    } else {
      run(
        "UPDATE pedidos SET estado = 'contraoferta', monto_oferta = ?, respuesta = ? WHERE id = ?",
        monto ?? 0,
        motivo || "Te ofrezco otro monto.",
        pedido.id
      );
    }

    revalidatePath(`/f/${familiaId}/padre`);
    revalidatePath(`/f/${familiaId}/hijo`);
    return { ok: true, mensaje: "Pedido respondido." };
  });
}

export async function aceptarContraoferta(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarHijo(actual, familiaId);
    if (error) return { ok: false, error };

    const pedidoId = Number(formData.get("pedidoId"));
    const pedido = get<{ id: number; familia_id: number; miembro_id: number; monto_oferta: number | null }>(
      "SELECT * FROM pedidos WHERE id = ? AND estado = 'contraoferta'",
      pedidoId
    );
    if (!pedido || pedido.familia_id !== familiaId || pedido.miembro_id !== actual.id)
      return { ok: false, error: "No encontramos esa oferta." };
    if (!pedido.monto_oferta) return { ok: false, error: "Esa oferta no tiene monto." };

    run("UPDATE pedidos SET estado = 'aprobado', respuesta = 'Aceptaste la oferta' WHERE id = ?", pedido.id);
    run("UPDATE wallets SET saldo = saldo + ? WHERE miembro_id = ?", pedido.monto_oferta, pedido.miembro_id);
    run(
      `INSERT INTO movimientos (familia_id, miembro_id, tipo, monto, descripcion, estado)
       VALUES (?,?, 'extra', ?, 'Pedido aprobado (oferta)', 'aprobado')`,
      familiaId,
      pedido.miembro_id,
      pedido.monto_oferta
    );

    revalidatePath(`/f/${familiaId}/hijo`);
    revalidatePath(`/f/${familiaId}/padre`);
    return { ok: true, mensaje: "¡Oferta aceptada!" };
  });
}

export async function rechazarContraoferta(
  _prev: EstadoAction,
  formData: FormData
): Promise<EstadoAction> {
  return conTry(async () => {
    const actual = await miembroActual();
    if (actual === null) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };
    const familiaId = Number(formData.get("familiaId"));
    const error = guardarHijo(actual, familiaId);
    if (error) return { ok: false, error };

    const pedidoId = Number(formData.get("pedidoId"));
    const pedido = get<{ id: number; familia_id: number; miembro_id: number }>(
      "SELECT * FROM pedidos WHERE id = ? AND estado = 'contraoferta'",
      pedidoId
    );
    if (!pedido || pedido.familia_id !== familiaId || pedido.miembro_id !== actual.id)
      return { ok: false, error: "No encontramos esa oferta." };

    run("UPDATE pedidos SET estado = 'rechazado', respuesta = 'Rechazaste la oferta' WHERE id = ?", pedido.id);

    revalidatePath(`/f/${familiaId}/hijo`);
    revalidatePath(`/f/${familiaId}/padre`);
    return { ok: true, mensaje: "Oferta rechazada." };
  });
}