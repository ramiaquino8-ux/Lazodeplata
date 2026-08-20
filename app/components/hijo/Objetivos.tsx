"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { aportarObjetivo, crearObjetivo } from "@/app/actions";
import { Mensaje } from "@/app/components/Mensaje";
import { formatearPesos } from "@/lib/dinero";
import type { EstadoAction } from "@/lib/tipos";

const estadoIni: EstadoAction = { ok: false };

export function FormObjetivo({ familiaId }: { familiaId: number }) {
  const [estado, formAction, pending] = useActionState(crearObjetivo, estadoIni);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado]);

  return (
    <div className="tarjeta">
      <h2 className="mb-1 text-lg font-bold text-slate-900">Nuevo objetivo</h2>
      <p className="mb-4 text-sm text-slate-500">
        Contanos qué querés juntar y para cuándo: te mostramos cuánto necesitás por semana.
      </p>
      <form ref={ref} action={formAction}>
        <input type="hidden" name="familiaId" value={familiaId} />
        <label className="mb-4 block">
          <span className="etiqueta">¿Qué querés lograr?</span>
          <input className="campo" name="nombre" required maxLength={80} placeholder="Ej: Bicicleta MTB" />
        </label>
        <label className="mb-4 block">
          <span className="etiqueta">Costo total</span>
          <input className="campo" name="meta" type="number" min={1} required placeholder="Ej: 180000" />
        </label>
        <label className="mb-4 block">
          <span className="etiqueta">¿Para cuándo?</span>
          <input className="campo" name="fechaDeseada" type="date" required min={new Date().toISOString().slice(0, 10)} />
        </label>
        <button type="submit" disabled={pending} className="boton-primario w-full">
          {pending ? "Guardando…" : "Crear objetivo"}
        </button>
        <Mensaje estado={estado} />
      </form>
    </div>
  );
}

export function FormAporteObjetivo({
  familiaId,
  objetivos,
}: {
  familiaId: number;
  objetivos: { id: number; nombre: string; meta: number; ahorrado: number }[];
}) {
  const [seleccionado, setSeleccionado] = useState<string>(
    objetivos.length > 0 ? String(objetivos[0].id) : ""
  );
  const [estado, formAction, pending] = useActionState(aportarObjetivo, estadoIni);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado]);
  if (objetivos.length === 0) return null;
  const actual = objetivos.find((o) => o.id === Number(seleccionado));
  const cumplido = Boolean(actual && actual.ahorrado >= actual.meta);

  return (
    <div className="tarjeta">
      <h2 className="mb-1 text-lg font-bold text-slate-900">Aportar a un objetivo</h2>
      <p className="mb-4 text-sm text-slate-500">Mandá plata de tu disponible directo a un objetivo.</p>
      <form ref={ref} action={formAction}>
        <input type="hidden" name="familiaId" value={familiaId} />
        <label className="mb-4 block">
          <span className="etiqueta">Objetivo</span>
          <select
            className="campo"
            name="objetivoId"
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
          >
            {objetivos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre} · {formatearPesos(o.ahorrado)}/{formatearPesos(o.meta)}
              </option>
            ))}
          </select>
        </label>
        {cumplido ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">🎉 ¡Este objetivo ya está cumplido!</p>
        ) : (
          <label className="mb-4 block">
            <span className="etiqueta">Cuánto aportás</span>
            <input className="campo" name="monto" type="number" min={1} required placeholder="Ej: 5000" />
          </label>
        )}
        <button type="submit" className="boton-primario w-full" disabled={cumplido || pending}>
          {pending ? "Aportando…" : "Aportar"}
        </button>
        <Mensaje estado={estado} />
      </form>
    </div>
  );
}