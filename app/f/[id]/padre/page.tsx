import { redirect } from "next/navigation";
import { Cabecera } from "@/app/components/Cabecera";
import { HijoCard } from "@/app/components/padre/HijoCard";
import { AltaHijoForm } from "@/app/components/padre/AltaHijoForm";
import { FilaGastoPendiente, FilaPedido } from "@/app/components/padre/Acciones";
import { obtenerMiembroId } from "@/lib/session";
import * as d from "@/lib/data";
import { formatearPesos } from "@/lib/dinero";

export const dynamic = "force-dynamic";

export default async function DashboardPadre({
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
  if (yo.rol !== "parent") redirect(`/f/${yo.familia_id}/hijo`);

  d.procesarMesadasAutomaticas(familiaId);

  const familia = d.getFamilia(familiaId);
  if (!familia) redirect("/login");

  const hijos = d
    .getMiembrosFamilia(familiaId)
    .filter((m) => m.rol === "child")
    .map((hijo) => ({
      hijo,
      resumen: d.getWalletResumen(hijo.id),
      objetivos: d.getObjetivos(hijo.id),
      presupuestos: d.getPresupuestos(hijo.id).map((p) => ({
        categoria: p.categoria,
        limite: p.limite_mensual,
        gastado: d.getGastadoCategoriaMes(hijo.id, p.categoria),
      })),
    }));

  const totalAsignado = d.getTotalAsignadoFamilia(familiaId);
  const { ahorrado, reservadoObjetivos } = d.getAhorradoFamilia(familiaId);
  const gastadoMes = d.getGastosDelMesFamilia(familiaId);
  const gastosPendientes = d.getMovimientosPendientes(familiaId);
  const pedidos = d.getPedidosPendientesFamilia(familiaId);

  return (
    <div className="min-h-screen">
      <Cabecera familia={familia.nombre} usuario={yo.nombre} modo="papa" />
      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Tu familia</h1>

        <section aria-label="Resumen familiar" className="grid gap-4 sm:grid-cols-3">
          <div className="tarjeta">
            <p className="text-sm text-slate-500">Plata total asignada</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{formatearPesos(totalAsignado)}</p>
          </div>
          <div className="tarjeta">
            <p className="text-sm text-slate-500">Ahorrada por los hijos</p>
            <p className="mt-1 text-3xl font-bold text-teal-600">{formatearPesos(ahorrado + reservadoObjetivos)}</p>
          </div>
          <div className="tarjeta">
            <p className="text-sm text-slate-500">Gastada este mes</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{formatearPesos(gastadoMes)}</p>
          </div>
        </section>

        {hijos.length === 0 ? (
          <div className="aviso-amarillo">Todavía no hay hijos en la familia. Agregá al primero acá abajo.</div>
        ) : (
          <section aria-label="Hijos" className="grid gap-4 md:grid-cols-2">
            {hijos.map(({ hijo, resumen, objetivos, presupuestos }) => (
              <HijoCard
                key={hijo.id}
                familiaId={familiaId}
                hijo={hijo}
                resumen={resumen}
                objetivos={objetivos}
                presupuestos={presupuestos}
              />
            ))}
          </section>
        )}

        {(gastosPendientes.length > 0 || pedidos.length > 0) && (
          <section aria-label="Pendientes de aprobación" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Pendientes de aprobación</h2>
            {gastosPendientes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600">Gastos por aprobar</p>
                <ul className="space-y-2">
                  {gastosPendientes.map((g) => (
                    <FilaGastoPendiente
                      key={g.id}
                      familiaId={familiaId}
                      id={g.id}
                      hijoNombre={g.miembro_nombre}
                      avatar={g.miembro_avatar}
                      monto={g.monto}
                      categoria={g.categoria}
                      descripcion={g.descripcion}
                    />
                  ))}
                </ul>
              </div>
            )}
            {pedidos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600">Pedidos de plata</p>
                <ul className="space-y-2">
                  {pedidos.map((p) => (
                    <FilaPedido
                      key={p.id}
                      familiaId={familiaId}
                      id={p.id}
                      hijoNombre={p.miembro_nombre}
                      avatar={p.miembro_avatar}
                      monto={p.monto}
                      motivo={p.motivo}
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <AltaHijoForm familiaId={familiaId} />
      </main>
    </div>
  );
}