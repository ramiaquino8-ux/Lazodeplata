"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  aprobarGasto,
  aportarObjetivoAdulto,
  cambiarNivel,
  configurarMesada,
  configurarPresupuesto,
  mandarMesada,
  mandarPlataExtra,
  rechazarGasto,
  responderPedido,
} from "@/app/actions";
import { Mensaje } from "@/app/components/Mensaje";
import { CATEGORIAS, AVATARES } from "@/lib/validaciones";
import { formatearPesos } from "@/lib/dinero";
import type { EstadoAction, Nivel } from "@/lib/tipos";

const estadoIni: EstadoAction = { ok: false };

export function NivelSelector({
  familiaId,
  hijoId,
  actual,
}: {
  familiaId: number;
  hijoId: number;
  actual: Nivel;
}) {
  const [estado, action, pending] = useActionState(cambiarNivel, estadoIni);
  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="familiaId" value={familiaId} />
      <input type="hidden" name="hijoId" value={hijoId} />
      <label className="etiqueta" htmlFor={`nivel-${hijoId}`}>
        Nivel de autonomía
      </label>
      <div className="flex gap-2">
        <select
          id={`nivel-${hijoId}`}
          name="nivel"
          defaultValue={actual}
          className="campo"
          disabled={pending}
        >
          <option value={1}>1 · Supervisado</option>
          <option value={2}>2 · Guiado</option>
          <option value={3}>3 · Autónomo</option>
        </select>
        <button type="submit" className="boton-secundario shrink-0" disabled={pending}>
          Guardar
        </button>
      </div>
      <Mensaje estado={estado} />
    </form>
  );
}

function ConReset({
  action,
  children,
  className,
}: {
  action: (prev: EstadoAction, fd: FormData) => Promise<EstadoAction>;
  children: React.ReactNode;
  className?: string;
}) {
  const [estado, formAction, pending] = useActionState(action, estadoIni);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado]);
  return (
    <div className={className}>
      <form ref={ref} action={formAction}>
        {children}
      </form>
      <Mensaje estado={estado} />
    </div>
  );
}

export function FormMesada({
  familiaId,
  hijoId,
  montoActual,
  periodoActual,
}: {
  familiaId: number;
  hijoId: number;
  montoActual: number;
  periodoActual: "mensual" | "semanal";
}) {
  return (
    <div className="space-y-3">
      <ConReset
        action={configurarMesada}
        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        <input type="hidden" name="familiaId" value={familiaId} />
        <input type="hidden" name="hijoId" value={hijoId} />
        <p className="mb-2 text-sm font-semibold text-slate-700">Mesada</p>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={`mesada-monto-${hijoId}`}>
            Monto de mesada
          </label>
          <input
            id={`mesada-monto-${hijoId}`}
            className="campo"
            name="monto"
            type="number"
            min={0}
            defaultValue={montoActual}
            placeholder="Monto"
          />
          <label className="sr-only" htmlFor={`mesada-periodo-${hijoId}`}>
            Frecuencia
          </label>
          <select
            id={`mesada-periodo-${hijoId}`}
            className="campo w-32"
            name="periodo"
            defaultValue={periodoActual}
          >
            <option value="mensual">Mensual</option>
            <option value="semanal">Semanal</option>
          </select>
          <button type="submit" className="boton-secundario shrink-0">
            Guardar
          </button>
        </div>
      </ConReset>
      <ConReset action={mandarMesada} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <input type="hidden" name="familiaId" value={familiaId} />
        <input type="hidden" name="hijoId" value={hijoId} />
        <button type="submit" className="boton-primario w-full">
          Mandar mesada ahora
        </button>
        <p className="mt-1 text-xs text-slate-400">
          Deposita {formatearPesos(montoActual)}. La mesada automática también se paga sola al abrir los dashboards.
        </p>
      </ConReset>
    </div>
  );
}

export function FormPlataExtra({
  familiaId,
  hijoId,
  nombre,
}: {
  familiaId: number;
  hijoId: number;
  nombre: string;
}) {
  return (
    <ConReset action={mandarPlataExtra} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="familiaId" value={familiaId} />
      <input type="hidden" name="hijoId" value={hijoId} />
      <label className="etiqueta" htmlFor={`extra-monto-${hijoId}`}>
        Plata extra para {nombre}
      </label>
      <div className="flex gap-2">
        <input
          id={`extra-monto-${hijoId}`}
          className="campo"
          name="monto"
          type="number"
          min={1}
          placeholder="Monto"
          required
        />
        <button type="submit" className="boton-primario shrink-0">
          Mandar
        </button>
      </div>
      <label className="mt-2 block">
        <span className="etiqueta">Motivo</span>
        <input className="campo" name="motivo" placeholder="Ej: cumpleaños" required maxLength={200} />
      </label>
    </ConReset>
  );
}

