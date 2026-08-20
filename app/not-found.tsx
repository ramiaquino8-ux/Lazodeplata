import Link from "next/link";
import { Logo } from "@/app/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo tamaño={64} />
      <h1 className="mt-6 text-3xl font-bold text-slate-900">
        Esta página no existe
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Puede que el enlace esté roto o que hayas entrado a una familia que ya
        no existe.
      </p>
      <Link href="/login" className="boton-primario mt-6">
        Volver al inicio
      </Link>
    </main>
  );
}