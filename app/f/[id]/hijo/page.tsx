import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecera } from "@/app/components/Cabecera";
import { Barra } from "@/app/components/Barra";
import {
  Contraofertas,
  FormAhorro,
  FormGasto,
  FormPedidoPlata,
} from "@/app/components/hijo/Acciones";
import { obtenerMiembroId } from "@/lib/session";
import * as d from "@/lib/data";
import { formatearPesos, diasHasta } from "@/lib/dinero";
import type { MovimientoRow } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const TIPO_MOVIMIENTO: Record<string, { label: string; icono: string; color: string }> = {
  mesada: { label: "Mesada", icono: "💵", color: "text-emerald-600" },
  extra: { label: "Plata extra", icono: "🎁", color: "text-emerald-600" },
  gasto: { label: "Gasto", icono: "🧾", color: "text-rose-600" },
  ahorro: { label: "Ahorro", icono: "🐷", color: "text-violet-600" },
  aporte_objetivo: { label: "Ahorro a objetivo", icono: "🎯", color: "text-violet-600" },
};

function MovimientoFila({ m }: { m: MovimientoRow }) {
  const meta = TIPO_MOVIMIENTO[m.tipo] ?? { label: m.tipo, icono: "•", color: "text-slate-500" };
  const esIngreso = m.tipo === "mesada" || m.tipo === "extra";
  const signo = esIngreso ? "+" : "−";
  const colorMonto = esIngreso ? "text-emerald-600" : "text-slate-800";
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="text-lg">{meta.icono}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">
            {meta.label}
            {m.categoria ? ` · ${m.categoria}` : ""}
          </p>
          <p className="truncate text-xs text-slate-500">
            {m.descripcion || "—"}
            {m.estado === "pendiente" && <span className="ml-1 font-semibold text-amber-600">(pendiente)</span>}
            {m.estado === "rechazado" && <span className="ml-1 font-semibold text-rose-500">(rechazado)</span>}
          </p>
        </div>
      </div>
      <span className={`shrink-0 text-sm font-bold ${colorMonto}`}>
        {signo}
        {formatearPesos(m.monto)}
      </span>
    </li>
  );
}

export default async function DashboardHijo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const familiaId = Number(id);

  const miembroId = await obtenerMiembroId();
  if (!miembroId) redirect("/login");
  const yo = d.getMiembro(miembroId);
  if (!yo || yo.familia_id !== familiaId) redirect("/login");
  if (yo.rol !== "child") redirect(`/f/${yo.familia_id}/padre`);

  d.procesarMesadasAutomaticas(familiaId);

  const familia = d.getFamilia(familiaId);
  if (!familia) redirect("/login");

  const resumen = d.getWalletResumen(yo.id);
  const objetivos = d.getObjetivos(yo.id);
  const objetivoActivo = objetivos.find((o) => o.ahorrado < o.meta);
  const cumplidos = objetivos.filter((o) => o.ahorrado >= o.meta).length;
  const presupuestos = d.getPresupuestos(yo.id).map((p) => ({
    categoria: p.categoria,
    limite: p.limite_mensual,
    gastado: d.getGastadoCategoriaMes(yo.id, p.categoria),
  }));
  const movimientos = d.getMovimientos(yo.id, 12);
  const pedidos = d.getPedidos(yo.id);
  const dias = objetivoActivo ? diasHasta(objetivoActivo.fecha_deseada) : null;

  const semanal = objetivoActivo && dias && dias > 0
    ? Math.ceil((objetivoActivo.meta - objetivoActivo.ahorrado) / Math.ceil(dias / 7))
    : null;

  return (
    <div className="min-h-screen">
      <Cabecera familia={familia.nombre} usuario={yo.nombre} modo="hijo" />
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
        <section className="tarjeta overflow-hidden border-violet-200 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-violet-100">Tenés disponible</p>
              <p className="mt-1 text-5xl font-bold tracking-tight">{formatearPesos(resumen.disponible)}</p>
              <p className="mt-1 text-xs text-violet-100">
                De {formatearPesos(resumen.saldo)} asignados · ahorrás{" "}
                {formatearPesos(resumen.ahorrado + resumen.reservadoObjetivos)}
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-xl font-bold">{formatearPesos(resumen.saldo)}</p>
                <p className="text-xs text-violet-100">total asignado</p>
              </div>
              <div>
                <p className="text-xl font-bold">{formatearPesos(resumen.ahorrado + resumen.reservadoObjetivos)}</p>
                <p className="text-xs text-violet-100">ahorrado</p>
              </div>
            </div>
          </div>
        </section>

        {objetivoActivo ? (
          <section className="tarjeta">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">🎯 {objetivoActivo.nombre}</h2>
              <Link href={`/f/${familiaId}/hijo/objetivo`} className="text-sm font-semibold text-violet-600 hover:underline">
                Ver objetivos
              </Link>
            </div>
            <p className="mb-3 text-sm text-slate-500">
              {formatearPesos(objetivoActivo.ahorrado)} de {formatearPesos(objetivoActivo.meta)}
              {semanal !== null && ` · necesitás ahorrar ~${formatearPesos(semanal)} por semana`}
              {cumplidos > 0 && ` · ${cumplidos} cumplido${cumplidos > 1 ? "s" : ""} ✓`}
            </p>
            <Barra valor={objetivoActivo.ahorrado} max={objetivoActivo.meta} tono="hijo" etiqueta={`Progreso de ${objetivoActivo.nombre}`} />
          </section>
        ) : (
          <div className="aviso-amarillo">
            Todavía no tenés un objetivo activo.{" "}
            <Link href={`/f/${familiaId}/hijo/objetivo`} className="font-semibold underline">
              Armá uno
            </Link>{" "}
            para ver cuánto te falta.
          </div>
        )}

        <Contraofertas familiaId={familiaId} pedidos={pedidos} />

        <section aria-label="Acciones" className="grid gap-4 md:grid-cols-3">
          <FormGasto familiaId={familiaId} presupuestos={presupuestos} nivel={yo.nivel} />
          <FormAhorro familiaId={familiaId} />
          <FormPedidoPlata familiaId={familiaId} />
        </section>

        <section className="tarjeta">
          <h2 className="mb-2 text-lg font-bold text-slate-900">Movimientos recientes</h2>
          {movimientos.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay movimientos.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {movimientos.map((m) => (
                <MovimientoFila key={m.id} m={m} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}