export function FormPresupuesto({
  familiaId,
  hijoId,
  actuales,
}: {
  familiaId: number;
  hijoId: number;
  actuales: { categoria: string; limite: number; gastado: number }[];
}) {
  return (
    <ConReset action={configurarPresupuesto} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="familiaId" value={familiaId} />
      <input type="hidden" name="hijoId" value={hijoId} />
      <p className="mb-2 text-sm font-semibold text-slate-700">Presupuesto por categoría</p>
      {actuales.map((p) => (
        <div key={p.categoria} className="mb-1 flex items-center justify-between text-sm">
          <span className="text-slate-600">{p.categoria}</span>
          <span className={p.gastado >= p.limite && p.limite > 0 ? "font-semibold text-amber-600" : "text-slate-500"}>
            {formatearPesos(p.gastado)} / {formatearPesos(p.limite)}
          </span>
        </div>
      ))}
      <div className="mt-2 flex gap-2">
        <label className="sr-only" htmlFor={`presu-cat-${hijoId}`}>
          Categoría
        </label>
        <select id={`presu-cat-${hijoId}`} className="campo" name="categoria" defaultValue="Entretenimiento">
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`presu-lim-${hijoId}`}>
          Límite mensual
        </label>
        <input
          id={`presu-lim-${hijoId}`}
          className="campo"
          name="limite"
          type="number"
          min={0}
          placeholder="Límite mensual"
          required
        />
        <button type="submit" className="boton-secundario shrink-0">
          Aplicar
        </button>
      </div>
    </ConReset>
  );
}

export function FilaGastoPendiente({
  familiaId,
  id,
  hijoNombre,
  avatar,
  monto,
  categoria,
  descripcion,
}: {
  familiaId: number;
  id: number;
  hijoNombre: string;
  avatar: string | null;
  monto: number;
  categoria: string | null;
  descripcion: string | null;
}) {
  const [estA, formA, penA] = useActionState(aprobarGasto, estadoIni);
  const [estR, formR, penR] = useActionState(rechazarGasto, estadoIni);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">
          {avatar} {hijoNombre} · {formatearPesos(monto)}
        </p>
        <p className="text-xs text-slate-500">
          {categoria}
          {descripcion ? ` · ${descripcion}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <form action={formA}>
          <input type="hidden" name="familiaId" value={familiaId} />
          <input type="hidden" name="movimientoId" value={id} />
          <button type="submit" disabled={penA} className="boton-aceptar boton-chico">
            Aprobar
          </button>
        </form>
        <form action={formR}>
          <input type="hidden" name="familiaId" value={familiaId} />
          <input type="hidden" name="movimientoId" value={id} />
          <button type="submit" disabled={penR} className="boton-rechazar boton-chico">
            Rechazar
          </button>
        </form>
      </div>
      <div className="basis-full">
        {estA.mensaje && <Mensaje estado={estA} />}
        {estR.mensaje && <Mensaje estado={estR} />}
      </div>
    </li>
  );
}

export function FilaPedido({
  familiaId,
  id,
  hijoNombre,
  avatar,
  monto,
  motivo,
}: {
  familiaId: number;
  id: number;
  hijoNombre: string;
  avatar: string | null;
  monto: number;
  motivo: string;
}) {
  const [estA, formA, penA] = useActionState(responderPedido, estadoIni);
  const [estR, formR, penR] = useActionState(responderPedido, estadoIni);
  const [estC, formC, penC] = useActionState(responderPedido, estadoIni);
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {avatar} {hijoNombre} pide {formatearPesos(monto)}
          </p>
          <p className="text-xs text-slate-500">{motivo}</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={formA}>
            <input type="hidden" name="familiaId" value={familiaId} />
            <input type="hidden" name="pedidoId" value={id} />
            <input type="hidden" name="accion" value="aprobar" />
            <button type="submit" disabled={penA} className="boton-aceptar boton-chico">
              Aprobar
            </button>
          </form>
          <form action={formR}>
            <input type="hidden" name="familiaId" value={familiaId} />
            <input type="hidden" name="pedidoId" value={id} />
            <input type="hidden" name="accion" value="rechazar" />
            <button type="submit" disabled={penR} className="boton-rechazar boton-chico">
              Rechazar
            </button>
          </form>
        </div>
      </div>
      <form action={formC} className="mt-3 flex flex-wrap items-end gap-2">
        <input type="hidden" name="familiaId" value={familiaId} />
        <input type="hidden" name="pedidoId" value={id} />
        <input type="hidden" name="accion" value="contraoferta" />
        <label className="flex-1 basis-32">
          <span className="etiqueta">Ofrecer otro monto</span>
          <input className="campo" name="monto" type="number" min={1} placeholder="Ej: 15000" required />
        </label>
        <label className="flex-[2] basis-40">
          <span className="etiqueta">Comentario (opcional)</span>
          <input className="campo" name="motivo" maxLength={200} placeholder="Ej: te alcanza con esto" />
        </label>
        <button type="submit" disabled={penC} className="boton-secundario">
          Ofrecer
        </button>
        <div className="basis-full">
          {estA.mensaje && <Mensaje estado={estA} />}
          {estR.mensaje && <Mensaje estado={estR} />}
          {estC.mensaje && <Mensaje estado={estC} />}
        </div>
      </form>
    </li>
  );
}

export function FormAporteAdulto({
  familiaId,
  objetivos,
}: {
  familiaId: number;
  objetivos: { id: number; nombre: string; meta: number; ahorrado: number }[];
}) {
  if (objetivos.length === 0) return null;
  return (
    <ConReset action={aportarObjetivoAdulto} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="familiaId" value={familiaId} />
      <p className="mb-2 text-sm font-semibold text-slate-700">Aportar a un objetivo</p>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="aporte-objetivo">Objetivo</label>
        <select id="aporte-objetivo" className="campo" name="objetivoId">
          {objetivos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre} · {formatearPesos(o.ahorrado)}/{formatearPesos(o.meta)}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="aporte-monto">Monto</label>
        <input id="aporte-monto" className="campo" name="monto" type="number" min={1} placeholder="Monto" required />
        <button type="submit" className="boton-primario shrink-0">
          Aportar
        </button>
      </div>
    </ConReset>
  );
}

export { AVATARES };