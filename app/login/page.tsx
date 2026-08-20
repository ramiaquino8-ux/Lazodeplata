import { redirect } from "next/navigation";
import { obtenerMiembroId } from "@/lib/session";
import { getMiembro } from "@/lib/data";
import { LoginForm } from "@/app/components/LoginForm";
import { Logo } from "@/app/components/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const id = await obtenerMiembroId();
  if (id) {
    const miembro = getMiembro(id);
    if (miembro) {
      redirect(
        miembro.rol === "parent"
          ? `/f/${miembro.familia_id}/padre`
          : `/f/${miembro.familia_id}/hijo`
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo tamaño={44} />
          <div>
            <p className="text-lg font-bold leading-tight text-slate-900">
              LazoDePlata
            </p>
            <p className="text-xs text-slate-500">
              Plata simulada, proyecto educativo.
            </p>
          </div>
        </div>
        <p className="hidden text-xs text-slate-500 sm:block">
          Sin cuentas, sin contraseñas, sin internet.
        </p>
      </header>

      <div className="grid flex-1 items-center gap-10 md:grid-cols-2">
        <section className="hidden md:block">
          <h1 className="mb-4 text-4xl font-bold leading-tight text-slate-900">
            “Te doy plata” se vuelve <span className="text-indigo-600">“te enseño a administrar tu plata”</span>.
          </h1>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start gap-2">
              <span aria-hidden="true">🧭</span>
              <span><strong className="text-slate-800">Supervisado:</strong> cada gasto necesita aprobación.</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">🎯</span>
              <span><strong className="text-slate-800">Guiado:</strong> gasta libre, dentro de límites por categoría.</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">🚀</span>
              <span><strong className="text-slate-800">Autónomo:</strong> administra solo, el adulto mira reportes.</span>
            </li>
          </ul>
          <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
            <p className="font-semibold">¿Querés probar con datos cargados?</p>
            <p className="mt-1">
              Familia <strong>Los López</strong> — entrá con usuario{" "}
              <strong>papa</strong>, <strong>mama</strong>, <strong>santi</strong> o{" "}
              <strong>vale</strong>. Sin contraseña.
            </p>
          </div>
        </section>

        <LoginForm />
      </div>

      <footer className="mt-12 text-center text-xs text-slate-400">
        LazoDePlata es un proyecto educativo de Coderhouse. La plata es simulada:
        no hay dinero real, tarjetas ni cuentas bancarias.
      </footer>
    </main>
  );
}