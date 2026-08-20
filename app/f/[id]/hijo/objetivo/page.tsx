import { redirect } from "next/navigation";
import { Cabecera } from "@/app/components/Cabecera";
import { Barra } from "@/app/components/Barra";
import { FormAporteObjetivo, FormObjetivo } from "@/app/components/hijo/Objetivos";
import { obtenerMiembroId } from "@/lib/session";
import * as d from "@/lib/data";
import { formatearPesos, diasHasta } from "@/lib/dinero";

export const dynamic = "force-dynamic";

export default async function ObjetivosPage({
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

  const objetivos = d.getObjetivos(yo.id);
  const activos = objetivos.filter((o) => o.ahorrado < o.meta);
  const cumplidos = objetivos.filter((o) => o.ahorrado >= o.meta);

  return (
    <div className="min-h-screen">
      <Cabecera familia={d.getFamilia(familiaId)?.nombre ?? "Mi familia"} usuario={yo.nombre} modo="hijo" />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Mis objetivos</h1>

        {activos.map((o) => {
          const dias = diasHasta(o.fecha_deseada);
          const semanal =
            dias && dias > 0 ? Math.ceil((o.meta - o.ahorrado) / Math.ceil(dias / 7)) : null;
          return (
            <section key={o.id} className="tarjeta">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">🎯 {o.nombre}</h2>
                  <p className="text-sm text-slate-500">
                    {formatearPesos(o.ahorrado)} de {formatearPesos(o.meta)}
                    {dias !== null && ` · ${dias} día${dias === 1 ? "" : "s"} para la fecha`}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-slate-900">
                  {formatearPesos(o.meta - o.ahorrado)}
                  <span className="block text-right text-xs font-normal text-slate-500">falta</span>
                </p>
              </div>
              <Barra valor={o.ahorrado} max={o.meta} tono="hijo" etiqueta={`Progreso de ${o.nombre}`} />
              {semanal !== null && (
                <p className="mt-2 text-sm text-violet-700">
                  Ahorrando <strong>{formatearPesos(semanal)}</strong> por semana llegás a tiempo.
                </p>
              )}
            </section>
          );
        })}

        {cumplidos.length > 0 && (
          <section aria-label="Objetivos cumplidos">
            <h2 className="mb-2 text-lg font-bold text-slate-900">Cumplidos 🎉</h2>
            <ul className="space-y-2">
              {cumplidos.map((o) => (
                <li key={o.id} className="tarjeta flex items-center justify-between">
                  <p className="font-medium text-slate-800">
                    {o.nombre}
                    <span className="ml-2 text-xs text-emerald-600">
                      {formatearPesos(o.ahorrado)}/{formatearPesos(o.meta)}
                    </span>
                  </p>
                  <span className="text-emerald-600">✓</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <FormObjetivo familiaId={familiaId} />
        <FormAporteObjetivo
          familiaId={familiaId}
          objetivos={activos.map((o) => ({
            id: o.id,
            nombre: o.nombre,
            meta: o.meta,
            ahorrado: o.ahorrado,
          }))}
        />
      </main>
    </div>
  );
}