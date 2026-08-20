import { Logo } from "@/app/components/Logo";
import { salirDeLaApp } from "@/app/actions";

export function Cabecera({
  familia,
  usuario,
  modo,
}: {
  familia: string;
  usuario: string;
  modo: "papa" | "hijo";
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Logo tamaño={40} />
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight text-slate-900">
              {familia}
            </p>
            <p className="text-xs text-slate-500">
              {modo === "papa" ? `Modo adulto · ${usuario}` : `Hola, ${usuario}`}
            </p>
          </div>
        </div>
        <form action={salirDeLaApp}>
          <button type="submit" className="boton-secundario">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}