"use client";

import { useActionState, useEffect, useRef } from "react";
import { agregarHijo } from "@/app/actions";
import { Mensaje } from "@/app/components/Mensaje";
import { AvatarPicker } from "@/app/components/AvatarPicker";
import type { EstadoAction } from "@/lib/tipos";

const estadoIni: EstadoAction = { ok: false };

export function AltaHijoForm({ familiaId }: { familiaId: number }) {
  const [estado, action, pending] = useActionState(agregarHijo, estadoIni);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado]);

  return (
    <div className="tarjeta">
      <h2 className="mb-1 text-lg font-bold text-slate-900">Agregar a un hijo</h2>
      <p className="mb-5 text-sm text-slate-500">
        Crea el usuario con el que tu hijo va a entrar solo, con su propio nombre de familia.
      </p>
      <form ref={ref} action={action}>
        <input type="hidden" name="familiaId" value={familiaId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="etiqueta">Usuario del hijo</span>
            <input className="campo" name="usuario" placeholder="Ej: santi" required minLength={2} maxLength={20} />
          </label>
          <label className="block">
            <span className="etiqueta">Nombre</span>
            <input className="campo" name="nombre" placeholder="Ej: Santiago" required maxLength={60} />
          </label>
          <label className="block">
            <span className="etiqueta">Fecha de nacimiento</span>
            <input className="campo" name="fechaNacimiento" type="date" required />
          </label>
          <label className="block">
            <span className="etiqueta">Mesada (opcional)</span>
            <div className="flex gap-2">
              <input className="campo" name="mesada" type="number" min={0} placeholder="Ej: 20000" />
              <select className="campo w-32" name="periodo" defaultValue="mensual">
                <option value="mensual">Mensual</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
          </label>
        </div>
        <div className="mt-4">
          <span className="etiqueta">Avatar</span>
          <AvatarPicker />
        </div>
        <button type="submit" disabled={pending} className="boton-primario mt-5 w-full">
          {pending ? "Agregando…" : "Agregar a la familia"}
        </button>
        <Mensaje estado={estado} />
      </form>
    </div>
  );
}