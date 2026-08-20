"use client";

export function Barra({
  valor,
  max,
  tono = "papa",
  etiqueta,
}: {
  valor: number;
  max: number;
  tono?: "papa" | "hijo";
  etiqueta?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0;
  const color =
    tono === "papa"
      ? "bg-teal-500"
      : pct >= 100
        ? "bg-fuchsia-500"
        : pct >= 80
          ? "bg-amber-500"
          : "bg-violet-500";

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={valor}
      aria-label={etiqueta}
      className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div
        className={`animacion-barra h-full rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}