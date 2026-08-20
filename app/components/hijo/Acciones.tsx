"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  aceptarContraoferta,
  ahorrar,
  pedirPlata,
  rechazarContraoferta,
  registrarGasto,
} from "@/app/actions";
import { Mensaje } from "@/app/components/Mensaje";
import { CATEGORIAS } from "@/lib/validaciones";
import { formatearPesos } from "@/lib/dinero";
import type { EstadoAction, Nivel, PedidoRow } from "@/lib/tipos";

const estadoIni: EstadoAction = { ok: false };

function ConReset({
  action,
  children,
}: {
  action: (prev: EstadoAction, fd: FormData) => Promise<EstadoAction>;
  children: React.ReactNode;
}) {
  const [estado, formAction, pending] = useActionState(action, estadoIni);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado]);
  return (
    <>
      <form ref={ref} action={formAction}>
        {children}
      </form>
      <Mensaje estado={estado} />
    </>
  );
}

export function FormGasto({
  familiaId,
  presupuestos,
  nivel,
}: {
  familiaId: number;
  presupuestos: { categoria: string; limite: number; gastado: number }[];
  nivel: Nivel;
}) {
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [monto, setMonto] = useState("");

  const presu = presupuestos.find((p) => p.categoria === categoria);
  let aviso: string | null = null;
  let pct = 0;
  if (presu && presu.limite > 0) {
    const total = presu.gastado + Number(monto || 0);
    pct = total / presu.limite;
    if (nivel !== 1) {
      if (total >= presu.limite)
        aviso = `Superás el presupuesto de ${categoria} este mes.`;
      else if (total >= presu.limite * 0.8)
        aviso = `Vas por el ${Math.round(pct * 100)}% del presupuesto de ${categoria}.`;
    }
  }

  return (
    <div className="tarjeta">
      <h2 className="mb-1 text-lg font-bold text-slate-900">Registrar un gasto</h2>
      <p className="mb-4 text-sm text-slate-500">
        {nivel === 1
          ? "Estás en modo Supervisado: queda pendiente de aprobación de tu adulto."
          : nivel === 2
            ? "Estás en modo Guiado: si te pasás del presupuesto de la categoría, no te deja."
            : "Modo Autónomo: los presupuestos son solo una guía."}
      </p>
      <ConReset action={registrarGasto}>
        <input type="hidden" name="familiaId" value={familiaId} />
        <label className="mb-4 block">
          <span className="etiqueta">Monto</span>
          <input
            className="campo"
            name="monto"
            type="number"
            min={1}
            required
            placeholder="Ej: 5000"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </label>
        <label className="mb-4 block">
          <span className="etiqueta">Categoría</span>
          <select
            className="campo"
            name="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-4 block">
          <span className="etiqueta">Descripción (opcional)</span>
          <input className="campo" name="descripcion" placeholder="Ej: salida con amigos" maxLength={200} />
        </label>

        {presu && presu.limite > 0 && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Presupuesto de {categoria} este mes</span>
              <span>
                {formatearPesos(presu.gastado + Number(monto || 0))} / {formatearPesos(presu.limite)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`animacion-barra h-full rounded-full ${
                  pct >= 1 ? "bg-rose-500" : pct >= 0.8 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, pct * 100)}%` }}
              />
            </div>
            {aviso && <p className="mt-1 text-xs font-medium text-amber-700">{aviso}</p>}
          </div>
        )}

        <button type="submit" className="boton-primario w-full">
          Registrar gasto
        </button>
      </ConReset>
    </div>
  );
}

export function FormAhorro({ familiaId }: { familiaId: number }) {
  return (
    <div className="tarjeta">
      <h2 className="mb-1 text-lg font-bold text-slate-900">Ahorrar</h2>
      <p className="mb-4 text-sm text-slate-500">
        Mové plata de tu disponible a tu ahorro. No podés sacarla.
      </p>
      <ConReset action={ahorrar}>
        <input type="hidden" name="familiaId" value={familiaId} />
        <label className="mb-3 block">
          <span className="etiqueta">Monto</span>
          <input className="campo" name="monto" type="number" min={1} required placeholder="Ej: 5000" />
        </label>
        <button type="submit" className="boton-primario w-full">
          Ahorrar
        </button>
      </ConReset>
    </div>
  );
}

export function FormPedidoPlata({ familiaId }: { familiaId: number }) {
  return (
    <div className="tarjeta">
      <h2 className="mb-1 text-lg font-bold text-slate-900">Pedir plata</h2>
      <p className="mb-4 text-sm text-slate-500">
        Tu adulto tiene que aprobarlo (o puede ofrecerte otro monto).
      </p>
      <ConReset action={pedirPlata}>
        <input type="hidden" name="familiaId" value={familiaId} />
        <label className="mb-4 block">
          <span className="etiqueta">Monto</span>
          <input className="campo" name="monto" type="number" min={1} required placeholder="Ej: 30000" />
        </label>
        <label className="mb-4 block">
          <span className="etiqueta">¿Para qué?</span>
          <textarea className="campo" name="motivo" rows={2} required maxLength={200} placeholder="Ej: zapatillas para el torneo" />
        </label>
        <button type="submit" className="boton-primario w-full">
          Enviar pedido
        </button>
      </ConReset>
    </div>
  );
}

export function Contraofertas({
  familiaId,
  pedidos,
}: {
  familiaId: number;
  pedidos: PedidoRow[];
}) {
  const ofertas = pedidos.filter((p) => p.estado === "contraoferta");
  if (ofertas.length === 0) return null;
  return (
    <div className="tarjeta border-fuchsia-200 bg-fuchsia-50/50">
      <h2 className="mb-3 text-lg font-bold text-slate-900">Te ofrecieron otro monto</h2>
      <ul className="space-y-3">
        {ofertas.map((p) => (
          <Contraoferta key={p.id} familiaId={familiaId} pedido={p} />
        ))}
      </ul>
    </div>
  );
}

function Contraoferta({ familiaId, pedido }: { familiaId: number; pedido: PedidoRow }) {
  const [estA, formA, penA] = useActionState(aceptarContraoferta, estadoIni);
  const [estR, formR, penR] = useActionState(rechazarContraoferta, estadoIni);
  return (
    <li className="rounded-xl border border-fuchsia-200 bg-white p-3">
      <p className="text-sm text-slate-700">
        Por tu pedido de {formatearPesos(pedido.monto)} ({pedido.motivo}), tu adulto te ofrece{" "}
        <strong className="text-fuchsia-700">{formatearPesos(pedido.monto_oferta ?? 0)}</strong>.
        {pedido.respuesta ? ` Comentario: “${pedido.respuesta}”.` : ""}
      </p>
      <div className="mt-2 flex gap-2">
        <form action={formA}>
          <input type="hidden" name="familiaId" value={familiaId} />
          <input type="hidden" name="pedidoId" value={pedido.id} />
          <button type="submit" disabled={penA} className="boton-aceptar boton-chico">
            Aceptar
          </button>
        </form>
        <form action={formR}>
          <input type="hidden" name="familiaId" value={familiaId} />
          <input type="hidden" name="pedidoId" value={pedido.id} />
          <button type="submit" disabled={penR} className="boton-rechazar boton-chico">
            Rechazar
          </button>
        </form>
      </div>
      <div className="mt-2">
        {estA.mensaje && <Mensaje estado={estA} />}
        {estR.mensaje && <Mensaje estado={estR} />}
      </div>
    </li>
  );
}