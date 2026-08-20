"use client";

import type { EstadoAction } from "@/lib/tipos";

export function Mensaje({ estado }: { estado: EstadoAction }) {
  if (estado.error)
    return (
      <div role="alert" aria-live="polite" className="aviso-error mt-3">
        {estado.error}
      </div>
    );
  if (estado.ok && estado.mensaje)
    return (
      <div role="status" aria-live="polite" className="aviso-ok mt-3">
        {estado.mensaje}
      </div>
    );
  return null;
}