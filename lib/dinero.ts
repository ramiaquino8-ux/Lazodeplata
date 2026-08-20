export function formatearPesos(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

export function diasHasta(fechaDeseada: string | null): number | null {
  if (!fechaDeseada) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const meta = new Date(fechaDeseada + "T00:00:00");
  if (isNaN(meta.getTime())) return null;
  return Math.max(0, Math.round((meta.getTime() - hoy.getTime()) / 86400000));
}