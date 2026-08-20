"use client";

import { useActionState, useState } from "react";
import { crearFamilia, entrarFamilia } from "@/app/actions";
import { Logo } from "@/app/components/Logo";
import type { EstadoAction } from "@/lib/tipos";

const estadoInicial: EstadoAction = { ok: false };

export function LoginForm() {
  const [modo, setModo] = useState<"armar" | "entrar">("armar");
  const [estadoArmar, armar, pendienteArmar] = useActionState(crearFamilia, estadoInicial);
  const [estadoEntrar, entrar, pendienteEntrar] = useActionState(entrarFamilia, estadoInicial);

  return (
    <section className="tarjeta w-full max-w-md mx-auto">
      <div className="mb-6 flex items-center gap-3 md:hidden">
        <Logo tamaño={36} />
        <p className="font-bold text-slate-900">LazoDePlata</p>
      </div>

      <div role="tablist" aria-label="Acceso" className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={modo === "armar"}
          onClick={() => setModo("armar")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            modo === "armar" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Armar una familia
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === "entrar"}
          onClick={() => setModo("entrar")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            modo === "entrar" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Entrar
        </button>
      </div>

      {modo === "armar" ? (
        <form action={armar}>
          <h2 className="mb-1 text-lg font-bold text-slate-900">Armar una familia</h2>
          <p className="mb-5 text-sm text-slate-500">
            Te registra como adulto y quedás dentro al toque.
          </p>
          <label className="mb-4 block">
            <span className="etiqueta">Nombre de la familia</span>
            <input className="campo" name="familia" autoComplete="off" placeholder="Ej: Los López" required minLength={2} maxLength={40} />
          </label>
          <label className="mb-4 block">
            <span className="etiqueta">Tu nombre</span>
            <input className="campo" name="nombre" autoComplete="off" placeholder="Ej: Pablo" required maxLength={60} />
          </label>
          <label className="mb-4 block">
            <span className="etiqueta">Tu usuario</span>
            <input className="campo" name="usuario" autoComplete="off" placeholder="Ej: papa" required minLength={2} maxLength={20} />
            <span className="mt-1 block text-xs text-slate-400">Con este usuario vas a poder entrar después.</span>
          </label>
          <label className="mb-5 block">
            <span className="etiqueta">PIN de la familia</span>
            <input className="campo" name="pin" type="password" inputMode="numeric" autoComplete="new-password" placeholder="Ej: 1234" required minLength={4} maxLength={10} pattern="[0-9]*" />
            <span className="mt-1 block text-xs text-slate-400">Lo van a necesitar todos para entrar a la familia.</span>
          </label>
          <button type="submit" disabled={pendienteArmar} className="boton-primario w-full">
            {pendienteArmar ? "Creando…" : "Crear familia"}
          </button>
          <Mensaje estado={estadoArmar} />
        </form>
      ) : (
        <form action={entrar}>
          <h2 className="mb-1 text-lg font-bold text-slate-900">Entrar</h2>
          <p className="mb-5 text-sm text-slate-500">
            Usá el nombre de tu familia y tu usuario.
          </p>
          <label className="mb-4 block">
            <span className="etiqueta">Nombre de la familia</span>
            <input className="campo" name="familia" autoComplete="off" placeholder="Ej: Los López" required />
          </label>
          <label className="mb-4 block">
            <span className="etiqueta">Tu usuario</span>
            <input className="campo" name="usuario" autoComplete="off" placeholder="Ej: santi" required />
          </label>
          <label className="mb-5 block">
            <span className="etiqueta">PIN de la familia</span>
            <input className="campo" name="pin" type="password" inputMode="numeric" autoComplete="current-password" placeholder="Ej: 1234" required minLength={4} maxLength={10} pattern="[0-9]*" />
          </label>
          <button type="submit" disabled={pendienteEntrar} className="boton-primario w-full">
            {pendienteEntrar ? "Entrando…" : "Entrar"}
          </button>
          <Mensaje estado={estadoEntrar} />
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500 md:hidden">
            Probar demo: familia <strong>Los López</strong>, PIN <strong>1234</strong>, usuario{" "}
            <strong>papa</strong> o <strong>santi</strong>.
          </div>
        </form>
      )}
    </section>
  );
}

function Mensaje({ estado }: { estado: EstadoAction }) {
  if (!estado.error) return null;
  return (
    <div role="alert" aria-live="polite" className="aviso-error mt-4">
      {estado.error}
    </div>
  );
}