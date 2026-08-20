import { Barra } from "@/app/components/Barra";
import {
  FormAporteAdulto,
  FormMesada,
  FormPlataExtra,
  FormPresupuesto,
  NivelSelector,
} from "@/app/components/padre/Acciones";
import { formatearPesos } from "@/lib/dinero";
import { DESCRIPCION_NIVEL, NIVELES, type MiembroRow, type ObjetivoRow } from "@/lib/tipos";

function edad(fecha: string | null): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  const hoy = new Date();
  let a = hoy.getFullYear() - d.getFullYear();
  if (hoy.getMonth() < d.getMonth() || (hoy.getMonth() === d.getMonth() && hoy.getDate() < d.getDate())) a--;
  return a > 0 ? `${a} años` : null;
}

export function HijoCard({
  familiaId,
  hijo,
  resumen,
  objetivos,
  presupuestos,
}: {
  familiaId: number;
  hijo: MiembroRow;
  resumen: { saldo: number; ahorrado: number; reservadoObjetivos: number; disponible: number };
  objetivos: ObjetivoRow[];
  presupuestos: { categoria: string; limite: number; gastado: number }[];
}) {
  const objetivoActivo = objetivos.find((o) => o.ahorrado < o.meta);
  const cumplidos = objetivos.filter((o) => o.ahorrado >= o.meta).length;

  return (
    <article className="tarjeta flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-3xl">
            {hijo.avatar ?? "🙂"}
          </span>
          <div>
            <p className="font-bold leading-tight text-slate-900">{hijo.nombre}</p>
            <p className="text-xs text-slate-500">
              @{hijo.usuario} · {edad(hijo.fecha_nacimiento) ?? "—"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-teal-700">
              Nivel {hijo.nivel} · {NIVELES[hijo.nivel]}
            </p>
          </div>
        </div>
        <p className="text-right">
          <span className="block text-2xl font-bold text-slate-900">{formatearPesos(resumen.disponible)}</span>
          <span className="text-xs text-slate-500">disponible</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-sm font-bold text-slate-800">{formatearPesos(resumen.saldo)}</p>
          <p className="text-[11px] text-slate-500">total asignado</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-sm font-bold text-slate-800">{formatearPesos(resumen.ahorrado + resumen.reservadoObjetivos)}</p>
          <p className="text-[11px] text-slate-500">ahorrado</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-sm font-bold text-slate-800">{objetivos.length}</p>
          <p className="text-[11px] text-slate-500">objetivos{cumplidos ? ` (${cumplidos} ✓)` : ""}</p>
        </div>
      </div>

      {objetivoActivo && (
        <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800">🎯 {objetivoActivo.nombre}</span>
            <span className="text-xs text-slate-500">
              {formatearPesos(objetivoActivo.ahorrado)} / {formatearPesos(objetivoActivo.meta)}
            </span>
          </div>
          <Barra valor={objetivoActivo.ahorrado} max={objetivoActivo.meta} tono="papa" etiqueta={`Progreso de ${objetivoActivo.nombre}`} />
        </div>
      )}

      <NivelSelector familiaId={familiaId} hijoId={hijo.id} actual={hijo.nivel} />
      <p className="-mt-2 text-xs italic text-slate-400">{DESCRIPCION_NIVEL[hijo.nivel]}</p>

      <FormMesada
        familiaId={familiaId}
        hijoId={hijo.id}
        montoActual={hijo.mesada_monto}
        periodoActual={hijo.mesada_periodo}
      />
      <FormPlataExtra familiaId={familiaId} hijoId={hijo.id} nombre={hijo.nombre} />
      <FormAporteAdulto familiaId={familiaId} objetivos={objetivos} />
      <FormPresupuesto familiaId={familiaId} hijoId={hijo.id} actuales={presupuestos} />
    </article>
  );
}